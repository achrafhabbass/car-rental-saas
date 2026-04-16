import PDFDocument from 'pdfkit';

const PRIMARY = '#1B3A6B';
const INK = '#0F172A';
const MUTED = '#64748B';
const BORDER = '#E2E8F0';
const SUCCESS = '#10B981';
const MARGIN = 56;
const PAGE_W = 595.28;
const CONTENT_W = PAGE_W - MARGIN * 2;

interface ReceiptPdfInput {
  receiptNumber: string;
  issuedAt: Date;
  tenantName: string;
  tenantAddress?: string | null;
  tenantCity?: string | null;
  amount: number;
  currency: string;
  method: string;
  reference?: string | null;
  plan: string;
  period: string;
  invoiceNumber?: string | null;
}

function fmtMoney(n: number, cur: string): string {
  return `${n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${cur}`;
}

function fmtDate(d: Date): string {
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
}

export function buildSubscriptionReceiptPdf(input: ReceiptPdfInput): NodeJS.ReadableStream {
  const doc = new PDFDocument({
    size: 'A4',
    margins: { top: MARGIN, bottom: MARGIN, left: MARGIN, right: MARGIN },
  });

  let y = MARGIN;

  // Header
  doc.rect(0, 0, PAGE_W, 70).fill(PRIMARY);
  doc
    .font('Helvetica-Bold')
    .fontSize(18)
    .fillColor('#FFFFFF')
    .text('AutoSphere', MARGIN, 20, { lineBreak: false, width: 200 });
  doc
    .font('Helvetica')
    .fontSize(9)
    .fillColor('#CBD5E1')
    .text('REÇU DE PAIEMENT', MARGIN, 44, { lineBreak: false });

  doc
    .font('Helvetica-Bold')
    .fontSize(12)
    .fillColor('#FFFFFF')
    .text(`N° ${input.receiptNumber}`, PAGE_W - MARGIN - 200, 22, {
      width: 200,
      align: 'right',
      lineBreak: false,
    });
  doc
    .font('Helvetica')
    .fontSize(9)
    .fillColor('#CBD5E1')
    .text(fmtDate(input.issuedAt), PAGE_W - MARGIN - 200, 40, {
      width: 200,
      align: 'right',
      lineBreak: false,
    });

  y = 90;

  // Status badge
  doc
    .roundedRect(MARGIN, y, 120, 26, 13)
    .fill(SUCCESS);
  doc
    .font('Helvetica-Bold')
    .fontSize(11)
    .fillColor('#FFFFFF')
    .text('PAYÉ', MARGIN + 10, y + 7, { width: 100, align: 'center', lineBreak: false });

  y += 44;

  // Client info
  doc
    .font('Helvetica-Bold')
    .fontSize(8)
    .fillColor(MUTED)
    .text('PAYÉ PAR', MARGIN, y, { lineBreak: false, characterSpacing: 0.5 });
  y += 14;
  doc
    .font('Helvetica-Bold')
    .fontSize(14)
    .fillColor(INK)
    .text(input.tenantName, MARGIN, y, { lineBreak: false });
  y += 20;
  const addr = [input.tenantAddress, input.tenantCity].filter(Boolean).join(', ');
  if (addr) {
    doc.font('Helvetica').fontSize(9).fillColor(MUTED).text(addr, MARGIN, y);
    y += 14;
  }

  y += 16;

  // Divider
  doc.moveTo(MARGIN, y).lineTo(PAGE_W - MARGIN, y).strokeColor(BORDER).lineWidth(1).stroke();
  y += 20;

  // Payment details table
  const rows: Array<[string, string]> = [
    ['Plan', input.plan],
    ['Période', input.period],
    ['Mode de paiement', input.method],
  ];
  if (input.reference) rows.push(['Référence', input.reference]);
  if (input.invoiceNumber) rows.push(['Facture associée', input.invoiceNumber]);

  for (const [label, value] of rows) {
    doc
      .font('Helvetica')
      .fontSize(10)
      .fillColor(MUTED)
      .text(label, MARGIN, y, { width: 180, lineBreak: false });
    doc
      .font('Helvetica')
      .fontSize(10)
      .fillColor(INK)
      .text(value, MARGIN + 190, y, { width: CONTENT_W - 190, lineBreak: false });
    y += 20;
  }

  y += 12;

  // Amount box
  doc
    .roundedRect(MARGIN, y, CONTENT_W, 50, 6)
    .fill(PRIMARY);
  doc
    .font('Helvetica')
    .fontSize(10)
    .fillColor('#CBD5E1')
    .text('MONTANT PAYÉ', MARGIN + 20, y + 10, { lineBreak: false });
  doc
    .font('Helvetica-Bold')
    .fontSize(22)
    .fillColor('#FFFFFF')
    .text(fmtMoney(input.amount, input.currency), PAGE_W - MARGIN - 220, y + 12, {
      width: 200,
      align: 'right',
      lineBreak: false,
    });

  y += 70;

  // Footer note
  doc
    .font('Helvetica')
    .fontSize(8.5)
    .fillColor(MUTED)
    .text(
      'Ce reçu confirme le paiement de votre abonnement AutoSphere. Conservez-le pour vos archives.',
      MARGIN,
      y,
      { width: CONTENT_W, align: 'center' },
    );

  // Bottom footer
  doc
    .font('Helvetica')
    .fontSize(7)
    .fillColor(MUTED)
    .text(
      `AutoSphere — Reçu ${input.receiptNumber} — Généré le ${new Date().toLocaleDateString('fr-FR')}`,
      MARGIN,
      doc.page.height - MARGIN - 10,
      { width: CONTENT_W, align: 'center', lineBreak: false },
    );

  doc.end();
  return doc;
}
