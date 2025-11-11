import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '@common/supabase/supabase.service';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
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
}
