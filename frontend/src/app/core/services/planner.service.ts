import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '@environments/environment';

// ============================================================================
// Request DTOs
// ============================================================================

export type RoutePreference = 'fastest' | 'least_transfers' | 'least_walking';

export interface PlanTripDto {
  from_stop_id: string;
  to_stop_id: string;
  date?: string;
  time?: string;
  include_walking?: boolean;         // Include walking segments in routes
  max_alternatives?: number;         // Maximum number of alternative routes (1-5)
  preference?: RoutePreference;      // Route optimization preference
}

// ============================================================================
// Response Interfaces
// ============================================================================

export interface Stop {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  type: 'bus' | 'tram' | 'metro';
  is_accessible: boolean;
  description: string | null;
}

export interface RouteStep {
  type: 'transit' | 'walking';       // Step type (multimodal support)
  start_stop: Stop;
  end_stop: Stop;
  route_id?: string;                 // Optional (null for walking steps)
  route_number?: string;             // Route number display
  route_name?: string;               // Full route name
  vehicle_type?: 'bus' | 'tram' | 'metro'; // Vehicle type for transit steps
  distance?: number;                 // Walking distance in meters
  duration: number;                  // Step duration in minutes
  stop_count: number;                // Number of stops in this segment
  stops: Stop[];                     // All stops in this segment
}

export interface Route {
  route_id: string;
  total_time: number;                // Total trip time in minutes
  transfers: number;                 // Number of transfers required
  walking_distance: number;          // Total walking distance in meters
  total_stops: number;               // Total number of stops
  steps: RouteStep[];                // Route segments
  recommended?: boolean;             // Is this the recommended route?
  recommendation_reason?: string;    // Why this route is recommended
}

export interface TripSearchResponse {
  alternatives: Route[];             // Array of alternative routes
  search_timestamp: string;          // ISO timestamp of search
  computation_time_ms: number;       // Backend computation time
}

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Check if a step is a transit step with route information
 */
export function isTransitStep(step: RouteStep): step is RouteStep & {
  route_id: string;
  route_number: string;
  vehicle_type: 'bus' | 'tram' | 'metro'
} {
  return step.type === 'transit' && !!step.route_id;
}

/**
 * Check if a step is a walking step with distance information
 */
export function isWalkingStep(step: RouteStep): step is RouteStep & {
  distance: number
} {
  return step.type === 'walking' && step.distance !== undefined;
}

// ============================================================================
// Service
// ============================================================================

/**
 * Service for trip planning and route search
 * Integrates with backend planner API for multimodal routing
 *
 * Features:
 * - Multimodal routing (transit + walking)
 * - Alternative route suggestions
 * - Route preference optimization
 * - Helper methods for UI formatting
 */
