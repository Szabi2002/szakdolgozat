import { ApiProperty } from '@nestjs/swagger';

export type ReportType = 'service_issue' | 'safety_concern' | 'cleanliness' | 'accessibility' | 'other';
export type ReportStatus = 'pending' | 'in_review' | 'resolved' | 'dismissed';
export type ReportPriority = 'low' | 'medium' | 'high' | 'critical';

/**
 * Report entity representing user-submitted issue reports
 * Matches the 'reports' table in database
 */
export class Report {
  @ApiProperty({
    description: 'Report ID (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'User ID who created the report',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  user_id: string;

  @ApiProperty({
    description: 'Route ID related to the report (optional)',
    example: '123e4567-e89b-12d3-a456-426614174002',
    required: false,
  })
  route_id?: string;

  @ApiProperty({
    description: 'Stop ID related to the report (optional)',
    example: '123e4567-e89b-12d3-a456-426614174003',
    required: false,
  })
  stop_id?: string;

  @ApiProperty({
    description: 'Type of report',
    enum: ['service_issue', 'safety_concern', 'cleanliness', 'accessibility', 'other'],
    example: 'service_issue',
  })
  report_type: ReportType;

  @ApiProperty({
    description: 'Report title (10-200 characters)',
    example: 'Bus 4A did not arrive at scheduled time',
    minLength: 10,
    maxLength: 200,
  })
  title: string;

  @ApiProperty({
    description: 'Detailed description of the issue (minimum 20 characters)',
    example: 'The bus route 4A was scheduled to arrive at 14:30 but never showed up. I waited for 45 minutes at the stop.',
    minLength: 20,
  })
  description: string;

  @ApiProperty({
    description: 'Optional free-text location description',
    example: 'Main Street stop, near the shopping center',
    required: false,
  })
  location?: string;

  @ApiProperty({
    description: 'Current status of the report',
    enum: ['pending', 'in_review', 'resolved', 'dismissed'],
    example: 'pending',
  })
  status: ReportStatus;

  @ApiProperty({
    description: 'Priority level of the report',
    enum: ['low', 'medium', 'high', 'critical'],
    example: 'medium',
  })
  priority: ReportPriority;

  @ApiProperty({
    description: 'Admin notes (only visible to admins)',
    example: 'Contacted route supervisor, issue confirmed',
    required: false,
  })
  admin_notes?: string;

  @ApiProperty({
    description: 'Admin user ID who resolved the report',
    example: '123e4567-e89b-12d3-a456-426614174004',
    required: false,
  })
  resolved_by?: string;

  @ApiProperty({
    description: 'Timestamp when report was resolved',
    example: '2025-01-13T11:00:00.000Z',
    required: false,
  })
  resolved_at?: string;

  @ApiProperty({
    description: 'Report creation timestamp',
    example: '2025-01-13T10:00:00.000Z',
  })
  created_at: string;

  @ApiProperty({
    description: 'Report last update timestamp',
    example: '2025-01-13T10:00:00.000Z',
  })
  updated_at: string;
}
