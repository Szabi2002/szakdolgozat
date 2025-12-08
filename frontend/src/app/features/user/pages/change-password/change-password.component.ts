import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MaterialModule } from '@shared/material/material.module';
import { AuthService } from '@core/services/auth.service';
import { PasswordStrengthIndicatorComponent } from '@shared/components/password-strength-indicator/password-strength-indicator.component';
import {
  passwordRequirementsValidator,
  matchValidator,
} from '@core/validators/password.validator';

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MaterialModule,
    PasswordStrengthIndicatorComponent,
  ],
  templateUrl: './change-password.component.html',
  styleUrl: './change-password.component.scss',
})
export class ChangePasswordComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private snackBar = inject(MatSnackBar);

  changePasswordForm!: FormGroup;
  isLoading = false;
  hideCurrentPassword = true;
  hideNewPassword = true;
  hideConfirmPassword = true;
  errorMessage = '';
  hasPassword = true; // Will be determined based on user's auth method

  ngOnInit(): void {
    this.checkUserAuthMethod();
    this.initializeForm();
  }

  private checkUserAuthMethod(): void {
    const user = this.authService.getCurrentUserSync();
    // If user doesn't have password_hash, they're OAuth-only
    // Note: You'll need to add this field to the User model
    // For now, we assume all users can change password
    this.hasPassword = true;
  }

  private initializeForm(): void {
    this.changePasswordForm = this.fb.group(
      {
        currentPassword: ['', [Validators.required]],
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

  get currentPasswordControl() {
    return this.changePasswordForm.get('currentPassword');
  }

  get newPasswordControl() {
    return this.changePasswordForm.get('newPassword');
  }

  get confirmNewPasswordControl() {
    return this.changePasswordForm.get('confirmNewPassword');
  }

  get currentNewPassword(): string {
    return this.newPasswordControl?.value || '';
  }

  getErrorMessage(controlName: string): string {
    const control = this.changePasswordForm.get(controlName);

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
    if (this.changePasswordForm.invalid) {
      this.changePasswordForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const { currentPassword, newPassword } = this.changePasswordForm.value;

    try {
      await this.authService.changePassword(currentPassword, newPassword).toPromise();

      this.snackBar.open('Jelszó sikeresen megváltoztatva!', 'Bezár', {
        duration: 3000,
        horizontalPosition: 'center',
        verticalPosition: 'top',
        panelClass: ['success-snackbar'],
      });

      this.changePasswordForm.reset();
      this.isLoading = false;
    } catch (error: any) {
      this.errorMessage =
        error?.error?.message || 'Jelszó megváltoztatás sikertelen. Ellenőrizd a jelenlegi jelszót.';
      this.isLoading = false;
    }
  }

  toggleCurrentPasswordVisibility(): void {
    this.hideCurrentPassword = !this.hideCurrentPassword;
  }

  toggleNewPasswordVisibility(): void {
    this.hideNewPassword = !this.hideNewPassword;
  }

  toggleConfirmPasswordVisibility(): void {
    this.hideConfirmPassword = !this.hideConfirmPassword;
  }
}
