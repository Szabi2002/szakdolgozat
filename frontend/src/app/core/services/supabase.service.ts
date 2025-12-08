import { Injectable } from '@angular/core';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { environment } from '@environments/environment';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SupabaseService {
  // SINGLETON PATTERN: Ensure only ONE instance exists
  private static instance: SupabaseService | null = null;

  private supabase!: SupabaseClient;
  private currentUser$ = new BehaviorSubject<User | null>(null);
  private readonly storageKey!: string;

  constructor() {
    // Enforce singleton pattern
    if (SupabaseService.instance) {
      return SupabaseService.instance;
    }

    // Generate storage key from Supabase URL
    const urlParts = environment.supabase.url.split('//')[1].split('.');
    this.storageKey = `sb-${urlParts[0]}-auth-token`;

    // Initialize Supabase client with PROPER configuration
    this.supabase = createClient(environment.supabase.url, environment.supabase.anonKey, {
      auth: {
        persistSession: true, // Enable session persistence
        autoRefreshToken: true, // Auto refresh tokens
        detectSessionInUrl: true, // Detect session in OAuth callback URL
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
        storageKey: this.storageKey,
        flowType: 'pkce', // Use PKCE flow for better security
        // CRITICAL FIX: Disable Navigator Lock by using a no-op lock function
        // This prevents "NavigatorLockAcquireTimeoutError" when multiple async operations occur
        lock: async (name, acquireTimeout, fn) => {
          // No-op lock: directly execute the function without locking
          return await fn();
        },
      },
    });

    // Clear invalid sessions on initialization (delayed to avoid lock conflicts)
    setTimeout(() => this.clearInvalidSessions(), 0);

    // Load current user (delayed to avoid lock conflicts)
    setTimeout(() => this.loadUser(), 0);

    // Set singleton instance
    SupabaseService.instance = this;
  }

  /**
   * Clear invalid sessions from storage
   * This prevents "Invalid Refresh Token" errors
   */
  private async clearInvalidSessions(): Promise<void> {
    try {
      const { data, error } = await this.supabase.auth.getSession();

      if (error || !data.session) {
        // No valid session found, clear storage
        if (typeof window !== 'undefined') {
          localStorage.removeItem(this.storageKey);
          console.warn('[SupabaseService] Cleared invalid session from storage');
        }
      }
    } catch (error) {
      // Clear storage on any error
      if (typeof window !== 'undefined') {
        localStorage.removeItem(this.storageKey);
        console.error('[SupabaseService] Error checking session, cleared storage:', error);
      }
    }
  }

  /**
   * Load current user from Supabase
   */
  private async loadUser(): Promise<void> {
    try {
      const {
        data: { user },
      } = await this.supabase.auth.getUser();
      this.currentUser$.next(user);
    } catch (error) {
      console.error('[SupabaseService] Error loading user:', error);
      this.currentUser$.next(null);
    }
  }

  /**
   * Get Supabase client instance
   */
  get client(): SupabaseClient {
    return this.supabase;
  }

  /**
   * Observable of current user
   */
  get user$(): Observable<User | null> {
    return this.currentUser$.asObservable();
  }

  /**
   * Get current user synchronously
   */
  get user(): User | null {
    return this.currentUser$.value;
  }

  /**
   * Sign in with Google OAuth
   * Redirects to Google sign-in page
   */
  async signInWithGoogle(): Promise<void> {
    try {
      const { error } = await this.supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        console.error('[SupabaseService] Google sign-in error:', error);
        throw error;
      }
    } catch (error) {
      console.error('[SupabaseService] Google sign-in failed:', error);
      throw error;
    }
  }

  /**
   * Sign out from Supabase
   * Clears all session data
   */
  async signOut(): Promise<void> {
    try {
      const { error } = await this.supabase.auth.signOut();

      if (error) {
        console.error('[SupabaseService] Sign out error:', error);
        // Continue with local cleanup even if server-side logout fails
      }

      // Clear user state
      this.currentUser$.next(null);

      // Clear storage manually as backup
      if (typeof window !== 'undefined') {
        localStorage.removeItem(this.storageKey);
      }
    } catch (error) {
      console.error('[SupabaseService] Sign out failed:', error);

      // Force clear user state and storage
      this.currentUser$.next(null);
      if (typeof window !== 'undefined') {
        localStorage.removeItem(this.storageKey);
      }
    }
  }

  /**
   * Get current session
   */
  async getSession() {
    return await this.supabase.auth.getSession();
  }

  /**
   * Refresh session
   */
  async refreshSession() {
    return await this.supabase.auth.refreshSession();
  }
}
