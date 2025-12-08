import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';

/**
 * Email service for email verification
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
   * Persian Blue Dark Theme - Email client compatible version
   * Uses table-based layout and inline styles for maximum compatibility
   * @param data - Template data
   * @returns HTML string
   */
  private createVerificationEmailTemplate(data: {
    userName: string;
    verificationLink: string;
    appName: string;
  }): string {
    return `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Email megerősítés</title>
</head>
<body style="margin: 0; padding: 0; background-color: #1a184e; font-family: 'Segoe UI', Arial, Helvetica, sans-serif;">
    <!-- Outer wrapper table -->
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #1a184e;">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                <!-- Main content table -->
                <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="background-color: #292986; border-radius: 16px; border: 1px solid #3c36d4;">

                    <!-- Header -->
                    <tr>
                        <td align="center" style="background-color: #292986; padding: 40px 30px; border-bottom: 1px solid #3c36d4; border-radius: 16px 16px 0 0;">
                            <!-- Bus Icon -->
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                                <tr>
                                    <td align="center" style="background-color: #5b64f9; width: 64px; height: 64px; border-radius: 16px;">
                                        <img src="https://img.icons8.com/ios-filled/50/edf2ff/bus.png" alt="Bus" width="36" height="36" style="display: block;" />
                                    </td>
                                </tr>
                            </table>
                            <h1 style="margin: 16px 0 0 0; font-size: 26px; font-weight: 700; color: #edf2ff; letter-spacing: 0.5px;">${data.appName}</h1>
                            <p style="margin: 8px 0 0 0; font-size: 14px; color: #a0b5ff;">Tömegközlekedési jegykezelő rendszer</p>
                        </td>
                    </tr>

                    <!-- Content -->
                    <tr>
                        <td style="background-color: #1a184e; padding: 40px 30px;">
                            <h2 style="margin: 0 0 20px 0; font-size: 22px; font-weight: 600; color: #7a8bff;">Üdvözöljük, ${data.userName}!</h2>

                            <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.6; color: #c4d2ff;">
                                Köszönjük, hogy regisztrált a <strong style="color: #edf2ff;">${data.appName}</strong> alkalmazásban!
                            </p>

                            <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.6; color: #c4d2ff;">
                                Az email cím megerősítéséhez kérjük, kattintson az alábbi gombra:
                            </p>

                            <!-- Button -->
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 35px 0;">
                                <tr>
                                    <td align="center">
                                        <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                                            <tr>
                                                <td align="center" style="background-color: #5b64f9; border-radius: 12px;">
                                                    <a href="${data.verificationLink}" target="_blank" style="display: inline-block; padding: 16px 48px; font-size: 16px; font-weight: 600; color: #ffffff; text-decoration: none; letter-spacing: 0.5px;">
                                                        Email cím megerősítése
                                                    </a>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>

                            <!-- Info box -->
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 25px 0;">
                                <tr>
                                    <td style="background-color: #292986; border-left: 4px solid #7a8bff; border-radius: 0 8px 8px 0; padding: 20px;">
                                        <strong style="font-size: 14px; color: #7a8bff; text-transform: uppercase; letter-spacing: 0.5px;">FONTOS INFORMÁCIÓK</strong>
                                        <ul style="margin: 12px 0 0 0; padding-left: 20px; color: #a0b5ff; font-size: 14px; line-height: 1.8;">
                                            <li>A megerősítő link 24 óráig érvényes</li>
                                            <li>Ha Ön nem regisztrált az alkalmazásban, kérjük, hagyja figyelmen kívül ezt az emailt</li>
                                            <li>Biztonsági okokból ne ossza meg ezt a linket senkivel</li>
                                        </ul>
                                    </td>
                                </tr>
                            </table>

                            <!-- Link section -->
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top: 30px; border-top: 1px solid #3c36d4; padding-top: 20px;">
                                <tr>
                                    <td>
                                        <p style="margin: 0 0 12px 0; font-size: 13px; color: #a0b5ff;">
                                            Ha a fenti gomb nem működik, másolja be az alábbi linket a böngészőjébe:
                                        </p>
                                        <p style="margin: 0; padding: 14px; background-color: #292986; border-radius: 8px; border: 1px solid #3c36d4; font-family: Consolas, Monaco, monospace; font-size: 12px; color: #7a8bff; word-break: break-all;">
                                            ${data.verificationLink}
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td align="center" style="background-color: #1a184e; padding: 25px 30px; border-top: 1px solid #3c36d4; border-radius: 0 0 16px 16px;">
                            <p style="margin: 0 0 8px 0; font-size: 12px; color: #c4d2ff;">&copy; 2025 ${data.appName}. Minden jog fenntartva.</p>
                            <p style="margin: 0; font-size: 12px; color: #a0b5ff;">Ez egy automatikusan generált email. Kérjük, ne válaszoljon rá.</p>
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    `.trim();
  }
}
