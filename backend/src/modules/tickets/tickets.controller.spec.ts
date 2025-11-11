import { Test, TestingModule } from '@nestjs/testing';
import { TicketsController } from './tickets.controller';
import { TicketsService } from './tickets.service';
import { AuthGuard } from '@common/guards/auth.guard';
import { Response } from 'express';

describe('TicketsController', () => {
  let controller: TicketsController;
  let service: TicketsService;

  const mockTicketsService = {
    purchase: jest.fn(),
    findByUserId: jest.fn(),
    findActiveByUserId: jest.fn(),
    findOne: jest.fn(),
    getQRCodeBuffer: jest.fn(),
    sendEmail: jest.fn(),
    cancel: jest.fn(),
  };

  const mockAuthGuard = {
    canActivate: jest.fn(() => true),
  };

  const mockRequest = {
    user: {
      id: '123e4567-e89b-12d3-a456-426614174000',
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TicketsController],
      providers: [
        {
          provide: TicketsService,
          useValue: mockTicketsService,
        },
        {
          provide: AuthGuard,
          useValue: mockAuthGuard,
        },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue(mockAuthGuard)
      .compile();

    controller = module.get<TicketsController>(TicketsController);
    service = module.get<TicketsService>(TicketsService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('purchase', () => {
    it('should purchase a ticket', async () => {
      const purchaseDto = {
        ticketTypeId: '123e4567-e89b-12d3-a456-426614174001',
      };

      const mockTicket = {
        id: '123e4567-e89b-12d3-a456-426614174002',
        user_id: mockRequest.user.id,
        ticket_type_id: purchaseDto.ticketTypeId,
        status: 'active',
      };

      mockTicketsService.purchase.mockResolvedValue(mockTicket);

      const result = await controller.purchase(mockRequest, purchaseDto);

      expect(result).toEqual(mockTicket);
      expect(service.purchase).toHaveBeenCalledWith(mockRequest.user.id, purchaseDto);
    });
  });

  describe('getMyTickets', () => {
    it('should return all user tickets', async () => {
      const mockTickets = [
        { id: '1', user_id: mockRequest.user.id, status: 'active' },
        { id: '2', user_id: mockRequest.user.id, status: 'expired' },
      ];

      mockTicketsService.findByUserId.mockResolvedValue(mockTickets);

      const result = await controller.getMyTickets(mockRequest);

      expect(result).toEqual(mockTickets);
      expect(service.findByUserId).toHaveBeenCalledWith(mockRequest.user.id);
    });
  });

  describe('getMyActiveTickets', () => {
    it('should return active user tickets', async () => {
      const mockTickets = [{ id: '1', user_id: mockRequest.user.id, status: 'active' }];

      mockTicketsService.findActiveByUserId.mockResolvedValue(mockTickets);

      const result = await controller.getMyActiveTickets(mockRequest);

      expect(result).toEqual(mockTickets);
      expect(service.findActiveByUserId).toHaveBeenCalledWith(mockRequest.user.id);
    });
  });

  describe('findOne', () => {
    it('should return a ticket by ID', async () => {
      const ticketId = '123e4567-e89b-12d3-a456-426614174001';
      const mockTicket = {
        id: ticketId,
        user_id: mockRequest.user.id,
      };

      mockTicketsService.findOne.mockResolvedValue(mockTicket);

      const result = await controller.findOne(mockRequest, ticketId);

      expect(result).toEqual(mockTicket);
      expect(service.findOne).toHaveBeenCalledWith(ticketId, mockRequest.user.id);
    });
  });

  describe('getQRCode', () => {
    it('should return QR code image', async () => {
      const ticketId = '123e4567-e89b-12d3-a456-426614174001';
      const mockBuffer = Buffer.from('fake-qr-code');

      mockTicketsService.getQRCodeBuffer.mockResolvedValue(mockBuffer);

      const mockResponse = {
        setHeader: jest.fn(),
        send: jest.fn(),
      } as unknown as Response;

      await controller.getQRCode(mockRequest, ticketId, mockResponse);

      expect(service.getQRCodeBuffer).toHaveBeenCalledWith(ticketId, mockRequest.user.id);
      expect(mockResponse.setHeader).toHaveBeenCalledWith('Content-Type', 'image/png');
      expect(mockResponse.send).toHaveBeenCalledWith(mockBuffer);
    });
  });

  describe('sendEmail', () => {
    it('should send email successfully', async () => {
      const ticketId = '123e4567-e89b-12d3-a456-426614174001';
      const mockResult = {
        success: true,
        message: 'Email sent',
      };

      mockTicketsService.sendEmail.mockResolvedValue(mockResult);

      const result = await controller.sendEmail(mockRequest, ticketId);

      expect(result).toEqual(mockResult);
      expect(service.sendEmail).toHaveBeenCalledWith(ticketId, mockRequest.user.id);
    });
  });

  describe('cancel', () => {
    it('should cancel a ticket', async () => {
      const ticketId = '123e4567-e89b-12d3-a456-426614174001';

      mockTicketsService.cancel.mockResolvedValue(undefined);

      await controller.cancel(mockRequest, ticketId);

      expect(service.cancel).toHaveBeenCalledWith(ticketId, mockRequest.user.id);
    });
  });
});
