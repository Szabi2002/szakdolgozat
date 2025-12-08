import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';

export class EmailLoginDto {
  @ApiProperty({
    description: 'Email address',
    example: 'user@example.com',
  })
  @IsEmail({}, { message: 'Érvénytelen email cím' })
  email: string;

  @ApiProperty({
    description: 'Password',
    example: 'Password123',
  })
  @IsString()
  password: string;
}
