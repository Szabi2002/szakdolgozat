import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Rating } from '../../../core/models/rating.model';
import { StarRatingComponent } from '../star-rating/star-rating.component';

/**
 * Card component for displaying a single rating with all details
 */
@Component({
  selector: 'app-rating-card',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatExpansionModule,
    MatTooltipModule,
    StarRatingComponent
  ],
  templateUrl: './rating-card.component.html',
  styleUrls: ['./rating-card.component.scss']
})
export class RatingCardComponent {
  @Input() rating!: Rating;
  @Input() showActions: boolean = false;
  @Input() compact: boolean = false;
  @Input() isOwner: boolean = false;
  @Output() edit = new EventEmitter<Rating>();
  @Output() delete = new EventEmitter<Rating>();
  @Output() photoClick = new EventEmitter<string>();
  @Output() viewRoute = new EventEmitter<string>();

  showFullComment = false;
  maxCommentLength = 200;

  /**
   * Check if comment should be truncated
   */
  shouldTruncateComment(): boolean {
    return !this.showFullComment &&
      !!this.rating.comment &&
      this.rating.comment.length > this.maxCommentLength;
  }

  /**
   * Get displayed comment text
   */
  getDisplayedComment(): string {
    if (!this.rating.comment) {
      return '';
    }

    if (this.shouldTruncateComment()) {
      return this.rating.comment.substring(0, this.maxCommentLength) + '...';
    }

    return this.rating.comment;
  }

  /**
   * Toggle show full comment
   */
  toggleComment(): void {
    this.showFullComment = !this.showFullComment;
  }

  /**
   * Handle edit button click
   */
  onEdit(): void {
    this.edit.emit(this.rating);
  }

  /**
   * Handle delete button click
   */
  onDelete(): void {
    this.delete.emit(this.rating);
  }

  /**
   * Handle photo click
   * @param photoUrl Photo URL
   */
  onPhotoClick(photoUrl: string): void {
    this.photoClick.emit(photoUrl);
  }

  /**
   * Get status badge color
   */
  getStatusColor(): string {
    switch (this.rating.status) {
      case 'approved':
        return 'primary';
      case 'pending':
        return 'accent';
      case 'rejected':
        return 'warn';
      default:
        return '';
    }
  }

  /**
   * Get status badge text
   */
  getStatusText(): string {
    switch (this.rating.status) {
      case 'approved':
        return 'Jóváhagyva';
      case 'pending':
        return 'Ellenőrzés alatt';
      case 'rejected':
        return 'Elutasítva';
      default:
        return '';
    }
  }

  /**
   * Check if rating can be edited
   */
  canEdit(): boolean {
    return this.isOwner && this.rating.status === 'pending';
  }

  /**
   * Check if rating can be deleted
   */
  canDelete(): boolean {
    return this.isOwner && this.rating.status === 'pending';
  }

  /**
   * Get formatted date
   * @param dateString ISO date string
   */
  getFormattedDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return `${diffMins} ${diffMins === 1 ? 'perce' : 'perce'}`;
    } else if (diffHours < 24) {
      return `${diffHours} ${diffHours === 1 ? 'órája' : 'órája'}`;
    } else if (diffDays < 7) {
      return `${diffDays} ${diffDays === 1 ? 'napja' : 'napja'}`;
    } else {
      return date.toLocaleDateString('hu-HU', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    }
  }

  /**
   * Get user display name
   */
  getUserName(): string {
    return this.rating.user?.name || this.rating.user?.email || 'Névtelen felhasználó';
  }

  /**
   * Get route display name
   */
  getRouteName(): string {
    if (this.rating.route) {
      return `${this.rating.route.route_number} - ${this.rating.route.name}`;
    }
    return 'Útvonal';
  }

  /**
   * Handle view route click
   */
  onViewRoute(): void {
    if (this.rating.route?.id) {
      this.viewRoute.emit(this.rating.route.id);
    }
  }

  /**
   * Check if route navigation is available
   */
  hasRouteId(): boolean {
    return !!this.rating.route?.id;
  }
}
