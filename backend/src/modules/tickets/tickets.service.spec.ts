import { Test, TestingModule } from '@nestjs/testing';
import { TicketsService } from './tickets.service';
import { SupabaseService } from '@common/supabase/supabase.service';
import { QrCodeService } from '@common/services/qr-code.service';
import { EmailService } from '@common/services/email.service';
import { PdfService } from '@common/services/pdf.service';
import { TransactionsService } from '@modules/transactions/transactions.service';
import { TicketTypesService } from '@modules/ticket-types/ticket-types.service';
import { UsersService } from '@modules/users/users.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('TicketsService', () => {
  let service: TicketsService;
  let supabaseService: SupabaseService;
  let qrCodeService: QrCodeService;
  let emailService: EmailService;
  let pdfService: PdfService;
  let transactionsService: TransactionsService;
  let ticketTypesService: TicketTypesService;
  let usersService: UsersService;

  const mockSupabaseClient = {
    from: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    single: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    lt: jest.fn().mockReturnThis(),
  };

  const mockSupabaseService = {
    getClient: jest.fn(() => mockSupabaseClient),
    getUserClient: jest.fn(() => mockSupabaseClient),
    getAdminClient: jest.fn(() => mockSupabaseClient),
  };

  const mockQrCodeService = {
    createQRCodeData: jest.fn(),
    generateQRCode: jest.fn(),
    generateQRCodeBuffer: jest.fn(),
  };

  const mockEmailService = {
    sendTicketEmail: jest.fn(),
    isEmailConfigured: jest.fn(),
  };

  const mockPdfService = {
    generateTicketPDF: jest.fn(),
  };

  const mockTransactionsService = {
    simulatePayment: jest.fn(),
    create: jest.fn(),
    updateWithTicketId: jest.fn(),
  };

  const mockTicketTypesService = {
    findOne: jest.fn(),
  };

  const mockUsersService = {
    findById: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TicketsService,
        {
          provide: SupabaseService,
          useValue: mockSupabaseService,
        },
        {
          provide: QrCodeService,
          useValue: mockQrCodeService,
        },
        {
          provide: EmailService,
          useValue: mockEmailService,
        },
        {
          provide: PdfService,
          useValue: mockPdfService,
        },
        {
          provide: TransactionsService,
          useValue: mockTransactionsService,
        },
        {
          provide: TicketTypesService,
          useValue: mockTicketTypesService,
        },
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    service = module.get<TicketsService>(TicketsService);
    supabaseService = module.get<SupabaseService>(SupabaseService);
    qrCodeService = module.get<QrCodeService>(QrCodeService);
    emailService = module.get<EmailService>(EmailService);
    pdfService = module.get<PdfService>(PdfService);
    transactionsService = module.get<TransactionsService>(TransactionsService);
    ticketTypesService = module.get<TicketTypesService>(TicketTypesService);
    usersService = module.get<UsersService>(UsersService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('purchase', () => {
    it('should purchase a ticket successfully', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const purchaseDto = {
        ticket_type_id: '123e4567-e89b-12d3-a456-426614174001',
      };

      const mockTicketType = {
        id: purchaseDto.ticket_type_id,
        name: 'Single Ticket',
        type: 'single',
        price: 350.0,
        validity_hours: 1.5,
        is_active: true,
      };

      const mockTransaction = {
        id: '123e4567-e89b-12d3-a456-426614174002',
        user_id: userId,
        amount: 350.0,
        status: 'completed',
      };

      const mockTicket = {
        id: '123e4567-e89b-12d3-a456-426614174003',
        user_id: userId,
        ticket_type_id: purchaseDto.ticket_type_id,
        qr_code: 'data:image/png;base64,abc123',
        price: 350.0,
        status: 'active',
      };

      mockTicketTypesService.findOne.mockResolvedValue(mockTicketType);
      mockTransactionsService.simulatePayment.mockResolvedValue({
        success: true,
        message: 'Payment successful',
      });
      mockTransactionsService.create.mockResolvedValue(mockTransaction);
      mockQrCodeService.createQRCodeData.mockReturnValue({
        ticketId: 'temp-id',
        userId,
        ticketType: 'single',
        validUntil: new Date().toISOString(),
        signature: 'abc123',
      });
      mockQrCodeService.generateQRCode.mockResolvedValue('data:image/png;base64,abc123');

      mockSupabaseClient.single.mockResolvedValueOnce({
        data: mockTicket,
        error: null,
      });

      mockSupabaseClient.single.mockResolvedValueOnce({
        data: mockTicket,
        error: null,
      });

      const result = await service.purchase(userId, purchaseDto);

      expect(result).toEqual(mockTicket);
      expect(mockTicketTypesService.findOne).toHaveBeenCalledWith(purchaseDto.ticket_type_id);
      expect(mockTransactionsService.simulatePayment).toHaveBeenCalledWith(350.0);
      expect(mockTransactionsService.create).toHaveBeenCalled();
    });

    it('should throw error if ticket type is inactive', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const purchaseDto = {
        ticket_type_id: '123e4567-e89b-12d3-a456-426614174001',
      };

      const mockTicketType = {
        id: purchaseDto.ticket_type_id,
        is_active: false,
      };

      mockTicketTypesService.findOne.mockResolvedValue(mockTicketType);

      await expect(service.purchase(userId, purchaseDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('findByUserId', () => {
    it('should return all tickets for a user', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const mockTickets = [
        {
          id: '1',
          user_id: userId,
          status: 'active',
        },
        {
          id: '2',
          user_id: userId,
          status: 'expired',
        },
      ];

      mockSupabaseClient.order.mockResolvedValue({
        data: mockTickets,
        error: null,
      });

      const result = await service.findByUserId(userId);

      expect(result).toEqual(mockTickets);
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('user_id', userId);
    });
  });

  describe('findOne', () => {
    it('should return a ticket by ID', async () => {
      const ticketId = '123e4567-e89b-12d3-a456-426614174001';
      const userId = '123e4567-e89b-12d3-a456-426614174000';

      const mockTicket = {
        id: ticketId,
        user_id: userId,
        status: 'active',
      };

      mockSupabaseClient.single.mockResolvedValue({
        data: mockTicket,
        error: null,
      });

      const result = await service.findOne(ticketId, userId);

      expect(result).toEqual(mockTicket);
    });

    it('should throw NotFoundException when ticket not found', async () => {
      mockSupabaseClient.single.mockResolvedValue({
        data: null,
        error: { message: 'Not found' },
      });

      await expect(service.findOne('invalid-id', 'user-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('cancel', () => {
    it('should cancel an active ticket', async () => {
      const ticketId = '123e4567-e89b-12d3-a456-426614174001';
      const userId = '123e4567-e89b-12d3-a456-426614174000';

      const mockTicket = {
        id: ticketId,
        user_id: userId,
        status: 'active',
      };

      // Mock the entire Supabase chain for findOne
      const mockSelectChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: mockTicket,
          error: null,
        }),
      };

      // Mock the entire Supabase chain for update
      const mockUpdateChain = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(), // First eq() returns this
      };

      // Second eq() returns the final promise
      mockUpdateChain.eq = jest.fn()
        .mockReturnValueOnce(mockUpdateChain) // First call returns chain
        .mockResolvedValueOnce({ data: null, error: null }); // Second call resolves

      // Mock from method to return appropriate chains
      const mockUserClient = {
        from: jest.fn()
          .mockReturnValueOnce(mockSelectChain) // First call for findOne
          .mockReturnValueOnce(mockUpdateChain), // Second call for update
      };

      mockSupabaseService.getClient.mockReturnValue(mockUserClient as any);

      await service.cancel(ticketId, userId);

      expect(mockUpdateChain.update).toHaveBeenCalledWith({ status: 'cancelled' });
    });

    it('should throw error when trying to cancel non-active ticket', async () => {
      const ticketId = '123e4567-e89b-12d3-a456-426614174001';
      const userId = '123e4567-e89b-12d3-a456-426614174000';

      const mockTicket = {
        id: ticketId,
        user_id: userId,
        status: 'expired',
      };

      const mockSelectChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: mockTicket,
          error: null,
        }),
      };

      const mockUserClient = {
        from: jest.fn().mockReturnValue(mockSelectChain),
      };

      mockSupabaseService.getClient.mockReturnValue(mockUserClient as any);

      await expect(service.cancel(ticketId, userId)).rejects.toThrow(BadRequestException);
    });
  });
});
