import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { environment } from '@environments/environment';
import {
  FavoriteRoute,
  CreateFavoriteDto,
  UpdateFavoriteDto,
  FavoritesResponse
} from '@core/models/favorite-route.model';

@Injectable({
  providedIn: 'root'
})
export class FavoritesService {
  private readonly apiUrl = `${environment.apiUrl}/favorites`;
  private readonly loadingSubject = new BehaviorSubject<boolean>(false);
  private readonly favoritesSubject = new BehaviorSubject<FavoriteRoute[]>([]);

  public loading$ = this.loadingSubject.asObservable();
  public favorites$ = this.favoritesSubject.asObservable();

  constructor(private readonly http: HttpClient) {}

  /**
   * Get all favorites for the current user
   */
  getFavorites(): Observable<FavoriteRoute[]> {
    this.loadingSubject.next(true);

    return this.http.get<FavoriteRoute[]>(this.apiUrl).pipe(
      tap(favorites => {
        this.favoritesSubject.next(favorites);
        this.loadingSubject.next(false);
      }),
      catchError(error => {
        this.loadingSubject.next(false);
        return this.handleError(error);
      })
    );
  }

  /**
   * Get a single favorite by ID
   */
  getFavorite(id: string): Observable<FavoriteRoute> {
    return this.http.get<FavoriteRoute>(`${this.apiUrl}/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Create a new favorite route
   */
  createFavorite(dto: CreateFavoriteDto): Observable<FavoriteRoute> {
    this.loadingSubject.next(true);

    return this.http.post<FavoriteRoute>(this.apiUrl, dto).pipe(
      tap(newFavorite => {
        const currentFavorites = this.favoritesSubject.getValue();
        this.favoritesSubject.next([newFavorite, ...currentFavorites]);
        this.loadingSubject.next(false);
      }),
      catchError(error => {
        this.loadingSubject.next(false);
        return this.handleError(error);
      })
    );
  }

  /**
   * Update an existing favorite (name only)
   */
  updateFavorite(id: string, dto: UpdateFavoriteDto): Observable<FavoriteRoute> {
    this.loadingSubject.next(true);

    return this.http.patch<FavoriteRoute>(`${this.apiUrl}/${id}`, dto).pipe(
      tap(updatedFavorite => {
        const currentFavorites = this.favoritesSubject.getValue();
        const updatedFavorites = currentFavorites.map(fav =>
          fav.id === id ? updatedFavorite : fav
        );
        this.favoritesSubject.next(updatedFavorites);
        this.loadingSubject.next(false);
      }),
      catchError(error => {
        this.loadingSubject.next(false);
        return this.handleError(error);
      })
    );
  }

  /**
   * Delete a favorite route
   */
  deleteFavorite(id: string): Observable<void> {
    this.loadingSubject.next(true);

    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        const currentFavorites = this.favoritesSubject.getValue();
        const filteredFavorites = currentFavorites.filter(fav => fav.id !== id);
        this.favoritesSubject.next(filteredFavorites);
        this.loadingSubject.next(false);
      }),
      catchError(error => {
        this.loadingSubject.next(false);
        return this.handleError(error);
      })
    );
  }

  /**
   * Check if user has reached the maximum number of favorites (20)
   * Returns an Observable that emits true when limit is reached
   */
  hasReachedLimit(): Observable<boolean> {
    return this.favorites$.pipe(
      map(favorites => favorites.length >= 20)
    );
  }

  /**
   * Get the current number of favorites
   */
  getFavoritesCount(): number {
    return this.favoritesSubject.getValue().length;
  }

  /**
   * Clear the favorites cache (useful after logout)
   */
  clearCache(): void {
    this.favoritesSubject.next([]);
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
          errorMessage = 'You must be logged in to access favorites.';
          break;
        case 403:
          errorMessage = 'You do not have permission to perform this action.';
          break;
        case 404:
          errorMessage = 'Favorite not found.';
          break;
        case 409:
          errorMessage = 'You have reached the maximum limit of 20 favorites.';
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
