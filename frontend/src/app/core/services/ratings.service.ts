import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import {
  Rating,
  RatingStats,
  CreateRatingDto,
  UpdateRatingDto,
  ModerateRatingDto
} from '../models/rating.model';
import { environment } from '../../../environments/environment';

/**
 * Service for managing route ratings and reviews
 */
@Injectable({
  providedIn: 'root'
})
export class RatingsService {
  private readonly apiUrl = `${environment.apiUrl}/ratings`;

  constructor(private http: HttpClient) { }

  /**
   * Create a new rating for a route
   * @param dto Rating data
   * @returns Created rating
   */
  createRating(dto: CreateRatingDto): Observable<Rating> {
    return this.http.post<Rating>(this.apiUrl, dto).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Get all ratings for a specific route
   * @param routeId Route identifier
   * @returns Array of ratings
   */
  getRatingsByRoute(routeId: string): Observable<Rating[]> {
    return this.http.get<Rating[]>(`${this.apiUrl}/route/${routeId}`).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Get aggregate rating statistics for a route
   * @param routeId Route identifier
   * @returns Rating statistics
   */
  getRouteRatingStats(routeId: string): Observable<RatingStats> {
    return this.http.get<RatingStats>(`${this.apiUrl}/route/${routeId}/stats`).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Get all ratings created by the current user
   * @param status Optional status filter
   * @returns Array of user's ratings
   */
  getMyRatings(status?: 'pending' | 'approved' | 'rejected'): Observable<Rating[]> {
    let url = `${this.apiUrl}/my-ratings`;
    if (status) {
      url += `?status=${status}`;
    }
    return this.http.get<Rating[]>(url).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Get my rating statistics
   * @returns Rating statistics
   */
  getMyRatingStats(): Observable<{ total: number; pending: number; approved: number; rejected: number }> {
    return this.http.get<{ total: number; pending: number; approved: number; rejected: number }>(
      `${this.apiUrl}/my-stats`
    ).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Get the current user's rating for a specific route
   * @param routeId Route identifier
   * @returns User's rating or null if not rated yet
   */
  getMyRatingForRoute(routeId: string): Observable<Rating | null> {
    return this.http.get<Rating | null>(
      `${this.apiUrl}/route/${routeId}/my-rating`
    ).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Get a specific rating by ID
   * @param id Rating identifier
   * @returns Rating details
   */
  getRatingById(id: string): Observable<Rating> {
    return this.http.get<Rating>(`${this.apiUrl}/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Update an existing rating
   * @param id Rating identifier
   * @param dto Updated rating data
   * @returns Updated rating
   */
  updateRating(id: string, dto: UpdateRatingDto): Observable<Rating> {
    return this.http.patch<Rating>(`${this.apiUrl}/${id}`, dto).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Delete a rating
   * @param id Rating identifier
   * @returns Observable void
   */
  deleteRating(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Moderate a rating (admin only)
   * @param id Rating identifier
   * @param dto Moderation data
   * @returns Moderated rating
   */
  moderateRating(id: string, dto: ModerateRatingDto): Observable<Rating> {
    return this.http.patch<Rating>(`${this.apiUrl}/${id}/moderate`, dto).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Get all pending ratings (admin only)
   * @returns Array of pending ratings
   */
  getPendingRatings(): Observable<Rating[]> {
    return this.http.get<Rating[]>(`${this.apiUrl}/admin/pending`).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Get all ratings for admin moderation (admin only)
   * Returns ratings with all statuses (pending, approved, rejected)
   * @returns Array of all ratings
   */
  getAllRatingsForAdmin(): Observable<Rating[]> {
    return this.http.get<Rating[]>(`${this.apiUrl}/admin/all`).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Handle HTTP errors
   * @param error HTTP error response
   * @returns Observable error
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An unknown error occurred';

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side error
      if (error.status === 429) {
        errorMessage = 'Rate limit exceeded. Please wait before submitting another rating.';
      } else if (error.status === 400) {
        errorMessage = error.error?.message || 'Invalid rating data';
      } else if (error.status === 403) {
        errorMessage = 'You do not have permission to perform this action';
      } else if (error.status === 404) {
        errorMessage = 'Rating not found';
      } else {
        errorMessage = `Server error: ${error.status} - ${error.error?.message || error.message}`;
      }
    }

    return throwError(() => new Error(errorMessage));
  }
}
