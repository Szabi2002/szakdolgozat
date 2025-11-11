import { Injectable, Logger } from '@nestjs/common';
import * as QRCode from 'qrcode';
import * as crypto from 'crypto';

export interface QRCodeData {
  ticketId: string;
  userId: string;
  ticketType: string;
  validUntil: string;
  signature: string;
}

@Injectable()
export class QrCodeService {
  private readonly logger = new Logger(QrCodeService.name);
  private readonly SECRET_KEY = process.env.QR_CODE_SECRET || 'default-secret-key-change-in-production';

  /**
   * Generates a signature for QR code data to prevent tampering
   * @param data - The data to sign
   * @returns HMAC signature
   */
  private generateSignature(data: Omit<QRCodeData, 'signature'>): string {
    const dataString = JSON.stringify(data);
    return crypto
      .createHmac('sha256', this.SECRET_KEY)
      .update(dataString)
      .digest('hex');
  }

  /**
   * Verifies the signature of QR code data
   * @param data - The QR code data with signature
   * @returns boolean indicating if signature is valid
   */
  verifySignature(data: QRCodeData): boolean {
    const { signature, ...dataWithoutSignature } = data;
    const expectedSignature = this.generateSignature(dataWithoutSignature);
    return signature === expectedSignature;
  }

  /**
   * Creates QR code data object with signature
   * @param ticketId - UUID of the ticket
   * @param userId - UUID of the user
   * @param ticketType - Type of ticket (single, return, day, monthly, yearly)
   * @param validUntil - ISO string of expiration date
   * @returns QRCodeData object with signature
   */
  createQRCodeData(
    ticketId: string,
    userId: string,
    ticketType: string,
    validUntil: string,
  ): QRCodeData {
    const dataWithoutSignature = {
      ticketId,
      userId,
      ticketType,
      validUntil,
    };

    const signature = this.generateSignature(dataWithoutSignature);

    return {
      ...dataWithoutSignature,
      signature,
    };
  }

  /**
   * Generates a QR code as a base64 encoded PNG image
   * @param data - The data to encode in the QR code
   * @returns Promise<string> - Base64 encoded PNG image (data URL)
   */
  async generateQRCode(data: QRCodeData): Promise<string> {
    try {
      const jsonString = JSON.stringify(data);

      // Generate QR code as data URL (base64)
      const qrCodeDataUrl = await QRCode.toDataURL(jsonString, {
        errorCorrectionLevel: 'H', // High error correction
        type: 'image/png',
        width: 400,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });

      this.logger.debug(`QR code generated for ticket: ${data.ticketId}`);
      return qrCodeDataUrl;
    } catch (error) {
      this.logger.error(`Failed to generate QR code: ${error.message}`, error.stack);
      throw new Error('QR code generation failed');
    }
  }

  /**
   * Generates a QR code as a Buffer (raw image data)
   * Useful for sending via email or saving to file
   * @param data - The data to encode in the QR code
   * @returns Promise<Buffer> - PNG image buffer
   */
  async generateQRCodeBuffer(data: QRCodeData): Promise<Buffer> {
    try {
      const jsonString = JSON.stringify(data);

      // Generate QR code as buffer
      const buffer = await QRCode.toBuffer(jsonString, {
        errorCorrectionLevel: 'H',
        type: 'png',
        width: 400,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });

      this.logger.debug(`QR code buffer generated for ticket: ${data.ticketId}`);
      return buffer;
    } catch (error) {
      this.logger.error(`Failed to generate QR code buffer: ${error.message}`, error.stack);
      throw new Error('QR code buffer generation failed');
    }
  }

  /**
   * Decodes and verifies QR code data
   * @param qrCodeString - JSON string from scanned QR code
   * @returns Parsed and verified QRCodeData or null if invalid
   */
  decodeAndVerifyQRCode(qrCodeString: string): QRCodeData | null {
    try {
      const data = JSON.parse(qrCodeString) as QRCodeData;

      // Verify signature
      if (!this.verifySignature(data)) {
        this.logger.warn(`Invalid QR code signature for ticket: ${data.ticketId}`);
        return null;
      }

      // Check if ticket is still valid
      const validUntilDate = new Date(data.validUntil);
      const now = new Date();

      if (validUntilDate < now) {
        this.logger.warn(`Expired ticket scanned: ${data.ticketId}`);
        return null;
      }

      return data;
    } catch (error) {
      this.logger.error(`Failed to decode QR code: ${error.message}`);
      return null;
    }
  }
}
