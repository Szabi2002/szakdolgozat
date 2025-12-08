import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsString } from 'class-validator';

export class UpdateUserRoleDto {
  @ApiProperty({
    description: 'New user role',
    enum: ['user', 'admin', 'provider'],
    example: 'provider',
  })
  @IsString()
  @IsIn(['user', 'admin', 'provider'], {
    message: 'Role must be one of: user, admin, provider',
  })
  role: 'user' | 'admin' | 'provider';
}
