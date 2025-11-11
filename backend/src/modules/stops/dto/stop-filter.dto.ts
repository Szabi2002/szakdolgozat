import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class StopFilterDto {
  @ApiProperty({
    description: 'Search term for stop name',
    example: 'Deák',
    required: false,
  })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiProperty({
    description: 'Filter by stop type',
    example: 'bus_stop',
    required: false,
    enum: ['bus_stop', 'tram_stop', 'metro_station', 'train_station', 'ferry_terminal'],
  })
  @IsString()
  @IsOptional()
  type?: string;

  @ApiProperty({
    description: 'Southwest latitude for bounding box filter',
    example: 47.4,
    required: false,
  })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  sw_lat?: number;

  @ApiProperty({
    description: 'Southwest longitude for bounding box filter',
    example: 19.0,
    required: false,
  })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  sw_lng?: number;

  @ApiProperty({
    description: 'Northeast latitude for bounding box filter',
    example: 47.6,
    required: false,
  })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  ne_lat?: number;

  @ApiProperty({
    description: 'Northeast longitude for bounding box filter',
    example: 19.2,
    required: false,
  })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  ne_lng?: number;

  @ApiProperty({
    description: 'Page number for pagination',
    example: 1,
    required: false,
    default: 1,
    minimum: 1,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiProperty({
    description: 'Number of items per page',
    example: 10,
    required: false,
    default: 10,
    minimum: 1,
    maximum: 100,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number = 10;
}

export class NearbyStopsDto {
  @ApiProperty({
    description: 'Center latitude',
    example: 47.497913,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;

  @ApiProperty({
    description: 'Center longitude',
    example: 19.040236,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;

  @ApiProperty({
    description: 'Search radius in meters',
    example: 500,
    default: 500,
    minimum: 1,
    maximum: 10000,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(10000)
  @IsOptional()
  radius?: number = 500;
}
