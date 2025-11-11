import { Test, TestingModule } from '@nestjs/testing';
import { QrCodeService, QRCodeData } from './qr-code.service';

describe('QrCodeService', () => {
  let service: QrCodeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [QrCodeService],
    }).compile();

    service = module.get<QrCodeService>(QrCodeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createQRCodeData', () => {
    it('should create QR code data with signature', () => {
      const ticketId = '123e4567-e89b-12d3-a456-426614174000';
      const userId = '123e4567-e89b-12d3-a456-426614174001';
      const ticketType = 'single';
      const validUntil = new Date('2025-12-31').toISOString();

      const result = service.createQRCodeData(ticketId, userId, ticketType, validUntil);

      expect(result).toHaveProperty('ticketId', ticketId);
      expect(result).toHaveProperty('userId', userId);
      expect(result).toHaveProperty('ticketType', ticketType);
      expect(result).toHaveProperty('validUntil', validUntil);
      expect(result).toHaveProperty('signature');
      expect(typeof result.signature).toBe('string');
      expect(result.signature.length).toBeGreaterThan(0);
    });
  });

  describe('verifySignature', () => {
    it('should verify valid signature', () => {
      const data = service.createQRCodeData(
        '123e4567-e89b-12d3-a456-426614174000',
        '123e4567-e89b-12d3-a456-426614174001',
        'single',
        new Date('2025-12-31').toISOString(),
      );

      const isValid = service.verifySignature(data);
      expect(isValid).toBe(true);
    });

    it('should reject invalid signature', () => {
      const data = service.createQRCodeData(
        '123e4567-e89b-12d3-a456-426614174000',
        '123e4567-e89b-12d3-a456-426614174001',
        'single',
        new Date('2025-12-31').toISOString(),
      );

      // Tamper with the data
      data.signature = 'invalid-signature';

      const isValid = service.verifySignature(data);
      expect(isValid).toBe(false);
    });

    it('should reject tampered data', () => {
      const data = service.createQRCodeData(
        '123e4567-e89b-12d3-a456-426614174000',
        '123e4567-e89b-12d3-a456-426614174001',
        'single',
        new Date('2025-12-31').toISOString(),
      );

      const originalSignature = data.signature;

      // Tamper with ticket type
      data.ticketType = 'monthly';
      data.signature = originalSignature; // Keep original signature

      const isValid = service.verifySignature(data);
      expect(isValid).toBe(false);
    });
  });

  describe('generateQRCode', () => {
    it('should generate base64 QR code', async () => {
      const data = service.createQRCodeData(
        '123e4567-e89b-12d3-a456-426614174000',
        '123e4567-e89b-12d3-a456-426614174001',
        'single',
        new Date('2025-12-31').toISOString(),
      );

      const qrCode = await service.generateQRCode(data);

      expect(qrCode).toBeDefined();
      expect(typeof qrCode).toBe('string');
      expect(qrCode).toMatch(/^data:image\/png;base64,/);
    });

    it('should generate different QR codes for different data', async () => {
      const data1 = service.createQRCodeData(
        '123e4567-e89b-12d3-a456-426614174000',
        '123e4567-e89b-12d3-a456-426614174001',
        'single',
        new Date('2025-12-31').toISOString(),
      );

      const data2 = service.createQRCodeData(
        '123e4567-e89b-12d3-a456-426614174002',
        '123e4567-e89b-12d3-a456-426614174003',
        'monthly',
        new Date('2025-12-31').toISOString(),
      );

      const qrCode1 = await service.generateQRCode(data1);
      const qrCode2 = await service.generateQRCode(data2);

      expect(qrCode1).not.toBe(qrCode2);
    });
  });

  describe('generateQRCodeBuffer', () => {
    it('should generate QR code buffer', async () => {
      const data = service.createQRCodeData(
        '123e4567-e89b-12d3-a456-426614174000',
        '123e4567-e89b-12d3-a456-426614174001',
        'single',
        new Date('2025-12-31').toISOString(),
      );

      const buffer = await service.generateQRCodeBuffer(data);

      expect(buffer).toBeDefined();
      expect(Buffer.isBuffer(buffer)).toBe(true);
      expect(buffer.length).toBeGreaterThan(0);
    });
  });

  describe('decodeAndVerifyQRCode', () => {
    it('should decode and verify valid QR code', () => {
      const data = service.createQRCodeData(
        '123e4567-e89b-12d3-a456-426614174000',
        '123e4567-e89b-12d3-a456-426614174001',
        'single',
        new Date('2099-12-31').toISOString(), // Far future date
      );

      const jsonString = JSON.stringify(data);
      const decoded = service.decodeAndVerifyQRCode(jsonString);

      expect(decoded).not.toBeNull();
      expect(decoded?.ticketId).toBe(data.ticketId);
      expect(decoded?.userId).toBe(data.userId);
    });

    it('should reject expired ticket', () => {
      const data = service.createQRCodeData(
        '123e4567-e89b-12d3-a456-426614174000',
        '123e4567-e89b-12d3-a456-426614174001',
        'single',
        new Date('2020-01-01').toISOString(), // Past date
      );

      const jsonString = JSON.stringify(data);
      const decoded = service.decodeAndVerifyQRCode(jsonString);

      expect(decoded).toBeNull();
    });

    it('should reject invalid signature', () => {
      const data = service.createQRCodeData(
        '123e4567-e89b-12d3-a456-426614174000',
        '123e4567-e89b-12d3-a456-426614174001',
        'single',
        new Date('2099-12-31').toISOString(),
      );

      data.signature = 'tampered-signature';

      const jsonString = JSON.stringify(data);
      const decoded = service.decodeAndVerifyQRCode(jsonString);

      expect(decoded).toBeNull();
    });

    it('should reject invalid JSON', () => {
      const decoded = service.decodeAndVerifyQRCode('invalid-json{');
      expect(decoded).toBeNull();
    });
  });
});
