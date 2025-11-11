import { Test, TestingModule } from '@nestjs/testing';
import { TicketTypesService } from './ticket-types.service';
import { SupabaseService } from '@common/supabase/supabase.service';
import { NotFoundException } from '@nestjs/common';

describe('TicketTypesService', () => {
  let service: TicketTypesService;
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
        TicketTypesService,
        {
          provide: SupabaseService,
          useValue: mockSupabaseService,
        },
      ],
    }).compile();

    service = module.get<TicketTypesService>(TicketTypesService);
    supabaseService = module.get<SupabaseService>(SupabaseService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a ticket type successfully', async () => {
      const createDto = {
        name: 'Single Ticket',
        description: 'Valid for 90 minutes',
        type: 'single' as const,
        price: 350.0,
        validityHours: 1.5,
        isActive: true,
      };

      const mockTicketType = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        ...createDto,
        validity_hours: 1.5,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      mockSupabaseClient.single.mockResolvedValue({
        data: mockTicketType,
        error: null,
      });

      const result = await service.create(createDto);

      expect(result).toEqual(mockTicketType);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('ticket_types');
    });

    it('should throw InternalServerErrorException on database error', async () => {
      const createDto = {
        name: 'Single Ticket',
        description: 'Valid for 90 minutes',
        type: 'single' as const,
        price: 350.0,
        validityHours: 1.5,
        isActive: true,
      };

      mockSupabaseClient.single.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });

      await expect(service.create(createDto)).rejects.toThrow(
        'Failed to create ticket type',
      );
    });
  });

  describe('findAll', () => {
    it('should return all active ticket types', async () => {
      const mockTicketTypes = [
        {
          id: '1',
          name: 'Single Ticket',
          type: 'single',
          price: 350.0,
          is_active: true,
        },
        {
          id: '2',
          name: 'Day Pass',
          type: 'day',
          price: 1650.0,
          is_active: true,
        },
      ];

      mockSupabaseClient.order.mockResolvedValue({
        data: mockTicketTypes,
        error: null,
      });

      const result = await service.findAll();

      expect(result).toEqual(mockTicketTypes);
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('is_active', true);
    });

    it('should throw InternalServerErrorException on database error', async () => {
      mockSupabaseClient.order.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });

      await expect(service.findAll()).rejects.toThrow('Failed to fetch ticket types');
    });
  });

  describe('findAllIncludingInactive', () => {
    it('should return all ticket types including inactive', async () => {
      const mockTicketTypes = [
        {
          id: '1',
          name: 'Single Ticket',
          type: 'single',
          price: 350.0,
          is_active: true,
        },
        {
          id: '2',
          name: 'Expired Pass',
          type: 'day',
          price: 1650.0,
          is_active: false,
        },
      ];

      mockSupabaseClient.order.mockResolvedValue({
        data: mockTicketTypes,
        error: null,
      });

      const result = await service.findAllIncludingInactive();

      expect(result).toEqual(mockTicketTypes);
      expect(result.length).toBe(2);
    });

    it('should throw InternalServerErrorException on database error', async () => {
      mockSupabaseClient.order.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });

      await expect(service.findAllIncludingInactive()).rejects.toThrow(
        'Failed to fetch all ticket types',
      );
    });
  });

  describe('findOne', () => {
    it('should return a ticket type by ID', async () => {
      const mockTicketType = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Single Ticket',
        type: 'single',
        price: 350.0,
      };

      mockSupabaseClient.single.mockResolvedValue({
        data: mockTicketType,
        error: null,
      });

      const result = await service.findOne('123e4567-e89b-12d3-a456-426614174000');

      expect(result).toEqual(mockTicketType);
    });

    it('should throw NotFoundException when ticket type not found', async () => {
      mockSupabaseClient.single.mockResolvedValue({
        data: null,
        error: { message: 'Not found' },
      });

      await expect(service.findOne('invalid-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a ticket type successfully', async () => {
      const updateDto = {
        name: 'Updated Single Ticket',
        price: 400.0,
      };

      const existingTicketType = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Single Ticket',
        type: 'single',
        price: 350.0,
      };

      const updatedTicketType = {
        ...existingTicketType,
        ...updateDto,
      };

      // Mock findOne
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: existingTicketType,
        error: null,
      });

      // Mock update
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: updatedTicketType,
        error: null,
      });

      const result = await service.update('123e4567-e89b-12d3-a456-426614174000', updateDto);

      expect(result.name).toBe(updateDto.name);
      expect(result.price).toBe(updateDto.price);
    });

    it('should throw NotFoundException when ticket type does not exist', async () => {
      mockSupabaseClient.single.mockResolvedValue({
        data: null,
        error: { message: 'Not found' },
      });

      await expect(service.update('invalid-id', { price: 400 })).rejects.toThrow(NotFoundException);
    });

    it('should throw InternalServerErrorException on update error', async () => {
      const existingTicketType = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Single Ticket',
      };

      // Mock findOne success
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: existingTicketType,
        error: null,
      });

      // Mock update error
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: null,
        error: { message: 'Update failed' },
      });

      await expect(
        service.update('123e4567-e89b-12d3-a456-426614174000', { price: 400 }),
      ).rejects.toThrow('Failed to update ticket type');
    });
  });

  describe('remove', () => {
    it('should soft delete a ticket type', async () => {
      const ticketType = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Single Ticket',
      };

      // Mock the entire Supabase chain for findOne
      const mockSelectChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: ticketType,
          error: null,
        }),
      };

      // Mock the entire Supabase chain for update
      const mockUpdateChain = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      };

      // Mock from method to return appropriate chains
      const mockClient = {
        from: jest.fn()
          .mockReturnValueOnce(mockSelectChain) // First call for findOne
          .mockReturnValueOnce(mockUpdateChain), // Second call for update
      };

      mockSupabaseService.getClient.mockReturnValue(mockClient as any);

      await service.remove('123e4567-e89b-12d3-a456-426614174000');

      expect(mockUpdateChain.update).toHaveBeenCalledWith({ is_active: false });
    });

    it('should throw NotFoundException when ticket type does not exist', async () => {
      // Mock the entire Supabase chain for findOne that throws NotFoundException
      const mockSelectChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Not found' },
        }),
      };

      const mockClient = {
        from: jest.fn().mockReturnValue(mockSelectChain),
      };

      mockSupabaseService.getClient.mockReturnValue(mockClient as any);

      await expect(service.remove('invalid-id')).rejects.toThrow(NotFoundException);
    });

    it('should throw InternalServerErrorException on delete error', async () => {
      const ticketType = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Single Ticket',
      };

      // Mock findOne success
      const mockSelectChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: ticketType,
          error: null,
        }),
      };

      // Mock delete error
      const mockUpdateChain = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Delete failed' },
        }),
      };

      const mockClient = {
        from: jest.fn()
          .mockReturnValueOnce(mockSelectChain)
          .mockReturnValueOnce(mockUpdateChain),
      };

      mockSupabaseService.getClient.mockReturnValue(mockClient as any);

      await expect(service.remove('123e4567-e89b-12d3-a456-426614174000')).rejects.toThrow(
        'Failed to delete ticket type',
      );
    });
  });
});
