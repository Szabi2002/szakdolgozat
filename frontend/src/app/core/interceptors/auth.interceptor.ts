import { HttpInterceptorFn } from '@angular/common/http';

// Sprint 1-2: Implement authentication interceptor
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // TODO: Implement in Sprint 1-2
  // Add authentication token to requests
  return next(req);
};
