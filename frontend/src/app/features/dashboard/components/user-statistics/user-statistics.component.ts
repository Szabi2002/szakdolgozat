import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '@shared/material/material.module';
import { TicketsService } from '@core/services/tickets.service';
import { FavoritesService } from '@core/services/favorites.service';
import { forkJoin } from 'rxjs';

interface UserStatistics {
  totalTickets: number;
  activeTickets: number;
  favoriteRoutes: number;
  totalTrips: number;
}

@Component({
  selector: 'app-user-statistics',
  standalone: true,
  imports: [CommonModule, MaterialModule],
  templateUrl: './user-statistics.component.html',
  styleUrls: ['./user-statistics.component.scss'],
})
export class UserStatisticsComponent implements OnInit {
  private ticketsService = inject(TicketsService);
  private favoritesService = inject(FavoritesService);

  statistics: UserStatistics = {
    totalTickets: 0,
    activeTickets: 0,
    favoriteRoutes: 0,
    totalTrips: 0,
  };

  isLoading = true;
  errorMessage = '';

  ngOnInit(): void {
    this.loadStatistics();
  }

  /**
   * Load user statistics
   */
  private loadStatistics(): void {
    this.isLoading = true;

    forkJoin({
      tickets: this.ticketsService.getMyTickets(),
      favorites: this.favoritesService.getFavorites(),
    }).subscribe({
      next: ({ tickets, favorites }) => {
        this.statistics = {
          totalTickets: tickets.length,
          activeTickets: tickets.filter((t) => t.status === 'active').length,
          favoriteRoutes: favorites.length,
          totalTrips: tickets.filter((t) => t.status === 'used').length,
        };
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Nem sikerült betölteni a statisztikákat.';
        this.isLoading = false;
      },
    });
  }

  /**
   * Get stats for display
   */
  getStats() {
    return [
      {
        icon: 'confirmation_number',
        label: 'Összes jegy',
        value: this.statistics.totalTickets,
      },
      {
        icon: 'check_circle',
        label: 'Aktív jegyek',
        value: this.statistics.activeTickets,
      },
      {
        icon: 'star',
        label: 'Kedvenc útvonalak',
        value: this.statistics.favoriteRoutes,
      },
      {
        icon: 'directions',
        label: 'Összes utazás',
        value: this.statistics.totalTrips,
      },
    ];
  }
}
