import { Component, inject, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MaterialModule } from '@shared/material/material.module';
import { AuthService } from '@core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, MaterialModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  loginForm!: FormGroup;
  isLoading = false;
  isGoogleLoading = false;
  hidePassword = true;
  errorMessage = '';

  ngOnInit(): void {
    this.initializeForm();
  }

  private initializeForm(): void {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
      rememberMe: [false],
    });
  }

  get emailControl() {
    return this.loginForm.get('email');
  }

  get passwordControl() {
    return this.loginForm.get('password');
  }

  getErrorMessage(controlName: string): string {
    const control = this.loginForm.get(controlName);

    if (!control || !control.errors || !control.touched) {
      return '';
    }

    if (control.errors['required']) {
      return 'Ez a mező kötelező';
    }

    if (controlName === 'email' && control.errors['email']) {
      return 'Érvénytelen email cím';
    }

    return '';
  }

  async onEmailLogin(): Promise<void> {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const { email, password } = this.loginForm.value;

    try {
      await this.authService.loginWithEmail(email, password).toPromise();

      // Navigate based on user role
      const user = this.authService.getCurrentUserSync();
      if (user?.role === 'admin') {
        await this.router.navigate(['/admin/dashboard']);
      } else {
        await this.router.navigate(['/dashboard']);
      }
    } catch (error: any) {
      this.errorMessage =
        error?.error?.message || 'Bejelentkezés sikertelen. Ellenőrizd az email címet és a jelszót.';
      this.isLoading = false;
    }
  }

  async onGoogleLogin(): Promise<void> {
    try {
      this.isGoogleLoading = true;
      this.errorMessage = '';
      await this.authService.signInWithGoogle();
      // After successful OAuth, user will be redirected to callback
    } catch (error) {
      this.errorMessage = 'Google bejelentkezés sikertelen. Próbáld újra.';
      this.isGoogleLoading = false;
    }
  }

  togglePasswordVisibility(): void {
    this.hidePassword = !this.hidePassword;
  }
}
