-- Migration 019: Reports/Feedback System
-- Description: Creates reports and report_photos tables with RLS policies for user issue reporting
-- Date: 2025-01-13
-- Sprint: 11-12

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- REPORTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  route_id UUID REFERENCES routes(id) ON DELETE SET NULL,
  stop_id UUID REFERENCES stops(id) ON DELETE SET NULL,

  -- Report categorization
  report_type VARCHAR(50) NOT NULL CHECK (report_type IN ('service_issue', 'safety_concern', 'cleanliness', 'accessibility', 'other')),

  -- Report content
  title VARCHAR(200) NOT NULL CHECK (LENGTH(title) >= 10 AND LENGTH(title) <= 200),
  description TEXT NOT NULL CHECK (LENGTH(description) >= 20),
  location TEXT, -- Optional free-text location description

  -- Status tracking
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_review', 'resolved', 'dismissed')),
  priority VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),

  -- Admin fields
  admin_notes TEXT, -- For admin use only
  resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  resolved_at TIMESTAMP WITH TIME ZONE,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- REPORT PHOTOS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS report_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INDEXES
-- =====================================================

-- Reports table indexes for performance
CREATE INDEX IF NOT EXISTS idx_reports_user_id ON reports(user_id);
CREATE INDEX IF NOT EXISTS idx_reports_route_id ON reports(route_id);
CREATE INDEX IF NOT EXISTS idx_reports_stop_id ON reports(stop_id);
CREATE INDEX IF NOT EXISTS idx_reports_report_type ON reports(report_type);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_priority ON reports(priority);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at DESC);

-- Composite indexes for common admin queries
CREATE INDEX IF NOT EXISTS idx_reports_status_priority ON reports(status, priority) WHERE status IN ('pending', 'in_review');
CREATE INDEX IF NOT EXISTS idx_reports_unresolved ON reports(created_at DESC) WHERE status IN ('pending', 'in_review');

-- Report photos table indexes
CREATE INDEX IF NOT EXISTS idx_report_photos_report_id ON report_photos(report_id);

-- =====================================================
-- CONSTRAINTS
-- =====================================================

-- Function to check maximum 5 photos per report
CREATE OR REPLACE FUNCTION check_report_photos_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT COUNT(*) FROM report_photos WHERE report_id = NEW.report_id) >= 5 THEN
    RAISE EXCEPTION 'Cannot add more than 5 photos to a report';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to enforce 5 photos limit
DROP TRIGGER IF EXISTS report_photos_limit_trigger ON report_photos;
CREATE TRIGGER report_photos_limit_trigger
  BEFORE INSERT ON report_photos
  FOR EACH ROW
  EXECUTE FUNCTION check_report_photos_limit();

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on both tables
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_photos ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- REPORTS TABLE POLICIES
-- =====================================================

-- Policy 1: Users can view all reports (for community awareness)
CREATE POLICY "Users can view all reports"
  ON reports FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Policy 2: Users can insert their own reports
CREATE POLICY "Users can insert own reports"
  ON reports FOR INSERT
  WITH CHECK (auth.uid() = user_id AND status = 'pending');

-- Policy 3: Users can update their own pending reports
CREATE POLICY "Users can update own pending reports"
  ON reports FOR UPDATE
  USING (auth.uid() = user_id AND status = 'pending')
  WITH CHECK (auth.uid() = user_id AND status = 'pending');

-- Policy 4: Users can delete their own pending reports
CREATE POLICY "Users can delete own pending reports"
  ON reports FOR DELETE
  USING (auth.uid() = user_id AND status = 'pending');

