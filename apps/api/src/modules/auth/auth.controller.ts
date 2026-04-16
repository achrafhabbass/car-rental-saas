import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Patch,
  Post,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';

import { AllowNoTenant } from '../../common/decorators/allow-no-tenant.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { TenantsService } from '../tenants/tenants.service';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';
import { toAuthProfile, type AuthProfileDto } from './dto/auth-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterDto } from './dto/register.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import type { JwtPayload } from './interfaces/jwt-payload.interface';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
    private readonly tenantsService: TenantsService,
  ) {}

  @Public()
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Public()
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Public()
  @Throttle({ default: { ttl: 60_000, limit: 30 } })
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refresh(dto.refreshToken);
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@CurrentUser() user: JwtPayload): Promise<void> {
    await this.authService.logout(user.sub);
  }

  @AllowNoTenant()
  @Get('me')
  async me(@CurrentUser() user: JwtPayload): Promise<AuthProfileDto> {
    const full = await this.usersService.findById(user.sub);
    if (!full) throw new NotFoundException('User not found');
    const tenant = full.tenantId ? await this.tenantsService.findById(full.tenantId) : null;
    return toAuthProfile(full, tenant);
  }

  @AllowNoTenant()
  @Patch('me')
  async updateMe(
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateProfileDto,
  ): Promise<AuthProfileDto> {
    const updated = await this.usersService.updateProfile(user.sub, dto);
    const tenant = updated.tenantId
      ? await this.tenantsService.findById(updated.tenantId)
      : null;
    return toAuthProfile(updated, tenant);
  }

  @AllowNoTenant()
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  @Post('change-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  async changePassword(
    @CurrentUser() user: JwtPayload,
    @Body() dto: ChangePasswordDto,
  ): Promise<void> {
    await this.usersService.changePassword(
      user.sub,
      dto.currentPassword,
      dto.newPassword,
    );
    await this.authService.logout(user.sub);
  }
}
