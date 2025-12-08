import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RatingFormComponent } from '../rating-form/rating-form.component';
import { Rating } from '../../../../core/models/rating.model';

export interface RatingFormDialogData {
  routeId: string;
  routeName: string;
  existingRating?: Rating;
}

/**
 * Dialog component for creating/editing ratings
 */
@Component({
  selector: 'app-rating-form-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    RatingFormComponent
  ],
  templateUrl: './rating-form-dialog.component.html',
  styleUrls: ['./rating-form-dialog.component.scss']
})
export class RatingFormDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<RatingFormDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: RatingFormDialogData
  ) {}

  /**
   * Handle successful rating submission
   * @param rating Created/updated rating
   */
  onSuccess(rating: Rating): void {
    this.dialogRef.close(rating);
  }

  /**
   * Handle form cancellation
   */
  onCancel(): void {
    this.dialogRef.close();
  }
}
