import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize } from 'rxjs';
import { LoadingService } from '@core/services/loading.service';

/**
 * Loading Interceptor
 * Tracks HTTP requests and updates loading state
 * Shows/hides loading spinner automatically
 *
 * NOTE: Auth endpoints are excluded to prevent duplicate spinners
 * (auth components have their own local loading states)
 */
export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  const loadingService = inject(LoadingService);

  // Skip loading spinner for auth endpoints (they have local loading states)
  const isAuthEndpoint = req.url.includes('/auth/');

  if (!isAuthEndpoint) {
    // Increment active requests counter
    loadingService.show();
  }

  return next(req).pipe(
    finalize(() => {
      if (!isAuthEndpoint) {
        // Decrement active requests counter when request completes
        loadingService.hide();
      }
    })
  );
};
