import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '@shared/material/material.module';
import { RatingsService } from '@core/services/ratings.service';
import { Rating, ModerateRatingDto } from '@core/models/rating.model';

type FilterStatus = 'pending' | 'approved' | 'rejected' | 'all';

@Component({
  selector: 'app-ratings-moderation',
  standalone: true,
  imports: [CommonModule, MaterialModule],
  templateUrl: './ratings-moderation.component.html',
  styleUrl: './ratings-moderation.component.scss',
})
export class RatingsModerationComponent implements OnInit {
  private ratingsService = inject(RatingsService);

  // Signals for reactive state
  allRatings = signal<Rating[]>([]);
  isLoading = signal(true);
  errorMessage = signal('');
  activeFilter = signal<FilterStatus>('pending');
  expandedRatingId = signal<string | null>(null);
  selectedRatings = signal<Set<string>>(new Set());

  // Computed values
  filteredRatings = computed(() => {
    const filter = this.activeFilter();
    const ratings = this.allRatings();

    if (filter === 'all') return ratings;
    return ratings.filter(r => r.status === filter);
  });

  pendingCount = computed(() =>
    this.allRatings().filter(r => r.status === 'pending').length
  );

  approvedCount = computed(() =>
    this.allRatings().filter(r => r.status === 'approved').length
  );

  rejectedCount = computed(() =>
    this.allRatings().filter(r => r.status === 'rejected').length
  );

  allSelected = computed(() => {
    const filtered = this.filteredRatings();
    const selected = this.selectedRatings();
    return filtered.length > 0 && filtered.every(r => selected.has(r.id));
  });

  hasSelection = computed(() => this.selectedRatings().size > 0);

  ngOnInit(): void {
    this.loadRatings();
  }

  loadRatings(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.ratingsService.getPendingRatings().subscribe({
      next: (ratings) => {
        this.allRatings.set(ratings);
        this.isLoading.set(false);
      },
      error: (error) => {
        this.errorMessage.set(error?.message || 'Nem sikerult betolteni az ertekeléseket. Probáld újra.');
        this.isLoading.set(false);
      }
    });
  }

  setFilter(filter: FilterStatus): void {
    this.activeFilter.set(filter);
    this.selectedRatings.set(new Set());
  }

  toggleExpand(ratingId: string): void {
    if (this.expandedRatingId() === ratingId) {
      this.expandedRatingId.set(null);
    } else {
      this.expandedRatingId.set(ratingId);
    }
  }

  isExpanded(ratingId: string): boolean {
    return this.expandedRatingId() === ratingId;
  }

  toggleSelection(ratingId: string): void {
    const selected = new Set(this.selectedRatings());
    if (selected.has(ratingId)) {
      selected.delete(ratingId);
    } else {
      selected.add(ratingId);
    }
    this.selectedRatings.set(selected);
  }

  isSelected(ratingId: string): boolean {
    return this.selectedRatings().has(ratingId);
  }

  toggleSelectAll(): void {
    if (this.allSelected()) {
      this.selectedRatings.set(new Set());
    } else {
      const allIds = new Set(this.filteredRatings().map(r => r.id));
      this.selectedRatings.set(allIds);
    }
  }

  moderateRating(id: string, status: 'approved' | 'rejected'): void {
    const dto: ModerateRatingDto = { status };
    this.ratingsService.moderateRating(id, dto).subscribe({
      next: () => {
        this.loadRatings();
        this.selectedRatings.set(new Set());
      },
      error: (error) => {
        this.errorMessage.set(error?.message || 'Nem sikerult moderalni az ertekelést. Probáld újra.');
      }
    });
  }

  bulkModerate(status: 'approved' | 'rejected'): void {
    const selectedIds = Array.from(this.selectedRatings());

    // Process sequentially to avoid overwhelming the server
    const processNext = (index: number) => {
      if (index >= selectedIds.length) {
        this.loadRatings();
        this.selectedRatings.set(new Set());
        return;
      }

      const dto: ModerateRatingDto = { status };
      this.ratingsService.moderateRating(selectedIds[index], dto).subscribe({
        next: () => processNext(index + 1),
        error: () => processNext(index + 1) // Continue even on error
      });
    };

    processNext(0);
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleString('hu-HU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getStarArray(rating: number): boolean[] {
    return [1, 2, 3, 4, 5].map(i => i <= rating);
  }

  getCategoryRatings(rating: Rating): { label: string; value: number; icon: string }[] {
    return [
      { label: 'Tisztasag', value: rating.rating_cleanliness || 0, icon: 'cleaning_services' },
      { label: 'Pontossag', value: rating.rating_punctuality || 0, icon: 'schedule' },
      { label: 'Sofor', value: rating.rating_driver || 0, icon: 'person' },
      { label: 'Kenyelem', value: rating.rating_comfort || 0, icon: 'airline_seat_recline_normal' }
    ].filter(cat => cat.value > 0);
  }
}
