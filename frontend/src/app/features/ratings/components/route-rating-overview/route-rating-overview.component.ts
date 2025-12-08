import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subject, takeUntil } from 'rxjs';
import { RatingStats } from '../../../../core/models/rating.model';
import { RatingsService } from '../../../../core/services/ratings.service';
import { StarRatingComponent } from '../../../../shared/components/star-rating/star-rating.component';

interface CategoryRating {
  label: string;
  value: number;
  icon: string;
}

/**
 * Component for displaying aggregate rating statistics for a route
 */
@Component({
  selector: 'app-route-rating-overview',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    StarRatingComponent
  ],
  templateUrl: './route-rating-overview.component.html',
  styleUrls: ['./route-rating-overview.component.scss']
})
export class RouteRatingOverviewComponent implements OnInit, OnDestroy {
  @Input() routeId!: string;
  @Output() rateRoute = new EventEmitter<void>();

  stats: RatingStats | null = null;
  isLoading = false;
  error: string | null = null;

  starDistribution: Array<{ stars: number; count: number; percentage: number }> = [];
  categoryRatings: CategoryRating[] = [];

  private destroy$ = new Subject<void>();

  constructor(private ratingsService: RatingsService) {}

  ngOnInit(): void {
    this.loadStats();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Load rating statistics for the route
   */
  loadStats(): void {
    this.isLoading = true;
    this.error = null;

    this.ratingsService.getRouteRatingStats(this.routeId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (stats) => {
          this.stats = stats;
          this.calculateStarDistribution(stats);
          this.calculateCategoryRatings(stats);
          this.isLoading = false;
        },
        error: (error) => {
          this.error = error.message || 'Failed to load rating statistics';
          this.isLoading = false;
        }
      });
  }

  /**
   * Calculate star distribution percentages
   * @param stats Rating statistics
   */
  private calculateStarDistribution(stats: RatingStats): void {
    const total = stats.total_ratings || 1; // Avoid division by zero

    this.starDistribution = [
      {
        stars: 5,
        count: stats.five_star_count,
        percentage: (stats.five_star_count / total) * 100
      },
      {
        stars: 4,
        count: stats.four_star_count,
        percentage: (stats.four_star_count / total) * 100
      },
      {
        stars: 3,
        count: stats.three_star_count,
        percentage: (stats.three_star_count / total) * 100
      },
      {
        stars: 2,
        count: stats.two_star_count,
        percentage: (stats.two_star_count / total) * 100
      },
      {
        stars: 1,
        count: stats.one_star_count,
        percentage: (stats.one_star_count / total) * 100
      }
    ];
  }

  /**
   * Calculate category ratings
   * @param stats Rating statistics
   */
  private calculateCategoryRatings(stats: RatingStats): void {
    this.categoryRatings = [
      {
        label: 'Cleanliness',
        value: stats.avg_cleanliness,
        icon: 'cleaning_services'
      },
      {
        label: 'Punctuality',
        value: stats.avg_punctuality,
        icon: 'schedule'
      },
      {
        label: 'Driver',
        value: stats.avg_driver,
        icon: 'person'
      },
      {
        label: 'Comfort',
        value: stats.avg_comfort,
        icon: 'airline_seat_recline_normal'
      }
    ];
  }

  /**
   * Handle rate route button click
   */
  onRateRoute(): void {
    this.rateRoute.emit();
  }

  /**
   * Get percentage width for category bars
   * @param value Rating value (0-5)
   */
  getCategoryPercentage(value: number): number {
    return (value / 5) * 100;
  }

  /**
   * Check if statistics are available
   */
  hasStats(): boolean {
    return this.stats !== null && this.stats.total_ratings > 0;
  }
}
