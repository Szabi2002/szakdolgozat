import { ApiProperty } from '@nestjs/swagger';

export type RatingStatus = 'pending' | 'approved' | 'rejected';

/**
 * Rating entity representing user feedback for a route
 * Matches the 'ratings' table in database
 */
export class Rating {
  @ApiProperty({
    description: 'Rating ID (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'User ID who created the rating',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  user_id: string;

  @ApiProperty({
    description: 'Route ID being rated',
    example: '123e4567-e89b-12d3-a456-426614174002',
  })
  route_id: string;

  @ApiProperty({
    description: 'Overall rating (1-5 stars)',
    minimum: 1,
    maximum: 5,
    example: 4,
  })
  rating_overall: number;

  @ApiProperty({
    description: 'Cleanliness rating (1-5 stars)',
    minimum: 1,
    maximum: 5,
    example: 5,
  })
  rating_cleanliness: number;

  @ApiProperty({
    description: 'Punctuality rating (1-5 stars)',
    minimum: 1,
    maximum: 5,
    example: 3,
  })
  rating_punctuality: number;

  @ApiProperty({
    description: 'Driver behavior rating (1-5 stars)',
    minimum: 1,
    maximum: 5,
    example: 4,
  })
  rating_driver: number;

  @ApiProperty({
    description: 'Comfort rating (1-5 stars)',
    minimum: 1,
    maximum: 5,
    example: 4,
  })
  rating_comfort: number;

  @ApiProperty({
    description: 'Optional comment from user',
    example: 'Great service, very clean and on time!',
    required: false,
  })
  comment?: string;

  @ApiProperty({
    description: 'Moderation status',
    enum: ['pending', 'approved', 'rejected'],
    example: 'pending',
  })
  status: RatingStatus;

  @ApiProperty({
    description: 'Rating creation timestamp',
    example: '2025-01-13T10:00:00.000Z',
  })
  created_at: string;

  @ApiProperty({
    description: 'Rating last update timestamp',
    example: '2025-01-13T10:00:00.000Z',
  })
  updated_at: string;

  @ApiProperty({
    description: 'Timestamp when rating was moderated',
    example: '2025-01-13T11:00:00.000Z',
    required: false,
  })
  moderated_at?: string;
}
