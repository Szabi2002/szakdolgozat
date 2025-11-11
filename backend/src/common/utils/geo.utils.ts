/**
 * Geospatial utility functions for distance and time calculations
 * Used for multimodal route planning with walking segments
 */

/**
 * Earth's radius in kilometers
 * Using mean radius for Haversine formula
 */
const EARTH_RADIUS_KM = 6371;

/**
 * Average walking speed in km/h
 * Based on typical urban pedestrian speed
 */
const WALKING_SPEED_KMH = 5;

/**
 * Maximum reasonable walking distance between stops
 * ~10 minutes walking at 5 km/h
 */
export const MAX_WALKING_DISTANCE_METERS = 800;

/**
 * Minimum walking distance to consider (below this, ignore)
 * Too short to be worth considering as a walking segment
 */
export const MIN_WALKING_DISTANCE_METERS = 50;

/**
 * Calculate distance between two GPS coordinates using Haversine formula
 *
 * The Haversine formula determines the great-circle distance between two points
 * on a sphere given their longitudes and latitudes.
 *
 * Formula:
 * a = sin²(Δφ/2) + cos φ1 ⋅ cos φ2 ⋅ sin²(Δλ/2)
 * c = 2 ⋅ atan2(√a, √(1−a))
 * d = R ⋅ c
 *
 * where φ is latitude, λ is longitude, R is earth's radius
 *
 * @param lat1 Latitude of point 1 (degrees)
 * @param lon1 Longitude of point 1 (degrees)
 * @param lat2 Latitude of point 2 (degrees)
 * @param lon2 Longitude of point 2 (degrees)
 * @returns Distance in meters
 * @throws Error if coordinates contain NaN or invalid values
 */
export function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  // Validate inputs
  if (!isFinite(lat1) || !isFinite(lon1) || !isFinite(lat2) || !isFinite(lon2)) {
    throw new Error('Invalid coordinates: all values must be finite numbers');
  }

  // Convert degrees to radians
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  // Haversine formula
  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  // Distance in meters
  const distanceKm = EARTH_RADIUS_KM * c;
  const distanceMeters = distanceKm * 1000;

  return distanceMeters;
}

/**
 * Estimate walking time based on distance
 *
 * Uses average walking speed of 5 km/h for urban pedestrians
 * Time is rounded up to the nearest minute for conservative estimates
 *
 * @param distanceMeters Distance in meters
 * @returns Estimated walking time in minutes (rounded up)
 * @throws Error if distance is negative
 */
export function walkingTimeMinutes(distanceMeters: number): number {
  // Validate input
  if (!isFinite(distanceMeters)) {
    throw new Error('Invalid distance: must be a finite number');
  }

  if (distanceMeters < 0) {
    throw new Error('Invalid distance: cannot be negative');
  }

  // Convert to kilometers
  const distanceKm = distanceMeters / 1000;

  // Calculate time in hours, then convert to minutes
  const timeHours = distanceKm / WALKING_SPEED_KMH;
  const timeMinutes = timeHours * 60;

  // Round up to nearest minute for conservative estimates
  return Math.ceil(timeMinutes);
}

/**
 * Check if two stops are within reasonable walking distance
 *
 * @param lat1 Latitude of stop 1 (degrees)
 * @param lon1 Longitude of stop 1 (degrees)
 * @param lat2 Latitude of stop 2 (degrees)
 * @param lon2 Longitude of stop 2 (degrees)
 * @returns True if stops are within MAX_WALKING_DISTANCE_METERS
 */
export function isWalkable(lat1: number, lon1: number, lat2: number, lon2: number): boolean {
  try {
    const distance = haversineDistance(lat1, lon1, lat2, lon2);
    return distance >= MIN_WALKING_DISTANCE_METERS && distance <= MAX_WALKING_DISTANCE_METERS;
  } catch (error) {
    // If coordinates are invalid, not walkable
    return false;
  }
}
