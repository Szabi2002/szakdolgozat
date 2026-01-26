import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Req,
  HttpCode,
  HttpStatus,
  Res,
  Query,
} from '@nestjs/common';
import { Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { TicketsService } from './tickets.service';
import { PurchaseTicketDto } from './dto/purchase-ticket.dto';
import { HistoryFiltersDto } from './dto/history-filters.dto';
import { PurchaseHistoryResponse } from './entities/purchase-history.entity';
import { Ticket } from './entities/ticket.entity';

@ApiTags('tickets')
@Controller('tickets')
@ApiBearerAuth()
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) { }

  @Post('purchase')
  @Throttle({ default: { ttl: 3600000, limit: 10 } }) // 10 requests per hour
  @ApiOperation({ summary: 'Purchase a ticket' })
  @ApiResponse({
    status: 201,
    description: 'Ticket purchased successfully',
    type: Ticket,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid ticket type or payment failed',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many ticket purchase attempts. Please try again later.',
  })
  async purchase(@Req() req: any, @Body() purchaseTicketDto: PurchaseTicketDto): Promise<Ticket> {
    const userId = req.user.id;
    return this.ticketsService.purchase(userId, purchaseTicketDto);
  }

  @Get('my-tickets')
  @ApiOperation({ summary: 'Get all tickets for the authenticated user' })
  @ApiResponse({
    status: 200,
    description: 'List of user tickets',
    type: [Ticket],
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async getMyTickets(@Req() req: any): Promise<Ticket[]> {
    const userId = req.user.id;
    return this.ticketsService.findByUserId(userId);
  }

  @Get('my-tickets/active')
  @ApiOperation({ summary: 'Get active tickets for the authenticated user' })
  @ApiResponse({
    status: 200,
    description: 'List of active tickets',
    type: [Ticket],
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async getMyActiveTickets(@Req() req: any): Promise<Ticket[]> {
    const userId = req.user.id;
    return this.ticketsService.findActiveByUserId(userId);
  }

  @Get('history')
  @ApiOperation({
    summary: 'Get purchase history',
    description: 'Retrieve paginated purchase history with filters for status, ticket type, and date range',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'status', required: false, enum: ['active', 'expired'] })
  @ApiQuery({ name: 'ticket_type_id', required: false, type: String })
  @ApiQuery({ name: 'from_date', required: false, type: String, example: '2025-01-01T00:00:00.000Z' })
  @ApiQuery({ name: 'to_date', required: false, type: String, example: '2025-01-31T23:59:59.999Z' })
  @ApiResponse({
    status: 200,
    description: 'Purchase history retrieved successfully',
    type: PurchaseHistoryResponse,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async getHistory(
    @Req() req: any,
    @Query() filters: HistoryFiltersDto,
  ): Promise<PurchaseHistoryResponse> {
    const userId = req.user.id;
    return this.ticketsService.getHistory(userId, filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a ticket by ID' })
  @ApiParam({
    name: 'id',
    description: 'Ticket UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Ticket details',
    type: Ticket,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 404,
    description: 'Ticket not found',
  })
  async findOne(@Req() req: any, @Param('id') id: string): Promise<Ticket> {
    const userId = req.user.id;
    return this.ticketsService.findOne(id, userId);
  }

  @Get(':id/qr-code')
  @ApiOperation({ summary: 'Get QR code image for a ticket' })
  @ApiParam({
    name: 'id',
    description: 'Ticket UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'QR code image (PNG)',
    content: {
      'image/png': {},
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 404,
    description: 'Ticket not found',
  })
  async getQRCode(@Req() req: any, @Param('id') id: string, @Res() res: Response) {
    const userId = req.user.id;
    const qrCodeBuffer = await this.ticketsService.getQRCodeBuffer(id, userId);

    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Disposition', `attachment; filename="ticket-${id}.png"`);
    res.send(qrCodeBuffer);
  }


  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Cancel a ticket' })
  @ApiParam({
    name: 'id',
    description: 'Ticket UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 204,
    description: 'Ticket refunded successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Only active tickets can be refunded',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 404,
    description: 'Ticket not found',
  })
  async cancel(@Req() req: any, @Param('id') id: string) {
    const userId = req.user.id;
    await this.ticketsService.cancel(id, userId);
  }

}
