import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Subject, takeUntil } from 'rxjs';
import { Rating } from '../../../../core/models/rating.model';
import { RatingsService } from '../../../../core/services/ratings.service';
import { SupabaseService } from '../../../../core/services/supabase.service';
import { RatingsListComponent } from '../../components/ratings-list/ratings-list.component';
import { RatingFormDialogComponent } from '../../components/rating-form-dialog/rating-form-dialog.component';
import { RatingCardComponent } from '../../../../shared/components/rating-card/rating-card.component';

/**
 * Page component for displaying user's own ratings
 */
@Component({
  selector: 'app-my-ratings',
  standalone: true,
  imports: [
    CommonModule,
    MatTabsModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatSnackBarModule,
    RatingsListComponent,
    RatingCardComponent
  ],
  templateUrl: './my-ratings.component.html',
  styleUrls: ['./my-ratings.component.scss']
})
export class MyRatingsComponent implements OnInit, OnDestroy {
  ratings: Rating[] = [];
  stats = {
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0
  };
  currentUserId: string | null = null;
  isLoading = false;
  selectedStatus: 'all' | 'pending' | 'approved' | 'rejected' = 'all';

  private destroy$ = new Subject<void>();

  constructor(
    private ratingsService: RatingsService,
    private supabaseService: SupabaseService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadCurrentUser();
    this.loadStats();
    this.loadRatings();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Load current user information
   */
  private loadCurrentUser(): void {
    try {
      const user = this.supabaseService.user;
      this.currentUserId = user?.id || null;
    } catch (error) {
      console.error('Failed to load current user:', error);
    }
  }

  /**
   * Load rating statistics
   */
  loadStats(): void {
    this.ratingsService.getMyRatingStats()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (stats) => {
          this.stats = stats;
        },
        error: (error) => {
          console.error('Failed to load stats:', error);
        }
      });
  }

  /**
   * Load ratings based on selected status
   */
  loadRatings(): void {
    this.isLoading = true;
    const statusFilter = this.selectedStatus === 'all' ? undefined : this.selectedStatus;

    this.ratingsService.getMyRatings(statusFilter)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (ratings) => {
          this.ratings = Array.isArray(ratings) ? ratings : [];
          this.isLoading = false;
        },
        error: (error) => {
          this.ratings = [];
          this.snackBar.open(
            error.message || 'Nem sikerült betölteni az értékeléseket',
            'Bezár',
            { duration: 3000, panelClass: ['error-snackbar'] }
          );
          this.isLoading = false;
        }
      });
  }

  /**
   * Handle tab change
   * @param index Tab index
   */
  onTabChange(index: number): void {
    switch (index) {
      case 0: this.selectedStatus = 'all'; break;
      case 1: this.selectedStatus = 'pending'; break;
      case 2: this.selectedStatus = 'approved'; break;
      case 3: this.selectedStatus = 'rejected'; break;
    }
    this.loadRatings();
  }

  /**
   * Handle edit rating
   * @param rating Rating to edit
   */
  onEditRating(rating: Rating): void {
    const dialogRef = this.dialog.open(RatingFormDialogComponent, {
      width: '600px',
      maxWidth: '95vw',
      panelClass: 'glass-dialog-panel',
      data: {
        existingRating: rating,
        routeId: rating.route_id,
        routeName: rating.route?.name ? `${rating.route?.route_number} - ${rating.route?.name}` : 'Ismeretlen járat'
      },
      disableClose: true
    });

    dialogRef.afterClosed().pipe(takeUntil(this.destroy$)).subscribe((result) => {
      if (result) {
        this.loadStats();
        this.loadRatings();
      }
    });
  }

  /**
   * Handle delete rating
   * @param rating Rating to delete
   */
  onDeleteRating(rating: Rating): void {
    if (!confirm('Biztosan törölni szeretnéd ezt az értékelést? Ez a művelet nem vonható vissza.')) {
      return;
    }

    this.ratingsService.deleteRating(rating.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.snackBar.open('Értékelés sikeresen törölve', 'Bezár', {
            duration: 3000,
            panelClass: ['success-snackbar']
          });
          this.loadStats();
          this.loadRatings();
        },
        error: (error) => {
          this.snackBar.open(
            error.message || 'Nem sikerült törölni az értékelést',
            'Bezár',
            { duration: 3000, panelClass: ['error-snackbar'] }
          );
        }
      });
  }

  /**
   * Handle photo click (open in lightbox/new tab)
   * @param photoUrl Photo URL
   */
  onPhotoClick(photoUrl: string): void {
    window.open(photoUrl, '_blank');
  }

  /**
   * Handle view route navigation
   * @param routeId Route ID
   */
  onViewRoute(routeId: string): void {
    if (routeId) {
      this.router.navigate(['/routes', routeId]);
    }
  }

  /**
   * Refresh ratings list
   */
  onRefresh(): void {
    this.loadStats();
    this.loadRatings();
  }

  /**
   * TrackBy function for rating list performance
   * @param index Item index
   * @param rating Rating item
   */
  trackByRatingId(index: number, rating: Rating): string {
    return rating.id;
  }
}
