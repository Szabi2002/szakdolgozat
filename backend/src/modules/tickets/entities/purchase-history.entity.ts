import { ApiProperty } from '@nestjs/swagger';

export class PurchaseHistory {
  @ApiProperty({
    description: 'Ticket unique identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  ticket_id: string;

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
    description: 'Ticket type name',
    example: 'Single Ride Ticket',
  })
  ticket_type_name: string;

  @ApiProperty({
    description: 'Ticket price in HUF',
    example: 350,
  })
  ticket_price: number;

  @ApiProperty({
    description: 'Ticket validity in hours',
    example: 1,
    required: false,
  })
  ticket_validity_hours?: number;

  @ApiProperty({
    description: 'Ticket type description',
    example: 'Valid for a single ride on any public transport',
    required: false,
  })
  ticket_description?: string;

  @ApiProperty({
    description: 'Purchase timestamp',
    example: '2025-01-13T10:00:00.000Z',
  })
  purchase_date: string;

  @ApiProperty({
    description: 'Ticket valid until timestamp',
    example: '2025-01-13T11:00:00.000Z',
    required: false,
  })
  valid_until?: string;

  @ApiProperty({
    description: 'QR code data URL',
    example: 'data:image/png;base64,iVBORw0KG...',
  })
  qr_code: string;

  @ApiProperty({
    description: 'Ticket status: active or expired',
    example: 'active',
    enum: ['active', 'expired'],
  })
  status: 'active' | 'expired';

  @ApiProperty({
    description: 'Seconds until ticket expiry (negative if expired)',
    example: 3600,
  })
  seconds_until_expiry: number;

  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
  })
  user_email: string;

  @ApiProperty({
    description: 'User display name',
    example: 'John Doe',
    required: false,
  })
  user_display_name?: string;
}

export class PurchaseHistoryResponse {
  @ApiProperty({
    description: 'Array of purchase history items',
    type: [PurchaseHistory],
  })
  data: PurchaseHistory[];

  @ApiProperty({
    description: 'Total count of items matching filters',
    example: 45,
  })
  total: number;

  @ApiProperty({
    description: 'Current page number',
    example: 1,
  })
  page: number;

  @ApiProperty({
    description: 'Items per page',
    example: 10,
  })
  limit: number;

  @ApiProperty({
    description: 'Total number of pages',
    example: 5,
  })
  totalPages: number;
}
