import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { TicketPurchaseComponent } from './ticket-purchase.component';
import { TicketsService } from '@core/services/tickets.service';
import { Router, Navigation } from '@angular/router';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MaterialModule } from '@shared/material/material.module';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { mockTicketTypes, mockTickets, mockRoutes, mockStops } from '../../testing/mock-data';
import { NO_ERRORS_SCHEMA } from '@angular/core';

describe('TicketPurchaseComponent', () => {
  let component: TicketPurchaseComponent;
  let fixture: ComponentFixture<TicketPurchaseComponent>;
  let mockTicketsService: jasmine.SpyObj<TicketsService>;
  let mockDialog: jasmine.SpyObj<MatDialog>;
  let mockSnackBar: jasmine.SpyObj<MatSnackBar>;
  let mockRouter: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    mockTicketsService = jasmine.createSpyObj('TicketsService', [
      'getTicketTypes',
      'purchaseTicket'
    ]);
    mockDialog = jasmine.createSpyObj('MatDialog', ['open']);
    mockSnackBar = jasmine.createSpyObj('MatSnackBar', ['open']);
    mockRouter = jasmine.createSpyObj('Router', ['navigate', 'getCurrentNavigation']);

    // Mock navigation state
    mockRouter.getCurrentNavigation.and.returnValue(null);

    await TestBed.configureTestingModule({
      imports: [TicketPurchaseComponent, MaterialModule, CommonModule, FormsModule],
      providers: [
        { provide: TicketsService, useValue: mockTicketsService },
        { provide: MatDialog, useValue: mockDialog },
        { provide: MatSnackBar, useValue: mockSnackBar },
        { provide: Router, useValue: mockRouter }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(TicketPurchaseComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Component Initialization', () => {
    it('should initialize with default values', () => {
      expect(component.ticketTypes).toEqual([]);
      expect(component.selectedTicketType).toBeNull();
      expect(component.isLoading).toBe(false);
      expect(component.error).toBeNull();
    });

    it('should call loadTicketTypes on ngOnInit', () => {
      spyOn(component, 'loadTicketTypes');
      component.ngOnInit();
      expect(component.loadTicketTypes).toHaveBeenCalled();
    });

    it('should handle navigation state with route data', () => {
      const mockNavigation: Partial<Navigation> = {
        extras: {
          state: {
            route: mockRoutes[0],
            fromStop: mockStops[0],
            toStop: mockStops[1]
          }
        }
      };
      mockRouter.getCurrentNavigation.and.returnValue(mockNavigation as Navigation);

      const newComponent = new TicketPurchaseComponent(
        mockTicketsService,
        mockDialog,
        mockSnackBar,
        mockRouter
      );

      expect(newComponent.preselectedRoute).toEqual(mockRoutes[0]);
      expect(newComponent.preselectedFromStop).toEqual(mockStops[0]);
      expect(newComponent.preselectedToStop).toEqual(mockStops[1]);
    });

    it('should handle navigation state without route data', () => {
      mockRouter.getCurrentNavigation.and.returnValue(null);

      const newComponent = new TicketPurchaseComponent(
        mockTicketsService,
        mockDialog,
        mockSnackBar,
        mockRouter
      );

      expect(newComponent.preselectedRoute).toBeNull();
      expect(newComponent.preselectedFromStop).toBeNull();
      expect(newComponent.preselectedToStop).toBeNull();
    });
  });

  describe('loadTicketTypes', () => {
    it('should load ticket types successfully', fakeAsync(() => {
      mockTicketsService.getTicketTypes.and.returnValue(of(mockTicketTypes));

      component.loadTicketTypes();

      expect(component.isLoading).toBe(true);
      expect(component.error).toBeNull();

      tick();

      expect(mockTicketsService.getTicketTypes).toHaveBeenCalled();
      expect(component.ticketTypes).toEqual(mockTicketTypes);
      expect(component.isLoading).toBe(false);
    }));

    it('should handle error when loading ticket types fails', fakeAsync(() => {
      const errorResponse = { status: 500, message: 'Server error' };
      mockTicketsService.getTicketTypes.and.returnValue(throwError(() => errorResponse));

      component.loadTicketTypes();

      expect(component.isLoading).toBe(true);

      tick();

      expect(component.error).toBe('Failed to load ticket types. Please try again.');
      expect(component.isLoading).toBe(false);
      expect(component.ticketTypes).toEqual([]);
    }));

    it('should reset error on new load attempt', () => {
      component.error = 'Previous error';
      mockTicketsService.getTicketTypes.and.returnValue(of([]));

      component.loadTicketTypes();

      expect(component.error).toBeNull();
    });
  });

  describe('onTicketTypeSelected', () => {
    it('should set selected ticket type', () => {
      const ticketType = mockTicketTypes[0];

      component.onTicketTypeSelected(ticketType);

      expect(component.selectedTicketType).toEqual(ticketType);
    });

    it('should allow changing ticket type selection', () => {
      component.onTicketTypeSelected(mockTicketTypes[0]);
      expect(component.selectedTicketType).toEqual(mockTicketTypes[0]);

      component.onTicketTypeSelected(mockTicketTypes[1]);
      expect(component.selectedTicketType).toEqual(mockTicketTypes[1]);
    });
  });

  describe('onProceedToPayment', () => {
    it('should show error when no ticket type is selected', () => {
      component.selectedTicketType = null;

      component.onProceedToPayment();

      expect(mockSnackBar.open).toHaveBeenCalledWith(
        'Please select a ticket type',
        'Close',
        jasmine.any(Object)
      );
      expect(mockDialog.open).not.toHaveBeenCalled();
    });

    it('should open payment dialog with selected ticket type', () => {
      const mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      mockDialogRef.afterClosed.and.returnValue(of({ success: false }));
      mockDialog.open.and.returnValue(mockDialogRef);

      component.selectedTicketType = mockTicketTypes[0];

      component.onProceedToPayment();

      expect(mockDialog.open).toHaveBeenCalled();
      const callArgs = mockDialog.open.calls.mostRecent().args;
      expect((callArgs[1] as any)?.data?.ticketType).toEqual(mockTicketTypes[0]);
      expect(callArgs[1]?.width).toBe('600px');
      expect((callArgs[1] as any)?.disableClose).toBe(true);
    });

    it('should include route data in payment dialog', () => {
      const mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      mockDialogRef.afterClosed.and.returnValue(of({ success: false }));
      mockDialog.open.and.returnValue(mockDialogRef);

      component.selectedTicketType = mockTicketTypes[0];
      component.preselectedRoute = mockRoutes[0];
      component.preselectedFromStop = mockStops[0];
      component.preselectedToStop = mockStops[1];

      component.onProceedToPayment();

      const callArgs = mockDialog.open.calls.mostRecent().args;
      const paymentData = (callArgs[1] as any)?.data;
      expect(paymentData?.routeId).toBe(mockRoutes[0].id);
      expect(paymentData?.fromStopId).toBe(mockStops[0].id);
      expect(paymentData?.toStopId).toBe(mockStops[1].id);
    });

    it('should purchase ticket after successful payment', fakeAsync(() => {
      const mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      mockDialogRef.afterClosed.and.returnValue(of({ success: true }));
      mockDialog.open.and.returnValue(mockDialogRef);
      mockTicketsService.purchaseTicket.and.returnValue(of(mockTickets[0]));

      component.selectedTicketType = mockTicketTypes[0];

      component.onProceedToPayment();
      tick();

      expect(mockTicketsService.purchaseTicket).toHaveBeenCalled();
    }));

    it('should not purchase ticket when payment is cancelled', fakeAsync(() => {
      const mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      mockDialogRef.afterClosed.and.returnValue(of({ success: false }));
      mockDialog.open.and.returnValue(mockDialogRef);

      component.selectedTicketType = mockTicketTypes[0];

      component.onProceedToPayment();
      tick();

      expect(mockTicketsService.purchaseTicket).not.toHaveBeenCalled();
    }));
  });

  describe('purchaseTicket', () => {
    beforeEach(() => {
      component.selectedTicketType = mockTicketTypes[0];
    });

    it('should purchase ticket successfully', fakeAsync(() => {
      mockTicketsService.purchaseTicket.and.returnValue(of(mockTickets[0]));

      component['purchaseTicket']();

      expect(component.isLoading).toBe(true);

      tick();

      expect(mockTicketsService.purchaseTicket).toHaveBeenCalled();
      expect(mockSnackBar.open).toHaveBeenCalledWith(
        'Ticket purchased successfully!',
        'Close',
        jasmine.any(Object)
      );
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/tickets/my-tickets']);
      expect(component.isLoading).toBe(false);
    }));

    it('should handle purchase error', fakeAsync(() => {
      const errorResponse = {
        error: { message: 'Insufficient funds' }
      };
      mockTicketsService.purchaseTicket.and.returnValue(throwError(() => errorResponse));

      component['purchaseTicket']();

      tick();

      expect(mockSnackBar.open).toHaveBeenCalledWith(
        'Insufficient funds',
        'Close',
        jasmine.any(Object)
      );
      expect(mockRouter.navigate).not.toHaveBeenCalled();
      expect(component.isLoading).toBe(false);
    }));

    it('should handle purchase error without message', fakeAsync(() => {
      mockTicketsService.purchaseTicket.and.returnValue(
        throwError(() => ({ status: 500 }))
      );

      component['purchaseTicket']();

      tick();

      expect(mockSnackBar.open).toHaveBeenCalledWith(
        'Failed to purchase ticket. Please try again.',
        'Close',
        jasmine.any(Object)
      );
    }));

    it('should include route and stop data in purchase DTO', fakeAsync(() => {
      component.preselectedRoute = mockRoutes[0];
      component.preselectedFromStop = mockStops[0];
      component.preselectedToStop = mockStops[1];
      mockTicketsService.purchaseTicket.and.returnValue(of(mockTickets[0]));

      component['purchaseTicket']();

      tick();

      const purchaseDto = mockTicketsService.purchaseTicket.calls.mostRecent().args[0];
      expect(purchaseDto.route_id).toBe(mockRoutes[0].id);
      expect(purchaseDto.from_stop_id).toBe(mockStops[0].id);
      expect(purchaseDto.to_stop_id).toBe(mockStops[1].id);
    }));

    it('should not purchase if no ticket type is selected', () => {
      component.selectedTicketType = null;

      component['purchaseTicket']();

      expect(mockTicketsService.purchaseTicket).not.toHaveBeenCalled();
    });
  });

  describe('onCancel', () => {
    it('should navigate to my tickets page', () => {
      component.onCancel();

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/tickets/my-tickets']);
    });
  });

  describe('totalPrice getter', () => {
    it('should return ticket price when type is selected', () => {
      component.selectedTicketType = mockTicketTypes[0];

      expect(component.totalPrice).toBe(mockTicketTypes[0].price);
    });

    it('should return 0 when no ticket type is selected', () => {
      component.selectedTicketType = null;

      expect(component.totalPrice).toBe(0);
    });

    it('should handle different ticket prices', () => {
      mockTicketTypes.forEach((ticketType) => {
        component.selectedTicketType = ticketType;
        expect(component.totalPrice).toBe(ticketType.price);
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
  });

  describe('hasPreselectedRoute getter', () => {
    it('should return true when route is preselected', () => {
      component.preselectedRoute = mockRoutes[0];

      expect(component.hasPreselectedRoute).toBe(true);
    });

    it('should return false when route is not preselected', () => {
      component.preselectedRoute = null;

      expect(component.hasPreselectedRoute).toBe(false);
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

  describe('Complete Purchase Flow', () => {
    it('should complete full purchase flow successfully', fakeAsync(() => {
      // Load ticket types
      mockTicketsService.getTicketTypes.and.returnValue(of(mockTicketTypes));
      component.ngOnInit();
      tick();

      // Select ticket type
      component.onTicketTypeSelected(mockTicketTypes[0]);

      // Proceed to payment
      const mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      mockDialogRef.afterClosed.and.returnValue(of({ success: true }));
      mockDialog.open.and.returnValue(mockDialogRef);
      mockTicketsService.purchaseTicket.and.returnValue(of(mockTickets[0]));

      component.onProceedToPayment();
      tick();

      // Verify full flow
      expect(mockTicketsService.getTicketTypes).toHaveBeenCalled();
      expect(component.selectedTicketType).toEqual(mockTicketTypes[0]);
      expect(mockDialog.open).toHaveBeenCalled();
      expect(mockTicketsService.purchaseTicket).toHaveBeenCalled();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/tickets/my-tickets']);
    }));
  });

  describe('Edge Cases', () => {
    it('should handle empty ticket types array', fakeAsync(() => {
      mockTicketsService.getTicketTypes.and.returnValue(of([]));

      component.loadTicketTypes();
      tick();

      expect(component.ticketTypes.length).toBe(0);
    }));

    it('should handle rapid ticket type selection changes', () => {
      mockTicketTypes.forEach((type) => {
        component.onTicketTypeSelected(type);
        expect(component.selectedTicketType).toEqual(type);
      });
    });

    it('should handle navigation state with partial data', () => {
      const mockNavigation: Partial<Navigation> = {
        extras: {
          state: {
            route: mockRoutes[0]
            // Missing fromStop and toStop
          }
        }
      };
      mockRouter.getCurrentNavigation.and.returnValue(mockNavigation as Navigation);

      const newComponent = new TicketPurchaseComponent(
        mockTicketsService,
        mockDialog,
        mockSnackBar,
        mockRouter
      );

      expect(newComponent.preselectedRoute).toEqual(mockRoutes[0]);
      expect(newComponent.preselectedFromStop).toBeUndefined();
      expect(newComponent.preselectedToStop).toBeUndefined();
    });

    it('should handle concurrent purchase attempts', fakeAsync(() => {
      component.selectedTicketType = mockTicketTypes[0];
      mockTicketsService.purchaseTicket.and.returnValue(of(mockTickets[0]));

      component['purchaseTicket']();
      component['purchaseTicket']();

      tick();

      // Should handle gracefully
      expect(mockTicketsService.purchaseTicket).toHaveBeenCalledTimes(2);
    }));
  });
});
