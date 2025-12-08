-- Migration 015: Favorite Routes System
-- Sprint 9-10 Phase 1
-- Created: 2025-11-13
-- Purpose: Enable users to save favorite routes for quick access

-- =============================================================================
-- 1. CREATE favorite_routes TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS favorite_routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  from_stop_id UUID NOT NULL REFERENCES stops(id) ON DELETE CASCADE,
  to_stop_id UUID NOT NULL REFERENCES stops(id) ON DELETE CASCADE,

  -- Store complete route data for quick re-planning
  -- Structure: { routes: [], departureTime: string, arrivalTime: string }
  route_data JSONB NOT NULL DEFAULT '{}'::jsonb,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Ensure friendly names and prevent duplicates
  CONSTRAINT favorite_routes_name_length CHECK (char_length(name) >= 3),
  CONSTRAINT favorite_routes_different_stops CHECK (from_stop_id != to_stop_id)
);

-- Add comment for documentation
COMMENT ON TABLE favorite_routes IS 'Stores user favorite routes with complete route data for quick re-planning';
COMMENT ON COLUMN favorite_routes.route_data IS 'Complete route planning response data stored as JSONB';
COMMENT ON COLUMN favorite_routes.name IS 'User-defined friendly name for the route (3-100 chars)';

-- =============================================================================
-- 2. CREATE INDEXES FOR PERFORMANCE
-- =============================================================================

-- Primary query pattern: Get all favorites for a user, ordered by recent
CREATE INDEX IF NOT EXISTS idx_favorite_routes_user_created
  ON favorite_routes(user_id, created_at DESC);

-- Support lookup by ID for update/delete operations
CREATE INDEX IF NOT EXISTS idx_favorite_routes_id
  ON favorite_routes(id);

-- Support queries by stop IDs (e.g., "Show all favorites using this stop")
CREATE INDEX IF NOT EXISTS idx_favorite_routes_stops
  ON favorite_routes(from_stop_id, to_stop_id);

-- =============================================================================
-- 3. ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================================================

-- Enable RLS on the table
ALTER TABLE favorite_routes ENABLE ROW LEVEL SECURITY;

-- DROP existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS favorite_routes_select_own ON favorite_routes;
DROP POLICY IF EXISTS favorite_routes_insert_own ON favorite_routes;
DROP POLICY IF EXISTS favorite_routes_update_own ON favorite_routes;
DROP POLICY IF EXISTS favorite_routes_delete_own ON favorite_routes;

-- Policy 1: Users can SELECT only their own favorites
CREATE POLICY favorite_routes_select_own ON favorite_routes
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy 2: Users can INSERT their own favorites (max 20 enforced by trigger)
CREATE POLICY favorite_routes_insert_own ON favorite_routes
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy 3: Users can UPDATE only their own favorites
CREATE POLICY favorite_routes_update_own ON favorite_routes
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy 4: Users can DELETE only their own favorites
CREATE POLICY favorite_routes_delete_own ON favorite_routes
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

COMMENT ON POLICY favorite_routes_select_own ON favorite_routes IS 'Users can only view their own favorite routes';
COMMENT ON POLICY favorite_routes_insert_own ON favorite_routes IS 'Users can only create favorite routes for themselves';
COMMENT ON POLICY favorite_routes_update_own ON favorite_routes IS 'Users can only update their own favorite routes';
COMMENT ON POLICY favorite_routes_delete_own ON favorite_routes IS 'Users can only delete their own favorite routes';

-- =============================================================================
-- 4. TRIGGER FOR updated_at TIMESTAMP
-- =============================================================================

-- Create trigger function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_favorite_routes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger to table
DROP TRIGGER IF EXISTS trg_favorite_routes_updated_at ON favorite_routes;
CREATE TRIGGER trg_favorite_routes_updated_at
  BEFORE UPDATE ON favorite_routes
  FOR EACH ROW
  EXECUTE FUNCTION update_favorite_routes_updated_at();

COMMENT ON FUNCTION update_favorite_routes_updated_at() IS 'Auto-updates updated_at timestamp on favorite_routes updates';

-- =============================================================================
-- 5. TRIGGER FOR MAX 20 FAVORITES PER USER
-- =============================================================================

-- Create trigger function to enforce 20 favorites limit
CREATE OR REPLACE FUNCTION check_favorite_routes_limit()
RETURNS TRIGGER AS $$
DECLARE
  favorite_count INTEGER;
BEGIN
  -- Count existing favorites for this user
  SELECT COUNT(*) INTO favorite_count
  FROM favorite_routes
  WHERE user_id = NEW.user_id;

  -- Prevent insert if user already has 20 favorites
  IF favorite_count >= 20 THEN
    RAISE EXCEPTION 'Maximum of 20 favorite routes allowed per user'
      USING ERRCODE = 'check_violation',
            HINT = 'Delete an existing favorite before adding a new one';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger to table (fires BEFORE INSERT)
DROP TRIGGER IF EXISTS trg_check_favorite_routes_limit ON favorite_routes;
CREATE TRIGGER trg_check_favorite_routes_limit
  BEFORE INSERT ON favorite_routes
  FOR EACH ROW
  EXECUTE FUNCTION check_favorite_routes_limit();

COMMENT ON FUNCTION check_favorite_routes_limit() IS 'Enforces maximum 20 favorites per user';

-- =============================================================================
-- 6. GRANT PERMISSIONS
-- =============================================================================

-- Grant appropriate permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON favorite_routes TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- =============================================================================
-- MIGRATION COMPLETE
-- =============================================================================
-- This migration creates:
-- - favorite_routes table with proper constraints
-- - Indexes for optimal query performance
-- - RLS policies ensuring users only access their own data
-- - Triggers for updated_at maintenance and 20 favorites limit
-- - Proper grants for authenticated users
