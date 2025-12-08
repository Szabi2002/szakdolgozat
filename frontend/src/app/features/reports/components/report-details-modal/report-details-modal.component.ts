import { Component, Inject, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { Report, REPORT_TYPE_METADATA, STATUS_COLORS, PRIORITY_COLORS } from '@core/models/report.model';
import { ReportsService } from '@core/services/reports.service';

export interface ReportDetailsDialogData {
  report: Report;
}

/**
 * Report details modal component
 * Displays full report information in a dialog
 */
@Component({
  selector: 'app-report-details-modal',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatDividerModule
  ],
  templateUrl: './report-details-modal.component.html',
  styleUrls: ['./report-details-modal.component.scss']
})
export class ReportDetailsModalComponent {
  private reportsService = inject(ReportsService);
  private dialogRef = inject(MatDialogRef<ReportDetailsModalComponent>);

  report: Report;
  selectedPhotoIndex: number = -1;

  constructor(@Inject(MAT_DIALOG_DATA) public data: ReportDetailsDialogData) {
    this.report = data.report;
  }

  /**
   * Get report type metadata
   */
  get typeMetadata() {
    return REPORT_TYPE_METADATA[this.report.report_type];
  }

  /**
   * Get status color configuration
   */
  get statusColor() {
    return STATUS_COLORS[this.report.status];
  }

  /**
   * Get priority color configuration
   */
  get priorityColor() {
    return PRIORITY_COLORS[this.report.priority];
  }

  /**
   * Get reference number
   */
  get referenceNumber(): string {
    return this.reportsService.formatReferenceNumber(this.report.id);
  }

  /**
   * Get formatted creation date
   */
  get createdDate(): string {
    return new Date(this.report.created_at).toLocaleString();
  }

  /**
   * Get formatted update date
   */
  get updatedDate(): string {
    return new Date(this.report.updated_at).toLocaleString();
  }

  /**
   * Get formatted resolved date
   */
  get resolvedDate(): string | null {
    return this.report.resolved_at
      ? new Date(this.report.resolved_at).toLocaleString()
      : null;
  }

  /**
   * Check if priority should be displayed (high or critical)
   */
  get shouldShowPriority(): boolean {
    return this.report.priority === 'high' || this.report.priority === 'critical';
  }

  /**
   * Check if user can edit this report
   */
  get canEdit(): boolean {
    return this.reportsService.canEditReport(this.report);
  }

  /**
   * Check if user can delete this report
   */
  get canDelete(): boolean {
    return this.reportsService.canDeleteReport(this.report);
  }

  /**
   * Open photo in lightbox
   */
  openPhoto(index: number): void {
    this.selectedPhotoIndex = index;
  }

  /**
   * Close lightbox
   */
  closeLightbox(): void {
    this.selectedPhotoIndex = -1;
  }

  /**
   * Navigate to previous photo
   */
  previousPhoto(): void {
    if (this.selectedPhotoIndex > 0) {
      this.selectedPhotoIndex--;
    }
  }

  /**
   * Navigate to next photo
   */
  nextPhoto(): void {
    if (this.report.photos && this.selectedPhotoIndex < this.report.photos.length - 1) {
      this.selectedPhotoIndex++;
    }
  }

  /**
   * Get status label
   */
  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      pending: 'Függőben',
      in_review: 'Felülvizsgálat alatt',
      resolved: 'Megoldva',
      dismissed: 'Elutasítva'
    };
    return labels[status] || status;
  }

  /**
   * Get priority label
   */
  getPriorityLabel(priority: string): string {
    const labels: Record<string, string> = {
      low: 'Alacsony prioritás',
      medium: 'Közepes prioritás',
      high: 'Magas prioritás',
      critical: 'Kritikus'
    };
    return labels[priority] || priority;
  }

  /**
   * Handle edit button click
   */
  onEdit(): void {
    this.dialogRef.close({ action: 'edit', report: this.report });
  }

  /**
   * Handle delete button click
   */
  onDelete(): void {
    this.dialogRef.close({ action: 'delete', report: this.report });
  }

  /**
   * Close dialog
   */
  close(): void {
    this.dialogRef.close();
  }
}
