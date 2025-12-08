import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { SupabaseService } from '@common/supabase/supabase.service';
import { QrCodeService } from '@common/services/qr-code.service';
import { EmailService } from '@common/services/email.service';
import { TransactionsService } from '@modules/transactions/transactions.service';
import { TicketTypesService } from '@modules/ticket-types/ticket-types.service';
import { UsersService } from '@modules/users/users.service';
import { PurchaseTicketDto } from './dto/purchase-ticket.dto';
import { HistoryFiltersDto } from './dto/history-filters.dto';
import { PurchaseHistory, PurchaseHistoryResponse } from './entities/purchase-history.entity';
import { Ticket } from './entities/ticket.entity';

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
      const ticketType = await this.ticketTypesService.findOne(purchaseTicketDto.ticket_type_id);

      if (!ticketType.is_active) {
        throw new BadRequestException('This ticket type is not available for purchase');
      }

      // 2. Calculate validity dates
      const validFrom = purchaseTicketDto.valid_from
        ? new Date(purchaseTicketDto.valid_from)
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
        ticket_type_id: purchaseTicketDto.ticket_type_id,
        route_id: purchaseTicketDto.route_id || null,
        from_stop_id: purchaseTicketDto.from_stop_id || null,
        to_stop_id: purchaseTicketDto.to_stop_id || null,
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

      // 10. Send automatic email confirmation (fire and forget - don't block ticket creation)
      this.sendEmailAutomatically(updatedTicket || ticket, userId).catch((emailError) => {
        this.logger.error(
          `Failed to send automatic email for ticket ${ticket.id}: ${emailError.message}`,
          emailError.stack,
        );
      });

      return updatedTicket || ticket;
    } catch (error) {
      this.logger.error(`Error purchasing ticket: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Internal method to send automatic ticket email after purchase
   * @param ticket - Created ticket object
   * @param userId - User ID
   * @private
   */
  private async sendEmailAutomatically(ticket: Ticket, userId: string): Promise<void> {
    try {
      const user = await this.usersService.findById(userId);

      if (!user || !user.email) {
        this.logger.warn(`Cannot send automatic email: User email not found for ticket ${ticket.id}`);
        return;
      }

      // Fetch ticket type for QR code generation
      const ticketType = await this.ticketTypesService.findOne(ticket.ticket_type_id);

      // Generate QR code buffer
      const qrData = this.qrCodeService.createQRCodeData(
        ticket.id,
        ticket.user_id,
        ticketType.type,
        ticket.valid_until || '',
      );
      const qrCodeBuffer = await this.qrCodeService.generateQRCodeBuffer(qrData);

      // Send email
      await this.emailService.sendTicketEmail(ticket, user, qrCodeBuffer);

      this.logger.log(`Automatic email sent successfully for ticket ${ticket.id}`);
    } catch (error) {
      this.logger.error(`Error in sendEmailAutomatically: ${error.message}`, error.stack);
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
        .select(`
          *,
          ticket_type:ticket_types(id, name, type, price, validity_hours),
          route:routes(id, route_number, name),
          from_stop:stops!tickets_from_stop_id_fkey(id, name, latitude, longitude, type),
          to_stop:stops!tickets_to_stop_id_fkey(id, name, latitude, longitude, type)
        `)
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
        .select(`
          *,
          ticket_type:ticket_types(id, name, type, price, validity_hours),
          route:routes(id, route_number, name),
          from_stop:stops!tickets_from_stop_id_fkey(id, name, latitude, longitude, type),
          to_stop:stops!tickets_to_stop_id_fkey(id, name, latitude, longitude, type)
        `)
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

  /**
   * Get purchase history with filters and pagination
   * Uses the purchase_history view for enriched data
   * @param userId - User ID
   * @param filters - Query filters (page, limit, status, ticket_type_id, date range)
   * @returns Paginated purchase history
   */
  async getHistory(
    userId: string,
    filters: HistoryFiltersDto,
  ): Promise<PurchaseHistoryResponse> {
    try {
      const supabase = this.supabaseService.getClient();

      // Set defaults
      const page = filters.page || 1;
      const limit = filters.limit || 10;

      // Build query
      let query = supabase
        .from('purchase_history')
        .select('*', { count: 'exact' })
        .eq('user_id', userId);

      // Apply filters
      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      if (filters.ticket_type_id) {
        query = query.eq('ticket_type_id', filters.ticket_type_id);
      }

      if (filters.from_date) {
        query = query.gte('purchase_date', filters.from_date);
      }

      if (filters.to_date) {
        query = query.lte('purchase_date', filters.to_date);
      }

      // Apply pagination and ordering
      const from = (page - 1) * limit;
      const to = from + limit - 1;

      query = query.order('purchase_date', { ascending: false }).range(from, to);

      // Execute query
      const { data, error, count } = await query;

      if (error) {
        this.logger.error(`Failed to fetch purchase history: ${error.message}`, error);
        throw new InternalServerErrorException('Failed to fetch purchase history');
      }

      const total = count || 0;
      const totalPages = Math.ceil(total / limit);

      return {
        data: (data || []) as PurchaseHistory[],
        total,
        page,
        limit,
        totalPages,
      };
    } catch (error) {
      if (error instanceof InternalServerErrorException) {
        throw error;
      }
      this.logger.error(`Error fetching purchase history: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to fetch purchase history');
    }
  }

  /**
   * Resend ticket email with rate limiting (max 5 per hour)
   * Uses the check_email_resend_rate_limit and log_email_resend database functions
   * @param ticketId - Ticket ID
   * @param userId - User ID (for authorization)
   * @returns Promise with success status and message
   * @throws HttpException(429) if rate limit exceeded
   */
  async resendEmail(ticketId: string, userId: string): Promise<{ success: boolean; message: string }> {
    try {
      const supabase = this.supabaseService.getClient();

      // 1. Check rate limit using database function
      const { data: rateLimitData, error: rateLimitError } = await supabase
        .rpc('check_email_resend_rate_limit', {
          p_user_id: userId,
          p_hours: 1,
          p_max_resends: 5,
        });

      if (rateLimitError) {
        this.logger.error(`Failed to check rate limit: ${rateLimitError.message}`, rateLimitError);
        throw new InternalServerErrorException('Failed to check rate limit');
      }

      if (rateLimitData && rateLimitData.length > 0) {
        const limitInfo = rateLimitData[0];
        if (limitInfo.limit_exceeded) {
          const retryAfter = limitInfo.retry_after
            ? new Date(limitInfo.retry_after).toLocaleString('en-US', {
                timeZone: 'UTC',
                dateStyle: 'short',
                timeStyle: 'short',
              })
            : 'later';
          throw new HttpException(
            `Email resend rate limit exceeded. Max 5 per hour. Retry after ${retryAfter}`,
            HttpStatus.TOO_MANY_REQUESTS,
          );
        }
      }

      // 2. Fetch ticket and user details
      const ticket = await this.findOne(ticketId, userId);
      const user = await this.usersService.findById(userId);

      if (!user || !user.email) {
        throw new BadRequestException('User email not found');
      }

      // 3. Generate QR code as buffer for email attachment
      const qrCodeBuffer = await this.getQRCodeBuffer(ticketId, userId);

      // 4. Send email using email service
      const result = await this.emailService.sendTicketEmail(ticket, user, qrCodeBuffer);

      // 5. Log the resend using database function
      const { error: logError } = await supabase.rpc('log_email_resend', {
        p_user_id: userId,
        p_ticket_id: ticketId,
        p_email_type: 'ticket_purchase',
        p_email_status: result.success ? 'sent' : 'failed',
      });

      if (logError) {
        this.logger.error(`Failed to log email resend: ${logError.message}`, logError);
        // Don't throw - email was sent successfully
      }

      this.logger.log(`Email resent for ticket: ${ticketId} to user: ${userId} (${user.email})`);

      return result;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException ||
        error instanceof HttpException ||
        error instanceof InternalServerErrorException
      ) {
        throw error;
      }
      this.logger.error(`Error resending email: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to resend ticket email');
    }
  }
}
