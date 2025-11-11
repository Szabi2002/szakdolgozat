import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsUUID, IsInt, IsOptional, Matches, ValidateNested, Min } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Route stop item DTO
 * Represents a single stop assignment to a route
 */
export class RouteStopItemDto {
  @ApiProperty({
    example: 'b1234567-89ab-cdef-0123-456789abcdef',
    description: 'UUID of the stop to assign',
  })
  @IsUUID('4', { message: 'stop_id must be a valid UUID' })
  stop_id: string;

  @ApiProperty({
    example: 1,
    description: 'Order/sequence number of the stop in the route (must be unique)',
    minimum: 1,
  })
  @IsInt({ message: 'order must be an integer' })
  @Min(1, { message: 'order must be at least 1' })
  order: number;

  @ApiProperty({
    required: false,
    example: '10:30',
    description: 'Arrival time at this stop in HH:mm format (24-hour)',
    pattern: '^([0-1][0-9]|2[0-3]):[0-5][0-9]$',
  })
  @IsOptional()
  @Matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'arrival_time must be in HH:mm format (e.g., 10:30)',
  })
  arrival_time?: string;
}

/**
 * Assign stops to route DTO
 * Used for bulk assignment of stops to a route
 */
export class AssignStopsDto {
  @ApiProperty({
    type: [RouteStopItemDto],
    description: 'Array of stops to assign to the route with their order and arrival times',
    example: [
      { stop_id: 'b1234567-89ab-cdef-0123-456789abcdef', order: 1, arrival_time: '08:00' },
      { stop_id: 'c2345678-9abc-def0-1234-56789abcdef0', order: 2, arrival_time: '08:15' },
    ],
  })
  @IsArray({ message: 'stops must be an array' })
  @ValidateNested({ each: true })
  @Type(() => RouteStopItemDto)
  stops: RouteStopItemDto[];
}

/**
 * Add single stop to route DTO
 * Used for adding one stop at a time
 */
export class AddStopToRouteDto {
  @ApiProperty({
    example: 1,
    description: 'Order/sequence number of the stop in the route (must be unique)',
    minimum: 1,
  })
  @IsInt({ message: 'order must be an integer' })
  @Min(1, { message: 'order must be at least 1' })
  order: number;

  @ApiProperty({
    required: false,
    example: '10:30',
    description: 'Arrival time at this stop in HH:mm format (24-hour)',
    pattern: '^([0-1][0-9]|2[0-3]):[0-5][0-9]$',
  })
  @IsOptional()
  @Matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'arrival_time must be in HH:mm format (e.g., 10:30)',
  })
  arrival_time?: string;
}
