-- Migration: 002_create_core_tables
-- Description: Creates routes, stops, route_stops, and tickets tables
-- Created: 2025-11-02
-- Dependencies: 001_create_users_table.sql (users table must exist)

-- ==============================================================================
-- 1. CREATE STOPS TABLE
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.stops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('bus', 'tram', 'metro', 'train')),
  is_accessible BOOLEAN DEFAULT false,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add comments
COMMENT ON TABLE public.stops IS 'Public transport stops (bus, tram, metro, train stations)';
COMMENT ON COLUMN public.stops.name IS 'Stop name (e.g., "Deák Ferenc tér")';
COMMENT ON COLUMN public.stops.latitude IS 'GPS latitude coordinate';
COMMENT ON COLUMN public.stops.longitude IS 'GPS longitude coordinate';
COMMENT ON COLUMN public.stops.type IS 'Type of stop: bus, tram, metro, train';
COMMENT ON COLUMN public.stops.is_accessible IS 'Wheelchair accessible';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_stops_location ON public.stops(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_stops_type ON public.stops(type);
CREATE INDEX IF NOT EXISTS idx_stops_name ON public.stops(name);

-- ==============================================================================
-- 2. CREATE ROUTES TABLE
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route_number TEXT NOT NULL,
  name TEXT NOT NULL,
  provider_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  is_accessible BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add comments
COMMENT ON TABLE public.routes IS 'Public transport routes (bus lines, tram lines, etc.)';
COMMENT ON COLUMN public.routes.route_number IS 'Route number/identifier (e.g., "7E", "M1")';
COMMENT ON COLUMN public.routes.name IS 'Route name/description';
COMMENT ON COLUMN public.routes.provider_id IS 'Transport provider user (admin/provider role)';
COMMENT ON COLUMN public.routes.is_accessible IS 'Route has accessible vehicles';
COMMENT ON COLUMN public.routes.is_active IS 'Route is currently active/operational';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_routes_route_number ON public.routes(route_number);
CREATE INDEX IF NOT EXISTS idx_routes_provider_id ON public.routes(provider_id);
CREATE INDEX IF NOT EXISTS idx_routes_is_active ON public.routes(is_active);

-- ==============================================================================
-- 3. CREATE ROUTE_STOPS TABLE (Junction table)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.route_stops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id UUID NOT NULL REFERENCES public.routes(id) ON DELETE CASCADE,
  stop_id UUID NOT NULL REFERENCES public.stops(id) ON DELETE CASCADE,
  stop_order INTEGER NOT NULL,
  arrival_time TIME,
  departure_time TIME,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure unique combination of route and stop order
  CONSTRAINT unique_route_stop_order UNIQUE (route_id, stop_order),
  -- Ensure arrival time is before or equal to departure time
  CONSTRAINT valid_times CHECK (arrival_time IS NULL OR departure_time IS NULL OR arrival_time <= departure_time)
);

-- Add comments
COMMENT ON TABLE public.route_stops IS 'Junction table connecting routes to stops in specific order';
COMMENT ON COLUMN public.route_stops.route_id IS 'Reference to routes table';
COMMENT ON COLUMN public.route_stops.stop_id IS 'Reference to stops table';
COMMENT ON COLUMN public.route_stops.stop_order IS 'Order of stop in route (1, 2, 3, ...)';
COMMENT ON COLUMN public.route_stops.arrival_time IS 'Scheduled arrival time at this stop';
COMMENT ON COLUMN public.route_stops.departure_time IS 'Scheduled departure time from this stop';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_route_stops_route_id ON public.route_stops(route_id);
CREATE INDEX IF NOT EXISTS idx_route_stops_stop_id ON public.route_stops(stop_id);
CREATE INDEX IF NOT EXISTS idx_route_stops_order ON public.route_stops(route_id, stop_order);

-- ==============================================================================
-- 4. CREATE TICKETS TABLE
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  route_id UUID REFERENCES public.routes(id) ON DELETE SET NULL,
  ticket_type TEXT NOT NULL CHECK (ticket_type IN ('single', 'return', 'day_pass', 'monthly_pass', 'annual_pass')),
  price DECIMAL(10, 2) NOT NULL,
  purchase_date TIMESTAMPTZ DEFAULT NOW(),
  valid_from TIMESTAMPTZ NOT NULL,
  valid_until TIMESTAMPTZ NOT NULL,
  qr_code TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'used', 'expired', 'refunded')),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure valid_until is after valid_from
  CONSTRAINT valid_period CHECK (valid_until > valid_from)
);

