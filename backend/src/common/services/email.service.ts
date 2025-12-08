import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';
import { Ticket } from '@modules/tickets/entities/ticket.entity';
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
   * Sends a ticket confirmation email with QR code and optional PDF attachment
   * @param ticket - Ticket details
   * @param user - User details
   * @param qrCodeBuffer - QR code as Buffer (PNG image)
   * @param pdfBuffer - Optional PDF ticket as Buffer
   * @returns Promise with success status and message
   */
  async sendTicketEmail(
    ticket: Ticket,
    user: User,
    qrCodeBuffer: Buffer,
    pdfBuffer?: Buffer,
  ): Promise<{ success: boolean; message: string }> {
    try {
      // If not configured, simulate email sending
      if (!this.isConfigured || !this.transporter) {
        this.logger.log(`[SIMULATION] Email would be sent to: ${user.email}`);
        this.logger.log(`[SIMULATION] Ticket ID: ${ticket.id}`);
        this.logger.log(`[SIMULATION] QR Code size: ${qrCodeBuffer.length} bytes`);
        if (pdfBuffer) {
          this.logger.log(`[SIMULATION] PDF size: ${pdfBuffer.length} bytes`);
        }
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

      // Prepare attachments
      const attachments: any[] = [
        {
          filename: `ticket-qr-${ticket.id}.png`,
          content: qrCodeBuffer,
          contentType: 'image/png',
          cid: 'qrcode', // Content ID for embedding in HTML
        },
      ];

      // Add PDF attachment if provided
      if (pdfBuffer) {
        attachments.push({
          filename: `ticket-${ticket.id}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        });
      }

      // Send email with attachments
      const info = await this.transporter.sendMail({
        from: `"${appName}" <${from}>`,
        to: user.email,
        subject: `Jegyének megerősítése - ${appName}`,
        text: textContent,
        html: htmlContent,
        attachments,
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

  /**
   * Sends a verification email with a verification link
   * @param email - User's email address
   * @param name - User's name
   * @param verificationLink - Full verification link URL
   * @returns Promise with success status and message
   */
  async sendVerificationEmail(
    email: string,
    name: string,
    verificationLink: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      const appName = 'Közlekedési Jegykezelő';

      // If not configured, log verification link to console
      if (!this.isConfigured || !this.transporter) {
        this.logger.log('='.repeat(80));
        this.logger.log('[EMAIL SIMULATION MODE - SMTP NOT CONFIGURED]');
        this.logger.log('='.repeat(80));
        this.logger.log(`Email would be sent to: ${email}`);
        this.logger.log(`User name: ${name}`);
        this.logger.log(`\nVERIFICATION LINK (click or copy-paste):`);
        this.logger.log(`\n${verificationLink}\n`);
        this.logger.log('='.repeat(80));
        this.logger.log('To send real emails, configure SMTP settings in .env:');
        this.logger.log('  SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM');
        this.logger.log('='.repeat(80));
        return {
          success: true,
          message: 'Verification email logged to console (simulation mode - configure SMTP to send real emails)',
        };
      }

      const from = this.configService.get<string>('SMTP_FROM');

      // Create HTML email template
      const htmlContent = this.createVerificationEmailTemplate({
        userName: name,
        verificationLink,
        appName,
      });

      // Create plain text version
      const textContent = `
Tisztelt ${name}!

Köszönjük, hogy regisztrált a ${appName} alkalmazásban!

Az email cím megerősítéséhez kérjük, kattintson az alábbi linkre:

${verificationLink}

A link 24 óráig érvényes.

Ha Ön nem regisztrált az alkalmazásban, kérjük, hagyja figyelmen kívül ezt az emailt.

Üdvözlettel,
${appName} csapata
      `.trim();

      // Send email
      const info = await this.transporter.sendMail({
        from: `"${appName}" <${from}>`,
        to: email,
        subject: `Email cím megerősítése - ${appName}`,
        text: textContent,
        html: htmlContent,
      });

      this.logger.log(`Verification email sent successfully to ${email}. Message ID: ${info.messageId}`);

      return {
        success: true,
        message: 'Verification email sent successfully',
      };
    } catch (error) {
      this.logger.error(`Failed to send verification email to ${email}:`, error);
      // Non-critical error - log and return success to not block registration
      this.logger.log(`Verification link: ${verificationLink}`);
      return {
        success: false,
        message: 'Failed to send verification email, but link was logged',
      };
    }
  }

  /**
   * Creates an HTML email template for email verification
   * @param data - Template data
   * @returns HTML string
   */
  private createVerificationEmailTemplate(data: {
    userName: string;
    verificationLink: string;
    appName: string;
  }): string {
    return `
<!DOCTYPE html>
<html lang="hu">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Email megerősítés</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            background-color: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .header {
            background-color: #1976d2;
            color: white;
            padding: 30px 20px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
        }
        .content {
            padding: 30px;
        }
        .content h2 {
            color: #1976d2;
            margin-top: 0;
        }
        .button-container {
            text-align: center;
            margin: 30px 0;
        }
        .button {
            display: inline-block;
            background-color: #1976d2;
            color: white !important;
            padding: 15px 40px;
            text-decoration: none;
            border-radius: 5px;
            font-weight: bold;
            font-size: 16px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
        .button:hover {
            background-color: #1565c0;
        }
        .info-box {
            background-color: #e3f2fd;
            border-left: 4px solid #1976d2;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
        }
        .footer {
            background-color: #f9f9f9;
            padding: 20px;
            text-align: center;
            color: #666;
            font-size: 12px;
            border-top: 1px solid #eee;
        }
        .link-text {
            word-break: break-all;
            background-color: #f5f5f5;
            padding: 10px;
            border-radius: 4px;
            font-family: monospace;
            font-size: 12px;
            margin-top: 15px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>${data.appName}</h1>
        </div>

        <div class="content">
            <h2>Üdvözöljük, ${data.userName}!</h2>

            <p>Köszönjük, hogy regisztrált a <strong>${data.appName}</strong> alkalmazásban!</p>

            <p>Az email cím megerősítéséhez kérjük, kattintson az alábbi gombra:</p>

            <div class="button-container">
                <a href="${data.verificationLink}" class="button">Email cím megerősítése</a>
            </div>

            <div class="info-box">
                <strong>Fontos információk:</strong>
                <ul style="margin: 10px 0; padding-left: 20px;">
                    <li>A megerősítő link 24 óráig érvényes</li>
                    <li>Ha Ön nem regisztrált az alkalmazásban, kérjük, hagyja figyelmen kívül ezt az emailt</li>
                    <li>Biztonsági okokból ne ossza meg ezt a linket senkivel</li>
                </ul>
            </div>

            <p style="margin-top: 30px; font-size: 14px; color: #666;">
                Ha a fenti gomb nem működik, másolja be az alábbi linket a böngészőjébe:
            </p>
            <div class="link-text">${data.verificationLink}</div>
        </div>

        <div class="footer">
            <p>&copy; 2025 ${data.appName}. Minden jog fenntartva.</p>
            <p>Ez egy automatikusan generált email. Kérjük, ne válaszoljon rá.</p>
        </div>
    </div>
</body>
</html>
    `.trim();
  }
}
