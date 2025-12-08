import { ApiProperty } from '@nestjs/swagger';
import { Report, ReportType, ReportStatus, ReportPriority } from '../entities/report.entity';
import { ReportPhoto } from '../entities/report-photo.entity';

/**
 * Extended response DTO for reports with related data
 * Includes user info, route/stop details, and photos
 */
export class ReportResponseDto extends Report {
  @ApiProperty({
    description: 'Array of photos attached to the report',
    type: [ReportPhoto],
    required: false,
  })
  photos?: ReportPhoto[];

  @ApiProperty({
    description: 'Route information (if report is related to a route)',
    required: false,
  })
  route?: {
    id: string;
    route_number: string;
    name: string;
  };

  @ApiProperty({
    description: 'Stop information (if report is related to a stop)',
    required: false,
  })
  stop?: {
    id: string;
    name: string;
    stop_code: string;
  };

  @ApiProperty({
    description: 'User information (limited)',
    required: false,
  })
  user?: {
    id: string;
    email: string;
  };
}

/**
 * DTO for report statistics grouped by type
 * Maps to report_type_statistics view
 */
export class ReportStatisticsDto {
  @ApiProperty({
    description: 'Report type',
    enum: ['service_issue', 'safety_concern', 'cleanliness', 'accessibility', 'other'],
    example: 'service_issue',
  })
  report_type: ReportType;

  @ApiProperty({
    description: 'Total number of reports of this type',
    example: 125,
  })
  total_reports: number;

  @ApiProperty({
    description: 'Number of pending reports',
    example: 15,
  })
  pending_count: number;

  @ApiProperty({
    description: 'Number of reports in review',
    example: 8,
  })
  in_review_count: number;

  @ApiProperty({
    description: 'Number of resolved reports',
    example: 95,
  })
  resolved_count: number;

  @ApiProperty({
    description: 'Number of dismissed reports',
    example: 7,
  })
  dismissed_count: number;

  @ApiProperty({
    description: 'Number of critical priority reports',
    example: 3,
  })
  critical_count: number;

  @ApiProperty({
    description: 'Number of high priority reports',
    example: 12,
  })
  high_count: number;

  @ApiProperty({
    description: 'Average resolution time in hours',
    example: 48.5,
    required: false,
  })
  avg_resolution_hours?: number;
}

/**
 * DTO for unresolved reports summary
 * Maps to unresolved_reports_summary view
 */
export class UnresolvedReportsSummaryDto {
  @ApiProperty({
    description: 'Report type',
    enum: ['service_issue', 'safety_concern', 'cleanliness', 'accessibility', 'other'],
    example: 'service_issue',
  })
  report_type: ReportType;

  @ApiProperty({
    description: 'Priority level',
    enum: ['low', 'medium', 'high', 'critical'],
    example: 'high',
  })
  priority: ReportPriority;

  @ApiProperty({
    description: 'Number of unresolved reports',
    example: 5,
  })
  count: number;

  @ApiProperty({
    description: 'Average age in days',
    example: 3,
  })
  avg_age_days: number;

  @ApiProperty({
    description: 'Oldest report timestamp',
    example: '2025-01-10T10:00:00.000Z',
  })
  oldest_report: string;

  @ApiProperty({
    description: 'Newest report timestamp',
    example: '2025-01-13T10:00:00.000Z',
  })
  newest_report: string;
}

/**
 * DTO for admin reports queue
 * Maps to critical_reports_queue view
 */
export class CriticalReportsQueueDto {
  @ApiProperty({
    description: 'Report ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'User ID',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  user_id: string;

  @ApiProperty({
    description: 'Route ID (optional)',
    example: '123e4567-e89b-12d3-a456-426614174002',
    required: false,
  })
  route_id?: string;

  @ApiProperty({
    description: 'Stop ID (optional)',
    example: '123e4567-e89b-12d3-a456-426614174003',
    required: false,
  })
  stop_id?: string;

  @ApiProperty({
    description: 'Report type',
    enum: ['service_issue', 'safety_concern', 'cleanliness', 'accessibility', 'other'],
    example: 'safety_concern',
  })
  report_type: ReportType;

  @ApiProperty({
    description: 'Report title',
    example: 'Unsafe driver behavior on route 4A',
  })
  title: string;

  @ApiProperty({
    description: 'Report description',
    example: 'Driver was speeding and running red lights',
  })
  description: string;

  @ApiProperty({
    description: 'Location description',
    example: 'Route 4A, between Main St and Oak Ave',
    required: false,
  })
  location?: string;

  @ApiProperty({
    description: 'Priority level',
    enum: ['high', 'critical'],
    example: 'critical',
  })
  priority: ReportPriority;

  @ApiProperty({
    description: 'Current status',
    enum: ['pending', 'in_review'],
    example: 'pending',
  })
  status: ReportStatus;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2025-01-13T10:00:00.000Z',
  })
  created_at: string;

  @ApiProperty({
    description: 'Age in hours',
    example: 12.5,
  })
  age_hours: number;

  @ApiProperty({
    description: 'Number of photos attached',
    example: 3,
  })
  photo_count: number;
}
