import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { GoogleLoginDto } from './dto/google-login.dto';
import { AuthGuard } from '@common/guards/auth.guard';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;

  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
    profile_picture_url: 'https://example.com/avatar.jpg',
    role: 'user',
    created_at: new Date(),
  };

  const mockAuthResponse = {
    accessToken: 'test-access-token',
    user: mockUser,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            signInWithGoogle: jest.fn(),
            getCurrentUser: jest.fn(),
            signOut: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get(AuthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('googleLogin', () => {
    it('should successfully login with Google', async () => {
      const dto: GoogleLoginDto = { accessToken: 'valid-token' };

      authService.signInWithGoogle = jest.fn().mockResolvedValue(mockAuthResponse);

      const result = await controller.googleLogin(dto);

      expect(result).toEqual(mockAuthResponse);
      expect(authService.signInWithGoogle).toHaveBeenCalledWith(dto);
    });
  });

  describe('getCurrentUser', () => {
    it('should return current user data', async () => {
      const authHeader = 'Bearer test-token';

      authService.getCurrentUser = jest.fn().mockResolvedValue(mockUser);

      const result = await controller.getCurrentUser(authHeader, { id: 'test-user-id' });

      expect(result).toEqual(mockUser);
      expect(authService.getCurrentUser).toHaveBeenCalledWith('test-token');
    });
  });

  describe('logout', () => {
    it('should successfully logout', async () => {
      const authHeader = 'Bearer test-token';
      const logoutResponse = { message: 'Sikeres kijelentkezés' };

      authService.signOut = jest.fn().mockResolvedValue(logoutResponse);

      const result = await controller.logout(authHeader);

      expect(result).toEqual(logoutResponse);
      expect(authService.signOut).toHaveBeenCalledWith('test-token');
    });
  });
});
