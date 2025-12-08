import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { MyTicketsComponent, ConfirmCancelDialogComponent } from './my-tickets.component';
import { TicketsService } from '@core/services/tickets.service';
import { Router } from '@angular/router';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MaterialModule } from '@shared/material/material.module';
import { CommonModule } from '@angular/common';
import { of, throwError } from 'rxjs';
import { mockTickets } from '../../testing/mock-data';
import { NO_ERRORS_SCHEMA } from '@angular/core';

describe('MyTicketsComponent', () => {
  let component: MyTicketsComponent;
  let fixture: ComponentFixture<MyTicketsComponent>;
  let mockTicketsService: jasmine.SpyObj<TicketsService>;
  let mockDialog: jasmine.SpyObj<MatDialog>;
  let mockSnackBar: jasmine.SpyObj<MatSnackBar>;
  let mockRouter: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    mockTicketsService = jasmine.createSpyObj('TicketsService', [
      'getMyTickets',
      'cancelTicket'
    ]);
    mockDialog = jasmine.createSpyObj('MatDialog', ['open']);
    mockSnackBar = jasmine.createSpyObj('MatSnackBar', ['open']);
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [MyTicketsComponent, MaterialModule, CommonModule],
      providers: [
        { provide: TicketsService, useValue: mockTicketsService },
        { provide: MatDialog, useValue: mockDialog },
        { provide: MatSnackBar, useValue: mockSnackBar },
        { provide: Router, useValue: mockRouter }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(MyTicketsComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Component Initialization', () => {
    it('should initialize with default values', () => {
      expect(component.tickets).toEqual([]);
      expect(component.filteredTickets).toEqual([]);
      expect(component.isLoading).toBe(false);
      expect(component.error).toBeNull();
      expect(component.selectedFilter).toBe('all');
    });

    it('should have filters array defined', () => {
      expect(component.filters).toBeDefined();
      expect(component.filters.length).toBe(5);
      expect(component.filters[0].value).toBe('all');
    });

    it('should call loadTickets on ngOnInit', () => {
      spyOn(component, 'loadTickets');
      component.ngOnInit();
      expect(component.loadTickets).toHaveBeenCalled();
    });
  });

  describe('loadTickets', () => {
    it('should load tickets successfully', fakeAsync(() => {
      mockTicketsService.getMyTickets.and.returnValue(of(mockTickets));

      component.loadTickets();

      expect(component.isLoading).toBe(true);
      expect(component.error).toBeNull();

      tick();

      expect(mockTicketsService.getMyTickets).toHaveBeenCalled();
      expect(component.tickets).toEqual(mockTickets);
      expect(component.isLoading).toBe(false);
      expect(component.filteredTickets.length).toBeGreaterThan(0);
    }));

    it('should handle error when loading tickets fails', fakeAsync(() => {
      const errorResponse = { status: 500, message: 'Server error' };
      mockTicketsService.getMyTickets.and.returnValue(throwError(() => errorResponse));

      component.loadTickets();

      expect(component.isLoading).toBe(true);

      tick();

      expect(component.error).toBe('Failed to load tickets. Please try again.');
      expect(component.isLoading).toBe(false);
    }));

    it('should apply filter after loading tickets', fakeAsync(() => {
      mockTicketsService.getMyTickets.and.returnValue(of(mockTickets));
      spyOn(component, 'applyFilter');

      component.loadTickets();
      tick();

      expect(component.applyFilter).toHaveBeenCalled();
    }));

    it('should reset error on new load attempt', () => {
      component.error = 'Previous error';
      mockTicketsService.getMyTickets.and.returnValue(of([]));

      component.loadTickets();

      expect(component.error).toBeNull();
    });
  });

  describe('Filter Functionality', () => {
    beforeEach(() => {
      component.tickets = mockTickets;
    });

    it('should show all tickets when filter is "all"', () => {
      component.selectedFilter = 'all';
      component.applyFilter();

      expect(component.filteredTickets.length).toBe(mockTickets.length);
      expect(component.filteredTickets).toEqual(mockTickets);
    });

    it('should filter active tickets', () => {
      component.selectedFilter = 'active';
      component.applyFilter();

      const activeTickets = component.filteredTickets.filter(t => t.status === 'active');
      expect(component.filteredTickets.length).toBe(activeTickets.length);
      expect(component.filteredTickets.every(t => t.status === 'active')).toBe(true);
    });

    it('should filter expired tickets', () => {
      component.selectedFilter = 'expired';
      component.applyFilter();

      expect(component.filteredTickets.every(t => t.status === 'expired')).toBe(true);
    });

    it('should filter used tickets', () => {
      component.selectedFilter = 'used';
      component.applyFilter();

      expect(component.filteredTickets.every(t => t.status === 'used')).toBe(true);
    });

    it('should filter cancelled tickets', () => {
      component.selectedFilter = 'cancelled';
      component.applyFilter();

      expect(component.filteredTickets.every(t => t.status === 'cancelled')).toBe(true);
    });

    it('should handle empty results when filtering', () => {
      component.tickets = [mockTickets[0]]; // Only active ticket
      component.selectedFilter = 'cancelled';
      component.applyFilter();

      expect(component.filteredTickets.length).toBe(0);
    });
  });

  describe('onFilterChange', () => {
    beforeEach(() => {
      component.tickets = mockTickets;
    });

    it('should update selectedFilter and apply filter', () => {
      spyOn(component, 'applyFilter');

      component.onFilterChange('active');

      expect(component.selectedFilter).toBe('active');
      expect(component.applyFilter).toHaveBeenCalled();
    });

    it('should handle multiple filter changes', () => {
      component.onFilterChange('active');
      expect(component.selectedFilter).toBe('active');

      component.onFilterChange('expired');
      expect(component.selectedFilter).toBe('expired');

      component.onFilterChange('all');
      expect(component.selectedFilter).toBe('all');
    });
  });

  describe('onViewDetails', () => {
    it('should open ticket details dialog', () => {
      const ticket = mockTickets[0];
      const mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      mockDialog.open.and.returnValue(mockDialogRef);

      component.onViewDetails(ticket);

      expect(mockDialog.open).toHaveBeenCalled();
      const callArgs = mockDialog.open.calls.mostRecent().args;
      expect(callArgs[1]?.data).toEqual(ticket);
      expect(callArgs[1]?.width).toBe('800px');
    });
  });

  describe('onCancelTicket', () => {
    it('should open confirmation dialog', () => {
      const ticket = mockTickets[0];
      const mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      mockDialogRef.afterClosed.and.returnValue(of(false));
      mockDialog.open.and.returnValue(mockDialogRef);

      component.onCancelTicket(ticket);

      expect(mockDialog.open).toHaveBeenCalledWith(
        ConfirmCancelDialogComponent,
        jasmine.objectContaining({
          width: '400px',
          data: ticket
        })
      );
    });

    it('should cancel ticket when confirmed', fakeAsync(() => {
      const ticket = mockTickets[0];
      const mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      mockDialogRef.afterClosed.and.returnValue(of(true));
      mockDialog.open.and.returnValue(mockDialogRef);
      mockTicketsService.cancelTicket.and.returnValue(of(void 0));
      mockTicketsService.getMyTickets.and.returnValue(of(mockTickets));

      component.onCancelTicket(ticket);
      tick();

      expect(mockTicketsService.cancelTicket).toHaveBeenCalledWith(ticket.id);
      expect(mockSnackBar.open).toHaveBeenCalledWith(
        'Ticket cancelled successfully',
        'Close',
        jasmine.any(Object)
      );
    }));

    it('should not cancel ticket when not confirmed', fakeAsync(() => {
      const ticket = mockTickets[0];
      const mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      mockDialogRef.afterClosed.and.returnValue(of(false));
      mockDialog.open.and.returnValue(mockDialogRef);

      component.onCancelTicket(ticket);
      tick();

      expect(mockTicketsService.cancelTicket).not.toHaveBeenCalled();
    }));

    it('should handle cancel error', fakeAsync(() => {
      const ticket = mockTickets[0];
      const mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      mockDialogRef.afterClosed.and.returnValue(of(true));
      mockDialog.open.and.returnValue(mockDialogRef);
      mockTicketsService.cancelTicket.and.returnValue(
        throwError(() => ({ error: { message: 'Cancel failed' } }))
      );

      component.onCancelTicket(ticket);
      tick();

      expect(mockSnackBar.open).toHaveBeenCalledWith(
        'Failed to cancel ticket. Please try again.',
        'Close',
        jasmine.any(Object)
      );
    }));

    it('should reload tickets after successful cancellation', fakeAsync(() => {
      const ticket = mockTickets[0];
      const mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      mockDialogRef.afterClosed.and.returnValue(of(true));
      mockDialog.open.and.returnValue(mockDialogRef);
      mockTicketsService.cancelTicket.and.returnValue(of(void 0));
      mockTicketsService.getMyTickets.and.returnValue(of(mockTickets));

      component.onCancelTicket(ticket);
      tick();

      expect(mockTicketsService.getMyTickets).toHaveBeenCalled();
    }));
  });

  describe('onPurchaseTicket', () => {
    it('should navigate to purchase page', () => {
      component.onPurchaseTicket();

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/tickets/purchase']);
    });
  });

  describe('Statistics Getters', () => {
    beforeEach(() => {
      component.tickets = mockTickets;
    });

    it('should calculate active tickets count', () => {
      const activeCount = mockTickets.filter(t => t.status === 'active').length;
      expect(component.activeTicketsCount).toBe(activeCount);
    });

    it('should calculate expired tickets count', () => {
      const expiredCount = mockTickets.filter(t => t.status === 'expired').length;
      expect(component.expiredTicketsCount).toBe(expiredCount);
    });

    it('should calculate total spent', () => {
      const totalSpent = mockTickets.reduce((sum, t) => sum + t.price, 0);
      expect(component.totalSpent).toBe(totalSpent);
    });

    it('should return 0 for active tickets when none exist', () => {
      component.tickets = [mockTickets[1]]; // Expired ticket only
      expect(component.activeTicketsCount).toBe(0);
    });

    it('should return 0 for total spent when no tickets', () => {
      component.tickets = [];
      expect(component.totalSpent).toBe(0);
    });
  });

  describe('getFilteredTicketCount', () => {
    beforeEach(() => {
      component.tickets = mockTickets;
    });

    it('should return count for active status', () => {
      const activeCount = mockTickets.filter(t => t.status === 'active').length;
      expect(component.getFilteredTicketCount('active')).toBe(activeCount);
    });

    it('should return count for expired status', () => {
      const expiredCount = mockTickets.filter(t => t.status === 'expired').length;
      expect(component.getFilteredTicketCount('expired')).toBe(expiredCount);
    });

    it('should return 0 for status with no tickets', () => {
      component.tickets = [mockTickets[0]]; // Only active
      expect(component.getFilteredTicketCount('used')).toBe(0);
    });
  });

  describe('ngOnDestroy', () => {
    it('should complete destroy$ subject', () => {
      spyOn(component['destroy$'], 'next');
      spyOn(component['destroy$'], 'complete');

      component.ngOnDestroy();

      expect(component['destroy$'].next).toHaveBeenCalled();
      expect(component['destroy$'].complete).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty tickets array', () => {
      mockTicketsService.getMyTickets.and.returnValue(of([]));

      component.ngOnInit();
      fixture.detectChanges();

      expect(component.tickets.length).toBe(0);
      expect(component.filteredTickets.length).toBe(0);
    });

    it('should handle rapid filter changes', () => {
      component.tickets = mockTickets;

      component.onFilterChange('active');
      component.onFilterChange('expired');
      component.onFilterChange('used');
      component.onFilterChange('all');

      expect(component.selectedFilter).toBe('all');
      expect(component.filteredTickets.length).toBe(mockTickets.length);
    });

    it('should maintain data integrity across multiple loads', fakeAsync(() => {
      mockTicketsService.getMyTickets.and.returnValue(of(mockTickets));

      component.loadTickets();
      tick();
      const firstLoadCount = component.tickets.length;

      component.loadTickets();
      tick();

      expect(component.tickets.length).toBe(firstLoadCount);
    }));

    it('should handle concurrent operations', fakeAsync(() => {
      const ticket = mockTickets[0];
      const mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      mockDialogRef.afterClosed.and.returnValue(of(true));
      mockDialog.open.and.returnValue(mockDialogRef);
      mockTicketsService.cancelTicket.and.returnValue(of(void 0));
      mockTicketsService.getMyTickets.and.returnValue(of(mockTickets));

      component.tickets = mockTickets;
      component.onCancelTicket(ticket);
      component.onFilterChange('active');

      tick();

      expect(component.selectedFilter).toBe('active');
    }));
  });
});

describe('ConfirmCancelDialogComponent', () => {
  let component: ConfirmCancelDialogComponent;
  let fixture: ComponentFixture<ConfirmCancelDialogComponent>;
  const mockTicket = mockTickets[0];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfirmCancelDialogComponent, MaterialModule, CommonModule],
      providers: [
        { provide: MatDialogRef, useValue: {} },
        { provide: 'MAT_DIALOG_DATA', useValue: mockTicket }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ConfirmCancelDialogComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should receive ticket data', () => {
    expect(component.data).toEqual(mockTicket);
  });
});
