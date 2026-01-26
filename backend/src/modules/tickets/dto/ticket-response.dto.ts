import { ApiProperty } from '@nestjs/swagger';

export class TicketTypeDto {
  @ApiProperty({ description: 'Ticket type ID' })
  id: string;

  @ApiProperty({ description: 'Ticket type name', example: 'Single Ticket' })
  name: string;

  @ApiProperty({ description: 'Ticket type', example: 'single' })
  type: string;

  @ApiProperty({ description: 'Ticket price in HUF', example: 450 })
  price: number;

  @ApiProperty({ description: 'Validity hours', example: 1 })
  validity_hours: number | null;

  @ApiProperty({ description: 'Active status' })
  is_active: boolean;
}

export class StopDto {
  @ApiProperty({ description: 'Stop ID' })
  id: string;

  @ApiProperty({ description: 'Stop name', example: 'Bosnyák tér' })
  name: string;

  @ApiProperty({ description: 'Latitude coordinate' })
  latitude: number;

  @ApiProperty({ description: 'Longitude coordinate' })
  longitude: number;

  @ApiProperty({ description: 'Stop type', example: 'bus' })
  type: string;
}

export class RouteDto {
  @ApiProperty({ description: 'Route ID' })
  id: string;

  @ApiProperty({ description: 'Route number', example: '1' })
  route_number: string;

  @ApiProperty({ description: 'Route name', example: 'Mexikói út - Móricz Zsigmond körtér' })
  name: string;
}

export class TicketResponseDto {
  @ApiProperty({ description: 'Ticket ID' })
  id: string;

  @ApiProperty({ description: 'User ID' })
  user_id: string;

  @ApiProperty({ description: 'Ticket type ID' })
  ticket_type_id: string;

  @ApiProperty({
    description: 'Ticket type details (populated via JOIN)',
    type: TicketTypeDto,
    required: false,
  })
  ticket_type?: TicketTypeDto;

  @ApiProperty({ description: 'Route ID', required: false })
  route_id?: string | null;

  @ApiProperty({
    description: 'Route details (populated via JOIN)',
    type: RouteDto,
    required: false,
  })
  route?: RouteDto | null;

  @ApiProperty({ description: 'From stop ID', required: false })
  from_stop_id?: string | null;

  @ApiProperty({
    description: 'From stop details (populated via JOIN)',
    type: StopDto,
    required: false,
  })
  from_stop?: StopDto | null;

  @ApiProperty({ description: 'To stop ID', required: false })
  to_stop_id?: string | null;

  @ApiProperty({
    description: 'To stop details (populated via JOIN)',
    type: StopDto,
    required: false,
  })
  to_stop?: StopDto | null;

  @ApiProperty({ description: 'Ticket status', example: 'active' })
  status: 'active' | 'expired' | 'used' | 'refunded';

  @ApiProperty({ description: 'Ticket price in HUF', example: 450 })
  price: number;

  @ApiProperty({ description: 'Valid from (ISO string)', example: '2025-01-11T10:00:00.000Z' })
  valid_from: string;

  @ApiProperty({
    description: 'Valid until (ISO string)',
    example: '2025-01-11T11:00:00.000Z',
    required: false,
  })
  valid_until?: string | null;

  @ApiProperty({ description: 'Purchase date (ISO string)', example: '2025-01-11T10:00:00.000Z' })
  purchase_date: string;

  @ApiProperty({ description: 'QR code data URL' })
  qr_code: string;

  @ApiProperty({ description: 'Transaction ID', required: false })
  transaction_id?: string | null;

  @ApiProperty({ description: 'Created at (ISO string)', example: '2025-01-11T10:00:00.000Z' })
  created_at: string;

  @ApiProperty({ description: 'Updated at (ISO string)', example: '2025-01-11T10:00:00.000Z' })
  updated_at: string;
}
