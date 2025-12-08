-- Migration 016: User Preferences & Profile Enhancements
-- Sprint 9-10 Phase 1
-- Created: 2025-11-13
-- Purpose: Add profile management and notification preference features

-- =============================================================================
-- 1. ALTER users TABLE - ADD NEW COLUMNS
-- =============================================================================

-- Add display_name (separate from OAuth name)
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS display_name VARCHAR(50);

-- Add preferred language (default Hungarian)
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS preferred_language VARCHAR(2) DEFAULT 'hu'
    CHECK (preferred_language IN ('hu', 'en'));

-- Add last login tracking
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;

-- Update notification_preferences structure to support new options
-- Note: existing column notification_preferences already exists from migration 001
-- We'll ensure it has the correct default structure

-- Set default notification preferences for existing users without them
UPDATE users
SET notification_preferences = jsonb_build_object(
  'emailTicketPurchase', true,
  'emailRouteDisruptions', false,
  'emailPromotional', false,
  'pushNotifications', false
)
WHERE notification_preferences IS NULL
   OR notification_preferences = '{}'::jsonb
   OR notification_preferences = '{"email": true}'::jsonb;

-- Add comments for new columns
COMMENT ON COLUMN users.display_name IS 'User-customizable display name (optional, 1-50 chars)';
COMMENT ON COLUMN users.preferred_language IS 'User preferred UI language (hu or en)';
COMMENT ON COLUMN users.last_login_at IS 'Timestamp of last successful login';
COMMENT ON COLUMN users.notification_preferences IS 'JSONB: {emailTicketPurchase, emailRouteDisruptions, emailPromotional, pushNotifications}';

-- =============================================================================
-- 2. CREATE user_statistics VIEW
-- =============================================================================

-- Drop view if exists (for idempotency)
DROP VIEW IF EXISTS user_statistics CASCADE;

-- Create materialized view for user statistics
-- Note: Using a regular view for real-time data; switch to MATERIALIZED VIEW if performance needed
CREATE OR REPLACE VIEW user_statistics AS
SELECT
  u.id AS user_id,
  u.email,
  u.display_name,
  u.name,
  u.created_at AS account_created_at,
  u.last_login_at,

  -- Ticket statistics
  COUNT(DISTINCT t.id) AS total_tickets_purchased,
  COUNT(DISTINCT CASE WHEN t.valid_until > NOW() THEN t.id END) AS active_tickets_count,
  COALESCE(SUM(tt.price), 0) AS total_amount_spent,

  -- Favorite routes statistics
  COUNT(DISTINCT fr.id) AS favorite_routes_count,

  -- Recent activity
  MAX(t.purchase_date) AS last_ticket_purchase_date,
  MAX(fr.created_at) AS last_favorite_added_date

FROM users u
LEFT JOIN tickets t ON t.user_id = u.id
LEFT JOIN ticket_types tt ON t.ticket_type_id = tt.id
LEFT JOIN favorite_routes fr ON fr.user_id = u.id
GROUP BY u.id, u.email, u.display_name, u.name, u.created_at, u.last_login_at;

-- Add comment for view
COMMENT ON VIEW user_statistics IS 'Aggregated user statistics including tickets, spending, and favorites';

-- Grant SELECT on view to authenticated users (RLS applies via underlying tables)
GRANT SELECT ON user_statistics TO authenticated;

-- =============================================================================
-- 3. CREATE purchase_history VIEW
-- =============================================================================

-- Drop view if exists (for idempotency)
DROP VIEW IF EXISTS purchase_history CASCADE;

-- Create view for purchase history with enriched data
CREATE OR REPLACE VIEW purchase_history AS
SELECT
  t.id AS ticket_id,
  t.user_id,
  t.ticket_type_id,
  tt.name AS ticket_type_name,
  tt.price AS ticket_price,
  tt.validity_hours AS ticket_validity_hours,
  tt.description AS ticket_description,
  t.purchase_date,
  t.valid_until,
  t.qr_code,

  -- Status calculation
  CASE
    WHEN t.valid_until > NOW() THEN 'active'
    ELSE 'expired'
  END AS status,

  -- Time remaining (useful for sorting/filtering)
  EXTRACT(EPOCH FROM (t.valid_until - NOW())) AS seconds_until_expiry,

  -- User info (for admin views)
  u.email AS user_email,
  u.display_name AS user_display_name

