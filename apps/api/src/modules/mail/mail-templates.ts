/**
 * HTML email templates for AutoSphere notifications.
 * Each returns a { subject, html, category } ready for MailService.send().
 */

const BRAND = '#1B3A6B';
const ACCENT = '#2563EB';
const SUCCESS_CLR = '#10B981';
const DANGER = '#EF4444';
const WARNING = '#F59E0B';

function layout(title: string, body: string, accentColor = BRAND): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 16px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
  <tr>
    <td style="background:${accentColor};padding:24px 32px;">
      <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:700;">AutoSphere</h1>
      <p style="margin:4px 0 0;color:rgba(255,255,255,0.7);font-size:12px;text-transform:uppercase;letter-spacing:1px;">
        ${title}
      </p>
    </td>
  </tr>
  <tr>
    <td style="padding:32px;">
      ${body}
    </td>
  </tr>
  <tr>
    <td style="padding:16px 32px;background:#f8fafc;border-top:1px solid #e2e8f0;text-align:center;">
      <p style="margin:0;color:#94a3b8;font-size:11px;">
        Cet email a été envoyé automatiquement par AutoSphere.
        Merci de ne pas y répondre directement.
      </p>
    </td>
  </tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

function kv(label: string, value: string): string {
  return `<tr>
    <td style="padding:6px 0;color:#64748b;font-size:13px;width:160px;vertical-align:top;">${label}</td>
    <td style="padding:6px 0;color:#0f172a;font-size:13px;font-weight:600;">${value}</td>
  </tr>`;
}

function table(rows: string): string {
  return `<table cellpadding="0" cellspacing="0" style="width:100%;margin:16px 0;">${rows}</table>`;
}

function badge(text: string, color: string): string {
  return `<span style="display:inline-block;padding:4px 12px;border-radius:12px;background:${color};color:#fff;font-size:12px;font-weight:600;">${text}</span>`;
}

// ────────────── BUSINESS ──────────────

export function reservationCreated(data: {
  code: string;
  clientName: string;
  vehicle: string;
  startDate: string;
  endDate: string;
  total: string;
}) {
  return {
    subject: `Réservation ${data.code} confirmée`,
    category: 'reservation',
    html: layout(
      'Nouvelle réservation',
      `<p style="color:#0f172a;font-size:15px;margin:0 0 8px;">
        Une nouvelle réservation a été créée.
      </p>
      ${table(
        kv('N° Réservation', data.code) +
        kv('Client', data.clientName) +
        kv('Véhicule', data.vehicle) +
        kv('Début', data.startDate) +
        kv('Fin', data.endDate) +
        kv('Total', data.total),
      )}`,
    ),
  };
}

export function contractCreated(data: {
  number: string;
  clientName: string;
  vehicle: string;
  startDate: string;
  endDate: string;
  total: string;
}) {
  return {
    subject: `Contrat ${data.number} créé`,
    category: 'contract',
    html: layout(
      'Nouveau contrat de location',
      `<p style="color:#0f172a;font-size:15px;margin:0 0 8px;">
        Un nouveau contrat de location a été émis.
      </p>
      ${table(
        kv('N° Contrat', data.number) +
        kv('Client', data.clientName) +
        kv('Véhicule', data.vehicle) +
        kv('Début', data.startDate) +
        kv('Fin', data.endDate) +
        kv('Total', data.total),
      )}`,
    ),
  };
}

export function paymentReceived(data: {
  invoiceNumber: string;
  clientName: string;
  amount: string;
  method: string;
  date: string;
}) {
  return {
    subject: `Paiement reçu — ${data.amount}`,
    category: 'payment',
    html: layout(
      'Paiement reçu',
      `<p style="color:#0f172a;font-size:15px;margin:0 0 8px;">
        Un paiement a été enregistré. ${badge('PAYÉ', SUCCESS_CLR)}
      </p>
      ${table(
        kv('Facture', data.invoiceNumber) +
        kv('Client', data.clientName) +
        kv('Montant', data.amount) +
        kv('Mode', data.method) +
        kv('Date', data.date),
      )}`,
    ),
  };
}

