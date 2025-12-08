import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ReportFormComponent } from '../../components/report-form/report-form.component';

/**
 * Submit Report page component
 * Wraps the report form with page layout and breadcrumbs
 */
@Component({
  selector: 'app-submit-report',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    ReportFormComponent
  ],
  templateUrl: './submit-report.component.html',
  styleUrls: ['./submit-report.component.scss']
})
export class SubmitReportComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  prefilledRouteId?: string;
  prefilledStopId?: string;

  ngOnInit(): void {
    console.log('[SubmitReportComponent] ngOnInit called');
    // Check for pre-filled route or stop from query params
    this.route.queryParams.subscribe(params => {
      this.prefilledRouteId = params['routeId'];
      this.prefilledStopId = params['stopId'];
      console.log('[SubmitReportComponent] Query params:', { routeId: this.prefilledRouteId, stopId: this.prefilledStopId });
    });
  }

  /**
   * Handle successful form submission
   */
  onSubmitted(event: { reportId: string; referenceNumber: string }): void {
    // Navigate to my-reports page
    this.router.navigate(['/reports/my-reports']);
  }

  /**
   * Handle form cancellation
   */
  onCancelled(): void {
    // Navigate back or to my-reports
    this.router.navigate(['/reports/my-reports']);
  }

  /**
   * Navigate to my reports
   */
  navigateToMyReports(): void {
    this.router.navigate(['/reports/my-reports']);
  }
}
