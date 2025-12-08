import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';

export type RouteType = 'bus' | 'tram' | 'metro' | 'trolley';

export interface Route {
  id: string;
  route_number: string;
  name: string;
  description?: string;
  provider_id: string;
  is_accessible: boolean;
  is_active: boolean;
  route_type?: RouteType;
  stops_count?: number;
  created_at: string;
  updated_at: string;
}

export interface RouteDetails extends Route {
  stops: StopWithOrder[];
}

export interface RouteStop {
  id: string;
  order: number;
  arrival_time?: string;
  arrival_offset?: string;
  stops: Stop;
}

export interface StopWithOrder {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  type: 'bus' | 'tram' | 'metro';
  is_accessible?: boolean;
  stop_order: number;
  arrival_offset?: string;
}

export interface Stop {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  type: 'bus' | 'tram' | 'metro';
  is_accessible: boolean;
}

export interface RouteFilter {
  search?: string;
  provider_id?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface CreateRouteDto {
  route_number: string;
  name: string;
  is_accessible?: boolean;
  route_type?: RouteType;
}

export interface UpdateRouteDto {
  route_number?: string;
  name?: string;
  is_accessible?: boolean;
  is_active?: boolean;
  route_type?: RouteType;
}

export interface AssignStopDto {
  stop_id: string;
  order: number;
  arrival_time?: string;
  arrival_offset?: string;
}

/**
 * Service for managing public transport routes
 * Provides CRUD operations and route-stop assignments
 */
@Injectable({
  providedIn: 'root'
})
export class RoutesService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/routes`;

  /**
   * Get all routes with optional filtering and pagination
   * @param filters Optional filters for search, provider, pagination
   * @returns Observable of paginated route list
   */
  getRoutes(filters?: RouteFilter): Observable<PaginatedResponse<Route>> {
    let params = new HttpParams();
    
    if (filters?.search) {
      params = params.set('search', filters.search);
    }
    if (filters?.provider_id) {
      params = params.set('provider_id', filters.provider_id);
    }
    if (filters?.page) {
      params = params.set('page', filters.page.toString());
    }
    if (filters?.limit) {
      params = params.set('limit', filters.limit.toString());
    }

    return this.http.get<PaginatedResponse<Route>>(this.apiUrl, { params });
  }

  /**
   * Get a single route by ID with all stop details
   * @param id Route ID
   * @returns Observable of route details with stops
   */
  getRoute(id: string): Observable<RouteDetails> {
    return this.http.get<RouteDetails>(`${this.apiUrl}/${id}`);
  }

  /**
   * Create a new route
   * @param dto Route creation data
   * @returns Observable of created route
   */
  createRoute(dto: CreateRouteDto): Observable<Route> {
    return this.http.post<Route>(this.apiUrl, dto);
  }

  /**
   * Update an existing route
   * @param id Route ID
   * @param dto Partial route update data
   * @returns Observable of updated route
   */
  updateRoute(id: string, dto: UpdateRouteDto): Observable<Route> {
    return this.http.put<Route>(`${this.apiUrl}/${id}`, dto);
  }

  /**
   * Delete a route
   * @param id Route ID
   * @returns Observable of void
   */
  deleteRoute(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  /**
   * Assign stops to a route with ordering and arrival times
   * @param routeId Route ID
   * @param stops Array of stop assignments
   * @returns Observable of void
   */
  assignStops(routeId: string, stops: AssignStopDto[]): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${routeId}/stops`, { stops });
  }

  /**
   * Get all stops for a specific route
   * @param routeId Route ID
   * @returns Observable of ordered route stops
   */
  getRouteStops(routeId: string): Observable<RouteStop[]> {
    return this.http.get<RouteStop[]>(`${this.apiUrl}/${routeId}/stops`);
  }

  /**
   * Toggle route active status
   * @param id Route ID
   * @param isActive New active status
   * @returns Observable of updated route
   */
  toggleRouteStatus(id: string, isActive: boolean): Observable<Route> {
    return this.updateRoute(id, { is_active: isActive });
  }
}
