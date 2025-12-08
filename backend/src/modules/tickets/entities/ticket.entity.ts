import { ApiProperty } from '@nestjs/swagger';

export class Ticket {
  @ApiProperty({
    description: 'Ticket unique identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'User ID who owns this ticket',
    example: '223e4567-e89b-12d3-a456-426614174001',
  })
  user_id: string;

  @ApiProperty({
    description: 'Ticket type ID',
    example: '323e4567-e89b-12d3-a456-426614174002',
  })
  ticket_type_id: string;

  @ApiProperty({
    description: 'Route ID (optional, for route-specific tickets)',
    example: '423e4567-e89b-12d3-a456-426614174003',
    required: false,
  })
  route_id: string | null;

  @ApiProperty({
    description: 'From stop ID (optional)',
    example: '523e4567-e89b-12d3-a456-426614174004',
    required: false,
  })
  from_stop_id: string | null;

  @ApiProperty({
    description: 'To stop ID (optional)',
    example: '623e4567-e89b-12d3-a456-426614174005',
    required: false,
  })
  to_stop_id: string | null;

  @ApiProperty({
    description: 'QR code data URL',
    example: 'data:image/png;base64,iVBORw0KG...',
  })
  qr_code: string;

  @ApiProperty({
    description: 'Purchase timestamp',
    example: '2025-01-13T10:00:00.000Z',
  })
  purchase_date: string;

  @ApiProperty({
    description: 'Ticket valid from timestamp',
    example: '2025-01-13T10:00:00.000Z',
  })
  valid_from: string;

  @ApiProperty({
    description: 'Ticket valid until timestamp',
    example: '2025-01-13T11:00:00.000Z',
    required: false,
  })
  valid_until: string | null;

  @ApiProperty({
    description: 'Ticket status',
    example: 'active',
    enum: ['active', 'expired', 'used', 'cancelled'],
  })
  status: 'active' | 'expired' | 'used' | 'cancelled';

  @ApiProperty({
    description: 'Ticket price in HUF',
    example: 350,
  })
  price: number;

  @ApiProperty({
    description: 'Transaction ID associated with this purchase',
    example: '723e4567-e89b-12d3-a456-426614174006',
    required: false,
  })
  transaction_id: string | null;

  @ApiProperty({
    description: 'Created timestamp',
    example: '2025-01-13T10:00:00.000Z',
  })
  created_at: string;

  @ApiProperty({
    description: 'Updated timestamp',
    example: '2025-01-13T10:00:00.000Z',
  })
  updated_at: string;
}