@Injectable({
  providedIn: 'root'
})
export class PlannerService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/planner`;

  /**
   * Search for multimodal routes between two stops
   * Applies default values for optional parameters
   *
   * @param dto Trip planning parameters
   * @returns Observable of trip search response with multiple alternatives
   *
   * @example
   * ```typescript
   * this.plannerService.searchRoute({
   *   from_stop_id: 'stop-123',
   *   to_stop_id: 'stop-456',
   *   include_walking: true,
   *   max_alternatives: 3,
   *   preference: 'fastest'
   * }).subscribe(response => {
   *   // console.log(response.alternatives.length, 'routes found');
   * });
   * ```
   */
  searchRoute(dto: PlanTripDto): Observable<TripSearchResponse> {
    // Apply default values
    const requestDto: PlanTripDto = {
      ...dto,
      include_walking: dto.include_walking ?? true,
      max_alternatives: dto.max_alternatives ?? 3,
      preference: dto.preference ?? 'fastest'
    };

    return this.http.post<TripSearchResponse>(`${this.apiUrl}/search`, requestDto).pipe(
      catchError(this.handleError)
    );
  }

  // ============================================================================
  // Helper Methods - Route Calculations
  // ============================================================================

  /**
   * Calculate total walking distance for a route
   * Sums up distance from all walking steps
   *
   * @param route Route to calculate walking distance for
   * @returns Total walking distance in meters
   */
  calculateWalkingDistance(route: Route): number {
    return route.steps
      .filter(step => step.type === 'walking')
      .reduce((sum, step) => sum + (step.distance || 0), 0);
  }

  /**
   * Check if route contains walking segments
   *
   * @param route Route to check
   * @returns True if route contains any walking steps
   */
  hasWalking(route: Route): boolean {
    return route.steps.some(step => step.type === 'walking');
  }

  /**
   * Count transit steps in a route
   *
   * @param route Route to analyze
   * @returns Number of transit segments
   */
  countTransitSteps(route: Route): number {
    return route.steps.filter(step => step.type === 'transit').length;
  }

  // ============================================================================
  // Helper Methods - UI Display
  // ============================================================================

  /**
   * Get Material Icon name for a route step
   *
   * @param step Route step
   * @returns Material Icons icon name
   */
  getStepIcon(step: RouteStep): string {
    if (step.type === 'walking') {
      return 'directions_walk';
    }

    switch (step.vehicle_type) {
      case 'bus': return 'directions_bus';
      case 'tram': return 'tram';
      case 'metro': return 'subway';
      default: return 'directions_transit';
    }
  }

  /**
   * Get vehicle type color based on design system
   * Colors from: docs/design/design-system.md
   *
   * @param vehicleType Vehicle type or undefined for walking
   * @returns Hex color code
   */
  getVehicleTypeColor(vehicleType?: 'bus' | 'tram' | 'metro'): string {
    switch (vehicleType) {
      case 'bus': return '#FF5722';     // Deep Orange/Red (Design System)
      case 'tram': return '#FFC107';    // Amber/Yellow (Design System)
      case 'metro': return '#3F51B5';   // Indigo/Blue (Design System)
      default: return '#757575';        // Grey 600 (walking/unknown)
    }
  }

  /**
   * Format walking distance for display
   * Shows meters for < 1000m, kilometers for >= 1000m
   *
   * @param meters Distance in meters
   * @returns Formatted string with unit
   *
   * @example
   * formatWalkingDistance(450) // "450 m"
   * formatWalkingDistance(1500) // "1.5 km"
   */
  formatWalkingDistance(meters: number): string {
    if (meters < 1000) {
      return `${Math.round(meters)} m`;
    }
    return `${(meters / 1000).toFixed(1)} km`;
  }

  /**
   * Format duration for display in Hungarian
   * Shows minutes for < 60min, hours + minutes for >= 60min
   *
   * @param minutes Duration in minutes
   * @returns Formatted string in Hungarian
   *
   * @example
   * formatDuration(25) // "25 perc"
   * formatDuration(90) // "1ó 30p"
   */
  formatDuration(minutes: number): string {
    if (minutes < 60) {
      return `${minutes} perc`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}ó ${mins}p`;
  }

  /**
   * Get recommendation badge text
   * Returns localized text for route recommendation reason
   *
   * @param reason Recommendation reason from backend
   * @returns Hungarian translation
   */
  getRecommendationText(reason?: string): string {
    if (!reason) return '';

    const translations: Record<string, string> = {
      'fastest': 'Leggyorsabb',
      'least_transfers': 'Legkevesebb átszállás',
      'least_walking': 'Legkevesebb gyaloglás',
      'balanced': 'Kiegyensúlyozott'
    };

    return translations[reason] || reason;
  }

  /**
   * Get step type display text in Hungarian
   *
   * @param step Route step
   * @returns Localized step type text
   */
  getStepTypeText(step: RouteStep): string {
    if (step.type === 'walking') {
      return 'Gyaloglás';
    }

    switch (step.vehicle_type) {
      case 'bus': return 'Busz';
      case 'tram': return 'Villamos';
      case 'metro': return 'Metró';
      default: return 'Tömegközlekedés';
    }
  }

  // ============================================================================
  // Error Handling
  // ============================================================================

  /**
   * Handle HTTP errors with user-friendly messages
   *
   * @param error HTTP error response
   * @returns Observable error with localized message
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Hiba történt az útvonalkeresés során.';

    if (error.status === 404) {
      errorMessage = 'Nem található útvonal a megadott megállók között.';
    } else if (error.status === 400) {
      errorMessage = 'Érvénytelen kérés. Ellenőrizze a megállók kiválasztását.';
    } else if (error.status === 0) {
      errorMessage = 'Nem sikerült csatlakozni a szerverhez.';
    } else if (error.status === 500) {
      errorMessage = 'Szerverhiba történt. Kérjük, próbálja újra később.';
    }

    // console.error('Route search error:', error);
    return throwError(() => new Error(errorMessage));
  }
}
