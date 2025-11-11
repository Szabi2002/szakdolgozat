import { ApiProperty } from '@nestjs/swagger';

export class RouteStopInfo {
  @ApiProperty({ description: 'Stop ID' })
  id: string;

  @ApiProperty({ description: 'Stop name' })
  name: string;

  @ApiProperty({ description: 'Stop order in route' })
  stop_order: number;

  @ApiProperty({ description: 'Stop type' })
  type: string;

  @ApiProperty({ description: 'Latitude coordinate' })
  latitude: number;

  @ApiProperty({ description: 'Longitude coordinate' })
  longitude: number;
}

export class RouteResponseDto {
  @ApiProperty({ description: 'Route ID' })
  id: string;

  @ApiProperty({ description: 'Route number' })
  route_number: string;

  @ApiProperty({ description: 'Route name' })
  name: string;

  @ApiProperty({ description: 'Provider user ID' })
  provider_id: string;

  @ApiProperty({ description: 'Wheelchair accessibility' })
  is_accessible: boolean;

  @ApiProperty({ description: 'Active status' })
  is_active: boolean;

  @ApiProperty({ description: 'Creation timestamp' })
  created_at: string;

  @ApiProperty({ description: 'Last update timestamp' })
  updated_at: string;

  @ApiProperty({ description: 'Number of stops on this route', required: false })
  stops_count?: number;

  @ApiProperty({
    description: 'List of stops on this route (only in detail view)',
    required: false,
    type: [RouteStopInfo],
  })
  stops?: RouteStopInfo[];
}

export class RouteListResponseDto {
  @ApiProperty({
    description: 'List of routes',
    type: [RouteResponseDto],
  })
  data: RouteResponseDto[];

  @ApiProperty({ description: 'Pagination metadata' })
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
