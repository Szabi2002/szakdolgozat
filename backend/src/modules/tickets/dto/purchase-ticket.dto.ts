import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsOptional, IsDateString, ValidateIf, Matches } from 'class-validator';
import { Transform, Type } from 'class-transformer';

/**
 * Helper function to normalize UUID fields
 * Converts empty strings, null, undefined, and invalid values to undefined
 */
function normalizeUuidField(value: any): string | undefined {
  // If value is falsy (null, undefined, empty string, etc.), return undefined
  if (!value || value === '' || value === 'null' || value === 'undefined') {
    return undefined;
  }

  // If value is a string, trim it
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed === '' || trimmed === 'null' || trimmed === 'undefined') {
      return undefined;
    }
    return trimmed;
  }

  return undefined;
}

export class PurchaseTicketDto {
  @ApiProperty({
    description: 'Ticket type ID to purchase',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID('4', { message: 'ticket_type_id must be a valid UUID' })
  ticket_type_id: string;

  @ApiProperty({
    description: 'Route ID (optional, for route-specific tickets)',
    example: '123e4567-e89b-12d3-a456-426614174001',
    required: false,
  })
  @Transform(({ value }) => normalizeUuidField(value))
  @IsOptional()
  @ValidateIf((o) => o.route_id !== undefined)
  @IsUUID('4', { message: 'route_id must be a valid UUID' })
  route_id?: string;

  @ApiProperty({
    description: 'From stop ID (optional)',
    example: '123e4567-e89b-12d3-a456-426614174002',
    required: false,
  })
  @Transform(({ value }) => normalizeUuidField(value))
  @IsOptional()
  @ValidateIf((o) => o.from_stop_id !== undefined)
  @IsUUID('4', { message: 'from_stop_id must be a valid UUID' })
  from_stop_id?: string;

  @ApiProperty({
    description: 'To stop ID (optional)',
    example: '123e4567-e89b-12d3-a456-426614174003',
    required: false,
  })
  @Transform(({ value }) => normalizeUuidField(value))
  @IsOptional()
  @ValidateIf((o) => o.to_stop_id !== undefined)
  @IsUUID('4', { message: 'to_stop_id must be a valid UUID' })
  to_stop_id?: string;

  @ApiProperty({
    description: 'When the ticket should become active (ISO string, defaults to now)',
    example: '2025-01-11T10:00:00.000Z',
    required: false,
  })
  @IsOptional()
  @IsDateString({}, { message: 'valid_from must be a valid ISO 8601 date string' })
  valid_from?: string;
}
