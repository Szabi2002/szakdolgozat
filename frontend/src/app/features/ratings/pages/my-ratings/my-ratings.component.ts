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
import { RatingFormComponent } from '../../components/rating-form/rating-form.component';
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
  allRatings: Rating[] = [];
  pendingRatings: Rating[] = [];
  approvedRatings: Rating[] = [];
  rejectedRatings: Rating[] = [];
  currentUserId: string | null = null;
  isLoading = false;

  private destroy$ = new Subject<void>();

  constructor(
    private ratingsService: RatingsService,
    private supabaseService: SupabaseService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Defensive initialization to prevent array/pagination errors
    this.allRatings = [];
    this.pendingRatings = [];
    this.approvedRatings = [];
    this.rejectedRatings = [];

    this.loadCurrentUser();
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
   * Load all user ratings
   */
  loadRatings(): void {
    this.isLoading = true;

    this.ratingsService.getMyRatings()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (ratings) => {
          // Ensure ratings is always an array
          this.allRatings = Array.isArray(ratings) ? ratings : [];
          this.filterRatingsByStatus();
          this.isLoading = false;
        },
        error: (error) => {
          // Reset to empty arrays on error
          this.allRatings = [];
          this.filterRatingsByStatus();
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
   * Filter ratings by status
   */
  private filterRatingsByStatus(): void {
    // Ensure allRatings is always an array to prevent filtering errors
    const safeRatings = Array.isArray(this.allRatings) ? this.allRatings : [];

    this.pendingRatings = safeRatings.filter(r => r && r.status === 'pending');
    this.approvedRatings = safeRatings.filter(r => r && r.status === 'approved');
    this.rejectedRatings = safeRatings.filter(r => r && r.status === 'rejected');
  }

  /**
   * Handle edit rating
   * @param rating Rating to edit
   */
  onEditRating(rating: Rating): void {
    const dialogRef = this.dialog.open(RatingFormComponent, {
      width: '800px',
      maxWidth: '95vw',
      data: { existingRating: rating },
      disableClose: true
    });

    const instance = dialogRef.componentInstance;
    instance.existingRating = rating;

    instance.success.pipe(takeUntil(this.destroy$)).subscribe(() => {
      dialogRef.close();
      this.loadRatings();
      this.snackBar.open('Értékelés sikeresen frissítve', 'Bezár', {
        duration: 3000,
        panelClass: ['success-snackbar']
      });
    });

    instance.cancel.pipe(takeUntil(this.destroy$)).subscribe(() => {
      dialogRef.close();
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
    this.loadRatings();
  }

  /**
   * Get status badge count
   * @param status Status type
   */
  getStatusCount(status: 'all' | 'pending' | 'approved' | 'rejected'): number {
    switch (status) {
      case 'all':
        return this.allRatings.length;
      case 'pending':
        return this.pendingRatings.length;
      case 'approved':
        return this.approvedRatings.length;
      case 'rejected':
        return this.rejectedRatings.length;
      default:
        return 0;
    }
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
