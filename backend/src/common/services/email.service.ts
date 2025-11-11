import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';
import { Ticket } from '@modules/tickets/tickets.service';
import { User } from '@modules/users/entities/user.entity';

/**
 * Email service for sending ticket-related emails
 * Uses Nodemailer for SMTP email delivery
 */
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: Transporter | null = null;
  private isConfigured = false;

  constructor(private configService: ConfigService) {
    this.initializeTransporter();
  }

  /**
   * Initializes the Nodemailer transporter with SMTP configuration
   * Handles both configured and unconfigured states gracefully
   */
  private initializeTransporter(): void {
    try {
      const host = this.configService.get<string>('SMTP_HOST');
      const port = this.configService.get<number>('SMTP_PORT');
      const user = this.configService.get<string>('SMTP_USER');
      const pass = this.configService.get<string>('SMTP_PASS');
      const from = this.configService.get<string>('SMTP_FROM');

      // Check if SMTP is configured
      if (!host || !port || !user || !pass || !from) {
        this.logger.warn(
          'SMTP configuration is missing. Email sending will be simulated. ' +
          'Please configure SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, and SMTP_FROM in .env',
        );
        this.isConfigured = false;
        return;
      }

      // Create transporter
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465, // Use TLS for port 465
        auth: {
          user,
          pass,
        },
      });

      this.isConfigured = true;
      this.logger.log('Email service initialized successfully');

      // Verify connection
      this.transporter.verify((error) => {
        if (error) {
          this.logger.error('SMTP connection verification failed:', error);
          this.isConfigured = false;
        } else {
          this.logger.log('SMTP connection verified successfully');
        }
      });
    } catch (error) {
      this.logger.error('Failed to initialize email transporter:', error);
      this.isConfigured = false;
    }
  }

  /**
   * Sends a ticket confirmation email with QR code
   * @param ticket - Ticket details
   * @param user - User details
   * @param qrCodeBuffer - QR code as Buffer (PNG image)
   * @returns Promise with success status and message
   */
  async sendTicketEmail(
    ticket: Ticket,
    user: User,
    qrCodeBuffer: Buffer,
  ): Promise<{ success: boolean; message: string }> {
    try {
      // If not configured, simulate email sending
      if (!this.isConfigured || !this.transporter) {
        this.logger.log(`[SIMULATION] Email would be sent to: ${user.email}`);
        this.logger.log(`[SIMULATION] Ticket ID: ${ticket.id}`);
        this.logger.log(`[SIMULATION] QR Code size: ${qrCodeBuffer.length} bytes`);
        return {
          success: true,
          message: 'Email sent successfully (simulation mode - configure SMTP to send real emails)',
        };
      }

      const from = this.configService.get<string>('SMTP_FROM');
      const appName = 'Közlekedési Jegykezelő';

      // Format dates for display
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

      // Create HTML email template
      const htmlContent = this.createTicketEmailTemplate({
        userName: user.name,
        ticketId: ticket.id,
        price: ticket.price,
        status: ticket.status,
        validFrom,
        validUntil,
        purchaseDate: new Date(ticket.purchase_date).toLocaleString('hu-HU'),
        appName,
      });

      // Create plain text version
      const textContent = `
Tisztelt ${user.name}!

Sikeresen megvásárolta jegyét a ${appName} rendszerben.

Jegy részletei:
- Jegy azonosító: ${ticket.id}
- Ár: ${ticket.price} Ft
- Státusz: ${ticket.status}
- Vásárlás időpontja: ${new Date(ticket.purchase_date).toLocaleString('hu-HU')}
- Érvényesség kezdete: ${validFrom}
- Érvényesség vége: ${validUntil}

A QR kód csatolva van az emailhez. Kérjük, mutassa fel a QR kódot ellenőrzéskor.

Üdvözlettel,
${appName} csapata
      `.trim();

      // Send email with attachment
      const info = await this.transporter.sendMail({
        from: `"${appName}" <${from}>`,
        to: user.email,
        subject: `Jegyének megerősítése - ${appName}`,
        text: textContent,
        html: htmlContent,
        attachments: [
          {
            filename: `ticket-${ticket.id}.png`,
            content: qrCodeBuffer,
            contentType: 'image/png',
            cid: 'qrcode', // Content ID for embedding in HTML
          },
        ],
      });

      this.logger.log(`Email sent successfully to ${user.email}. Message ID: ${info.messageId}`);

      return {
        success: true,
        message: 'Email sent successfully',
      };
    } catch (error) {
      this.logger.error(`Failed to send email to ${user.email}:`, error);
      throw new InternalServerErrorException('Failed to send ticket email');
    }
  }

  /**
   * Creates an HTML email template for ticket confirmation
   * @param data - Template data
   * @returns HTML string
   */
  private createTicketEmailTemplate(data: {
    userName: string;
    ticketId: string;
    price: number;
    status: string;
    validFrom: string;
    validUntil: string;
    purchaseDate: string;
    appName: string;
  }): string {
    return `
<!DOCTYPE html>
<html lang="hu">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Jegy megerősítés</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background-color: #1976d2;
            color: white;
            padding: 20px;
            text-align: center;
            border-radius: 8px 8px 0 0;
        }
        .content {
            background-color: #f9f9f9;
            padding: 30px;
            border-radius: 0 0 8px 8px;
        }
        .ticket-details {
            background-color: white;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .detail-row {
            display: flex;
            justify-content: space-between;
            padding: 10px 0;
            border-bottom: 1px solid #eee;
        }
        .detail-row:last-child {
            border-bottom: none;
        }
        .label {
            font-weight: bold;
            color: #555;
        }
        .value {
            color: #333;
        }
        .qr-code {
            text-align: center;
            margin: 30px 0;
        }
        .qr-code img {
            max-width: 300px;
            border: 2px solid #1976d2;
            border-radius: 8px;
            padding: 10px;
            background-color: white;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            color: #666;
            font-size: 12px;
        }
        .button {
            display: inline-block;
            background-color: #1976d2;
            color: white;
            padding: 12px 30px;
            text-decoration: none;
            border-radius: 5px;
            margin: 20px 0;
        }
        .status-badge {
            display: inline-block;
            padding: 5px 15px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
            text-transform: uppercase;
        }
        .status-active {
            background-color: #4caf50;
            color: white;
        }
        .price {
            font-size: 24px;
            font-weight: bold;
            color: #1976d2;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>${data.appName}</h1>
        <p>Jegy megerősítés</p>
    </div>

    <div class="content">
        <h2>Tisztelt ${data.userName}!</h2>

        <p>Sikeresen megvásárolta jegyét a ${data.appName} rendszerben. Köszönjük a vásárlást!</p>

        <div class="ticket-details">
            <div class="detail-row">
                <span class="label">Jegy azonosító:</span>
                <span class="value">${data.ticketId}</span>
            </div>
            <div class="detail-row">
                <span class="label">Ár:</span>
                <span class="value price">${data.price} Ft</span>
            </div>
            <div class="detail-row">
                <span class="label">Státusz:</span>
                <span class="value">
                    <span class="status-badge status-${data.status}">${data.status}</span>
                </span>
            </div>
            <div class="detail-row">
                <span class="label">Vásárlás időpontja:</span>
                <span class="value">${data.purchaseDate}</span>
            </div>
            <div class="detail-row">
                <span class="label">Érvényesség kezdete:</span>
                <span class="value">${data.validFrom}</span>
            </div>
            <div class="detail-row">
                <span class="label">Érvényesség vége:</span>
                <span class="value">${data.validUntil}</span>
            </div>
        </div>

        <div class="qr-code">
            <h3>QR kód</h3>
            <p>Mutassa fel ezt a QR kódot ellenőrzéskor:</p>
            <img src="cid:qrcode" alt="Ticket QR Code" />
        </div>

        <p><strong>Fontos információk:</strong></p>
        <ul>
            <li>A QR kódot mentse el vagy nyomtassa ki</li>
            <li>A jegy csak a megadott érvényességi időszakban használható</li>
            <li>Ellenőrzéskor mutassa fel a QR kódot az ellenőrnek</li>
            <li>A jegyét a mobilapplikációban is megtekintheti</li>
        </ul>
    </div>

    <div class="footer">
        <p>&copy; 2025 ${data.appName}. Minden jog fenntartva.</p>
        <p>Ez egy automatikusan generált email. Kérjük, ne válaszoljon rá.</p>
    </div>
</body>
</html>
    `.trim();
  }

  /**
   * Checks if email service is properly configured
   * @returns boolean indicating configuration status
   */
  isEmailConfigured(): boolean {
    return this.isConfigured;
  }
}
