import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserResponseDto } from '@modules/auth/dto/user-response.dto';

export class UserListItemDto extends UserResponseDto {
  @ApiPropertyOptional({ description: 'Whether user has password set', example: true })
  hasPassword?: boolean;

  @ApiPropertyOptional({ description: 'Whether user has Google account linked', example: false })
  hasGoogleLinked?: boolean;
}

export class PaginatedUserListDto {
  @ApiProperty({
    description: 'List of users',
    type: [UserListItemDto],
  })
  data: UserListItemDto[];

  @ApiProperty({ description: 'Total number of users', example: 150 })
  total: number;

  @ApiProperty({ description: 'Current page', example: 1 })
  page: number;

  @ApiProperty({ description: 'Items per page', example: 20 })
  limit: number;

  @ApiProperty({ description: 'Total number of pages', example: 8 })
  totalPages: number;
}
