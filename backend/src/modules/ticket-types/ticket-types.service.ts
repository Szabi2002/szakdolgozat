import {
  Injectable,
  Logger,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { SupabaseService } from '@common/supabase/supabase.service';
import { CreateTicketTypeDto } from './dto/create-ticket-type.dto';
import { UpdateTicketTypeDto } from './dto/update-ticket-type.dto';

export interface TicketType {
  id: string;
  name: string;
  description: string | null;
  type: 'single' | 'return' | 'day' | 'monthly' | 'yearly';
  price: number;
  validity_hours: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

@Injectable()
export class TicketTypesService {
  private readonly logger = new Logger(TicketTypesService.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  /**
   * Creates a new ticket type (Admin only)
   * @param createTicketTypeDto - Ticket type data
   * @returns Created ticket type
   */
  async create(createTicketTypeDto: CreateTicketTypeDto): Promise<TicketType> {
    try {
      const supabase = this.supabaseService.getClient();

      const ticketTypeData = {
        name: createTicketTypeDto.name,
        description: createTicketTypeDto.description || null,
        type: createTicketTypeDto.type,
        price: createTicketTypeDto.price,
        validity_hours: createTicketTypeDto.validityHours || null,
        is_active: createTicketTypeDto.isActive ?? true,
      };

      const { data, error } = await supabase
        .from('ticket_types')
        .insert(ticketTypeData)
        .select()
        .single();

      if (error) {
        this.logger.error(`Failed to create ticket type: ${error.message}`, error);
        throw new InternalServerErrorException('Failed to create ticket type');
      }

      this.logger.log(`Ticket type created: ${data.id} - ${data.name}`);
      return data;
    } catch (error) {
      this.logger.error(`Error creating ticket type: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Gets all active ticket types (public access)
   * @returns Array of active ticket types
   */
  async findAll(): Promise<TicketType[]> {
    try {
      const supabase = this.supabaseService.getClient();

      const { data, error } = await supabase
        .from('ticket_types')
        .select('*')
        .eq('is_active', true)
        .order('price', { ascending: true });

      if (error) {
        this.logger.error(`Failed to fetch ticket types: ${error.message}`, error);
        throw new InternalServerErrorException('Failed to fetch ticket types');
      }

      return data || [];
    } catch (error) {
      this.logger.error(`Error fetching ticket types: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Gets all ticket types including inactive ones (Admin only)
   * @returns Array of all ticket types
   */
  async findAllIncludingInactive(): Promise<TicketType[]> {
    try {
      const supabase = this.supabaseService.getClient();

      const { data, error } = await supabase
        .from('ticket_types')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        this.logger.error(`Failed to fetch all ticket types: ${error.message}`, error);
        throw new InternalServerErrorException('Failed to fetch all ticket types');
      }

      return data || [];
    } catch (error) {
      this.logger.error(`Error fetching all ticket types: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Gets a single ticket type by ID
   * @param id - Ticket type ID
   * @returns Ticket type or throws NotFoundException
   */
  async findOne(id: string): Promise<TicketType> {
    try {
      const supabase = this.supabaseService.getClient();

      const { data, error } = await supabase
        .from('ticket_types')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !data) {
        this.logger.warn(`Ticket type not found: ${id}`);
        throw new NotFoundException(`Ticket type with ID ${id} not found`);
      }

      return data;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Error fetching ticket type: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to fetch ticket type');
    }
  }

  /**
   * Updates a ticket type (Admin only)
   * @param id - Ticket type ID
   * @param updateTicketTypeDto - Update data
   * @returns Updated ticket type
   */
  async update(id: string, updateTicketTypeDto: UpdateTicketTypeDto): Promise<TicketType> {
    try {
      // Check if ticket type exists
      await this.findOne(id);

      const supabase = this.supabaseService.getClient();

      const updateData: any = {};

      if (updateTicketTypeDto.name !== undefined) updateData.name = updateTicketTypeDto.name;
      if (updateTicketTypeDto.description !== undefined)
        updateData.description = updateTicketTypeDto.description;
      if (updateTicketTypeDto.type !== undefined) updateData.type = updateTicketTypeDto.type;
      if (updateTicketTypeDto.price !== undefined) updateData.price = updateTicketTypeDto.price;
      if (updateTicketTypeDto.validityHours !== undefined)
        updateData.validity_hours = updateTicketTypeDto.validityHours;
      if (updateTicketTypeDto.isActive !== undefined)
        updateData.is_active = updateTicketTypeDto.isActive;

      const { data, error } = await supabase
        .from('ticket_types')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        this.logger.error(`Failed to update ticket type: ${error.message}`, error);
        throw new InternalServerErrorException('Failed to update ticket type');
      }

      this.logger.log(`Ticket type updated: ${id}`);
      return data;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Error updating ticket type: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Soft deletes a ticket type by setting is_active to false (Admin only)
   * @param id - Ticket type ID
   */
  async remove(id: string): Promise<void> {
    try {
      // Check if ticket type exists
      await this.findOne(id);

      const supabase = this.supabaseService.getClient();

      // Soft delete by setting is_active to false
      const { error } = await supabase
        .from('ticket_types')
        .update({ is_active: false })
        .eq('id', id);

      if (error) {
        this.logger.error(`Failed to delete ticket type: ${error.message}`, error);
        throw new InternalServerErrorException('Failed to delete ticket type');
      }

      this.logger.log(`Ticket type soft deleted: ${id}`);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Error deleting ticket type: ${error.message}`, error.stack);
      throw error;
    }
  }
}
