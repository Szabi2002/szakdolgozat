import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, Matches } from 'class-validator';

export class EmailRegisterDto {
  @ApiProperty({
    description: 'Email address',
    example: 'user@example.com',
  })
  @IsEmail({}, { message: 'Érvénytelen email cím' })
  email: string;

  @ApiProperty({
    description: 'Password (minimum 8 characters, 1 uppercase, 1 number)',
    example: 'Password123',
    minLength: 8,
  })
  @IsString()
  @MinLength(8, { message: 'A jelszónak legalább 8 karakter hosszúnak kell lennie' })
  @Matches(/^(?=.*[A-Z])(?=.*\d)/, {
    message: 'A jelszónak tartalmaznia kell legalább 1 nagybetűt és 1 számot',
  })
  password: string;

  @ApiProperty({
    description: 'User full name',
    example: 'John Doe',
  })
  @IsString()
  @MinLength(2, { message: 'A névnek legalább 2 karakter hosszúnak kell lennie' })
  name: string;
}
