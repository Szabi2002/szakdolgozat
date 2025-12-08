import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

/**
 * Reusable star rating component for displaying and selecting ratings
 */
@Component({
  selector: 'app-star-rating',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatTooltipModule],
  templateUrl: './star-rating.component.html',
  styleUrls: ['./star-rating.component.scss']
})
export class StarRatingComponent {
  @Input() rating: number = 0;
  @Input() readonly: boolean = false;
  @Input() size: 'small' | 'medium' | 'large' = 'medium';
  @Output() ratingChange = new EventEmitter<number>();

  hoveredRating: number = 0;
  stars: number[] = [1, 2, 3, 4, 5];

  /**
   * Get the icon name for a star based on its position and rating
   * @param starNumber Star position (1-5)
   * @returns Material icon name
   */
  getStarIcon(starNumber: number): string {
    const effectiveRating = this.readonly ? this.rating : (this.hoveredRating || this.rating);
    const diff = effectiveRating - starNumber;

    if (diff >= 0) {
      return 'star';
    } else if (diff > -0.5) {
      return 'star_half';
    } else {
      return 'star_border';
    }
  }

  /**
   * Handle star click event
   * @param starNumber Selected star position
   */
  onStarClick(starNumber: number): void {
    if (!this.readonly) {
      this.rating = starNumber;
      this.ratingChange.emit(starNumber);
    }
  }

  /**
   * Handle mouse enter event
   * @param starNumber Hovered star position
   */
  onStarHover(starNumber: number): void {
    if (!this.readonly) {
      this.hoveredRating = starNumber;
    }
  }

  /**
   * Handle mouse leave event
   */
  onStarLeave(): void {
    if (!this.readonly) {
      this.hoveredRating = 0;
    }
  }

  /**
   * Handle keyboard navigation
   * @param event Keyboard event
   * @param starNumber Star position
   */
  onKeyDown(event: KeyboardEvent, starNumber: number): void {
    if (!this.readonly) {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        this.onStarClick(starNumber);
      }
    }
  }

  /**
   * Get CSS class for star size
   * @returns Size class name
   */
  getSizeClass(): string {
    return `star-rating-${this.size}`;
  }

  /**
   * Get tooltip text for a star
   * @param starNumber Star position
   * @returns Tooltip text
   */
  getTooltip(starNumber: number): string {
    if (this.readonly) {
      return `${this.rating.toFixed(1)} / 5`;
    }
    return `${starNumber} csillag megadása`;
  }
}
