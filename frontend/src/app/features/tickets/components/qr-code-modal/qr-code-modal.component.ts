import { Component, Inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MaterialModule } from '@shared/material/material.module';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { Subject, takeUntil } from 'rxjs';
import { Ticket, TicketsService } from '@core/services/tickets.service';

@Component({
  selector: 'app-qr-code-modal',
  standalone: true,
  imports: [CommonModule, MaterialModule],
  templateUrl: './qr-code-modal.component.html',
  styleUrls: ['./qr-code-modal.component.scss']
})
export class QrCodeModalComponent implements OnInit, OnDestroy {
  qrCodeUrl: SafeUrl | null = null;
  isLoading = false;
  error: string | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    public dialogRef: MatDialogRef<QrCodeModalComponent>,
    @Inject(MAT_DIALOG_DATA) public ticket: Ticket,
    private ticketsService: TicketsService,
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
          this.error = 'Nem sikerült betölteni a QR kódot. Próbáld újra.';
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

  onClose(): void {
    this.dialogRef.close();
  }

  get isTicketValid(): boolean {
    return this.ticketsService.isTicketValid(this.ticket);
  }

  get statusColor(): string {
    return this.ticketsService.getTicketStatusColor(this.ticket.status);
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
}
