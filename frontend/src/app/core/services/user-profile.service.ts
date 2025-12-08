import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '@environments/environment';
import {
  UserProfile,
  UserStatistics,
  UpdateProfileDto,
  NotificationPreferences,
  UpdateNotificationPreferencesDto
} from '@core/models/user-profile.model';

@Injectable({
  providedIn: 'root'
})
export class UserProfileService {
  private readonly apiUrl = `${environment.apiUrl}/users`;
  private readonly loadingSubject = new BehaviorSubject<boolean>(false);
  private readonly profileSubject = new BehaviorSubject<UserProfile | null>(null);

  public loading$ = this.loadingSubject.asObservable();
  public profile$ = this.profileSubject.asObservable();

  constructor(private readonly http: HttpClient) {}

  /**
   * Get the current user's profile
   */
  getProfile(): Observable<UserProfile> {
    this.loadingSubject.next(true);

    return this.http.get<UserProfile>(`${this.apiUrl}/profile`).pipe(
      tap(profile => {
        this.profileSubject.next(profile);
        this.loadingSubject.next(false);
      }),
      catchError(error => {
        this.loadingSubject.next(false);
        return this.handleError(error);
      })
    );
  }

  /**
   * Update user profile (display name and language)
   */
  updateProfile(dto: UpdateProfileDto): Observable<UserProfile> {
    this.loadingSubject.next(true);

    return this.http.patch<UserProfile>(`${this.apiUrl}/profile`, dto).pipe(
      tap(updatedProfile => {
        this.profileSubject.next(updatedProfile);
        this.loadingSubject.next(false);
      }),
      catchError(error => {
        this.loadingSubject.next(false);
        return this.handleError(error);
      })
    );
  }

  /**
   * Update notification preferences
   */
  updateNotificationPreferences(dto: UpdateNotificationPreferencesDto): Observable<NotificationPreferences> {
    return this.http.patch<NotificationPreferences>(`${this.apiUrl}/notification-preferences`, dto).pipe(
      tap(updatedPreferences => {
        const currentProfile = this.profileSubject.getValue();
        if (currentProfile) {
          currentProfile.notification_preferences = updatedPreferences;
          this.profileSubject.next(currentProfile);
        }
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Get user account statistics
   */
  getStatistics(): Observable<UserStatistics> {
    return this.http.get<UserStatistics>(`${this.apiUrl}/statistics`).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Get current profile from cache (synchronous)
   */
  getCurrentProfile(): UserProfile | null {
    return this.profileSubject.getValue();
  }

  /**
   * Clear the profile cache (useful after logout)
   */
  clearCache(): void {
    this.profileSubject.next(null);
  }

  /**
   * Handle HTTP errors
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An unknown error occurred';

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side error
      switch (error.status) {
        case 400:
          errorMessage = error.error?.message || 'Invalid request. Please check your input.';
          break;
        case 401:
          errorMessage = 'Your session has expired. Please log in again.';
          break;
        case 403:
          errorMessage = 'You do not have permission to perform this action.';
          break;
        case 404:
          errorMessage = 'Profile not found.';
          break;
        case 500:
          errorMessage = 'Server error. Please try again later.';
          break;
        default:
          errorMessage = `Error: ${error.message}`;
      }
    }

    return throwError(() => new Error(errorMessage));
  }
}
