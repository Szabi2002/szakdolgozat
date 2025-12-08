-- Migration 023: Fix RLS Policies and Duplicate Foreign Keys
-- Description: Fixes permission denied errors and duplicate FK relationships
-- Date: 2025-01-18
-- Fixes:
--   BUG 1: Routes/:id - My Rating Not Loading (permission denied for table users)
--   BUG 2: Submit Rating Fails (permission denied for table users)
--   BUG 3: My Reports Page 500 Error (duplicate FK relationship)
--   BUG 4: Admin Reports Queue 500 Error (duplicate FK relationship)

-- =====================================================
-- PART 1: FIX USERS TABLE RLS POLICY
-- =====================================================
-- Problem: Only admins can SELECT from users table, but ratings/reports
-- queries need to access user data for display purposes.
-- Solution: Add policy allowing authenticated users to read basic user info.

-- Drop existing policy if exists
DROP POLICY IF EXISTS "Authenticated users can view basic user info" ON users;

-- Create policy allowing authenticated users to SELECT from users
CREATE POLICY "Authenticated users can view basic user info"
  ON users
  FOR SELECT
  TO authenticated
  USING (true);

-- Ensure RLS is enabled (should already be enabled)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

COMMENT ON POLICY "Authenticated users can view basic user info" ON users IS
  'Allows authenticated users to read basic user information for ratings and reports displays. This is safe because no sensitive data is exposed (password hashes are in auth.users, not public.users).';

-- Verify the policy was created
DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE tablename = 'users'
    AND policyname = 'Authenticated users can view basic user info';

  IF policy_count = 1 THEN
    RAISE NOTICE '✓ RLS policy created for users table';
  ELSE
    RAISE WARNING '✗ Failed to create RLS policy for users table';
  END IF;
END $$;

-- =====================================================
-- PART 2: FIX DUPLICATE FOREIGN KEYS ON REPORTS
-- =====================================================
-- Problem: Multiple FK constraints exist for the same column->table relationship
-- Solution: Drop the old auto-generated FKs, keep our explicitly named ones

-- Fix route_id FK (remove old, keep fk_reports_route_id)
DO $$
DECLARE
  fk_count INTEGER;
  old_fk_name TEXT;
BEGIN
  -- Count FKs from reports.route_id to routes.id
  SELECT COUNT(*) INTO fk_count
  FROM information_schema.table_constraints tc
  JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
  JOIN information_schema.constraint_column_usage ccu
    ON ccu.constraint_name = tc.constraint_name
  WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name = 'reports'
    AND kcu.column_name = 'route_id'
    AND ccu.table_name = 'routes';

  RAISE NOTICE 'Found % FK constraints from reports.route_id to routes', fk_count;

  -- If more than 1, drop the old one (not fk_reports_route_id)
  IF fk_count > 1 THEN
    -- Find the old FK name (not our explicitly named one)
    SELECT tc.constraint_name INTO old_fk_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_name = 'reports'
      AND kcu.column_name = 'route_id'
      AND tc.constraint_name != 'fk_reports_route_id'
    LIMIT 1;

    IF old_fk_name IS NOT NULL THEN
      EXECUTE format('ALTER TABLE reports DROP CONSTRAINT %I', old_fk_name);
      RAISE NOTICE '✓ Dropped duplicate FK: %', old_fk_name;
    END IF;
  ELSE
    RAISE NOTICE '✓ No duplicate route_id FK found';
  END IF;
END $$;

-- Fix stop_id FK (remove old, keep fk_reports_stop_id)
DO $$
DECLARE
  fk_count INTEGER;
  old_fk_name TEXT;
