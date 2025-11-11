import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { SupabaseService } from '@common/supabase/supabase.service';
import { QrCodeService } from '@common/services/qr-code.service';
import { EmailService } from '@common/services/email.service';
import { TransactionsService } from '@modules/transactions/transactions.service';
import { TicketTypesService } from '@modules/ticket-types/ticket-types.service';
import { UsersService } from '@modules/users/users.service';
import { PurchaseTicketDto } from './dto/purchase-ticket.dto';

export interface Ticket {
  id: string;
  user_id: string;
  ticket_type_id: string;
  route_id: string | null;
  from_stop_id: string | null;
  to_stop_id: string | null;
  qr_code: string;
  purchase_date: string;
  valid_from: string;
  valid_until: string | null;
  status: 'active' | 'expired' | 'used' | 'cancelled';
  price: number;
  transaction_id: string | null;
  created_at: string;
  updated_at: string;
}

@Injectable()
export class TicketsService {
  private readonly logger = new Logger(TicketsService.name);

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly qrCodeService: QrCodeService,
    private readonly emailService: EmailService,
    private readonly transactionsService: TransactionsService,
    private readonly ticketTypesService: TicketTypesService,
    private readonly usersService: UsersService,
  ) {}

  /**
   * Purchases a ticket for a user
   * @param userId - User ID making the purchase
   * @param purchaseTicketDto - Purchase details
   * @returns Created ticket with QR code
   */
  async purchase(userId: string, purchaseTicketDto: PurchaseTicketDto): Promise<Ticket> {
    try {
      // 1. Fetch ticket type to get price and validity
      const ticketType = await this.ticketTypesService.findOne(purchaseTicketDto.ticketTypeId);

      if (!ticketType.is_active) {
        throw new BadRequestException('This ticket type is not available for purchase');
      }

      // 2. Calculate validity dates
      const validFrom = purchaseTicketDto.validFrom
        ? new Date(purchaseTicketDto.validFrom)
        : new Date();

      let validUntil: Date | null = null;
      if (ticketType.validity_hours) {
        validUntil = new Date(validFrom);
        validUntil.setHours(validUntil.getHours() + ticketType.validity_hours);
      }

      // 3. Simulate payment processing
      const paymentResult = await this.transactionsService.simulatePayment(ticketType.price);

      if (!paymentResult.success) {
        throw new BadRequestException('Payment failed');
      }

      // 4. Create transaction record
      const transaction = await this.transactionsService.create({
        userId,
        amount: ticketType.price,
        paymentMethod: 'simulation',
      });

      // 5. Generate temporary QR code data (will be updated with ticket ID)
      const tempQrData = this.qrCodeService.createQRCodeData(
        'temp-id',
        userId,
        ticketType.type,
        validUntil?.toISOString() || '',
      );

      const qrCodeDataUrl = await this.qrCodeService.generateQRCode(tempQrData);

      // 6. Create ticket in database
      const supabase = this.supabaseService.getClient();

      const ticketData = {
        user_id: userId,
        ticket_type_id: purchaseTicketDto.ticketTypeId,
        route_id: purchaseTicketDto.routeId || null,
        from_stop_id: purchaseTicketDto.fromStopId || null,
        to_stop_id: purchaseTicketDto.toStopId || null,
        qr_code: qrCodeDataUrl,
        purchase_date: new Date().toISOString(),
        valid_from: validFrom.toISOString(),
        valid_until: validUntil?.toISOString() || null,
        status: 'active' as const,
        price: ticketType.price,
        transaction_id: transaction.id,
      };

      const { data: ticket, error } = await supabase
        .from('tickets')
        .insert(ticketData)
        .select()
        .single();

      if (error) {
        this.logger.error(`Failed to create ticket: ${error.message}`, error);
        throw new InternalServerErrorException('Failed to create ticket');
      }

      // 7. Update QR code with actual ticket ID
      const finalQrData = this.qrCodeService.createQRCodeData(
        ticket.id,
        userId,
        ticketType.type,
        validUntil?.toISOString() || '',
      );

      const finalQrCodeDataUrl = await this.qrCodeService.generateQRCode(finalQrData);

      // 8. Update ticket with final QR code
      const { data: updatedTicket, error: updateError } = await supabase
        .from('tickets')
        .update({ qr_code: finalQrCodeDataUrl })
        .eq('id', ticket.id)
        .select()
        .single();

      if (updateError) {
        this.logger.error(`Failed to update QR code: ${updateError.message}`, updateError);
        // Don't throw here, ticket is already created
      }

      // 9. Update transaction with ticket ID
      await this.transactionsService.updateWithTicketId(transaction.id, ticket.id);

      this.logger.log(`Ticket purchased successfully: ${ticket.id} for user ${userId}`);

      return updatedTicket || ticket;
    } catch (error) {
      this.logger.error(`Error purchasing ticket: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Gets all tickets for a specific user
   * @param userId - User ID
   * @returns Array of user's tickets
   */
  async findByUserId(userId: string): Promise<Ticket[]> {
    try {
      const supabase = this.supabaseService.getClient();

      const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .eq('user_id', userId)
        .order('purchase_date', { ascending: false });

      if (error) {
        this.logger.error(`Failed to fetch tickets: ${error.message}`, error);
        throw new InternalServerErrorException('Failed to fetch tickets');
      }

      return data || [];
    } catch (error) {
      this.logger.error(`Error fetching tickets: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Gets active tickets for a user
   * @param userId - User ID
   * @returns Array of active tickets
   */
  async findActiveByUserId(userId: string): Promise<Ticket[]> {
    try {
      const supabase = this.supabaseService.getClient();

      const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('valid_from', { ascending: true });

      if (error) {
        this.logger.error(`Failed to fetch active tickets: ${error.message}`, error);
        throw new InternalServerErrorException('Failed to fetch active tickets');
      }

      return data || [];
    } catch (error) {
      this.logger.error(`Error fetching active tickets: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Gets a single ticket by ID
   * @param id - Ticket ID
   * @param userId - User ID (for authorization)
   * @returns Ticket or throws NotFoundException
   */
  async findOne(id: string, userId: string): Promise<Ticket> {
    try {
      const supabase = this.supabaseService.getClient();

      const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .eq('id', id)
        .eq('user_id', userId)
        .single();

      if (error || !data) {
        this.logger.warn(`Ticket not found: ${id} for user ${userId}`);
        throw new NotFoundException(`Ticket with ID ${id} not found`);
      }

      return data;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Error fetching ticket: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to fetch ticket');
    }
  }

  /**
   * Gets QR code for a ticket as image buffer
   * @param id - Ticket ID
   * @param userId - User ID (for authorization)
   * @returns QR code buffer
   */
  async getQRCodeBuffer(id: string, userId: string): Promise<Buffer> {
    try {
      const ticket = await this.findOne(id, userId);

      // Extract QR data from stored data URL
      // The QR code is already stored, but we can regenerate for buffer format
      const ticketType = await this.ticketTypesService.findOne(ticket.ticket_type_id);

      const qrData = this.qrCodeService.createQRCodeData(
        ticket.id,
        ticket.user_id,
        ticketType.type,
        ticket.valid_until || '',
      );

      return await this.qrCodeService.generateQRCodeBuffer(qrData);
    } catch (error) {
      this.logger.error(`Error generating QR code buffer: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Cancels a ticket (sets status to cancelled)
   * @param id - Ticket ID
   * @param userId - User ID (for authorization)
   */
  async cancel(id: string, userId: string): Promise<void> {
    try {
      const ticket = await this.findOne(id, userId);

      if (ticket.status !== 'active') {
        throw new BadRequestException('Only active tickets can be cancelled');
      }

      const supabase = this.supabaseService.getClient();

      const { error } = await supabase
        .from('tickets')
        .update({ status: 'cancelled' })
        .eq('id', id)
        .eq('user_id', userId);

      if (error) {
        this.logger.error(`Failed to cancel ticket: ${error.message}`, error);
        throw new InternalServerErrorException('Failed to cancel ticket');
      }

      this.logger.log(`Ticket cancelled: ${id}`);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`Error cancelling ticket: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Sends ticket confirmation email with QR code
   * Uses Nodemailer for real email delivery when SMTP is configured
   * Falls back to simulation mode if SMTP is not configured
   * @param id - Ticket ID
   * @param userId - User ID (for authorization)
   * @returns Promise with success status and message
   * @throws NotFoundException if ticket or user not found
   * @throws InternalServerErrorException if email sending fails
   */
  async sendEmail(id: string, userId: string): Promise<{ success: boolean; message: string }> {
    try {
      // 1. Fetch ticket details
      const ticket = await this.findOne(id, userId);

      // 2. Fetch user details for email
      const user = await this.usersService.findById(userId);

      if (!user || !user.email) {
        throw new BadRequestException('User email not found');
      }

      // 3. Generate QR code as buffer for email attachment
      const qrCodeBuffer = await this.getQRCodeBuffer(id, userId);

      // 4. Send email using email service
      const result = await this.emailService.sendTicketEmail(ticket, user, qrCodeBuffer);

      this.logger.log(`Email sent for ticket: ${id} to user: ${userId} (${user.email})`);

      return result;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException ||
        error instanceof InternalServerErrorException
      ) {
        throw error;
      }
      this.logger.error(`Error sending email: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to send ticket email');
    }
  }

  /**
   * Updates expired tickets to 'expired' status
   * This would typically be run by a cron job
   */
  async updateExpiredTickets(): Promise<void> {
    try {
      const supabase = this.supabaseService.getClient();

      const now = new Date().toISOString();

      const { error } = await supabase
        .from('tickets')
        .update({ status: 'expired' })
        .eq('status', 'active')
        .lt('valid_until', now);

      if (error) {
        this.logger.error(`Failed to update expired tickets: ${error.message}`, error);
        throw new InternalServerErrorException('Failed to update expired tickets');
      }

      this.logger.log('Expired tickets updated');
    } catch (error) {
      this.logger.error(`Error updating expired tickets: ${error.message}`, error.stack);
      throw error;
    }
  }
}
