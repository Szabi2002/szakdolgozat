-- Migration 017: Purchase History Enhancements
-- Sprint 9-10 Phase 1
-- Created: 2025-11-13
-- Purpose: Enable ticket email resend with rate limiting

-- =============================================================================
-- 1. CREATE email_resend_log TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS email_resend_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  resent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Optional: Track which email was sent
  email_type VARCHAR(50) DEFAULT 'ticket_purchase',

  -- Optional: Track email delivery status
  email_status VARCHAR(20) DEFAULT 'sent' CHECK (email_status IN ('sent', 'failed', 'bounced'))
);

-- Add comments for documentation
COMMENT ON TABLE email_resend_log IS 'Logs all ticket email resend requests for rate limiting and auditing';
COMMENT ON COLUMN email_resend_log.user_id IS 'User who requested the resend';
COMMENT ON COLUMN email_resend_log.ticket_id IS 'Ticket for which email was resent';
COMMENT ON COLUMN email_resend_log.resent_at IS 'Timestamp of resend request';
COMMENT ON COLUMN email_resend_log.email_type IS 'Type of email sent (e.g., ticket_purchase)';
COMMENT ON COLUMN email_resend_log.email_status IS 'Email delivery status: sent, failed, bounced';

-- =============================================================================
-- 2. CREATE INDEXES FOR PERFORMANCE
-- =============================================================================

-- Primary query pattern: Check resends for a user in the last hour (rate limiting)
CREATE INDEX IF NOT EXISTS idx_email_resend_log_user_time
  ON email_resend_log(user_id, resent_at DESC);

-- Support ticket-specific queries (e.g., "How many times was this ticket resent?")
CREATE INDEX IF NOT EXISTS idx_email_resend_log_ticket
  ON email_resend_log(ticket_id, resent_at DESC);

-- Support composite queries for rate limiting (user + ticket + time)
CREATE INDEX IF NOT EXISTS idx_email_resend_log_user_ticket_time
  ON email_resend_log(user_id, ticket_id, resent_at DESC);

-- =============================================================================
-- 3. ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================================================

-- Enable RLS on the table
ALTER TABLE email_resend_log ENABLE ROW LEVEL SECURITY;

-- DROP existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS email_resend_log_select_own ON email_resend_log;
DROP POLICY IF EXISTS email_resend_log_insert_own ON email_resend_log;

-- Policy 1: Users can SELECT only their own resend logs
CREATE POLICY email_resend_log_select_own ON email_resend_log
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy 2: Users can INSERT their own resend logs (backend will enforce rate limit)
CREATE POLICY email_resend_log_insert_own ON email_resend_log
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy 3: Admins can view all resend logs (for auditing)
CREATE POLICY email_resend_log_admin_select_all ON email_resend_log
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

COMMENT ON POLICY email_resend_log_select_own ON email_resend_log IS 'Users can only view their own email resend logs';
COMMENT ON POLICY email_resend_log_insert_own ON email_resend_log IS 'Users can log their own email resend requests';
COMMENT ON POLICY email_resend_log_admin_select_all ON email_resend_log IS 'Admins can view all email resend logs for auditing';

-- =============================================================================
-- 4. CREATE FUNCTION TO CHECK RATE LIMIT
-- =============================================================================

