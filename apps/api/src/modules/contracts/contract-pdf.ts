/* eslint-disable @typescript-eslint/no-explicit-any */
import PDFDocument from 'pdfkit';

interface ContractPdfInput {
  tenant: {
    name: string;
    phone?: string | null;
    billingEmail?: string | null;
    address?: string | null;
    city?: string | null;
    website?: string | null;
    logoUrl?: string | null;
    taxId?: string | null;
    ice?: string | null;
    rc?: string | null;
    patente?: string | null;
    cnss?: string | null;
    bankName?: string | null;
    bankRib?: string | null;
  };
  contract: {
    contractNumber: string;
    startDate: Date;
    endDate: Date;
    actualReturnDate: Date | null;
    kmStart: number;
    kmEnd: number | null;
    kmAllowance: number | null;
    dailyRate: string | number;
    totalAmount: string | number;
    depositAmount: string | number;
    depositMethod: string | null;
    pickupLocation: string | null;
    returnLocation: string | null;
    additionalDriver: string | null;
    notes: string | null;
    status: string;
    createdAt: Date;
  };
  vehicle: {
    registration: string;
    brand: string;
    model: string;
    year: number;
    color?: string | null;
    vin?: string | null;
  };
  client: {
    fullName: string;
    idNumber: string;
    idType?: string | null;
    licenseNumber?: string | null;
    phone?: string | null;
    email?: string | null;
    addressLine1?: string | null;
    city?: string | null;
  };
}

// Design tokens
const PRIMARY = '#1B3A6B';
const INK = '#0F172A';
const MUTED = '#64748B';
const BORDER = '#E2E8F0';
const SOFT = '#F8FAFC';

// Page geometry (A4 @ 72dpi = 595 × 842 pt)
const PAGE_W = 595.28;
const MARGIN_X = 40;
const HEADER_H = 68;
const FOOTER_H = 56;
const CONTENT_W = PAGE_W - MARGIN_X * 2;

