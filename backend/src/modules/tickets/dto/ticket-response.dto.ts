import { ApiProperty } from '@nestjs/swagger';

export class TicketResponseDto {
  @ApiProperty({
    description: 'Ticket ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'User ID who owns the ticket',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  userId: string;

  @ApiProperty({
    description: 'Ticket type ID',
    example: '123e4567-e89b-12d3-a456-426614174002',
  })
  ticketTypeId: string;

  @ApiProperty({
    description: 'Route ID (if applicable)',
    example: '123e4567-e89b-12d3-a456-426614174003',
    required: false,
  })
  routeId?: string;

  @ApiProperty({
    description: 'From stop ID (if applicable)',
    example: '123e4567-e89b-12d3-a456-426614174004',
    required: false,
  })
  fromStopId?: string;

  @ApiProperty({
    description: 'To stop ID (if applicable)',
    example: '123e4567-e89b-12d3-a456-426614174005',
    required: false,
  })
  toStopId?: string;

  @ApiProperty({
    description: 'QR code data (base64 image)',
    example: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...',
  })
  qrCode: string;

  @ApiProperty({
    description: 'Purchase timestamp',
    example: '2025-01-11T10:00:00.000Z',
  })
  purchaseDate: string;

  @ApiProperty({
    description: 'When the ticket becomes active',
    example: '2025-01-11T10:00:00.000Z',
  })
  validFrom: string;

  @ApiProperty({
    description: 'When the ticket expires',
    example: '2025-01-11T11:30:00.000Z',
    required: false,
  })
  validUntil?: string;

  @ApiProperty({
    description: 'Ticket status',
    example: 'active',
    enum: ['active', 'expired', 'used', 'cancelled'],
  })
  status: string;

  @ApiProperty({
    description: 'Price paid for the ticket',
    example: 350.0,
  })
  price: number;

  @ApiProperty({
    description: 'Transaction ID',
    example: '123e4567-e89b-12d3-a456-426614174006',
    required: false,
  })
  transactionId?: string;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2025-01-11T10:00:00.000Z',
  })
  createdAt: string;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2025-01-11T10:00:00.000Z',
  })
  updatedAt: string;
}