export function maintenanceAlert(data: {
  vehicle: string;
  type: string;
  description: string;
  dueDate: string;
}) {
  return {
    subject: `Alerte maintenance — ${data.vehicle}`,
    category: 'maintenance',
    html: layout(
      'Alerte maintenance',
      `<p style="color:#0f172a;font-size:15px;margin:0 0 8px;">
        ${badge('MAINTENANCE', WARNING)} Une maintenance requiert votre attention.
      </p>
      ${table(
        kv('Véhicule', data.vehicle) +
        kv('Type', data.type) +
        kv('Description', data.description) +
        kv('Échéance', data.dueDate),
      )}`,
      WARNING,
    ),
  };
}

// ────────────── BILLING / SUBSCRIPTION ──────────────

export function invoiceGenerated(data: {
  invoiceNumber: string;
  tenantName: string;
  plan: string;
  amountHt: string;
  totalTtc: string;
  period: string;
}) {
  return {
    subject: `Facture ${data.invoiceNumber} générée`,
    category: 'billing',
    html: layout(
      'Facture d\'abonnement',
      `<p style="color:#0f172a;font-size:15px;margin:0 0 8px;">
        Une nouvelle facture d'abonnement a été générée.
      </p>
      ${table(
        kv('N° Facture', data.invoiceNumber) +
        kv('Entreprise', data.tenantName) +
        kv('Plan', data.plan) +
        kv('Période', data.period) +
        kv('Montant HT', data.amountHt) +
        kv('Total TTC', data.totalTtc),
      )}`,
    ),
  };
}

export function receiptGenerated(data: {
  receiptNumber: string;
  tenantName: string;
  amount: string;
  method: string;
}) {
  return {
    subject: `Reçu ${data.receiptNumber} — ${data.amount}`,
    category: 'billing',
    html: layout(
      'Reçu de paiement',
      `<p style="color:#0f172a;font-size:15px;margin:0 0 8px;">
        ${badge('PAYÉ', SUCCESS_CLR)} Votre paiement a été confirmé.
      </p>
      ${table(
        kv('N° Reçu', data.receiptNumber) +
        kv('Entreprise', data.tenantName) +
        kv('Montant', data.amount) +
        kv('Mode', data.method),
      )}`,
      SUCCESS_CLR,
    ),
  };
}

export function subscriptionExpiring(data: {
  tenantName: string;
  plan: string;
  expiresAt: string;
  daysLeft: number;
}) {
  const color = data.daysLeft <= 3 ? DANGER : WARNING;
  return {
    subject: `Abonnement ${data.tenantName} expire dans ${data.daysLeft} jour(s)`,
    category: 'subscription',
    html: layout(
      'Expiration abonnement',
      `<p style="color:#0f172a;font-size:15px;margin:0 0 8px;">
        ${badge(`${data.daysLeft}j restants`, color)}
      </p>
      ${table(
        kv('Entreprise', data.tenantName) +
        kv('Plan', data.plan) +
        kv('Expire le', data.expiresAt) +
        kv('Jours restants', `<strong style="color:${color};">${data.daysLeft}</strong>`),
      )}
      <p style="color:#64748b;font-size:13px;margin-top:12px;">
        Renouvelez votre abonnement pour éviter toute interruption de service.
      </p>`,
      color,
    ),
  };
}

export function subscriptionExpired(data: {
  tenantName: string;
  plan: string;
  expiredAt: string;
}) {
  return {
    subject: `Abonnement ${data.tenantName} expiré`,
    category: 'subscription',
    html: layout(
      'Abonnement expiré',
      `<p style="color:#0f172a;font-size:15px;margin:0 0 8px;">
        ${badge('EXPIRÉ', DANGER)} L'abonnement a expiré.
      </p>
      ${table(
        kv('Entreprise', data.tenantName) +
        kv('Plan', data.plan) +
        kv('Expiré le', data.expiredAt),
      )}
      <p style="color:#ef4444;font-size:13px;font-weight:600;margin-top:12px;">
        Les utilisateurs ne peuvent plus se connecter. Contactez l'administrateur pour renouveler.
      </p>`,
      DANGER,
    ),
  };
}

