import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsString, MaxLength, MinLength, IsObject, IsOptional } from 'class-validator';

export class CreateFavoriteDto {
  @ApiProperty({
    description: 'User-defined friendly name for the favorite route',
    example: 'Home to Work',
    minLength: 3,
    maxLength: 100,
  })
  @IsString()
  @MinLength(3, { message: 'Favorite name must be at least 3 characters long' })
  @MaxLength(100, { message: 'Favorite name cannot exceed 100 characters' })
  name: string;

  @ApiProperty({
    description: 'Starting stop UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID('4', { message: 'from_stop_id must be a valid UUID' })
  from_stop_id: string;

  @ApiProperty({
    description: 'Destination stop UUID',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @IsUUID('4', { message: 'to_stop_id must be a valid UUID' })
  to_stop_id: string;

  @ApiProperty({
    description: 'Complete route planning data stored as JSON object',
    example: {
      routes: [],
      departureTime: '2025-01-13T10:00:00Z',
      arrivalTime: '2025-01-13T10:30:00Z',
      totalDuration: 30,
      transfers: 1,
    },
    required: false,
  })
  @IsOptional()
  @IsObject({ message: 'route_data must be a valid JSON object' })
  route_data?: Record<string, any>;
}
