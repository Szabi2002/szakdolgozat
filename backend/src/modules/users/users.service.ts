import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { SupabaseService } from '@common/supabase/supabase.service';
import { User } from './entities/user.entity';
import { UserStatistics } from './entities/user-statistics.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateNotificationPreferencesDto } from './dto/update-notification-preferences.dto';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private supabaseService: SupabaseService) {}

  /**
   * Find user by ID
   */
  async findById(id: string): Promise<User> {
    try {
      const { data, error } = await this.supabaseService
        .getClient()
        .from('users')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        throw new NotFoundException(`User ID ${id} nem található`);
      }

      return data as User;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('User lekérés sikertelen: ' + error.message);
    }
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<User | null> {
    try {
      const { data, error } = await this.supabaseService
        .getClient()
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (error) {
        return null;
      }

      return data as User;
    } catch (error) {
      return null;
    }
  }

  /**
   * Create new user
   */
  async create(createUserDto: CreateUserDto): Promise<User> {
    try {
      // Check if user already exists
      const existingUser = await this.findByEmail(createUserDto.email);
      if (existingUser) {
        throw new BadRequestException('Ez az email cím már regisztrálva van');
      }

      const newUser = {
        email: createUserDto.email,
        name: createUserDto.name,
        google_id: createUserDto.google_id,
        profile_picture_url: createUserDto.profile_picture_url || null,
        role: createUserDto.role || 'user',
      };

      const { data, error } = await this.supabaseService
        .getClient()
        .from('users')
        .insert(newUser)
        .select()
        .single();

      if (error) {
        throw new BadRequestException('User létrehozása sikertelen: ' + error.message);
      }

      return data as User;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('User létrehozása sikertelen: ' + error.message);
    }
  }

  /**
   * Update user data
   */
  async update(id: string, updateData: Partial<User>): Promise<User> {
    try {
      // Check if user exists
      await this.findById(id);

      const { data, error } = await this.supabaseService
        .getClient()
        .from('users')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new BadRequestException('User frissítés sikertelen: ' + error.message);
      }

      return data as User;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('User frissítés sikertelen: ' + error.message);
    }
  }

  /**
   * Delete user
   */
  async delete(id: string): Promise<void> {
    try {
      // Check if user exists
      await this.findById(id);

      const { error } = await this.supabaseService.getClient().from('users').delete().eq('id', id);

      if (error) {
        throw new BadRequestException('User törlés sikertelen: ' + error.message);
      }
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('User törlés sikertelen: ' + error.message);
    }
  }

  /**
   * Get user profile with full details including new fields
   * @param userId - User ID
   * @returns User profile
   */
  async getProfile(userId: string): Promise<User> {
    try {
      const { data, error } = await this.supabaseService
        .getClient()
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error || !data) {
        this.logger.warn(`User profile not found: ${userId}`);
        throw new NotFoundException(`User with ID ${userId} not found`);
      }

      return data as User;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Error fetching user profile: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to fetch user profile');
    }
  }

  /**
   * Update user profile (display_name, preferred_language)
   * @param userId - User ID
   * @param updateProfileDto - Profile update data
   * @returns Updated user profile
   */
  async updateProfile(userId: string, updateProfileDto: UpdateProfileDto): Promise<User> {
    try {
      // Verify user exists
      await this.getProfile(userId);

      const { data, error } = await this.supabaseService
        .getClient()
        .from('users')
        .update(updateProfileDto)
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        this.logger.error(`Failed to update user profile: ${error.message}`, error);
        throw new InternalServerErrorException('Failed to update user profile');
      }

      this.logger.log(`User profile updated successfully: ${userId}`);
      return data as User;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof InternalServerErrorException
      ) {
        throw error;
      }
      this.logger.error(`Error updating user profile: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to update user profile');
    }
  }

  /**
   * Update user notification preferences
   * @param userId - User ID
   * @param updateNotificationPreferencesDto - Notification preferences data
   * @returns Updated user profile
   */
  async updateNotificationPreferences(
    userId: string,
    updateNotificationPreferencesDto: UpdateNotificationPreferencesDto,
  ): Promise<User> {
    try {
      // Verify user exists
      await this.getProfile(userId);

      const { data, error } = await this.supabaseService
        .getClient()
        .from('users')
        .update({ notification_preferences: updateNotificationPreferencesDto })
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        this.logger.error(`Failed to update notification preferences: ${error.message}`, error);
        throw new InternalServerErrorException('Failed to update notification preferences');
      }

      this.logger.log(`Notification preferences updated successfully: ${userId}`);
      return data as User;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof InternalServerErrorException
      ) {
        throw error;
      }
      this.logger.error(
        `Error updating notification preferences: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException('Failed to update notification preferences');
    }
  }

  /**
   * Get user statistics from the user_statistics view
   * @param userId - User ID
   * @returns User statistics with aggregated data
   */
  async getStatistics(userId: string): Promise<UserStatistics> {
    try {
      const { data, error } = await this.supabaseService
        .getClient()
        .from('user_statistics')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error || !data) {
        this.logger.warn(`User statistics not found: ${userId}`);
        throw new NotFoundException(`Statistics for user ${userId} not found`);
      }

      return data as UserStatistics;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Error fetching user statistics: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to fetch user statistics');
    }
  }

  /**
   * Update last login timestamp using the database function
   * @param userId - User ID
   */
  async updateLastLogin(userId: string): Promise<void> {
    try {
      const { error } = await this.supabaseService
        .getClient()
        .rpc('update_user_last_login', { p_user_id: userId });

      if (error) {
        this.logger.error(`Failed to update last login: ${error.message}`, error);
        // Don't throw - this is a non-critical operation
      } else {
        this.logger.log(`Last login updated for user: ${userId}`);
      }
    } catch (error) {
      this.logger.error(`Error updating last login: ${error.message}`, error.stack);
      // Don't throw - this is a non-critical operation
    }
  }
}
