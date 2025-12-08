import { Test, TestingModule } from '@nestjs/testing';
import { FavoritesController } from './favorites.controller';
import { FavoritesService } from './favorites.service';
import { CreateFavoriteDto } from './dto/create-favorite.dto';
import { UpdateFavoriteDto } from './dto/update-favorite.dto';

describe('FavoritesController', () => {
  let controller: FavoritesController;
  let service: FavoritesService;

  const mockUserId = '123e4567-e89b-12d3-a456-426614174000';
  const mockFavoriteId = '223e4567-e89b-12d3-a456-426614174001';

  const mockFavorite = {
    id: mockFavoriteId,
    user_id: mockUserId,
    name: 'Home to Work',
    from_stop_id: '323e4567-e89b-12d3-a456-426614174002',
    to_stop_id: '423e4567-e89b-12d3-a456-426614174003',
    route_data: { routes: [] },
    created_at: '2025-01-13T10:00:00.000Z',
    updated_at: '2025-01-13T10:00:00.000Z',
  };

  const mockRequest = {
    user: {
      id: mockUserId,
    },
  };

  const mockFavoritesService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FavoritesController],
      providers: [
        {
          provide: FavoritesService,
          useValue: mockFavoritesService,
        },
      ],
    }).compile();

    controller = module.get<FavoritesController>(FavoritesController);
    service = module.get<FavoritesService>(FavoritesService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a favorite', async () => {
      const createDto: CreateFavoriteDto = {
        name: 'Home to Work',
        from_stop_id: '323e4567-e89b-12d3-a456-426614174002',
        to_stop_id: '423e4567-e89b-12d3-a456-426614174003',
        route_data: { routes: [] },
      };

      mockFavoritesService.create.mockResolvedValue(mockFavorite);

      const result = await controller.create(mockRequest, createDto);

      expect(result).toEqual(mockFavorite);
      expect(service.create).toHaveBeenCalledWith(mockUserId, createDto);
    });
  });

  describe('findAll', () => {
    it('should return all favorites', async () => {
      const mockFavorites = [mockFavorite];
      mockFavoritesService.findAll.mockResolvedValue(mockFavorites);

      const result = await controller.findAll(mockRequest);

      expect(result).toEqual(mockFavorites);
      expect(service.findAll).toHaveBeenCalledWith(mockUserId);
    });
  });

  describe('findOne', () => {
    it('should return a favorite by ID', async () => {
      mockFavoritesService.findOne.mockResolvedValue(mockFavorite);

      const result = await controller.findOne(mockRequest, mockFavoriteId);

      expect(result).toEqual(mockFavorite);
      expect(service.findOne).toHaveBeenCalledWith(mockFavoriteId, mockUserId);
    });
  });

  describe('update', () => {
    it('should update a favorite', async () => {
      const updateDto: UpdateFavoriteDto = {
        name: 'Updated Home to Work',
      };

      const updatedFavorite = { ...mockFavorite, name: updateDto.name };
      mockFavoritesService.update.mockResolvedValue(updatedFavorite);

      const result = await controller.update(mockRequest, mockFavoriteId, updateDto);

      expect(result).toEqual(updatedFavorite);
      expect(service.update).toHaveBeenCalledWith(mockFavoriteId, mockUserId, updateDto);
    });
  });

  describe('remove', () => {
    it('should delete a favorite', async () => {
      mockFavoritesService.remove.mockResolvedValue(undefined);

      await controller.remove(mockRequest, mockFavoriteId);

      expect(service.remove).toHaveBeenCalledWith(mockFavoriteId, mockUserId);
    });
  });
});
