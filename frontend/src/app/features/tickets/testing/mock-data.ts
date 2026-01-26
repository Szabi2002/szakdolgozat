import { Ticket, TicketType, Route, Stop } from '@core/services/tickets.service';

/**
 * Mock ticket types for testing
 */
export const mockTicketTypes: TicketType[] = [
  {
    id: 'type-single-1',
    name: 'Vonaljegy',
    description: 'Érvényes egy utazásra átszállás nélkül',
    type: 'single',
    price: 350,
    validity_hours: 1,
    is_active: true,
    created_at: '2025-01-01T00:00:00.000Z',
    updated_at: '2025-01-01T00:00:00.000Z'
  },
  {
    id: 'type-return-1',
    name: 'Menettérti jegy',
    description: 'Érvényes oda-vissza utazásra',
    type: 'return',
    price: 600,
    validity_hours: 24,
    is_active: true,
    created_at: '2025-01-01T00:00:00.000Z',
    updated_at: '2025-01-01T00:00:00.000Z'
  },
  {
    id: 'type-day-1',
    name: 'Napijegy',
    description: 'Korlátlan utazás 24 órán keresztül',
    type: 'day',
    price: 1650,
    validity_hours: 24,
    is_active: true,
    created_at: '2025-01-01T00:00:00.000Z',
    updated_at: '2025-01-01T00:00:00.000Z'
  },
  {
    id: 'type-monthly-1',
    name: 'Havi bérlet',
    description: 'Korlátlan utazás 30 napig',
    type: 'monthly',
    price: 9500,
    validity_hours: 720,
    is_active: true,
    created_at: '2025-01-01T00:00:00.000Z',
    updated_at: '2025-01-01T00:00:00.000Z'
  },
  {
    id: 'type-yearly-1',
    name: 'Éves bérlet',
    description: 'Korlátlan utazás 365 napig',
    type: 'yearly',
    price: 99000,
    validity_hours: 8760,
    is_active: true,
    created_at: '2025-01-01T00:00:00.000Z',
    updated_at: '2025-01-01T00:00:00.000Z'
  }
];

/**
 * Mock stops for testing
 */
export const mockStops: Stop[] = [
  {
    id: 'stop-1',
    name: 'Deák Ferenc tér',
    latitude: 47.4979,
    longitude: 19.0542
  },
  {
    id: 'stop-2',
    name: 'Keleti pályaudvar',
    latitude: 47.5000,
    longitude: 19.0833
  },
  {
    id: 'stop-3',
    name: 'Nyugati pályaudvar',
    latitude: 47.5108,
    longitude: 19.0575
  }
];

/**
 * Mock routes for testing
 */
export const mockRoutes: Route[] = [
  {
    id: 'route-1',
    route_number: '4',
    route_name: 'Újpest-központ - Fehérvári út',
    type: 'tram'
  },
  {
    id: 'route-2',
    route_number: '7',
    route_name: 'Bosnyák tér - Közvágóhíd',
    type: 'bus'
  },
  {
    id: 'route-3',
    route_number: 'M2',
    route_name: 'Déli pályaudvar - Örs vezér tere',
    type: 'metro'
  }
];

/**
 * Mock tickets for testing
 */
export const mockTickets: Ticket[] = [
  {
    id: 'ticket-active-1',
    user_id: 'user-123',
    ticket_type_id: 'type-single-1',
    ticket_type: mockTicketTypes[0],
    route_id: 'route-1',
    route: mockRoutes[0],
    from_stop_id: 'stop-1',
    from_stop: mockStops[0],
    to_stop_id: 'stop-2',
    to_stop: mockStops[1],
    qr_code: 'QR-ACTIVE-1',
    purchase_date: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
    valid_from: new Date(Date.now() - 1800000).toISOString(), // 30 min ago
    valid_until: new Date(Date.now() + 1800000).toISOString(), // 30 min from now
    status: 'active',
    price: 350,
    created_at: new Date(Date.now() - 3600000).toISOString(),
    updated_at: new Date(Date.now() - 3600000).toISOString()
  },
  {
    id: 'ticket-expired-1',
    user_id: 'user-123',
    ticket_type_id: 'type-single-1',
    ticket_type: mockTicketTypes[0],
    route_id: 'route-2',
    route: mockRoutes[1],
    qr_code: 'QR-EXPIRED-1',
    purchase_date: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
    valid_from: new Date(Date.now() - 7200000).toISOString(),
    valid_until: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
    status: 'expired',
    price: 350,
    created_at: new Date(Date.now() - 7200000).toISOString(),
    updated_at: new Date(Date.now() - 7200000).toISOString()
  },
  {
    id: 'ticket-used-1',
    user_id: 'user-123',
    ticket_type_id: 'type-return-1',
    ticket_type: mockTicketTypes[1],
    qr_code: 'QR-USED-1',
    purchase_date: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    valid_from: new Date(Date.now() - 86400000).toISOString(),
    valid_until: new Date(Date.now() + 3600000).toISOString(),
    status: 'used',
    price: 600,
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date(Date.now() - 86400000).toISOString()
  },
  {
    id: 'ticket-cancelled-1',
    user_id: 'user-123',
    ticket_type_id: 'type-day-1',
    ticket_type: mockTicketTypes[2],
    qr_code: 'QR-CANCELLED-1',
    purchase_date: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
    valid_from: new Date(Date.now() - 172800000).toISOString(),
    valid_until: new Date(Date.now() - 86400000).toISOString(),
    status: 'refunded',
    price: 1650,
    created_at: new Date(Date.now() - 172800000).toISOString(),
    updated_at: new Date(Date.now() - 172800000).toISOString()
  },
  {
    id: 'ticket-monthly-active',
    user_id: 'user-123',
    ticket_type_id: 'type-monthly-1',
    ticket_type: mockTicketTypes[3],
    qr_code: 'QR-MONTHLY-1',
    purchase_date: new Date(Date.now() - 86400000).toISOString(),
    valid_from: new Date(Date.now() - 86400000).toISOString(),
    valid_until: new Date(Date.now() + 2505600000).toISOString(), // ~29 days from now
    status: 'active',
    price: 9500,
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date(Date.now() - 86400000).toISOString()
  }
];

/**
 * Helper to create a single mock ticket
 */
export function createMockTicket(overrides: Partial<Ticket> = {}): Ticket {
  return {
    id: 'ticket-test-1',
    user_id: 'user-123',
    ticket_type_id: 'type-single-1',
    ticket_type: mockTicketTypes[0],
    qr_code: 'QR-TEST-1',
    purchase_date: new Date().toISOString(),
    valid_from: new Date().toISOString(),
    valid_until: new Date(Date.now() + 3600000).toISOString(),
    status: 'active',
    price: 350,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides
  };
}

/**
 * Helper to create a single mock ticket type
 */
export function createMockTicketType(overrides: Partial<TicketType> = {}): TicketType {
  return {
    id: 'type-test-1',
    name: 'Teszt jegy',
    description: 'Teszt jegy leírása',
    type: 'single',
    price: 350,
    validity_hours: 1,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides
  };
}
