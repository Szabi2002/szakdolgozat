import { ApiProperty } from '@nestjs/swagger';

export class StopRouteInfo {
  @ApiProperty({ description: 'Route ID' })
  id: string;

  @ApiProperty({ description: 'Route number' })
  route_number: string;

  @ApiProperty({ description: 'Route name' })
  name: string;

  @ApiProperty({ description: 'Stop order in route' })
  stop_order: number;
}

export class StopResponseDto {
  @ApiProperty({ description: 'Stop ID' })
  id: string;

  @ApiProperty({ description: 'Stop name' })
  name: string;

  @ApiProperty({ description: 'Latitude coordinate' })
  latitude: number;

  @ApiProperty({ description: 'Longitude coordinate' })
  longitude: number;

  @ApiProperty({ description: 'Stop type' })
  type: string;

  @ApiProperty({ description: 'Wheelchair accessibility' })
  is_accessible: boolean;

  @ApiProperty({ description: 'Creation timestamp' })
  created_at: string;

  @ApiProperty({ description: 'Last update timestamp' })
  updated_at: string;

  @ApiProperty({ description: 'Number of routes using this stop', required: false })
  routes_count?: number;

  @ApiProperty({
    description: 'List of routes using this stop (only in detail view)',
    required: false,
    type: [StopRouteInfo],
  })
  routes?: StopRouteInfo[];

  @ApiProperty({
    description: 'Distance from search center in meters (only in nearby search)',
    required: false,
  })
  distance?: number;
}

export class StopListResponseDto {
  @ApiProperty({
    description: 'List of stops',
    type: [StopResponseDto],
  })
  data: StopResponseDto[];

  @ApiProperty({ description: 'Pagination metadata' })
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
