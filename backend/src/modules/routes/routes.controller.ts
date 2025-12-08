import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { RoutesService } from './routes.service';
import {
  CreateRouteDto,
  UpdateRouteDto,
  RouteFilterDto,
  RouteResponseDto,
  RouteListResponseDto,
  AssignStopsDto,
  AddStopToRouteDto,
} from './dto';
import { RolesGuard } from '@common/guards/roles.guard';
import { Public } from '@common/decorators/public.decorator';
import { Roles } from '@common/decorators/roles.decorator';

@ApiTags('Routes')
@Controller('routes')
export class RoutesController {
  constructor(private readonly routesService: RoutesService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles('admin', 'provider')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create a new route',
    description: 'Creates a new route. Only accessible by admin and provider roles.',
  })
  @ApiResponse({
    status: 201,
    description: 'Route created successfully',
    type: RouteResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation error or duplicate route number',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  async create(@Request() req, @Body() createRouteDto: CreateRouteDto) {
    return this.routesService.create(req.user.id, createRouteDto);
  }

  @Get()
  @Public()
  @ApiOperation({
    summary: 'Get all routes',
    description: 'Retrieves a paginated list of active routes with optional filters.',
  })
  @ApiResponse({
    status: 200,
    description: 'Routes retrieved successfully',
    type: RouteListResponseDto,
  })
  @ApiQuery({ name: 'search', required: false, description: 'Search in route number or name' })
  @ApiQuery({ name: 'provider_id', required: false, description: 'Filter by provider ID' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number', example: 1 })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page', example: 10 })
  async findAll(@Query() filters: RouteFilterDto) {
    return this.routesService.findAll(filters);
  }

  @Get(':id')
  @Public()
  @ApiOperation({
    summary: 'Get route by ID',
    description: 'Retrieves detailed information about a specific route including all stops.',
  })
  @ApiParam({ name: 'id', description: 'Route UUID' })
  @ApiResponse({
    status: 200,
    description: 'Route retrieved successfully',
    type: RouteResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - invalid UUID format',
  })
  @ApiResponse({
    status: 404,
    description: 'Route not found',
  })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.routesService.findOne(id);
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles('admin', 'provider')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update a route',
    description:
      'Updates route information. Providers can only update their own routes, admins can update any route.',
  })
  @ApiParam({ name: 'id', description: 'Route UUID' })
  @ApiResponse({
    status: 200,
    description: 'Route updated successfully',
    type: RouteResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation error',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - user does not own this route',
  })
  @ApiResponse({
    status: 404,
    description: 'Route not found',
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req,
    @Body() updateRouteDto: UpdateRouteDto,
  ) {
    return this.routesService.update(id, req.user.id, updateRouteDto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('admin', 'provider')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Delete a route (soft delete)',
    description:
      'Soft deletes a route by setting is_active to false. Providers can only delete their own routes.',
  })
  @ApiParam({ name: 'id', description: 'Route UUID' })
  @ApiResponse({
    status: 200,
    description: 'Route deleted successfully',
    type: RouteResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - user does not own this route',
  })
  @ApiResponse({
    status: 404,
    description: 'Route not found',
  })
  async remove(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    return this.routesService.remove(id, req.user.id);
  }

  // ==================== Route-Stop Assignment Endpoints ====================

  @Put(':id/stops')
  @UseGuards(RolesGuard)
  @Roles('admin', 'provider')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Assign stops to route with order and arrival times',
    description:
      'Bulk assignment of stops to a route. Replaces all existing stop assignments. This is a transactional operation.',
  })
  @ApiParam({ name: 'id', description: 'Route UUID' })
  @ApiResponse({
    status: 200,
    description: 'Stops successfully assigned to route',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Stops successfully assigned to route' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - duplicate orders or invalid stop IDs',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - user does not own this route',
  })
  @ApiResponse({
    status: 404,
    description: 'Route not found',
  })
  async assignStops(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req,
    @Body() assignStopsDto: AssignStopsDto,
  ) {
    await this.routesService.assignStops(id, req.user.id, assignStopsDto);
    return { message: 'Stops successfully assigned to route' };
  }

  @Get(':id/stops')
  @Public()
  @ApiOperation({
    summary: 'Get all stops for a route in order',
    description: 'Retrieves all stops assigned to a route, ordered by their sequence number.',
  })
  @ApiParam({ name: 'id', description: 'Route UUID' })
  @ApiResponse({
    status: 200,
    description: 'Route stops retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          order: { type: 'number', example: 1 },
          arrival_time: { type: 'string', example: '10:30', nullable: true },
          arrival_offset: { type: 'string', example: '00:05:30', nullable: true },
          stop: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              name: { type: 'string', example: 'Main Station' },
              type: { type: 'string', example: 'bus' },
              latitude: { type: 'number', example: 47.4979 },
              longitude: { type: 'number', example: 19.0402 },
              is_accessible: { type: 'boolean', example: true },
            },
          },
        },
      },
    },
  })
  async getRouteStops(@Param('id', ParseUUIDPipe) id: string) {
    return this.routesService.getRouteStops(id);
  }

  @Post(':id/stops/:stopId')
  @UseGuards(RolesGuard)
  @Roles('admin', 'provider')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Add a single stop to route',
    description:
      'Adds a single stop to a route with specified order and optional arrival time. Order must be unique.',
  })
  @ApiParam({ name: 'id', description: 'Route UUID' })
  @ApiParam({ name: 'stopId', description: 'Stop UUID' })
  @ApiResponse({
    status: 201,
    description: 'Stop successfully added to route',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', format: 'uuid' },
        route_id: { type: 'string', format: 'uuid' },
        stop_id: { type: 'string', format: 'uuid' },
        stop_order: { type: 'number', example: 1 },
        arrival_time: { type: 'string', example: '10:30', nullable: true },
        arrival_offset: { type: 'string', example: '00:05:30', nullable: true },
        created_at: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - order already exists or stop not found',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - user does not own this route',
  })
  async addStopToRoute(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('stopId', ParseUUIDPipe) stopId: string,
    @Request() req,
    @Body() addStopDto: AddStopToRouteDto,
  ) {
    return this.routesService.addStopToRoute(
      id,
      req.user.id,
      stopId,
      addStopDto.order,
      addStopDto.arrival_time,
      addStopDto.arrival_offset,
    );
  }

  @Delete(':id/stops/:stopId')
  @UseGuards(RolesGuard)
  @Roles('admin', 'provider')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Remove stop from route',
    description: 'Removes a stop assignment from a route.',
  })
  @ApiParam({ name: 'id', description: 'Route UUID' })
  @ApiParam({ name: 'stopId', description: 'Stop UUID' })
  @ApiResponse({
    status: 200,
    description: 'Stop removed from route',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Stop removed from route' },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - user does not own this route',
  })
  async removeStopFromRoute(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('stopId', ParseUUIDPipe) stopId: string,
    @Request() req,
  ) {
    await this.routesService.removeStopFromRoute(id, req.user.id, stopId);
    return { message: 'Stop removed from route' };
  }
}