BEGIN
  SELECT COUNT(*) INTO fk_count
  FROM information_schema.table_constraints tc
  JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
  JOIN information_schema.constraint_column_usage ccu
    ON ccu.constraint_name = tc.constraint_name
  WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name = 'reports'
    AND kcu.column_name = 'stop_id'
    AND ccu.table_name = 'stops';

  RAISE NOTICE 'Found % FK constraints from reports.stop_id to stops', fk_count;

  IF fk_count > 1 THEN
    SELECT tc.constraint_name INTO old_fk_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_name = 'reports'
      AND kcu.column_name = 'stop_id'
      AND tc.constraint_name != 'fk_reports_stop_id'
    LIMIT 1;

    IF old_fk_name IS NOT NULL THEN
      EXECUTE format('ALTER TABLE reports DROP CONSTRAINT %I', old_fk_name);
      RAISE NOTICE '✓ Dropped duplicate FK: %', old_fk_name;
    END IF;
  ELSE
    RAISE NOTICE '✓ No duplicate stop_id FK found';
  END IF;
END $$;

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Verify users RLS policy exists
SELECT
  '✓ USERS RLS POLICY' as check_name,
  policyname,
  cmd,
  roles
FROM pg_policies
WHERE tablename = 'users'
  AND policyname = 'Authenticated users can view basic user info';

-- Verify reports FKs (should be exactly 2: route_id and stop_id)
SELECT
  '✓ REPORTS FOREIGN KEYS' as check_name,
  tc.constraint_name,
  kcu.column_name,
  ccu.table_name AS references_table
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'reports'
ORDER BY kcu.column_name;

-- Final summary
DO $$
DECLARE
  user_policy_count INTEGER;
  route_fk_count INTEGER;
  stop_fk_count INTEGER;
BEGIN
  -- Check users policy
  SELECT COUNT(*) INTO user_policy_count
  FROM pg_policies
  WHERE tablename = 'users'
    AND policyname = 'Authenticated users can view basic user info';

  -- Check route FK
  SELECT COUNT(*) INTO route_fk_count
  FROM information_schema.table_constraints tc
  JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
  JOIN information_schema.constraint_column_usage ccu
    ON ccu.constraint_name = tc.constraint_name
  WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name = 'reports'
    AND kcu.column_name = 'route_id'
    AND ccu.table_name = 'routes';

  -- Check stop FK
  SELECT COUNT(*) INTO stop_fk_count
  FROM information_schema.table_constraints tc
  JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
  JOIN information_schema.constraint_column_usage ccu
    ON ccu.constraint_name = tc.constraint_name
  WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name = 'reports'
    AND kcu.column_name = 'stop_id'
    AND ccu.table_name = 'stops';

  RAISE NOTICE '';
  RAISE NOTICE '================================================';
  RAISE NOTICE 'MIGRATION 023 VERIFICATION SUMMARY';
  RAISE NOTICE '================================================';

  IF user_policy_count = 1 THEN
    RAISE NOTICE '✓ Users RLS policy: OK';
  ELSE
    RAISE WARNING '✗ Users RLS policy: FAILED (count: %)', user_policy_count;
  END IF;

  IF route_fk_count = 1 THEN
    RAISE NOTICE '✓ Reports route FK: OK (exactly 1)';
  ELSE
    RAISE WARNING '✗ Reports route FK: FAILED (count: %)', route_fk_count;
  END IF;

  IF stop_fk_count = 1 THEN
    RAISE NOTICE '✓ Reports stop FK: OK (exactly 1)';
  ELSE
    RAISE WARNING '✗ Reports stop FK: FAILED (count: %)', stop_fk_count;
  END IF;

  RAISE NOTICE '================================================';

  IF user_policy_count = 1 AND route_fk_count = 1 AND stop_fk_count = 1 THEN
    RAISE NOTICE '✓✓✓ ALL CHECKS PASSED - MIGRATION SUCCESSFUL ✓✓✓';
  ELSE
    RAISE WARNING '✗✗✗ SOME CHECKS FAILED - REVIEW ABOVE ✗✗✗';
  END IF;

  RAISE NOTICE '================================================';
  RAISE NOTICE '';
END $$;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

COMMENT ON TABLE users IS 'User profiles. RLS enabled with policy allowing authenticated users to read basic info for ratings/reports display.';
COMMENT ON TABLE reports IS 'User-submitted reports. Foreign keys cleaned up to prevent duplicate relationship errors.';
