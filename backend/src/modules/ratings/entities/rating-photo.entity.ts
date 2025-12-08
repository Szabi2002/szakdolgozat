import { ApiProperty } from '@nestjs/swagger';

/**
 * RatingPhoto entity representing a photo attached to a rating
 * Matches the 'rating_photos' table in database
 * Maximum 5 photos per rating (enforced by database trigger)
 */
export class RatingPhoto {
  @ApiProperty({
    description: 'Photo ID (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Rating ID this photo belongs to',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  rating_id: string;

  @ApiProperty({
    description: 'Public URL to the photo in Supabase Storage',
    example: 'https://supabase.co/storage/v1/object/public/rating-photos/abc123.jpg',
  })
  photo_url: string;

  @ApiProperty({
    description: 'Photo upload timestamp',
    example: '2025-01-13T10:00:00.000Z',
  })
  created_at: string;
}
