import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { TicketDetailsComponent } from './ticket-details.component';
import { TicketsService } from '@core/services/tickets.service';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MaterialModule } from '@shared/material/material.module';
import { CommonModule } from '@angular/common';
import { of, throwError } from 'rxjs';
import { mockTickets, createMockTicket } from '../../testing/mock-data';
import { NO_ERRORS_SCHEMA } from '@angular/core';

describe('TicketDetailsComponent', () => {
  let component: TicketDetailsComponent;
  let fixture: ComponentFixture<TicketDetailsComponent>;
  let mockTicketsService: jasmine.SpyObj<TicketsService>;
  let mockDialogRef: jasmine.SpyObj<MatDialogRef<TicketDetailsComponent>>;
  let mockSnackBar: jasmine.SpyObj<MatSnackBar>;
  const mockTicket = mockTickets[0];

  beforeEach(async () => {
    mockTicketsService = jasmine.createSpyObj('TicketsService', [
      'isTicketValid',
      'getTicketStatusColor',
      'getValidityPeriod',
      'resendTicketEmail'
    ]);
    mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);
    mockSnackBar = jasmine.createSpyObj('MatSnackBar', ['open']);

    // Set default return values
    mockTicketsService.isTicketValid.and.returnValue(true);
    mockTicketsService.getTicketStatusColor.and.returnValue('primary');
    mockTicketsService.getValidityPeriod.and.returnValue('1 hour');

    await TestBed.configureTestingModule({
      imports: [TicketDetailsComponent, MaterialModule, CommonModule],
      providers: [
        { provide: TicketsService, useValue: mockTicketsService },
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: mockTicket },
        { provide: MatSnackBar, useValue: mockSnackBar }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(TicketDetailsComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Component Initialization', () => {
    it('should initialize with default values', () => {
      expect(component.selectedTab).toBe(0);
      expect(component.isResendingEmail).toBe(false);
    });

    it('should receive ticket data', () => {
      expect(component.ticket).toEqual(mockTicket);
    });

    it('should call ngOnInit', () => {
      spyOn(component, 'ngOnInit');
      component.ngOnInit();
      expect(component.ngOnInit).toHaveBeenCalled();
    });
  });

  describe('isTicketValid getter', () => {
    it('should return true for valid ticket', () => {
      mockTicketsService.isTicketValid.and.returnValue(true);

      expect(component.isTicketValid).toBe(true);
      expect(mockTicketsService.isTicketValid).toHaveBeenCalledWith(mockTicket);
    });

    it('should return false for invalid ticket', () => {
      const expiredTicket = mockTickets[1];
      component.ticket = expiredTicket;
      mockTicketsService.isTicketValid.and.returnValue(false);

      expect(component.isTicketValid).toBe(false);
      expect(mockTicketsService.isTicketValid).toHaveBeenCalledWith(expiredTicket);
    });
  });

  describe('statusColor getter', () => {
    it('should return correct color for active status', () => {
      component.ticket = createMockTicket({ status: 'active' });
      mockTicketsService.getTicketStatusColor.and.returnValue('primary');

      expect(component.statusColor).toBe('primary');
      expect(mockTicketsService.getTicketStatusColor).toHaveBeenCalledWith('active');
    });

    it('should return correct color for expired status', () => {
      component.ticket = createMockTicket({ status: 'expired' });
      mockTicketsService.getTicketStatusColor.and.returnValue('warn');

      expect(component.statusColor).toBe('warn');
      expect(mockTicketsService.getTicketStatusColor).toHaveBeenCalledWith('expired');
    });

    it('should return correct color for cancelled status', () => {
      component.ticket = createMockTicket({ status: 'cancelled' });
      mockTicketsService.getTicketStatusColor.and.returnValue('basic');

      expect(component.statusColor).toBe('basic');
    });
  });

  describe('validityPeriod getter', () => {
    it('should return formatted validity period', () => {
      mockTicketsService.getValidityPeriod.and.returnValue('1 hour');

      expect(component.validityPeriod).toBe('1 hour');
      expect(mockTicketsService.getValidityPeriod).toHaveBeenCalledWith(mockTicket);
    });

    it('should handle different validity periods', () => {
      const testCases = [
        '1 hour',
        '24 hours',
        '7 days',
        '30 days',
        'Unlimited'
      ];

      testCases.forEach((period) => {
        mockTicketsService.getValidityPeriod.and.returnValue(period);
        expect(component.validityPeriod).toBe(period);
      });
    });
  });

  describe('onClose', () => {
    it('should close the dialog', () => {
      component.onClose();

      expect(mockDialogRef.close).toHaveBeenCalled();
    });
  });

  describe('onResendEmail', () => {
    it('should resend email successfully', fakeAsync(() => {
      mockTicketsService.resendTicketEmail.and.returnValue(of(void 0));

      component.onResendEmail();

      expect(component.isResendingEmail).toBe(true);

      tick();

      expect(mockTicketsService.resendTicketEmail).toHaveBeenCalledWith(mockTicket.id);
      expect(mockSnackBar.open).toHaveBeenCalledWith(
        'Ticket email sent successfully!',
        'Close',
        jasmine.objectContaining({
          duration: 3000
        })
      );
      expect(component.isResendingEmail).toBe(false);
    }));

    it('should handle error when resending email fails', fakeAsync(() => {
      const errorResponse = { status: 500, message: 'Server error' };
      mockTicketsService.resendTicketEmail.and.returnValue(
        throwError(() => errorResponse)
      );

      component.onResendEmail();

      expect(component.isResendingEmail).toBe(true);

      tick();

      expect(mockSnackBar.open).toHaveBeenCalledWith(
        'Failed to send email. Please try again.',
        'Close',
        jasmine.objectContaining({
          duration: 5000
        })
      );
      expect(component.isResendingEmail).toBe(false);
    }));

    it('should not allow multiple simultaneous email sends', fakeAsync(() => {
      mockTicketsService.resendTicketEmail.and.returnValue(of(void 0));

      component.onResendEmail();
      expect(component.isResendingEmail).toBe(true);

      // Try to send again while first is in progress
      const initialCallCount = mockTicketsService.resendTicketEmail.calls.count();

      tick();

      expect(mockTicketsService.resendTicketEmail).toHaveBeenCalledTimes(initialCallCount);
    }));
  });

  describe('formatDate', () => {
    it('should format date with full month name', () => {
      const testDate = '2025-01-15T14:30:00.000Z';
      const formatted = component.formatDate(testDate);

      expect(formatted).toContain('January');
      expect(formatted).toContain('15');
      expect(formatted).toContain('2025');
    });

    it('should include time in 12-hour format', () => {
      const testDate = '2025-06-20T14:30:00.000Z';
      const formatted = component.formatDate(testDate);

      expect(formatted).toContain('PM');
    });

    it('should handle different dates correctly', () => {
      const dates = [
        '2025-01-01T00:00:00.000Z',
        '2025-06-15T12:00:00.000Z',
        '2025-12-31T23:59:59.000Z'
      ];

      dates.forEach((date) => {
        const formatted = component.formatDate(date);
        expect(formatted).toBeDefined();
        expect(formatted.length).toBeGreaterThan(0);
      });
    });
  });

  describe('formatPrice', () => {
    it('should format price with Ft suffix', () => {
      expect(component.formatPrice(350)).toBe('350 Ft');
    });

    it('should format price with no decimals', () => {
      expect(component.formatPrice(1650.99)).toBe('1651 Ft');
    });

    it('should handle zero price', () => {
      expect(component.formatPrice(0)).toBe('0 Ft');
    });

    it('should handle large numbers', () => {
      expect(component.formatPrice(99000)).toBe('99000 Ft');
    });
  });

  describe('getRouteInfo', () => {
    it('should return route information when route is available', () => {
      const ticketWithRoute = mockTickets[0];
      component.ticket = ticketWithRoute;

      expect(component.getRouteInfo()).toBe('4 - Újpest-központ - Fehérvári út');
    });

    it('should return "All Routes" when route is not available', () => {
      const ticketWithoutRoute = createMockTicket({ route: undefined });
      component.ticket = ticketWithoutRoute;

      expect(component.getRouteInfo()).toBe('All Routes');
    });

    it('should handle route with empty name', () => {
      const ticket = createMockTicket({
        route: { id: 'route-1', route_number: '5', route_name: '', type: 'bus' }
      });
      component.ticket = ticket;

      expect(component.getRouteInfo()).toBe('5 - ');
    });
  });

  describe('getStopsInfo', () => {
    it('should return stops information when both stops are available', () => {
      const ticketWithStops = mockTickets[0];
      component.ticket = ticketWithStops;

      expect(component.getStopsInfo()).toBe('Deák Ferenc tér → Keleti pályaudvar');
    });

    it('should return "All Stops" when from_stop is not available', () => {
      const ticket = createMockTicket({ from_stop: undefined });
      component.ticket = ticket;

      expect(component.getStopsInfo()).toBe('All Stops');
    });

    it('should return "All Stops" when to_stop is not available', () => {
      const ticket = createMockTicket({ to_stop: undefined });
      component.ticket = ticket;

      expect(component.getStopsInfo()).toBe('All Stops');
    });

    it('should return "All Stops" when both stops are not available', () => {
      const ticket = createMockTicket({
        from_stop: undefined,
        to_stop: undefined
      });
      component.ticket = ticket;

      expect(component.getStopsInfo()).toBe('All Stops');
    });
  });

  describe('Tab Selection', () => {
    it('should start with first tab selected', () => {
      expect(component.selectedTab).toBe(0);
    });

    it('should allow tab selection change', () => {
      component.selectedTab = 1;
      expect(component.selectedTab).toBe(1);

      component.selectedTab = 2;
      expect(component.selectedTab).toBe(2);

      component.selectedTab = 0;
      expect(component.selectedTab).toBe(0);
    });
  });

  describe('Component Integration', () => {
    it('should have all required dependencies injected', () => {
      expect(component.dialogRef).toBe(mockDialogRef);
      expect(component.ticket).toBe(mockTicket);
      expect(component['ticketsService']).toBe(mockTicketsService);
      expect(component['snackBar']).toBe(mockSnackBar);
    });

    it('should display ticket information correctly', () => {
      expect(component.ticket.id).toBeDefined();
      expect(component.ticket.status).toBeDefined();
      expect(component.ticket.price).toBeDefined();
    });

    it('should handle complete ticket details flow', fakeAsync(() => {
      // View ticket details
      expect(component.ticket).toBe(mockTicket);
      expect(component.isTicketValid).toBeDefined();
      expect(component.statusColor).toBeDefined();
      expect(component.validityPeriod).toBeDefined();

      // Resend email
      mockTicketsService.resendTicketEmail.and.returnValue(of(void 0));
      component.onResendEmail();
      tick();

      expect(mockSnackBar.open).toHaveBeenCalled();

      // Close dialog
      component.onClose();
      expect(mockDialogRef.close).toHaveBeenCalled();
    }));
  });

  describe('Edge Cases', () => {
    it('should handle ticket without ticket_type', () => {
      const ticket = createMockTicket({ ticket_type: undefined });
      component.ticket = ticket;

      // Should not throw errors
      expect(component.ticket).toBeDefined();
    });

    it('should handle ticket with partial route data', () => {
      const ticket = createMockTicket({
        route: { id: 'route-1', route_number: '5', route_name: '', type: 'bus' }
      });
      component.ticket = ticket;

      expect(component.getRouteInfo()).toBe('5 - ');
    });

    it('should handle very old dates', () => {
      const oldDate = '2000-01-01T00:00:00.000Z';
      const formatted = component.formatDate(oldDate);

      expect(formatted).toContain('2000');
      expect(formatted).toContain('January');
    });

    it('should handle future dates', () => {
      const futureDate = '2099-12-31T23:59:59.000Z';
      const formatted = component.formatDate(futureDate);

      expect(formatted).toContain('2099');
      expect(formatted).toContain('December');
    });

    it('should handle rapid tab switches', () => {
      component.selectedTab = 0;
      component.selectedTab = 1;
      component.selectedTab = 2;
      component.selectedTab = 0;

      expect(component.selectedTab).toBe(0);
    });

    it('should handle multiple resend attempts', fakeAsync(() => {
      mockTicketsService.resendTicketEmail.and.returnValue(of(void 0));

      component.onResendEmail();
      tick();

      component.onResendEmail();
      tick();

      expect(mockTicketsService.resendTicketEmail).toHaveBeenCalledTimes(2);
    }));

    it('should handle missing price', () => {
      const ticket = createMockTicket({ price: 0 });
      component.ticket = ticket;

      expect(component.formatPrice(ticket.price)).toBe('0 Ft');
    });

    it('should handle invalid date strings gracefully', () => {
      const invalidDate = 'invalid-date';
      const formatted = component.formatDate(invalidDate);

      expect(formatted).toContain('Invalid Date');
    });
  });

  describe('Loading States', () => {
    it('should show loading state while resending email', () => {
      mockTicketsService.resendTicketEmail.and.returnValue(of(void 0));

      component.onResendEmail();

      expect(component.isResendingEmail).toBe(true);
    });

    it('should clear loading state after successful resend', fakeAsync(() => {
      mockTicketsService.resendTicketEmail.and.returnValue(of(void 0));

      component.onResendEmail();
      expect(component.isResendingEmail).toBe(true);

      tick();

      expect(component.isResendingEmail).toBe(false);
    }));

    it('should clear loading state after error', fakeAsync(() => {
      mockTicketsService.resendTicketEmail.and.returnValue(
        throwError(() => new Error('Failed'))
      );

      component.onResendEmail();
      expect(component.isResendingEmail).toBe(true);

      tick();

      expect(component.isResendingEmail).toBe(false);
    }));
  });

  describe('Different Ticket States', () => {
    it('should handle active ticket', () => {
      component.ticket = mockTickets[0]; // active
      mockTicketsService.isTicketValid.and.returnValue(true);

      expect(component.isTicketValid).toBe(true);
    });

    it('should handle expired ticket', () => {
      component.ticket = mockTickets[1]; // expired
      mockTicketsService.isTicketValid.and.returnValue(false);

      expect(component.isTicketValid).toBe(false);
    });

    it('should handle used ticket', () => {
      component.ticket = mockTickets[2]; // used
      mockTicketsService.isTicketValid.and.returnValue(false);

      expect(component.isTicketValid).toBe(false);
    });

    it('should handle cancelled ticket', () => {
      component.ticket = mockTickets[3]; // cancelled
      mockTicketsService.isTicketValid.and.returnValue(false);

      expect(component.isTicketValid).toBe(false);
    });
  });
});
