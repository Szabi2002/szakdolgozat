import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '@shared/material/material.module';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { TicketsService, Ticket } from '@core/services/tickets.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-qr-code-display',
  standalone: true,
  imports: [CommonModule, MaterialModule],
  templateUrl: './qr-code-display.component.html',
  styleUrls: ['./qr-code-display.component.scss']
})
export class QrCodeDisplayComponent implements OnInit, OnDestroy {
  @Input() ticket!: Ticket;

  qrCodeUrl: SafeUrl | null = null;
  isLoading = false;
  error: string | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    public ticketsService: TicketsService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    this.loadQRCode();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();

    // Revoke object URL to free memory
    if (this.qrCodeUrl) {
      const url = this.qrCodeUrl.toString();
      if (url.startsWith('blob:')) {
        URL.revokeObjectURL(url);
      }
    }
  }

  loadQRCode(): void {
    if (!this.ticket?.id) {
      this.error = 'Érvénytelen jegy';
      return;
    }

    this.isLoading = true;
    this.error = null;

    this.ticketsService
      .getTicketQRCode(this.ticket.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (blob) => {
          const objectUrl = URL.createObjectURL(blob);
          this.qrCodeUrl = this.sanitizer.bypassSecurityTrustUrl(objectUrl);
          this.isLoading = false;
        },
        error: () => {
          this.error = 'Nem sikerült betölteni a QR kódot';
          this.isLoading = false;
        }
      });
  }

  downloadQRCode(): void {
    if (!this.qrCodeUrl) {
      return;
    }

    const url = this.qrCodeUrl.toString();
    const link = document.createElement('a');
    link.href = url;
    link.download = `ticket-${this.ticket.id.substring(0, 8)}-qr.png`;
    link.click();
  }

  get isTicketValid(): boolean {
    return this.ticketsService.isTicketValid(this.ticket);
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
}
