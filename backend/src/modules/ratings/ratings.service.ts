import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { SupabaseService } from '@common/supabase/supabase.service';
import { InputSanitizer } from '@common/validators/input-sanitizer';
import { CreateRatingDto } from './dto/create-rating.dto';
import { UpdateRatingDto } from './dto/update-rating.dto';
import { ModerateRatingDto } from './dto/moderate-rating.dto';
import { RatingResponseDto, RouteRatingStatsDto } from './dto/rating-response.dto';
import { Rating } from './entities/rating.entity';

@Injectable()
export class RatingsService {
  private readonly logger = new Logger(RatingsService.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  /**
   * Creates a new rating for a route
   * User can only rate each route once (enforced by unique constraint in database)
   * New ratings default to 'pending' status
   * @param userId - User ID creating the rating
   * @param createRatingDto - Rating data
   * @returns Created rating
   * @throws ConflictException if user has already rated this route
   */
  async create(userId: string, createRatingDto: CreateRatingDto): Promise<Rating> {
    try {
      const supabase = this.supabaseService.getClient();

      // Validate route exists
      const { data: route, error: routeError } = await supabase
        .from('routes')
        .select('id')
        .eq('id', createRatingDto.route_id)
        .single();

      if (routeError || !route) {
        throw new NotFoundException(
          `Route with ID ${createRatingDto.route_id} not found`,
        );
      }

      // Prepare rating data with user_id and pending status
      const ratingData = {
        user_id: userId,
        route_id: createRatingDto.route_id,
        rating_overall: createRatingDto.rating_overall,
        rating_cleanliness: createRatingDto.rating_cleanliness,
        rating_punctuality: createRatingDto.rating_punctuality,
        rating_driver: createRatingDto.rating_driver,
        rating_comfort: createRatingDto.rating_comfort,
        comment: createRatingDto.comment || null,
        status: 'pending' as const,
      };

      const { data, error } = await supabase
        .from('ratings')
        .insert(ratingData)
        .select()
        .single();

      if (error) {
        // Check for unique constraint violation (user already rated this route)
        if (error.code === '23505') {
          this.logger.warn(
            `User ${userId} attempted to rate route ${createRatingDto.route_id} multiple times`,
          );
          throw new ConflictException('You have already rated this route');
        }

        this.logger.error(`Failed to create rating: ${error.message}`, error);
        throw new InternalServerErrorException('Failed to create rating');
      }

      this.logger.log(`Rating created: ${data.id} by user ${userId} for route ${createRatingDto.route_id}`);
      return data;
    } catch (error) {
      if (
        error instanceof ConflictException ||
        error instanceof InternalServerErrorException
      ) {
        throw error;
      }
      this.logger.error(`Error creating rating: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to create rating');
    }
  }

  /**
   * Gets all approved ratings for a specific route
   * Includes user info and photos
   * @param routeId - Route ID
   * @returns Array of approved ratings with details
   */
  async findByRoute(routeId: string): Promise<RatingResponseDto[]> {
    try {
      const supabase = this.supabaseService.getAdminClient();

      // Fetch ratings without relationships - just raw data
      const { data: ratingsData, error: ratingsError } = await supabase
        .from('ratings')
        .select('*')
        .eq('route_id', routeId)
        .eq('status', 'approved')
        .order('created_at', { ascending: false });

      if (ratingsError) {
        this.logger.error(`Failed to fetch ratings for route ${routeId}: ${ratingsError.message}`, ratingsError);
        throw new InternalServerErrorException('Failed to fetch ratings');
      }

      // Ensure we always return an array, even if data is null or undefined
      const ratings = ratingsData || [];

      if (ratings.length === 0) {
        return [];
      }

      // Fetch route data separately
      const { data: routeData, error: routeError } = await supabase
        .from('routes')
        .select('id, route_number, name')
        .eq('id', routeId)
        .single();

      if (routeError) {
        this.logger.warn(`Failed to fetch route details: ${routeError.message}`, routeError);
      }

      // Fetch user data for all ratings in a single query
      const userIds = [...new Set(ratings.map(r => r.user_id))];
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, name, email, avatar_url')
        .in('id', userIds);

      if (usersError) {
        this.logger.warn(`Failed to fetch user details: ${usersError.message}`, usersError);
      }

      // Create a map of users by ID for quick lookup
      const usersById = (usersData || []).reduce((acc, user) => {
        acc[user.id] = user;
        return acc;
      }, {});

      // Fetch photos for all ratings in a single query
      const ratingIds = ratings.map(r => r.id);
      const { data: photosData, error: photosError } = await supabase
        .from('rating_photos')
        .select('*')
        .in('rating_id', ratingIds);

      if (photosError) {
        this.logger.warn(`Failed to fetch rating photos: ${photosError.message}`, photosError);
      }

      // Group photos by rating_id
      const photosByRating = (photosData || []).reduce((acc, photo) => {
        if (!acc[photo.rating_id]) {
          acc[photo.rating_id] = [];
        }
        acc[photo.rating_id].push(photo);
        return acc;
      }, {});

      // Combine data
      const result = ratings.map(rating => ({
        ...rating,
        user: usersById[rating.user_id] || null,
        route: routeData || null,
        photos: photosByRating[rating.id] || [],
      }));

      this.logger.debug(`Found ${ratings.length} approved ratings for route ${routeId}`);
      return result as RatingResponseDto[];
    } catch (error) {
      if (error instanceof InternalServerErrorException) {
        throw error;
      }
      this.logger.error(`Error fetching ratings for route: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to fetch ratings');
    }
  }

  /**
   * Gets rating statistics for a specific route
   * Uses the route_rating_stats view created in migration
   * @param routeId - Route ID
   * @returns Rating statistics or null if no ratings exist
   */
  async getRouteStats(routeId: string): Promise<RouteRatingStatsDto | null> {
    try {
      const supabase = this.supabaseService.getClient();

      const { data, error } = await supabase
        .from('route_rating_stats')
        .select('*')
        .eq('route_id', routeId)
        .single();

      if (error) {
        // PGRST116 = no rows returned (route has no ratings yet)
        if (error.code === 'PGRST116') {
          return null;
        }
        this.logger.error(`Failed to fetch route stats: ${error.message}`, error);
        throw new InternalServerErrorException('Failed to fetch route statistics');
      }

      return data as RouteRatingStatsDto;
    } catch (error) {
      if (error instanceof InternalServerErrorException) {
        throw error;
      }
      this.logger.error(`Error fetching route stats: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to fetch route statistics');
    }
  }

  /**
   * Gets the current user's rating for a specific route
   * Returns null if user hasn't rated this route yet
   * @param routeId - Route ID
   * @param userId - User ID
   * @returns User's rating for the route or null
   */
  async findMyRatingForRoute(
    routeId: string,
    userId: string,
  ): Promise<RatingResponseDto | null> {
    try {
      const supabase = this.supabaseService.getAdminClient();

      // Fetch rating without relationships - just raw data
      const { data: ratingData, error } = await supabase
        .from('ratings')
        .select('*')
        .eq('route_id', routeId)
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        this.logger.error(
          `Failed to fetch user rating for route ${routeId}: ${error.message}`,
          error,
        );
        throw new InternalServerErrorException('Failed to fetch your rating');
      }

      if (!ratingData) {
        return null;
      }

      // Fetch route data separately
      const { data: routeData, error: routeError } = await supabase
        .from('routes')
        .select('id, route_number, name')
        .eq('id', routeId)
        .single();

      if (routeError) {
        this.logger.warn(`Failed to fetch route details: ${routeError.message}`, routeError);
      }

      // Fetch photos separately
      const { data: photosData, error: photosError } = await supabase
        .from('rating_photos')
        .select('*')
        .eq('rating_id', ratingData.id);

      if (photosError) {
        this.logger.warn(`Failed to fetch rating photos: ${photosError.message}`, photosError);
      }

      // Combine data
      const result = {
        ...ratingData,
        route: routeData || null,
        photos: photosData || [],
      };

      return result as RatingResponseDto;
    } catch (error) {
      if (error instanceof InternalServerErrorException) {
        throw error;
      }
      this.logger.error(
        `Error fetching user rating for route: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException('Failed to fetch your rating');
    }
  }

  /**
   * Gets all ratings created by the current user
   * Includes all statuses (pending, approved, rejected)
   * @param userId - User ID
   * @returns Array of user's ratings
   */
  async findMyRatings(userId: string): Promise<RatingResponseDto[]> {
    try {
      const supabase = this.supabaseService.getAdminClient();

      // Fetch ratings without relationships - just raw data
      const { data: ratingsData, error: ratingsError } = await supabase
        .from('ratings')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (ratingsError) {
        this.logger.error(`Failed to fetch user ratings: ${ratingsError.message}`, ratingsError);
        throw new InternalServerErrorException('Failed to fetch your ratings');
      }

      const ratings = ratingsData || [];

      if (ratings.length === 0) {
        return [];
      }

      // Get unique route IDs
      const routeIds = [...new Set(ratings.map(r => r.route_id))];

      // Fetch all routes in a single query
      const { data: routesData, error: routesError } = await supabase
        .from('routes')
        .select('id, route_number, name')
        .in('id', routeIds);

      if (routesError) {
        this.logger.warn(`Failed to fetch routes: ${routesError.message}`, routesError);
      }

      // Create a map of routes by ID for quick lookup
      const routesById = (routesData || []).reduce((acc, route) => {
        acc[route.id] = route;
        return acc;
      }, {});

      // Note: User data is not fetched here since this returns the current user's own ratings
      // The user already knows their own identity

      // Fetch all photos for all ratings in a single query
      const ratingIds = ratings.map(r => r.id);
      const { data: photosData, error: photosError } = await supabase
        .from('rating_photos')
        .select('*')
        .in('rating_id', ratingIds);

      if (photosError) {
        this.logger.warn(`Failed to fetch rating photos: ${photosError.message}`, photosError);
      }

      // Group photos by rating_id
      const photosByRating = (photosData || []).reduce((acc, photo) => {
        if (!acc[photo.rating_id]) {
          acc[photo.rating_id] = [];
        }
        acc[photo.rating_id].push(photo);
        return acc;
      }, {});

      // Combine data
      const result = ratings.map(rating => ({
        ...rating,
        user: null, // User data not needed for own ratings
        route: routesById[rating.route_id] || null,
        photos: photosByRating[rating.id] || [],
      }));

      this.logger.debug(`Found ${ratings.length} ratings for user ${userId}`);
      return result as RatingResponseDto[];
    } catch (error) {
      if (error instanceof InternalServerErrorException) {
        throw error;
      }
      this.logger.error(`Error fetching user ratings: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to fetch your ratings');
    }
  }

  /**
   * Gets a specific rating by ID
   * Includes user info, route info, and photos
   * @param id - Rating ID
   * @returns Rating with full details
   * @throws NotFoundException if rating doesn't exist
   */
  async findOne(id: string): Promise<RatingResponseDto> {
    try {
      const supabase = this.supabaseService.getAdminClient();

      // Fetch rating without relationships - just raw data
      const { data: ratingData, error: ratingError } = await supabase
        .from('ratings')
        .select('*')
        .eq('id', id)
        .single();

      if (ratingError || !ratingData) {
        this.logger.warn(`Rating not found: ${id}`);
        throw new NotFoundException(`Rating with ID ${id} not found`);
      }

      // Fetch photos separately
      const { data: photosData, error: photosError } = await supabase
        .from('rating_photos')
        .select('*')
        .eq('rating_id', id);

      if (photosError) {
        this.logger.warn(`Failed to fetch rating photos: ${photosError.message}`, photosError);
      }

      // Fetch route information if route_id exists
      let routeData: any = null;
      if (ratingData.route_id) {
        const { data: route, error: routeError } = await supabase
          .from('routes')
          .select('id, route_number, name')
          .eq('id', ratingData.route_id)
          .single();

        if (routeError) {
          this.logger.warn(`Failed to fetch route details: ${routeError.message}`, routeError);
        } else {
          routeData = route;
        }
      }

      // Combine data
      const result = {
        ...ratingData,
        photos: photosData || [],
        route: routeData,
      };

      return result as RatingResponseDto;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Error fetching rating: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to fetch rating');
    }
  }

  /**
   * Updates a pending rating
   * Only the owner can update their own pending ratings
   * @param id - Rating ID
   * @param userId - User ID (for authorization)
   * @param updateRatingDto - Updated rating data
   * @returns Updated rating
   * @throws NotFoundException if rating doesn't exist
   * @throws ForbiddenException if user doesn't own the rating
   * @throws BadRequestException if rating is not pending
   */
  async update(
    id: string,
    userId: string,
    updateRatingDto: UpdateRatingDto,
  ): Promise<Rating> {
    try {
      // First check if rating exists and belongs to user
      const existing = await this.findOne(id);

      if (existing.user_id !== userId) {
        throw new ForbiddenException('You can only update your own ratings');
      }

      if (existing.status !== 'pending') {
        throw new BadRequestException('Only pending ratings can be updated');
      }

      const supabase = this.supabaseService.getClient();

      // Build update object with only provided fields
      const updateData: any = {};
      if (updateRatingDto.rating_overall !== undefined)
        updateData.rating_overall = updateRatingDto.rating_overall;
      if (updateRatingDto.rating_cleanliness !== undefined)
        updateData.rating_cleanliness = updateRatingDto.rating_cleanliness;
      if (updateRatingDto.rating_punctuality !== undefined)
        updateData.rating_punctuality = updateRatingDto.rating_punctuality;
      if (updateRatingDto.rating_driver !== undefined)
        updateData.rating_driver = updateRatingDto.rating_driver;
      if (updateRatingDto.rating_comfort !== undefined)
        updateData.rating_comfort = updateRatingDto.rating_comfort;
      if (updateRatingDto.comment !== undefined)
        updateData.comment = updateRatingDto.comment;

      const { data, error } = await supabase
        .from('ratings')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', userId)
        .eq('status', 'pending')
        .select()
        .single();

      if (error) {
        this.logger.error(`Failed to update rating: ${error.message}`, error);
        throw new InternalServerErrorException('Failed to update rating');
      }

      this.logger.log(`Rating updated: ${id} by user ${userId}`);
      return data;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException ||
        error instanceof BadRequestException ||
        error instanceof InternalServerErrorException
      ) {
        throw error;
      }
      this.logger.error(`Error updating rating: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to update rating');
    }
  }

  /**
   * Deletes a pending rating
   * Only the owner can delete their own pending ratings
   * RLS policies enforce this at database level as well
   * @param id - Rating ID
   * @param userId - User ID (for authorization)
   * @throws NotFoundException if rating doesn't exist
   * @throws ForbiddenException if user doesn't own the rating
   * @throws BadRequestException if rating is not pending
   */
  async delete(id: string, userId: string): Promise<void> {
    try {
      // First check if rating exists and belongs to user
      const existing = await this.findOne(id);

      if (existing.user_id !== userId) {
        throw new ForbiddenException('You can only delete your own ratings');
      }

      if (existing.status !== 'pending') {
        throw new BadRequestException('Only pending ratings can be deleted');
      }

      const supabase = this.supabaseService.getClient();

      const { error } = await supabase
        .from('ratings')
        .delete()
        .eq('id', id)
        .eq('user_id', userId)
        .eq('status', 'pending');

      if (error) {
        this.logger.error(`Failed to delete rating: ${error.message}`, error);
        throw new InternalServerErrorException('Failed to delete rating');
      }

      this.logger.log(`Rating deleted: ${id} by user ${userId}`);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException ||
        error instanceof BadRequestException ||
        error instanceof InternalServerErrorException
      ) {
        throw error;
      }
      this.logger.error(`Error deleting rating: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to delete rating');
    }
  }

  /**
   * Moderates a rating (admin only)
   * Changes status from pending to approved/rejected
   * Sets moderated_at timestamp automatically via database trigger
   * @param id - Rating ID
   * @param moderateRatingDto - Moderation decision
   * @returns Updated rating
   * @throws NotFoundException if rating doesn't exist
   * @throws BadRequestException if rating is not pending
   */
  async moderate(id: string, moderateRatingDto: ModerateRatingDto, adminId?: string): Promise<Rating> {
    try {
      // Check if rating exists and is pending
      const existing = await this.findOne(id);

      if (existing.status !== 'pending') {
        throw new BadRequestException('Only pending ratings can be moderated');
      }

      const supabase = this.supabaseService.getClient();

      const { data, error } = await supabase
        .from('ratings')
        .update({ status: moderateRatingDto.status })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        this.logger.error(`Failed to moderate rating: ${error.message}`, error);
        throw new InternalServerErrorException('Failed to moderate rating');
      }

      // Log admin activity
      if (adminId) {
        const action = moderateRatingDto.status === 'approved' ? 'approve_rating' : 'reject_rating';
        await supabase.from('admin_activity_log').insert({
          admin_id: adminId,
          action,
          details: {
            target_type: 'rating',
            target_id: id,
            status: moderateRatingDto.status,
            reason: moderateRatingDto.reason,
            route_id: existing.route_id,
          },
        });
      }

      this.logger.log(
        `Rating ${id} moderated: ${moderateRatingDto.status}${moderateRatingDto.reason ? ` (reason: ${moderateRatingDto.reason})` : ''}`,
      );

      return data;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException ||
        error instanceof InternalServerErrorException
      ) {
        throw error;
      }
      this.logger.error(`Error moderating rating: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to moderate rating');
    }
  }

  /**
   * Gets all pending ratings for moderation (admin only)
   * Uses the pending_ratings_moderation view from migration
   * @returns Array of pending ratings with metadata
   */
  async getPendingRatings(): Promise<any[]> {
    try {
      const supabase = this.supabaseService.getClient();

      const { data, error } = await supabase
        .from('pending_ratings_moderation')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) {
        this.logger.error(`Failed to fetch pending ratings: ${error.message}`, error);
        throw new InternalServerErrorException('Failed to fetch pending ratings');
      }

      return data || [];
    } catch (error) {
      if (error instanceof InternalServerErrorException) {
        throw error;
      }
      this.logger.error(`Error fetching pending ratings: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to fetch pending ratings');
    }
  }

  /**
   * Gets all ratings with optional status filter (admin only)
   * @param status - Optional status filter (pending, approved, rejected)
   * @returns Array of ratings matching the filter
   */
  async getAllRatings(status?: string): Promise<RatingResponseDto[]> {
    try {
      const supabase = this.supabaseService.getAdminClient();

      // Build query with optional status filter
      let query = supabase
        .from('ratings')
        .select('*')
        .order('created_at', { ascending: false });

      // Apply status filter if provided
      if (status) {
        query = query.eq('status', status);
      }

      const { data: ratingsData, error: ratingsError } = await query;

      if (ratingsError) {
        this.logger.error(`Failed to fetch ratings: ${ratingsError.message}`, ratingsError);
        throw new InternalServerErrorException('Failed to fetch ratings');
      }

      const ratings = ratingsData || [];

      if (ratings.length === 0) {
        return [];
      }

      // Fetch user data for all ratings in a single query
      const userIds = [...new Set(ratings.map(r => r.user_id))];
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, name, email, avatar_url')
        .in('id', userIds);

      if (usersError) {
        this.logger.warn(`Failed to fetch user details: ${usersError.message}`, usersError);
      }

      // Create a map of users by ID for quick lookup
      const usersById = (usersData || []).reduce((acc, user) => {
        acc[user.id] = user;
        return acc;
      }, {});

      // Fetch route data for all ratings in a single query
      const routeIds = [...new Set(ratings.map(r => r.route_id))];
      const { data: routesData, error: routesError } = await supabase
        .from('routes')
        .select('id, route_number, name')
        .in('id', routeIds);

      if (routesError) {
        this.logger.warn(`Failed to fetch routes: ${routesError.message}`, routesError);
      }

      // Create a map of routes by ID for quick lookup
      const routesById = (routesData || []).reduce((acc, route) => {
        acc[route.id] = route;
        return acc;
      }, {});

      // Fetch photos for all ratings in a single query
      const ratingIds = ratings.map(r => r.id);
      const { data: photosData, error: photosError } = await supabase
        .from('rating_photos')
        .select('*')
        .in('rating_id', ratingIds);

      if (photosError) {
        this.logger.warn(`Failed to fetch rating photos: ${photosError.message}`, photosError);
      }

      // Group photos by rating_id
      const photosByRating = (photosData || []).reduce((acc, photo) => {
        if (!acc[photo.rating_id]) {
          acc[photo.rating_id] = [];
        }
        acc[photo.rating_id].push(photo);
        return acc;
      }, {});

      // Combine data
      const result = ratings.map(rating => ({
        ...rating,
        user: usersById[rating.user_id] || null,
        route: routesById[rating.route_id] || null,
        photos: photosByRating[rating.id] || [],
      }));

      this.logger.debug(`Found ${ratings.length} ratings${status ? ` with status ${status}` : ''}`);
      return result as RatingResponseDto[];
    } catch (error) {
      if (error instanceof InternalServerErrorException) {
        throw error;
      }
      this.logger.error(`Error fetching all ratings: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to fetch ratings');
    }
  }
}
