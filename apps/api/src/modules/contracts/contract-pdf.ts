/* eslint-disable @typescript-eslint/no-explicit-any */
import PDFDocument from 'pdfkit';

interface ContractPdfInput {
  tenant: { name: string; phone?: string | null; billingEmail?: string | null };
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

const PRIMARY = '#1B3A6B';
const MUTED = '#64748B';
const BORDER = '#E2E8F0';

function fmtDate(d: Date | null): string {
  if (!d) return '—';
  return d.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function fmtMoney(v: string | number): string {
  return `${Number(v).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MAD`;
}

/**
 * Streams a contract PDF to the provided stream-like writer.
 * Caller is responsible for piping it into the HTTP response.
 *
 * Sections:
 *  1. Header band (tenant logo placeholder + tenant name + contract #)
 *  2. Parties (locataire + véhicule)
 *  3. Conditions (période, km, tarification, caution)
 *  4. Conditions générales (boilerplate)
 *  5. Signatures
 */
export function buildContractPdf(input: ContractPdfInput): NodeJS.ReadableStream {
  const doc = new PDFDocument({ size: 'A4', margins: { top: 56, bottom: 56, left: 56, right: 56 } });

  // ---------- Header ----------
  doc.rect(0, 0, doc.page.width, 80).fill(PRIMARY);

  doc
    .fillColor('#FFFFFF')
    .fontSize(22)
    .font('Helvetica-Bold')
    .text(input.tenant.name, 56, 28);
  doc
    .fontSize(10)
    .font('Helvetica')
    .text('CONTRAT DE LOCATION', 56, 56);

  doc
    .fontSize(10)
    .text(`N° ${input.contract.contractNumber}`, 0, 30, {
      align: 'right',
      width: doc.page.width - 56,
    })
    .text(`Émis le ${fmtDate(input.contract.createdAt)}`, 0, 46, {
      align: 'right',
      width: doc.page.width - 56,
    });

  doc.fillColor('#000000');

  // ---------- Parties ----------
  let y = 110;
  drawSection(doc, 'Locataire', y);
  y += 24;
  drawKv(doc, [
    ['Nom complet', input.client.fullName],
    [
      `Pièce d'identité (${input.client.idType ?? 'CIN'})`,
      input.client.idNumber,
    ],
    ['Permis de conduire', input.client.licenseNumber ?? '—'],
    ['Téléphone', input.client.phone ?? '—'],
    ['Email', input.client.email ?? '—'],
    [
      'Adresse',
      [input.client.addressLine1, input.client.city].filter(Boolean).join(', ') || '—',
    ],
  ], y);
  y += 6 * 16 + 8;

  drawSection(doc, 'Véhicule', y);
  y += 24;
  drawKv(doc, [
    ['Immatriculation', input.vehicle.registration],
    ['Marque / Modèle', `${input.vehicle.brand} ${input.vehicle.model}`],
    ['Année', String(input.vehicle.year)],
    ['Couleur', input.vehicle.color ?? '—'],
    ['VIN', input.vehicle.vin ?? '—'],
  ], y);
  y += 5 * 16 + 8;

  // ---------- Conditions ----------
  drawSection(doc, 'Période & kilométrage', y);
  y += 24;
  drawKv(doc, [
    ['Date de départ', fmtDate(input.contract.startDate)],
    ['Date de retour prévue', fmtDate(input.contract.endDate)],
    ['Lieu de prise', input.contract.pickupLocation ?? '—'],
    ['Lieu de retour', input.contract.returnLocation ?? '—'],
    ['Kilométrage au départ', `${input.contract.kmStart.toLocaleString('fr-FR')} km`],
    [
      'Forfait kilométrique',
      input.contract.kmAllowance
        ? `${input.contract.kmAllowance} km/jour`
        : 'Illimité',
    ],
    [
      'Conducteur additionnel',
      input.contract.additionalDriver ?? '—',
    ],
  ], y);
  y += 7 * 16 + 8;

  drawSection(doc, 'Tarification & caution', y);
  y += 24;
  drawKv(doc, [
    ['Tarif journalier', fmtMoney(input.contract.dailyRate)],
    ['Total contrat', fmtMoney(input.contract.totalAmount)],
    ['Caution', fmtMoney(input.contract.depositAmount)],
    ['Mode de caution', input.contract.depositMethod ?? '—'],
  ], y);
  y += 4 * 16 + 12;

  // ---------- Conditions générales ----------
  if (y > 600) {
    doc.addPage();
    y = 56;
  }
  drawSection(doc, 'Conditions générales', y);
  y += 22;
  doc
    .fontSize(9)
    .fillColor('#1f2937')
    .font('Helvetica')
    .text(
      [
        '1. Le locataire reconnaît avoir reçu le véhicule en bon état de marche, accompagné de tous ses documents et accessoires.',
        "2. Le véhicule ne peut être conduit que par le locataire désigné ou un conducteur additionnel déclaré au contrat. La sous-location est interdite.",
        '3. En cas de retard de restitution, des pénalités équivalentes à une journée de location supplémentaire seront facturées par jour entamé.',
        '4. Le carburant est restitué au même niveau qu’au départ. À défaut, le complément est facturé.',
        "5. Les amendes et contraventions reçues pendant la durée de la location sont à la charge exclusive du locataire.",
        '6. Toute infraction constatée à ce contrat peut entraîner la résiliation immédiate et la conservation de la caution à titre de dédommagement.',
      ].join('\n\n'),
      56,
      y,
      { width: doc.page.width - 112, align: 'justify', lineGap: 2 },
    );

  // ---------- Signatures ----------
  if (doc.y > 680) doc.addPage();
  const sigY = Math.max(doc.y + 30, 700);
  doc
    .fontSize(10)
    .fillColor('#000000')
    .font('Helvetica-Bold')
    .text('Signatures', 56, sigY);

  const colWidth = (doc.page.width - 112 - 24) / 2;
  doc
    .font('Helvetica')
    .fontSize(9)
    .fillColor(MUTED)
    .text('Le locataire', 56, sigY + 22)
    .text('Le bailleur', 56 + colWidth + 24, sigY + 22);

  doc
    .moveTo(56, sigY + 80)
    .lineTo(56 + colWidth, sigY + 80)
    .strokeColor(BORDER)
    .stroke();
  doc
    .moveTo(56 + colWidth + 24, sigY + 80)
    .lineTo(doc.page.width - 56, sigY + 80)
    .stroke();

  doc.end();
  return doc;
}

function drawSection(doc: PDFKit.PDFDocument, title: string, y: number): void {
  doc
    .fillColor(PRIMARY)
    .font('Helvetica-Bold')
    .fontSize(11)
    .text(title.toUpperCase(), 56, y);
  doc
    .moveTo(56, y + 16)
    .lineTo(doc.page.width - 56, y + 16)
    .strokeColor(BORDER)
    .stroke();
}

function drawKv(
  doc: PDFKit.PDFDocument,
  rows: Array<[string, string]>,
  y: number,
): void {
  doc.fillColor('#000000').fontSize(9).font('Helvetica');
  rows.forEach(([label, value], i) => {
    const rowY = y + i * 16;
    doc
      .fillColor(MUTED)
      .text(label, 56, rowY, { width: 180 })
      .fillColor('#0f172a')
      .text(value, 240, rowY, { width: doc.page.width - 56 - 240 });
  });
}
