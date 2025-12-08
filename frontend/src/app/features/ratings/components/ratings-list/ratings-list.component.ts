import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subject, takeUntil } from 'rxjs';
import { Rating } from '../../../../core/models/rating.model';
import { RatingsService } from '../../../../core/services/ratings.service';
import { RatingCardComponent } from '../../../../shared/components/rating-card/rating-card.component';

type SortOption = 'date-desc' | 'date-asc' | 'rating-desc' | 'rating-asc';
type FilterOption = 'all' | '5' | '4' | '3' | '2' | '1';

/**
 * Component for displaying a list of ratings with filtering and sorting
 */
@Component({
  selector: 'app-ratings-list',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatSelectModule,
    MatFormFieldModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatTooltipModule,
    RatingCardComponent
  ],
  templateUrl: './ratings-list.component.html',
  styleUrls: ['./ratings-list.component.scss']
})
export class RatingsListComponent implements OnInit, OnDestroy {
  @Input() routeId?: string;
  @Input() userId?: string;
  @Input() showActions: boolean = false;
  @Input() currentUserId?: string;
  @Output() edit = new EventEmitter<Rating>();
  @Output() delete = new EventEmitter<Rating>();
  @Output() photoClick = new EventEmitter<string>();
  @Output() viewRoute = new EventEmitter<string>();

  ratings: Rating[] = [];
  filteredRatings: Rating[] = [];
  paginatedRatings: Rating[] = [];
  isLoading = false;
  error: string | null = null;

  // Pagination
  pageSize = 10;
  pageIndex = 0;
  totalRatings = 0;

  /**
   * Ensure pagination values are always positive to prevent RangeError
   */
  private validatePaginationValues(): void {
    this.pageSize = Math.max(1, this.pageSize || 10);
    this.pageIndex = Math.max(0, this.pageIndex || 0);
    this.totalRatings = Math.max(0, this.totalRatings || 0);
  }

  // Sorting
  selectedSort: SortOption = 'date-desc';
  sortOptions = [
    { value: 'date-desc' as SortOption, label: 'Legújabb elöl' },
    { value: 'date-asc' as SortOption, label: 'Legrégebbi elöl' },
    { value: 'rating-desc' as SortOption, label: 'Legmagasabb értékelés' },
    { value: 'rating-asc' as SortOption, label: 'Legalacsonyabb értékelés' }
  ];

  // Filtering
  selectedFilter: FilterOption = 'all';
  filterOptions = [
    { value: 'all' as FilterOption, label: 'Összes értékelés' },
    { value: '5' as FilterOption, label: '5 csillag' },
    { value: '4' as FilterOption, label: '4 csillag' },
    { value: '3' as FilterOption, label: '3 csillag' },
    { value: '2' as FilterOption, label: '2 csillag' },
    { value: '1' as FilterOption, label: '1 csillag' }
  ];

  private destroy$ = new Subject<void>();

  constructor(private ratingsService: RatingsService) {}

  ngOnInit(): void {
    this.validatePaginationValues();
    this.loadRatings();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Load ratings based on input parameters
   */
  loadRatings(): void {
    this.isLoading = true;
    this.error = null;

    let ratingsObservable;

    if (this.routeId) {
      ratingsObservable = this.ratingsService.getRatingsByRoute(this.routeId);
    } else if (this.userId) {
      ratingsObservable = this.ratingsService.getMyRatings();
    } else {
      this.error = 'Either routeId or userId must be provided';
      this.isLoading = false;
      return;
    }

    ratingsObservable
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (ratings) => {
          this.ratings = ratings;
          this.applyFiltersAndSort();
          this.isLoading = false;
        },
        error: (error) => {
          this.error = error.message || 'Nem sikerült betölteni az értékeléseket';
          this.isLoading = false;
        }
      });
  }

  /**
   * Apply filters and sorting to ratings
   */
  private applyFiltersAndSort(): void {
    // Apply filter
    this.filteredRatings = this.filterRatings(this.ratings);

    // Apply sort
    this.sortRatings(this.filteredRatings);

    // Update total count
    this.totalRatings = this.filteredRatings.length;

    // Apply pagination
    this.updatePaginatedRatings();
  }

  /**
   * Filter ratings based on selected filter
   * @param ratings Array of ratings
   */
  private filterRatings(ratings: Rating[]): Rating[] {
    if (this.selectedFilter === 'all') {
      return [...ratings];
    }

    const starRating = parseInt(this.selectedFilter);
    return ratings.filter(rating => Math.floor(rating.rating_overall) === starRating);
  }

  /**
   * Sort ratings based on selected sort option
   * @param ratings Array of ratings
   */
  private sortRatings(ratings: Rating[]): void {
    ratings.sort((a, b) => {
      switch (this.selectedSort) {
        case 'date-desc':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'date-asc':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'rating-desc':
          return b.rating_overall - a.rating_overall;
        case 'rating-asc':
          return a.rating_overall - b.rating_overall;
        default:
          return 0;
      }
    });
  }

  /**
   * Update paginated ratings array
   */
  private updatePaginatedRatings(): void {
    this.validatePaginationValues();
    const startIndex = this.pageIndex * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.paginatedRatings = this.filteredRatings.slice(startIndex, endIndex);
  }

  /**
   * Handle sort change
   * @param sort Sort option
   */
  onSortChange(sort: SortOption): void {
    this.selectedSort = sort;
    this.pageIndex = 0;
    this.applyFiltersAndSort();
  }

  /**
   * Handle filter change
   * @param filter Filter option
   */
  onFilterChange(filter: FilterOption): void {
    this.selectedFilter = filter;
    this.pageIndex = 0;
    this.applyFiltersAndSort();
  }

  /**
   * Handle page change
   * @param event Page event
   */
  onPageChange(event: PageEvent): void {
    this.pageIndex = Math.max(0, event.pageIndex);
    this.pageSize = Math.max(1, event.pageSize);
    this.updatePaginatedRatings();
  }

  /**
   * Handle edit event
   * @param rating Rating to edit
   */
  onEdit(rating: Rating): void {
    this.edit.emit(rating);
  }

  /**
   * Handle delete event
   * @param rating Rating to delete
   */
  onDelete(rating: Rating): void {
    this.delete.emit(rating);
  }

  /**
   * Handle photo click event
   * @param photoUrl Photo URL
   */
  onPhotoClick(photoUrl: string): void {
    this.photoClick.emit(photoUrl);
  }

  /**
   * Handle view route event
   * @param routeId Route ID
   */
  onViewRoute(routeId: string): void {
    this.viewRoute.emit(routeId);
  }

  /**
   * Check if rating is owned by current user
   * @param rating Rating to check
   */
  isOwner(rating: Rating): boolean {
    return !!this.currentUserId && rating.user_id === this.currentUserId;
  }

  /**
   * Refresh ratings list
   */
  refresh(): void {
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
