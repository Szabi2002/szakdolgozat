import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, MaxLength, MinLength, IsIn } from 'class-validator';

export class UpdateProfileDto {
  @ApiProperty({
    description: 'User full name',
    example: 'Kiss János',
    minLength: 2,
    maxLength: 100,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'Name must be at least 2 characters long' })
  @MaxLength(100, { message: 'Name cannot exceed 100 characters' })
  name?: string;

  @ApiProperty({
    description: 'User nickname/display name (optional)',
    example: 'Jani',
    minLength: 1,
    maxLength: 50,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(1, { message: 'Display name must be at least 1 character long' })
  @MaxLength(50, { message: 'Display name cannot exceed 50 characters' })
  display_name?: string;

  @ApiProperty({
    description: 'Preferred UI language (hu or en)',
    example: 'en',
    enum: ['hu', 'en'],
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsIn(['hu', 'en'], { message: 'Preferred language must be either "hu" or "en"' })
  preferred_language?: string;
}
