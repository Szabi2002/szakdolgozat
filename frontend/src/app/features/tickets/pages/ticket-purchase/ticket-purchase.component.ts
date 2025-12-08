import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MaterialModule } from '@shared/material/material.module';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject, takeUntil, timer } from 'rxjs';
import { Ticket, TicketType, TicketsService, PurchaseTicketDto } from '@core/services/tickets.service';
import { TicketTypeSelectorComponent } from '../../components/ticket-type-selector/ticket-type-selector.component';
import { PaymentSimulationComponent, PaymentData } from '../../components/payment-simulation/payment-simulation.component';
import { AuthService } from '@core/services/auth.service';

@Component({
  selector: 'app-ticket-purchase',
  standalone: true,
  imports: [CommonModule, FormsModule, MaterialModule, TicketTypeSelectorComponent],
  templateUrl: './ticket-purchase.component.html',
  styleUrls: ['./ticket-purchase.component.scss']
})
export class TicketPurchaseComponent implements OnInit, OnDestroy {
  ticketTypes: TicketType[] = [];
  selectedTicketType: TicketType | null = null;
  isLoading = false;
  error: string | null = null;
  purchasedTicket: Ticket | null = null;
  showSuccessMessage = false;

  // Optional route/stop data from navigation state
  preselectedRoute: any = null;
  preselectedFromStop: any = null;
  preselectedToStop: any = null;

  private destroy$ = new Subject<void>();

  constructor(
    private ticketsService: TicketsService,
    private authService: AuthService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private router: Router
  ) {
    // Get navigation state if available
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras?.state) {
      const state = navigation.extras.state;
      this.preselectedRoute = state['route'];
      this.preselectedFromStop = state['fromStop'];
      this.preselectedToStop = state['toStop'];
    }
  }

  ngOnInit(): void {
    this.loadTicketTypes();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadTicketTypes(): void {
    this.isLoading = true;
    this.error = null;

    this.ticketsService
      .getTicketTypes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (types) => {
          this.ticketTypes = types;
          this.isLoading = false;
        },
        error: () => {
          this.error = 'Nem sikerült betölteni a jegytípusokat. Próbáld újra.';
          this.isLoading = false;
        }
      });
  }

  onTicketTypeSelected(ticketType: TicketType): void {
    this.selectedTicketType = ticketType;
  }

  onProceedToPayment(): void {
    if (!this.selectedTicketType) {
      this.snackBar.open('Kérlek válassz jegytípust', 'Bezár', {
        duration: 3000,
        panelClass: ['error-snackbar']
      });
      return;
    }

    // Extract valid route UUID if available
    const routeUUID = this.extractRouteUUID();

    const paymentData: PaymentData = {
      ticketType: this.selectedTicketType,
      routeId: routeUUID, // Use extracted UUID, not Route.route_id
      fromStopId: this.preselectedFromStop?.id,
      toStopId: this.preselectedToStop?.id
    };

    const dialogRef = this.dialog.open(PaymentSimulationComponent, {
      width: '600px',
      maxWidth: '95vw',
      data: paymentData,
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.success) {
        this.purchaseTicket();
      }
    });
  }

  /**
   * Helper to validate if a string is a valid UUID v4
   */
  private isValidUUID(value: any): boolean {
    if (!value || typeof value !== 'string') {
      return false;
    }
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(value);
  }

  /**
   * Extract actual route UUID from preselected route data
   * The Route interface's route_id is an identifier for the planned route,
   * not the actual database UUID. We need to extract it from the first transit step.
   */
  private extractRouteUUID(): string | undefined {
    if (!this.preselectedRoute?.steps) {
      return undefined;
    }

    // Find the first transit step with a route_id
    const firstTransitStep = this.preselectedRoute.steps.find(
      (step: any) => step.type === 'transit' && step.route_id
    );

    if (firstTransitStep?.route_id && this.isValidUUID(firstTransitStep.route_id)) {
      return firstTransitStep.route_id;
    }

    return undefined;
  }

  private purchaseTicket(): void {
    if (!this.selectedTicketType) return;

    // Extract valid route UUID from first transit step, not from Route.route_id
    const routeUUID = this.extractRouteUUID();

    const dto: PurchaseTicketDto = {
      ticket_type_id: this.selectedTicketType.id,
      route_id: routeUUID, // Only set if we found a valid UUID
      from_stop_id: this.preselectedFromStop?.id,
      to_stop_id: this.preselectedToStop?.id,
      valid_from: new Date().toISOString()
    };

    this.isLoading = true;

    this.ticketsService
      .purchaseTicket(dto)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (ticket) => {
          this.purchasedTicket = ticket;
          this.showSuccessMessage = true;
          this.isLoading = false;

          // Get user email for display
          const userEmail = this.authService.currentUser?.email || 'your email';

          // Show success snackbar with email confirmation
          this.snackBar.open(
            `Jegy sikeresen megvásárolva! E-mail elküldve: ${userEmail}`,
            'Bezár',
            {
              duration: 8000,
              panelClass: ['success-snackbar']
            }
          );

          // Auto-redirect to My Tickets after 3 seconds
          timer(3000)
            .pipe(takeUntil(this.destroy$))
            .subscribe(() => {
              this.router.navigate(['/tickets/my-tickets']);
            });
        },
        error: (err) => {
          const errorMessage = err.error?.message || 'Nem sikerült megvásárolni a jegyet. Próbáld újra.';

          this.snackBar.open(errorMessage, 'Bezár', {
            duration: 7000,
            panelClass: ['error-snackbar']
          });

          this.isLoading = false;
        }
      });
  }

  onCancel(): void {
    this.router.navigate(['/tickets/my-tickets']);
  }

  onViewMyTickets(): void {
    this.router.navigate(['/tickets/my-tickets']);
  }

  get totalPrice(): number {
    if (!this.selectedTicketType) return 0;
    return this.selectedTicketType.price;
  }

  formatPrice(price: number): string {
    return `${price.toFixed(0)} Ft`;
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

  get hasPreselectedRoute(): boolean {
    return !!this.preselectedRoute;
  }

  get userEmail(): string {
    return this.authService.currentUser?.email || 'az e-mail címedre';
  }
}
