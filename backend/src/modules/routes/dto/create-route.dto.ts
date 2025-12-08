import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsBoolean, IsOptional, MaxLength, IsEnum } from 'class-validator';

export enum RouteType {
  BUS = 'bus',
  TRAM = 'tram',
  METRO = 'metro',
  TROLLEY = 'trolley',
}

export class CreateRouteDto {
  @ApiProperty({
    description: 'Route number (e.g., "1A", "M4")',
    example: '1A',
    maxLength: 20,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  route_number: string;

  @ApiProperty({
    description: 'Full name of the route',
    example: 'Kelenföld - Mexikói út',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiProperty({
    description: 'Whether the route is wheelchair accessible',
    example: true,
    required: false,
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  is_accessible?: boolean;

  @ApiProperty({
    description: 'Route type (transportation mode)',
    enum: RouteType,
    example: RouteType.METRO,
    required: false,
  })
  @IsEnum(RouteType, { message: 'route_type must be one of: bus, tram, metro, trolley' })
  @IsOptional()
  route_type?: RouteType;
}
