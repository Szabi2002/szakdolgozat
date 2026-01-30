import { Component, OnInit, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ReportCardComponent } from '@shared/components/report-card/report-card.component';
import { ReportDetailsModalComponent } from '../../components/report-details-modal/report-details-modal.component';
import { EditReportDialogComponent } from '../../components/edit-report-dialog/edit-report-dialog.component';
import { Report, ReportStatus, UserReportStats } from '@core/models/report.model';
import { ReportsService } from '@core/services/reports.service';
import { SupabaseService } from '@core/services/supabase.service';


/**
 * My Reports page component
 * Displays user's reports with status-based tabs
 */
@Component({
  selector: 'app-my-reports',
  standalone: true,
  imports: [
    CommonModule,
    MatTabsModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDialogModule,
    ReportCardComponent
  ],
  templateUrl: './my-reports.component.html',
  styleUrls: ['./my-reports.component.scss']
})
export class MyReportsComponent implements OnInit, OnDestroy {
  private reportsService = inject(ReportsService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  private supabaseService = inject(SupabaseService);
  private destroy$ = new Subject<void>();

  reports: Report[] = [];
  isLoading = false;
  currentUserId: string | null = null;
  selectedStatus: ReportStatus | undefined;

  // Statistics
  stats: UserReportStats = {
    total: 0,
    pending: 0,
    in_review: 0,
    resolved: 0,
    dismissed: 0
  };

  // Pagination
  currentPage = 1;
  pageSize = 20;
  totalItems = 0;

  ngOnInit(): void {
    this.loadCurrentUser();
    this.loadStats();
    this.loadReports();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Load current user
   */
  private loadCurrentUser(): void {
    try {
      const user = this.supabaseService.user;
      this.currentUserId = user?.id || null;
    } catch (error) {
      console.error('Failed to load user:', error);
    }
  }

  /**
   * Load report statistics
   */
  loadStats(): void {
    this.reportsService.getMyReportStats()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (stats) => {
          this.stats = stats;
        },
        error: (error) => {
          console.error('Failed to load stats:', error);
        }
      });
  }

  /**
   * Load user's reports
   */
  loadReports(): void {
    this.isLoading = true;

    this.reportsService.getMyReports(this.currentPage, this.pageSize, this.selectedStatus)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.reports = response.data || [];
          this.totalItems = response.total || 0;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Failed to load reports:', error);
          this.reports = [];
          this.totalItems = 0;
          this.snackBar.open('Nem sikerült betölteni a bejelentéseket. Próbáld újra.', 'Bezár', {
            duration: 5000,
            panelClass: 'error-snackbar'
          });
          this.isLoading = false;
        }
      });
  }

  /**
   * Handle tab change
   * @param index Tab index
   */
  onTabChange(index: number): void {
    this.currentPage = 1; // Reset to first page
    switch (index) {
      case 0: this.selectedStatus = undefined; break;
      case 1: this.selectedStatus = 'pending'; break;
      case 2: this.selectedStatus = 'in_review'; break;
      case 3: this.selectedStatus = 'resolved'; break;
      case 4: this.selectedStatus = 'dismissed'; break;
    }
    this.loadReports();
  }

  /**
   * Navigate to submit report page
   */
  navigateToSubmit(): void {
    this.router.navigate(['/reports/submit']);
  }

  /**
   * Refresh reports list
   */
  refresh(): void {
    this.loadStats();
    this.loadReports();
  }

  /**
   * Open report details modal
   */
  onViewReport(report: Report): void {
    const dialogRef = this.dialog.open(ReportDetailsModalComponent, {
      width: '800px',
      maxWidth: '95vw',
      data: { report },
      panelClass: 'glass-dialog-panel'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.action === 'edit') {
        this.onEditReport(result.report);
      } else if (result?.action === 'delete') {
        this.onDeleteReport(result.report);
      }
    });
  }

  /**
   * Edit report - opens edit dialog
   */
  onEditReport(report: Report): void {
    // Only pending reports can be edited
    if (report.status !== 'pending') {
      this.snackBar.open('Csak függőben lévő bejelentések szerkeszthetők', 'Bezár', {
        duration: 3000,
        panelClass: 'warning-snackbar'
      });
      return;
    }

    const dialogRef = this.dialog.open(EditReportDialogComponent, {
      width: '600px',
      maxWidth: '95vw',
      data: { report },
      panelClass: 'glass-dialog-panel'
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(result => {
        if (result?.success) {
          this.loadStats();
          this.loadReports(); // Refresh the list
        }
      });
  }

  /**
   * TrackBy function for report list performance
   */
  trackByReportId(index: number, report: Report): string {
    return report.id;
  }

  /**
   * Delete report with confirmation
   */
  onDeleteReport(report: Report): void {
    const confirmed = confirm(
      `Biztosan törölni szeretnéd ezt a bejelentést?\n\nCím: ${report.title}\n\nEz a művelet nem vonható vissza.`
    );

    if (!confirmed) {
      return;
    }

    this.reportsService.deleteReport(report.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.snackBar.open('Bejelentés sikeresen törölve', 'Bezár', {
            duration: 3000,
            panelClass: 'success-snackbar'
          });
          this.loadStats();
          this.loadReports();
        },
        error: (error) => {
          console.error('Failed to delete report:', error);
          this.snackBar.open(
            error.error?.message || 'Nem sikerült törölni a bejelentést. Próbáld újra.',
            'Bezár',
            { duration: 5000, panelClass: 'error-snackbar' }
          );
        }
      });
  }

  /**
   * Handle view route navigation
   */
  onViewRoute(routeId: string): void {
    if (routeId) {
      this.router.navigate(['/routes', routeId]);
    }
  }
}
