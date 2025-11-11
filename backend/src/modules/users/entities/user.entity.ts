import { ApiProperty } from '@nestjs/swagger';

export class User {
  @ApiProperty({
    description: 'User unique identifier (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
  })
  email: string;

  @ApiProperty({
    description: 'User full name',
    example: 'John Doe',
  })
  name: string;

  @ApiProperty({
    description: 'User profile picture URL',
    example: 'https://example.com/avatar.jpg',
    required: false,
  })
  profile_picture_url?: string;

  @ApiProperty({
    description: 'Google user identifier',
    example: 'google-oauth2|123456789',
  })
  google_id: string;

  @ApiProperty({
    description: 'User role in the system',
    example: 'user',
    enum: ['user', 'admin', 'provider'],
  })
  role: 'user' | 'admin' | 'provider';

  @ApiProperty({
    description: 'Account creation timestamp',
    example: '2025-01-01T00:00:00.000Z',
  })
  created_at: Date;

  @ApiProperty({
    description: 'Last account update timestamp',
    example: '2025-01-01T00:00:00.000Z',
  })
  updated_at: Date;
}
