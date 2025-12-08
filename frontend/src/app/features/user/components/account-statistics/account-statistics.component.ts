import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';

import { UserProfileService } from '@core/services/user-profile.service';
import { UserStatistics } from '@core/models/user-profile.model';

interface StatCard {
  title: string;
  value: string | number;
  icon: string;
  color: string;
  route?: string;
  loading?: boolean;
}

@Component({
  selector: 'app-account-statistics',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatButtonModule
  ],
  templateUrl: './account-statistics.component.html',
  styleUrls: ['./account-statistics.component.scss']
})
export class AccountStatisticsComponent implements OnInit, OnDestroy {
  statistics: UserStatistics | null = null;
  loading = true;
  error: string | null = null;

  statCards: StatCard[] = [];

  private destroy$ = new Subject<void>();

  constructor(
    private readonly userProfileService: UserProfileService,
    public readonly router: Router
  ) {}

  ngOnInit(): void {
    this.loadStatistics();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadStatistics(): void {
    this.loading = true;
    this.error = null;

    this.userProfileService.getStatistics()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (stats) => {
          this.statistics = stats;
          this.loading = false;
          this.buildStatCards(stats);
        },
        error: (error) => {
          this.error = error.message || 'Nem sikerült betölteni a statisztikákat. Kérlek próbáld újra.';
          this.loading = false;
        }
      });
  }

  private buildStatCards(stats: UserStatistics): void {
    this.statCards = [
      {
        title: 'Megvásárolt Jegyek',
        value: stats.tickets_purchased,
        icon: 'confirmation_number',
        color: '#252E8A',
        route: '/tickets/my-tickets'
      },
      {
        title: 'Összes Költés',
        value: this.formatCurrency(stats.total_spent),
        icon: 'payments',
        color: '#10B981',
        route: '/tickets/my-tickets'
      },
      {
        title: 'Mentett Kedvencek',
        value: stats.favorites_count,
        icon: 'favorite',
        color: '#9A4D87',
        route: '/favorites'
      },
      {
        title: 'Aktív Jegyek',
        value: stats.active_tickets,
        icon: 'verified',
        color: '#F59E0B',
        route: '/tickets/my-tickets?status=active'
      }
    ];
  }

  private formatCurrency(amount: number | undefined): string {
    if (amount === undefined || amount === null) {
      return '0 Ft';
    }
    return `${amount.toLocaleString('hu-HU')} Ft`;
  }

  formatDate(dateString: string | undefined): string {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('hu-HU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  onCardClick(route?: string): void {
    if (route) {
      this.router.navigateByUrl(route);
    }
  }

  retryLoad(): void {
    this.loadStatistics();
  }
}
