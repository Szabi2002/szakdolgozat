import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsOptional, IsDateString } from 'class-validator';

export class PurchaseTicketDto {
  @ApiProperty({
    description: 'Ticket type ID to purchase',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  ticketTypeId: string;

  @ApiProperty({
    description: 'Route ID (optional, for route-specific tickets)',
    example: '123e4567-e89b-12d3-a456-426614174001',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  routeId?: string;

  @ApiProperty({
    description: 'From stop ID (optional)',
    example: '123e4567-e89b-12d3-a456-426614174002',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  fromStopId?: string;

  @ApiProperty({
    description: 'To stop ID (optional)',
    example: '123e4567-e89b-12d3-a456-426614174003',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  toStopId?: string;

  @ApiProperty({
    description: 'When the ticket should become active (ISO string, defaults to now)',
    example: '2025-01-11T10:00:00.000Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  validFrom?: string;
}
