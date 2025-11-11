import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsNumber, IsString, IsOptional, Min } from 'class-validator';

export class CreateTransactionDto {
  @ApiProperty({
    description: 'User ID who is making the transaction',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  userId: string;

  @ApiProperty({
    description: 'Ticket ID associated with this transaction',
    example: '123e4567-e89b-12d3-a456-426614174001',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  ticketId?: string;

  @ApiProperty({
    description: 'Transaction amount in HUF',
    example: 350.0,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiProperty({
    description: 'Payment method used',
    example: 'simulation',
    default: 'simulation',
  })
  @IsOptional()
  @IsString()
  paymentMethod?: string;
}
