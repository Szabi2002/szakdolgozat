import { TestBed } from '@angular/core/testing';
import { SupabaseService } from './supabase.service';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Mock Supabase module
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(),
}));

describe('SupabaseService', () => {
  let service: SupabaseService;
  let mockSupabaseClient: any;

  beforeEach(() => {
    // Create mock auth methods
    const mockAuth = {
      getSession: jest.fn().mockResolvedValue({
        data: { session: null },
        error: null,
      }),
      getUser: jest.fn().mockResolvedValue({
        data: { user: null },
        error: null,
      }),
      signInWithOAuth: jest.fn().mockResolvedValue({ error: null }),
      signOut: jest.fn().mockResolvedValue({ error: null }),
      refreshSession: jest.fn().mockResolvedValue({
        data: { session: null },
        error: null,
      }),
    };

    // Create mock Supabase client
    mockSupabaseClient = {
      auth: mockAuth,
    };

    (createClient as jest.Mock).mockReturnValue(mockSupabaseClient);

    // Reset singleton instance before each test
    (SupabaseService as any).instance = null;

    TestBed.configureTestingModule({
      providers: [SupabaseService],
    });

    service = TestBed.inject(SupabaseService);
  });

  afterEach(() => {
    jest.clearAllMocks();
    // Reset singleton
    (SupabaseService as any).instance = null;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should enforce singleton pattern', () => {
    const service2 = TestBed.inject(SupabaseService);
    expect(service).toBe(service2);
  });

  it('should have a Supabase client', () => {
    expect(service.client).toBeDefined();
  });

  it('should have user$ observable', () => {
    expect(service.user$).toBeDefined();
  });

  it('should initially have no user', () => {
    expect(service.user).toBeNull();
  });

  it('should configure Supabase client with proper auth options', () => {
    expect(createClient).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(String),
      expect.objectContaining({
        auth: expect.objectContaining({
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          flowType: 'pkce',
        }),
      })
    );
  });

  describe('Invalid Session Cleanup', () => {
    it('should clear storage if session is invalid on init', async () => {
      const localStorageRemoveSpy = jest.spyOn(Storage.prototype, 'removeItem');

      jest
        .spyOn(mockSupabaseClient.auth, 'getSession')
        .mockResolvedValueOnce({ data: { session: null }, error: null });

      // Create new instance to trigger cleanup
      (SupabaseService as any).instance = null;
      const newService = new SupabaseService();

      // Wait for async cleanup
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(localStorageRemoveSpy).toHaveBeenCalled();
    });

    it('should clear storage on session error', async () => {
      const localStorageRemoveSpy = jest.spyOn(Storage.prototype, 'removeItem');
      const sessionError = new Error('Session error');

      jest
        .spyOn(mockSupabaseClient.auth, 'getSession')
        .mockResolvedValueOnce({ data: null, error: sessionError });

      // Create new instance to trigger cleanup
      (SupabaseService as any).instance = null;
      const newService = new SupabaseService();

      // Wait for async cleanup
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(localStorageRemoveSpy).toHaveBeenCalled();
    });
  });

  describe('OAuth Sign In', () => {
    it('should call Supabase signInWithOAuth with correct parameters', async () => {
      const signInSpy = jest.spyOn(mockSupabaseClient.auth, 'signInWithOAuth');

      await service.signInWithGoogle();

      expect(signInSpy).toHaveBeenCalledWith({
        provider: 'google',
        options: expect.objectContaining({
          redirectTo: expect.stringContaining('/auth/callback'),
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        }),
      });
    });

    it('should throw error if OAuth sign-in fails', async () => {
      const oauthError = new Error('OAuth provider error');
      jest
        .spyOn(mockSupabaseClient.auth, 'signInWithOAuth')
        .mockResolvedValueOnce({ error: oauthError });

      await expect(service.signInWithGoogle()).rejects.toThrow();
    });
  });

  describe('Sign Out', () => {
    it('should call Supabase signOut and clear user state', async () => {
      const signOutSpy = jest.spyOn(mockSupabaseClient.auth, 'signOut');
      const localStorageRemoveSpy = jest.spyOn(Storage.prototype, 'removeItem');

      await service.signOut();

      expect(signOutSpy).toHaveBeenCalled();
      expect(localStorageRemoveSpy).toHaveBeenCalled();
      expect(service.user).toBeNull();
    });

    it('should clear storage even if sign out fails', async () => {
      const signOutError = new Error('Sign out failed');
      const localStorageRemoveSpy = jest.spyOn(Storage.prototype, 'removeItem');

      jest
        .spyOn(mockSupabaseClient.auth, 'signOut')
        .mockResolvedValueOnce({ error: signOutError });

      await service.signOut();

      // Should still clear storage
      expect(localStorageRemoveSpy).toHaveBeenCalled();
      expect(service.user).toBeNull();
    });

    it('should handle sign out errors gracefully', async () => {
      const signOutError = new Error('Sign out failed');
      jest
        .spyOn(mockSupabaseClient.auth, 'signOut')
        .mockRejectedValueOnce(signOutError);

      // Should not throw, but handle gracefully
      await service.signOut();

      expect(service.user).toBeNull();
    });
  });

  describe('Session Management', () => {
    it('should get current session', async () => {
      const mockSession = { access_token: 'token123', user: { id: '123' } };
      jest
        .spyOn(mockSupabaseClient.auth, 'getSession')
        .mockResolvedValueOnce({ data: { session: mockSession }, error: null });

      const result = await service.getSession();

      expect(result.data.session).toEqual(mockSession);
    });

    it('should refresh session', async () => {
      const mockSession = { access_token: 'new_token', user: { id: '123' } };
      jest
        .spyOn(mockSupabaseClient.auth, 'refreshSession')
        .mockResolvedValueOnce({ data: { session: mockSession }, error: null });

      const result = await service.refreshSession();

      expect(result.data.session).toEqual(mockSession);
    });
  });
});
