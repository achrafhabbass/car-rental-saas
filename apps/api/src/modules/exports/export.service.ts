import { Injectable } from '@nestjs/common';
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';

export interface ColumnDef {
  header: string;
  key: string;
  width?: number;
}

export interface ExportData {
  title: string;
  columns: ColumnDef[];
  rows: Array<Record<string, unknown>>;
}

const PRIMARY = '#1B3A6B';
const BORDER = '#E2E8F0';
const MUTED = '#64748B';
const INK = '#0F172A';

@Injectable()
export class ExportService {
  async toExcel(data: ExportData): Promise<Buffer> {
    const wb = new ExcelJS.Workbook();
    wb.creator = 'AutoSphere';
    wb.created = new Date();

    const ws = wb.addWorksheet(data.title);

    ws.columns = data.columns.map((c) => ({
      header: c.header,
      key: c.key,
      width: c.width ?? 20,
    }));

    // Style header row
    const headerRow = ws.getRow(1);
    headerRow.font = { bold: true, size: 11, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1B3A6B' },
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
    headerRow.height = 30;

    for (const row of data.rows) {
      const values: Record<string, unknown> = {};
      for (const col of data.columns) {
        values[col.key] = row[col.key] ?? '';
      }
      ws.addRow(values);
    }

    // Auto-filter + alternating rows
    ws.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: data.rows.length + 1, column: data.columns.length },
    };
    for (let i = 2; i <= data.rows.length + 1; i++) {
      const row = ws.getRow(i);
      row.alignment = { vertical: 'middle' };
      if (i % 2 === 0) {
        row.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF8FAFC' },
        };
      }
    }

    // Borders
    ws.eachRow((row) => {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        };
      });
    });

    return Buffer.from(await wb.xlsx.writeBuffer());
  }

  toPdf(data: ExportData): NodeJS.ReadableStream {
    const doc = new PDFDocument({
      size: 'A4',
      layout: 'landscape',
      margins: { top: 50, bottom: 40, left: 40, right: 40 },
    });

    const pageW = doc.page.width;
    const contentW = pageW - 80;
    const colCount = data.columns.length;
    const colWidths = data.columns.map((c) =>
      c.width ? (c.width / data.columns.reduce((s, cc) => s + (cc.width ?? 20), 0)) * contentW : contentW / colCount,
    );

    // Title
    doc
      .fillColor(PRIMARY)
      .font('Helvetica-Bold')
      .fontSize(16)
      .text(data.title, 40, 30, { lineBreak: false });
    doc
      .font('Helvetica')
      .fontSize(9)
      .fillColor(MUTED)
      .text(
        `Généré le ${new Date().toLocaleDateString('fr-FR')} · ${data.rows.length} enregistrement(s)`,
        40,
        52,
        { lineBreak: false },
      );

    let y = 75;
    const rowH = 20;
    const headerH = 26;

    const drawHeaderRow = () => {
      doc.rect(40, y, contentW, headerH).fill(PRIMARY);
      let x = 40;
      data.columns.forEach((col, i) => {
        doc
          .fillColor('#FFFFFF')
          .font('Helvetica-Bold')
          .fontSize(8)
          .text(col.header, x + 4, y + 8, {
            width: colWidths[i] - 8,
            lineBreak: false,
            ellipsis: true,
          });
        x += colWidths[i];
      });
      y += headerH;
    };

    drawHeaderRow();

    for (let r = 0; r < data.rows.length; r++) {
      if (y + rowH > doc.page.height - 40) {
        doc.addPage();
        y = 50;
        drawHeaderRow();
      }

      // Alternating background
      if (r % 2 === 0) {
        doc.rect(40, y, contentW, rowH).fill('#F8FAFC');
      }

      // Bottom border
      doc
        .moveTo(40, y + rowH)
        .lineTo(40 + contentW, y + rowH)
        .strokeColor(BORDER)
        .lineWidth(0.3)
        .stroke();

      let x = 40;
      data.columns.forEach((col, i) => {
        const val = String(data.rows[r][col.key] ?? '');
        doc
          .fillColor(INK)
          .font('Helvetica')
          .fontSize(7.5)
          .text(val, x + 4, y + 6, {
            width: colWidths[i] - 8,
            lineBreak: false,
            ellipsis: true,
          });
        x += colWidths[i];
      });

      y += rowH;
    }

    // Footer
    const range = doc.bufferedPageRange?.() ?? { start: 0, count: 1 };
    const totalPages = range.count;
    doc
      .font('Helvetica')
      .fontSize(7)
      .fillColor(MUTED)
      .text(
        `AutoSphere · Page 1/${totalPages}`,
        40,
        doc.page.height - 25,
        { width: contentW, align: 'center', lineBreak: false },
      );

    doc.end();
    return doc;
  }
}
