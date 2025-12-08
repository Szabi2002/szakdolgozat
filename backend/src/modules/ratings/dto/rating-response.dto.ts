import { ApiProperty } from '@nestjs/swagger';
import { Rating } from '../entities/rating.entity';
import { RatingPhoto } from '../entities/rating-photo.entity';

/**
 * Enhanced rating response with user info, photos, and route details
 */
export class RatingResponseDto extends Rating {
  @ApiProperty({
    description: 'User information',
    example: {
      id: '123e4567-e89b-12d3-a456-426614174001',
      email: 'user@example.com',
      name: 'John Doe',
    },
    required: false,
  })
  user?: {
    id: string;
    email: string;
    name?: string;
  };

  @ApiProperty({
    description: 'Route information',
    example: {
      id: '123e4567-e89b-12d3-a456-426614174002',
      route_number: '1',
      name: 'Kossuth tér - Széchényi tér',
    },
    required: false,
  })
  route?: {
    id: string;
    route_number: string;
    name: string;
  };

  @ApiProperty({
    description: 'Photos attached to this rating (max 5)',
    type: [RatingPhoto],
    required: false,
  })
  photos?: RatingPhoto[];
}

/**
 * Route rating statistics aggregated from approved ratings
 */
export class RouteRatingStatsDto {
  @ApiProperty({
    description: 'Route ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  route_id: string;

  @ApiProperty({
    description: 'Total number of approved ratings',
    example: 42,
  })
  total_ratings: number;

  @ApiProperty({
    description: 'Average overall rating (1-5)',
    example: 4.25,
  })
  avg_overall: number;

  @ApiProperty({
    description: 'Average cleanliness rating (1-5)',
    example: 4.5,
  })
  avg_cleanliness: number;

  @ApiProperty({
    description: 'Average punctuality rating (1-5)',
    example: 3.8,
  })
  avg_punctuality: number;

  @ApiProperty({
    description: 'Average driver rating (1-5)',
    example: 4.2,
  })
  avg_driver: number;

  @ApiProperty({
    description: 'Average comfort rating (1-5)',
    example: 4.0,
  })
  avg_comfort: number;

  @ApiProperty({
    description: 'Number of 5-star ratings',
    example: 15,
  })
  five_star_count: number;

  @ApiProperty({
    description: 'Number of 4-star ratings',
    example: 18,
  })
  four_star_count: number;

  @ApiProperty({
    description: 'Number of 3-star ratings',
    example: 6,
  })
  three_star_count: number;

  @ApiProperty({
    description: 'Number of 2-star ratings',
    example: 2,
  })
  two_star_count: number;

  @ApiProperty({
    description: 'Number of 1-star ratings',
    example: 1,
  })
  one_star_count: number;
}
