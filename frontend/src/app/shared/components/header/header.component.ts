import { Component, inject, HostListener, OnInit, OnDestroy, signal, computed, effect } from '@angular/core';
import { RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '@shared/material/material.module';
import { AuthService } from '@core/services/auth.service';
import { Observable, Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';
import { User } from '@core/models/user.model';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [MaterialModule, RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private router = inject(Router);
  private destroy$ = new Subject<void>();

  isAuthenticated$: Observable<boolean> = this.authService.isAuthenticated$;
  currentUser$: Observable<User | null> = this.authService.currentUser$;

  // Mobile sidebar state
  isSidebarOpen = false;
  isMobile = false;

  // Desktop collapse state (using signals for reactivity)
  isCollapsed = signal(false);
  sidebarWidth = computed(() => this.isCollapsed() ? 70 : 260);

  // Effect to update CSS variable when sidebar width changes
  private sidebarWidthEffect = effect(() => {
    document.documentElement.style.setProperty('--sidebar-width', `${this.sidebarWidth()}px`);
  });

  ngOnInit(): void {
    this.checkMobile();
    this.loadCollapseState();

    // Close sidebar on navigation (mobile only)
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        if (this.isMobile) {
          this.isSidebarOpen = false;
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  @HostListener('window:resize')
  onResize(): void {
    this.checkMobile();
  }

  private checkMobile(): void {
    const wasMobile = this.isMobile;
    this.isMobile = window.innerWidth < 1024; // $breakpoint-lg

    // Close sidebar if switching from mobile to desktop
    if (wasMobile && !this.isMobile) {
      this.isSidebarOpen = false;
    }
  }

  /**
   * Load collapse state from localStorage
   */
  private loadCollapseState(): void {
    const saved = localStorage.getItem('sidebar_collapsed');
    if (saved !== null) {
      this.isCollapsed.set(saved === 'true');
    }
  }

  /**
   * Toggle mobile sidebar (overlay mode)
   */
  toggleSidebar(): void {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  /**
   * Toggle desktop sidebar collapse state
   */
  toggleCollapse(): void {
    this.isCollapsed.update(v => !v);
    localStorage.setItem('sidebar_collapsed', String(this.isCollapsed()));
  }

  getUserDisplayName(user: User): string {
    // Try to get display_name from user profile, fallback to name or email
    return (user as any).display_name || user.name || user.email;
  }

  /**
   * Get user initials for collapsed avatar
   */
  getUserInitials(user: User): string {
    const displayName = this.getUserDisplayName(user);
    const parts = displayName.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return displayName.substring(0, 2).toUpperCase();
  }

  onLogout(): void {
    this.authService.signOut();
    this.isSidebarOpen = false;
  }

  scrollToSection(sectionId: string): void {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    if (this.isMobile) {
      this.isSidebarOpen = false;
    }
  }
}
