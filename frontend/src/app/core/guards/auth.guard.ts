import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '@core/services/auth.service';
import { map, take } from 'rxjs/operators';

/**
 * Auth Guard
 * Protects routes from unauthorized access
 * Redirects to login if user is not authenticated
 */
export const authGuard = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Check authentication status
  return authService.isAuthenticated$.pipe(
    take(1),
    map((isAuthenticated) => {
      if (isAuthenticated) {
        // User is authenticated, allow access
        return true;
      } else {
        // User is not authenticated, redirect to login
        // Access denied - redirecting to login
        router.navigate(['/login']);
        return false;
      }
    })
  );
};

/**
 * Guest Guard (opposite of authGuard)
 * Redirects authenticated users away from login/register pages
 * Redirects based on user role: admin -> /admin/dashboard, user -> /dashboard
 */
export const guestGuard = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.isAuthenticated$.pipe(
    take(1),
    map((isAuthenticated) => {
      if (!isAuthenticated) {
        // User is not authenticated, allow access to login page
        return true;
      } else {
        // User is already authenticated, redirect based on role
        const user = authService.getCurrentUserSync();
        if (user?.role === 'admin') {
          router.navigate(['/admin/dashboard']);
        } else {
          router.navigate(['/dashboard']);
        }
        return false;
      }
    })
  );
};

/**
 * Admin Guard
 * Protects admin routes - only allows access to users with admin role
 * Redirects non-admin users to home page
 */
export const adminGuard = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.currentUser$.pipe(
    take(1),
    map((user) => {
      if (user?.role === 'admin') {
        // User is admin, allow access
        return true;
      } else {
        // User is not admin, redirect to home
        // Access denied - admin role required
        router.navigate(['/']);
        return false;
      }
    })
  );
};
