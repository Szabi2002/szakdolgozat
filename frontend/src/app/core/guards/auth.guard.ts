import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { SupabaseService } from '@core/services/supabase.service';

// Sprint 1-2: Implement authentication guard
export const authGuard = () => {
  const supabaseService = inject(SupabaseService);
  const router = inject(Router);

  // TODO: Implement in Sprint 1-2
  // Check if user is authenticated
  // If not, redirect to login page
  return true;
};
