import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import type { DemoRequest, LeadStatus } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import type { CreateDemoRequestDto } from './dto/create-demo-request.dto';

@Injectable()
export class LeadsService {
  private readonly logger = new Logger(LeadsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
  ) {}

  async create(dto: CreateDemoRequestDto): Promise<DemoRequest> {
    const lead = await this.prisma.demoRequest.create({
      data: {
        fullName: dto.fullName,
        email: dto.email,
        phone: dto.phone,
        companyName: dto.companyName,
        preferredDate: dto.preferredDate ? new Date(dto.preferredDate) : null,
        message: dto.message,
      },
    });

    // Email confirmation to the lead
    void this.mail.send({
      to: dto.email,
      subject: 'AutoSphere — Demande de démo reçue',
      category: 'lead',
      html: this.confirmationEmail(dto),
    });

    // Notify admin
    void this.notifyAdmin(lead);

    this.logger.log(`New demo request from ${dto.email} (${dto.companyName ?? 'N/A'})`);
    return lead;
  }

  async list(status?: string): Promise<DemoRequest[]> {
    return this.prisma.demoRequest.findMany({
      where: status ? { status: status as LeadStatus } : {},
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async updateStatus(id: string, status: LeadStatus, notes?: string): Promise<DemoRequest> {
    const lead = await this.prisma.demoRequest.findUnique({ where: { id } });
    if (!lead) throw new NotFoundException('Lead not found');
    return this.prisma.demoRequest.update({
      where: { id },
      data: { status, ...(notes ? { notes } : {}) },
    });
  }

  async getStats(): Promise<{ total: number; byStatus: Record<string, number> }> {
    const [total, grouped] = await Promise.all([
      this.prisma.demoRequest.count(),
      this.prisma.demoRequest.groupBy({
        by: ['status'],
        _count: { _all: true },
      }),
    ]);
    const byStatus: Record<string, number> = {};
    for (const g of grouped) {
      byStatus[g.status] = g._count._all;
    }
    return { total, byStatus };
  }

  private confirmationEmail(dto: CreateDemoRequestDto): string {
    return `<!DOCTYPE html>
<html><body style="margin:0;padding:0;background:#f1f5f9;font-family:sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;">
<tr><td align="center">
<table width="600" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.08);">
  <tr><td style="background:#1B3A6B;padding:24px 32px;">
    <h1 style="margin:0;color:#fff;font-size:20px;">AutoSphere</h1>
    <p style="margin:4px 0 0;color:#cbd5e1;font-size:12px;">DEMANDE DE DÉMONSTRATION</p>
  </td></tr>
  <tr><td style="padding:32px;">
    <p style="font-size:15px;color:#0f172a;">Bonjour ${dto.fullName},</p>
    <p style="color:#64748b;font-size:14px;line-height:1.6;">
      Merci pour votre intérêt pour AutoSphere ! Nous avons bien reçu votre demande de démonstration.
      Un membre de notre équipe vous contactera sous 24h pour planifier votre session.
    </p>
    ${dto.preferredDate ? `<p style="color:#64748b;font-size:13px;">Date souhaitée : <strong>${new Date(dto.preferredDate).toLocaleDateString('fr-FR')}</strong></p>` : ''}
    <p style="color:#64748b;font-size:13px;margin-top:24px;">
      En attendant, n'hésitez pas à nous contacter à <a href="mailto:contact@autosphere.ma" style="color:#2563EB;">contact@autosphere.ma</a>
    </p>
  </td></tr>
  <tr><td style="padding:16px 32px;background:#f8fafc;border-top:1px solid #e2e8f0;text-align:center;">
    <p style="margin:0;color:#94a3b8;font-size:11px;">© AutoSphere · Plateforme SaaS de gestion de location</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>`;
  }

  private async notifyAdmin(lead: DemoRequest): Promise<void> {
    const admin = await this.prisma.user.findFirst({
      where: { role: 'SUPER_ADMIN', status: 'ACTIVE', deletedAt: null },
      select: { email: true },
    });
    if (!admin?.email) return;

    void this.mail.send({
      to: admin.email,
      subject: `Nouveau lead — ${lead.fullName} (${lead.companyName ?? 'N/A'})`,
      category: 'lead',
      html: `<div style="font-family:sans-serif;padding:24px;">
        <h2 style="color:#1B3A6B;">Nouvelle demande de démo</h2>
        <table style="font-size:14px;color:#0f172a;">
          <tr><td style="padding:4px 12px 4px 0;color:#64748b;">Nom</td><td><strong>${lead.fullName}</strong></td></tr>
          <tr><td style="padding:4px 12px 4px 0;color:#64748b;">Email</td><td>${lead.email}</td></tr>
          <tr><td style="padding:4px 12px 4px 0;color:#64748b;">Téléphone</td><td>${lead.phone ?? '—'}</td></tr>
          <tr><td style="padding:4px 12px 4px 0;color:#64748b;">Société</td><td>${lead.companyName ?? '—'}</td></tr>
          <tr><td style="padding:4px 12px 4px 0;color:#64748b;">Date souhaitée</td><td>${lead.preferredDate?.toLocaleDateString('fr-FR') ?? '—'}</td></tr>
          <tr><td style="padding:4px 12px 4px 0;color:#64748b;">Message</td><td>${lead.message ?? '—'}</td></tr>
        </table>
      </div>`,
    });
  }
}
