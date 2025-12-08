import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Report, REPORT_TYPE_METADATA, STATUS_COLORS, PRIORITY_COLORS } from '@core/models/report.model';
import { ReportsService } from '@core/services/reports.service';

/**
 * Report card component for displaying individual reports
 * Supports compact and full view modes
 */
@Component({
  selector: 'app-report-card',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatTooltipModule
  ],
  templateUrl: './report-card.component.html',
  styleUrls: ['./report-card.component.scss']
})
export class ReportCardComponent {
  @Input({ required: true }) report!: Report;
  @Input() showActions: boolean = false;
  @Input() compact: boolean = false;
  @Output() edit = new EventEmitter<Report>();
  @Output() delete = new EventEmitter<Report>();
  @Output() view = new EventEmitter<Report>();
  @Output() viewRoute = new EventEmitter<string>();

  private reportsService = inject(ReportsService);

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
   * Get time elapsed since creation
   */
  get timeElapsed(): string {
    return this.reportsService.getTimeElapsed(this.report.created_at);
  }

  /**
   * Get truncated description
   */
  get descriptionPreview(): string {
    return this.reportsService.truncateDescription(this.report.description, 150);
  }

  /**
   * Check if description is truncated
   */
  get isTruncated(): boolean {
    return this.report.description.length > 150;
  }

  /**
   * Get photo count
   */
  get photoCount(): number {
    return this.report.photos?.length || 0;
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
   * Handle edit button click
   */
  onEdit(): void {
    this.edit.emit(this.report);
  }

  /**
   * Handle delete button click
   */
  onDelete(): void {
    this.delete.emit(this.report);
  }

  /**
   * Handle card click to view details
   */
  onView(): void {
    this.view.emit(this.report);
  }

  /**
   * Get status label
   */
  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      pending: 'Függőben',
      in_review: 'Ellenőrzés alatt',
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
   * Handle view route click
   */
  onViewRoute(): void {
    if (this.report.route?.id) {
      this.viewRoute.emit(this.report.route.id);
    }
  }

  /**
   * Check if route navigation is available
   */
  hasRouteId(): boolean {
    return !!this.report.route?.id;
  }
}
