-- Migration 022: Fix Missing Foreign Key Constraints
-- Description: Ensures all foreign key constraints exist for ratings and reports
-- Date: 2025-01-18
-- Fixes: Bugs 3, 4, 5, 6, 7

-- =====================================================
-- RATINGS TABLE FOREIGN KEY
-- =====================================================

-- Add foreign key for ratings.route_id if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_ratings_route_id'
      AND table_name = 'ratings'
  ) THEN
    ALTER TABLE ratings
      ADD CONSTRAINT fk_ratings_route_id
      FOREIGN KEY (route_id)
      REFERENCES routes(id)
      ON DELETE CASCADE;

    RAISE NOTICE 'Added fk_ratings_route_id constraint';
  ELSE
    RAISE NOTICE 'fk_ratings_route_id constraint already exists';
  END IF;
END $$;

-- =====================================================
-- REPORTS TABLE FOREIGN KEYS
-- =====================================================

-- Add foreign key for reports.route_id if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_reports_route_id'
      AND table_name = 'reports'
  ) THEN
    ALTER TABLE reports
      ADD CONSTRAINT fk_reports_route_id
      FOREIGN KEY (route_id)
      REFERENCES routes(id)
      ON DELETE SET NULL;

    RAISE NOTICE 'Added fk_reports_route_id constraint';
  ELSE
    RAISE NOTICE 'fk_reports_route_id constraint already exists';
  END IF;
END $$;

-- Add foreign key for reports.stop_id if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_reports_stop_id'
      AND table_name = 'reports'
  ) THEN
    ALTER TABLE reports
      ADD CONSTRAINT fk_reports_stop_id
      FOREIGN KEY (stop_id)
      REFERENCES stops(id)
      ON DELETE SET NULL;

    RAISE NOTICE 'Added fk_reports_stop_id constraint';
  ELSE
    RAISE NOTICE 'fk_reports_stop_id constraint already exists';
  END IF;
END $$;

-- =====================================================
-- VERIFICATION
-- =====================================================

-- List all foreign keys to verify
SELECT
  tc.table_name,
  tc.constraint_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name IN ('ratings', 'reports')
ORDER BY tc.table_name, tc.constraint_name;

COMMENT ON CONSTRAINT fk_ratings_route_id ON ratings IS
  'Foreign key to routes table - enables relationship queries and ensures data integrity';
COMMENT ON CONSTRAINT fk_reports_route_id ON reports IS
  'Foreign key to routes table - enables relationship queries for reports';
COMMENT ON CONSTRAINT fk_reports_stop_id ON reports IS
  'Foreign key to stops table - enables relationship queries for reports';
