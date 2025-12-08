import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min, Max, IsOptional, IsString, MaxLength } from 'class-validator';

/**
 * DTO for updating an existing pending rating
 * All fields are optional
 * Only pending ratings can be updated by users
 */
export class UpdateRatingDto {
  @ApiProperty({
    description: 'Overall rating (1-5 stars)',
    minimum: 1,
    maximum: 5,
    example: 4,
    required: false,
  })
  @IsOptional()
  @IsInt({ message: 'rating_overall must be an integer' })
  @Min(1, { message: 'rating_overall must be at least 1' })
  @Max(5, { message: 'rating_overall must be at most 5' })
  rating_overall?: number;

  @ApiProperty({
    description: 'Cleanliness rating (1-5 stars)',
    minimum: 1,
    maximum: 5,
    example: 5,
    required: false,
  })
  @IsOptional()
  @IsInt({ message: 'rating_cleanliness must be an integer' })
  @Min(1, { message: 'rating_cleanliness must be at least 1' })
  @Max(5, { message: 'rating_cleanliness must be at most 5' })
  rating_cleanliness?: number;

  @ApiProperty({
    description: 'Punctuality rating (1-5 stars)',
    minimum: 1,
    maximum: 5,
    example: 3,
    required: false,
  })
  @IsOptional()
  @IsInt({ message: 'rating_punctuality must be an integer' })
  @Min(1, { message: 'rating_punctuality must be at least 1' })
  @Max(5, { message: 'rating_punctuality must be at most 5' })
  rating_punctuality?: number;

  @ApiProperty({
    description: 'Driver behavior rating (1-5 stars)',
    minimum: 1,
    maximum: 5,
    example: 4,
    required: false,
  })
  @IsOptional()
  @IsInt({ message: 'rating_driver must be an integer' })
  @Min(1, { message: 'rating_driver must be at least 1' })
  @Max(5, { message: 'rating_driver must be at most 5' })
  rating_driver?: number;

  @ApiProperty({
    description: 'Comfort rating (1-5 stars)',
    minimum: 1,
    maximum: 5,
    example: 4,
    required: false,
  })
  @IsOptional()
  @IsInt({ message: 'rating_comfort must be an integer' })
  @Min(1, { message: 'rating_comfort must be at least 1' })
  @Max(5, { message: 'rating_comfort must be at most 5' })
  rating_comfort?: number;

  @ApiProperty({
    description: 'Optional comment (max 500 characters)',
    example: 'Updated: The driver was very friendly!',
    required: false,
    maxLength: 500,
  })
  @IsOptional()
  @IsString({ message: 'comment must be a string' })
  @MaxLength(500, { message: 'comment must not exceed 500 characters' })
  comment?: string;
}
