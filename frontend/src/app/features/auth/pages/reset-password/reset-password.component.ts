import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MaterialModule } from '@shared/material/material.module';
import { AuthService } from '@core/services/auth.service';
import { PasswordStrengthIndicatorComponent } from '@shared/components/password-strength-indicator/password-strength-indicator.component';
import {
  passwordRequirementsValidator,
  matchValidator,
} from '@core/validators/password.validator';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MaterialModule,
    PasswordStrengthIndicatorComponent,
  ],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.scss',
})
export class ResetPasswordComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private snackBar = inject(MatSnackBar);

  resetPasswordForm!: FormGroup;
  isLoading = false;
  hidePassword = true;
  hideConfirmPassword = true;
  errorMessage = '';
  token: string = '';

  ngOnInit(): void {
    this.token = this.route.snapshot.paramMap.get('token') || '';

    if (!this.token) {
      this.errorMessage = 'Érvénytelen token';
    }

    this.initializeForm();
  }

  private initializeForm(): void {
    this.resetPasswordForm = this.fb.group(
      {
        newPassword: [
          '',
          [Validators.required, Validators.minLength(8), passwordRequirementsValidator()],
        ],
        confirmNewPassword: ['', [Validators.required]],
      },
      {
        validators: [matchValidator('newPassword', 'confirmNewPassword')],
      }
    );
  }

  get newPasswordControl() {
    return this.resetPasswordForm.get('newPassword');
  }

  get confirmNewPasswordControl() {
    return this.resetPasswordForm.get('confirmNewPassword');
  }

  get currentPassword(): string {
    return this.newPasswordControl?.value || '';
  }

  getErrorMessage(controlName: string): string {
    const control = this.resetPasswordForm.get(controlName);

    if (!control || !control.errors || !control.touched) {
      return '';
    }

    if (control.errors['required']) {
      return 'Ez a mező kötelező';
    }

    if (controlName === 'newPassword') {
      if (control.errors['minlength']) {
        return 'A jelszónak legalább 8 karakter hosszúnak kell lennie';
      }
      if (control.errors['passwordRequirements']) {
        return 'A jelszónak tartalmaznia kell legalább 1 nagybetűt és 1 számot';
      }
    }

    if (controlName === 'confirmNewPassword' && control.errors['mustMatch']) {
      return 'A jelszavak nem egyeznek';
    }

    return '';
  }

  async onSubmit(): Promise<void> {
    if (this.resetPasswordForm.invalid || !this.token) {
      this.resetPasswordForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const { newPassword } = this.resetPasswordForm.value;

    try {
      await this.authService.resetPassword(this.token, newPassword).toPromise();

      this.snackBar.open(
        'Jelszó sikeresen megváltoztatva! Most már bejelentkezhetsz az új jelszóval.',
        'Bezár',
        {
          duration: 5000,
          horizontalPosition: 'center',
          verticalPosition: 'top',
          panelClass: ['success-snackbar'],
        }
      );

      await this.router.navigate(['/login']);
    } catch (error: any) {
      this.errorMessage =
        error?.error?.message || 'Érvénytelen vagy lejárt token. Kérj új jelszó visszaállítási linket.';
      this.isLoading = false;
    }
  }

  togglePasswordVisibility(): void {
    this.hidePassword = !this.hidePassword;
  }

  toggleConfirmPasswordVisibility(): void {
    this.hideConfirmPassword = !this.hideConfirmPassword;
  }
}
