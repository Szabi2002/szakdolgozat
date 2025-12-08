import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { MaterialModule } from '@shared/material/material.module';
import { AuthService } from '@core/services/auth.service';
import { User } from '@core/models/user.model';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, MaterialModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit, OnDestroy {
  currentUser: User | null = null;
  loading = false;

  private destroy$ = new Subject<void>();

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadUserData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Load current user data
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
   * Logout user and redirect to landing page
   */
  logout(): void {
    this.authService.signOut().subscribe({
      next: () => {
        this.router.navigate(['/landing']);
      },
      error: () => {
        // Even on error, try to redirect
        this.router.navigate(['/landing']);
      }
    });
  }
}
