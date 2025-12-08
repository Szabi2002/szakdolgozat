import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, MaxLength, MinLength, IsIn } from 'class-validator';

export class UpdateProfileDto {
  @ApiProperty({
    description: 'User-customizable display name (optional)',
    example: 'John Doe',
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
