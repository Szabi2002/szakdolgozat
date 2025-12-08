import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, catchError, of, map } from 'rxjs';
import { Router } from '@angular/router';
import { SupabaseService } from './supabase.service';
import { User, AuthResponse, Session } from '@core/models/user.model';
import { environment } from '@environments/environment';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'current_user';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private supabaseService = inject(SupabaseService);

  private isAuthenticatedSubject = new BehaviorSubject<boolean>(this.hasToken());
  private currentUserSubject = new BehaviorSubject<User | null>(this.loadStoredUser());

  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor() {
    // Initialize auth state from stored token
    if (this.hasToken()) {
      this.validateStoredToken();
    }
  }

  /**
   * Check if user has a stored token
   */
  private hasToken(): boolean {
    return !!localStorage.getItem(TOKEN_KEY);
  }

  /**
   * Load stored user from localStorage
   */
  private loadStoredUser(): User | null {
    const userJson = localStorage.getItem(USER_KEY);
    if (userJson) {
      try {
        return JSON.parse(userJson);
      } catch (error) {
        if (!environment.production) { console.error('[AuthService] Failed to parse stored user:', error); }
        localStorage.removeItem(USER_KEY);
      }
    }
    return null;
  }

  /**
   * Validate stored token by checking current user
   */
  private validateStoredToken(): void {
    this.getCurrentUser().subscribe({
      next: (user) => {
        this.currentUserSubject.next(user);
        this.isAuthenticatedSubject.next(true);
      },
      error: (error) => {
        // Token invalid, clear storage
        // Only log in development
        if (window.location.hostname === 'localhost') {
          if (!environment.production) { console.warn('[AuthService] Token validation failed'); }
        }
        this.clearAuthData();
      },
    });
  }

  /**
   * Sign in with Google OAuth via Supabase
   * This initiates the OAuth flow and redirects to Google
   */
  async signInWithGoogle(): Promise<void> {
    try {
      await this.supabaseService.signInWithGoogle();
    } catch (error) {
      if (!environment.production) { console.error('[AuthService] Google sign-in failed:', error); }
      throw error;
    }
  }

  /**
   * Handle OAuth callback after successful Google sign-in
   * Exchange Supabase token for backend session
   *
   * CRITICAL FIX: Handles refresh token errors and ensures proper session storage
   */
  async handleOAuthCallback(): Promise<void> {
    try {
      console.log('[AuthService] Starting OAuth callback handling...');

      // STEP 1: Wait for Supabase to process the OAuth callback
      // This ensures the session is fully initialized
      await new Promise(resolve => setTimeout(resolve, 1000));

      // STEP 2: Get session from Supabase
      const { data, error } = await this.supabaseService.client.auth.getSession();

      if (error) {
        console.error('[AuthService] Session error after OAuth:', error);

        // CRITICAL: Clear invalid tokens from storage
        const storageKey = `sb-${environment.supabase.url.split('//')[1].split('.')[0]}-auth-token`;
        localStorage.removeItem(storageKey);
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);

        await this.router.navigate(['/login'], {
          queryParams: { error: 'oauth_session_error' }
        });
        return;
      }

      const session = data.session;

      if (!session) {
        console.error('[AuthService] No session found after OAuth callback');
        await this.router.navigate(['/login'], {
          queryParams: { error: 'no_session' }
        });
        return;
      }

      console.log('[AuthService] Session retrieved successfully');

      const supabaseToken = session.access_token;
      const supabaseUser = session.user;

      if (!supabaseToken || !supabaseUser) {
        console.error('[AuthService] Invalid session: missing token or user');
        await this.router.navigate(['/login'], {
          queryParams: { error: 'invalid_session' }
        });
        return;
      }

      // STEP 3: Verify token is stored in localStorage
      const storageKey = `sb-${environment.supabase.url.split('//')[1].split('.')[0]}-auth-token`;
      const storedToken = localStorage.getItem(storageKey);

      if (!storedToken) {
        console.error('[AuthService] Token not persisted to localStorage!');
        // Token will be stored by Supabase client, but log for debugging
      } else {
        console.log('[AuthService] Token successfully persisted to localStorage');
      }

      // STEP 4: Exchange with backend
      console.log('[AuthService] Exchanging token with backend...');

      // CRITICAL FIX: Use firstValueFrom to ensure token is saved synchronously
      const response = await this.exchangeTokenWithBackend(supabaseToken).toPromise();

      // VERIFY: Token must be stored before navigation
      const storedAuthToken = localStorage.getItem(TOKEN_KEY);
      if (!storedAuthToken) {
        console.error('[AuthService] CRITICAL: Token not stored after backend exchange!');
        throw new Error('Token storage failed');
      }

      console.log('[AuthService] OAuth callback completed successfully, token verified in storage');

      // STEP 5: Navigate to dashboard (only after token is confirmed)
      await this.router.navigate(['/dashboard']);

    } catch (error) {
      console.error('[AuthService] OAuth callback failed:', error);

      // CRITICAL: Clear all auth data on error
      const storageKey = `sb-${environment.supabase.url.split('//')[1].split('.')[0]}-auth-token`;
      localStorage.removeItem(storageKey);
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);

      await this.router.navigate(['/login'], {
        queryParams: { error: 'callback_failed' }
      });
    }
  }

  /**
   * Exchange Supabase token with backend API
   * Backend will validate the token and return user data + JWT
   */
  private exchangeTokenWithBackend(supabaseToken: string): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${environment.apiUrl}/auth/google`, {
        accessToken: supabaseToken, // Fixed: backend expects "accessToken" not "token"
      })
      .pipe(
        tap((response) => {
          this.setAuthData(response.token, response.user);
        }),
        catchError((error) => {
          if (!environment.production) { console.error('[AuthService] Token exchange failed:', error); }
          throw error;
        })
      );
  }

  /**
   * Get current user from backend
   */
  getCurrentUser(): Observable<User> {
    return this.http.get<User>(`${environment.apiUrl}/auth/me`).pipe(
      tap((user) => {
        this.currentUserSubject.next(user);
        this.storeUser(user);
      }),
      catchError((error) => {
        if (!environment.production) { console.error('[AuthService] Get current user failed:', error); }
        this.clearAuthData();
        throw error;
      })
    );
  }

  /**
   * Sign out user
   * Gracefully handles all logout scenarios:
   * - Backend logout (best effort, non-blocking)
   * - Supabase logout (best effort, non-blocking)
   * - Local storage cleanup (always succeeds)
   * - Navigation to login (always succeeds)
   *
   * This method never throws errors to prevent infinite logout loops
   */
  async signOut(): Promise<void> {
    if (!environment.production) { console.log('[AuthService] Starting logout'); }

    try {
      // 1. Try to call backend logout (non-blocking)
      try {
        await this.http.post(`${environment.apiUrl}/auth/logout`, {}).toPromise();
        // Backend logout successful
      } catch (backendError) {
        // Don't block logout if backend call fails
        // Backend logout failed (non-critical)
      }

      // 2. Try to sign out from Supabase (non-blocking)
      try {
        await this.supabaseService.signOut();
        // Supabase logout successful
      } catch (supabaseError) {
        // Don't block logout if Supabase call fails
        // Supabase logout failed (non-critical)
      }
    } catch (error) {
      // Catch any unexpected errors
      // Logout error (non-critical)
    } finally {
      // 3. Always clear local auth data (this cannot fail)
      this.clearAuthData();
      // Local auth data cleared

      // 4. Always redirect to login (this cannot fail)
      try {
        await this.router.navigate(['/login']);
        // Redirected to login
      } catch (navError) {
        // Navigation failed
        // Force reload as last resort
        window.location.href = '/login';
      }
    }
  }

  /**
   * Get stored JWT token
   */
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  /**
   * Check if user is authenticated (synchronous)
   */
  isAuthenticated(): boolean {
    return this.isAuthenticatedSubject.value;
  }

  /**
   * Get current user (synchronous)
   */
  getCurrentUserSync(): User | null {
    return this.currentUserSubject.value;
  }

  /**
   * Store auth data in localStorage
   */
  private setAuthData(token: string, user: User): void {
    localStorage.setItem(TOKEN_KEY, token);
    this.storeUser(user);
    this.isAuthenticatedSubject.next(true);
    this.currentUserSubject.next(user);
  }

  /**
   * Store user in localStorage
   */
  private storeUser(user: User): void {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  /**
   * Clear all auth data
   */
  private clearAuthData(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    // Also clear Supabase token
    const storageKey = `sb-${environment.supabase.url.split('//')[1].split('.')[0]}-auth-token`;
    localStorage.removeItem(storageKey);
    this.isAuthenticatedSubject.next(false);
    this.currentUserSubject.next(null);
  }

  /**
   * Get current user (getter for convenience)
   */
  get currentUser(): User | null {
    return this.currentUserSubject.value;
  }

  /**
   * Register with email and password
   */
  registerWithEmail(data: {
    email: string;
    password: string;
    name: string;
  }): Observable<{ message: string }> {
    return this.http
      .post<{ message: string }>(`${environment.apiUrl}/auth/register`, data)
      .pipe(
        catchError((error) => {
          if (!environment.production) {
            console.error('[AuthService] Registration failed:', error);
          }
          throw error;
        })
      );
  }

  /**
   * Login with email and password
   */
  loginWithEmail(email: string, password: string): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${environment.apiUrl}/auth/login`, {
        email,
        password,
      })
      .pipe(
        tap((response) => {
          this.setAuthData(response.token, response.user);
        }),
        catchError((error) => {
          if (!environment.production) {
            console.error('[AuthService] Email login failed:', error);
          }
          throw error;
        })
      );
  }

  /**
   * Verify email address with token
   */
  verifyEmail(token: string): Observable<{ message: string }> {
    return this.http
      .post<{ message: string }>(`${environment.apiUrl}/auth/verify-email`, {
        token,
      })
      .pipe(
        catchError((error) => {
          if (!environment.production) {
            console.error('[AuthService] Email verification failed:', error);
          }
          throw error;
        })
      );
  }

  /**
   * Request password reset email
   */
  forgotPassword(email: string): Observable<{ message: string }> {
    return this.http
      .post<{ message: string }>(`${environment.apiUrl}/auth/forgot-password`, {
        email,
      })
      .pipe(
        catchError((error) => {
          if (!environment.production) {
            console.error('[AuthService] Forgot password request failed:', error);
          }
          throw error;
        })
      );
  }

  /**
   * Reset password with token
   */
  resetPassword(
    token: string,
    newPassword: string
  ): Observable<{ message: string }> {
    return this.http
      .post<{ message: string }>(`${environment.apiUrl}/auth/reset-password`, {
        token,
        newPassword,
      })
      .pipe(
        catchError((error) => {
          if (!environment.production) {
            console.error('[AuthService] Password reset failed:', error);
          }
          throw error;
        })
      );
  }

  /**
   * Change password (for logged-in users)
   */
  changePassword(
    oldPassword: string,
    newPassword: string
  ): Observable<{ message: string }> {
    return this.http
      .post<{ message: string }>(`${environment.apiUrl}/auth/change-password`, {
        oldPassword,
        newPassword,
      })
      .pipe(
        catchError((error) => {
          if (!environment.production) {
            console.error('[AuthService] Password change failed:', error);
          }
          throw error;
        })
      );
  }

  /**
   * Link Google account to existing email/password account
   */
  linkGoogleAccount(googleToken: string): Observable<{ message: string }> {
    return this.http
      .post<{ message: string }>(`${environment.apiUrl}/auth/link-google`, {
        googleToken,
      })
      .pipe(
        catchError((error) => {
          if (!environment.production) {
            console.error('[AuthService] Link Google account failed:', error);
          }
          throw error;
        })
      );
  }
}
