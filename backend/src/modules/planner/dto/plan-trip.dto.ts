import { IsUUID, IsOptional, IsString, IsBoolean, IsInt, Min, Max, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class PlanTripDto {
  @ApiProperty({
    description: 'Starting stop UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  from_stop_id: string;

  @ApiProperty({
    description: 'Destination stop UUID',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @IsUUID()
  to_stop_id: string;

  @ApiPropertyOptional({
    description: 'Include walking in route planning',
    default: true,
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  include_walking?: boolean = true;

  @ApiPropertyOptional({
    description: 'Maximum number of alternative routes to return',
    minimum: 1,
    maximum: 5,
    default: 3,
    example: 3,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  @Type(() => Number)
  max_alternatives?: number = 3;

  @ApiPropertyOptional({
    description: 'Travel date (ISO 8601 format)',
    example: '2025-11-10',
  })
  @IsOptional()
  @IsString()
  date?: string;

  @ApiPropertyOptional({
    description: 'Departure time (HH:mm format)',
    example: '14:30',
  })
  @IsOptional()
  @IsString()
  time?: string;

  @ApiPropertyOptional({
    description: 'Route preference optimization',
    enum: ['fastest', 'least_transfers', 'least_walking'],
    default: 'fastest',
    example: 'fastest',
  })
  @IsOptional()
  @IsEnum(['fastest', 'least_transfers', 'least_walking'])
  preference?: 'fastest' | 'least_transfers' | 'least_walking' = 'fastest';
}
