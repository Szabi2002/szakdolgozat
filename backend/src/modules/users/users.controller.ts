import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { CurrentUser } from '@common/decorators/current-user.decorator';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Saját profil lekérése',
    description: 'Aktuálisan bejelentkezett user adatainak lekérése',
  })
  @ApiResponse({
    status: 200,
    description: 'User profil sikeresen lekérve',
    type: User,
  })
  @ApiResponse({
    status: 401,
    description: 'Érvénytelen vagy hiányzó token',
  })
  async getMyProfile(@CurrentUser() user: any): Promise<User> {
    return this.usersService.findById(user.id);
  }
}
