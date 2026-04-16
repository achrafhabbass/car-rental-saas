import PDFDocument from 'pdfkit';

const PRIMARY = '#1B3A6B';
const INK = '#0F172A';
const MUTED = '#64748B';
const BORDER = '#E2E8F0';
const SOFT = '#F8FAFC';
const MARGIN = 48;
const PAGE_W = 595.28;
const CONTENT_W = PAGE_W - MARGIN * 2;

interface InvoicePdfInput {
  invoiceNumber: string;
  issuedAt: Date;
  // Issuer (AutoSphere platform or tenant)
  issuer: {
    name: string;
    address?: string | null;
    city?: string | null;
    phone?: string | null;
    email?: string | null;
    ice?: string | null;
    rc?: string | null;
    taxId?: string | null;
  };
  // Client (the tenant buying the subscription)
  client: {
    name: string;
    address?: string | null;
    city?: string | null;
    ice?: string | null;
    rc?: string | null;
  };
  // Line items
  plan: string;
  period: string;
  startDate: string;
  endDate: string;
  amountHt: number;
  taxRate: number;
  taxAmount: number;
  totalTtc: number;
  currency: string;
  method: string;
  reference?: string | null;
}

function fmtMoney(n: number, cur: string): string {
  return `${n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${cur}`;
}

function fmtDate(d: Date | string): string {
  const dt = typeof d === 'string' ? new Date(d) : d;
  return dt.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
}

