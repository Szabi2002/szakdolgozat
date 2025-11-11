import { IsEmail, IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
  })
  @IsEmail({}, { message: 'Érvénytelen email cím' })
  @IsNotEmpty({ message: 'Email kötelező' })
  email: string;

  @ApiProperty({
    description: 'User full name',
    example: 'John Doe',
  })
  @IsString()
  @IsNotEmpty({ message: 'Név kötelező' })
  name: string;

  @ApiProperty({
    description: 'Google user identifier',
    example: 'google-oauth2|123456789',
  })
  @IsString()
  @IsNotEmpty({ message: 'Google ID kötelező' })
  google_id: string;

  @ApiProperty({
    description: 'User profile picture URL',
    example: 'https://example.com/avatar.jpg',
    required: false,
  })
  @IsString()
  @IsOptional()
  profile_picture_url?: string;

  @ApiProperty({
    description: 'User role in the system',
    example: 'user',
    enum: ['user', 'admin', 'provider'],
    default: 'user',
  })
  @IsEnum(['user', 'admin', 'provider'], { message: 'Érvénytelen role' })
  @IsOptional()
  role?: 'user' | 'admin' | 'provider';
}
