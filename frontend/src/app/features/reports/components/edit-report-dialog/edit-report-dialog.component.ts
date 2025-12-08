import { Component, Inject, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { Report, UpdateReportDto, REPORT_TYPE_METADATA } from '@core/models/report.model';
import { ReportsService } from '@core/services/reports.service';

export interface EditReportDialogData {
  report: Report;
}

/**
 * Edit Report Dialog Component
 * Allows users to edit pending reports (title, description, location)
 */
@Component({
  selector: 'app-edit-report-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatChipsModule
  ],
  templateUrl: './edit-report-dialog.component.html',
  styleUrls: ['./edit-report-dialog.component.scss']
})
export class EditReportDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private reportsService = inject(ReportsService);
  private dialogRef = inject(MatDialogRef<EditReportDialogComponent>);
  private snackBar = inject(MatSnackBar);

  report: Report;
  editForm!: FormGroup;
  isSubmitting = false;

  constructor(@Inject(MAT_DIALOG_DATA) public data: EditReportDialogData) {
    this.report = data.report;
  }

  ngOnInit(): void {
    this.initializeForm();
  }

  /**
   * Initialize form with existing report data
   */
  private initializeForm(): void {
    this.editForm = this.fb.group({
      title: [this.report.title, [Validators.required, Validators.minLength(10), Validators.maxLength(200)]],
      description: [this.report.description, [Validators.required, Validators.minLength(20)]],
      location: [this.report.location || '']
    });
  }

  /**
   * Get report type metadata for display
   */
  get typeMetadata() {
    return REPORT_TYPE_METADATA[this.report.report_type];
  }

  /**
   * Get reference number
   */
  get referenceNumber(): string {
    return this.reportsService.formatReferenceNumber(this.report.id);
  }

  /**
   * Get character count for title
   */
  get titleCharCount(): number {
    return this.editForm.get('title')?.value?.length || 0;
  }

  /**
   * Get character count for description
   */
  get descriptionCharCount(): number {
    return this.editForm.get('description')?.value?.length || 0;
  }

  /**
   * Check if form has changes
   */
  get hasChanges(): boolean {
    const formValue = this.editForm.value;
    return formValue.title !== this.report.title ||
           formValue.description !== this.report.description ||
           formValue.location !== (this.report.location || '');
  }

  /**
   * Submit the updated report
   */
  onSubmit(): void {
    if (this.editForm.invalid) {
      this.snackBar.open('Kérlek töltsd ki helyesen az összes kötelező mezőt', 'Bezár', {
        duration: 5000,
        panelClass: 'error-snackbar'
      });
      return;
    }

    if (!this.hasChanges) {
      this.snackBar.open('Nincs változtatás a mentéshez', 'Bezár', {
        duration: 3000
      });
      return;
    }

    this.isSubmitting = true;

    const dto: UpdateReportDto = {
      title: this.editForm.value.title,
      description: this.editForm.value.description,
      location: this.editForm.value.location || undefined
    };

    this.reportsService.updateReport(this.report.id, dto).subscribe({
      next: (updatedReport) => {
        this.snackBar.open('Bejelentés sikeresen frissítve!', 'Bezár', {
          duration: 3000,
          panelClass: 'success-snackbar'
        });
        this.dialogRef.close({ success: true, report: updatedReport });
      },
      error: (error) => {
        console.error('Failed to update report:', error);
        this.snackBar.open(
          error.error?.message || 'Nem sikerült frissíteni a bejelentést. Próbáld újra.',
          'Bezár',
          { duration: 5000, panelClass: 'error-snackbar' }
        );
        this.isSubmitting = false;
      }
    });
  }

  /**
   * Cancel editing
   */
  onCancel(): void {
    this.dialogRef.close();
  }
}
