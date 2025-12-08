import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TicketsService, TicketType, Ticket, PurchaseTicketDto } from './tickets.service';
import { environment } from '@environments/environment';

describe('TicketsService', () => {
  let service: TicketsService;
  let httpMock: HttpTestingController;

  const mockTicketType: TicketType = {
    id: '1',
    name: 'Single Ticket',
    description: 'Valid for one journey',
    type: 'single',
    price: 350,
    validity_hours: 1,
    is_active: true
  };

  const mockTicket: Ticket = {
    id: 'ticket-1',
    user_id: 'user-1',
    ticket_type_id: '1',
    ticket_type: mockTicketType,
    qr_code: 'qr-code-data',
    purchase_date: '2025-01-01T10:00:00Z',
    valid_from: '2025-01-01T10:00:00Z',
    valid_until: '2025-01-01T11:00:00Z',
    status: 'active',
    price: 350,
    created_at: '2025-01-01T10:00:00Z',
    updated_at: '2025-01-01T10:00:00Z'
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [TicketsService]
    });
    service = TestBed.inject(TicketsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getTicketTypes', () => {
    it('should retrieve ticket types', () => {
      const mockTicketTypes: TicketType[] = [mockTicketType];

      service.getTicketTypes().subscribe(types => {
        expect(types).toEqual(mockTicketTypes);
        expect(types.length).toBe(1);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/ticket-types`);
      expect(req.request.method).toBe('GET');
      req.flush(mockTicketTypes);
    });
  });

  describe('getAllTicketTypes', () => {
    it('should retrieve all ticket types including inactive', () => {
      const mockTicketTypes: TicketType[] = [
        mockTicketType,
        { ...mockTicketType, id: '2', is_active: false }
      ];

      service.getAllTicketTypes().subscribe(types => {
        expect(types).toEqual(mockTicketTypes);
        expect(types.length).toBe(2);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/ticket-types/all`);
      expect(req.request.method).toBe('GET');
      req.flush(mockTicketTypes);
    });
  });

  describe('getTicketTypeById', () => {
    it('should retrieve a specific ticket type', () => {
      service.getTicketTypeById('1').subscribe(type => {
        expect(type).toEqual(mockTicketType);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/ticket-types/1`);
      expect(req.request.method).toBe('GET');
      req.flush(mockTicketType);
    });
  });

  describe('purchaseTicket', () => {
    it('should purchase a ticket', () => {
      const dto: PurchaseTicketDto = {
        ticket_type_id: '1',
        valid_from: '2025-01-01T10:00:00Z'
      };

      service.purchaseTicket(dto).subscribe(ticket => {
        expect(ticket).toEqual(mockTicket);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/tickets/purchase`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(dto);
      req.flush(mockTicket);
    });
  });

  describe('getMyTickets', () => {
    it('should retrieve user tickets without filter', () => {
      const mockTickets: Ticket[] = [mockTicket];

      service.getMyTickets().subscribe(tickets => {
        expect(tickets).toEqual(mockTickets);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/tickets/my-tickets`);
      expect(req.request.method).toBe('GET');
      req.flush(mockTickets);
    });

    it('should retrieve user tickets with status filter', () => {
      const mockTickets: Ticket[] = [mockTicket];

      service.getMyTickets('active').subscribe(tickets => {
        expect(tickets).toEqual(mockTickets);
      });

      const req = httpMock.expectOne(
        req => req.url === `${environment.apiUrl}/tickets/my-tickets` && req.params.get('status') === 'active'
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockTickets);
    });
  });

  describe('getMyActiveTickets', () => {
    it('should retrieve only active tickets', () => {
      const mockTickets: Ticket[] = [mockTicket];

      service.getMyActiveTickets().subscribe(tickets => {
        expect(tickets).toEqual(mockTickets);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/tickets/my-tickets/active`);
      expect(req.request.method).toBe('GET');
      req.flush(mockTickets);
    });
  });

  describe('getTicketById', () => {
    it('should retrieve a specific ticket', () => {
      service.getTicketById('ticket-1').subscribe(ticket => {
        expect(ticket).toEqual(mockTicket);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/tickets/ticket-1`);
      expect(req.request.method).toBe('GET');
      req.flush(mockTicket);
    });
  });

  describe('getTicketQRCode', () => {
    it('should retrieve QR code as blob', () => {
      const mockBlob = new Blob(['qr-code-data'], { type: 'image/png' });

      service.getTicketQRCode('ticket-1').subscribe(blob => {
        expect(blob).toEqual(mockBlob);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/tickets/ticket-1/qr-code`);
      expect(req.request.method).toBe('GET');
      expect(req.request.responseType).toBe('blob');
      req.flush(mockBlob);
    });
  });

  describe('resendTicketEmail', () => {
    it('should resend ticket email', () => {
      service.resendTicketEmail('ticket-1').subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/tickets/ticket-1/send-email`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({});
      req.flush(null);
    });
  });

  describe('cancelTicket', () => {
    it('should cancel a ticket', () => {
      service.cancelTicket('ticket-1').subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/tickets/ticket-1`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });
  });

  describe('isTicketValid', () => {
    it('should return true for valid active ticket', () => {
      const validTicket: Ticket = {
        ...mockTicket,
        status: 'active',
        valid_from: new Date(Date.now() - 1000).toISOString(),
        valid_until: new Date(Date.now() + 1000).toISOString()
      };

      expect(service.isTicketValid(validTicket)).toBe(true);
    });

    it('should return false for expired ticket', () => {
      const expiredTicket: Ticket = {
        ...mockTicket,
        status: 'expired'
      };

      expect(service.isTicketValid(expiredTicket)).toBe(false);
    });

    it('should return false for ticket with future valid_from date', () => {
      const futureTicket: Ticket = {
        ...mockTicket,
        status: 'active',
        valid_from: new Date(Date.now() + 10000).toISOString()
      };

      expect(service.isTicketValid(futureTicket)).toBe(false);
    });

    it('should return false for ticket with past valid_until date', () => {
      const pastTicket: Ticket = {
        ...mockTicket,
        status: 'active',
        valid_from: new Date(Date.now() - 2000).toISOString(),
        valid_until: new Date(Date.now() - 1000).toISOString()
      };

      expect(service.isTicketValid(pastTicket)).toBe(false);
    });
  });

  describe('getTicketStatusColor', () => {
    it('should return correct color for active status', () => {
      expect(service.getTicketStatusColor('active')).toBe('primary');
    });

    it('should return correct color for expired status', () => {
      expect(service.getTicketStatusColor('expired')).toBe('warn');
    });

    it('should return correct color for used status', () => {
      expect(service.getTicketStatusColor('used')).toBe('accent');
    });

    it('should return correct color for cancelled status', () => {
      expect(service.getTicketStatusColor('cancelled')).toBe('basic');
    });
  });

  describe('formatTicketTypeName', () => {
    it('should format single ticket type', () => {
      expect(service.formatTicketTypeName('single')).toBe('Single Ticket');
    });

    it('should format return ticket type', () => {
      expect(service.formatTicketTypeName('return')).toBe('Return Ticket');
    });

    it('should format day pass type', () => {
      expect(service.formatTicketTypeName('day')).toBe('Day Pass');
    });

    it('should format monthly pass type', () => {
      expect(service.formatTicketTypeName('monthly')).toBe('Monthly Pass');
    });

    it('should format yearly pass type', () => {
      expect(service.formatTicketTypeName('yearly')).toBe('Yearly Pass');
    });
  });

  describe('getValidityPeriod', () => {
    it('should return "Unlimited" for ticket without valid_until', () => {
      const ticket: Ticket = { ...mockTicket, valid_until: undefined };
      expect(service.getValidityPeriod(ticket)).toBe('Unlimited');
    });

    it('should return hours for short validity', () => {
      const ticket: Ticket = {
        ...mockTicket,
        valid_from: '2025-01-01T10:00:00Z',
        valid_until: '2025-01-01T12:00:00Z'
      };
      expect(service.getValidityPeriod(ticket)).toContain('hours');
    });

    it('should return days for medium validity', () => {
      const ticket: Ticket = {
        ...mockTicket,
        valid_from: '2025-01-01T10:00:00Z',
        valid_until: '2025-01-03T10:00:00Z'
      };
      expect(service.getValidityPeriod(ticket)).toContain('days');
    });
  });
});
