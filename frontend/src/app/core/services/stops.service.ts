import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '@environments/environment';
import { Stop } from './routes.service';

export interface RouteInfo {
  id: string;
  route_number: string;
  name: string;
  stop_order?: number;
}

export interface StopDetails extends Stop {
  routes_count?: number;
  routes?: RouteInfo[];
}

export interface StopFilter {
  search?: string;
  sw_lat?: number;
  sw_lng?: number;
  ne_lat?: number;
  ne_lng?: number;
  type?: string;
  page?: number;
  limit?: number;
}

export interface CreateStopDto {
  name: string;
  latitude: number;
  longitude: number;
  type: 'bus' | 'tram' | 'metro';
  is_accessible?: boolean;
}

export interface UpdateStopDto {
  name?: string;
  latitude?: number;
  longitude?: number;
  type?: 'bus' | 'tram' | 'metro';
  is_accessible?: boolean;
}

export interface NearbyStopsParams {
  lat: number;
  lng: number;
  radius?: number;
}

/**
 * Service for managing public transport stops
 * Provides CRUD operations and geographic queries
 */
@Injectable({
  providedIn: 'root'
})
export class StopsService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/stops`;

  /**
   * Get all stops with optional filtering by bounding box and type
   * @param filters Optional filters for geographic bounds and stop type
   * @returns Observable of stop array
   */
  getStops(filters?: StopFilter): Observable<Stop[]> {
    let params = new HttpParams();

    if (filters?.search) {
      params = params.set('search', filters.search);
    }
    if (filters?.sw_lat !== undefined) {
      params = params.set('sw_lat', filters.sw_lat.toString());
    }
    if (filters?.sw_lng !== undefined) {
      params = params.set('sw_lng', filters.sw_lng.toString());
    }
    if (filters?.ne_lat !== undefined) {
      params = params.set('ne_lat', filters.ne_lat.toString());
    }
    if (filters?.ne_lng !== undefined) {
      params = params.set('ne_lng', filters.ne_lng.toString());
    }
    if (filters?.type) {
      params = params.set('type', filters.type);
    }
    if (filters?.page) {
      params = params.set('page', filters.page.toString());
    }
    if (filters?.limit) {
      params = params.set('limit', filters.limit.toString());
    }

    // Backend returns { data: Stop[], meta: {...} } format, we need to extract the data array
    return this.http.get<{ data: Stop[]; meta?: any }>(this.apiUrl, { params }).pipe(
      map(response => {
        // Handle paginated response format
        if (response && Array.isArray(response.data)) {
          return response.data;
        }
        // Fallback: if response is already an array (shouldn't happen with current backend)
        if (Array.isArray(response)) {
          return response as unknown as Stop[];
        }
        // Safety fallback: return empty array
        // console.error('Unexpected response format from /stops endpoint:', response);
        return [];
      })
    );
  }

  /**
   * Get a single stop by ID with all route details
   * @param id Stop ID
   * @returns Observable of stop details with routes
   */
  getStop(id: string): Observable<StopDetails> {
    return this.http.get<StopDetails>(`${this.apiUrl}/${id}`);
  }

  /**
   * Get stops within a radius of a geographic point
   * @param params Latitude, longitude, and optional radius in meters
   * @returns Observable of nearby stops
   */
  getNearbyStops(params: NearbyStopsParams): Observable<Stop[]> {
    let httpParams = new HttpParams()
      .set('lat', params.lat.toString())
      .set('lng', params.lng.toString());

    if (params.radius !== undefined) {
      httpParams = httpParams.set('radius', params.radius.toString());
    }

    return this.http.get<Stop[]>(`${this.apiUrl}/nearby`, { params: httpParams });
  }

  /**
   * Create a new stop
   * @param dto Stop creation data
   * @returns Observable of created stop
   */
  createStop(dto: CreateStopDto): Observable<Stop> {
    return this.http.post<Stop>(this.apiUrl, dto);
  }

  /**
   * Update an existing stop
   * @param id Stop ID
   * @param dto Partial stop update data
   * @returns Observable of updated stop
   */
  updateStop(id: string, dto: UpdateStopDto): Observable<Stop> {
    return this.http.put<Stop>(`${this.apiUrl}/${id}`, dto);
  }

  /**
   * Delete a stop
   * @param id Stop ID
   * @returns Observable of void
   */
  deleteStop(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  /**
   * Get stops within map bounds
   * @param bounds Map bounds with southwest and northeast corners
   * @returns Observable of stops within bounds
   */
  getStopsInBounds(bounds: {
    southwest: { lat: number; lng: number };
    northeast: { lat: number; lng: number };
  }): Observable<Stop[]> {
    return this.getStops({
      sw_lat: bounds.southwest.lat,
      sw_lng: bounds.southwest.lng,
      ne_lat: bounds.northeast.lat,
      ne_lng: bounds.northeast.lng
    });
  }

  /**
   * Get stops by type
   * @param type Stop type (bus, tram, metro)
   * @returns Observable of filtered stops
   */
  getStopsByType(type: 'bus' | 'tram' | 'metro'): Observable<Stop[]> {
    return this.getStops({ type });
  }
}