export function accountSuspended(data: {
  tenantName: string;
  reason?: string;
}) {
  return {
    subject: `Compte ${data.tenantName} suspendu`,
    category: 'subscription',
    html: layout(
      'Compte suspendu',
      `<p style="color:#0f172a;font-size:15px;margin:0 0 8px;">
        ${badge('SUSPENDU', DANGER)} Le compte a été suspendu.
      </p>
      ${table(
        kv('Entreprise', data.tenantName) +
        kv('Motif', data.reason || 'Non spécifié'),
      )}
      <p style="color:#64748b;font-size:13px;margin-top:12px;">
        L'accès est temporairement bloqué. Contactez le support pour plus d'informations.
      </p>`,
      DANGER,
    ),
  };
}

export function accountReactivated(data: {
  tenantName: string;
  plan: string;
  newEndDate: string;
}) {
  return {
    subject: `Compte ${data.tenantName} réactivé`,
    category: 'subscription',
    html: layout(
      'Compte réactivé',
      `<p style="color:#0f172a;font-size:15px;margin:0 0 8px;">
        ${badge('ACTIF', SUCCESS_CLR)} Le compte a été réactivé avec succès.
      </p>
      ${table(
        kv('Entreprise', data.tenantName) +
        kv('Plan', data.plan) +
        kv('Actif jusqu\'au', data.newEndDate),
      )}
      <p style="color:#10b981;font-size:13px;font-weight:600;margin-top:12px;">
        Tous les utilisateurs peuvent désormais se connecter normalement.
      </p>`,
      SUCCESS_CLR,
    ),
  };
}

// ────────────── SYSTEM ──────────────

export function backupFailed(data: {
  category: string;
  filename: string;
  error: string;
  date: string;
}) {
  return {
    subject: `ALERTE — Backup ${data.category} échoué`,
    category: 'system',
    html: layout(
      'Échec de sauvegarde',
      `<p style="color:#0f172a;font-size:15px;margin:0 0 8px;">
        ${badge('ÉCHEC', DANGER)} Une sauvegarde automatique a échoué.
      </p>
      ${table(
        kv('Catégorie', data.category) +
        kv('Fichier', data.filename) +
        kv('Erreur', `<span style="color:${DANGER};">${data.error}</span>`) +
        kv('Date', data.date),
      )}
      <p style="color:#ef4444;font-size:13px;font-weight:600;margin-top:12px;">
        Action requise : vérifiez la configuration et relancez manuellement la sauvegarde.
      </p>`,
      DANGER,
    ),
  };
}

export function restoreCompleted(data: {
  category: string;
  filename: string;
  date: string;
}) {
  return {
    subject: `Restauration ${data.category} effectuée`,
    category: 'system',
    html: layout(
      'Restauration effectuée',
      `<p style="color:#0f172a;font-size:15px;margin:0 0 8px;">
        ${badge('RESTAURÉ', ACCENT)} Une restauration a été effectuée.
      </p>
      ${table(
        kv('Catégorie', data.category) +
        kv('Fichier source', data.filename) +
        kv('Date', data.date),
      )}`,
      ACCENT,
    ),
  };
}

export function criticalError(data: {
  service: string;
  error: string;
  date: string;
}) {
  return {
    subject: `ERREUR CRITIQUE — ${data.service}`,
    category: 'system',
    html: layout(
      'Erreur critique',
      `<p style="color:#0f172a;font-size:15px;margin:0 0 8px;">
        ${badge('CRITIQUE', DANGER)} Une erreur critique nécessite une intervention immédiate.
      </p>
      ${table(
        kv('Service', data.service) +
        kv('Erreur', `<span style="color:${DANGER};">${data.error}</span>`) +
        kv('Date', data.date),
      )}`,
      DANGER,
    ),
  };
}
