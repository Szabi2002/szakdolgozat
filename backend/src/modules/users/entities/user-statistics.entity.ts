import { ApiProperty } from '@nestjs/swagger';

export class UserStatistics {
  @ApiProperty({
    description: 'User ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  user_id: string;

  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
  })
  email: string;

  @ApiProperty({
    description: 'User display name',
    example: 'John Doe',
    required: false,
  })
  display_name?: string;

  @ApiProperty({
    description: 'User full name from OAuth',
    example: 'John Doe',
  })
  name: string;

  @ApiProperty({
    description: 'Account creation timestamp',
    example: '2025-01-01T00:00:00.000Z',
  })
  account_created_at: Date;

  @ApiProperty({
    description: 'Last successful login timestamp',
    example: '2025-01-13T10:00:00.000Z',
    required: false,
  })
  last_login_at?: Date;

  @ApiProperty({
    description: 'Total number of tickets purchased',
    example: 25,
  })
  total_tickets_purchased: number;

  @ApiProperty({
    description: 'Number of currently active tickets',
    example: 3,
  })
  active_tickets_count: number;

  @ApiProperty({
    description: 'Total amount spent on tickets (HUF)',
    example: 15000,
  })
  total_amount_spent: number;

  @ApiProperty({
    description: 'Number of saved favorite routes',
    example: 5,
  })
  favorite_routes_count: number;

  @ApiProperty({
    description: 'Timestamp of last ticket purchase',
    example: '2025-01-13T10:00:00.000Z',
    required: false,
  })
  last_ticket_purchase_date?: Date;

  @ApiProperty({
    description: 'Timestamp of last favorite route added',
    example: '2025-01-12T15:30:00.000Z',
    required: false,
  })
  last_favorite_added_date?: Date;
}
