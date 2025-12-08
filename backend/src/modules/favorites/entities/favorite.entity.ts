import { ApiProperty } from '@nestjs/swagger';

export class Favorite {
  @ApiProperty({
    description: 'Favorite route unique identifier (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'User ID who owns this favorite',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  user_id: string;

  @ApiProperty({
    description: 'User-defined friendly name for the favorite route',
    example: 'Home to Work',
  })
  name: string;

  @ApiProperty({
    description: 'Starting stop UUID',
    example: '123e4567-e89b-12d3-a456-426614174002',
  })
  from_stop_id: string;

  @ApiProperty({
    description: 'Destination stop UUID',
    example: '123e4567-e89b-12d3-a456-426614174003',
  })
  to_stop_id: string;

  @ApiProperty({
    description: 'Complete route planning data stored as JSON',
    example: {
      routes: [],
      departureTime: '2025-01-13T10:00:00Z',
      arrivalTime: '2025-01-13T10:30:00Z',
    },
  })
  route_data: Record<string, any>;

  @ApiProperty({
    description: 'Timestamp when the favorite was created',
    example: '2025-01-13T10:00:00.000Z',
  })
  created_at: string;

  @ApiProperty({
    description: 'Timestamp when the favorite was last updated',
    example: '2025-01-13T10:00:00.000Z',
  })
  updated_at: string;
}
