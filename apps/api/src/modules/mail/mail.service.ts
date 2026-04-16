import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

export interface SendMailOptions {
  to: string;
  subject: string;
  html: string;
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: Transporter | null = null;
  private readonly enabled: boolean;
  private readonly from: string;

  constructor(private readonly config: ConfigService) {
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
    } catch (err) {
      this.logger.error(`Failed to send mail to ${opts.to}: ${(err as Error).message}`);
      // Never throw — email failure should not break business flows.
    }
  }
}
