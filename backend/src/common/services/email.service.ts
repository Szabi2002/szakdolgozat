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
      const hasHost = !!host;
      const hasPort = !!port;
      const hasUser = !!user;
      const hasPass = !!pass;
      const hasFrom = !!from;

      this.logger.log(`SMTP Config check: Host=${hasHost}, Port=${hasPort}, User=${hasUser}, Pass=${hasPass}, From=${hasFrom}`);
      this.logger.log(`SMTP Host value: ${host}`); // Temporary debug

      if (!host || !port || !user || !pass || !from) {
        this.logger.warn(
          'SMTP configuration is missing. Email sending will be simulated. ' +
          'Please configure SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, and SMTP_FROM in .env',
        );
        this.logger.warn(`Missing: ${!host ? 'HOST ' : ''}${!port ? 'PORT ' : ''}${!user ? 'USER ' : ''}${!pass ? 'PASS ' : ''}${!from ? 'FROM ' : ''}`);
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
  ): Promise<{ success: boolean; message: string; link?: string }> {
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
          link: verificationLink,
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
        link: verificationLink,
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
  /**
   * Creates an HTML email template for email verification
   * Design matches the application aesthetic (Teal/Mint #00a887)
   */
  private createVerificationEmailTemplate(data: {
    userName: string;
    verificationLink: string;
    appName: string;
  }): string {
    const primaryColor = '#00a887'; // From design.md
    const backgroundColor = '#f3f4f6';
    const surfaceColor = '#ffffff';
    const textColor = '#1f2937';
    const secondaryTextColor = '#6b7280';

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Email megerősítés</title>
</head>
<body style="margin: 0; padding: 0; background-color: ${backgroundColor}; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                <!-- Card Container -->
                <table role="presentation" width="100%" style="max-width: 600px; background-color: ${surfaceColor}; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
                    
                    <!-- Header with Logo/Icon -->
                    <tr>
                        <td align="center" style="background-color: ${primaryColor}; padding: 40px 0;">
                            <div style="background-color: rgba(255, 255, 255, 0.2); width: 64px; height: 64px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-bottom: 16px;">
                                <!-- Simple Bus Icon -->
                                <img src="https://img.icons8.com/ios-filled/50/ffffff/bus.png" alt="Bus" width="32" height="32" style="display: block; margin: 0 auto; padding-top: 16px;" />
                            </div>
                            <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: 0.5px;">${data.appName}</h1>
                        </td>
                    </tr>

                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px 40px;">
                            <h2 style="margin: 0 0 24px; color: ${textColor}; font-size: 20px; font-weight: 600;">Kedves ${data.userName}!</h2>
                            
                            <p style="margin: 0 0 24px; color: ${secondaryTextColor}; font-size: 16px; line-height: 1.6;">
                                Köszönjük, hogy csatlakozott a <strong>${data.appName}</strong> közösséghez! A regisztráció befejezéséhez kérjük, erősítse meg email címét az alábbi gombra kattintva.
                            </p>

                            <!-- CTA Button -->
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                                <tr>
                                    <td align="center" style="padding: 12px 0 32px;">
                                        <a href="${data.verificationLink}" target="_blank" style="background-color: ${primaryColor}; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block; transition: background-color 0.2s;">
                                            Email cím megerősítése
                                        </a>
                                    </td>
                                </tr>
                            </table>

                            <div style="background-color: #f9fafb; border-left: 4px solid ${primaryColor}; padding: 16px; border-radius: 4px; margin-bottom: 24px;">
                                <p style="margin: 0; color: ${secondaryTextColor}; font-size: 14px;">
                                    <strong>Fontos:</strong> A link 24 óráig érvényes. Ha nem Ön regisztrált, kérjük hagyja figyelmen kívül ezt az emailt.
                                </p>
                            </div>

                            <p style="margin: 0; color: ${secondaryTextColor}; font-size: 14px; line-height: 1.5;">
                                Ha a gomb nem működik, másolja be az alábbi linket a böngészőjébe:<br>
                                <a href="${data.verificationLink}" style="color: ${primaryColor}; text-decoration: none; word-break: break-all;">${data.verificationLink}</a>
                            </p>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f9fafb; padding: 24px 40px; text-align: center; border-top: 1px solid #e5e7eb;">
                            <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                                &copy; ${new Date().getFullYear()} ${data.appName}. Minden jog fenntartva.
                            </p>
                            <p style="margin: 8px 0 0; color: #9ca3af; font-size: 12px;">
                                Ez egy automatikus üzenet, kérjük ne válaszoljon rá.
                            </p>
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
