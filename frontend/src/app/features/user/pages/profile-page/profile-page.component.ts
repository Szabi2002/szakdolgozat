import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

import { AuthService } from '@core/services/auth.service';
import { User } from '@core/models/user.model';

@Component({
  selector: 'app-profile-page',
  standalone: true,
  imports: [
    CommonModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatButtonModule
  ],
  templateUrl: './profile-page.component.html',
  styleUrls: ['./profile-page.component.scss']
})
export class ProfilePageComponent implements OnInit, OnDestroy {
  currentUser: User | null = null;
  loading = true;

  private destroy$ = new Subject<void>();

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.loadUserData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Load current user data from auth service
   */
  private loadUserData(): void {
    this.loading = true;

    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (user) => {
          if (user) {
            this.currentUser = user;
          }
          this.loading = false;
        },
        error: () => {
          this.loading = false;
        }
      });
  }

  /**
   * Get role label in Hungarian
   */
  getRoleLabel(role: string | undefined): string {
    if (!role) return 'Felhasznalo';

    const roleLabels: Record<string, string> = {
      user: 'Felhasznalo',
      admin: 'Adminisztrator',
      provider: 'Szolgaltato'
    };

    return roleLabels[role] || role;
  }

  /**
   * Get role icon based on user role
   */
  getRoleIcon(role: string | undefined): string {
    if (!role) return 'person';

    const roleIcons: Record<string, string> = {
      user: 'person',
      admin: 'admin_panel_settings',
      provider: 'business'
    };

    return roleIcons[role] || 'person';
  }

  /**
   * Logout user and redirect to landing page
   */
  async logout(): Promise<void> {
    await this.authService.signOut();
    this.router.navigate(['/landing']);
  }
}
