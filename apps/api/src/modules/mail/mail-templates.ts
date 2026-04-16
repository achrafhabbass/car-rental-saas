/**
 * HTML email templates for AutoSphere notifications.
 * Each returns a { subject, html } ready to pass to MailService.send().
 */

const BRAND = '#1B3A6B';
const ACCENT = '#2563EB';

function layout(title: string, body: string): string {
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
    <td style="background:${BRAND};padding:24px 32px;">
      <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:700;">AutoSphere</h1>
      <p style="margin:4px 0 0;color:#cbd5e1;font-size:12px;text-transform:uppercase;letter-spacing:1px;">
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

function btn(text: string, href = '#'): string {
  return `<a href="${href}" style="display:inline-block;margin-top:16px;padding:10px 24px;background:${ACCENT};color:#fff;font-size:13px;font-weight:600;text-decoration:none;border-radius:6px;">${text}</a>`;
}

// ──────────────────── Templates ────────────────────

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
    html: layout(
      'Nouvelle réservation',
      `<p style="color:#0f172a;font-size:15px;margin:0 0 8px;">
        Bonjour, une nouvelle réservation a été créée.
      </p>
      ${table(
        kv('N° Réservation', data.code) +
          kv('Client', data.clientName) +
          kv('Véhicule', data.vehicle) +
          kv('Début', data.startDate) +
          kv('Fin', data.endDate) +
          kv('Total', data.total),
      )}
      ${btn('Voir la réservation')}`,
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
      )}
      ${btn('Voir le contrat')}`,
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
    html: layout(
      'Paiement reçu',
      `<p style="color:#0f172a;font-size:15px;margin:0 0 8px;">
        Un paiement a été enregistré.
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
    html: layout(
      'Alerte maintenance',
      `<p style="color:#0f172a;font-size:15px;margin:0 0 8px;">
        Une maintenance requiert votre attention.
      </p>
      ${table(
        kv('Véhicule', data.vehicle) +
          kv('Type', data.type) +
          kv('Description', data.description) +
          kv('Échéance', data.dueDate),
      )}
      <p style="color:#ef4444;font-size:13px;margin-top:12px;font-weight:600;">
        Action requise : planifier cette intervention rapidement.
      </p>`,
    ),
  };
}

export function subscriptionExpiring(data: {
  tenantName: string;
  plan: string;
  expiresAt: string;
  daysLeft: number;
}) {
  const urgencyColor = data.daysLeft <= 3 ? '#ef4444' : data.daysLeft <= 7 ? '#f59e0b' : '#64748b';
  return {
    subject: `Abonnement ${data.tenantName} expire dans ${data.daysLeft} jour(s)`,
    html: layout(
      'Expiration abonnement',
      `<p style="color:#0f172a;font-size:15px;margin:0 0 8px;">
        L'abonnement de votre entreprise arrive à expiration.
      </p>
      ${table(
        kv('Entreprise', data.tenantName) +
          kv('Plan', data.plan) +
          kv('Expire le', data.expiresAt) +
          kv('Jours restants', `<span style="color:${urgencyColor};font-weight:700;">${data.daysLeft}</span>`),
      )}
      <p style="color:#64748b;font-size:13px;margin-top:12px;">
        Contactez votre administrateur pour renouveler votre abonnement
        et éviter toute interruption de service.
      </p>`,
    ),
  };
}
