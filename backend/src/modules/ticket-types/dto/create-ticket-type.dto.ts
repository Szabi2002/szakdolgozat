import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsBoolean, IsIn, Min, MaxLength } from 'class-validator';

export class CreateTicketTypeDto {
  @ApiProperty({
    description: 'Name of the ticket type',
    example: 'Single Ticket',
    maxLength: 100,
  })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiProperty({
    description: 'Description of the ticket type',
    example: 'Valid for a single journey within 90 minutes',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Type of ticket',
    example: 'single',
    enum: ['single', 'return', 'day', 'monthly', 'yearly'],
  })
  @IsString()
  @IsIn(['single', 'return', 'day', 'monthly', 'yearly'])
  type: 'single' | 'return' | 'day' | 'monthly' | 'yearly';

  @ApiProperty({
    description: 'Price in HUF',
    example: 350.0,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({
    description: 'Validity period in hours',
    example: 1.5,
    required: false,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  validityHours?: number;

  @ApiProperty({
    description: 'Whether this ticket type is active and available for purchase',
    example: true,
    default: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
