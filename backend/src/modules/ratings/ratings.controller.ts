import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Req,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AdminGuard } from '@common/guards/admin.guard';
import { RatingsService } from './ratings.service';
import { CreateRatingDto } from './dto/create-rating.dto';
import { UpdateRatingDto } from './dto/update-rating.dto';
import { ModerateRatingDto } from './dto/moderate-rating.dto';
import { RatingResponseDto, RouteRatingStatsDto } from './dto/rating-response.dto';
import { Rating } from './entities/rating.entity';
import { RatingPhoto } from './entities/rating-photo.entity';

@ApiTags('ratings')
@Controller('ratings')
@ApiBearerAuth()
export class RatingsController {
  constructor(private readonly ratingsService: RatingsService) {}

  /**
   * Create a new rating for a route
   * Rate limited to 5 ratings per hour per user
   */
  @Post()
  @Throttle({ default: { ttl: 3600000, limit: 5 } }) // 5 ratings per hour
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new rating',
    description: 'Create a rating for a route. Users can only rate each route once. New ratings are pending moderation.',
  })
  @ApiResponse({
    status: 201,
    description: 'Rating created successfully',
    type: Rating,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid rating values',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - You have already rated this route',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many requests - Rate limit exceeded (max 5 per hour)',
  })
  async create(@Req() req: any, @Body() createRatingDto: CreateRatingDto): Promise<Rating> {
    const userId = req.user.id;
    return this.ratingsService.create(userId, createRatingDto);
  }
  /**
   * ADMIN: Get all pending ratings for moderation
   */
  @Get('admin/pending')
  @UseGuards(AdminGuard)
  @ApiOperation({
    summary: 'Get pending ratings (Admin only)',
    description: 'Get all pending ratings for moderation. Admin only.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of pending ratings',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin only',
  })
  async getPendingRatings(): Promise<any[]> {
    return this.ratingsService.getPendingRatings();
  }
  /**
   * Get all approved ratings for a specific route
   */
  @Get('route/:routeId')
  @ApiOperation({
    summary: 'Get all approved ratings for a route',
    description: 'Retrieves all approved ratings for a specific route with user info and photos',
  })
  @ApiParam({
    name: 'routeId',
    description: 'Route UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'List of approved ratings',
    type: [RatingResponseDto],
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async getRouteRatings(@Param('routeId') routeId: string): Promise<RatingResponseDto[]> {
    return this.ratingsService.findByRoute(routeId);
  }

  /**
   * Get my rating for a specific route
   */
  @Get('route/:routeId/my-rating')
  @ApiOperation({ summary: 'Get my rating for a specific route' })
  @ApiParam({
    name: 'routeId',
    description: 'Route UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'User rating for the route',
    type: RatingResponseDto,
  })
  async getMyRatingForRoute(
    @Param('routeId') routeId: string,
    @Req() req: any,
  ): Promise<RatingResponseDto | null> {
    const userId = req.user.id;
    return this.ratingsService.findMyRatingForRoute(routeId, userId);
  }

  /**
   * Get rating statistics for a route
   */
  @Get('route/:routeId/stats')
  @ApiOperation({
    summary: 'Get rating statistics for a route',
    description: 'Get aggregated statistics including averages and star distribution for a route',
  })
  @ApiParam({
    name: 'routeId',
    description: 'Route UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Rating statistics',
    type: RouteRatingStatsDto,
  })
  @ApiResponse({
    status: 404,
    description: 'No ratings found for this route',
  })
  async getRouteStats(@Param('routeId') routeId: string): Promise<RouteRatingStatsDto | null> {
    return this.ratingsService.getRouteStats(routeId);
  }

  /**
   * Get all ratings created by the current user
   */
  @Get('my-ratings')
  @ApiOperation({
    summary: 'Get my ratings',
    description: 'Get all ratings created by the authenticated user (all statuses)',
  })
  @ApiResponse({
    status: 200,
    description: 'List of user ratings',
    type: [RatingResponseDto],
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async getMyRatings(@Req() req: any): Promise<RatingResponseDto[]> {
    const userId = req.user.id;
    return this.ratingsService.findMyRatings(userId);
  }
  /**
   * Get a specific rating by ID
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Get a rating by ID',
    description: 'Get detailed information about a specific rating',
  })
  @ApiParam({
    name: 'id',
    description: 'Rating UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Rating details',
    type: RatingResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 404,
    description: 'Rating not found',
  })
  async findOne(@Param('id') id: string): Promise<RatingResponseDto> {
    return this.ratingsService.findOne(id);
  }
  /**
   * ADMIN: Moderate a rating (approve/reject)
   */
  @Patch(':id/moderate')
  @UseGuards(AdminGuard)
  @ApiOperation({
    summary: 'Moderate a rating (Admin only)',
    description: 'Approve or reject a pending rating. Admin only.',
  })
  @ApiParam({
    name: 'id',
    description: 'Rating UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Rating moderated successfully',
    type: Rating,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Only pending ratings can be moderated',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin only',
  })
  @ApiResponse({
    status: 404,
    description: 'Rating not found',
  })
  async moderate(
    @Req() req: any,
    @Param('id') id: string,
    @Body() moderateRatingDto: ModerateRatingDto,
  ): Promise<Rating> {
    const adminId = req.user.id;
    return this.ratingsService.moderate(id, moderateRatingDto, adminId);
  }
  /**
   * Update own pending rating
   */
  @Patch(':id')
  @ApiOperation({
    summary: 'Update own pending rating',
    description: 'Update a rating. Only pending ratings can be updated by their owner.',
  })
  @ApiParam({
    name: 'id',
    description: 'Rating UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Rating updated successfully',
    type: Rating,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Only pending ratings can be updated',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - You can only update your own ratings',
  })
  @ApiResponse({
    status: 404,
    description: 'Rating not found',
  })
  async update(
    @Req() req: any,
    @Param('id') id: string,
    @Body() updateRatingDto: UpdateRatingDto,
  ): Promise<Rating> {
    const userId = req.user.id;
    return this.ratingsService.update(id, userId, updateRatingDto);
  }

  /**
   * Delete own pending rating
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete own pending rating',
    description: 'Delete a rating. Only pending ratings can be deleted by their owner.',
  })
  @ApiParam({
    name: 'id',
    description: 'Rating UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 204,
    description: 'Rating deleted successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Only pending ratings can be deleted',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - You can only delete your own ratings',
  })
  @ApiResponse({
    status: 404,
    description: 'Rating not found',
  })
  async delete(@Req() req: any, @Param('id') id: string): Promise<void> {
    const userId = req.user.id;
    await this.ratingsService.delete(id, userId);
  }

  /**
   * Upload photos to a rating
   */
  @Post(':id/photos')
  @Throttle({ default: { ttl: 3600000, limit: 10 } }) // 10 photo uploads per hour
  @ApiOperation({
    summary: 'Upload photos to rating',
    description: 'Upload photos to a pending rating. Maximum 5 photos per rating. Expects array of photo URLs from Supabase Storage.',
  })
  @ApiParam({
    name: 'id',
    description: 'Rating UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 201,
    description: 'Photos uploaded successfully',
    type: [RatingPhoto],
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Too many photos or rating not pending',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - You can only upload photos to your own ratings',
  })
  @ApiResponse({
    status: 404,
    description: 'Rating not found',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many requests - Rate limit exceeded',
  })
  async uploadPhotos(
    @Req() req: any,
    @Param('id') id: string,
    @Body('photoUrls') photoUrls: string[],
  ): Promise<RatingPhoto[]> {
    const userId = req.user.id;
    return this.ratingsService.uploadPhotos(id, userId, photoUrls);
  }

  /**
   * Delete a photo from a rating
   */
  @Delete(':id/photos/:photoId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete photo from rating',
    description: 'Delete a specific photo from a pending rating.',
  })
  @ApiParam({
    name: 'id',
    description: 'Rating UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiParam({
    name: 'photoId',
    description: 'Photo UUID',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @ApiResponse({
    status: 204,
    description: 'Photo deleted successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Photos can only be deleted from pending ratings',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - You can only delete photos from your own ratings',
  })
  @ApiResponse({
    status: 404,
    description: 'Rating or photo not found',
  })
  async deletePhoto(
    @Req() req: any,
    @Param('id') id: string,
    @Param('photoId') photoId: string,
  ): Promise<void> {
    const userId = req.user.id;
    await this.ratingsService.deletePhoto(id, photoId, userId);
  }

}
