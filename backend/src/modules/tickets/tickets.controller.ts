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
} from '@nestjs/common';
import { Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { TicketsService } from './tickets.service';
import { PurchaseTicketDto } from './dto/purchase-ticket.dto';

@ApiTags('tickets')
@Controller('tickets')
@ApiBearerAuth()
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Post('purchase')
  @Throttle({ default: { ttl: 3600000, limit: 10 } }) // 10 requests per hour
  @ApiOperation({ summary: 'Purchase a ticket' })
  @ApiResponse({
    status: 201,
    description: 'Ticket purchased successfully',
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
  async purchase(@Req() req: any, @Body() purchaseTicketDto: PurchaseTicketDto) {
    const userId = req.user.id;
    return this.ticketsService.purchase(userId, purchaseTicketDto);
  }

  @Get('my-tickets')
  @ApiOperation({ summary: 'Get all tickets for the authenticated user' })
  @ApiResponse({
    status: 200,
    description: 'List of user tickets',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async getMyTickets(@Req() req: any) {
    const userId = req.user.id;
    return this.ticketsService.findByUserId(userId);
  }

  @Get('my-tickets/active')
  @ApiOperation({ summary: 'Get active tickets for the authenticated user' })
  @ApiResponse({
    status: 200,
    description: 'List of active tickets',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async getMyActiveTickets(@Req() req: any) {
    const userId = req.user.id;
    return this.ticketsService.findActiveByUserId(userId);
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
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 404,
    description: 'Ticket not found',
  })
  async findOne(@Req() req: any, @Param('id') id: string) {
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

  @Post(':id/send-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resend ticket email' })
  @ApiParam({
    name: 'id',
    description: 'Ticket UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Email sent successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 404,
    description: 'Ticket not found',
  })
  async sendEmail(@Req() req: any, @Param('id') id: string) {
    const userId = req.user.id;
    return this.ticketsService.sendEmail(id, userId);
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
    description: 'Ticket cancelled successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Only active tickets can be cancelled',
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
