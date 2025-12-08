import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { FavoritesService } from './favorites.service';
import { SupabaseService } from '@common/supabase/supabase.service';
import { CreateFavoriteDto } from './dto/create-favorite.dto';
import { UpdateFavoriteDto } from './dto/update-favorite.dto';

describe('FavoritesService', () => {
  let service: FavoritesService;
  let supabaseService: SupabaseService;

  const mockSupabaseClient = {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    single: jest.fn(),
  };

  const mockSupabaseService = {
    getClient: jest.fn(() => mockSupabaseClient),
  };

  const mockUserId = '123e4567-e89b-12d3-a456-426614174000';
  const mockFavoriteId = '223e4567-e89b-12d3-a456-426614174001';
  const mockFromStopId = '323e4567-e89b-12d3-a456-426614174002';
  const mockToStopId = '423e4567-e89b-12d3-a456-426614174003';

  const mockFavorite = {
    id: mockFavoriteId,
    user_id: mockUserId,
    name: 'Home to Work',
    from_stop_id: mockFromStopId,
    to_stop_id: mockToStopId,
    route_data: { routes: [], departureTime: '2025-01-13T10:00:00Z' },
    created_at: '2025-01-13T10:00:00.000Z',
    updated_at: '2025-01-13T10:00:00.000Z',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FavoritesService,
        {
          provide: SupabaseService,
          useValue: mockSupabaseService,
        },
      ],
    }).compile();

    service = module.get<FavoritesService>(FavoritesService);
    supabaseService = module.get<SupabaseService>(SupabaseService);

    // Reset all mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createFavoriteDto: CreateFavoriteDto = {
      name: 'Home to Work',
      from_stop_id: mockFromStopId,
      to_stop_id: mockToStopId,
      route_data: { routes: [] },
    };

    it('should create a favorite successfully', async () => {
      mockSupabaseClient.select.mockResolvedValueOnce({
        count: 5,
        error: null,
      });

      mockSupabaseClient.single.mockResolvedValueOnce({
        data: mockFavorite,
        error: null,
      });

      const result = await service.create(mockUserId, createFavoriteDto);

      expect(result).toEqual(mockFavorite);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('favorite_routes');
    });

    it('should throw BadRequestException if from and to stops are the same', async () => {
      const invalidDto = {
        ...createFavoriteDto,
        to_stop_id: mockFromStopId, // Same as from_stop_id
      };

      await expect(service.create(mockUserId, invalidDto)).rejects.toThrow(BadRequestException);
      await expect(service.create(mockUserId, invalidDto)).rejects.toThrow(
        'From and to stops must be different',
      );
    });

    it('should throw BadRequestException when user has 20 favorites', async () => {
      mockSupabaseClient.select.mockResolvedValueOnce({
        count: 20,
        error: null,
      });

      await expect(service.create(mockUserId, createFavoriteDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.create(mockUserId, createFavoriteDto)).rejects.toThrow(
        'Maximum 20 favorites allowed per user',
      );
    });

    it('should throw BadRequestException on foreign key constraint violation', async () => {
      mockSupabaseClient.select.mockResolvedValueOnce({
        count: 5,
        error: null,
      });

      mockSupabaseClient.single.mockResolvedValueOnce({
        data: null,
        error: { code: '23503', message: 'Foreign key violation' },
      });

      await expect(service.create(mockUserId, createFavoriteDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.create(mockUserId, createFavoriteDto)).rejects.toThrow(
        'Invalid stop ID provided',
      );
    });

    it('should throw InternalServerErrorException on database error', async () => {
      mockSupabaseClient.select.mockResolvedValueOnce({
        count: 5,
        error: null,
      });

      mockSupabaseClient.single.mockResolvedValueOnce({
        data: null,
        error: { message: 'Database error' },
      });

      await expect(service.create(mockUserId, createFavoriteDto)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('findAll', () => {
    it('should return all favorites for a user', async () => {
      const mockFavorites = [mockFavorite];

      mockSupabaseClient.order.mockResolvedValueOnce({
        data: mockFavorites,
        error: null,
      });

      const result = await service.findAll(mockUserId);

      expect(result).toEqual(mockFavorites);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('favorite_routes');
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('user_id', mockUserId);
      expect(mockSupabaseClient.order).toHaveBeenCalledWith('created_at', { ascending: false });
    });

    it('should return empty array when user has no favorites', async () => {
      mockSupabaseClient.order.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      const result = await service.findAll(mockUserId);

      expect(result).toEqual([]);
    });

    it('should throw InternalServerErrorException on database error', async () => {
      mockSupabaseClient.order.mockResolvedValueOnce({
        data: null,
        error: { message: 'Database error' },
      });

      await expect(service.findAll(mockUserId)).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('findOne', () => {
    it('should return a favorite by ID', async () => {
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: mockFavorite,
        error: null,
      });

      const result = await service.findOne(mockFavoriteId, mockUserId);

      expect(result).toEqual(mockFavorite);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('favorite_routes');
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('id', mockFavoriteId);
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('user_id', mockUserId);
    });

    it('should throw NotFoundException when favorite does not exist', async () => {
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: null,
        error: { message: 'Not found' },
      });

      await expect(service.findOne(mockFavoriteId, mockUserId)).rejects.toThrow(NotFoundException);
      await expect(service.findOne(mockFavoriteId, mockUserId)).rejects.toThrow(
        `Favorite with ID ${mockFavoriteId} not found`,
      );
    });
  });

  describe('update', () => {
    const updateFavoriteDto: UpdateFavoriteDto = {
      name: 'Updated Home to Work',
    };

    it('should update a favorite successfully', async () => {
      // Mock findOne
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: mockFavorite,
        error: null,
      });

      // Mock update
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: { ...mockFavorite, name: updateFavoriteDto.name },
        error: null,
      });

      const result = await service.update(mockFavoriteId, mockUserId, updateFavoriteDto);

      expect(result.name).toEqual(updateFavoriteDto.name);
      expect(mockSupabaseClient.update).toHaveBeenCalledWith({ name: updateFavoriteDto.name });
    });

    it('should throw NotFoundException when favorite does not exist', async () => {
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: null,
        error: { message: 'Not found' },
      });

      await expect(
        service.update(mockFavoriteId, mockUserId, updateFavoriteDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw InternalServerErrorException on database error', async () => {
      // Mock findOne success
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: mockFavorite,
        error: null,
      });

      // Mock update failure
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: null,
        error: { message: 'Database error' },
      });

      await expect(
        service.update(mockFavoriteId, mockUserId, updateFavoriteDto),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('remove', () => {
    it('should delete a favorite successfully', async () => {
      // Mock findOne
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: mockFavorite,
        error: null,
      });

      // Mock delete
      mockSupabaseClient.delete.mockResolvedValueOnce({
        error: null,
      });

      await service.remove(mockFavoriteId, mockUserId);

      expect(mockSupabaseClient.delete).toHaveBeenCalled();
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('id', mockFavoriteId);
    });

    it('should throw NotFoundException when favorite does not exist', async () => {
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: null,
        error: { message: 'Not found' },
      });

      await expect(service.remove(mockFavoriteId, mockUserId)).rejects.toThrow(NotFoundException);
    });

    it('should throw InternalServerErrorException on database error', async () => {
      // Mock findOne success
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: mockFavorite,
        error: null,
      });

      // Mock delete failure
      mockSupabaseClient.delete.mockResolvedValueOnce({
        error: { message: 'Database error' },
      });

      await expect(service.remove(mockFavoriteId, mockUserId)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });
});
