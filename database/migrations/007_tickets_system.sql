-- Migration 007: Tickets System
-- Description: Creates ticket_types, tickets, and transactions tables with RLS policies
-- Date: 2025-01-11

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TICKET TYPES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS ticket_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  type VARCHAR(50) NOT NULL CHECK (type IN ('single', 'return', 'day', 'monthly', 'yearly')),
  price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
  validity_hours INTEGER CHECK (validity_hours > 0),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TICKETS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  ticket_type_id UUID NOT NULL REFERENCES ticket_types(id) ON DELETE RESTRICT,
  route_id UUID,
  from_stop_id UUID,
  to_stop_id UUID,
  qr_code TEXT NOT NULL,
  purchase_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  valid_from TIMESTAMP WITH TIME ZONE NOT NULL,
  valid_until TIMESTAMP WITH TIME ZONE,
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'used', 'cancelled')),
  price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
  transaction_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TRANSACTIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  ticket_id UUID REFERENCES tickets(id) ON DELETE SET NULL,
  amount DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  payment_method VARCHAR(50) DEFAULT 'simulation',
  transaction_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INDEXES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_tickets_user_id ON tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_valid_from ON tickets(valid_from);
CREATE INDEX IF NOT EXISTS idx_tickets_valid_until ON tickets(valid_until);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_ticket_id ON transactions(ticket_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_ticket_types_type ON ticket_types(type);
CREATE INDEX IF NOT EXISTS idx_ticket_types_is_active ON ticket_types(is_active);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE ticket_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Ticket Types Policies
-- Anyone can view active ticket types
CREATE POLICY "Anyone can view active ticket types"
  ON ticket_types FOR SELECT
  USING (is_active = true);

-- Only admins can insert ticket types
CREATE POLICY "Admins can insert ticket types"
  ON ticket_types FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Only admins can update ticket types
CREATE POLICY "Admins can update ticket types"
  ON ticket_types FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Only admins can delete ticket types
CREATE POLICY "Admins can delete ticket types"
  ON ticket_types FOR DELETE
  USING (
    auth.uid() IN (
      SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Tickets Policies
-- Users can view their own tickets
CREATE POLICY "Users can view own tickets"
  ON tickets FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own tickets
CREATE POLICY "Users can insert own tickets"
  ON tickets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own tickets (for cancellation)
CREATE POLICY "Users can update own tickets"
  ON tickets FOR UPDATE
  USING (auth.uid() = user_id);

-- Admins can view all tickets
CREATE POLICY "Admins can view all tickets"
  ON tickets FOR SELECT
  USING (
    auth.uid() IN (
      SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Transactions Policies
-- Users can view their own transactions
CREATE POLICY "Users can view own transactions"
  ON transactions FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own transactions
CREATE POLICY "Users can insert own transactions"
  ON transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admins can view all transactions
CREATE POLICY "Admins can view all transactions"
  ON transactions FOR SELECT
  USING (
    auth.uid() IN (
      SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin'
    )
  );

-- =====================================================
-- TRIGGERS FOR UPDATED_AT
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for ticket_types
DROP TRIGGER IF EXISTS update_ticket_types_updated_at ON ticket_types;
CREATE TRIGGER update_ticket_types_updated_at
  BEFORE UPDATE ON ticket_types
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for tickets
DROP TRIGGER IF EXISTS update_tickets_updated_at ON tickets;
CREATE TRIGGER update_tickets_updated_at
  BEFORE UPDATE ON tickets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- SEED DATA - Default Ticket Types
-- =====================================================

INSERT INTO ticket_types (name, description, type, price, validity_hours, is_active)
VALUES
  (
    'Single Ticket',
    'Valid for a single journey within 90 minutes. Can be used on any bus, tram, or metro line.',
    'single',
    350.00,
    1.5,
    true
  ),
  (
    'Return Ticket',
    'Valid for two journeys (there and back) within 180 minutes. Ideal for short round trips.',
    'return',
    650.00,
    3,
    true
  ),
  (
    'Day Pass',
    'Unlimited travel for 24 hours from activation. Perfect for tourists and day explorers.',
    'day',
    1650.00,
    24,
    true
  ),
  (
    'Monthly Pass',
    'Unlimited travel for 30 days. Best value for daily commuters.',
    'monthly',
    9500.00,
    720,
    true
  ),
  (
    'Yearly Pass',
    'Unlimited travel for 365 days. Maximum savings for regular travelers.',
    'yearly',
    100000.00,
    8760,
    true
  )
ON CONFLICT DO NOTHING;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE ticket_types IS 'Stores different types of tickets available for purchase';
COMMENT ON TABLE tickets IS 'Stores individual ticket purchases and their status';
COMMENT ON TABLE transactions IS 'Stores payment transaction records for ticket purchases';

COMMENT ON COLUMN ticket_types.validity_hours IS 'Number of hours the ticket is valid for. NULL for passes without expiry.';
COMMENT ON COLUMN tickets.qr_code IS 'Base64 encoded QR code data for ticket validation';
COMMENT ON COLUMN tickets.valid_from IS 'Timestamp when the ticket becomes active';
COMMENT ON COLUMN tickets.valid_until IS 'Timestamp when the ticket expires. NULL for passes.';
COMMENT ON COLUMN transactions.payment_method IS 'Payment method used (simulation for testing)';

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
