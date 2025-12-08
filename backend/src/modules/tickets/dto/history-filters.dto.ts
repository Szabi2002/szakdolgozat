import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsUUID, IsIn, IsDateString, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class HistoryFiltersDto {
  @ApiProperty({
    description: 'Page number for pagination (1-indexed)',
    example: 1,
    minimum: 1,
    default: 1,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Page must be an integer' })
  @Min(1, { message: 'Page must be at least 1' })
  page?: number = 1;

  @ApiProperty({
    description: 'Number of items per page',
    example: 10,
    minimum: 1,
    maximum: 100,
    default: 10,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Limit must be an integer' })
  @Min(1, { message: 'Limit must be at least 1' })
  @Max(100, { message: 'Limit cannot exceed 100' })
  limit?: number = 10;

  @ApiProperty({
    description: 'Filter by ticket status',
    example: 'active',
    enum: ['active', 'expired'],
    required: false,
  })
  @IsOptional()
  @IsIn(['active', 'expired'], { message: 'Status must be either "active" or "expired"' })
  status?: 'active' | 'expired';

  @ApiProperty({
    description: 'Filter by ticket type ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @IsOptional()
  @IsUUID('4', { message: 'Ticket type ID must be a valid UUID' })
  ticket_type_id?: string;

  @ApiProperty({
    description: 'Filter purchases from this date (ISO 8601 format)',
    example: '2025-01-01T00:00:00.000Z',
    required: false,
  })
  @IsOptional()
  @IsDateString({}, { message: 'from_date must be a valid ISO 8601 date string' })
  from_date?: string;

  @ApiProperty({
    description: 'Filter purchases until this date (ISO 8601 format)',
    example: '2025-01-31T23:59:59.999Z',
    required: false,
  })
  @IsOptional()
  @IsDateString({}, { message: 'to_date must be a valid ISO 8601 date string' })
  to_date?: string;
}
