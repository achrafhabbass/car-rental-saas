import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

import { PrismaService } from '../../prisma/prisma.service';

export interface SendMailOptions {
  to: string;
  subject: string;
  html: string;
  category: string;
  tenantId?: string | null;
}

export interface EmailLogEntry {
  id: string;
  to: string;
  subject: string;
  status: string;
  error: string | null;
  category: string;
  tenantId: string | null;
  createdAt: string;
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: Transporter | null = null;
  private readonly enabled: boolean;
  private readonly from: string;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.enabled = config.get<boolean>('mail.enabled', false);
    this.from = config.get<string>('mail.from', 'noreply@autosphere.ma');

    if (this.enabled) {
      this.transporter = nodemailer.createTransport({
        host: config.get<string>('mail.host'),
        port: config.get<number>('mail.port'),
        secure: config.get<number>('mail.port') === 465,
        auth: {
          user: config.get<string>('mail.user'),
          pass: config.get<string>('mail.pass'),
        },
      });
      this.logger.log('Mail transport configured');
    } else {
      this.logger.warn('Mail disabled (MAIL_ENABLED=false). Emails will be logged only.');
    }
  }

  async send(opts: SendMailOptions): Promise<void> {
    if (!this.enabled || !this.transporter) {
      this.logger.debug(`[MAIL-DRY] To: ${opts.to} | Subject: ${opts.subject}`);
      // Still log in dry mode for audit
      void this.log(opts, 'DRY_RUN');
      return;
    }

    try {
      await this.transporter.sendMail({
        from: `AutoSphere <${this.from}>`,
        to: opts.to,
        subject: opts.subject,
        html: opts.html,
      });
      this.logger.log(`Mail sent to ${opts.to}: ${opts.subject}`);
      void this.log(opts, 'SUCCESS');
    } catch (err) {
      const errorMsg = (err as Error).message;
      this.logger.error(`Failed to send mail to ${opts.to}: ${errorMsg}`);
      void this.log(opts, 'FAILED', errorMsg);
    }
  }

  /** Send a test email to verify SMTP configuration. */
  async sendTest(to: string): Promise<{ status: string; message: string }> {
    if (!this.enabled || !this.transporter) {
      return {
        status: 'DRY_RUN',
        message: 'MAIL_ENABLED=false. Email logged but not sent.',
      };
    }

    try {
      await this.transporter.sendMail({
        from: `AutoSphere <${this.from}>`,
        to,
        subject: 'AutoSphere — Test email',
        html: `
          <div style="font-family:sans-serif;padding:24px;">
            <h2 style="color:#1B3A6B;">Test réussi</h2>
            <p>Si vous recevez cet email, la configuration SMTP d'AutoSphere fonctionne correctement.</p>
            <p style="color:#64748B;font-size:12px;">Envoyé le ${new Date().toLocaleString('fr-FR')}</p>
          </div>
        `,
      });
      void this.log(
        { to, subject: 'Test email', category: 'test', tenantId: null },
        'SUCCESS',
      );
      return { status: 'SUCCESS', message: `Email de test envoyé à ${to}` };
    } catch (err) {
      const msg = (err as Error).message;
      void this.log(
        { to, subject: 'Test email', category: 'test', tenantId: null },
        'FAILED',
        msg,
      );
      return { status: 'FAILED', message: msg };
    }
  }

  /** Get email logs for monitoring. */
  async getLogs(limit = 50): Promise<EmailLogEntry[]> {
    const rows = await this.prisma.emailLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    return rows.map((r) => ({
      id: r.id,
      to: r.to,
      subject: r.subject,
      status: r.status,
      error: r.error,
      category: r.category,
      tenantId: r.tenantId,
      createdAt: r.createdAt.toISOString(),
    }));
  }

  /** Email stats for dashboard. */
  async getStats(): Promise<{
    total: number;
    success: number;
    failed: number;
    dryRun: number;
    last24h: number;
  }> {
    const [total, success, failed, dryRun, last24h] = await Promise.all([
      this.prisma.emailLog.count(),
      this.prisma.emailLog.count({ where: { status: 'SUCCESS' } }),
      this.prisma.emailLog.count({ where: { status: 'FAILED' } }),
      this.prisma.emailLog.count({ where: { status: 'DRY_RUN' } }),
      this.prisma.emailLog.count({
        where: { createdAt: { gte: new Date(Date.now() - 86400000) } },
      }),
    ]);
    return { total, success, failed, dryRun, last24h };
  }

  private async log(
    opts: Pick<SendMailOptions, 'to' | 'subject' | 'category' | 'tenantId'>,
    status: string,
    error?: string,
  ): Promise<void> {
    try {
      await this.prisma.emailLog.create({
        data: {
          to: opts.to,
          subject: opts.subject,
          status,
          error: error ?? null,
          category: opts.category,
          tenantId: opts.tenantId ?? null,
        },
      });
    } catch (err) {
      this.logger.error(`Failed to log email: ${(err as Error).message}`);
    }
  }
}
