-- ==============================================================================
-- ROW LEVEL SECURITY POLICIES FOR ROUTES TABLE
-- ==============================================================================
-- Description: Defines RLS policies to control data access in public.routes
-- Security Model: Routes are public read-only, admins can modify
-- Created: 2025-11-11
-- ==============================================================================

-- ==============================================================================
-- ENABLE ROW LEVEL SECURITY
-- ==============================================================================

ALTER TABLE public.routes ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- DROP EXISTING POLICIES (for idempotency)
-- ==============================================================================

DROP POLICY IF EXISTS "Public read access to routes" ON public.routes;
DROP POLICY IF EXISTS "Admins can insert routes" ON public.routes;
DROP POLICY IF EXISTS "Admins can update routes" ON public.routes;
DROP POLICY IF EXISTS "Admins can delete routes" ON public.routes;

-- ==============================================================================
-- SELECT POLICIES (Read Access)
-- ==============================================================================

-- Policy 1: Public read access to routes
-- Allows anyone (authenticated and anonymous) to read route information
-- Routes are public transit data and should be accessible to all users
CREATE POLICY "Public read access to routes"
  ON public.routes
  FOR SELECT
  TO public
  USING (true);

-- ==============================================================================
-- INSERT POLICIES (Create Access)
-- ==============================================================================

-- Policy 2: Only admins can create routes
-- Allows admin users to add new routes
CREATE POLICY "Admins can insert routes"
  ON public.routes
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ==============================================================================
-- UPDATE POLICIES (Write Access)
-- ==============================================================================

-- Policy 3: Only admins can update routes
-- Allows admin users to modify route information
CREATE POLICY "Admins can update routes"
  ON public.routes
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ==============================================================================
-- DELETE POLICIES (Delete Access)
-- ==============================================================================

-- Policy 4: Only admins can delete routes
-- Allows admin users to delete routes
-- Note: Consider soft-delete approach (is_active flag) for historical data
CREATE POLICY "Admins can delete routes"
  ON public.routes
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ==============================================================================
-- POLICY TESTING QUERIES
-- ==============================================================================
-- Use these queries to test policies (uncomment to run):

-- Test 1: View all routes (should succeed for everyone)
-- SELECT * FROM public.routes;

-- Test 2: View active routes only (should succeed)
-- SELECT * FROM public.routes WHERE is_active = true;

-- Test 3: Try to create a route as regular user (should fail)
-- INSERT INTO public.routes (route_number, route_name, vehicle_type)
-- VALUES ('TEST', 'Test Route', 'bus');

-- Test 4: Create a route as admin (should succeed)
-- INSERT INTO public.routes (route_number, route_name, vehicle_type)
-- VALUES ('ADMIN1', 'Admin Route', 'bus');

-- Test 5: Try to update a route as regular user (should fail)
-- UPDATE public.routes SET route_name = 'Hacked' WHERE route_number = '1';

-- Test 6: Update a route as admin (should succeed)
-- UPDATE public.routes SET is_active = false WHERE route_number = 'TEST';

-- ==============================================================================
-- SECURITY NOTES
-- ==============================================================================
--
-- 1. RLS is ENABLED on the routes table - all queries are filtered by policies
-- 2. Routes are PUBLIC READ - any user can view route information
-- 3. Only admins can CREATE, UPDATE, or DELETE routes
-- 4. Service role key BYPASSES all RLS - use only in backend
-- 5. Consider using is_active flag for soft deletes to preserve historical data
-- 6. Routes are public transit data and do not contain sensitive information
--
-- ==============================================================================
-- BEST PRACTICES
-- ==============================================================================
--
-- 1. Use soft deletes (is_active = false) instead of hard deletes
-- 2. Keep route data current and accurate
-- 3. Implement versioning for route changes if needed
-- 4. Consider caching route data for performance
-- 5. Index commonly queried fields (route_number, vehicle_type, is_active)
--
-- ==============================================================================
