import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { FavoritesService } from './favorites.service';
import { CreateFavoriteDto } from './dto/create-favorite.dto';
import { UpdateFavoriteDto } from './dto/update-favorite.dto';
import { Favorite } from './entities/favorite.entity';

@ApiTags('favorites')
@Controller('favorites')
@ApiBearerAuth()
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a new favorite route',
    description: 'Save a route as favorite for quick access. Maximum 20 favorites per user.',
  })
  @ApiResponse({
    status: 201,
    description: 'Favorite route created successfully',
    type: Favorite,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid data or 20 favorites limit reached',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async create(
    @Req() req: any,
    @Body() createFavoriteDto: CreateFavoriteDto,
  ): Promise<Favorite> {
    const userId = req.user.id;
    return this.favoritesService.create(userId, createFavoriteDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all favorite routes',
    description: 'Retrieve all saved favorite routes for the authenticated user',
  })
  @ApiResponse({
    status: 200,
    description: 'List of favorite routes',
    type: [Favorite],
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async findAll(@Req() req: any): Promise<Favorite[]> {
    const userId = req.user.id;
    return this.favoritesService.findAll(userId);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get a favorite route by ID',
    description: 'Retrieve details of a specific favorite route',
  })
  @ApiParam({
    name: 'id',
    description: 'Favorite route UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Favorite route details',
    type: Favorite,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 404,
    description: 'Favorite route not found',
  })
  async findOne(@Req() req: any, @Param('id') id: string): Promise<Favorite> {
    const userId = req.user.id;
    return this.favoritesService.findOne(id, userId);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update a favorite route name',
    description: 'Update the friendly name of an existing favorite route',
  })
  @ApiParam({
    name: 'id',
    description: 'Favorite route UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Favorite route updated successfully',
    type: Favorite,
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
    description: 'Favorite route not found',
  })
  async update(
    @Req() req: any,
    @Param('id') id: string,
    @Body() updateFavoriteDto: UpdateFavoriteDto,
  ): Promise<Favorite> {
    const userId = req.user.id;
    return this.favoritesService.update(id, userId, updateFavoriteDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete a favorite route',
    description: 'Remove a favorite route from the saved list',
  })
  @ApiParam({
    name: 'id',
    description: 'Favorite route UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 204,
    description: 'Favorite route deleted successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 404,
    description: 'Favorite route not found',
  })
  async remove(@Req() req: any, @Param('id') id: string): Promise<void> {
    const userId = req.user.id;
    await this.favoritesService.remove(id, userId);
  }
}