-- Add comments
COMMENT ON TABLE public.tickets IS 'User purchased tickets';
COMMENT ON COLUMN public.tickets.user_id IS 'User who purchased the ticket';
COMMENT ON COLUMN public.tickets.route_id IS 'Specific route (NULL for general passes)';
COMMENT ON COLUMN public.tickets.ticket_type IS 'Type: single, return, day_pass, monthly_pass, annual_pass';
COMMENT ON COLUMN public.tickets.price IS 'Price paid for ticket';
COMMENT ON COLUMN public.tickets.valid_from IS 'Ticket validity start date/time';
COMMENT ON COLUMN public.tickets.valid_until IS 'Ticket validity end date/time';
COMMENT ON COLUMN public.tickets.qr_code IS 'Unique QR code for ticket validation';
COMMENT ON COLUMN public.tickets.status IS 'Ticket status: active, used, expired, refunded';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tickets_user_id ON public.tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_route_id ON public.tickets(route_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON public.tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_qr_code ON public.tickets(qr_code);
CREATE INDEX IF NOT EXISTS idx_tickets_validity ON public.tickets(valid_from, valid_until);

-- ==============================================================================
-- 5. CREATE FAVORITE_ROUTES TABLE
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.favorite_routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  from_stop_id UUID NOT NULL REFERENCES public.stops(id) ON DELETE CASCADE,
  to_stop_id UUID NOT NULL REFERENCES public.stops(id) ON DELETE CASCADE,
  route_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add comments
COMMENT ON TABLE public.favorite_routes IS 'User saved favorite routes';
COMMENT ON COLUMN public.favorite_routes.user_id IS 'User who saved the favorite';
COMMENT ON COLUMN public.favorite_routes.name IS 'User-defined name for favorite route';
COMMENT ON COLUMN public.favorite_routes.from_stop_id IS 'Starting stop';
COMMENT ON COLUMN public.favorite_routes.to_stop_id IS 'Destination stop';
COMMENT ON COLUMN public.favorite_routes.route_data IS 'Saved route details in JSON format';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_favorite_routes_user_id ON public.favorite_routes(user_id);

-- ==============================================================================
-- 6. CREATE RATINGS TABLE
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  route_id UUID NOT NULL REFERENCES public.routes(id) ON DELETE CASCADE,
  overall_rating INTEGER NOT NULL CHECK (overall_rating BETWEEN 1 AND 5),
  cleanliness INTEGER CHECK (cleanliness BETWEEN 1 AND 5),
  punctuality INTEGER CHECK (punctuality BETWEEN 1 AND 5),
  comment TEXT CHECK (length(comment) <= 500),
  helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- User can only rate a route once
  CONSTRAINT unique_user_route_rating UNIQUE (user_id, route_id)
);

-- Add comments
COMMENT ON TABLE public.ratings IS 'User ratings and reviews for routes';
COMMENT ON COLUMN public.ratings.overall_rating IS 'Overall rating (1-5 stars)';
COMMENT ON COLUMN public.ratings.cleanliness IS 'Cleanliness rating (1-5 stars)';
COMMENT ON COLUMN public.ratings.punctuality IS 'Punctuality rating (1-5 stars)';
COMMENT ON COLUMN public.ratings.comment IS 'User comment (max 500 characters)';
COMMENT ON COLUMN public.ratings.helpful_count IS 'Number of users who found this helpful';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ratings_user_id ON public.ratings(user_id);
CREATE INDEX IF NOT EXISTS idx_ratings_route_id ON public.ratings(route_id);
CREATE INDEX IF NOT EXISTS idx_ratings_overall ON public.ratings(overall_rating);

-- ==============================================================================
-- 7. ENABLE ROW LEVEL SECURITY (RLS)
-- ==============================================================================

ALTER TABLE public.stops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.route_stops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorite_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- 8. CREATE RLS POLICIES - STOPS
-- ==============================================================================

