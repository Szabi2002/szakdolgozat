import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsBoolean,
  IsOptional,
  IsIn,
  Min,
  Max,
  MaxLength,
} from 'class-validator';

export class CreateStopDto {
  @ApiProperty({
    description: 'Name of the stop',
    example: 'Deák Ferenc tér',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiProperty({
    description: 'Latitude coordinate',
    example: 47.497913,
    minimum: -90,
    maximum: 90,
  })
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;

  @ApiProperty({
    description: 'Longitude coordinate',
    example: 19.040236,
    minimum: -180,
    maximum: 180,
  })
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;

  @ApiProperty({
    description: 'Type of stop',
    example: 'bus_stop',
    enum: ['bus_stop', 'tram_stop', 'metro_station', 'train_station', 'ferry_terminal'],
  })
  @IsString()
  @IsIn(['bus_stop', 'tram_stop', 'metro_station', 'train_station', 'ferry_terminal'])
  type: string;

  @ApiProperty({
    description: 'Whether the stop is wheelchair accessible',
    example: true,
    required: false,
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  is_accessible?: boolean;
}