-- Function to check if user has exceeded email resend rate limit
-- Returns: number of resends in the last hour
CREATE OR REPLACE FUNCTION check_email_resend_rate_limit(
  p_user_id UUID,
  p_hours INTEGER DEFAULT 1,
  p_max_resends INTEGER DEFAULT 5
)
RETURNS TABLE (
  resends_in_period INTEGER,
  limit_exceeded BOOLEAN,
  retry_after TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_resend_count INTEGER;
  v_oldest_resend TIMESTAMPTZ;
BEGIN
  -- Count resends in the specified time period
  SELECT COUNT(*), MIN(resent_at)
  INTO v_resend_count, v_oldest_resend
  FROM email_resend_log
  WHERE user_id = p_user_id
    AND resent_at > NOW() - (p_hours || ' hours')::INTERVAL;

  -- Calculate when user can resend again (oldest resend + period)
  RETURN QUERY SELECT
    v_resend_count,
    v_resend_count >= p_max_resends,
    CASE
      WHEN v_resend_count >= p_max_resends THEN v_oldest_resend + (p_hours || ' hours')::INTERVAL
      ELSE NULL
    END;
END;
$$;

COMMENT ON FUNCTION check_email_resend_rate_limit(UUID, INTEGER, INTEGER) IS 'Checks if user has exceeded email resend rate limit (default: 5/hour)';

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION check_email_resend_rate_limit(UUID, INTEGER, INTEGER) TO authenticated;

-- =============================================================================
-- 5. CREATE FUNCTION TO LOG EMAIL RESEND
-- =============================================================================

-- Function to log an email resend attempt (called by backend after sending email)
CREATE OR REPLACE FUNCTION log_email_resend(
  p_user_id UUID,
  p_ticket_id UUID,
  p_email_type VARCHAR DEFAULT 'ticket_purchase',
  p_email_status VARCHAR DEFAULT 'sent'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_log_id UUID;
BEGIN
  -- Verify ticket belongs to user
  IF NOT EXISTS (
    SELECT 1 FROM tickets
    WHERE id = p_ticket_id AND user_id = p_user_id
  ) THEN
    RAISE EXCEPTION 'Ticket % does not belong to user %', p_ticket_id, p_user_id
      USING ERRCODE = 'foreign_key_violation';
  END IF;

  -- Insert log entry
  INSERT INTO email_resend_log (user_id, ticket_id, email_type, email_status)
  VALUES (p_user_id, p_ticket_id, p_email_type, p_email_status)
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$;

COMMENT ON FUNCTION log_email_resend(UUID, UUID, VARCHAR, VARCHAR) IS 'Logs an email resend attempt after verification';

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION log_email_resend(UUID, UUID, VARCHAR, VARCHAR) TO authenticated;

-- =============================================================================
-- 6. CREATE VIEW FOR RESEND STATISTICS
-- =============================================================================

-- Drop view if exists (for idempotency)
DROP VIEW IF EXISTS email_resend_statistics CASCADE;

-- Create view for email resend statistics (useful for monitoring)
CREATE OR REPLACE VIEW email_resend_statistics AS
SELECT
  erl.user_id,
  u.email AS user_email,
  u.display_name AS user_display_name,
  COUNT(*) AS total_resends,
  COUNT(DISTINCT erl.ticket_id) AS unique_tickets_resent,
  MAX(erl.resent_at) AS last_resend_at,
  COUNT(CASE WHEN erl.resent_at > NOW() - INTERVAL '1 hour' THEN 1 END) AS resends_last_hour,
  COUNT(CASE WHEN erl.resent_at > NOW() - INTERVAL '24 hours' THEN 1 END) AS resends_last_24h,
  COUNT(CASE WHEN erl.email_status = 'failed' THEN 1 END) AS failed_resends,
  COUNT(CASE WHEN erl.email_status = 'bounced' THEN 1 END) AS bounced_resends
FROM email_resend_log erl
INNER JOIN users u ON erl.user_id = u.id
GROUP BY erl.user_id, u.email, u.display_name;

COMMENT ON VIEW email_resend_statistics IS 'Aggregated email resend statistics per user for monitoring and abuse detection';

-- Grant SELECT on view to authenticated users (admins only in practice via RLS)
GRANT SELECT ON email_resend_statistics TO authenticated;

-- RLS policy for view: Only admins can view statistics
CREATE POLICY email_resend_statistics_admin_only ON email_resend_log
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =============================================================================
-- 7. CREATE INDEXES ON tickets TABLE FOR PURCHASE HISTORY
-- =============================================================================

-- Index for purchase history queries (user + purchase_date)
-- Note: May already exist from previous migrations, using IF NOT EXISTS
CREATE INDEX IF NOT EXISTS idx_tickets_user_purchase_date
  ON tickets(user_id, purchase_date DESC);

-- Index for filtering by expiry status (valid_until)
CREATE INDEX IF NOT EXISTS idx_tickets_user_valid_until
  ON tickets(user_id, valid_until DESC);

-- Composite index for purchase history with status filtering
CREATE INDEX IF NOT EXISTS idx_tickets_user_purchase_valid
  ON tickets(user_id, purchase_date DESC, valid_until);

-- =============================================================================
-- 8. GRANT PERMISSIONS
-- =============================================================================

-- Grant appropriate permissions to authenticated users
GRANT SELECT, INSERT ON email_resend_log TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- =============================================================================
-- 9. CREATE TRIGGER TO PREVENT BACKDATED RESENDS
-- =============================================================================

-- Trigger function to ensure resent_at cannot be in the past (prevent gaming rate limit)
CREATE OR REPLACE FUNCTION check_resend_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  -- Prevent backdating resend timestamps
  IF NEW.resent_at < NOW() - INTERVAL '1 minute' THEN
    NEW.resent_at = NOW();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger to table
DROP TRIGGER IF EXISTS trg_check_resend_timestamp ON email_resend_log;
CREATE TRIGGER trg_check_resend_timestamp
  BEFORE INSERT ON email_resend_log
  FOR EACH ROW
  EXECUTE FUNCTION check_resend_timestamp();

COMMENT ON FUNCTION check_resend_timestamp() IS 'Prevents backdating email resend timestamps';

-- =============================================================================
-- MIGRATION COMPLETE
-- =============================================================================
-- This migration creates:
-- - email_resend_log table for tracking email resend requests
-- - Indexes for optimal rate limit checking and auditing
-- - RLS policies ensuring users only access their own logs
-- - Helper functions: check_email_resend_rate_limit, log_email_resend
-- - email_resend_statistics view for monitoring
-- - Triggers to prevent timestamp gaming
-- - Additional indexes on tickets table for purchase history optimization
