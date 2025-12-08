import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { SupabaseService } from '@common/supabase/supabase.service';
import { CreateFavoriteDto } from './dto/create-favorite.dto';
import { UpdateFavoriteDto } from './dto/update-favorite.dto';
import { Favorite } from './entities/favorite.entity';

@Injectable()
export class FavoritesService {
  private readonly logger = new Logger(FavoritesService.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  /**
   * Creates a new favorite route for the user
   * Enforces the 20 favorites per user limit at the service layer
   * @param userId - User ID creating the favorite
   * @param createFavoriteDto - Favorite creation details
   * @returns Created favorite
   * @throws BadRequestException if user already has 20 favorites or validation fails
   */
  async create(userId: string, createFavoriteDto: CreateFavoriteDto): Promise<Favorite> {
    try {
      const supabase = this.supabaseService.getClient();

      // 1. Validate that from_stop_id and to_stop_id are different
      if (createFavoriteDto.from_stop_id === createFavoriteDto.to_stop_id) {
        throw new BadRequestException('From and to stops must be different');
      }

      // 2. Check current favorite count (service-layer validation)
      const { count, error: countError } = await supabase
        .from('favorite_routes')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId);

      if (countError) {
        this.logger.error(`Failed to count favorites: ${countError.message}`, countError);
        throw new InternalServerErrorException('Failed to check favorites limit');
      }

      if (count !== null && count >= 20) {
        throw new BadRequestException('Maximum 20 favorites allowed per user');
      }

      // 3. Prepare favorite data
      const favoriteData = {
        user_id: userId,
        name: createFavoriteDto.name,
        from_stop_id: createFavoriteDto.from_stop_id,
        to_stop_id: createFavoriteDto.to_stop_id,
        route_data: createFavoriteDto.route_data || {},
      };

      // 4. Insert favorite into database
      const { data, error } = await supabase
        .from('favorite_routes')
        .insert(favoriteData)
        .select()
        .single();

      if (error) {
        // Check for specific error codes
        if (error.code === '23514') {
          // CHECK constraint violation (20 favorites limit trigger)
          throw new BadRequestException('Maximum 20 favorites allowed per user');
        }
        if (error.code === '23503') {
          // Foreign key constraint violation
          throw new BadRequestException('Invalid stop ID provided');
        }
        this.logger.error(`Failed to create favorite: ${error.message}`, error);
        throw new InternalServerErrorException('Failed to create favorite');
      }

      this.logger.log(`Favorite created successfully: ${data.id} for user ${userId}`);
      return data as Favorite;
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof InternalServerErrorException
      ) {
        throw error;
      }
      this.logger.error(`Error creating favorite: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to create favorite');
    }
  }

  /**
   * Gets all favorite routes for a user with stop information
   * Includes JOINs to the stops table for from_stop and to_stop
   * @param userId - User ID
   * @returns Array of user's favorites with stop names, ordered by creation date (newest first)
   */
  async findAll(userId: string): Promise<Favorite[]> {
    try {
      const supabase = this.supabaseService.getClient();

      const { data, error } = await supabase
        .from('favorite_routes')
        .select(`
          *,
          from_stop:stops!favorite_routes_from_stop_id_fkey(id, name, latitude, longitude),
          to_stop:stops!favorite_routes_to_stop_id_fkey(id, name, latitude, longitude)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        this.logger.error(`Failed to fetch favorites: ${error.message}`, error);
        throw new InternalServerErrorException('Failed to fetch favorites');
      }

      return (data || []) as Favorite[];
    } catch (error) {
      if (error instanceof InternalServerErrorException) {
        throw error;
      }
      this.logger.error(`Error fetching favorites: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to fetch favorites');
    }
  }

  /**
   * Gets a single favorite by ID with stop information
   * @param id - Favorite ID
   * @param userId - User ID (for authorization via RLS)
   * @returns Favorite with stop names or throws NotFoundException
   */
  async findOne(id: string, userId: string): Promise<Favorite> {
    try {
      const supabase = this.supabaseService.getClient();

      const { data, error } = await supabase
        .from('favorite_routes')
        .select(`
          *,
          from_stop:stops!favorite_routes_from_stop_id_fkey(id, name, latitude, longitude),
          to_stop:stops!favorite_routes_to_stop_id_fkey(id, name, latitude, longitude)
        `)
        .eq('id', id)
        .eq('user_id', userId)
        .single();

      if (error || !data) {
        this.logger.warn(`Favorite not found: ${id} for user ${userId}`);
        throw new NotFoundException(`Favorite with ID ${id} not found`);
      }

      return data as Favorite;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Error fetching favorite: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to fetch favorite');
    }
  }

  /**
   * Updates a favorite's name
   * @param id - Favorite ID
   * @param userId - User ID (for authorization via RLS)
   * @param updateFavoriteDto - Update details
   * @returns Updated favorite
   */
  async update(
    id: string,
    userId: string,
    updateFavoriteDto: UpdateFavoriteDto,
  ): Promise<Favorite> {
    try {
      // 1. Verify favorite exists and belongs to user
      await this.findOne(id, userId);

      const supabase = this.supabaseService.getClient();

      // 2. Update favorite name
      const { data, error } = await supabase
        .from('favorite_routes')
        .update({ name: updateFavoriteDto.name })
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        this.logger.error(`Failed to update favorite: ${error.message}`, error);
        throw new InternalServerErrorException('Failed to update favorite');
      }

      this.logger.log(`Favorite updated successfully: ${id}`);
      return data as Favorite;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof InternalServerErrorException
      ) {
        throw error;
      }
      this.logger.error(`Error updating favorite: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to update favorite');
    }
  }

  /**
   * Deletes a favorite
   * @param id - Favorite ID
   * @param userId - User ID (for authorization via RLS)
   */
  async remove(id: string, userId: string): Promise<void> {
    try {
      // 1. Verify favorite exists and belongs to user
      await this.findOne(id, userId);

      const supabase = this.supabaseService.getClient();

      // 2. Delete favorite
      const { error } = await supabase
        .from('favorite_routes')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (error) {
        this.logger.error(`Failed to delete favorite: ${error.message}`, error);
        throw new InternalServerErrorException('Failed to delete favorite');
      }

      this.logger.log(`Favorite deleted successfully: ${id}`);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof InternalServerErrorException
      ) {
        throw error;
      }
      this.logger.error(`Error deleting favorite: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to delete favorite');
    }
  }
}
