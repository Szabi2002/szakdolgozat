import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Subject, takeUntil } from 'rxjs';
import { RatingsService } from '../../../../core/services/ratings.service';
import { CreateRatingDto, Rating, UpdateRatingDto } from '../../../../core/models/rating.model';
import { StarRatingComponent } from '../../../../shared/components/star-rating/star-rating.component';

/**
 * Form component for creating and editing ratings
 */
@Component({
  selector: 'app-rating-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatProgressBarModule,
    MatSnackBarModule,
    StarRatingComponent
  ],
  templateUrl: './rating-form.component.html',
  styleUrls: ['./rating-form.component.scss']
})
export class RatingFormComponent implements OnInit, OnDestroy {
  @Input() routeId?: string;
  @Input() existingRating?: Rating;
  @Output() success = new EventEmitter<Rating>();
  @Output() cancel = new EventEmitter<void>();

  ratingForm!: FormGroup;
  isSubmitting = false;
  isEditMode = false;
  maxCommentLength = 500;
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private ratingsService: RatingsService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.isEditMode = !!this.existingRating;
    this.initializeForm();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Initialize the rating form
   */
  private initializeForm(): void {
    this.ratingForm = this.fb.group({
      rating_overall: [
        this.existingRating?.rating_overall || 0,
        [Validators.required, Validators.min(1), Validators.max(5)]
      ],
      rating_cleanliness: [
        this.existingRating?.rating_cleanliness || 0,
        [Validators.required, Validators.min(1), Validators.max(5)]
      ],
      rating_punctuality: [
        this.existingRating?.rating_punctuality || 0,
        [Validators.required, Validators.min(1), Validators.max(5)]
      ],
      rating_driver: [
        this.existingRating?.rating_driver || 0,
        [Validators.required, Validators.min(1), Validators.max(5)]
      ],
      rating_comfort: [
        this.existingRating?.rating_comfort || 0,
        [Validators.required, Validators.min(1), Validators.max(5)]
      ],
      comment: [
        this.existingRating?.comment || '',
        [Validators.maxLength(this.maxCommentLength)]
      ]
    });
  }

  /**
   * Handle form submission
   */
  onSubmit(): void {
    if (this.ratingForm.invalid) {
      this.markFormGroupTouched(this.ratingForm);
      this.snackBar.open('Kérlek töltsd ki az összes kötelező értékelést', 'Bezár', {
        duration: 3000,
        panelClass: ['error-snackbar']
      });
      return;
    }

    this.isSubmitting = true;

    if (this.isEditMode) {
      this.updateRating();
    } else {
      this.createRating();
    }
  }

  /**
   * Create a new rating
   */
  private createRating(): void {
    const dto: CreateRatingDto = {
      ...this.ratingForm.value,
      route_id: this.routeId!
    };

    this.ratingsService.createRating(dto)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (rating) => {
          this.handleSuccess(rating);
        },
        error: (error) => {
          this.handleError(error);
        }
      });
  }

  /**
   * Update an existing rating
   */
  private updateRating(): void {
    const dto: UpdateRatingDto = this.ratingForm.value;

    this.ratingsService.updateRating(this.existingRating!.id, dto)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (rating) => {
          this.handleSuccess(rating);
        },
        error: (error) => {
          this.handleError(error);
        }
      });
  }

  /**
   * Handle successful submission
   * @param rating Created/updated rating
   */
  private handleSuccess(rating: Rating): void {
    this.isSubmitting = false;
    this.snackBar.open(
      this.isEditMode ? 'Értékelés sikeresen frissítve' : 'Értékelés sikeresen beküldve',
      'Bezár',
      { duration: 3000, panelClass: ['success-snackbar'] }
    );
    this.success.emit(rating);
  }

  /**
   * Handle submission error
   * @param error Error object
   */
  private handleError(error: any): void {
    this.isSubmitting = false;
    this.snackBar.open(
      error.message || 'Nem sikerült elküldeni az értékelést. Próbáld újra.',
      'Bezár',
      { duration: 5000, panelClass: ['error-snackbar'] }
    );
  }

  /**
   * Handle cancel button click
   */
  onCancel(): void {
    this.cancel.emit();
  }

  /**
   * Get character count for comment field
   */
  getCommentCharCount(): number {
    return this.ratingForm.get('comment')?.value?.length || 0;
  }

  /**
   * Mark all form fields as touched to show validation errors
   * @param formGroup Form group
   */
  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  /**
   * Check if a rating field has error
   * @param fieldName Field name
   */
  hasRatingError(fieldName: string): boolean {
    const control = this.ratingForm.get(fieldName);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  /**
   * Get error message for a rating field
   * @param fieldName Field name
   */
  getRatingErrorMessage(fieldName: string): string {
    const control = this.ratingForm.get(fieldName);
    if (control?.hasError('required')) {
      return 'Kérlek válassz értékelést';
    }
    if (control?.hasError('min')) {
      return 'Az értékelés minimum 1 csillag';
    }
    if (control?.hasError('max')) {
      return 'Az értékelés maximum 5 csillag';
    }
    return '';
  }
}
