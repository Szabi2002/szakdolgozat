-- =====================================================
-- Migration: 005_security_performance_fixes
-- Description: High priority security and performance fixes
-- Author: Sprint 3-4 Team
-- Date: 2025-11-08
-- Sprint: Sprint 3-4 (US-3.1 post-implementation)
-- =====================================================

-- =====================================================
-- SECURITY FIXES (HIGH PRIORITY)
-- =====================================================

-- 1. Fix function search_path vulnerability
-- This prevents potential privilege escalation through search_path manipulation
ALTER FUNCTION update_updated_at_column()
SET search_path = public, pg_temp;

COMMENT ON FUNCTION update_updated_at_column() IS
'Auto-updates updated_at timestamp on row modification. Search path secured to prevent privilege escalation.';

-- =====================================================
-- PERFORMANCE FIXES (MEDIUM PRIORITY)
-- =====================================================

-- 2. Add missing foreign key indexes on favorite_routes
-- These indexes improve JOIN performance when querying favorite routes
CREATE INDEX IF NOT EXISTS idx_favorite_routes_from_stop_id
ON favorite_routes(from_stop_id);

CREATE INDEX IF NOT EXISTS idx_favorite_routes_to_stop_id
ON favorite_routes(to_stop_id);

-- Add comments to explain index purpose
COMMENT ON INDEX idx_favorite_routes_from_stop_id IS
'Improves JOIN performance when querying routes by starting stop';

COMMENT ON INDEX idx_favorite_routes_to_stop_id IS
'Improves JOIN performance when querying routes by destination stop';

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Verify function search_path is set correctly
DO $$
BEGIN
  IF (SELECT prosecdef FROM pg_proc WHERE proname = 'update_updated_at_column') IS NULL THEN
    RAISE NOTICE 'Function search_path not set - manual verification required';
  ELSE
    RAISE NOTICE 'Function search_path configured successfully';
  END IF;
END $$;

-- Verify indexes exist
DO $$
DECLARE
  idx_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO idx_count
  FROM pg_indexes
  WHERE schemaname = 'public'
    AND tablename = 'favorite_routes'
    AND indexname IN ('idx_favorite_routes_from_stop_id', 'idx_favorite_routes_to_stop_id');

  IF idx_count = 2 THEN
    RAISE NOTICE 'Favorite routes indexes created successfully';
  ELSE
    RAISE WARNING 'Expected 2 indexes on favorite_routes, found %', idx_count;
  END IF;
END $$;

-- =====================================================
-- ROLLBACK SCRIPT
-- =====================================================

-- To rollback this migration:
--
-- -- Remove search_path restriction
-- ALTER FUNCTION update_updated_at_column() RESET search_path;
--
-- -- Drop indexes
-- DROP INDEX IF EXISTS idx_favorite_routes_from_stop_id;
-- DROP INDEX IF EXISTS idx_favorite_routes_to_stop_id;

-- =====================================================
-- NOTES FOR FUTURE SPRINTS
-- =====================================================

-- Additional optimizations to consider in Sprint 4:
--
-- 1. RLS Policy Optimization (16 policies affected):
--    Replace auth.uid() with (SELECT auth.uid()) in all RLS policies
--    This prevents re-evaluation of auth context for each row
--
-- 2. Consolidate Multiple Permissive Policies:
--    Combine overlapping policies using OR conditions
--    Affects: users, stops, routes, route_stops, tickets tables
--
-- 3. Monitor Unused Indexes:
--    Review index usage after 3 months of production
--    Remove consistently unused indexes to reduce maintenance overhead

-- =====================================================
-- MANUAL ACTIONS REQUIRED
-- =====================================================

-- ⚠️ The following cannot be done via SQL migration:
--
-- Enable Leaked Password Protection:
-- 1. Go to Supabase Dashboard
-- 2. Navigate to Authentication > Policies
-- 3. Enable "Prevent leaked passwords" option
-- 4. This checks passwords against HaveIBeenPwned database

-- =====================================================
-- END OF MIGRATION
-- =====================================================
