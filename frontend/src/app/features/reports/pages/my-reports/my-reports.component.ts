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
import { Report, ReportStatus, UserReportStats } from '@core/models/report.model';
import { ReportsService } from '@core/services/reports.service';

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
  private destroy$ = new Subject<void>();

  allReports: Report[] = [];
  isLoading = false;
  selectedTabIndex = 0;

  // Statistics
  stats: UserReportStats = {
    total: 0,
    pending: 0,
    in_review: 0,
    resolved: 0,
    dismissed: 0
  };

  ngOnInit(): void {
    this.loadReports();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Load user's reports
   */
  loadReports(): void {
    this.isLoading = true;

    this.reportsService.getMyReports()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.allReports = response.data.sort((a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
          this.calculateStats();
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Failed to load reports:', error);
          this.snackBar.open('Nem sikerült betölteni a bejelentéseket. Próbáld újra.', 'Bezár', {
            duration: 5000,
            panelClass: 'error-snackbar'
          });
          this.isLoading = false;
        }
      });
  }

  /**
   * Calculate statistics from reports
   */
  private calculateStats(): void {
    this.stats = {
      total: this.allReports.length,
      pending: this.allReports.filter(r => r.status === 'pending').length,
      in_review: this.allReports.filter(r => r.status === 'in_review').length,
      resolved: this.allReports.filter(r => r.status === 'resolved').length,
      dismissed: this.allReports.filter(r => r.status === 'dismissed').length
    };
  }

  /**
   * Get reports filtered by status
   */
  getReportsByStatus(status?: ReportStatus): Report[] {
    if (!status) {
      return this.allReports;
    }
    return this.allReports.filter(r => r.status === status);
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
      panelClass: 'report-details-dialog'
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
   * Edit report
   */
  onEditReport(report: Report): void {
    // For now, navigate to submit page with edit mode
    // In a full implementation, you'd pass the report data
    this.snackBar.open('Szerkesztés funkció hamarosan elérhető', 'Bezár', { duration: 3000 });
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
