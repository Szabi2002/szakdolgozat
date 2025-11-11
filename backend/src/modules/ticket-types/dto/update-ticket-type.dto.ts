import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateTicketTypeDto } from './create-ticket-type.dto';

export class UpdateTicketTypeDto extends PartialType(CreateTicketTypeDto) {
  @ApiProperty({
    description: 'Name of the ticket type',
    example: 'Single Ticket',
    required: false,
  })
  name?: string;

  @ApiProperty({
    description: 'Description of the ticket type',
    example: 'Valid for a single journey within 90 minutes',
    required: false,
  })
  description?: string;

  @ApiProperty({
    description: 'Type of ticket',
    example: 'single',
    enum: ['single', 'return', 'day', 'monthly', 'yearly'],
    required: false,
  })
  type?: 'single' | 'return' | 'day' | 'monthly' | 'yearly';

  @ApiProperty({
    description: 'Price in HUF',
    example: 350.0,
    required: false,
  })
  price?: number;

  @ApiProperty({
    description: 'Validity period in hours',
    example: 1.5,
    required: false,
  })
  validityHours?: number;

  @ApiProperty({
    description: 'Whether this ticket type is active',
    example: true,
    required: false,
  })
  isActive?: boolean;
}