-- Policy 5: Admins can view all reports (including admin_notes)
CREATE POLICY "Admins can view all reports"
  ON reports FOR SELECT
  USING (
    auth.uid() IN (
      SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Policy 6: Admins can update all reports (change status, priority, add notes)
CREATE POLICY "Admins can update all reports"
  ON reports FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Note: Admins CANNOT delete reports to preserve audit trail

-- =====================================================
-- REPORT PHOTOS TABLE POLICIES
-- =====================================================

-- Policy 1: Users can view all report photos (community awareness)
CREATE POLICY "Users can view all report photos"
  ON report_photos FOR SELECT
  USING (
    auth.uid() IS NOT NULL
  );

-- Policy 2: Users can insert photos for their own pending reports
CREATE POLICY "Users can insert photos for own pending reports"
  ON report_photos FOR INSERT
  WITH CHECK (
    report_id IN (
      SELECT id FROM reports WHERE user_id = auth.uid() AND status = 'pending'
    )
  );

-- Policy 3: Users can delete photos from their own pending reports
CREATE POLICY "Users can delete photos from own pending reports"
  ON report_photos FOR DELETE
  USING (
    report_id IN (
      SELECT id FROM reports WHERE user_id = auth.uid() AND status = 'pending'
    )
  );

-- Policy 4: Admins can view all photos
CREATE POLICY "Admins can view all report photos"
  ON report_photos FOR SELECT
  USING (
    auth.uid() IN (
      SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Policy 5: Admins can delete any photo
CREATE POLICY "Admins can delete all report photos"
  ON report_photos FOR DELETE
  USING (
    auth.uid() IN (
      SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin'
    )
  );

-- =====================================================
-- TRIGGERS FOR TIMESTAMPS
-- =====================================================

-- Reuse existing update_updated_at_column function if it exists
-- Otherwise create it
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for reports table updated_at
DROP TRIGGER IF EXISTS update_reports_updated_at ON reports;
CREATE TRIGGER update_reports_updated_at
  BEFORE UPDATE ON reports
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- TRIGGER FOR RESOLVED TIMESTAMP
-- =====================================================

-- Function to set resolved_at timestamp when status changes to resolved
CREATE OR REPLACE FUNCTION set_resolved_at()
RETURNS TRIGGER AS $$
BEGIN
  -- Set resolved_at when status changes to resolved
  IF NEW.status = 'resolved' AND OLD.status != 'resolved' THEN
    NEW.resolved_at = NOW();
    -- Set resolved_by to current admin user if not already set
    IF NEW.resolved_by IS NULL THEN
      NEW.resolved_by = auth.uid();
    END IF;
  END IF;

  -- Clear resolved_at if status changes away from resolved
  IF NEW.status != 'resolved' AND OLD.status = 'resolved' THEN
    NEW.resolved_at = NULL;
    NEW.resolved_by = NULL;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for setting resolved_at
DROP TRIGGER IF EXISTS reports_resolved_timestamp ON reports;
CREATE TRIGGER reports_resolved_timestamp
  BEFORE UPDATE ON reports
  FOR EACH ROW
  EXECUTE FUNCTION set_resolved_at();

-- =====================================================
-- TRIGGER FOR AUTO-ESCALATION
-- =====================================================

-- Function to auto-increment priority for stale reports
CREATE OR REPLACE FUNCTION escalate_stale_reports()
RETURNS void AS $$
BEGIN
  -- Escalate low priority reports older than 7 days to medium
  UPDATE reports
  SET priority = 'medium'
  WHERE status IN ('pending', 'in_review')
    AND priority = 'low'
    AND created_at < NOW() - INTERVAL '7 days';

  -- Escalate medium priority reports older than 7 days to high
  UPDATE reports
  SET priority = 'high'
  WHERE status IN ('pending', 'in_review')
    AND priority = 'medium'
    AND created_at < NOW() - INTERVAL '7 days';

  -- Escalate high priority reports older than 7 days to critical
  UPDATE reports
  SET priority = 'critical'
  WHERE status IN ('pending', 'in_review')
    AND priority = 'high'
    AND created_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;

-- Note: This function should be called via a scheduled job (cron)
-- Example: SELECT escalate_stale_reports();

-- =====================================================
-- HELPER VIEWS
-- =====================================================

-- View for unresolved reports summary
CREATE OR REPLACE VIEW unresolved_reports_summary AS
SELECT
  report_type,
  priority,
  COUNT(*) as count,
  AVG(EXTRACT(EPOCH FROM (NOW() - created_at))/86400)::INTEGER as avg_age_days,
  MIN(created_at) as oldest_report,
  MAX(created_at) as newest_report
FROM reports
WHERE status IN ('pending', 'in_review')
GROUP BY report_type, priority
ORDER BY
  CASE priority
    WHEN 'critical' THEN 1
    WHEN 'high' THEN 2
    WHEN 'medium' THEN 3
    WHEN 'low' THEN 4
  END,
  count DESC;

-- View for critical reports queue (admin priority queue)
CREATE OR REPLACE VIEW critical_reports_queue AS
SELECT
  r.id,
  r.user_id,
  r.route_id,
  r.stop_id,
  r.report_type,
  r.title,
  r.description,
  r.location,
  r.priority,
  r.status,
  r.created_at,
  EXTRACT(EPOCH FROM (NOW() - r.created_at))/3600 as age_hours,
  COUNT(rp.id) as photo_count
FROM reports r
LEFT JOIN report_photos rp ON r.id = rp.report_id
WHERE r.status IN ('pending', 'in_review')
  AND r.priority IN ('high', 'critical')
GROUP BY r.id, r.user_id, r.route_id, r.stop_id, r.report_type,
         r.title, r.description, r.location, r.priority, r.status, r.created_at
ORDER BY
  CASE r.priority
    WHEN 'critical' THEN 1
    WHEN 'high' THEN 2
  END,
  r.created_at ASC;

-- View for user report history
CREATE OR REPLACE VIEW user_report_history AS
SELECT
  r.id,
  r.user_id,
  r.route_id,
  r.stop_id,
  r.report_type,
  r.title,
  r.status,
  r.priority,
  r.created_at,
  r.resolved_at,
  COUNT(rp.id) as photo_count
FROM reports r
LEFT JOIN report_photos rp ON r.id = rp.report_id
GROUP BY r.id, r.user_id, r.route_id, r.stop_id, r.report_type,
         r.title, r.status, r.priority, r.created_at, r.resolved_at
ORDER BY r.created_at DESC;

-- View for report statistics by type
CREATE OR REPLACE VIEW report_type_statistics AS
SELECT
  report_type,
  COUNT(*) as total_reports,
  COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count,
  COUNT(CASE WHEN status = 'in_review' THEN 1 END) as in_review_count,
  COUNT(CASE WHEN status = 'resolved' THEN 1 END) as resolved_count,
  COUNT(CASE WHEN status = 'dismissed' THEN 1 END) as dismissed_count,
  COUNT(CASE WHEN priority = 'critical' THEN 1 END) as critical_count,
  COUNT(CASE WHEN priority = 'high' THEN 1 END) as high_count,
  AVG(
    CASE WHEN resolved_at IS NOT NULL
    THEN EXTRACT(EPOCH FROM (resolved_at - created_at))/3600
    END
  )::DECIMAL(10,2) as avg_resolution_hours
FROM reports
GROUP BY report_type
ORDER BY total_reports DESC;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE reports IS 'Stores user-submitted reports and feedback about service issues, safety concerns, cleanliness, accessibility, and other topics';
COMMENT ON TABLE report_photos IS 'Stores photos attached to reports (max 5 per report)';

COMMENT ON COLUMN reports.report_type IS 'Type of report: service_issue, safety_concern, cleanliness, accessibility, or other';
COMMENT ON COLUMN reports.title IS 'Brief title/summary of the report (10-200 characters)';
COMMENT ON COLUMN reports.description IS 'Detailed description of the issue (minimum 20 characters)';
COMMENT ON COLUMN reports.location IS 'Optional free-text location description';
COMMENT ON COLUMN reports.status IS 'Current status: pending (default), in_review, resolved, or dismissed';
COMMENT ON COLUMN reports.priority IS 'Priority level: low, medium (default), high, or critical';
COMMENT ON COLUMN reports.admin_notes IS 'Internal notes for admin use only - not visible to regular users';
COMMENT ON COLUMN reports.resolved_by IS 'Admin user who resolved the report';
COMMENT ON COLUMN reports.resolved_at IS 'Timestamp when report was resolved';

COMMENT ON VIEW unresolved_reports_summary IS 'Summary statistics of unresolved reports grouped by type and priority';
COMMENT ON VIEW critical_reports_queue IS 'High and critical priority unresolved reports for admin action';
COMMENT ON VIEW user_report_history IS 'User-friendly view of report history with photo counts';
COMMENT ON VIEW report_type_statistics IS 'Statistical analysis of reports by type including resolution times';

-- =====================================================
-- SECURITY FUNCTION FOR ADMIN_NOTES
-- =====================================================

-- Function to check if user is admin (used in application layer)
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid()
    AND raw_user_meta_data->>'role' = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION is_admin() IS 'Returns true if the current user is an admin. Used to conditionally show admin_notes in application layer.';

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
