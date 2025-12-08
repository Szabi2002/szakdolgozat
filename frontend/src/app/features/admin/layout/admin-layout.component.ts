import { Component, inject, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MaterialModule } from '@shared/material/material.module';
import { AuthService } from '@core/services/auth.service';
import { User } from '@core/models/user.model';
import { Subscription } from 'rxjs';
import { trigger, state, style, transition, animate } from '@angular/animations';

interface MenuItem {
  label: string;
  route: string;
  icon: string;
  description?: string;
}

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, MaterialModule],
  templateUrl: './admin-layout.component.html',
  styleUrl: './admin-layout.component.scss',
  animations: [
    trigger('slideInOut', [
      state('open', style({
        transform: 'translateX(0)',
        opacity: 1
      })),
      state('closed', style({
        transform: 'translateX(-100%)',
        opacity: 0
      })),
      transition('closed => open', [
        animate('300ms ease-out')
      ]),
      transition('open => closed', [
        animate('200ms ease-in')
      ])
    ]),
    trigger('fadeInOut', [
      state('visible', style({
        opacity: 1
      })),
      state('hidden', style({
        opacity: 0,
        pointerEvents: 'none'
      })),
      transition('hidden => visible', [
        animate('200ms ease-out')
      ]),
      transition('visible => hidden', [
        animate('150ms ease-in')
      ])
    ])
  ]
})
export class AdminLayoutComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private subscription = new Subscription();

  currentUser: User | null = null;
  isSidenavOpen = true;
  isMobileView = false;
  isMobileMenuOpen = false;

  menuItems: MenuItem[] = [
    {
      label: 'Dashboard',
      route: '/admin/dashboard',
      icon: 'dashboard',
      description: 'Rendszer attekintes'
    },
    {
      label: 'Jaratok',
      route: '/admin/routes',
      icon: 'route',
      description: 'Jaratok kezelese'
    },
    {
      label: 'Felhasznalok',
      route: '/admin/users',
      icon: 'people',
      description: 'Felhasznalok kezelese'
    },
    {
      label: 'Ertekelesek',
      route: '/admin/ratings',
      icon: 'star',
      description: 'Ertekelesek moderalasa'
    },
    {
      label: 'Jelentesek',
      route: '/admin/reports',
      icon: 'report',
      description: 'Hibajelentesek kezelese'
    },
  ];

  ngOnInit(): void {
    this.checkViewport();
    this.subscription.add(
      this.authService.currentUser$.subscribe((user) => {
        this.currentUser = user;
      })
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  @HostListener('window:resize')
  onResize(): void {
    this.checkViewport();
  }

  private checkViewport(): void {
    const wasMobile = this.isMobileView;
    this.isMobileView = window.innerWidth < 1024;

    if (this.isMobileView && !wasMobile) {
      this.isSidenavOpen = false;
      this.isMobileMenuOpen = false;
    } else if (!this.isMobileView && wasMobile) {
      this.isSidenavOpen = true;
      this.isMobileMenuOpen = false;
    }
  }

  toggleSidenav(): void {
    if (this.isMobileView) {
      this.isMobileMenuOpen = !this.isMobileMenuOpen;
    } else {
      this.isSidenavOpen = !this.isSidenavOpen;
    }
  }

  closeMobileMenu(): void {
    if (this.isMobileView) {
      this.isMobileMenuOpen = false;
    }
  }

  onNavItemClick(): void {
    if (this.isMobileView) {
      this.closeMobileMenu();
    }
  }

  getUserInitials(): string {
    if (!this.currentUser?.name) return 'A';
    const names = this.currentUser.name.split(' ');
    if (names.length >= 2) {
      return (names[0][0] + names[1][0]).toUpperCase();
    }
    return names[0][0].toUpperCase();
  }

  async logout(): Promise<void> {
    await this.authService.signOut();
  }
}
