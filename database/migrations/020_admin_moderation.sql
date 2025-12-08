-- =====================================================
-- Migration: 020_admin_moderation.sql
-- Description: Admin moderation and activity tracking system
-- Version: 1.0.0
-- Author: System
-- Date: 2025-01-13
-- Dependencies: 018_ratings_system.sql, 019_reports_system.sql
-- =====================================================

-- =====================================================
-- SECTION 1: ENUMS
-- =====================================================

-- Action types for moderation activities
CREATE TYPE moderation_action_type AS ENUM (
  'approve_rating',
  'reject_rating',
  'update_report_status',
  'change_report_priority',
  'add_admin_note',
  'delete_photo'
);

COMMENT ON TYPE moderation_action_type IS 'Types of moderation actions that admins can perform';

-- Target types for moderation actions
CREATE TYPE moderation_target_type AS ENUM (
  'rating',
  'report',
  'photo'
);

COMMENT ON TYPE moderation_target_type IS 'Types of entities that can be moderated';

-- =====================================================
-- SECTION 2: TABLES
-- =====================================================

-- Moderation actions table - tracks all moderation activities
CREATE TABLE IF NOT EXISTS moderation_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL,
  action_type moderation_action_type NOT NULL,
  target_type moderation_target_type NOT NULL,
  target_id UUID NOT NULL,
  previous_value JSONB,
  new_value JSONB,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Foreign key constraints
  CONSTRAINT fk_moderation_admin
    FOREIGN KEY (admin_id)
    REFERENCES users(id)
    ON DELETE RESTRICT,

  -- Check constraints
  CONSTRAINT chk_admin_role
    CHECK (
      EXISTS (
        SELECT 1 FROM users
        WHERE users.id = admin_id
        AND users.role = 'admin'
      )
    ),

  CONSTRAINT chk_reason_length
    CHECK (reason IS NULL OR LENGTH(TRIM(reason)) >= 3)
);

COMMENT ON TABLE moderation_actions IS 'Audit log of all moderation actions performed by admins';
COMMENT ON COLUMN moderation_actions.id IS 'Unique identifier for the moderation action';
COMMENT ON COLUMN moderation_actions.admin_id IS 'ID of the admin who performed the action';
COMMENT ON COLUMN moderation_actions.action_type IS 'Type of moderation action performed';
COMMENT ON COLUMN moderation_actions.target_type IS 'Type of entity being moderated';
COMMENT ON COLUMN moderation_actions.target_id IS 'ID of the specific entity being moderated';
COMMENT ON COLUMN moderation_actions.previous_value IS 'State of the entity before moderation (JSON)';
COMMENT ON COLUMN moderation_actions.new_value IS 'State of the entity after moderation (JSON)';
COMMENT ON COLUMN moderation_actions.reason IS 'Admin reason or notes for the moderation action';
COMMENT ON COLUMN moderation_actions.created_at IS 'Timestamp when the action was performed';

-- Admin activity log table - tracks all admin activities
CREATE TABLE IF NOT EXISTS admin_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL,
  action VARCHAR(100) NOT NULL,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Foreign key constraints
  CONSTRAINT fk_activity_admin
    FOREIGN KEY (admin_id)
    REFERENCES users(id)
    ON DELETE RESTRICT,

  -- Check constraints
  CONSTRAINT chk_activity_admin_role
    CHECK (
      EXISTS (
        SELECT 1 FROM users
        WHERE users.id = admin_id
        AND users.role = 'admin'
      )
    ),

  CONSTRAINT chk_action_not_empty
    CHECK (LENGTH(TRIM(action)) > 0)
);

COMMENT ON TABLE admin_activity_log IS 'Comprehensive log of all admin activities in the system';
COMMENT ON COLUMN admin_activity_log.id IS 'Unique identifier for the activity log entry';
COMMENT ON COLUMN admin_activity_log.admin_id IS 'ID of the admin who performed the activity';
COMMENT ON COLUMN admin_activity_log.action IS 'Type of activity (e.g., LOGIN, EXPORT_DATA, BULK_ACTION)';
COMMENT ON COLUMN admin_activity_log.details IS 'Additional context about the activity (JSON)';
COMMENT ON COLUMN admin_activity_log.ip_address IS 'IP address from which the activity was performed';
COMMENT ON COLUMN admin_activity_log.user_agent IS 'Browser/client user agent string';
COMMENT ON COLUMN admin_activity_log.created_at IS 'Timestamp when the activity occurred';

-- =====================================================
-- SECTION 3: INDEXES
-- =====================================================

