import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MaterialModule } from '@shared/material/material.module';
import { AuthService } from '@core/services/auth.service';
import { PasswordStrengthIndicatorComponent } from '@shared/components/password-strength-indicator/password-strength-indicator.component';
import {
  passwordRequirementsValidator,
  matchValidator,
} from '@core/validators/password.validator';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MaterialModule,
    PasswordStrengthIndicatorComponent,
  ],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
})
export class RegisterComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  registerForm!: FormGroup;
  isLoading = false;
  hidePassword = true;
  hideConfirmPassword = true;
  errorMessage = '';

  ngOnInit(): void {
    this.initializeForm();
  }

  private initializeForm(): void {
    this.registerForm = this.fb.group(
      {
        name: ['', [Validators.required, Validators.minLength(2)]],
        email: ['', [Validators.required, Validators.email]],
        password: [
          '',
          [Validators.required, Validators.minLength(8), passwordRequirementsValidator()],
        ],
        confirmPassword: ['', [Validators.required]],
      },
      {
        validators: [matchValidator('password', 'confirmPassword')],
      }
    );
  }

  get nameControl() {
    return this.registerForm.get('name');
  }

  get emailControl() {
    return this.registerForm.get('email');
  }

  get passwordControl() {
    return this.registerForm.get('password');
  }

  get confirmPasswordControl() {
    return this.registerForm.get('confirmPassword');
  }

  get currentPassword(): string {
    return this.passwordControl?.value || '';
  }

  getErrorMessage(controlName: string): string {
    const control = this.registerForm.get(controlName);

    if (!control || !control.errors || !control.touched) {
      return '';
    }

    if (control.errors['required']) {
      return 'Ez a mező kötelező';
    }

    if (controlName === 'email' && control.errors['email']) {
      return 'Érvénytelen email cím';
    }

    if (controlName === 'name' && control.errors['minlength']) {
      return 'A névnek legalább 2 karakter hosszúnak kell lennie';
    }

    if (controlName === 'password') {
      if (control.errors['minlength']) {
        return 'A jelszónak legalább 8 karakter hosszúnak kell lennie';
      }
      if (control.errors['passwordRequirements']) {
        return 'A jelszónak tartalmaznia kell legalább 1 nagybetűt és 1 számot';
      }
    }

    if (controlName === 'confirmPassword' && control.errors['mustMatch']) {
      return 'A jelszavak nem egyeznek';
    }

    return '';
  }

  async onSubmit(): Promise<void> {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const formValue = this.registerForm.value;

    try {
      await this.authService
        .registerWithEmail({
          email: formValue.email,
          password: formValue.password,
          name: formValue.name,
        })
        .toPromise();

      this.snackBar.open(
        'Regisztráció sikeres! Elküldtünk egy megerősítő emailt.',
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
        error?.error?.message || 'Regisztráció sikertelen. Próbáld újra.';
      this.isLoading = false;
    }
  }

  async onGoogleRegister(): Promise<void> {
    try {
      this.isLoading = true;
      this.errorMessage = '';
      await this.authService.signInWithGoogle();
    } catch (error) {
      this.errorMessage = 'Google regisztráció sikertelen. Próbáld újra.';
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