export function buildSubscriptionInvoicePdf(input: InvoicePdfInput): NodeJS.ReadableStream {
  const doc = new PDFDocument({
    size: 'A4',
    margins: { top: MARGIN, bottom: MARGIN + 20, left: MARGIN, right: MARGIN },
    bufferPages: true,
  });

  let y = MARGIN;

  // ─── Header: issuer info left, FACTURE right ───
  doc
    .font('Helvetica-Bold')
    .fontSize(18)
    .fillColor(PRIMARY)
    .text(input.issuer.name, MARGIN, y, { width: CONTENT_W / 2, lineBreak: false });

  doc
    .font('Helvetica')
    .fontSize(9)
    .fillColor(MUTED);
  y += 24;
  const issuerLines: string[] = [];
  const addr = [input.issuer.address, input.issuer.city].filter(Boolean).join(', ');
  if (addr) issuerLines.push(addr);
  if (input.issuer.phone) issuerLines.push(`Tél. ${input.issuer.phone}`);
  if (input.issuer.email) issuerLines.push(input.issuer.email);
  if (input.issuer.ice) issuerLines.push(`ICE : ${input.issuer.ice}`);
  if (input.issuer.rc) issuerLines.push(`RC : ${input.issuer.rc}`);
  if (input.issuer.taxId) issuerLines.push(`IF : ${input.issuer.taxId}`);

  for (const line of issuerLines) {
    doc.text(line, MARGIN, y, { width: CONTENT_W / 2 });
    y += 12;
  }

  // Right side: FACTURE label + number + date
  const rightX = MARGIN + CONTENT_W / 2 + 20;
  const rightW = CONTENT_W / 2 - 20;

  doc
    .font('Helvetica-Bold')
    .fontSize(28)
    .fillColor(PRIMARY)
    .text('FACTURE', rightX, MARGIN, { width: rightW, align: 'right', lineBreak: false });

  doc
    .font('Helvetica')
    .fontSize(10)
    .fillColor(INK)
    .text(`N° ${input.invoiceNumber}`, rightX, MARGIN + 34, { width: rightW, align: 'right', lineBreak: false })
    .text(`Date : ${fmtDate(input.issuedAt)}`, rightX, MARGIN + 50, { width: rightW, align: 'right', lineBreak: false });

  y = Math.max(y, MARGIN + 70) + 16;

  // ─── Divider ───
  doc.moveTo(MARGIN, y).lineTo(PAGE_W - MARGIN, y).strokeColor(PRIMARY).lineWidth(2).stroke();
  y += 16;

  // ─── Client block ───
  doc
    .roundedRect(MARGIN, y, CONTENT_W, 70, 4)
    .fillColor(SOFT)
    .fill();

  doc
    .font('Helvetica-Bold')
    .fontSize(8)
    .fillColor(MUTED)
    .text('FACTURÉ À', MARGIN + 14, y + 10, { lineBreak: false });

  doc
    .font('Helvetica-Bold')
    .fontSize(12)
    .fillColor(INK)
    .text(input.client.name, MARGIN + 14, y + 24, { lineBreak: false });

  const clientAddr = [input.client.address, input.client.city].filter(Boolean).join(', ');
  if (clientAddr) {
    doc
      .font('Helvetica')
      .fontSize(9)
      .fillColor(MUTED)
      .text(clientAddr, MARGIN + 14, y + 40, { lineBreak: false });
  }

  const clientIds: string[] = [];
  if (input.client.ice) clientIds.push(`ICE : ${input.client.ice}`);
  if (input.client.rc) clientIds.push(`RC : ${input.client.rc}`);
  if (clientIds.length > 0) {
    doc
      .font('Helvetica')
      .fontSize(8)
      .fillColor(MUTED)
      .text(clientIds.join('   ·   '), MARGIN + 14, y + 54, { lineBreak: false });
  }

  y += 86;

  // ─── Items table ───
  const colWidths = [CONTENT_W * 0.45, CONTENT_W * 0.15, CONTENT_W * 0.2, CONTENT_W * 0.2];
  const headers = ['Désignation', 'Période', 'Prix HT', 'Montant HT'];

  // Table header
  doc.rect(MARGIN, y, CONTENT_W, 28).fill(PRIMARY);
  let x = MARGIN;
  headers.forEach((h, i) => {
    doc
      .font('Helvetica-Bold')
      .fontSize(9)
      .fillColor('#FFFFFF')
      .text(h, x + 8, y + 9, {
        width: colWidths[i] - 16,
        align: i >= 2 ? 'right' : 'left',
        lineBreak: false,
      });
    x += colWidths[i];
  });
  y += 28;

  // Single row
  const rowH = 32;
  doc.rect(MARGIN, y, CONTENT_W, rowH).fill('#FFFFFF');
  doc
    .moveTo(MARGIN, y + rowH)
    .lineTo(PAGE_W - MARGIN, y + rowH)
    .strokeColor(BORDER)
    .lineWidth(0.5)
    .stroke();

  x = MARGIN;
  const designation = `Abonnement ${input.plan}\nDu ${input.startDate} au ${input.endDate}`;
  doc
    .font('Helvetica')
    .fontSize(9)
    .fillColor(INK)
    .text(designation, x + 8, y + 6, { width: colWidths[0] - 16, lineGap: 2 });

  doc.text(input.period, x + colWidths[0] + 8, y + 10, {
    width: colWidths[1] - 16,
    lineBreak: false,
  });

  doc.text(fmtMoney(input.amountHt, input.currency), x + colWidths[0] + colWidths[1] + 8, y + 10, {
    width: colWidths[2] - 16,
    align: 'right',
    lineBreak: false,
  });

  doc
    .font('Helvetica-Bold')
    .text(fmtMoney(input.amountHt, input.currency), x + colWidths[0] + colWidths[1] + colWidths[2] + 8, y + 10, {
      width: colWidths[3] - 16,
      align: 'right',
      lineBreak: false,
    });

  y += rowH + 16;

  // ─── Totals ───
  const totalsX = MARGIN + CONTENT_W * 0.55;
  const totalsW = CONTENT_W * 0.45;
  const lineH = 22;

  const totals = [
    { label: 'Sous-total HT', value: fmtMoney(input.amountHt, input.currency), bold: false },
    { label: `TVA (${(input.taxRate * 100).toFixed(0)}%)`, value: fmtMoney(input.taxAmount, input.currency), bold: false },
    { label: 'Total TTC', value: fmtMoney(input.totalTtc, input.currency), bold: true },
  ];

  totals.forEach((t, i) => {
    if (i === totals.length - 1) {
      doc.rect(totalsX, y, totalsW, lineH).fill(PRIMARY);
      doc
        .font('Helvetica-Bold')
        .fontSize(11)
        .fillColor('#FFFFFF')
        .text(t.label, totalsX + 10, y + 5, { width: totalsW / 2 - 10, lineBreak: false })
        .text(t.value, totalsX + totalsW / 2, y + 5, { width: totalsW / 2 - 10, align: 'right', lineBreak: false });
    } else {
      doc
        .moveTo(totalsX, y + lineH)
        .lineTo(totalsX + totalsW, y + lineH)
        .strokeColor(BORDER)
        .lineWidth(0.3)
        .stroke();
      doc
        .font(t.bold ? 'Helvetica-Bold' : 'Helvetica')
        .fontSize(9.5)
        .fillColor(INK)
        .text(t.label, totalsX + 10, y + 6, { width: totalsW / 2 - 10, lineBreak: false })
        .text(t.value, totalsX + totalsW / 2, y + 6, { width: totalsW / 2 - 10, align: 'right', lineBreak: false });
    }
    y += lineH;
  });

  y += 24;

  // ─── Payment info ───
  doc
    .font('Helvetica-Bold')
    .fontSize(9)
    .fillColor(PRIMARY)
    .text('MODE DE PAIEMENT', MARGIN, y, { lineBreak: false, characterSpacing: 0.5 });
  y += 16;
  doc
    .font('Helvetica')
    .fontSize(9)
    .fillColor(INK)
    .text(`Mode : ${input.method}`, MARGIN, y);
  if (input.reference) {
    doc.text(`Référence : ${input.reference}`, MARGIN, y + 14);
  }

  // ─── Footer on every page ───
  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i);
    const footerY = doc.page.height - MARGIN - 10;
    doc
      .moveTo(MARGIN, footerY)
      .lineTo(PAGE_W - MARGIN, footerY)
      .strokeColor(BORDER)
      .lineWidth(0.5)
      .stroke();
    doc
      .font('Helvetica')
      .fontSize(7.5)
      .fillColor(MUTED)
      .text(
        `${input.issuer.name} — Facture ${input.invoiceNumber} — Générée le ${new Date().toLocaleDateString('fr-FR')}`,
        MARGIN,
        footerY + 6,
        { width: CONTENT_W, align: 'center', lineBreak: false },
      );
  }

  doc.end();
  return doc;
}