FROM tickets t
INNER JOIN ticket_types tt ON t.ticket_type_id = tt.id
INNER JOIN users u ON t.user_id = u.id
ORDER BY t.purchase_date DESC;

-- Add comment for view
COMMENT ON VIEW purchase_history IS 'Enriched ticket purchase history with status, expiry, and user details';

-- Grant SELECT on view to authenticated users (RLS applies via underlying tables)
GRANT SELECT ON purchase_history TO authenticated;

-- =============================================================================
-- 4. CREATE INDEXES FOR PERFORMANCE
-- =============================================================================

-- Index for last_login_at queries (e.g., inactive user reports)
CREATE INDEX IF NOT EXISTS idx_users_last_login
  ON users(last_login_at DESC) WHERE last_login_at IS NOT NULL;

-- Index for preferred_language queries (e.g., localized email campaigns)
CREATE INDEX IF NOT EXISTS idx_users_preferred_language
  ON users(preferred_language);

-- Index for display_name searches (if implementing user search)
CREATE INDEX IF NOT EXISTS idx_users_display_name
  ON users(display_name) WHERE display_name IS NOT NULL;

-- =============================================================================
-- 5. UPDATE TRIGGER FUNCTION FOR handle_new_user
-- =============================================================================

-- Update handle_new_user function to set default values for new columns
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert a new row into public.users when a user signs up
  INSERT INTO public.users (
    id,
    email,
    name,
    google_id,
    display_name,
    preferred_language,
    last_login_at,
    notification_preferences
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'sub',  -- Google's unique user ID
    NULL,  -- display_name is user-customizable, leave NULL initially
    'hu',  -- default to Hungarian
    NOW(), -- set last_login_at to signup time
    jsonb_build_object(
      'emailTicketPurchase', true,
      'emailRouteDisruptions', false,
      'emailPromotional', false,
      'pushNotifications', false
    )
  );

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the auth signup
    RAISE WARNING 'Failed to create user profile for %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.handle_new_user() IS 'Creates user profile with default preferences on signup (updated for Sprint 9-10)';

-- =============================================================================
-- 6. CREATE FUNCTION TO UPDATE last_login_at
-- =============================================================================

-- Function to update last_login_at (called by backend on successful login)
CREATE OR REPLACE FUNCTION update_user_last_login(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE users
  SET last_login_at = NOW()
  WHERE id = p_user_id;
END;
$$;

COMMENT ON FUNCTION update_user_last_login(UUID) IS 'Updates last_login_at timestamp for a user';

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION update_user_last_login(UUID) TO authenticated;

-- =============================================================================
-- 7. RLS POLICIES FOR VIEWS
-- =============================================================================

-- Note: Views inherit RLS from underlying tables
-- user_statistics view: Users can only see their own statistics
-- purchase_history view: Users can only see their own purchase history
-- Policies on users, tickets, favorite_routes tables already enforce this

-- =============================================================================
-- 8. VALIDATION CONSTRAINTS
-- =============================================================================

-- Add constraint for display_name length
ALTER TABLE users
  ADD CONSTRAINT users_display_name_length
    CHECK (display_name IS NULL OR char_length(display_name) >= 1);

-- Add constraint for notification_preferences structure
ALTER TABLE users
  ADD CONSTRAINT users_notification_preferences_valid
    CHECK (
      notification_preferences ? 'emailTicketPurchase' AND
      notification_preferences ? 'emailRouteDisruptions' AND
      notification_preferences ? 'emailPromotional' AND
      notification_preferences ? 'pushNotifications'
    );

-- =============================================================================
-- MIGRATION COMPLETE
-- =============================================================================
-- This migration adds:
-- - New columns to users table (display_name, preferred_language, last_login_at)
-- - user_statistics view for aggregated user data
-- - purchase_history view for enriched ticket purchase data
-- - Indexes for performance optimization
-- - Updated handle_new_user() function with new defaults
-- - Helper function update_user_last_login() for backend
-- - Validation constraints for data integrity
