import { Component, OnInit, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '@shared/material/material.module';
import { AuthService } from '@core/services/auth.service';

@Component({
  selector: 'app-callback',
  standalone: true,
  imports: [CommonModule, RouterModule, MaterialModule],
  templateUrl: './callback.component.html',
  styleUrl: './callback.component.scss',
})
export class CallbackComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);

  errorMessage = '';

  ngOnInit(): void {
    // Add a delay to ensure Supabase processes the URL hash
    // and allows lock management to settle
    setTimeout(() => {
      this.handleOAuthCallback();
    }, 300);
  }

  private async handleOAuthCallback(): Promise<void> {
    const maxRetries = 3;
    let lastError: any;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        // OAuth callback attempt
        await this.authService.handleOAuthCallback();
        // OAuth callback successful

        // Redirect to dashboard
        await this.router.navigate(['/dashboard']);
        return;
      } catch (error: any) {
        lastError = error;
        // OAuth callback failed

        // Check if it's a lock timeout error
        const isLockTimeout = error?.message?.includes('NavigatorLock') ||
                            error?.name === 'NavigatorLockAcquireTimeoutError';

        if (isLockTimeout && attempt < maxRetries - 1) {
          // Wait before retry with exponential backoff
          const delay = 1000 * Math.pow(2, attempt);
          // Lock timeout detected, retrying
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }

        // If not a lock timeout or last attempt, show error
        if (attempt === maxRetries - 1) {
          if (lastError instanceof Error) {
            this.errorMessage = `Bejelentkezés sikertelen: ${lastError.message}`;
          } else {
            this.errorMessage = 'Bejelentkezés sikertelen. Próbáld újra.';
          }
        }
      }
    }
  }
}
