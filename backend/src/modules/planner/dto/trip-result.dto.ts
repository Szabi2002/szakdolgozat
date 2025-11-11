import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Stop DTO - represents a public transport stop or walking waypoint
 */
export class Stop {
  @ApiProperty({
    description: 'Stop UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Stop name',
    example: 'Deák Ferenc tér M',
  })
  name: string;

  @ApiProperty({
    description: 'Latitude coordinate',
    example: 47.497913,
  })
  latitude: number;

  @ApiProperty({
    description: 'Longitude coordinate',
    example: 19.054057,
  })
  longitude: number;

  @ApiProperty({
    description: 'Stop type (bus, tram, metro, train)',
    enum: ['bus', 'tram', 'metro', 'train'],
    example: 'metro',
  })
  type: string;

  @ApiProperty({
    description: 'Wheelchair accessible',
    example: true,
  })
  is_accessible: boolean;

  @ApiProperty({
    description: 'Stop description',
    nullable: true,
    example: 'Metro station with 3 lines',
  })
  description: string | null;
}

/**
 * RouteStep DTO - represents a single segment of the journey (transit or walking)
 */
export class RouteStep {
  @ApiProperty({
    enum: ['transit', 'walking'],
    description: 'Type of travel segment',
    example: 'transit',
  })
  type: 'transit' | 'walking';

  @ApiProperty({
    type: Stop,
    description: 'Starting stop of this segment',
  })
  start_stop: Stop;

  @ApiProperty({
    type: Stop,
    description: 'Ending stop of this segment',
  })
  end_stop: Stop;

  @ApiPropertyOptional({
    description: 'Route UUID (null for walking segments)',
    nullable: true,
    example: '123e4567-e89b-12d3-a456-426614174002',
  })
  route_id?: string;

  @ApiPropertyOptional({
    description: 'Route number (e.g., "7", "M2")',
    example: '7',
    nullable: true,
  })
  route_number?: string;

  @ApiPropertyOptional({
    description: 'Route name',
    example: 'Bosnyák tér - Szabadság híd',
    nullable: true,
  })
  route_name?: string;

  @ApiPropertyOptional({
    description: 'Vehicle type',
    enum: ['bus', 'tram', 'metro', 'train'],
    nullable: true,
    example: 'tram',
  })
  vehicle_type?: 'bus' | 'tram' | 'metro' | 'train';

  @ApiPropertyOptional({
    description: 'Walking distance in meters (only for walking type)',
    example: 450,
    nullable: true,
  })
  distance?: number;

  @ApiProperty({
    description: 'Segment duration in minutes',
    example: 8,
  })
  duration: number;

  @ApiProperty({
    description: 'Number of stops in this segment',
    example: 5,
  })
  stop_count: number;

  @ApiProperty({
    type: [Stop],
    description: 'All stops in this segment (including start and end)',
  })
  stops: Stop[];
}

/**
 * Route DTO - represents one complete route alternative
 */
export class Route {
  @ApiProperty({
    description: 'Unique route alternative ID',
    example: 'route-1',
  })
  route_id: string;

  @ApiProperty({
    description: 'Total travel time in minutes',
    example: 28,
  })
  total_time: number;

  @ApiProperty({
    description: 'Number of transfers',
    example: 1,
  })
  transfers: number;

  @ApiProperty({
    description: 'Total walking distance in meters',
    example: 450,
  })
  walking_distance: number;

  @ApiProperty({
    description: 'Total number of stops',
    example: 12,
  })
  total_stops: number;

  @ApiProperty({
    type: [RouteStep],
    description: 'Ordered list of travel segments',
  })
  steps: RouteStep[];

  @ApiPropertyOptional({
    description: 'Is this the recommended route?',
    example: true,
  })
  recommended?: boolean;

  @ApiPropertyOptional({
    description: 'Why this route is recommended',
    example: 'Fastest route',
    nullable: true,
  })
  recommendation_reason?: string;
}

/**
 * TripSearchResponse DTO - wrapper for search results
 */
export class TripSearchResponse {
  @ApiProperty({
    type: [Route],
    description: 'List of alternative routes (1-5 alternatives)',
  })
  alternatives: Route[];

  @ApiProperty({
    description: 'Search request timestamp',
    example: '2025-11-10T14:30:00Z',
  })
  search_timestamp: string;

  @ApiProperty({
    description: 'Search computation time in milliseconds',
    example: 342,
  })
  computation_time_ms: number;
}

// Legacy DTOs (kept for backward compatibility)

/**
 * @deprecated Use RouteStep instead
 */
export class RouteSegment {
  @ApiProperty({ description: 'Segment type (transit or walking)', enum: ['transit', 'walking'] })
  type: 'transit' | 'walking';

  @ApiProperty({ description: 'Route UUID (null for walking segments)', required: false })
  route_id?: string;

  @ApiProperty({ description: 'Route number (e.g., "1", "M2", null for walking)', required: false })
  route_number?: string;

  @ApiProperty({ description: 'Route name (null for walking segments)', required: false })
  route_name?: string;

  @ApiProperty({ description: 'Starting stop of this segment', type: Stop })
  from_stop: Stop;

  @ApiProperty({ description: 'Ending stop of this segment', type: Stop })
  to_stop: Stop;

  @ApiProperty({ description: 'All stops in this segment', type: [Stop] })
  stops_in_segment: Stop[];

  @ApiProperty({
    description: 'Walking distance in meters (only for walking segments)',
    required: false,
  })
  distance?: number;

  @ApiProperty({ description: 'Segment duration in minutes' })
  duration: number;
}

/**
 * @deprecated Use TripSearchResponse instead
 */
export class TripResultDto {
  @ApiProperty({
    description: 'Array of route segments representing the journey',
    type: [RouteSegment],
  })
  routes: RouteSegment[];

  @ApiProperty({ description: 'Total number of stops in the entire journey' })
  total_stops: number;

  @ApiProperty({ description: 'Number of transfers required' })
  transfers: number;

  @ApiProperty({ description: 'Estimated journey duration in minutes' })
  estimated_duration_minutes: number;

  @ApiProperty({ description: 'Complete path of stops from start to end', type: [Stop] })
  path: Stop[];
}
