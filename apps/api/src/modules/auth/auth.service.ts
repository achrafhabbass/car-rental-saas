import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Prisma, TenantStatus, UserRole, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { createHash, randomUUID } from 'crypto';

import { PrismaService } from '../../prisma/prisma.service';
import { TenantsService } from '../tenants/tenants.service';
import { UsersService } from '../users/users.service';
import { AuthRepository } from './auth.repository';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import type {
  AuthTokens,
  JwtPayload,
  JwtRefreshPayload,
} from './interfaces/jwt-payload.interface';

const BCRYPT_ROUNDS = 12;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly authRepo: AuthRepository,
    private readonly usersService: UsersService,
    private readonly tenantsService: TenantsService,
  ) {}

  /// Register a new tenant and its OWNER user atomically.
  async register(dto: RegisterDto): Promise<AuthTokens & { userId: string; tenantId: string }> {
    const existingSlug = await this.tenantsService.findBySlug(dto.companySlug);
    if (existingSlug) {
      throw new ConflictException('Company slug already taken');
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

    try {
      const result = await this.prisma.$transaction(async (tx) => {
        const tenant = await tx.tenant.create({
          data: {
            name: dto.companyName,
            slug: dto.companySlug,
            status: TenantStatus.TRIAL,
            trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          },
        });

        const user = await tx.user.create({
          data: {
            tenantId: tenant.id,
            email: dto.email.toLowerCase(),
            passwordHash,
            firstName: dto.firstName,
            lastName: dto.lastName,
            role: UserRole.OWNER,
            status: UserStatus.ACTIVE,
          },
        });

        return { tenant, user };
      });

      const tokens = await this.issueTokens({
        sub: result.user.id,
        email: result.user.email,
        tenantId: result.tenant.id,
        role: result.user.role,
      });

      return { ...tokens, userId: result.user.id, tenantId: result.tenant.id };
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new ConflictException('Email or slug already in use');
      }
      throw err;
    }
  }

  async login(dto: LoginDto): Promise<AuthTokens & { userId: string; tenantId: string | null }> {
    const user = await this.usersService.findByEmail(dto.email.toLowerCase(), dto.tenantId);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Account is not active');
    }

    const passwordOk = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordOk) {
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.usersService.markLoggedIn(user.id);

    const tokens = await this.issueTokens({
      sub: user.id,
      email: user.email,
      tenantId: user.tenantId,
      role: user.role,
    });

    return { ...tokens, userId: user.id, tenantId: user.tenantId };
  }

  /// Rotate refresh token: invalidate the incoming one, issue a new pair.
  async refresh(rawToken: string): Promise<AuthTokens> {
    const secret = this.config.getOrThrow<string>('jwt.refreshSecret');

    let payload: JwtRefreshPayload;
    try {
      payload = this.jwtService.verify<JwtRefreshPayload>(rawToken, { secret });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const tokenHash = this.hashToken(rawToken);
    const stored = await this.authRepo.findActiveRefreshTokenByHash(tokenHash);
    if (!stored) {
      // Potential token reuse — revoke all for safety.
      await this.authRepo.revokeAllForUser(payload.sub);
      throw new UnauthorizedException('Refresh token has been revoked');
    }

    const user = await this.usersService.findById(payload.sub);
    if (!user || user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('User is not active');
    }

    const newTokens = await this.issueTokens({
      sub: user.id,
      email: user.email,
      tenantId: user.tenantId,
      role: user.role,
    });

    const newHash = this.hashToken(newTokens.refreshToken);
    const newStored = await this.authRepo.createRefreshToken({
      userId: user.id,
      tenantId: user.tenantId,
      tokenHash: newHash,
      expiresAt: this.computeRefreshExpiry(),
    });

    await this.authRepo.revokeRefreshToken(stored.id, newStored.id);

    return newTokens;
  }

  async logout(userId: string): Promise<void> {
    await this.authRepo.revokeAllForUser(userId);
  }

  // -------- internals --------

  private async issueTokens(input: {
    sub: string;
    email: string;
    tenantId: string | null;
    role: UserRole;
  }): Promise<AuthTokens> {
    const accessExpiration = this.config.getOrThrow<string>('jwt.accessExpiration');
    const refreshExpiration = this.config.getOrThrow<string>('jwt.refreshExpiration');

    const accessPayload: JwtPayload = {
      sub: input.sub,
      email: input.email,
      tenantId: input.tenantId,
      role: input.role,
    };

    const jti = randomUUID();
    const refreshPayload: JwtRefreshPayload = {
      sub: input.sub,
      jti,
      tenantId: input.tenantId,
    };

    const accessToken = await this.jwtService.signAsync(accessPayload, {
      secret: this.config.getOrThrow<string>('jwt.accessSecret'),
      expiresIn: accessExpiration,
    });

    const refreshToken = await this.jwtService.signAsync(refreshPayload, {
      secret: this.config.getOrThrow<string>('jwt.refreshSecret'),
      expiresIn: refreshExpiration,
    });

    await this.authRepo.createRefreshToken({
      userId: input.sub,
      tenantId: input.tenantId,
      tokenHash: this.hashToken(refreshToken),
      expiresAt: this.computeRefreshExpiry(),
    });

    return {
      accessToken,
      refreshToken,
      accessTokenExpiresIn: accessExpiration,
      refreshTokenExpiresIn: refreshExpiration,
    };
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private computeRefreshExpiry(): Date {
    const raw = this.config.getOrThrow<string>('jwt.refreshExpiration');
    const ms = this.parseDurationMs(raw);
    return new Date(Date.now() + ms);
  }

  /// Minimal duration parser for JWT-style durations (e.g., 15m, 7d, 12h, 30s).
  private parseDurationMs(input: string): number {
    const match = input.match(/^(\d+)\s*(ms|s|m|h|d)$/i);
    if (!match) throw new BadRequestException(`Invalid duration: ${input}`);
    const value = parseInt(match[1], 10);
    const unit = match[2].toLowerCase();
    const multipliers: Record<string, number> = {
      ms: 1,
      s: 1000,
      m: 60_000,
      h: 3_600_000,
      d: 86_400_000,
    };
    return value * multipliers[unit];
  }
}
