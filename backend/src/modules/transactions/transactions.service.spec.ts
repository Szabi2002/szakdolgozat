import { Test, TestingModule } from '@nestjs/testing';
import { TransactionsService } from './transactions.service';
import { SupabaseService } from '@common/supabase/supabase.service';

describe('TransactionsService', () => {
  let service: TransactionsService;
  let supabaseService: SupabaseService;

  const mockSupabaseClient = {
    from: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    single: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
  };

  const mockSupabaseService = {
    getClient: jest.fn(() => mockSupabaseClient),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionsService,
        {
          provide: SupabaseService,
          useValue: mockSupabaseService,
        },
      ],
    }).compile();

    service = module.get<TransactionsService>(TransactionsService);
    supabaseService = module.get<SupabaseService>(SupabaseService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a transaction successfully', async () => {
      const createDto = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        ticketId: '123e4567-e89b-12d3-a456-426614174001',
        amount: 350.0,
        paymentMethod: 'simulation',
      };

      const mockTransaction = {
        id: '123e4567-e89b-12d3-a456-426614174002',
        user_id: createDto.userId,
        ticket_id: createDto.ticketId,
        amount: createDto.amount,
        status: 'completed',
        payment_method: 'simulation',
        transaction_date: new Date().toISOString(),
        created_at: new Date().toISOString(),
      };

      mockSupabaseClient.single.mockResolvedValue({
        data: mockTransaction,
        error: null,
      });

      const result = await service.create(createDto);

      expect(result).toEqual(mockTransaction);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('transactions');
      expect(mockSupabaseClient.insert).toHaveBeenCalled();
    });

    it('should handle creation error', async () => {
      const createDto = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        amount: 350.0,
      };

      mockSupabaseClient.single.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });

      await expect(service.create(createDto)).rejects.toThrow();
    });
  });

  describe('findByUserId', () => {
    it('should return all transactions for a user', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const mockTransactions = [
        {
          id: '123e4567-e89b-12d3-a456-426614174001',
          user_id: userId,
          amount: 350.0,
          status: 'completed',
        },
        {
          id: '123e4567-e89b-12d3-a456-426614174002',
          user_id: userId,
          amount: 650.0,
          status: 'completed',
        },
      ];

      mockSupabaseClient.order.mockResolvedValue({
        data: mockTransactions,
        error: null,
      });

      const result = await service.findByUserId(userId);

      expect(result).toEqual(mockTransactions);
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('user_id', userId);
      expect(mockSupabaseClient.order).toHaveBeenCalledWith('transaction_date', {
        ascending: false,
      });
    });

    it('should return empty array when no transactions found', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';

      mockSupabaseClient.order.mockResolvedValue({
        data: [],
        error: null,
      });

      const result = await service.findByUserId(userId);

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return a transaction by ID', async () => {
      const transactionId = '123e4567-e89b-12d3-a456-426614174001';
      const userId = '123e4567-e89b-12d3-a456-426614174000';

      const mockTransaction = {
        id: transactionId,
        user_id: userId,
        amount: 350.0,
        status: 'completed',
      };

      mockSupabaseClient.single.mockResolvedValue({
        data: mockTransaction,
        error: null,
      });

      const result = await service.findOne(transactionId, userId);

      expect(result).toEqual(mockTransaction);
    });

    it('should return null when transaction not found', async () => {
      const transactionId = '123e4567-e89b-12d3-a456-426614174001';
      const userId = '123e4567-e89b-12d3-a456-426614174000';

      mockSupabaseClient.single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' },
      });

      const result = await service.findOne(transactionId, userId);

      expect(result).toBeNull();
    });
  });

  describe('simulatePayment', () => {
    it('should always return success', async () => {
      const result = await service.simulatePayment(350.0);

      expect(result.success).toBe(true);
      expect(result.message).toContain('simulation');
    });
  });

  describe('updateWithTicketId', () => {
    it('should update transaction with ticket ID', async () => {
      const transactionId = '123e4567-e89b-12d3-a456-426614174001';
      const ticketId = '123e4567-e89b-12d3-a456-426614174002';

      mockSupabaseClient.eq.mockResolvedValue({
        data: null,
        error: null,
      });

      await service.updateWithTicketId(transactionId, ticketId);

      expect(mockSupabaseClient.update).toHaveBeenCalledWith({ ticket_id: ticketId });
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('id', transactionId);
    });
  });
});
