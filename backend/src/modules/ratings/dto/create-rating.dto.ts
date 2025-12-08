import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsInt, Min, Max, IsOptional, IsString, MaxLength } from 'class-validator';

/**
 * DTO for creating a new rating
 * All rating fields must be between 1-5
 * Comment is optional but limited to 500 characters
 */
export class CreateRatingDto {
  @ApiProperty({
    description: 'Route ID to rate',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID('4', { message: 'route_id must be a valid UUID' })
  route_id: string;

  @ApiProperty({
    description: 'Overall rating (1-5 stars)',
    minimum: 1,
    maximum: 5,
    example: 4,
  })
  @IsInt({ message: 'rating_overall must be an integer' })
  @Min(1, { message: 'rating_overall must be at least 1' })
  @Max(5, { message: 'rating_overall must be at most 5' })
  rating_overall: number;

  @ApiProperty({
    description: 'Cleanliness rating (1-5 stars)',
    minimum: 1,
    maximum: 5,
    example: 5,
  })
  @IsInt({ message: 'rating_cleanliness must be an integer' })
  @Min(1, { message: 'rating_cleanliness must be at least 1' })
  @Max(5, { message: 'rating_cleanliness must be at most 5' })
  rating_cleanliness: number;

  @ApiProperty({
    description: 'Punctuality rating (1-5 stars)',
    minimum: 1,
    maximum: 5,
    example: 3,
  })
  @IsInt({ message: 'rating_punctuality must be an integer' })
  @Min(1, { message: 'rating_punctuality must be at least 1' })
  @Max(5, { message: 'rating_punctuality must be at most 5' })
  rating_punctuality: number;

  @ApiProperty({
    description: 'Driver behavior rating (1-5 stars)',
    minimum: 1,
    maximum: 5,
    example: 4,
  })
  @IsInt({ message: 'rating_driver must be an integer' })
  @Min(1, { message: 'rating_driver must be at least 1' })
  @Max(5, { message: 'rating_driver must be at most 5' })
  rating_driver: number;

  @ApiProperty({
    description: 'Comfort rating (1-5 stars)',
    minimum: 1,
    maximum: 5,
    example: 4,
  })
  @IsInt({ message: 'rating_comfort must be an integer' })
  @Min(1, { message: 'rating_comfort must be at least 1' })
  @Max(5, { message: 'rating_comfort must be at most 5' })
  rating_comfort: number;

  @ApiProperty({
    description: 'Optional comment (max 500 characters)',
    example: 'Great service! The bus was clean and arrived on time.',
    required: false,
    maxLength: 500,
  })
  @IsOptional()
  @IsString({ message: 'comment must be a string' })
  @MaxLength(500, { message: 'comment must not exceed 500 characters' })
  comment?: string;
}
