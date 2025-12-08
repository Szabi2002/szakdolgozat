/**
 * Rating model for route reviews
 */
export interface Rating {
  id: string;
  user_id: string;
  route_id: string;
  rating_overall: number;
  rating_cleanliness: number;
  rating_punctuality: number;
  rating_driver: number;
  rating_comfort: number;
  comment?: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
  moderated_at?: string;
  moderated_by?: string;
  rejection_reason?: string;
  photos?: RatingPhoto[];
  user?: {
    name: string;
    email: string;
  };
  route?: {
    id: string;
    route_number: string;
    name: string;
  };
}

/**
 * Rating photo model
 */
export interface RatingPhoto {
  id: string;
  rating_id: string;
  photo_url: string;
  created_at: string;
}

/**
 * Aggregate rating statistics for a route
 */
export interface RatingStats {
  route_id: string;
  total_ratings: number;
  avg_overall: number;
  avg_cleanliness: number;
  avg_punctuality: number;
  avg_driver: number;
  avg_comfort: number;
  five_star_count: number;
  four_star_count: number;
  three_star_count: number;
  two_star_count: number;
  one_star_count: number;
}

/**
 * DTO for creating a new rating
 */
export interface CreateRatingDto {
  route_id: string;
  rating_overall: number;
  rating_cleanliness: number;
  rating_punctuality: number;
  rating_driver: number;
  rating_comfort: number;
  comment?: string;
}

/**
 * DTO for updating an existing rating
 */
export interface UpdateRatingDto {
  rating_overall?: number;
  rating_cleanliness?: number;
  rating_punctuality?: number;
  rating_driver?: number;
  rating_comfort?: number;
  comment?: string;
}

/**
 * DTO for moderating a rating (admin)
 */
export interface ModerateRatingDto {
  status: 'approved' | 'rejected';
  rejection_reason?: string;
}

/**
 * Photo upload response
 */
export interface PhotoUploadResponse {
  urls: string[];
}
