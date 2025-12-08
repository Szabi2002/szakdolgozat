import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { environment } from '@environments/environment';
import { PaginatedHistory, HistoryFilters, EmailResendResponse } from '@core/models/purchase-history.model';
import { Ticket, TicketType, Stop, Route, PurchaseTicketDto } from '@core/models/ticket.model';

// Re-export types for backward compatibility with existing imports
export { Ticket, TicketType, Stop, Route, PurchaseTicketDto } from '@core/models/ticket.model';

@Injectable({
  providedIn: 'root'
})
export class TicketsService {
  private readonly apiUrl = `${environment.apiUrl}/tickets`;
  private readonly ticketTypesUrl = `${environment.apiUrl}/ticket-types`;

  constructor(private readonly http: HttpClient) {}

  /**
   * Get all active ticket types
   */
  getTicketTypes(): Observable<TicketType[]> {
    return this.http.get<TicketType[]>(this.ticketTypesUrl);
  }

  /**
   * Get all ticket types including inactive ones (admin only)
   */
  getAllTicketTypes(): Observable<TicketType[]> {
    return this.http.get<TicketType[]>(`${this.ticketTypesUrl}/all`);
  }

  /**
   * Get a specific ticket type by ID
   */
  getTicketTypeById(id: string): Observable<TicketType> {
    return this.http.get<TicketType>(`${this.ticketTypesUrl}/${id}`);
  }

  /**
   * Purchase a new ticket
   */
  purchaseTicket(dto: PurchaseTicketDto): Observable<Ticket> {
    return this.http.post<Ticket>(`${this.apiUrl}/purchase`, dto);
  }

  /**
   * Get user's tickets with optional status filter
   */
  getMyTickets(status?: string): Observable<Ticket[]> {
    let params = new HttpParams();
    if (status) {
      params = params.set('status', status);
    }
    return this.http.get<Ticket[]>(`${this.apiUrl}/my-tickets`, { params });
  }

  /**
   * Get user's active tickets only
   */
  getMyActiveTickets(): Observable<Ticket[]> {
    return this.http.get<Ticket[]>(`${this.apiUrl}/my-tickets/active`);
  }

  /**
   * Get a specific ticket by ID
   */
  getTicketById(id: string): Observable<Ticket> {
    return this.http.get<Ticket>(`${this.apiUrl}/${id}`);
  }

  /**
   * Get QR code image for a ticket
   */
  getTicketQRCode(id: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${id}/qr-code`, {
      responseType: 'blob'
    });
  }

  /**
   * Resend ticket confirmation email
   */
  resendTicketEmail(id: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${id}/send-email`, {});
  }

  /**
   * Cancel a ticket
   */
  cancelTicket(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  /**
   * Helper method to check if a ticket is currently valid
   */
  isTicketValid(ticket: Ticket): boolean {
    if (ticket.status !== 'active') {
      return false;
    }

    const now = new Date();
    const validFrom = new Date(ticket.valid_from);

    if (validFrom > now) {
      return false;
    }

    if (ticket.valid_until) {
      const validUntil = new Date(ticket.valid_until);
      return validUntil > now;
    }

    return true;
  }

  /**
   * Helper method to get ticket status color
   */
  getTicketStatusColor(status: string): string {
    switch (status) {
      case 'active':
        return 'primary';
      case 'expired':
        return 'warn';
      case 'used':
        return 'accent';
      case 'cancelled':
        return 'basic';
      default:
        return 'basic';
    }
  }

  /**
   * Helper method to format ticket type display name
   */
  formatTicketTypeName(type: string): string {
    const typeMap: Record<string, string> = {
      single: 'Single Ticket',
      return: 'Return Ticket',
      day: 'Day Pass',
      monthly: 'Monthly Pass',
      yearly: 'Yearly Pass'
    };
    return typeMap[type] || type;
  }

  /**
   * Helper method to calculate validity period
   */
  getValidityPeriod(ticket: Ticket): string {
    if (!ticket.valid_until) {
      return 'Unlimited';
    }

    const validFrom = new Date(ticket.valid_from);
    const validUntil = new Date(ticket.valid_until);
    const hours = Math.round((validUntil.getTime() - validFrom.getTime()) / (1000 * 60 * 60));

    if (hours < 24) {
      return `${hours} hours`;
    } else if (hours < 720) {
      return `${Math.round(hours / 24)} days`;
    } else if (hours < 8760) {
      return `${Math.round(hours / 720)} months`;
    } else {
      return `${Math.round(hours / 8760)} years`;
    }
  }

  /**
   * Get paginated purchase history with filters
   * Sprint 9-10: Purchase History Enhancement
   */
  getHistory(filters?: HistoryFilters): Observable<PaginatedHistory> {
    let params = new HttpParams();

    if (filters) {
      if (filters.page) {
        params = params.set('page', filters.page.toString());
      }
      if (filters.limit) {
        params = params.set('limit', filters.limit.toString());
      }
      if (filters.status) {
        params = params.set('status', filters.status);
      }
      if (filters.from_date) {
        params = params.set('from_date', filters.from_date);
      }
      if (filters.to_date) {
        params = params.set('to_date', filters.to_date);
      }
      if (filters.ticket_type_id) {
        params = params.set('ticket_type_id', filters.ticket_type_id);
      }
    }

    console.log('=== TICKETS SERVICE: getHistory() ===');
    console.log('Filters:', filters);
    console.log('API URL:', `${this.apiUrl}/history`);
    console.log('====================================');

    return this.http.get<PaginatedHistory>(`${this.apiUrl}/history`, { params }).pipe(
      tap(response => {
        console.log('=== RAW API RESPONSE (getHistory) ===');
        console.log('Response type:', typeof response);
        console.log('Response keys:', response ? Object.keys(response) : 'null');
        console.log('Data array:', response?.data);
        console.log('Data is array:', Array.isArray(response?.data));
        console.log('Data length:', response?.data?.length);
        console.log('First item:', response?.data?.[0]);
        console.log('First item keys:', response?.data?.[0] ? Object.keys(response.data[0]) : 'undefined');
        console.log('First item has id:', 'id' in (response?.data?.[0] || {}));
        console.log('First item has ticket_id:', 'ticket_id' in (response?.data?.[0] || {}));
        console.log('First item id value:', response?.data?.[0]?.id);
        console.log('First item ticket_id value:', (response?.data?.[0] as any)?.ticket_id);
        console.log('===================================');
      }),
      catchError(error => {
        console.error('=== API ERROR (getHistory) ===');
        console.error('Error:', error);
        console.error('Error status:', error.status);
        console.error('Error message:', error.message);
        console.error('=============================');
        throw error;
      })
    );
  }

  /**
   * Resend ticket email (rate-limited: 5 per hour)
   * Sprint 9-10: Purchase History Enhancement
   */
  resendEmail(ticketId: string): Observable<EmailResendResponse> {
    return this.http.post<EmailResendResponse>(`${this.apiUrl}/${ticketId}/resend-email`, {});
  }
}
