import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException, BadRequestException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SupabaseService } from '@common/supabase/supabase.service';
import { GoogleLoginDto } from './dto/google-login.dto';

describe('AuthService', () => {
  let service: AuthService;
  let supabaseService: jest.Mocked<SupabaseService>;

  const mockSupabaseUser = {
    id: 'test-user-id',
    email: 'test@example.com',
    app_metadata: {},
    aud: 'authenticated',
    created_at: new Date().toISOString(),
    user_metadata: {
      full_name: 'Test User',
      avatar_url: 'https://example.com/avatar.jpg',
      provider_id: 'google-123',
    },
  } as any;

  const mockDbUser = {
    id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
    profile_picture_url: 'https://example.com/avatar.jpg',
    google_id: 'google-123',
    role: 'user',
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
      auth: {
        getUser: jest.fn(),
        signOut: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: SupabaseService,
          useValue: {
            verifyToken: jest.fn(),
            getClient: jest.fn().mockReturnValue(mockSupabaseClient),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    supabaseService = module.get(SupabaseService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('signInWithGoogle', () => {
    it('should successfully sign in with valid Google token', async () => {
      const dto: GoogleLoginDto = { accessToken: 'valid-token' };

      supabaseService.verifyToken = jest.fn().mockResolvedValue(mockSupabaseUser);

      const mockClient = supabaseService.getClient() as any;
      mockClient.single.mockResolvedValue({ data: mockDbUser, error: null });

      const result = await service.signInWithGoogle(dto);

      expect(result).toEqual({
        accessToken: dto.accessToken,
        user: {
          id: mockDbUser.id,
          email: mockDbUser.email,
          name: mockDbUser.name,
          profile_picture_url: mockDbUser.profile_picture_url,
          role: mockDbUser.role,
          created_at: mockDbUser.created_at,
        },
      });
      expect(supabaseService.verifyToken).toHaveBeenCalledWith(dto.accessToken);
    });

    it('should throw UnauthorizedException for invalid token', async () => {
      const dto: GoogleLoginDto = { accessToken: 'invalid-token' };

      supabaseService.verifyToken = jest.fn().mockResolvedValue(null);

      await expect(service.signInWithGoogle(dto)).rejects.toThrow(UnauthorizedException);
    });

    it('should create new user if not exists', async () => {
      const dto: GoogleLoginDto = { accessToken: 'valid-token' };

      supabaseService.verifyToken = jest.fn().mockResolvedValue(mockSupabaseUser);

      const mockClient = supabaseService.getClient() as any;
      // First call (existing user check) returns null
      mockClient.single.mockResolvedValueOnce({ data: null, error: null });
      // Second call (after insert) returns new user
      mockClient.single.mockResolvedValueOnce({ data: mockDbUser, error: null });

      const result = await service.signInWithGoogle(dto);

      expect(result.user.email).toBe(mockDbUser.email);
      expect(mockClient.insert).toHaveBeenCalled();
    });
  });

  describe('getCurrentUser', () => {
    it('should return user data for valid token', async () => {
      const token = 'valid-token';

      supabaseService.verifyToken = jest.fn().mockResolvedValue(mockSupabaseUser);

      const mockClient = supabaseService.getClient() as any;
      mockClient.single.mockResolvedValue({ data: mockDbUser, error: null });

      const result = await service.getCurrentUser(token);

      expect(result.id).toBe(mockDbUser.id);
      expect(result.email).toBe(mockDbUser.email);
    });

    it('should throw UnauthorizedException for invalid token', async () => {
      const token = 'invalid-token';

      supabaseService.verifyToken = jest.fn().mockResolvedValue(null);

      await expect(service.getCurrentUser(token)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('signOut', () => {
    it('should successfully sign out with valid token', async () => {
      const token = 'valid-token';

      // Mock verifyToken to return a user (valid token)
      jest.spyOn(supabaseService, 'verifyToken').mockResolvedValue(mockSupabaseUser);

      const result = await service.signOut(token);

      expect(result.message).toBe('Sikeres kijelentkezés');
      expect(supabaseService.verifyToken).toHaveBeenCalledWith(token);
    });

    it('should successfully sign out with invalid token', async () => {
      const token = 'invalid-token';

      // Mock verifyToken to throw error (invalid token)
      jest
        .spyOn(supabaseService, 'verifyToken')
        .mockRejectedValue(new Error('Invalid token'));

      const result = await service.signOut(token);

      // Should still return success - graceful handling
      expect(result.message).toBe('Sikeres kijelentkezés');
    });

    it('should successfully sign out without token', async () => {
      const result = await service.signOut(null);

      // Should return success even without token
      expect(result.message).toBe('Sikeres kijelentkezés');
    });
  });

  describe('validateUser', () => {
    it('should return user data if user exists', async () => {
      const userId = 'test-user-id';

      const mockClient = supabaseService.getClient() as any;
      mockClient.single.mockResolvedValue({ data: mockDbUser, error: null });

      const result = await service.validateUser(userId);

      expect(result).toEqual(mockDbUser);
    });

    it('should return null if user does not exist', async () => {
      const userId = 'non-existent-id';

      const mockClient = supabaseService.getClient() as any;
      mockClient.single.mockResolvedValue({ data: null, error: new Error('Not found') });

      const result = await service.validateUser(userId);

      expect(result).toBeNull();
    });
  });
});
