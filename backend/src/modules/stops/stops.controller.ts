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
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { StopsService } from './stops.service';
import {
  CreateStopDto,
  UpdateStopDto,
  StopFilterDto,
  NearbyStopsDto,
  StopResponseDto,
  StopListResponseDto,
} from './dto';
import { RolesGuard } from '@common/guards/roles.guard';
import { Public } from '@common/decorators/public.decorator';
import { Roles } from '@common/decorators/roles.decorator';

@ApiTags('Stops')
@Controller('stops')
export class StopsController {
  constructor(private readonly stopsService: StopsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create a new stop',
    description: 'Creates a new stop. Only accessible by admin role.',
  })
  @ApiResponse({
    status: 201,
    description: 'Stop created successfully',
    type: StopResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation error or duplicate coordinates',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  async create(@Body() createStopDto: CreateStopDto) {
    return this.stopsService.create(createStopDto);
  }

  @Get()
  @Public()
  @ApiOperation({
    summary: 'Get all stops',
    description: 'Retrieves a paginated list of stops with optional filters.',
  })
  @ApiResponse({
    status: 200,
    description: 'Stops retrieved successfully',
    type: StopListResponseDto,
  })
  @ApiQuery({ name: 'search', required: false, description: 'Search in stop name' })
  @ApiQuery({ name: 'type', required: false, description: 'Filter by stop type' })
  @ApiQuery({ name: 'sw_lat', required: false, description: 'Southwest latitude (bounds filter)' })
  @ApiQuery({ name: 'sw_lng', required: false, description: 'Southwest longitude (bounds filter)' })
  @ApiQuery({ name: 'ne_lat', required: false, description: 'Northeast latitude (bounds filter)' })
  @ApiQuery({ name: 'ne_lng', required: false, description: 'Northeast longitude (bounds filter)' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number', example: 1 })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page', example: 10 })
  async findAll(@Query() filters: StopFilterDto) {
    return this.stopsService.findAll(filters);
  }

  @Get('nearby')
  @Public()
  @ApiOperation({
    summary: 'Find nearby stops',
    description: 'Finds stops within a specified radius from a center point using spatial query.',
  })
  @ApiResponse({
    status: 200,
    description: 'Nearby stops retrieved successfully',
    type: [StopResponseDto],
  })
  @ApiQuery({
    name: 'latitude',
    required: true,
    description: 'Center latitude',
    example: 47.497913,
  })
  @ApiQuery({
    name: 'longitude',
    required: true,
    description: 'Center longitude',
    example: 19.040236,
  })
  @ApiQuery({
    name: 'radius',
    required: false,
    description: 'Search radius in meters',
    example: 500,
  })
  async findNearby(@Query() nearbyDto: NearbyStopsDto) {
    return this.stopsService.findNearby(nearbyDto);
  }

  @Get(':id')
  @Public()
  @ApiOperation({
    summary: 'Get stop by ID',
    description: 'Retrieves detailed information about a specific stop including all routes.',
  })
  @ApiParam({ name: 'id', description: 'Stop UUID' })
  @ApiResponse({
    status: 200,
    description: 'Stop retrieved successfully',
    type: StopResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Stop not found',
  })
  async findOne(@Param('id') id: string) {
    return this.stopsService.findOne(id);
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update a stop',
    description: 'Updates stop information. Only accessible by admin role.',
  })
  @ApiParam({ name: 'id', description: 'Stop UUID' })
  @ApiResponse({
    status: 200,
    description: 'Stop updated successfully',
    type: StopResponseDto,
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
    description: 'Forbidden - insufficient permissions',
  })
  @ApiResponse({
    status: 404,
    description: 'Stop not found',
  })
  async update(@Param('id') id: string, @Body() updateStopDto: UpdateStopDto) {
    return this.stopsService.update(id, updateStopDto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete a stop',
    description:
      'Deletes a stop. Only possible if stop is not used in any routes. Only accessible by admin role.',
  })
  @ApiParam({ name: 'id', description: 'Stop UUID' })
  @ApiResponse({
    status: 204,
    description: 'Stop deleted successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - stop is used in routes',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  @ApiResponse({
    status: 404,
    description: 'Stop not found',
  })
  async remove(@Param('id') id: string) {
    await this.stopsService.remove(id);
  }
}
