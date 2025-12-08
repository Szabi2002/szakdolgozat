import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

import { FavoritesService } from '@core/services/favorites.service';
import { FavoriteRoute } from '@core/models/favorite-route.model';
import { FavoriteCardComponent } from '../../components/favorite-card/favorite-card.component';
import { FavoritesEmptyStateComponent } from '../../components/favorites-empty-state/favorites-empty-state.component';
import { SaveFavoriteDialogComponent } from '../../components/save-favorite-dialog/save-favorite-dialog.component';

@Component({
  selector: 'app-favorites-list',
  standalone: true,
  imports: [
    CommonModule,
    MatProgressSpinnerModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatDialogModule,
    FavoriteCardComponent,
    FavoritesEmptyStateComponent
  ],
  templateUrl: './favorites-list.component.html',
  styleUrls: ['./favorites-list.component.scss']
})
export class FavoritesListComponent implements OnInit, OnDestroy {
  favorites: FavoriteRoute[] = [];
  loading = false;
  error: string | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private readonly favoritesService: FavoritesService,
    private readonly router: Router,
    private readonly snackBar: MatSnackBar,
    private readonly dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadFavorites();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadFavorites(): void {
    this.loading = true;
    this.error = null;

    this.favoritesService.getFavorites()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (favorites) => {
          this.favorites = favorites;
          this.loading = false;
        },
        error: (error) => {
          this.error = error.message || 'Nem sikerült betölteni a kedvenceket. Kérlek próbáld újra.';
          this.loading = false;
        }
      });
  }

  onSelectFavorite(favorite: FavoriteRoute): void {
    // Navigate to trip planner with pre-filled stops
    this.router.navigate(['/planner'], {
      queryParams: {
        from: favorite.from_stop_id,
        to: favorite.to_stop_id,
        favorite: favorite.id
      }
    });
  }

  onEditFavorite(favorite: FavoriteRoute): void {
    const dialogRef = this.dialog.open(SaveFavoriteDialogComponent, {
      width: '500px',
      panelClass: 'glass-dialog-panel',
      data: {
        mode: 'edit',
        favoriteId: favorite.id,
        routeName: favorite.name,
        fromStopId: favorite.from_stop_id,
        fromStopName: favorite.from_stop?.name || 'Unknown',
        toStopId: favorite.to_stop_id,
        toStopName: favorite.to_stop?.name || 'Unknown'
      }
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(result => {
        if (result) {
          this.snackBar.open('Kedvenc sikeresen frissítve!', 'Bezár', { duration: 3000 });
          this.loadFavorites(); // Refresh the list
        }
      });
  }

  onDeleteFavorite(favorite: FavoriteRoute): void {
    // Simple confirmation using snackBar with action
    const snackBarRef = this.snackBar.open(
      `Biztosan törölni szeretnéd: "${favorite.name}"?`,
      'Törlés',
      {
        duration: 5000,
        horizontalPosition: 'center',
        verticalPosition: 'bottom'
      }
    );

    snackBarRef.onAction()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.deleteFavorite(favorite.id);
      });
  }

  private deleteFavorite(id: string): void {
    this.favoritesService.deleteFavorite(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.snackBar.open('Kedvenc sikeresen törölve', 'Bezár', { duration: 3000 });
          this.loadFavorites(); // Refresh the list
        },
        error: (error) => {
          this.snackBar.open(
            error.message || 'Nem sikerült törölni a kedvencet',
            'Bezár',
            { duration: 3000 }
          );
        }
      });
  }

  onCreateNewFavorite(): void {
    this.router.navigate(['/planner']);
  }

  retryLoad(): void {
    this.loadFavorites();
  }

  trackByFavoriteId(index: number, favorite: FavoriteRoute): string {
    return favorite.id;
  }
}
