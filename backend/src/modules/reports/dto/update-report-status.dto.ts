import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString, IsOptional, MaxLength } from 'class-validator';
import { ReportStatus } from '../entities/report.entity';

/**
 * DTO for updating report status (admin only)
 * Changes status from pending/in_review to resolved/dismissed
 * Optionally adds admin notes
 */
export class UpdateReportStatusDto {
  @ApiProperty({
    description: 'New status for the report',
    enum: ['pending', 'in_review', 'resolved', 'dismissed'],
    example: 'resolved',
  })
  @IsEnum(['pending', 'in_review', 'resolved', 'dismissed'], {
    message: 'status must be one of: pending, in_review, resolved, dismissed',
  })
  status: ReportStatus;

  @ApiProperty({
    description: 'Optional admin notes about the status change',
    example: 'Issue confirmed and resolved. Bus route adjusted.',
    required: false,
    maxLength: 1000,
  })
  @IsOptional()
  @IsString({ message: 'admin_notes must be a string' })
  @MaxLength(1000, { message: 'admin_notes must not exceed 1000 characters' })
  admin_notes?: string;
}