-- Everyone can read active stops
CREATE POLICY "Public can view stops"
  ON public.stops
  FOR SELECT
  USING (true);

-- Only admins and providers can manage stops
CREATE POLICY "Admins and providers can manage stops"
  ON public.stops
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('admin', 'provider')
    )
  );

-- ==============================================================================
-- 9. CREATE RLS POLICIES - ROUTES
-- ==============================================================================

-- Everyone can read active routes
CREATE POLICY "Public can view active routes"
  ON public.routes
  FOR SELECT
  USING (is_active = true);

-- Providers can manage their own routes
CREATE POLICY "Providers can manage own routes"
  ON public.routes
  FOR ALL
  USING (
    provider_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ==============================================================================
-- 10. CREATE RLS POLICIES - ROUTE_STOPS
-- ==============================================================================

-- Everyone can read route stops
CREATE POLICY "Public can view route stops"
  ON public.route_stops
  FOR SELECT
  USING (true);

-- Only admins and providers can manage route stops
CREATE POLICY "Admins and providers can manage route stops"
  ON public.route_stops
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('admin', 'provider')
    )
  );

-- ==============================================================================
-- 11. CREATE RLS POLICIES - TICKETS
-- ==============================================================================

-- Users can view their own tickets
CREATE POLICY "Users can view own tickets"
  ON public.tickets
  FOR SELECT
  USING (user_id = auth.uid());

-- Users can insert their own tickets (via purchase)
CREATE POLICY "Users can create own tickets"
  ON public.tickets
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users cannot update or delete tickets (use status change instead)
-- Admins can view all tickets
CREATE POLICY "Admins can view all tickets"
  ON public.tickets
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ==============================================================================
-- 12. CREATE RLS POLICIES - FAVORITE_ROUTES
-- ==============================================================================

-- Users can manage their own favorites
CREATE POLICY "Users can manage own favorites"
  ON public.favorite_routes
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ==============================================================================
-- 13. CREATE RLS POLICIES - RATINGS
-- ==============================================================================

-- Everyone can view ratings
CREATE POLICY "Public can view ratings"
  ON public.ratings
  FOR SELECT
  USING (true);

-- Authenticated users can create ratings
CREATE POLICY "Users can create ratings"
  ON public.ratings
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users can update their own ratings
CREATE POLICY "Users can update own ratings"
  ON public.ratings
  FOR UPDATE
  USING (user_id = auth.uid());

-- Users can delete their own ratings
CREATE POLICY "Users can delete own ratings"
  ON public.ratings
  FOR DELETE
  USING (user_id = auth.uid());

-- ==============================================================================
-- 14. CREATE TRIGGER FUNCTIONS FOR UPDATED_AT
-- ==============================================================================

-- Trigger for stops
DROP TRIGGER IF EXISTS update_stops_updated_at ON public.stops;
CREATE TRIGGER update_stops_updated_at
  BEFORE UPDATE ON public.stops
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for routes
DROP TRIGGER IF EXISTS update_routes_updated_at ON public.routes;
CREATE TRIGGER update_routes_updated_at
  BEFORE UPDATE ON public.routes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for ratings
DROP TRIGGER IF EXISTS update_ratings_updated_at ON public.ratings;
CREATE TRIGGER update_ratings_updated_at
  BEFORE UPDATE ON public.ratings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ==============================================================================
-- 15. GRANT PERMISSIONS
-- ==============================================================================

-- Grant read access to authenticated users
GRANT SELECT ON public.stops TO authenticated, anon;
GRANT SELECT ON public.routes TO authenticated, anon;
GRANT SELECT ON public.route_stops TO authenticated, anon;

-- Tickets only for authenticated
GRANT SELECT, INSERT ON public.tickets TO authenticated;

-- Favorites only for authenticated
GRANT ALL ON public.favorite_routes TO authenticated;

-- Ratings for authenticated
GRANT SELECT ON public.ratings TO authenticated, anon;
GRANT INSERT, UPDATE, DELETE ON public.ratings TO authenticated;

-- ==============================================================================
-- MIGRATION COMPLETE
-- ==============================================================================

-- Verification queries (uncomment to test):
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
-- SELECT * FROM pg_policies WHERE schemaname = 'public';
