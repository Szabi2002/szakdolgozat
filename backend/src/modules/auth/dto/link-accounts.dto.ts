import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class LinkAccountsDto {
  @ApiProperty({
    description: 'Google OAuth token to link to existing account',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @IsString()
  googleToken: string;
}
