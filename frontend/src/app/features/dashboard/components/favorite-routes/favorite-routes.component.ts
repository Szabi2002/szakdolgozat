import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MaterialModule } from '@shared/material/material.module';
import { FavoritesService } from '@core/services/favorites.service';
import { FavoriteRoute } from '@core/models/favorite-route.model';

@Component({
  selector: 'app-favorite-routes',
  standalone: true,
  imports: [CommonModule, MaterialModule],
  templateUrl: './favorite-routes.component.html',
  styleUrls: ['./favorite-routes.component.scss'],
})
export class FavoriteRoutesComponent implements OnInit {
  private favoritesService = inject(FavoritesService);
  private router = inject(Router);

  favoriteRoutes: FavoriteRoute[] = [];
  isLoading = true;
  errorMessage = '';

  ngOnInit(): void {
    this.loadFavoriteRoutes();
  }

  /**
   * Load favorite routes for the current user
   */
  private loadFavoriteRoutes(): void {
    this.isLoading = true;

    this.favoritesService.getFavorites().subscribe({
      next: (favorites) => {
        this.favoriteRoutes = favorites.slice(0, 3); // Show only the 3 most recent
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Nem sikerült betölteni a kedvenc útvonalakat.';
        this.isLoading = false;
      },
    });
  }

  /**
   * Navigate to trip planner with favorite route
   */
  viewRoute(favoriteId: string): void {
    const favorite = this.favoriteRoutes.find(f => f.id === favoriteId);
    if (!favorite) {
      return;
    }

    this.router.navigate(['/planner'], {
      queryParams: {
        from: favorite.from_stop_id,
        to: favorite.to_stop_id
      },
    });
  }

  /**
   * Remove route from favorites
   */
  removeFromFavorites(event: Event, favoriteId: string): void {
    event.stopPropagation();

    this.favoritesService.deleteFavorite(favoriteId).subscribe({
      next: () => {
        // Remove from local array
        this.favoriteRoutes = this.favoriteRoutes.filter((r) => r.id !== favoriteId);
      },
      error: () => {
        this.errorMessage = 'Nem sikerült eltávolítani a kedvencekből.';
      },
    });
  }

  /**
   * Navigate to favorites list
   */
  viewAllRoutes(): void {
    this.router.navigate(['/favorites']);
  }

  /**
   * Get display name for favorite
   */
  getRouteName(favorite: FavoriteRoute): string {
    return favorite.name || 'Kedvenc útvonal';
  }

  /**
   * Get from-to description
   */
  getRouteDescription(favorite: FavoriteRoute): string {
    const from = favorite.from_stop?.name || 'Indulás';
    const to = favorite.to_stop?.name || 'Érkezés';
    return `${from} → ${to}`;
  }
}
