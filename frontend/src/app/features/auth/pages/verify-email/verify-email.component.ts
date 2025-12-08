import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MaterialModule } from '@shared/material/material.module';
import { AuthService } from '@core/services/auth.service';

enum VerificationState {
  LOADING = 'loading',
  SUCCESS = 'success',
  ERROR = 'error',
}

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [CommonModule, RouterModule, MaterialModule],
  templateUrl: './verify-email.component.html',
  styleUrl: './verify-email.component.scss',
})
export class VerifyEmailComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  state: VerificationState = VerificationState.LOADING;
  errorMessage = '';
  VerificationState = VerificationState; // Expose enum to template

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');

    if (!token) {
      this.state = VerificationState.ERROR;
      this.errorMessage = 'Hiányzó token';
      return;
    }

    this.verifyEmail(token);
  }

  private async verifyEmail(token: string): Promise<void> {
    try {
      await this.authService.verifyEmail(token).toPromise();
      this.state = VerificationState.SUCCESS;

      // Auto-redirect to login after 3 seconds
      setTimeout(() => {
        this.router.navigate(['/login']);
      }, 3000);
    } catch (error: any) {
      this.state = VerificationState.ERROR;
      this.errorMessage =
        error?.error?.message || 'Érvénytelen vagy lejárt token';
    }
  }

  navigateToLogin(): void {
    this.router.navigate(['/login']);
  }
}
