export interface FavoriteRoute {
  id: string;
  user_id: string;
  name: string;
  from_stop_id: string;
  to_stop_id: string;
  route_data: any; // JSONB - stored trip planner route data
  created_at: string;
  updated_at: string;
  // Populated from JOINs if available:
  from_stop?: {
    id: string;
    name: string;
    latitude: number;
    longitude: number;
  };
  to_stop?: {
    id: string;
    name: string;
    latitude: number;
    longitude: number;
  };
}

export interface CreateFavoriteDto {
  name: string;
  from_stop_id: string;
  to_stop_id: string;
  route_data?: any;
}

export interface UpdateFavoriteDto {
  name: string;
}

export interface FavoritesResponse {
  data: FavoriteRoute[];
  count: number;
}
