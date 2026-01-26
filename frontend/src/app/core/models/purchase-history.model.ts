import { Ticket } from './ticket.model';

export interface HistoryFilters {
  page?: number;
  limit?: number;
  status?: 'active' | 'expired' | 'used' | 'refunded';
  from_date?: string; // ISO date string
  to_date?: string; // ISO date string
  ticket_type_id?: string;
}

export interface PaginatedHistory {
  data: Ticket[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface EmailResendResponse {
  success: boolean;
  message: string;
}
