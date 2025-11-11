import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { SupabaseService } from '@common/supabase/supabase.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';

export interface Transaction {
  id: string;
  user_id: string;
  ticket_id: string | null;
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  payment_method: string;
  transaction_date: string;
  created_at: string;
}

@Injectable()
export class TransactionsService {
  private readonly logger = new Logger(TransactionsService.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  /**
   * Creates a new transaction (payment simulation)
   * For MVP, all transactions are automatically completed
   * @param createTransactionDto - Transaction data
   * @returns Created transaction
   */
  async create(createTransactionDto: CreateTransactionDto): Promise<Transaction> {
    try {
      const supabase = this.supabaseService.getClient();

      // For simulation, all transactions are automatically completed
      const transactionData = {
        user_id: createTransactionDto.userId,
        ticket_id: createTransactionDto.ticketId || null,
        amount: createTransactionDto.amount,
        status: 'completed' as const,
        payment_method: createTransactionDto.paymentMethod || 'simulation',
        transaction_date: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('transactions')
        .insert(transactionData)
        .select()
        .single();

      if (error) {
        this.logger.error(`Failed to create transaction: ${error.message}`, error);
        throw new InternalServerErrorException('Failed to create transaction');
      }

      this.logger.log(`Transaction created successfully: ${data.id}`);
      return data;
    } catch (error) {
      this.logger.error(`Error creating transaction: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Gets all transactions for a specific user
   * @param userId - User ID
   * @returns Array of transactions
   */
  async findByUserId(userId: string): Promise<Transaction[]> {
    try {
      const supabase = this.supabaseService.getClient();

      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('transaction_date', { ascending: false });

      if (error) {
        this.logger.error(`Failed to fetch transactions: ${error.message}`, error);
        throw new InternalServerErrorException('Failed to fetch transactions');
      }

      return data || [];
    } catch (error) {
      this.logger.error(`Error fetching transactions: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Gets a single transaction by ID
   * @param id - Transaction ID
   * @param userId - User ID (for authorization)
   * @returns Transaction or null
   */
  async findOne(id: string, userId: string): Promise<Transaction | null> {
    try {
      const supabase = this.supabaseService.getClient();

      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('id', id)
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Not found
          return null;
        }
        this.logger.error(`Failed to fetch transaction: ${error.message}`, error);
        throw new InternalServerErrorException('Failed to fetch transaction');
      }

      return data;
    } catch (error) {
      this.logger.error(`Error fetching transaction: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Simulates payment processing (always succeeds in MVP)
   * @param amount - Amount to process
   * @returns Success status
   */
  async simulatePayment(amount: number): Promise<{ success: boolean; message: string }> {
    this.logger.log(`Simulating payment of ${amount} HUF`);

    // Simulate processing delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // For MVP, always return success
    return {
      success: true,
      message: 'Payment processed successfully (simulation)',
    };
  }

  /**
   * Updates transaction with ticket ID after ticket creation
   * @param transactionId - Transaction ID
   * @param ticketId - Ticket ID
   */
  async updateWithTicketId(transactionId: string, ticketId: string): Promise<void> {
    try {
      const supabase = this.supabaseService.getClient();

      const { error } = await supabase
        .from('transactions')
        .update({ ticket_id: ticketId })
        .eq('id', transactionId);

      if (error) {
        this.logger.error(`Failed to update transaction: ${error.message}`, error);
        throw new InternalServerErrorException('Failed to update transaction');
      }

      this.logger.log(`Transaction ${transactionId} updated with ticket ${ticketId}`);
    } catch (error) {
      this.logger.error(`Error updating transaction: ${error.message}`, error.stack);
      throw error;
    }
  }
}
