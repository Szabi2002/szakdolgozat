import { Controller, Get, Patch, Body, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { UserStatistics } from './entities/user-statistics.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateNotificationPreferencesDto } from './dto/update-notification-preferences.dto';
import { CurrentUser } from '@common/decorators/current-user.decorator';

@ApiTags('users')
@Controller('users')
@ApiBearerAuth()
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('me')
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

  @Get('profile')
  @ApiOperation({
    summary: 'Get user profile',
    description: 'Retrieve complete user profile including display name, language, and notification preferences',
  })
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved successfully',
    type: User,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  async getProfile(@Req() req: any): Promise<User> {
    const userId = req.user.id;
    return this.usersService.getProfile(userId);
  }

  @Patch('profile')
  @ApiOperation({
    summary: 'Update user profile',
    description: 'Update display name and preferred language',
  })
  @ApiResponse({
    status: 200,
    description: 'User profile updated successfully',
    type: User,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid data',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  async updateProfile(
    @Req() req: any,
    @Body() updateProfileDto: UpdateProfileDto,
  ): Promise<User> {
    const userId = req.user.id;
    return this.usersService.updateProfile(userId, updateProfileDto);
  }

  @Patch('notification-preferences')
  @ApiOperation({
    summary: 'Update notification preferences',
    description: 'Update email and push notification preferences',
  })
  @ApiResponse({
    status: 200,
    description: 'Notification preferences updated successfully',
    type: User,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid data',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  async updateNotificationPreferences(
    @Req() req: any,
    @Body() updateNotificationPreferencesDto: UpdateNotificationPreferencesDto,
  ): Promise<User> {
    const userId = req.user.id;
    return this.usersService.updateNotificationPreferences(userId, updateNotificationPreferencesDto);
  }

  @Get('statistics')
  @ApiOperation({
    summary: 'Get user statistics',
    description: 'Retrieve aggregated user statistics including tickets purchased, total spent, and favorites count',
  })
  @ApiResponse({
    status: 200,
    description: 'User statistics retrieved successfully',
    type: UserStatistics,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 404,
    description: 'User statistics not found',
  })
  async getStatistics(@Req() req: any): Promise<UserStatistics> {
    const userId = req.user.id;
    return this.usersService.getStatistics(userId);
  }
}
