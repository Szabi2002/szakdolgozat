import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString, MinLength, MaxLength, IsOptional, IsUUID } from 'class-validator';
import { ReportType } from '../entities/report.entity';

/**
 * DTO for creating a new report
 * Title must be 10-200 characters
 * Description must be at least 20 characters
 * route_id and stop_id are optional
 */
export class CreateReportDto {
  @ApiProperty({
    description: 'Type of report',
    enum: ['service_issue', 'safety_concern', 'cleanliness', 'accessibility', 'other'],
    example: 'service_issue',
  })
  @IsEnum(['service_issue', 'safety_concern', 'cleanliness', 'accessibility', 'other'], {
    message: 'report_type must be one of: service_issue, safety_concern, cleanliness, accessibility, other',
  })
  report_type: ReportType;

  @ApiProperty({
    description: 'Report title (10-200 characters)',
    example: 'Bus 4A did not arrive at scheduled time',
    minLength: 10,
    maxLength: 200,
  })
  @IsString({ message: 'title must be a string' })
  @MinLength(10, { message: 'title must be at least 10 characters' })
  @MaxLength(200, { message: 'title must not exceed 200 characters' })
  title: string;

  @ApiProperty({
    description: 'Detailed description of the issue (minimum 20 characters)',
    example: 'The bus route 4A was scheduled to arrive at 14:30 but never showed up. I waited for 45 minutes at the stop.',
    minLength: 20,
  })
  @IsString({ message: 'description must be a string' })
  @MinLength(20, { message: 'description must be at least 20 characters' })
  description: string;

  @ApiProperty({
    description: 'Route ID related to the report (optional)',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @IsOptional()
  @IsUUID('4', { message: 'route_id must be a valid UUID' })
  route_id?: string;

  @ApiProperty({
    description: 'Stop ID related to the report (optional)',
    example: '123e4567-e89b-12d3-a456-426614174001',
    required: false,
  })
  @IsOptional()
  @IsUUID('4', { message: 'stop_id must be a valid UUID' })
  stop_id?: string;

  @ApiProperty({
    description: 'Optional free-text location description',
    example: 'Main Street stop, near the shopping center',
    required: false,
    maxLength: 500,
  })
  @IsOptional()
  @IsString({ message: 'location must be a string' })
  @MaxLength(500, { message: 'location must not exceed 500 characters' })
  location?: string;
}
