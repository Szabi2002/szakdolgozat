import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MaterialModule } from '@shared/material/material.module';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Ticket, TicketsService } from '@core/services/tickets.service';
import { QrCodeDisplayComponent } from '../qr-code-display/qr-code-display.component';

@Component({
  selector: 'app-ticket-details',
  standalone: true,
  imports: [CommonModule, MaterialModule, QrCodeDisplayComponent],
  templateUrl: './ticket-details.component.html',
  styleUrls: ['./ticket-details.component.scss']
})
export class TicketDetailsComponent implements OnInit {
  selectedTab = 0;
  isResendingEmail = false;
  isCancelling = false;

  constructor(
    public dialogRef: MatDialogRef<TicketDetailsComponent>,
    @Inject(MAT_DIALOG_DATA) public ticket: Ticket,
    private ticketsService: TicketsService,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    // Initialize component
  }

  get isTicketValid(): boolean {
    return this.ticketsService.isTicketValid(this.ticket);
  }

  get statusColor(): string {
    return this.ticketsService.getTicketStatusColor(this.ticket.status);
  }

  get validityPeriod(): string {
    return this.ticketsService.getValidityPeriod(this.ticket);
  }

  onClose(): void {
    this.dialogRef.close();
  }

  onResendEmail(): void {
    this.isResendingEmail = true;

    this.ticketsService.resendTicketEmail(this.ticket.id).subscribe({
      next: () => {
        this.snackBar.open('Jegy e-mail sikeresen elküldve!', 'Bezár', {
          duration: 3000,
          panelClass: ['success-snackbar']
        });
        this.isResendingEmail = false;
      },
      error: () => {
        this.snackBar.open('Nem sikerült elküldeni az e-mailt. Próbáld újra.', 'Bezár', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
        this.isResendingEmail = false;
      }
    });
  }

  onCancelTicket(): void {
    if (!confirm('Biztosan vissza szeretné váltani ezt a jegyet? A művelet nem visszavonható.')) {
      return;
    }

    this.isCancelling = true;
    this.ticketsService.cancelTicket(this.ticket.id).subscribe({
      next: () => {
        this.snackBar.open('Jegy sikeresen visszaváltva.', 'Bezár', {
          duration: 3000,
          panelClass: ['success-snackbar']
        });
        this.dialogRef.close(true); // Return true to indicate change
      },
      error: (err) => {
        console.error('Cancellation error:', err);
        this.snackBar.open('Nem sikerült visszaváltani a jegyet. Próbáld újra később.', 'Bezár', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
        this.isCancelling = false;
      }
    });
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

  getStatusLabel(): string {
    switch (this.ticket.status) {
      case 'active':
        return 'Aktív';
      case 'expired':
        return 'Lejárt';
      case 'used':
        return 'Használt';
      case 'refunded':
        return 'Visszaváltva';
      default:
        return 'Ismeretlen';
    }
  }
}
