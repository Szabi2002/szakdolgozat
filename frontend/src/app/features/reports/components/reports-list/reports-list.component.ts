import { Component, Input, OnInit, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ReportCardComponent } from '@shared/components/report-card/report-card.component';
import { ReportDetailsModalComponent } from '../report-details-modal/report-details-modal.component';
import { Report, ReportFilters, ReportStatus, ReportType, ReportPriority } from '@core/models/report.model';
import { ReportsService } from '@core/services/reports.service';

/**
 * Reports list component with filtering and pagination
 */
@Component({
  selector: 'app-reports-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatSelectModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
    MatPaginatorModule,
    MatTooltipModule,
    MatDialogModule,
    ReportCardComponent
  ],
  templateUrl: './reports-list.component.html',
  styleUrls: ['./reports-list.component.scss']
})
export class ReportsListComponent implements OnInit, OnDestroy {
  @Input() filters?: ReportFilters;
  @Input() showActions: boolean = false;

  private reportsService = inject(ReportsService);
  private dialog = inject(MatDialog);
  private destroy$ = new Subject<void>();

  reports: Report[] = [];
  isLoading = false;
  total = 0;
  page = 1;
  limit = 10;

  // Filter options
  selectedStatus?: ReportStatus;
  selectedType?: ReportType;
  selectedPriority?: ReportPriority;
  selectedSort = 'newest';

  statusOptions: { value: ReportStatus | undefined; label: string }[] = [
    { value: undefined, label: 'Összes Státusz' },
    { value: 'pending', label: 'Függőben' },
    { value: 'in_review', label: 'Vizsgálat Alatt' },
    { value: 'resolved', label: 'Megoldva' },
    { value: 'dismissed', label: 'Elutasítva' }
  ];

  typeOptions: { value: ReportType | undefined; label: string }[] = [
    { value: undefined, label: 'Összes Típus' },
    { value: 'service_issue', label: 'Szolgáltatási Probléma' },
    { value: 'safety_concern', label: 'Biztonsági Aggály' },
    { value: 'cleanliness', label: 'Tisztaság' },
    { value: 'accessibility', label: 'Akadálymentesítés' },
    { value: 'other', label: 'Egyéb' }
  ];

  priorityOptions: { value: ReportPriority | undefined; label: string }[] = [
    { value: undefined, label: 'Összes Prioritás' },
    { value: 'low', label: 'Alacsony' },
    { value: 'medium', label: 'Közepes' },
    { value: 'high', label: 'Magas' },
    { value: 'critical', label: 'Kritikus' }
  ];

  sortOptions = [
    { value: 'newest', label: 'Legújabb Elöl' },
    { value: 'oldest', label: 'Legrégebbi Elöl' }
  ];

  /**
   * TrackBy function for report list performance
   */
  trackByReportId(index: number, report: Report): string {
    return report.id;
  }

  ngOnInit(): void {
    this.loadReports();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Load reports with current filters
   */
  loadReports(): void {
    this.isLoading = true;

    const currentFilters: ReportFilters = {
      ...this.filters,
      status: this.selectedStatus,
      report_type: this.selectedType,
      priority: this.selectedPriority,
      page: this.page,
      limit: this.limit
    };

    this.reportsService.getReports(currentFilters)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.reports = this.sortReports(response.data);
          this.total = response.total;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Failed to load reports:', error);
          this.isLoading = false;
        }
      });
  }

  /**
   * Sort reports based on selected sort option
   */
  private sortReports(reports: Report[]): Report[] {
    return [...reports].sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return this.selectedSort === 'newest' ? dateB - dateA : dateA - dateB;
    });
  }

  /**
   * Handle status filter change
   */
  onStatusChange(): void {
    this.page = 1;
    this.loadReports();
  }

  /**
   * Handle type filter change
   */
  onTypeChange(): void {
    this.page = 1;
    this.loadReports();
  }

  /**
   * Handle priority filter change
   */
  onPriorityChange(): void {
    this.page = 1;
    this.loadReports();
  }

  /**
   * Handle sort change
   */
  onSortChange(): void {
    this.reports = this.sortReports(this.reports);
  }

  /**
   * Handle page change
   */
  onPageChange(event: PageEvent): void {
    this.page = event.pageIndex + 1;
    this.limit = event.pageSize;
    this.loadReports();
  }

  /**
   * Refresh reports list
   */
  refresh(): void {
    this.loadReports();
  }

  /**
   * Open report details modal
   */
  onViewReport(report: Report): void {
    this.dialog.open(ReportDetailsModalComponent, {
      width: '800px',
      maxWidth: '95vw',
      data: { report },
      panelClass: 'glass-dialog-panel'
    });
  }

  /**
   * Handle edit report
   */
  onEditReport(report: Report): void {
    // This will be handled by parent component
    console.log('Edit report:', report);
  }

  /**
   * Handle delete report
   */
  onDeleteReport(report: Report): void {
    // This will be handled by parent component
    console.log('Delete report:', report);
  }

  /**
   * Get status chip color class
   */
  getStatusClass(status: ReportStatus): string {
    const classes: Record<ReportStatus, string> = {
      pending: 'status-pending',
      in_review: 'status-in-review',
      resolved: 'status-resolved',
      dismissed: 'status-dismissed'
    };
    return classes[status] || '';
  }
}
