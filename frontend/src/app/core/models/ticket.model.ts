export interface Ticket {
  id: string;
  user_id: string;
  ticket_type_id: string;
  ticket_type?: TicketType;
  route_id?: string;
  route?: Route;
  from_stop_id?: string;
  from_stop?: Stop;
  to_stop_id?: string;
  to_stop?: Stop;
  qr_code: string;
  purchase_date: string;
  valid_from: string;
  valid_until?: string;
  status: 'active' | 'expired' | 'used' | 'refunded';
  price: number;
  created_at: string;
  updated_at: string;
}

export interface TicketType {
  id: string;
  name: string;
  description: string;
  type: 'single' | 'return' | 'day' | 'monthly' | 'yearly';
  price: number;
  validity_hours: number | null;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Stop {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
}

export interface Route {
  id: string;
  route_number: string;
  route_name: string;
  type: string;
}

export interface PurchaseTicketDto {
  ticket_type_id: string;
  route_id?: string;
  from_stop_id?: string;
  to_stop_id?: string;
  valid_from?: string;
}
