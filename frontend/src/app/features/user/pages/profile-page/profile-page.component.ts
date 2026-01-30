import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Subject, takeUntil, firstValueFrom } from 'rxjs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { PasswordStrengthIndicatorComponent } from '@shared/components/password-strength-indicator/password-strength-indicator.component';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';

import { AuthService } from '@core/services/auth.service';
import { UserProfileService } from '@core/services/user-profile.service';
import { User } from '@core/models/user.model';

@Component({
  selector: 'app-profile-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatSnackBarModule,
    MatSnackBarModule,
    MatTooltipModule,
    PasswordStrengthIndicatorComponent
  ],
  templateUrl: './profile-page.component.html',
  styleUrls: ['./profile-page.component.scss']
})
export class ProfilePageComponent implements OnInit, OnDestroy {
  currentUser: User | null = null;
  loading = true;
  savingName = false;
  changingPassword = false;

  // Edit Name
  isEditingName = false;
  nameForm: FormGroup;

  // Change Password
  passwordForm: FormGroup;
  showPasswordChange = false;

  private destroy$ = new Subject<void>();

  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private userProfileService = inject(UserProfileService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  constructor() {
    this.nameForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      displayName: ['', [Validators.maxLength(50)]]
    });

    this.passwordForm = this.fb.group({
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit(): void {
    this.loadUserData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadUserData(): void {
    this.loading = true;
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (user) => {
          if (user) {
            this.currentUser = user;
            this.nameForm.patchValue({
              name: user.name,
              displayName: (user as any).display_name || ''
            });
          }
          this.loading = false;
        },
        error: () => {
          this.loading = false;
        }
      });
  }

  passwordMatchValidator(g: FormGroup) {
    return g.get('newPassword')?.value === g.get('confirmPassword')?.value
      ? null
      : { mismatch: true };
  }

  get newPasswordValue(): string {
    return this.passwordForm.get('newPassword')?.value || '';
  }

  toggleEditName(): void {
    this.isEditingName = !this.isEditingName;
    if (this.isEditingName && this.currentUser) {
      this.nameForm.patchValue({
        name: this.currentUser.name,
        displayName: (this.currentUser as any).display_name || ''
      });
    }
  }

  async saveName(): Promise<void> {
    if (this.nameForm.invalid) return;

    this.savingName = true;
    try {
      const { name, displayName } = this.nameForm.value;
      await firstValueFrom(this.userProfileService.updateProfile({
        name: name,
        display_name: displayName || null
      }));

      // Reload current user to get updated data
      await firstValueFrom(this.authService.getCurrentUser());

      this.isEditingName = false;
      this.snackBar.open('Név sikeresen módosítva!', 'Bezár', { duration: 3000, panelClass: 'success-snackbar' });

    } catch (error) {
      this.snackBar.open('Nem sikerült módosítani a nevet.', 'Bezár', { duration: 3000, panelClass: 'error-snackbar' });
      console.error(error);
    } finally {
      this.savingName = false;
    }
  }

  togglePasswordChange(): void {
    this.showPasswordChange = !this.showPasswordChange;
    if (!this.showPasswordChange) {
      this.passwordForm.reset();
    }
  }

  async changePassword(): Promise<void> {
    if (this.passwordForm.invalid) return;

    this.changingPassword = true;
    try {
      const { currentPassword, newPassword } = this.passwordForm.value;
      await firstValueFrom(this.authService.changePassword(currentPassword, newPassword));

      this.showPasswordChange = false;
      this.passwordForm.reset();
      this.snackBar.open('Jelszó sikeresen megváltoztatva!', 'Bezár', { duration: 3000, panelClass: 'success-snackbar' });
    } catch (error: any) {
      this.snackBar.open(error.message || 'Hiba a jelszó módosítása során.', 'Bezár', { duration: 3000, panelClass: 'error-snackbar' });
      console.error(error);
    } finally {
      this.changingPassword = false;
    }
  }

  getRoleLabel(role: string | undefined): string {
    if (!role) return 'Felhasználó';
    const roleLabels: Record<string, string> = {
      user: 'Felhasználó',
      admin: 'Adminisztrátor',
      provider: 'Szolgáltató'
    };
    return roleLabels[role] || role;
  }

  getRoleIcon(role: string | undefined): string {
    if (!role) return 'person';
    const roleIcons: Record<string, string> = {
      user: 'person',
      admin: 'admin_panel_settings',
      provider: 'business'
    };
    return roleIcons[role] || 'person';
  }

  async logout(): Promise<void> {
    await this.authService.signOut();
  }
}
