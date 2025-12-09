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

  constructor(
    public ticketsService: TicketsService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Component initialization - ticket validation handled by template
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
      panelClass: 'glass-dialog-panel'
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
