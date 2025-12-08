import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '@environments/environment';
import {
  Report,
  CreateReportDto,
  UpdateReportDto,
  UpdateStatusDto,
  UpdatePriorityDto,
  ReportFilters,
  AdminQueueFilters,
  PaginatedReports,
  ReportStatistics
} from '@core/models/report.model';

/**
 * Service for managing user reports and feedback
 * Handles both user and admin operations
 */
@Injectable({
  providedIn: 'root'
})
export class ReportsService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/reports`;

  // ===================================
  // USER METHODS (8 endpoints)
  // ===================================

  /**
   * Create a new report
   * Rate limited: 10 reports per hour
   * @param dto Report creation data
   * @returns Observable of created report
   */
  createReport(dto: CreateReportDto): Observable<Report> {
    return this.http.post<Report>(this.apiUrl, dto);
  }

  /**
   * Get all reports with optional filters
   * @param filters Optional filters for status, type, priority, route, stop
   * @returns Observable of paginated reports
   */
  getReports(filters?: ReportFilters): Observable<PaginatedReports> {
    let params = new HttpParams();

    if (filters) {
      if (filters.status) {
        params = params.set('status', filters.status);
      }
      if (filters.report_type) {
        params = params.set('report_type', filters.report_type);
      }
      if (filters.priority) {
        params = params.set('priority', filters.priority);
      }
      if (filters.route_id) {
        params = params.set('route_id', filters.route_id);
      }
      if (filters.stop_id) {
        params = params.set('stop_id', filters.stop_id);
      }
      if (filters.page) {
        params = params.set('page', filters.page.toString());
      }
      if (filters.limit) {
        params = params.set('limit', filters.limit.toString());
      }
    }

    return this.http.get<PaginatedReports>(this.apiUrl, { params });
  }

  /**
   * Get user's own reports
   * @returns Observable of paginated user reports
   */
  getMyReports(): Observable<PaginatedReports> {
    return this.http.get<PaginatedReports>(`${this.apiUrl}/my-reports`);
  }

  /**
   * Get a specific report by ID
   * @param id Report ID
   * @returns Observable of report details
   */
  getReportById(id: string): Observable<Report> {
    return this.http.get<Report>(`${this.apiUrl}/${id}`);
  }

  /**
   * Update an existing report (only pending reports can be updated by users)
   * @param id Report ID
   * @param dto Update data
   * @returns Observable of updated report
   */
  updateReport(id: string, dto: UpdateReportDto): Observable<Report> {
    return this.http.put<Report>(`${this.apiUrl}/${id}`, dto);
  }

  /**
   * Delete a report (only pending reports can be deleted by users)
   * @param id Report ID
   * @returns Observable of void
   */
  deleteReport(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  /**
   * Upload photos to a report
   * Rate limited: 10 uploads per hour
   * Maximum 5 photos per report
   * @param reportId Report ID
   * @param photoUrls Array of photo URLs from Supabase storage
   * @returns Observable of created photo URLs
   */
  uploadPhotos(reportId: string, photoUrls: string[]): Observable<string[]> {
    return this.http.post<string[]>(`${this.apiUrl}/${reportId}/photos`, {
      photoUrls
    });
  }

  /**
   * Delete a photo from a report
   * @param reportId Report ID
   * @param photoId Photo ID
   * @returns Observable of void
   */
  deletePhoto(reportId: string, photoId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${reportId}/photos/${photoId}`);
  }

  // ===================================
  // ADMIN METHODS (6 endpoints)
  // ===================================

  /**
   * Get admin moderation queue with filters
   * Admin only
   * @param filters Optional filters for status and priority
   * @returns Observable of reports queue
   */
  getReportsQueue(filters?: AdminQueueFilters): Observable<Report[]> {
    let params = new HttpParams();

    if (filters) {
      if (filters.status) {
        params = params.set('status', filters.status);
      }
      if (filters.priority) {
        params = params.set('priority', filters.priority);
      }
      if (filters.page) {
        params = params.set('page', filters.page.toString());
      }
      if (filters.limit) {
        params = params.set('limit', filters.limit.toString());
      }
    }

    return this.http.get<{ data: Report[], total: number, page: number, limit: number }>(`${this.apiUrl}/admin/queue`, { params }).pipe(
      map(response => response.data)
    );
  }

  /**
   * Update report status
   * Admin only
   * @param id Report ID
   * @param dto Status update data
   * @returns Observable of updated report
   */
  updateReportStatus(id: string, dto: UpdateStatusDto): Observable<Report> {
    return this.http.put<Report>(`${this.apiUrl}/${id}/status`, dto);
  }

  /**
   * Update report priority
   * Admin only
   * @param id Report ID
   * @param dto Priority update data
   * @returns Observable of updated report
   */
  updateReportPriority(id: string, dto: UpdatePriorityDto): Observable<Report> {
    return this.http.put<Report>(`${this.apiUrl}/${id}/priority`, dto);
  }

  /**
   * Add admin notes to a report
   * Admin only
   * @param id Report ID
   * @param notes Admin notes
   * @returns Observable of updated report
   */
  addAdminNotes(id: string, notes: string): Observable<Report> {
    return this.http.put<Report>(`${this.apiUrl}/${id}/admin-notes`, { notes });
  }

  /**
   * Get report statistics
   * Admin only
   * @returns Observable of statistics by report type
   */
  getReportStatistics(): Observable<ReportStatistics[]> {
    return this.http.get<ReportStatistics[]>(`${this.apiUrl}/admin/statistics`);
  }

  /**
   * Trigger manual escalation of stale reports (>7 days)
   * Admin only
   * @returns Observable of void
   */
  triggerEscalation(): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/admin/escalate`, {});
  }

  // ===================================
  // HELPER METHODS
  // ===================================

  /**
   * Check if a report can be edited by the user
   * @param report Report to check
   * @returns True if report is pending
   */
  canEditReport(report: Report): boolean {
    return report.status === 'pending';
  }

  /**
   * Check if a report can be deleted by the user
   * @param report Report to check
   * @returns True if report is pending
   */
  canDeleteReport(report: Report): boolean {
    return report.status === 'pending';
  }

  /**
   * Check if more photos can be added to a report
   * @param report Report to check
   * @returns True if less than 5 photos and report is pending
   */
  canAddPhotos(report: Report): boolean {
    const photoCount = report.photos?.length || 0;
    return report.status === 'pending' && photoCount < 5;
  }

  /**
   * Get remaining photo slots for a report
   * @param report Report to check
   * @returns Number of photos that can still be added
   */
  getRemainingPhotoSlots(report: Report): number {
    const photoCount = report.photos?.length || 0;
    return Math.max(0, 5 - photoCount);
  }

  /**
   * Format report reference number for display
   * @param reportId Report ID
   * @returns Formatted reference number
   */
  formatReferenceNumber(reportId: string): string {
    // Take first 8 characters of UUID and format as #ABC12345
    const shortId = reportId.replace(/-/g, '').substring(0, 8).toUpperCase();
    return `#${shortId}`;
  }

  /**
   * Get time elapsed since report creation
   * @param createdAt Creation timestamp
   * @returns Human-readable time elapsed string
   */
  getTimeElapsed(createdAt: string): string {
    const now = new Date();
    const created = new Date(createdAt);
    const diffMs = now.getTime() - created.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) {
      return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    } else {
      return created.toLocaleDateString();
    }
  }

  /**
   * Truncate description for preview
   * @param description Full description
   * @param maxLength Maximum length
   * @returns Truncated description with ellipsis
   */
  truncateDescription(description: string, maxLength: number = 150): string {
    if (description.length <= maxLength) {
      return description;
    }
    return description.substring(0, maxLength).trim() + '...';
  }
}
