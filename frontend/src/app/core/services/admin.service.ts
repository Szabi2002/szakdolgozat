import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError } from 'rxjs';
import { environment } from '@environments/environment';
import { User } from '@core/models/user.model';
import {
  AdminStats,
  PaginatedResponse,
  UserFilters,
} from '@core/models/admin/admin.model';

@Injectable({
  providedIn: 'root',
})
export class AdminService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/admin`;

  /**
   * Get admin dashboard statistics
   * Uses cache-control headers to prevent stale data
   */
  getStats(): Observable<AdminStats> {
    return this.http.get<AdminStats>(`${this.apiUrl}/stats`, {
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    }).pipe(
      catchError((error) => {
        if (!environment.production) {
          console.error('[AdminService] Get stats failed:', error);
        }
        throw error;
      })
    );
  }

  /**
   * Get all users with filters
   */
  getUsers(filters: UserFilters = {}): Observable<PaginatedResponse<User>> {
    const params: any = {};

    if (filters.search) params.search = filters.search;
    if (filters.role) params.role = filters.role;
    if (filters.page) params.page = filters.page.toString();
    if (filters.limit) params.limit = filters.limit.toString();

    return this.http
      .get<PaginatedResponse<User>>(`${this.apiUrl}/users`, { params })
      .pipe(
        catchError((error) => {
          if (!environment.production) {
            console.error('[AdminService] Get users failed:', error);
          }
          throw error;
        })
      );
  }

  /**
   * Update user role
   */
  updateUserRole(
    userId: string,
    role: 'user' | 'admin' | 'provider'
  ): Observable<User> {
    return this.http
      .put<User>(`${this.apiUrl}/users/${userId}/role`, { role })
      .pipe(
        catchError((error) => {
          if (!environment.production) {
            console.error('[AdminService] Update user role failed:', error);
          }
          throw error;
        })
      );
  }

  /**
   * Delete user
   */
  deleteUser(userId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/users/${userId}`).pipe(
      catchError((error) => {
        if (!environment.production) {
          console.error('[AdminService] Delete user failed:', error);
        }
        throw error;
      })
    );
  }

  /**
   * Update report status
   */
  updateReportStatus(
    reportId: string,
    status: string,
    adminNotes?: string
  ): Observable<any> {
    return this.http
      .patch(`${this.apiUrl}/reports/${reportId}/status`, {
        status,
        admin_notes: adminNotes,
      })
      .pipe(
        catchError((error) => {
          if (!environment.production) {
            console.error('[AdminService] Update report status failed:', error);
          }
          throw error;
        })
      );
  }

  /**
   * Update report priority
   */
  updateReportPriority(reportId: string, priority: string): Observable<any> {
    return this.http
      .patch(`${this.apiUrl}/reports/${reportId}/priority`, { priority })
      .pipe(
        catchError((error) => {
          if (!environment.production) {
            console.error(
              '[AdminService] Update report priority failed:',
              error
            );
          }
          throw error;
        })
      );
  }
}
