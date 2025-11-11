import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { UsersService } from './users.service';
import { SupabaseService } from '@common/supabase/supabase.service';
import { CreateUserDto } from './dto/create-user.dto';

describe('UsersService', () => {
  let service: UsersService;
  let supabaseService: jest.Mocked<SupabaseService>;

  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
    profile_picture_url: 'https://example.com/avatar.jpg',
    google_id: 'google-123',
    role: 'user' as const,
    created_at: new Date(),
    updated_at: new Date(),
  };

  beforeEach(async () => {
    const mockSupabaseClient = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: SupabaseService,
          useValue: {
            getClient: jest.fn().mockReturnValue(mockSupabaseClient),
          },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    supabaseService = module.get(SupabaseService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findById', () => {
    it('should return user if found', async () => {
      const mockClient = supabaseService.getClient() as any;
      mockClient.single.mockResolvedValue({ data: mockUser, error: null });

      const result = await service.findById('test-user-id');

      expect(result).toEqual(mockUser);
      expect(mockClient.from).toHaveBeenCalledWith('users');
    });

    it('should throw NotFoundException if user not found', async () => {
      const mockClient = supabaseService.getClient() as any;
      mockClient.single.mockResolvedValue({ data: null, error: new Error('Not found') });

      await expect(service.findById('non-existent-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByEmail', () => {
    it('should return user if found', async () => {
      const mockClient = supabaseService.getClient() as any;
      mockClient.single.mockResolvedValue({ data: mockUser, error: null });

      const result = await service.findByEmail('test@example.com');

      expect(result).toEqual(mockUser);
    });

    it('should return null if user not found', async () => {
      const mockClient = supabaseService.getClient() as any;
      mockClient.single.mockResolvedValue({ data: null, error: new Error('Not found') });

      const result = await service.findByEmail('notfound@example.com');

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should successfully create a new user', async () => {
      const createDto: CreateUserDto = {
        email: 'newuser@example.com',
        name: 'New User',
        google_id: 'google-456',
      };

      const mockClient = supabaseService.getClient() as any;
      // findByEmail returns null (user doesn't exist)
      mockClient.single.mockResolvedValueOnce({ data: null, error: new Error('Not found') });
      // insert returns new user
      mockClient.single.mockResolvedValueOnce({ data: { ...mockUser, ...createDto }, error: null });

      const result = await service.create(createDto);

      expect(result.email).toBe(createDto.email);
      expect(mockClient.insert).toHaveBeenCalled();
    });

    it('should throw BadRequestException if email already exists', async () => {
      const createDto: CreateUserDto = {
        email: 'test@example.com',
        name: 'Test User',
        google_id: 'google-123',
      };

      const mockClient = supabaseService.getClient() as any;
      // findByEmail returns existing user
      mockClient.single.mockResolvedValue({ data: mockUser, error: null });

      await expect(service.create(createDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('update', () => {
    it('should successfully update user', async () => {
      const updateData = { name: 'Updated Name' };
      const updatedUser = { ...mockUser, ...updateData };

      const mockClient = supabaseService.getClient() as any;
      // findById succeeds
      mockClient.single.mockResolvedValueOnce({ data: mockUser, error: null });
      // update returns updated user
      mockClient.single.mockResolvedValueOnce({ data: updatedUser, error: null });

      const result = await service.update('test-user-id', updateData);

      expect(result.name).toBe(updateData.name);
      expect(mockClient.update).toHaveBeenCalled();
    });

    it('should throw NotFoundException if user not found', async () => {
      const mockClient = supabaseService.getClient() as any;
      mockClient.single.mockResolvedValue({ data: null, error: new Error('Not found') });

      await expect(service.update('non-existent-id', { name: 'New Name' })).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
