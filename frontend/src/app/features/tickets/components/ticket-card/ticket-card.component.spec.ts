import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TicketCardComponent } from './ticket-card.component';
import { TicketsService, Ticket } from '@core/services/tickets.service';
import { MaterialModule } from '@shared/material/material.module';
import { CommonModule } from '@angular/common';
import { mockTickets, createMockTicket } from '../../testing/mock-data';

describe('TicketCardComponent', () => {
  let component: TicketCardComponent;
  let fixture: ComponentFixture<TicketCardComponent>;
  let mockTicketsService: jasmine.SpyObj<TicketsService>;

  beforeEach(async () => {
    mockTicketsService = jasmine.createSpyObj('TicketsService', [
      'isTicketValid',
      'getTicketStatusColor',
      'getValidityPeriod',
      'formatTicketTypeName'
    ]);

    // Set default return values
    mockTicketsService.isTicketValid.and.returnValue(true);
    mockTicketsService.getTicketStatusColor.and.returnValue('primary');
    mockTicketsService.getValidityPeriod.and.returnValue('1 hour');
    mockTicketsService.formatTicketTypeName.and.returnValue('Single Ticket');

    await TestBed.configureTestingModule({
      imports: [TicketCardComponent, MaterialModule, CommonModule],
      providers: [{ provide: TicketsService, useValue: mockTicketsService }]
    }).compileComponents();

    fixture = TestBed.createComponent(TicketCardComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Input Properties', () => {
    it('should accept ticket input', () => {
      const mockTicket = mockTickets[0];
      component.ticket = mockTicket;
      fixture.detectChanges();

      expect(component.ticket).toEqual(mockTicket);
    });

    it('should accept compact mode input', () => {
      component.compact = true;
      fixture.detectChanges();

      expect(component.compact).toBe(true);
    });

    it('should default compact to false', () => {
      expect(component.compact).toBe(false);
    });
  });

  describe('Output Events', () => {
    it('should emit viewDetails event when onViewDetails is called', () => {
      const mockTicket = mockTickets[0];
      component.ticket = mockTicket;

      spyOn(component.viewDetails, 'emit');
      component.onViewDetails();

      expect(component.viewDetails.emit).toHaveBeenCalledWith(mockTicket);
    });

    it('should emit cancel event when onCancel is called', () => {
      const mockTicket = mockTickets[0];
      component.ticket = mockTicket;

      spyOn(component.cancel, 'emit');
      component.onCancel();

      expect(component.cancel.emit).toHaveBeenCalledWith(mockTicket);
    });
  });

  describe('isValid getter', () => {
    it('should return true for valid ticket', () => {
      component.ticket = mockTickets[0];
      mockTicketsService.isTicketValid.and.returnValue(true);

      expect(component.isValid).toBe(true);
      expect(mockTicketsService.isTicketValid).toHaveBeenCalledWith(mockTickets[0]);
    });

    it('should return false for invalid ticket', () => {
      component.ticket = mockTickets[1];
      mockTicketsService.isTicketValid.and.returnValue(false);

      expect(component.isValid).toBe(false);
      expect(mockTicketsService.isTicketValid).toHaveBeenCalledWith(mockTickets[1]);
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
      component.ticket = mockTickets[0];
      mockTicketsService.getValidityPeriod.and.returnValue('1 hour');

      expect(component.validityPeriod).toBe('1 hour');
      expect(mockTicketsService.getValidityPeriod).toHaveBeenCalledWith(mockTickets[0]);
    });
  });

  describe('ticketTypeName getter', () => {
    it('should return ticket type name when available', () => {
      const mockTicket = createMockTicket();
      component.ticket = mockTicket;

      expect(component.ticketTypeName).toBe('Single Ticket');
    });

    it('should return "Unknown" when ticket type is not available', () => {
      const mockTicket = createMockTicket({ ticket_type: undefined });
      component.ticket = mockTicket;

      expect(component.ticketTypeName).toBe('Unknown');
    });
  });

  describe('ticketTypeDisplayName getter', () => {
    it('should return formatted type name when type is available', () => {
      const mockTicket = createMockTicket();
      component.ticket = mockTicket;
      mockTicketsService.formatTicketTypeName.and.returnValue('Single Ticket');

      expect(component.ticketTypeDisplayName).toBe('Single Ticket');
      expect(mockTicketsService.formatTicketTypeName).toHaveBeenCalledWith('single');
    });

    it('should return "Unknown Type" when ticket type is not available', () => {
      const mockTicket = createMockTicket({ ticket_type: undefined });
      component.ticket = mockTicket;

      expect(component.ticketTypeDisplayName).toBe('Unknown Type');
    });
  });

  describe('formatDate', () => {
    it('should format date correctly', () => {
      const testDate = '2025-01-15T14:30:00.000Z';
      const formatted = component.formatDate(testDate);

      expect(formatted).toContain('Jan');
      expect(formatted).toContain('15');
      expect(formatted).toContain('2025');
    });

    it('should handle different date formats', () => {
      const testDate = new Date('2025-06-20T09:15:00.000Z').toISOString();
      const formatted = component.formatDate(testDate);

      expect(formatted).toBeDefined();
      expect(formatted.length).toBeGreaterThan(0);
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

  describe('getStatusIcon', () => {
    it('should return check_circle icon for active status', () => {
      component.ticket = createMockTicket({ status: 'active' });
      expect(component.getStatusIcon()).toBe('check_circle');
    });

    it('should return schedule icon for expired status', () => {
      component.ticket = createMockTicket({ status: 'expired' });
      expect(component.getStatusIcon()).toBe('schedule');
    });

    it('should return done_all icon for used status', () => {
      component.ticket = createMockTicket({ status: 'used' });
      expect(component.getStatusIcon()).toBe('done_all');
    });

    it('should return cancel icon for cancelled status', () => {
      component.ticket = createMockTicket({ status: 'cancelled' });
      expect(component.getStatusIcon()).toBe('cancel');
    });

    it('should return help icon for unknown status', () => {
      component.ticket = createMockTicket({ status: 'invalid' as any });
      expect(component.getStatusIcon()).toBe('help');
    });
  });

  describe('getRouteInfo', () => {
    it('should return route information when route is available', () => {
      const mockTicket = mockTickets[0];
      component.ticket = mockTicket;

      expect(component.getRouteInfo()).toBe('4 - Újpest-központ - Fehérvári út');
    });

    it('should return "All Routes" when route is not available', () => {
      const mockTicket = createMockTicket({ route: undefined });
      component.ticket = mockTicket;

      expect(component.getRouteInfo()).toBe('All Routes');
    });
  });

  describe('getStopsInfo', () => {
    it('should return stops information when both stops are available', () => {
      const mockTicket = mockTickets[0];
      component.ticket = mockTicket;

      expect(component.getStopsInfo()).toBe('Deák Ferenc tér → Keleti pályaudvar');
    });

    it('should return "All Stops" when from_stop is not available', () => {
      const mockTicket = createMockTicket({ from_stop: undefined });
      component.ticket = mockTicket;

      expect(component.getStopsInfo()).toBe('All Stops');
    });

    it('should return "All Stops" when to_stop is not available', () => {
      const mockTicket = createMockTicket({ to_stop: undefined });
      component.ticket = mockTicket;

      expect(component.getStopsInfo()).toBe('All Stops');
    });

    it('should return "All Stops" when both stops are not available', () => {
      const mockTicket = createMockTicket({
        from_stop: undefined,
        to_stop: undefined
      });
      component.ticket = mockTicket;

      expect(component.getStopsInfo()).toBe('All Stops');
    });
  });

  describe('Component Initialization', () => {
    it('should have ticketsService injected', () => {
      expect(component.ticketsService).toBe(mockTicketsService);
    });

    it('should initialize with default values', () => {
      expect(component.compact).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle ticket without ticket_type gracefully', () => {
      const mockTicket = createMockTicket({ ticket_type: undefined });
      component.ticket = mockTicket;

      expect(component.ticketTypeName).toBe('Unknown');
      expect(component.ticketTypeDisplayName).toBe('Unknown Type');
    });

    it('should handle ticket with partial route data', () => {
      const mockTicket = createMockTicket({
        route: { id: 'route-1', route_number: '5', route_name: '', type: 'bus' }
      });
      component.ticket = mockTicket;

      expect(component.getRouteInfo()).toBe('5 - ');
    });

    it('should handle empty price', () => {
      expect(component.formatPrice(0)).toBe('0 Ft');
    });
  });

  describe('ngOnInit Validation', () => {
    it('should log error when no ticket object is provided', () => {
      spyOn(console, 'error');
      component.ticket = null as any;

      component.ngOnInit();

      expect(console.error).toHaveBeenCalledWith('TicketCardComponent: No ticket object provided');
    });

    it('should log error when ticket object is missing id field', () => {
      spyOn(console, 'error');
      const invalidTicket = createMockTicket();
      delete (invalidTicket as any).id;
      component.ticket = invalidTicket;

      component.ngOnInit();

      expect(console.error).toHaveBeenCalledWith(
        'TicketCardComponent: Invalid ticket object - missing id field',
        invalidTicket
      );
    });

    it('should not log errors when ticket object is valid', () => {
      spyOn(console, 'error');
      component.ticket = createMockTicket();

      component.ngOnInit();

      expect(console.error).not.toHaveBeenCalled();
    });

    it('should handle undefined ticket gracefully', () => {
      spyOn(console, 'error');
      component.ticket = undefined as any;

      component.ngOnInit();

      expect(console.error).toHaveBeenCalledWith('TicketCardComponent: No ticket object provided');
    });
  });
});
