import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { MaterialModule } from '@shared/material/material.module';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { Subject, takeUntil } from 'rxjs';
import { Ticket, TicketsService, TicketType } from '@core/services/tickets.service';
import { HistoryFilters, PaginatedHistory } from '@core/models/purchase-history.model';
import { TicketCardComponent } from '../../components/ticket-card/ticket-card.component';
import { TicketDetailsComponent } from '../../components/ticket-details/ticket-details.component';
import { Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-my-tickets',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MaterialModule, TicketCardComponent],
  templateUrl: './my-tickets.component.html',
  styleUrls: ['./my-tickets.component.scss']
})
export class MyTicketsComponent implements OnInit, OnDestroy {
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  tickets: Ticket[] = [];
  ticketTypes: TicketType[] = [];
  isLoading = false;
  error: string | null = null;

  // Pagination
  totalTickets = 0;
  currentPage = 1;
  pageSize = 10;
  pageSizeOptions = [10, 20, 50];

  // Filters
  filterForm!: FormGroup;
  selectedStatus: string = '';

  filters = [
    { value: '', label: 'Összes jegy', icon: 'confirmation_number' },
    { value: 'active', label: 'Aktív', icon: 'check_circle' },
    { value: 'expired', label: 'Lejárt', icon: 'schedule' },
    { value: 'used', label: 'Használt', icon: 'done_all' },
    { value: 'refunded', label: 'Visszaváltva', icon: 'cancel' }
  ];

  private destroy$ = new Subject<void>();

  constructor(
    private ticketsService: TicketsService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private router: Router,
    private route: ActivatedRoute,
    private fb: FormBuilder
  ) { }

  ngOnInit(): void {
    this.initFilterForm();
    this.loadTicketTypes();

    // Check for status query param
    this.route.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        if (params['status']) {
          this.selectedStatus = params['status'];
        }
      });

    // Load page size from localStorage
    const savedPageSize = localStorage.getItem('tickets_page_size');
    if (savedPageSize) {
      this.pageSize = parseInt(savedPageSize, 10);
    }

    this.loadTickets();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initFilterForm(): void {
    this.filterForm = this.fb.group({
      from_date: [null],
      to_date: [null],
      ticket_type_id: ['']
    });
  }

  private loadTicketTypes(): void {
    this.ticketsService.getTicketTypes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (types) => {
          this.ticketTypes = types;
        },
        error: () => {
          // Silent fail - ticket types are optional for filtering
        }
      });
  }

  loadTickets(): void {
    this.isLoading = true;
    this.error = null;

    const filters: HistoryFilters = {
      page: this.currentPage,
      limit: this.pageSize
    };

    if (this.selectedStatus) {
      filters.status = this.selectedStatus as any;
    }

    const formValue = this.filterForm.value;
    if (formValue.from_date) {
      filters.from_date = formValue.from_date.toISOString();
    }
    if (formValue.to_date) {
      filters.to_date = formValue.to_date.toISOString();
    }
    if (formValue.ticket_type_id) {
      filters.ticket_type_id = formValue.ticket_type_id;
    }

    // Use getHistory() instead of getMyTickets() - it supports all filters
    this.ticketsService.getHistory(filters)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: PaginatedHistory) => {
          this.tickets = response.data;
          this.totalTickets = response.total;
          this.isLoading = false;
        },
        error: () => {
          this.error = 'Nem sikerült betölteni a jegyeket. Próbáld újra.';
          this.isLoading = false;
        }
      });
  }

  onFilterChange(status: string): void {
    this.selectedStatus = status;
    this.currentPage = 1; // Reset to first page
    this.loadTickets();
  }

  onApplyFilters(): void {
    this.currentPage = 1; // Reset to first page
    this.loadTickets();
  }

  onClearFilters(): void {
    this.filterForm.reset({
      from_date: null,
      to_date: null,
      ticket_type_id: ''
    });
    this.selectedStatus = '';
    this.currentPage = 1;
    this.loadTickets();
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex + 1;
    this.pageSize = event.pageSize;

    // Save page size to localStorage
    localStorage.setItem('tickets_page_size', this.pageSize.toString());

    this.loadTickets();
  }

  onViewDetails(ticket: Ticket): void {
    this.dialog.open(TicketDetailsComponent, {
      width: '800px',
      maxWidth: '95vw',
      data: ticket,
      panelClass: 'glass-dialog-panel'
    });
  }

  onCancelTicket(ticket: Ticket): void {
    const dialogRef = this.dialog.open(ConfirmCancelDialogComponent, {
      width: '400px',
      panelClass: 'glass-dialog-panel',
      data: ticket
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.cancelTicket(ticket);
      }
    });
  }

  private cancelTicket(ticket: Ticket): void {
    this.ticketsService
      .cancelTicket(ticket.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.snackBar.open('Jegy sikeresen lemondva', 'Bezár', {
            duration: 3000,
            panelClass: ['success-snackbar']
          });
          this.loadTickets();
        },
        error: (err) => {
          this.snackBar.open('Nem sikerült lemondani a jegyet. Próbáld újra.', 'Bezár', {
            duration: 5000,
            panelClass: ['error-snackbar']
          });
        }
      });
  }

  onPurchaseTicket(): void {
    this.router.navigate(['/tickets/purchase']);
  }

  get hasActiveFilters(): boolean {
    const formValue = this.filterForm.value;
    return !!this.selectedStatus ||
      !!formValue.from_date ||
      !!formValue.to_date ||
      !!formValue.ticket_type_id;
  }

  get activeFilterCount(): number {
    let count = 0;
    if (this.selectedStatus) count++;
    const formValue = this.filterForm.value;
    if (formValue.from_date) count++;
    if (formValue.to_date) count++;
    if (formValue.ticket_type_id) count++;
    return count;
  }
}

// Confirm Cancel Dialog Component
@Component({
  selector: 'app-confirm-cancel-dialog',
  standalone: true,
  imports: [CommonModule, MaterialModule],
  template: `
    <div class="confirm-dialog">
      <h2 mat-dialog-title>
        <mat-icon>warning</mat-icon>
        Jegy lemondása
      </h2>
      <mat-dialog-content>
        <p>Biztosan le szeretnéd mondani ezt a jegyet?</p>
        <p class="warning">Ez a művelet nem vonható vissza.</p>
        <div class="ticket-info">
          <strong>{{ data.ticket_type?.name }}</strong>
          <span>{{ data.price.toFixed(0) }} Ft</span>
        </div>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button [mat-dialog-close]="false">Mégse</button>
        <button mat-raised-button color="warn" [mat-dialog-close]="true">
          Igen, lemondás
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .confirm-dialog {
      h2 {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        color: #f44336;

        mat-icon {
          font-size: 28px;
          width: 28px;
          height: 28px;
        }
      }

      mat-dialog-content {
        p {
          margin: 0.5rem 0;
          font-size: 1rem;
          color: rgba(0, 0, 0, 0.87);

          &.warning {
            color: #f44336;
            font-weight: 500;
          }
        }

        .ticket-info {
          display: flex;
          justify-content: space-between;
          padding: 1rem;
          background: #f5f5f5;
          border-radius: 8px;
          margin-top: 1rem;

          strong {
            color: #333;
          }

          span {
            color: #4caf50;
            font-weight: 600;
          }
        }
      }

      mat-dialog-actions {
        padding: 1rem 0 0 0;
      }
    }
  `]
})
export class ConfirmCancelDialogComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public data: Ticket) { }
}
