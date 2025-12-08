import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatChipsModule } from '@angular/material/chips';
import { Subject, takeUntil, forkJoin } from 'rxjs';
import { RoutesService, RouteDetails } from '@core/services/routes.service';
import { RatingsService } from '@core/services/ratings.service';
import { RatingStats } from '@core/models/rating.model';
import { RatingsListComponent } from '../../../ratings/components/ratings-list/ratings-list.component';
import { RatingFormDialogComponent } from '../../../ratings/components/rating-form-dialog/rating-form-dialog.component';
import { AuthService } from '@core/services/auth.service';

/**
 * Route Details page component displaying route information and ratings
 */
@Component({
  selector: 'app-route-details',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatChipsModule,
    RatingsListComponent
  ],
  templateUrl: './route-details.component.html',
  styleUrls: ['./route-details.component.scss']
})
export class RouteDetailsComponent implements OnInit, OnDestroy {
  route?: RouteDetails;
  ratingStats?: RatingStats;
  isLoading = false;
  error: string | null = null;
  currentUserId?: string;
  private destroy$ = new Subject<void>();

  constructor(
    private activatedRoute: ActivatedRoute,
    private routesService: RoutesService,
    private ratingsService: RatingsService,
    private authService: AuthService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.currentUserId = this.authService.getCurrentUserSync()?.id;

    this.activatedRoute.params
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        const routeId = params['id'];
        if (routeId) {
          this.loadRouteDetails(routeId);
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Load route details and rating statistics
   * @param routeId Route identifier
   */
  loadRouteDetails(routeId: string): void {
    this.isLoading = true;
    this.error = null;

    // Load route details first
    this.routesService.getRoute(routeId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (route) => {
          this.route = route;

          // Only load rating stats if user is authenticated
          if (this.currentUserId) {
            this.loadRatingStats(routeId);
          } else {
            this.isLoading = false;
          }
        },
        error: (error) => {
          this.error = error.message || 'Nem sikerült betölteni az útvonal részleteit';
          this.isLoading = false;
        }
      });
  }

  /**
   * Load rating statistics for authenticated users
   * @param routeId Route identifier
   */
  private loadRatingStats(routeId: string): void {
    this.ratingsService.getRouteRatingStats(routeId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (stats) => {
          this.ratingStats = stats;
          this.isLoading = false;
        },
        error: (error) => {
          console.warn('Failed to load rating stats:', error);
          // Don't show error, just show route details without stats
          this.isLoading = false;
        }
      });
  }

  /**
   * Open rating form dialog to create a new rating
   */
  openRatingDialog(): void {
    if (!this.route) return;

    const dialogRef = this.dialog.open(RatingFormDialogComponent, {
      width: '600px',
      maxWidth: '95vw',
      data: {
        routeId: this.route.id,
        routeName: `${this.route.route_number} - ${this.route.name}`
      }
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(result => {
        if (result) {
          // Refresh rating stats and list after successful submission
          this.loadRouteDetails(this.route!.id);
        }
      });
  }

  /**
   * Get star array for display
   * @param rating Rating value (0-5)
   */
  getStarArray(rating: number): number[] {
    return Array(5).fill(0).map((_, i) => i < Math.round(rating) ? 1 : 0);
  }

  /**
   * Format average rating for display
   * @param rating Rating value
   */
  formatRating(rating: number): string {
    return rating.toFixed(1);
  }
}
