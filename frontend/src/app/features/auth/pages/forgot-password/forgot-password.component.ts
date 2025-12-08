import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MaterialModule } from '@shared/material/material.module';
import { AuthService } from '@core/services/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, MaterialModule],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.scss',
})
export class ForgotPasswordComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private snackBar = inject(MatSnackBar);

  forgotPasswordForm!: FormGroup;
  isLoading = false;
  isSuccess = false;
  errorMessage = '';

  ngOnInit(): void {
    this.initializeForm();
  }

  private initializeForm(): void {
    this.forgotPasswordForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
    });
  }

  get emailControl() {
    return this.forgotPasswordForm.get('email');
  }

  getErrorMessage(): string {
    const control = this.emailControl;

    if (!control || !control.errors || !control.touched) {
      return '';
    }

    if (control.errors['required']) {
      return 'Ez a mező kötelező';
    }

    if (control.errors['email']) {
      return 'Érvénytelen email cím';
    }

    return '';
  }

  async onSubmit(): Promise<void> {
    if (this.forgotPasswordForm.invalid) {
      this.forgotPasswordForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const { email } = this.forgotPasswordForm.value;

    try {
      await this.authService.forgotPassword(email).toPromise();

      this.isSuccess = true;
      this.snackBar.open(
        'Elküldtük az emailt a jelszó visszaállítási linkkel!',
        'Bezár',
        {
          duration: 5000,
          horizontalPosition: 'center',
          verticalPosition: 'top',
          panelClass: ['success-snackbar'],
        }
      );
    } catch (error: any) {
      this.errorMessage =
        error?.error?.message || 'Hiba történt. Próbáld újra.';
      this.isLoading = false;
    }
  }
}
