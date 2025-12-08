import { Injectable, Logger } from '@nestjs/common';
import * as PDFDocument from 'pdfkit';
import { Ticket } from '@modules/tickets/entities/ticket.entity';
import { User } from '@modules/users/entities/user.entity';

export interface TicketType {
  id: string;
  type: string;
  name: string;
  description?: string | null;
  price: number;
  validity_hours?: number | null;
  is_active: boolean;
}

/**
 * PDF generation service for creating ticket PDFs
 * Uses pdfkit to generate professional-looking ticket documents
 */
@Injectable()
export class PdfService {
  private readonly logger = new Logger(PdfService.name);

  /**
   * Generates a PDF document for a ticket
   * @param ticket - Ticket details
   * @param user - User details
   * @param ticketType - Ticket type details
   * @param qrCodeBuffer - QR code as Buffer (PNG image)
   * @returns PDF as Buffer
   */
  async generateTicketPDF(
    ticket: Ticket,
    user: User,
    ticketType: TicketType,
    qrCodeBuffer: Buffer,
  ): Promise<Buffer> {
    try {
      return new Promise((resolve, reject) => {
        const doc = new PDFDocument({
          size: 'A4',
          margins: {
            top: 50,
            bottom: 50,
            left: 50,
            right: 50,
          },
        });

        const chunks: Buffer[] = [];

        // Collect PDF data into buffer
        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', (error) => reject(error));

        // --- HEADER ---
        this.addHeader(doc);

        // --- TITLE ---
        doc.moveDown(2);
        doc.fontSize(24)
          .fillColor('#1976d2')
          .text('Utazási jegy', { align: 'center' });

        doc.moveDown(0.5);
        doc.fontSize(12)
          .fillColor('#666')
          .text('Közlekedési Jegykezelő Rendszer', { align: 'center' });

        // --- DIVIDER ---
        doc.moveDown(1);
        doc.strokeColor('#1976d2')
          .lineWidth(2)
          .moveTo(50, doc.y)
          .lineTo(545, doc.y)
          .stroke();

        // --- TICKET DETAILS BOX ---
        doc.moveDown(1.5);
        const boxTop = doc.y;
        const boxLeft = 50;
        const boxWidth = 495;
        const boxHeight = 200;

        // Draw box
        doc.rect(boxLeft, boxTop, boxWidth, boxHeight)
          .fillAndStroke('#f5f5f5', '#ddd');

        // Reset position for text inside box
        doc.y = boxTop + 15;
        doc.x = boxLeft + 20;

        // Ticket details
        doc.fontSize(14).fillColor('#333').font('Helvetica-Bold');
        this.addDetailRow(doc, 'Jegy azonosító:', ticket.id.substring(0, 18) + '...', boxLeft);

        doc.font('Helvetica');
        this.addDetailRow(doc, 'Utas neve:', user.name, boxLeft);
        this.addDetailRow(doc, 'Email:', user.email, boxLeft);
        this.addDetailRow(doc, 'Jegy típusa:', ticketType.name, boxLeft);
        this.addDetailRow(doc, 'Ár:', `${ticket.price} Ft`, boxLeft);

        // Format dates
        const purchaseDate = new Date(ticket.purchase_date).toLocaleString('hu-HU', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });

        const validFrom = new Date(ticket.valid_from).toLocaleString('hu-HU', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });

        const validUntil = ticket.valid_until
          ? new Date(ticket.valid_until).toLocaleString('hu-HU', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })
          : 'Korlátlan';

        this.addDetailRow(doc, 'Vásárlás dátuma:', purchaseDate, boxLeft);
        this.addDetailRow(doc, 'Érvényesség kezdete:', validFrom, boxLeft);
        this.addDetailRow(doc, 'Érvényesség vége:', validUntil, boxLeft);

        // Status badge
        const statusColor = this.getStatusColor(ticket.status);
        doc.fontSize(10)
          .fillColor(statusColor)
          .font('Helvetica-Bold')
          .text(`STÁTUSZ: ${ticket.status.toUpperCase()}`, boxLeft + 20, doc.y, {
            width: boxWidth - 40,
          });

        // --- QR CODE SECTION ---
        doc.moveDown(3);
        const qrTop = doc.y;

        // QR Code title
        doc.fontSize(16)
          .fillColor('#1976d2')
          .font('Helvetica-Bold')
          .text('QR kód a jegy érvényesítéséhez', { align: 'center' });

        doc.moveDown(1);

        // Add QR code image (centered)
        const qrSize = 200;
        const qrLeft = (doc.page.width - qrSize) / 2;
        doc.image(qrCodeBuffer, qrLeft, doc.y, {
          width: qrSize,
          height: qrSize,
        });

        doc.y += qrSize + 10;

        // QR Code instructions
        doc.moveDown(1);
        doc.fontSize(10)
          .fillColor('#666')
          .font('Helvetica')
          .text('Mutassa fel ezt a QR kódot ellenőrzéskor', { align: 'center' });

        // --- IMPORTANT INFORMATION ---
        doc.moveDown(2);
        doc.fontSize(12)
          .fillColor('#333')
          .font('Helvetica-Bold')
          .text('Fontos információk:');

        doc.moveDown(0.5);
        doc.fontSize(10).font('Helvetica').fillColor('#555');

        const instructions = [
          '• A jegy csak a megadott érvényességi időszakban használható',
          '• Ellenőrzéskor kérjük, mutassa fel a QR kódot',
          '• A jegyet ne adja át másnak, személyre szóló',
          '• Utazás megkezdése előtt győződjön meg a jegy érvényességéről',
          '• Érvénytelen vagy lejárt jeggyel történő utazás bírságot von maga után',
        ];

        instructions.forEach((instruction) => {
          doc.text(instruction, { indent: 20 });
        });

        // --- FOOTER ---
        this.addFooter(doc);

        // Finalize PDF
        doc.end();

        this.logger.log(`PDF generated successfully for ticket ${ticket.id}`);
      });
    } catch (error) {
      this.logger.error(`Failed to generate PDF for ticket ${ticket.id}:`, error);
      throw error;
    }
  }

  /**
   * Adds header section to the PDF
   */
  private addHeader(doc: PDFKit.PDFDocument): void {
    // Logo placeholder - you can replace this with an actual logo image
    doc.fontSize(18)
      .fillColor('#1976d2')
      .font('Helvetica-Bold')
      .text('BKK', 50, 30);

    // Date of issue
    const issueDate = new Date().toLocaleDateString('hu-HU');
    doc.fontSize(10)
      .fillColor('#666')
      .font('Helvetica')
      .text(`Kiállítás dátuma: ${issueDate}`, 400, 35, {
        width: 145,
        align: 'right',
      });
  }

  /**
   * Adds footer section to the PDF
   */
  private addFooter(doc: PDFKit.PDFDocument): void {
    const pageHeight = doc.page.height;
    const footerY = pageHeight - 80;

    doc.fontSize(8)
      .fillColor('#999')
      .text(
        'Közlekedési Jegykezelő Rendszer | © 2025 Minden jog fenntartva',
        50,
        footerY,
        {
          width: 495,
          align: 'center',
        },
      );

    doc.text('Ez egy elektronikusan generált dokumentum, aláírás nem szükséges.', 50, footerY + 12, {
      width: 495,
      align: 'center',
    });

    doc.text('Ügyfélszolgálat: info@bkk.hu | Tel: +36 1 3 255 255', 50, footerY + 24, {
      width: 495,
      align: 'center',
    });
  }

  /**
   * Adds a detail row (label + value) to the PDF
   */
  private addDetailRow(
    doc: PDFKit.PDFDocument,
    label: string,
    value: string,
    boxLeft: number,
  ): void {
    const currentY = doc.y;
    const labelWidth = 180;

    // Label
    doc.fontSize(10)
      .fillColor('#666')
      .font('Helvetica-Bold')
      .text(label, boxLeft + 20, currentY, {
        width: labelWidth,
        continued: false,
      });

    // Value
    doc.fontSize(10)
      .fillColor('#333')
      .font('Helvetica')
      .text(value, boxLeft + 20 + labelWidth, currentY, {
        width: 495 - labelWidth - 40,
      });

    doc.moveDown(0.7);
  }

  /**
   * Gets color based on ticket status
   */
  private getStatusColor(status: string): string {
    switch (status) {
      case 'active':
        return '#4caf50';
      case 'expired':
        return '#ff9800';
      case 'used':
        return '#9e9e9e';
      case 'cancelled':
        return '#f44336';
      default:
        return '#666';
    }
  }
}
