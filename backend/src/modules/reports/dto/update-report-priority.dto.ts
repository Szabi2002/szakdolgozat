import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString, IsOptional, MaxLength } from 'class-validator';
import { ReportPriority } from '../entities/report.entity';

/**
 * DTO for updating report priority (admin only)
 * Changes priority level for proper escalation
 */
export class UpdateReportPriorityDto {
  @ApiProperty({
    description: 'New priority level for the report',
    enum: ['low', 'medium', 'high', 'critical'],
    example: 'high',
  })
  @IsEnum(['low', 'medium', 'high', 'critical'], {
    message: 'priority must be one of: low, medium, high, critical',
  })
  priority: ReportPriority;

  @ApiProperty({
    description: 'Optional reason for priority change',
    example: 'Escalated due to safety concerns',
    required: false,
    maxLength: 500,
  })
  @IsOptional()
  @IsString({ message: 'reason must be a string' })
  @MaxLength(500, { message: 'reason must not exceed 500 characters' })
  reason?: string;
}
