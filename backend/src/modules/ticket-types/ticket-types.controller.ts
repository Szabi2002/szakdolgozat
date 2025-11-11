import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
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
} from '@nestjs/swagger';
import { TicketTypesService } from './ticket-types.service';
import { CreateTicketTypeDto } from './dto/create-ticket-type.dto';
import { UpdateTicketTypeDto } from './dto/update-ticket-type.dto';
import { AuthGuard } from '@common/guards/auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { Public } from '@common/decorators/public.decorator';

@ApiTags('ticket-types')
@Controller('ticket-types')
export class TicketTypesController {
  constructor(private readonly ticketTypesService: TicketTypesService) {}

  @Post()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new ticket type (Admin only)' })
  @ApiResponse({
    status: 201,
    description: 'Ticket type created successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  async create(@Body() createTicketTypeDto: CreateTicketTypeDto) {
    return this.ticketTypesService.create(createTicketTypeDto);
  }

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get all active ticket types (Public)' })
  @ApiResponse({
    status: 200,
    description: 'List of active ticket types',
  })
  async findAll() {
    return this.ticketTypesService.findAll();
  }

  @Get('all')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all ticket types including inactive (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'List of all ticket types',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  async findAllIncludingInactive() {
    return this.ticketTypesService.findAllIncludingInactive();
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get a ticket type by ID (Public)' })
  @ApiParam({
    name: 'id',
    description: 'Ticket type UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Ticket type details',
  })
  @ApiResponse({
    status: 404,
    description: 'Ticket type not found',
  })
  async findOne(@Param('id') id: string) {
    return this.ticketTypesService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a ticket type (Admin only)' })
  @ApiParam({
    name: 'id',
    description: 'Ticket type UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Ticket type updated successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  @ApiResponse({
    status: 404,
    description: 'Ticket type not found',
  })
  async update(@Param('id') id: string, @Body() updateTicketTypeDto: UpdateTicketTypeDto) {
    return this.ticketTypesService.update(id, updateTicketTypeDto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft delete a ticket type (Admin only)' })
  @ApiParam({
    name: 'id',
    description: 'Ticket type UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 204,
    description: 'Ticket type deleted successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  @ApiResponse({
    status: 404,
    description: 'Ticket type not found',
  })
  async remove(@Param('id') id: string) {
    await this.ticketTypesService.remove(id);
  }
}
