import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MaterialModule } from '@shared/material/material.module';
import { MatDialog } from '@angular/material/dialog';
import { TicketsService } from '@core/services/tickets.service';
import { Ticket } from '@core/models/ticket.model';
import { TicketDetailsComponent } from '@features/tickets/components/ticket-details/ticket-details.component';

@Component({
  selector: 'app-active-tickets',
  standalone: true,
  imports: [CommonModule, MaterialModule],
  templateUrl: './active-tickets.component.html',
  styleUrls: ['./active-tickets.component.scss'],
})
export class ActiveTicketsComponent implements OnInit {
  private ticketsService = inject(TicketsService);
  private router = inject(Router);
  private dialog = inject(MatDialog);

  activeTickets: Ticket[] = [];
  isLoading = true;
  errorMessage = '';

  ngOnInit(): void {
    this.loadActiveTickets();
  }

  /**
   * Load active tickets for the current user
   */
  private loadActiveTickets(): void {
    this.isLoading = true;

    this.ticketsService.getMyTickets().subscribe({
      next: (tickets: Ticket[]) => {
        // Filter only active tickets (not expired, not used)
        this.activeTickets = tickets
          .filter((ticket: Ticket) => ticket.status === 'active')
          .slice(0, 3); // Show only the 3 most recent
        this.isLoading = false;
      },
      error: (error: any) => {
        this.errorMessage = 'Nem sikerült betölteni a jegyeket.';
        this.isLoading = false;
      },
    });
  }

  /**
   * View ticket details in dialog
   */
  viewTicket(ticketId: string): void {
    const ticket = this.activeTickets.find(t => t.id === ticketId);
    if (ticket) {
      this.dialog.open(TicketDetailsComponent, {
        width: '800px',
        maxWidth: '95vw',
        data: ticket,
        panelClass: 'glass-dialog-panel'
      });
    }
  }

  /**
   * Navigate to all tickets
   */
  viewAllTickets(): void {
    this.router.navigate(['/tickets/my-tickets']);
  }

  /**
   * Get ticket type display name
   */
  getTicketTypeName(ticket: Ticket): string {
    if (ticket.ticket_type?.name) {
      return ticket.ticket_type.name;
    }
    return 'Jegy';
  }

  /**
   * Get time remaining until expiry
   */
  getTimeRemaining(validUntil: string | undefined): string {
    if (!validUntil) {
      return 'Korlátlan';
    }

    const now = new Date();
    const expiry = new Date(validUntil);
    const diffMs = expiry.getTime() - now.getTime();

    if (diffMs < 0) {
      return 'Lejárt';
    }

    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `${diffDays} nap`;
    } else if (diffHours > 0) {
      return `${diffHours} óra`;
    } else {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      return `${diffMinutes} perc`;
    }
  }
}
