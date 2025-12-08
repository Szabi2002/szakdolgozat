import { ApiProperty } from '@nestjs/swagger';

/**
 * ReportPhoto entity representing photos attached to reports
 * Matches the 'report_photos' table in database
 * Maximum 5 photos per report (enforced by database trigger)
 */
export class ReportPhoto {
  @ApiProperty({
    description: 'Photo ID (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Report ID this photo belongs to',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  report_id: string;

  @ApiProperty({
    description: 'Photo URL in Supabase Storage',
    example: 'https://example.supabase.co/storage/v1/object/public/report-photos/photo123.jpg',
  })
  photo_url: string;

  @ApiProperty({
    description: 'Photo upload timestamp',
    example: '2025-01-13T10:00:00.000Z',
  })
  created_at: string;
}