-- Moderation actions indexes
CREATE INDEX idx_moderation_actions_admin_id
  ON moderation_actions(admin_id);

CREATE INDEX idx_moderation_actions_action_type
  ON moderation_actions(action_type);

CREATE INDEX idx_moderation_actions_target
  ON moderation_actions(target_type, target_id);

CREATE INDEX idx_moderation_actions_created_at
  ON moderation_actions(created_at DESC);

CREATE INDEX idx_moderation_actions_admin_date
  ON moderation_actions(admin_id, created_at DESC);

-- Admin activity log indexes
CREATE INDEX idx_admin_activity_admin_id
  ON admin_activity_log(admin_id);

CREATE INDEX idx_admin_activity_action
  ON admin_activity_log(action);

CREATE INDEX idx_admin_activity_created_at
  ON admin_activity_log(created_at DESC);

CREATE INDEX idx_admin_activity_admin_date
  ON admin_activity_log(admin_id, created_at DESC);

CREATE INDEX idx_admin_activity_ip
  ON admin_activity_log(ip_address);

-- =====================================================
-- SECTION 4: ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on moderation_actions
ALTER TABLE moderation_actions ENABLE ROW LEVEL SECURITY;

-- Policy: Only admins can view moderation actions
CREATE POLICY moderation_actions_select_policy
  ON moderation_actions
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Policy: Only admins can insert moderation actions
CREATE POLICY moderation_actions_insert_policy
  ON moderation_actions
  FOR INSERT
  WITH CHECK (
    auth.uid() = admin_id
    AND EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- No UPDATE or DELETE policies - audit trail is immutable

COMMENT ON POLICY moderation_actions_select_policy ON moderation_actions IS
  'Allow admins to view all moderation actions';

COMMENT ON POLICY moderation_actions_insert_policy ON moderation_actions IS
  'Allow admins to create moderation action records';

-- Enable RLS on admin_activity_log
ALTER TABLE admin_activity_log ENABLE ROW LEVEL SECURITY;

-- Policy: Only admins can view activity logs
CREATE POLICY admin_activity_log_select_policy
  ON admin_activity_log
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Policy: Only admins can insert activity logs
CREATE POLICY admin_activity_log_insert_policy
  ON admin_activity_log
  FOR INSERT
  WITH CHECK (
    auth.uid() = admin_id
    AND EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- No UPDATE or DELETE policies - audit trail is immutable

COMMENT ON POLICY admin_activity_log_select_policy ON admin_activity_log IS
  'Allow admins to view all activity logs';

COMMENT ON POLICY admin_activity_log_insert_policy ON admin_activity_log IS
  'Allow admins to create activity log records';

-- =====================================================
-- SECTION 5: HELPER FUNCTIONS
-- =====================================================

-- Function: Log moderation action
CREATE OR REPLACE FUNCTION log_moderation_action(
  p_admin_id UUID,
  p_action_type moderation_action_type,
  p_target_type moderation_target_type,
  p_target_id UUID,
  p_previous_value JSONB DEFAULT NULL,
  p_new_value JSONB DEFAULT NULL,
  p_reason TEXT DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_action_id UUID;
BEGIN
  -- Verify admin role
  IF NOT EXISTS (
    SELECT 1 FROM users
    WHERE id = p_admin_id
    AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'User % is not an admin', p_admin_id;
  END IF;

  -- Insert moderation action
  INSERT INTO moderation_actions (
    admin_id,
    action_type,
    target_type,
    target_id,
    previous_value,
    new_value,
    reason
  ) VALUES (
    p_admin_id,
    p_action_type,
    p_target_type,
    p_target_id,
    p_previous_value,
    p_new_value,
    p_reason
  ) RETURNING id INTO v_action_id;

  RETURN v_action_id;
END;
$$;

COMMENT ON FUNCTION log_moderation_action IS
  'Convenience function to log moderation actions from backend with validation';

-- Function: Get admin statistics
CREATE OR REPLACE FUNCTION get_admin_stats(
  p_admin_id UUID,
  p_start_date TIMESTAMPTZ DEFAULT NOW() - INTERVAL '30 days',
  p_end_date TIMESTAMPTZ DEFAULT NOW()
) RETURNS TABLE (
  total_actions BIGINT,
  actions_by_type JSONB,
  targets_by_type JSONB,
  avg_actions_per_day NUMERIC,
  most_active_day DATE,
  most_active_day_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH action_stats AS (
    SELECT
      COUNT(*) as total,
      jsonb_object_agg(
        action_type::TEXT,
        action_count
      ) as by_type,
      jsonb_object_agg(
        target_type::TEXT,
        target_count
      ) as by_target
    FROM (
      SELECT
        action_type,
        COUNT(*) as action_count
      FROM moderation_actions
      WHERE admin_id = p_admin_id
        AND created_at BETWEEN p_start_date AND p_end_date
      GROUP BY action_type
    ) type_counts
    CROSS JOIN (
      SELECT
        target_type,
        COUNT(*) as target_count
      FROM moderation_actions
      WHERE admin_id = p_admin_id
        AND created_at BETWEEN p_start_date AND p_end_date
      GROUP BY target_type
    ) target_counts
  ),
  daily_stats AS (
    SELECT
      DATE(created_at) as action_date,
      COUNT(*) as day_count
    FROM moderation_actions
    WHERE admin_id = p_admin_id
      AND created_at BETWEEN p_start_date AND p_end_date
    GROUP BY DATE(created_at)
    ORDER BY day_count DESC
    LIMIT 1
  )
  SELECT
    COALESCE(a.total, 0)::BIGINT,
    COALESCE(a.by_type, '{}'::JSONB),
    COALESCE(a.by_target, '{}'::JSONB),
    CASE
      WHEN a.total > 0 THEN
        ROUND(a.total::NUMERIC / GREATEST(1, EXTRACT(DAY FROM p_end_date - p_start_date)), 2)
      ELSE 0
    END,
    d.action_date,
    COALESCE(d.day_count, 0)::BIGINT
  FROM action_stats a
  LEFT JOIN daily_stats d ON true;
END;
$$;

COMMENT ON FUNCTION get_admin_stats IS
  'Get comprehensive statistics for an admin within a date range';

-- Function: Get moderation history for a target
CREATE OR REPLACE FUNCTION get_moderation_history(
  p_target_type moderation_target_type,
  p_target_id UUID
) RETURNS TABLE (
  id UUID,
  admin_id UUID,
  admin_email VARCHAR,
  action_type moderation_action_type,
  previous_value JSONB,
  new_value JSONB,
  reason TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ma.id,
    ma.admin_id,
    u.email,
    ma.action_type,
    ma.previous_value,
    ma.new_value,
    ma.reason,
    ma.created_at
  FROM moderation_actions ma
  JOIN users u ON u.id = ma.admin_id
  WHERE ma.target_type = p_target_type
    AND ma.target_id = p_target_id
  ORDER BY ma.created_at DESC;
END;
$$;

COMMENT ON FUNCTION get_moderation_history IS
  'Get full moderation history for a specific rating, report, or photo';

-- Function: Log admin activity
CREATE OR REPLACE FUNCTION log_admin_activity(
  p_admin_id UUID,
  p_action VARCHAR(100),
  p_details JSONB DEFAULT NULL,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_activity_id UUID;
BEGIN
  -- Verify admin role
  IF NOT EXISTS (
    SELECT 1 FROM users
    WHERE id = p_admin_id
    AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'User % is not an admin', p_admin_id;
  END IF;

  -- Insert activity log
  INSERT INTO admin_activity_log (
    admin_id,
    action,
    details,
    ip_address,
    user_agent
  ) VALUES (
    p_admin_id,
    p_action,
    p_details,
    p_ip_address,
    p_user_agent
  ) RETURNING id INTO v_activity_id;

  RETURN v_activity_id;
END;
$$;

COMMENT ON FUNCTION log_admin_activity IS
  'Convenience function to log admin activities from backend with validation';

-- =====================================================
-- SECTION 6: TRIGGERS
-- =====================================================

-- Trigger function: Auto-log rating moderation
CREATE OR REPLACE FUNCTION trigger_log_rating_moderation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_admin_id UUID;
  v_action_type moderation_action_type;
BEGIN
  -- Only log if status changed from pending
  IF OLD.status = 'pending' AND NEW.status != 'pending' THEN
    -- Get the current admin user (if available)
    v_admin_id := auth.uid();

    -- Only proceed if there's an admin context
    IF v_admin_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM users WHERE id = v_admin_id AND role = 'admin'
    ) THEN
      -- Determine action type
      v_action_type := CASE NEW.status
        WHEN 'approved' THEN 'approve_rating'::moderation_action_type
        WHEN 'rejected' THEN 'reject_rating'::moderation_action_type
        ELSE NULL
      END;

      -- Log the action if action type is valid
      IF v_action_type IS NOT NULL THEN
        INSERT INTO moderation_actions (
          admin_id,
          action_type,
          target_type,
          target_id,
          previous_value,
          new_value,
          reason
        ) VALUES (
          v_admin_id,
          v_action_type,
          'rating'::moderation_target_type,
          NEW.id,
          jsonb_build_object(
            'status', OLD.status,
            'updated_at', OLD.updated_at
          ),
          jsonb_build_object(
            'status', NEW.status,
            'updated_at', NEW.updated_at
          ),
          NEW.admin_notes
        );
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER rating_moderation_log_trigger
  AFTER UPDATE ON ratings
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION trigger_log_rating_moderation();

COMMENT ON FUNCTION trigger_log_rating_moderation IS
  'Automatically log moderation actions when rating status changes';

-- Trigger function: Auto-log report moderation
CREATE OR REPLACE FUNCTION trigger_log_report_moderation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_admin_id UUID;
  v_action_type moderation_action_type;
BEGIN
  -- Get the current admin user (if available)
  v_admin_id := auth.uid();

  -- Only proceed if there's an admin context
  IF v_admin_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM users WHERE id = v_admin_id AND role = 'admin'
  ) THEN
    -- Determine action type based on what changed
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      v_action_type := 'update_report_status'::moderation_action_type;
    ELSIF OLD.priority IS DISTINCT FROM NEW.priority THEN
      v_action_type := 'change_report_priority'::moderation_action_type;
    ELSE
      v_action_type := NULL;
    END IF;

    -- Log the action if action type is valid
    IF v_action_type IS NOT NULL THEN
      INSERT INTO moderation_actions (
        admin_id,
        action_type,
        target_type,
        target_id,
        previous_value,
        new_value,
        reason
      ) VALUES (
        v_admin_id,
        v_action_type,
        'report'::moderation_target_type,
        NEW.id,
        jsonb_build_object(
          'status', OLD.status,
          'priority', OLD.priority,
          'updated_at', OLD.updated_at
        ),
        jsonb_build_object(
          'status', NEW.status,
          'priority', NEW.priority,
          'updated_at', NEW.updated_at
        ),
        NEW.admin_notes
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER report_moderation_log_trigger
  AFTER UPDATE ON reports
  FOR EACH ROW
  WHEN (
    OLD.status IS DISTINCT FROM NEW.status
    OR OLD.priority IS DISTINCT FROM NEW.priority
  )
  EXECUTE FUNCTION trigger_log_report_moderation();

COMMENT ON FUNCTION trigger_log_report_moderation IS
  'Automatically log moderation actions when report status or priority changes';

-- =====================================================
-- SECTION 7: HELPER VIEWS
-- =====================================================

-- View: Admin moderation summary
CREATE OR REPLACE VIEW admin_moderation_summary AS
SELECT
  u.id as admin_id,
  u.email as admin_email,
  u.first_name,
  u.last_name,
  COUNT(ma.id) as total_actions,
  COUNT(CASE WHEN ma.action_type = 'approve_rating' THEN 1 END) as ratings_approved,
  COUNT(CASE WHEN ma.action_type = 'reject_rating' THEN 1 END) as ratings_rejected,
  COUNT(CASE WHEN ma.action_type = 'update_report_status' THEN 1 END) as reports_updated,
  COUNT(CASE WHEN ma.action_type = 'change_report_priority' THEN 1 END) as reports_prioritized,
  COUNT(CASE WHEN ma.action_type = 'add_admin_note' THEN 1 END) as notes_added,
  COUNT(CASE WHEN ma.action_type = 'delete_photo' THEN 1 END) as photos_deleted,
  MIN(ma.created_at) as first_action_date,
  MAX(ma.created_at) as last_action_date,
  COUNT(CASE WHEN ma.created_at >= NOW() - INTERVAL '7 days' THEN 1 END) as actions_last_7_days,
  COUNT(CASE WHEN ma.created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as actions_last_30_days
FROM users u
LEFT JOIN moderation_actions ma ON ma.admin_id = u.id
WHERE u.role = 'admin'
GROUP BY u.id, u.email, u.first_name, u.last_name;

COMMENT ON VIEW admin_moderation_summary IS
  'Summary statistics of moderation actions per admin with date ranges';

-- View: Recent moderation activity
CREATE OR REPLACE VIEW recent_moderation_activity AS
SELECT
  ma.id,
  ma.admin_id,
  u.email as admin_email,
  CONCAT(u.first_name, ' ', u.last_name) as admin_name,
  ma.action_type,
  ma.target_type,
  ma.target_id,
  ma.previous_value,
  ma.new_value,
  ma.reason,
  ma.created_at,
  CASE ma.target_type
    WHEN 'rating' THEN (
      SELECT jsonb_build_object(
        'rating', r.rating,
        'comment', r.comment,
        'route_id', r.route_id,
        'user_id', r.user_id
      )
      FROM ratings r
      WHERE r.id = ma.target_id
    )
    WHEN 'report' THEN (
      SELECT jsonb_build_object(
        'type', rep.report_type,
        'status', rep.status,
        'priority', rep.priority,
        'route_id', rep.route_id,
        'user_id', rep.user_id
      )
      FROM reports rep
      WHERE rep.id = ma.target_id
    )
    ELSE NULL
  END as target_details
FROM moderation_actions ma
JOIN users u ON u.id = ma.admin_id
ORDER BY ma.created_at DESC
LIMIT 100;

COMMENT ON VIEW recent_moderation_activity IS
  'Last 100 moderation actions with enriched data including admin and target details';

-- View: Admin performance metrics
CREATE OR REPLACE VIEW admin_performance_metrics AS
WITH action_intervals AS (
  SELECT
    admin_id,
    action_type,
    created_at,
    LAG(created_at) OVER (PARTITION BY admin_id ORDER BY created_at) as prev_action_time
  FROM moderation_actions
),
avg_times AS (
  SELECT
    admin_id,
    AVG(EXTRACT(EPOCH FROM (created_at - prev_action_time))) as avg_seconds_between_actions
  FROM action_intervals
  WHERE prev_action_time IS NOT NULL
  GROUP BY admin_id
)
SELECT
  u.id as admin_id,
  u.email as admin_email,
  CONCAT(u.first_name, ' ', u.last_name) as admin_name,
  COUNT(DISTINCT DATE(ma.created_at)) as active_days,
  COUNT(ma.id) as total_actions,
  ROUND(COUNT(ma.id)::NUMERIC / NULLIF(COUNT(DISTINCT DATE(ma.created_at)), 0), 2) as avg_actions_per_day,
  ROUND(at.avg_seconds_between_actions / 60, 2) as avg_minutes_between_actions,
  COUNT(CASE WHEN ma.created_at >= NOW() - INTERVAL '7 days' THEN 1 END) as actions_last_7_days,
  COUNT(CASE WHEN ma.created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as actions_last_30_days,
  MAX(ma.created_at) as last_active_at,
  CASE
    WHEN MAX(ma.created_at) >= NOW() - INTERVAL '1 day' THEN 'Very Active'
    WHEN MAX(ma.created_at) >= NOW() - INTERVAL '7 days' THEN 'Active'
    WHEN MAX(ma.created_at) >= NOW() - INTERVAL '30 days' THEN 'Moderate'
    ELSE 'Inactive'
  END as activity_status
FROM users u
LEFT JOIN moderation_actions ma ON ma.admin_id = u.id
LEFT JOIN avg_times at ON at.admin_id = u.id
WHERE u.role = 'admin'
GROUP BY u.id, u.email, u.first_name, u.last_name, at.avg_seconds_between_actions;

COMMENT ON VIEW admin_performance_metrics IS
  'Performance and activity metrics for admin moderation activities';

-- =====================================================
-- SECTION 8: GRANTS
-- =====================================================

-- Grant execute permissions on functions to authenticated users
GRANT EXECUTE ON FUNCTION log_moderation_action TO authenticated;
GRANT EXECUTE ON FUNCTION get_admin_stats TO authenticated;
GRANT EXECUTE ON FUNCTION get_moderation_history TO authenticated;
GRANT EXECUTE ON FUNCTION log_admin_activity TO authenticated;

-- Grant select permissions on views to authenticated users (RLS will filter)
GRANT SELECT ON admin_moderation_summary TO authenticated;
GRANT SELECT ON recent_moderation_activity TO authenticated;
GRANT SELECT ON admin_performance_metrics TO authenticated;

-- =====================================================
-- SECTION 9: VERIFICATION QUERIES
-- =====================================================

-- Verify tables were created
DO $$
BEGIN
  ASSERT (SELECT COUNT(*) FROM information_schema.tables
          WHERE table_name IN ('moderation_actions', 'admin_activity_log')) = 2,
    'Tables not created successfully';

  RAISE NOTICE 'Migration 020_admin_moderation.sql completed successfully';
  RAISE NOTICE 'Created tables: moderation_actions, admin_activity_log';
  RAISE NOTICE 'Created functions: log_moderation_action, get_admin_stats, get_moderation_history, log_admin_activity';
  RAISE NOTICE 'Created views: admin_moderation_summary, recent_moderation_activity, admin_performance_metrics';
  RAISE NOTICE 'Created triggers: rating_moderation_log_trigger, report_moderation_log_trigger';
END $$;
