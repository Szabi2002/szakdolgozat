import { Component, inject, HostListener, OnInit, OnDestroy, signal, computed, effect } from '@angular/core';
import { RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '@shared/material/material.module';
import { AuthService } from '@core/services/auth.service';
import { Observable, Subject } from 'rxjs';
import { filter, takeUntil, map } from 'rxjs/operators';
import { User } from '@core/models/user.model';

export interface MenuItem {
  label: string;
  icon: string;
  route: string;
  exactMatch?: boolean;
  section?: 'main' | 'admin';
}

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

  // Menu Configurations
  private readonly USER_MENU_ITEMS: MenuItem[] = [
    { label: 'Főoldal', icon: 'home', route: '/dashboard', exactMatch: true, section: 'main' },
    { label: 'Utazástervező', icon: 'route', route: '/planner', section: 'main' },
    { label: 'Jegyeim', icon: 'confirmation_number', route: '/tickets/my-tickets', section: 'main' },
    { label: 'Kedvencek', icon: 'favorite', route: '/favorites', section: 'main' },
    { label: 'Értékeléseim', icon: 'star', route: '/ratings/my-ratings', section: 'main' },
    { label: 'Jelentéseim', icon: 'feedback', route: '/reports/my-reports', section: 'main' },
    { label: 'Profilom', icon: 'account_circle', route: '/profile', section: 'main' }
  ];

  private readonly ADMIN_MENU_ITEMS: MenuItem[] = [
    { label: 'Áttekintő', icon: 'dashboard', route: '/admin/dashboard', exactMatch: true, section: 'admin' },
    { label: 'Értékelések moderálása', icon: 'rate_review', route: '/admin/ratings', section: 'admin' },
    { label: 'Jelentések moderálása', icon: 'assignment', route: '/admin/reports', section: 'admin' },
    { label: 'Útvonalak kezelése', icon: 'alt_route', route: '/admin/routes', section: 'admin' },
    { label: 'Felhasználók kezelése', icon: 'group', route: '/admin/users', section: 'admin' }
  ];

  // Filtered Menu Items based on User Role
  menuItems$: Observable<MenuItem[]> = this.currentUser$.pipe(
    filter(user => !!user), // Ensure user exists
    map((user: User | null) => {
      if (!user) return [];

      if (user.role === 'admin') {
        return [...this.ADMIN_MENU_ITEMS];
      }

      return [...this.USER_MENU_ITEMS];
    })
  );

  // Mobile sidebar state
  isSidebarOpen = false;
  isMobile = false;

  // Desktop collapse state (using signals for reactivity)
  // isExpanded: true = sidebar is expanded (hovered). false = sidebar is collapsed.
  isExpanded = signal(false);

  // Sidebar is effectively collapsed if NOT expanded
  isCollapsed = computed(() => !this.isExpanded());

  sidebarWidth = computed(() => this.isCollapsed() ? 70 : 260);

  // Effect to update CSS variable when sidebar width changes
  private sidebarWidthEffect = effect(() => {
    document.documentElement.style.setProperty('--sidebar-width', `${this.sidebarWidth()}px`);
  });

  ngOnInit(): void {
    this.checkMobile();
    // No loadCollapseState needed for pure hover

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
      this.isExpanded.set(false); // Ensure collapsed on desktop initially
    }
  }

  /**
   * Toggle mobile sidebar (overlay mode)
   */
  toggleSidebar(): void {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  onMouseEnter(): void {
    if (!this.isMobile) {
      this.isExpanded.set(true);
    }
  }

  onMouseLeave(): void {
    if (!this.isMobile) {
      this.isExpanded.set(false);
    }
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
