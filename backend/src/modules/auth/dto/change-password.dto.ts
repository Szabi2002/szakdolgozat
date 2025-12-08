import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, Matches } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({
    description: 'Current password',
    example: 'OldPassword123',
  })
  @IsString()
  oldPassword: string;

  @ApiProperty({
    description: 'New password (minimum 8 characters, 1 uppercase, 1 number)',
    example: 'NewPassword123',
    minLength: 8,
  })
  @IsString()
  @MinLength(8, { message: 'A jelszónak legalább 8 karakter hosszúnak kell lennie' })
  @Matches(/^(?=.*[A-Z])(?=.*\d)/, {
    message: 'A jelszónak tartalmaznia kell legalább 1 nagybetűt és 1 számot',
  })
  newPassword: string;
}
