import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '@environments/environment';

/**
 * Auth Interceptor
 * Automatically adds JWT token to outgoing HTTP requests
 * Adds Authorization header with Bearer token
 *
 * Note: Directly accesses localStorage to avoid circular dependency
 * (AuthService uses HttpClient which triggers interceptors)
 *
 * CRITICAL FIX: Retrieve Supabase session token from the correct storage key
 * Supabase stores session data in a key format: sb-{project-ref}-auth-token
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  let token: string | null = null;

  // PRIORITY 1: Use backend JWT token (auth_token) for API requests
  // This is the primary authentication token after OAuth exchange
  token = localStorage.getItem('auth_token');

  // PRIORITY 2: Fallback to Supabase session token if backend token not found
  // This is used during OAuth flow before token exchange
  if (!token) {
    try {
      const urlParts = environment.supabase.url.split('//')[1].split('.');
      const supabaseStorageKey = `sb-${urlParts[0]}-auth-token`;
      const supabaseSession = localStorage.getItem(supabaseStorageKey);

      if (supabaseSession) {
        const sessionData = JSON.parse(supabaseSession);
        // Supabase stores access_token in the session object
        token = sessionData?.access_token || null;
      }
    } catch (error) {
      // If parsing fails, token remains null
      console.warn('[AuthInterceptor] Failed to parse Supabase session:', error);
    }
  }

  // Skip adding token for auth endpoints
  const isAuthEndpoint = req.url.includes('/auth/google') || req.url.includes('/auth/callback');

  // Clone request and add Authorization header if token exists
  if (token && !isAuthEndpoint) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  return next(req);
};
