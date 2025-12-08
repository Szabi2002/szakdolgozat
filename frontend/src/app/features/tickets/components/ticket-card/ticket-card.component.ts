import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MaterialModule } from '@shared/material/material.module';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Ticket, TicketsService } from '@core/services/tickets.service';
import { QrCodeModalComponent } from '../qr-code-modal/qr-code-modal.component';

@Component({
  selector: 'app-ticket-card',
  standalone: true,
  imports: [CommonModule, MaterialModule],
  templateUrl: './ticket-card.component.html',
  styleUrls: ['./ticket-card.component.scss']
})
export class TicketCardComponent implements OnInit {
  @Input() ticket!: Ticket;
  @Input() compact: boolean = false;
  @Output() viewDetails = new EventEmitter<Ticket>();
  @Output() cancel = new EventEmitter<Ticket>();
  @Output() refresh = new EventEmitter<void>();

  isResendingEmail = false;

  constructor(
    public ticketsService: TicketsService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private router: Router
  ) {}

  ngOnInit(): void {
    console.log('=== TICKET CARD INIT ===');
    console.log('Received ticket input:', this.ticket);
    console.log('Ticket type:', typeof this.ticket);
    console.log('Ticket is array:', Array.isArray(this.ticket));
    console.log('Ticket is null/undefined:', this.ticket === null || this.ticket === undefined);

    if (this.ticket) {
      console.log('Ticket keys:', Object.keys(this.ticket));
      console.log('Ticket has id:', 'id' in this.ticket);
      console.log('Ticket has ticket_id:', 'ticket_id' in this.ticket);
      console.log('Ticket.id value:', this.ticket.id);
      console.log('Ticket.ticket_id value:', (this.ticket as any).ticket_id);
      console.log('Ticket.id type:', typeof this.ticket.id);
      console.log('Ticket.ticket_id type:', typeof (this.ticket as any).ticket_id);
      console.log('Full ticket object:', JSON.stringify(this.ticket, null, 2));
    }
    console.log('=======================');

    // Validate ticket object on initialization
    if (!this.ticket) {
      console.error('TicketCardComponent: No ticket object provided');
      return;
    }

    if (!this.ticket.id) {
      console.error('TicketCardComponent: Invalid ticket object - missing id field', this.ticket);
      console.error('Available fields:', Object.keys(this.ticket));
      console.error('Has ticket_id instead?:', 'ticket_id' in this.ticket, (this.ticket as any).ticket_id);
    }
  }

  get isValid(): boolean {
    return this.ticketsService.isTicketValid(this.ticket);
  }

  get statusColor(): string {
    return this.ticketsService.getTicketStatusColor(this.ticket.status);
  }

  get validityPeriod(): string {
    return this.ticketsService.getValidityPeriod(this.ticket);
  }

  get ticketTypeName(): string {
    return this.ticket.ticket_type?.name || 'Unknown';
  }

  get ticketTypeDisplayName(): string {
    if (this.ticket.ticket_type?.type) {
      return this.ticketsService.formatTicketTypeName(this.ticket.ticket_type.type);
    }
    return 'Unknown Type';
  }

  onViewDetails(): void {
    this.viewDetails.emit(this.ticket);
  }

  onViewQRCode(): void {
    this.dialog.open(QrCodeModalComponent, {
      width: '600px',
      maxWidth: '95vw',
      data: this.ticket,
      panelClass: 'qr-code-modal-container'
    });
  }

  onResendEmail(): void {
    this.isResendingEmail = true;

    this.ticketsService.resendEmail(this.ticket.id).subscribe({
      next: (response) => {
        this.snackBar.open(
          response.message || 'Jegy e-mail sikeresen elküldve: ' + (this.ticket.ticket_type?.name || 'az e-mail címedre'),
          'Bezár',
          {
            duration: 3000,
            panelClass: ['success-snackbar']
          }
        );
        this.isResendingEmail = false;
      },
      error: (err) => {
        this.isResendingEmail = false;

        // Handle rate limit error (429)
        if (err.status === 429) {
          const retryAfter = err.error?.retry_after || 'néhány perc';
          this.snackBar.open(
            `Túl sok próbálkozás. Óránként maximum 5 e-mailt küldhetsz újra. Próbáld újra ${retryAfter} múlva.`,
            'Bezár',
            {
              duration: 7000,
              panelClass: ['error-snackbar']
            }
          );
        } else {
          // Generic error handling
          const errorMessage = err.error?.message || 'Nem sikerült elküldeni az e-mailt. Próbáld újra.';
          this.snackBar.open(errorMessage, 'Bezár', {
            duration: 5000,
            panelClass: ['error-snackbar']
          });
        }
      }
    });
  }

  onCancel(): void {
    this.cancel.emit(this.ticket);
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleString('hu-HU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatPrice(price: number): string {
    return `${price.toFixed(0)} Ft`;
  }

  getStatusIcon(): string {
    switch (this.ticket.status) {
      case 'active':
        return 'check_circle';
      case 'expired':
        return 'schedule';
      case 'used':
        return 'done_all';
      case 'cancelled':
        return 'cancel';
      default:
        return 'help';
    }
  }

  getStatusLabel(): string {
    switch (this.ticket.status) {
      case 'active':
        return 'Aktív';
      case 'expired':
        return 'Lejárt';
      case 'used':
        return 'Használt';
      case 'cancelled':
        return 'Lemondva';
      default:
        return 'Ismeretlen';
    }
  }

  getRouteInfo(): string {
    if (!this.ticket.route) {
      return 'Minden járat';
    }
    return `${this.ticket.route.route_number} - ${this.ticket.route.route_name}`;
  }

  getStopsInfo(): string {
    if (!this.ticket.from_stop || !this.ticket.to_stop) {
      return 'Minden megálló';
    }
    return `${this.ticket.from_stop.name} → ${this.ticket.to_stop.name}`;
  }

  viewRouteDetails(): void {
    if (this.ticket.route?.id) {
      this.router.navigate(['/routes', this.ticket.route.id]);
    } else {
      this.snackBar.open('Járat részletei nem elérhetők ehhez a jegyhez', 'Bezár', {
        duration: 3000
      });
    }
  }

  hasRouteId(): boolean {
    return !!this.ticket.route?.id;
  }
}
