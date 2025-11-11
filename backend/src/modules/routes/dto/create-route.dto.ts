import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsBoolean, IsOptional, MaxLength } from 'class-validator';

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
}
