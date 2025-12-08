import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateFavoriteDto {
  @ApiProperty({
    description: 'Updated user-defined friendly name for the favorite route',
    example: 'Updated Home to Work Route',
    minLength: 3,
    maxLength: 100,
  })
  @IsString()
  @MinLength(3, { message: 'Favorite name must be at least 3 characters long' })
  @MaxLength(100, { message: 'Favorite name cannot exceed 100 characters' })
  name: string;
}
