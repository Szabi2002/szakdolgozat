import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

// Storage keys (must match AuthService)
const TOKEN_KEY = 'auth_token';
const USER_KEY = 'current_user';

// Prevent infinite logout loop
let isLoggingOut = false;
let lastLogoutAttempt = 0;
const LOGOUT_COOLDOWN_MS = 5000; // 5 seconds cooldown

/**
 * Error Interceptor
 * Handles HTTP errors globally
 *
 * CRITICAL FIX: No longer depends on AuthService to prevent circular dependency
 * ErrorInterceptor → AuthService → HttpClient → ErrorInterceptor (BROKEN)
 *
 * Instead, we handle logout directly by:
 * 1. Clearing localStorage (no HTTP calls)
 * 2. Navigating to login page (no HTTP calls)
 *
 * This prevents the circular dependency while maintaining the same functionality.
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Handle different error status codes
      switch (error.status) {
        case 401:
          // Skip logout if request is to auth endpoints or already logging out
          const isAuthEndpoint = req.url.includes('/auth/logout') ||
                                 req.url.includes('/auth/google') ||
                                 req.url.includes('/auth/callback');

          if (isAuthEndpoint) {
            // Auth endpoint 401, skipping auto-logout
            break;
          }

          // Prevent infinite logout loop with cooldown
          const now = Date.now();
          if (isLoggingOut || (now - lastLogoutAttempt < LOGOUT_COOLDOWN_MS)) {
            // Logout already in progress
            break;
          }

          // Unauthorized - token expired or invalid
          // Clear auth data directly (no service call to avoid circular dependency)
          isLoggingOut = true;
          lastLogoutAttempt = now;

          // Clear all auth tokens from localStorage
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(USER_KEY);

          // Clear Supabase token (environment-specific key)
          try {
            // Extract Supabase project ID from URL if available
            const supabaseUrl = localStorage.getItem('supabase_url');
            if (supabaseUrl) {
              const projectId = supabaseUrl.split('//')[1]?.split('.')[0];
              if (projectId) {
                localStorage.removeItem(`sb-${projectId}-auth-token`);
              }
            }
          } catch (e) {
            // Ignore errors in Supabase token cleanup
          }

          // Navigate to login page with return URL
          router.navigate(['/login'], {
            queryParams: { returnUrl: router.url, reason: 'session_expired' },
          })
          .finally(() => {
            // Reset flag after 1 second
            setTimeout(() => {
              isLoggingOut = false;
            }, 1000);
          });
          break;

        case 403:
          // Forbidden - user doesn't have permission
          // Log only in development
          if (typeof window !== 'undefined' && window.location.hostname.includes('localhost')) {
            console.warn('[ErrorInterceptor] 403 Forbidden:', req.url);
          }
          break;

        case 404:
          // Not Found - only log in development
          if (typeof window !== 'undefined' && window.location.hostname.includes('localhost')) {
            console.warn('[ErrorInterceptor] 404 Not Found:', req.url);
          }
          break;

        case 500:
        case 502:
        case 503:
          // Server errors - log in development
          if (typeof window !== 'undefined' && window.location.hostname.includes('localhost')) {
            console.error('[ErrorInterceptor] Server Error:', error.status, req.url);
          }
          break;

        default:
          // Other errors - log in development (excluding network errors)
          if (error.status !== 0 && typeof window !== 'undefined' && window.location.hostname.includes('localhost')) {
            console.warn('[ErrorInterceptor] HTTP Error:', error.status, req.url);
          }
      }

      // Re-throw the error for component-level handling
      return throwError(() => error);
    })
  );
};