function fmtDate(d: Date | null): string {
  if (!d) return '—';
  return d.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function fmtDateTime(d: Date | null): string {
  if (!d) return '—';
  return d.toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function fmtMoney(v: string | number): string {
  const n = Number(v);
  return `${n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MAD`;
}

function diffDays(a: Date, b: Date): number {
  const ms = b.getTime() - a.getTime();
  return Math.max(1, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

function decodeLogoDataUrl(dataUrl: string | null | undefined): Buffer | null {
  if (!dataUrl) return null;
  const match = /^data:image\/(png|jpe?g);base64,([A-Za-z0-9+/=\r\n]+)$/i.exec(dataUrl);
  if (!match) return null;
  try {
    return Buffer.from(match[2], 'base64');
  } catch {
    return null;
  }
}

export function buildContractPdf(input: ContractPdfInput): NodeJS.ReadableStream {
  const doc = new PDFDocument({
    size: 'A4',
    margins: { top: HEADER_H + 8, bottom: FOOTER_H + 8, left: MARGIN_X, right: MARGIN_X },
    bufferPages: true,
  });

  // Header + footer are drawn per page at the very end (after all content
  // is laid out) so auto-pagination from long conditions text doesn't
  // interact with them. This avoids any recursion or layout drift.

  // ---------- Main content ----------
  let y = HEADER_H + 14;

  // Two-column: client (left) / vehicle (right)
  const colW = (CONTENT_W - 16) / 2;
  const colLX = MARGIN_X;
  const colRX = MARGIN_X + colW + 16;

  y = drawTwoColumnBlock(
    doc,
    y,
    {
      title: 'Locataire',
      x: colLX,
      width: colW,
      rows: [
        ['Nom complet', input.client.fullName],
        [`Pièce (${input.client.idType ?? 'CIN'})`, input.client.idNumber],
        ['Permis', input.client.licenseNumber ?? '—'],
        ['Téléphone', input.client.phone ?? '—'],
        ['Email', input.client.email ?? '—'],
        [
          'Adresse',
          [input.client.addressLine1, input.client.city].filter(Boolean).join(', ') || '—',
        ],
      ],
    },
    {
      title: 'Véhicule',
      x: colRX,
      width: colW,
      rows: [
        ['Immatriculation', input.vehicle.registration],
        ['Marque / Modèle', `${input.vehicle.brand} ${input.vehicle.model}`],
        ['Année', String(input.vehicle.year)],
        ['Couleur', input.vehicle.color ?? '—'],
        ['VIN', input.vehicle.vin ?? '—'],
      ],
    },
  );

  y += 10;

  // Two-column: period (left) / pricing (right)
  const duration = diffDays(input.contract.startDate, input.contract.endDate);
  y = drawTwoColumnBlock(
    doc,
    y,
    {
      title: 'Période & kilométrage',
      x: colLX,
      width: colW,
      rows: [
        ['Départ', fmtDateTime(input.contract.startDate)],
        ['Retour prévu', fmtDateTime(input.contract.endDate)],
        ['Durée', `${duration} jour${duration > 1 ? 's' : ''}`],
        ['Km départ', `${input.contract.kmStart.toLocaleString('fr-FR')} km`],
        [
          'Forfait km',
          input.contract.kmAllowance ? `${input.contract.kmAllowance} km/jour` : 'Illimité',
        ],
        ['Lieu prise', input.contract.pickupLocation ?? '—'],
        ['Lieu retour', input.contract.returnLocation ?? '—'],
      ],
    },
    {
      title: 'Tarification & caution',
      x: colRX,
      width: colW,
      rows: [
        ['Tarif / jour', fmtMoney(input.contract.dailyRate)],
        ['Durée', `× ${duration} jour${duration > 1 ? 's' : ''}`],
        ['Total contrat', fmtMoney(input.contract.totalAmount)],
        ['Caution', fmtMoney(input.contract.depositAmount)],
        ['Mode caution', input.contract.depositMethod ?? '—'],
        ['Conducteur add.', input.contract.additionalDriver ?? '—'],
      ],
      highlightLastRow: false,
      emphasizeRow: 2, // "Total contrat"
    },
  );

  y += 10;

  // Conditions — condensed, two columns, 8pt
  y = drawSectionHeader(doc, 'Conditions générales', MARGIN_X, y, CONTENT_W);
  const CONDITIONS = [
    '1. Le locataire reconnaît avoir reçu le véhicule en bon état, avec documents et accessoires.',
    '2. Seuls le locataire et le conducteur additionnel déclaré peuvent conduire. Sous-location interdite.',
    '3. Tout retard de restitution est facturé une journée supplémentaire par jour entamé.',
    '4. Le carburant est restitué au même niveau qu’au départ ; à défaut, le complément est facturé.',
    '5. Amendes et contraventions sont à la charge exclusive du locataire.',
    '6. Toute infraction peut entraîner la résiliation immédiate et la conservation de la caution.',
  ];
  const condColW = (CONTENT_W - 16) / 2;
  const half = Math.ceil(CONDITIONS.length / 2);
  doc
    .font('Helvetica')
    .fontSize(8)
    .fillColor(INK)
    .text(CONDITIONS.slice(0, half).join('\n\n'), MARGIN_X, y, {
      width: condColW,
      align: 'justify',
      lineGap: 1.5,
    });
  const leftBottom = doc.y;
  doc.text(CONDITIONS.slice(half).join('\n\n'), MARGIN_X + condColW + 16, y, {
    width: condColW,
    align: 'justify',
    lineGap: 1.5,
  });
  const rightBottom = doc.y;
  y = Math.max(leftBottom, rightBottom) + 10;

  // Notes (optional, single line-ish)
  if (input.contract.notes) {
    y = drawSectionHeader(doc, 'Notes', MARGIN_X, y, CONTENT_W);
    doc
      .font('Helvetica')
      .fontSize(8.5)
      .fillColor(INK)
      .text(input.contract.notes, MARGIN_X, y, {
        width: CONTENT_W,
        align: 'left',
        lineGap: 1.5,
      });
    y = doc.y + 10;
  }

  // Signatures — always at the same bottom-anchored place to avoid drift
  drawSignatures(doc, y);

  // ---------- Header + footer on every page (drawn last) ----------
  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i);
    drawHeader(doc, input);
    drawFooter(doc, input.tenant, i - range.start + 1, range.count);
  }

  doc.end();
  return doc;
}

// ----------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------

function drawHeader(doc: PDFKit.PDFDocument, input: ContractPdfInput): void {
  doc.save();

  // Background band — full header height (company contacts moved to footer)
  doc.rect(0, 0, PAGE_W, HEADER_H).fill(PRIMARY);

  // Logo
  const logoBuf = decodeLogoDataUrl(input.tenant.logoUrl);
  let nameX = MARGIN_X;
  if (logoBuf) {
    try {
      doc.image(logoBuf, MARGIN_X, 14, { fit: [42, 42] });
      nameX = MARGIN_X + 52;
    } catch {
      // ignore
    }
  }

  // Tenant name + title
  doc
    .fillColor('#FFFFFF')
    .font('Helvetica-Bold')
    .fontSize(16)
    .text(input.tenant.name, nameX, 16, { lineBreak: false, width: 320 });
  doc
    .font('Helvetica')
    .fontSize(9)
    .fillColor('#CBD5E1')
    .text('CONTRAT DE LOCATION DE VÉHICULE', nameX, 37, { lineBreak: false, width: 320 });

  // Right block: contract number + date
  doc
    .fillColor('#FFFFFF')
    .font('Helvetica-Bold')
    .fontSize(11)
    .text(`N° ${input.contract.contractNumber}`, PAGE_W - MARGIN_X - 200, 16, {
      width: 200,
      align: 'right',
      lineBreak: false,
    });
  doc
    .font('Helvetica')
    .fontSize(8.5)
    .fillColor('#CBD5E1')
    .text(`Émis le ${fmtDateTime(input.contract.createdAt)}`, PAGE_W - MARGIN_X - 200, 36, {
      width: 200,
      align: 'right',
      lineBreak: false,
    });

  doc.restore();
}

function drawFooter(
  doc: PDFKit.PDFDocument,
  tenant: ContractPdfInput['tenant'],
  pageNum: number,
  pageCount: number,
): void {
  doc.save();

  const pageHeight = doc.page.height;
  const footerTop = pageHeight - FOOTER_H;

  // 1) Primary-color band (same color as the header).
  //    Use the explicit fillColor→rect→fill pattern so the subsequent text
  //    isn't affected by side-effects of the shorthand `.fill(PRIMARY)`.
  doc.fillColor(PRIMARY);
  doc.rect(0, footerTop, PAGE_W, FOOTER_H).fill();

  // 2) Build the horizontal company line from the fields requested.
  const parts: string[] = [];
  if (tenant.name) parts.push(tenant.name);
  const addr = [tenant.address, tenant.city].filter(Boolean).join(', ');
  if (addr) parts.push(addr);
  if (tenant.phone) parts.push(`Tél. ${tenant.phone}`);
  if (tenant.billingEmail) parts.push(tenant.billingEmail);
  if (tenant.ice) parts.push(`ICE ${tenant.ice}`);
  if (tenant.rc) parts.push(`RC ${tenant.rc}`);

  const line = parts.join('   |   ');

  // 3) Auto-shrink the font until everything fits on one centered line.
  doc.font('Helvetica');
  let fontSize = 8.5;
  doc.fontSize(fontSize);
  while (fontSize > 5.5 && doc.widthOfString(line) > CONTENT_W) {
    fontSize -= 0.25;
    doc.fontSize(fontSize);
  }

  // 4) Reserve 12pt for the optional page counter at the far bottom, so
  //    the main line sits vertically centered in the remaining band.
  const mainBandTop = footerTop;
  const mainBandHeight = FOOTER_H - 14;
  const textY = mainBandTop + (mainBandHeight - fontSize) / 2;

  // 5) Re-assert font + color immediately before writing text so we are
  //    not affected by any residual graphic state.
  doc.fillColor('#FFFFFF');
  doc.font('Helvetica');
  doc.fontSize(fontSize);
  doc.text(line, MARGIN_X, textY, {
    width: CONTENT_W,
    align: 'center',
    lineBreak: false,
  });

  // 6) Thin divider + page counter (only when more than 1 page).
  if (pageCount > 1) {
    doc.fillColor('#CBD5E1');
    doc.font('Helvetica');
    doc.fontSize(7);
    doc.text(`Page ${pageNum} / ${pageCount}`, MARGIN_X, pageHeight - 12, {
      width: CONTENT_W,
      align: 'right',
      lineBreak: false,
    });
  }

  doc.restore();
}

interface ColumnBlock {
  title: string;
  x: number;
  width: number;
  rows: Array<[string, string]>;
  highlightLastRow?: boolean;
  emphasizeRow?: number;
}

function drawTwoColumnBlock(
  doc: PDFKit.PDFDocument,
  startY: number,
  left: ColumnBlock,
  right: ColumnBlock,
): number {
  const leftH = measureBlock(left);
  const rightH = measureBlock(right);
  const blockH = Math.max(leftH, rightH);

  drawBlock(doc, startY, left, blockH);
  drawBlock(doc, startY, right, blockH);

  return startY + blockH;
}

const ROW_H = 14;
const HEADER_OFFSET = 22;

function measureBlock(b: ColumnBlock): number {
  return HEADER_OFFSET + b.rows.length * ROW_H + 6;
}

function drawBlock(
  doc: PDFKit.PDFDocument,
  startY: number,
  b: ColumnBlock,
  totalH: number,
): void {
  // Card background
  doc
    .roundedRect(b.x, startY, b.width, totalH, 4)
    .fillColor(SOFT)
    .fill();

  // Title bar
  doc
    .fillColor(PRIMARY)
    .font('Helvetica-Bold')
    .fontSize(9)
    .text(b.title.toUpperCase(), b.x + 10, startY + 8, {
      width: b.width - 20,
      lineBreak: false,
      characterSpacing: 0.5,
    });
  doc
    .moveTo(b.x + 10, startY + 19)
    .lineTo(b.x + b.width - 10, startY + 19)
    .strokeColor(BORDER)
    .lineWidth(0.5)
    .stroke();

  // Rows
  const labelW = Math.min(110, b.width * 0.4);
  const valueX = b.x + 10 + labelW + 6;
  const valueW = b.width - 10 - labelW - 6 - 10;

  b.rows.forEach(([label, value], i) => {
    const rowY = startY + HEADER_OFFSET + i * ROW_H;
    const emphasize = b.emphasizeRow === i;
    doc
      .font('Helvetica')
      .fontSize(8)
      .fillColor(MUTED)
      .text(label, b.x + 10, rowY, {
        width: labelW,
        lineBreak: false,
      });
    doc
      .font(emphasize ? 'Helvetica-Bold' : 'Helvetica')
      .fontSize(emphasize ? 9.5 : 8.5)
      .fillColor(emphasize ? PRIMARY : INK)
      .text(String(value), valueX, rowY - (emphasize ? 1 : 0), {
        width: valueW,
        align: 'right',
        lineBreak: false,
        ellipsis: true,
      });
  });
}

function drawSectionHeader(
  doc: PDFKit.PDFDocument,
  title: string,
  x: number,
  y: number,
  width: number,
): number {
  doc
    .fillColor(PRIMARY)
    .font('Helvetica-Bold')
    .fontSize(9)
    .text(title.toUpperCase(), x, y, {
      width,
      lineBreak: false,
      characterSpacing: 0.5,
    });
  doc
    .moveTo(x, y + 12)
    .lineTo(x + width, y + 12)
    .strokeColor(BORDER)
    .lineWidth(0.5)
    .stroke();
  return y + 18;
}

function drawSignatures(doc: PDFKit.PDFDocument, minY: number): void {
  const bottomLimit = doc.page.height - FOOTER_H - 10;
  const blockH = 70;
  const y = Math.max(minY, bottomLimit - blockH);

  const colW = (CONTENT_W - 24) / 2;
  const lX = MARGIN_X;
  const rX = MARGIN_X + colW + 24;

  doc
    .font('Helvetica-Bold')
    .fontSize(9)
    .fillColor(PRIMARY)
    .text('SIGNATURES', MARGIN_X, y, { lineBreak: false, characterSpacing: 0.5 });

  // Two boxes
  [lX, rX].forEach((x, i) => {
    doc
      .roundedRect(x, y + 16, colW, blockH - 16, 3)
      .strokeColor(BORDER)
      .lineWidth(0.5)
      .stroke();
    doc
      .font('Helvetica')
      .fontSize(7.5)
      .fillColor(MUTED)
      .text(i === 0 ? 'Le locataire (lu et approuvé)' : 'Le bailleur', x + 8, y + 20, {
        lineBreak: false,
      });
  });
}
