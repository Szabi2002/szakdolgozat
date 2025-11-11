import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { PlannerService } from './planner.service';
import { PlanTripDto } from './dto/plan-trip.dto';
import { TripSearchResponse, TripResultDto } from './dto/trip-result.dto';
import { Public } from '@common/decorators/public.decorator';

@ApiTags('planner')
@Controller('planner')
export class PlannerController {
  constructor(private readonly plannerService: PlannerService) {}

  @Post('search')
  @Public()
  @Throttle({ default: { ttl: 3600000, limit: 60 } }) // 60 requests per hour
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Search for optimal routes between two stops',
    description: `
      Finds optimal multimodal routes (transit + walking) between two stops.
      Returns multiple alternative routes with detailed step-by-step navigation.

      - Supports walking integration (up to 800m segments)
      - Returns 1-5 alternative routes based on max_alternatives parameter
      - Optimizes based on preference (fastest, least transfers, least walking)
      - Includes detailed timing and distance information
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'Routes found successfully',
    type: TripSearchResponse,
    example: {
      alternatives: [
        {
          route_id: 'route-1',
          total_time: 28,
          transfers: 1,
          walking_distance: 450,
          total_stops: 12,
          steps: [
            {
              type: 'transit',
              start_stop: {
                id: '123e4567-e89b-12d3-a456-426614174000',
                name: 'Astoria M',
                latitude: 47.49,
                longitude: 19.05,
                type: 'metro',
                is_accessible: true,
                description: null,
              },
              end_stop: {
                id: '123e4567-e89b-12d3-a456-426614174001',
                name: 'Deák Ferenc tér M',
                latitude: 47.5,
                longitude: 19.05,
                type: 'metro',
                is_accessible: true,
                description: null,
              },
              route_id: '123e4567-e89b-12d3-a456-426614174002',
              route_number: 'M2',
              route_name: 'Metro Line 2',
              vehicle_type: 'metro',
              duration: 8,
              stop_count: 3,
              stops: [],
            },
            {
              type: 'walking',
              start_stop: {
                id: '123e4567-e89b-12d3-a456-426614174001',
                name: 'Deák Ferenc tér M',
                latitude: 47.5,
                longitude: 19.05,
                type: 'metro',
                is_accessible: true,
                description: null,
              },
              end_stop: {
                id: '123e4567-e89b-12d3-a456-426614174003',
                name: 'Bajcsy-Zsilinszky út',
                latitude: 47.51,
                longitude: 19.06,
                type: 'bus',
                is_accessible: true,
                description: null,
              },
              distance: 450,
              duration: 6,
              stop_count: 2,
              stops: [],
            },
          ],
          recommended: true,
          recommendation_reason: 'Fastest route',
        },
      ],
      search_timestamp: '2025-11-10T14:30:00Z',
      computation_time_ms: 342,
    },
  })
  @ApiBadRequestResponse({
    description: 'Invalid request parameters',
    example: {
      statusCode: 400,
      message: ['max_alternatives must not be greater than 5'],
      error: 'Bad Request',
    },
  })
  @ApiNotFoundResponse({
    description: 'One or both stops not found, or no route exists',
    example: {
      statusCode: 404,
      message: 'No route found between the specified stops',
      error: 'Not Found',
    },
  })
  @ApiResponse({
    status: 429,
    description: 'Too many route planning requests. Please try again later.',
  })
  async searchRoute(@Body() planTripDto: PlanTripDto): Promise<TripSearchResponse> {
    const startTime = Date.now();

    const alternatives = await this.plannerService.findRoutes(planTripDto);

    return {
      alternatives,
      search_timestamp: new Date().toISOString(),
      computation_time_ms: Date.now() - startTime,
    };
  }

  /**
   * Legacy endpoint for backward compatibility
   * @deprecated Use /search instead
   */
  @Post('search-legacy')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Find route between two stops (Legacy)',
    description:
      'Uses BFS algorithm to find the shortest path between two stops considering active routes. DEPRECATED: Use /search instead.',
    deprecated: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Route found successfully',
    type: TripResultDto,
  })
  @ApiResponse({
    status: 404,
    description: 'One or both stops not found, or no route exists between them',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid request parameters',
  })
  async searchRouteLegacy(
    @Body() body: { from_stop_id: string; to_stop_id: string },
  ): Promise<TripResultDto> {
    return this.plannerService.findRoute(body.from_stop_id, body.to_stop_id);
  }
}
