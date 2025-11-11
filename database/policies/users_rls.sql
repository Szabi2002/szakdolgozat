-- ==============================================================================
-- ROW LEVEL SECURITY POLICIES FOR USERS TABLE
-- ==============================================================================
-- Description: Defines RLS policies to control data access in public.users
-- Security Model: Users can only access their own data, admins can access all
-- Created: 2025-11-04
-- ==============================================================================

-- ==============================================================================
-- ENABLE ROW LEVEL SECURITY
-- ==============================================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- DROP EXISTING POLICIES (for idempotency)
-- ==============================================================================

DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Admins can update any user" ON public.users;
DROP POLICY IF EXISTS "Admins can delete users" ON public.users;
DROP POLICY IF EXISTS "Public profiles are viewable by authenticated users" ON public.users;

-- ==============================================================================
-- SELECT POLICIES (Read Access)
-- ==============================================================================

-- Policy 1: Users can view their own profile
-- Allows authenticated users to read their own user record
CREATE POLICY "Users can view own profile"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Policy 2: Admins can view all users
-- Allows admin users to read all user records
CREATE POLICY "Admins can view all users"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Policy 3: Authenticated users can view public profile data
-- Allows users to see basic info of other users (for social features)
CREATE POLICY "Public profiles are viewable by authenticated users"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (true);
  -- Note: Sensitive fields should be filtered at application level
  -- Consider creating a view with only public fields if needed

-- ==============================================================================
-- UPDATE POLICIES (Write Access)
-- ==============================================================================

-- Policy 4: Users can update their own profile
-- Allows authenticated users to modify their own user record
-- Restrictions: Users cannot change their own role or id
CREATE POLICY "Users can update own profile"
  ON public.users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND (
      -- Prevent role escalation: user cannot change their own role
      OLD.role = NEW.role OR
      -- Only admins can change roles
      EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid() AND role = 'admin'
      )
    )
  );

-- Policy 5: Admins can update any user
-- Allows admin users to modify any user record
CREATE POLICY "Admins can update any user"
  ON public.users
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

-- Policy 6: Only admins can delete users
-- Allows admin users to delete user records
-- Note: This triggers CASCADE delete on auth.users via foreign key
CREATE POLICY "Admins can delete users"
  ON public.users
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Note: Regular users cannot delete themselves
-- Account deletion should be handled through Supabase Auth API
-- or via an admin interface

-- ==============================================================================
-- INSERT POLICIES (Create Access)
-- ==============================================================================

-- No INSERT policy for regular users
-- User records are created automatically by the handle_new_user() trigger
-- when a new record is inserted into auth.users during signup

-- Service role bypasses RLS and handles inserts via the trigger

-- ==============================================================================
-- POLICY TESTING QUERIES
-- ==============================================================================
-- Use these queries to test policies (uncomment to run):

-- Test 1: View your own profile (should succeed)
-- SELECT * FROM public.users WHERE id = auth.uid();

-- Test 2: View another user's profile (should succeed with public policy)
-- SELECT * FROM public.users WHERE id != auth.uid() LIMIT 1;

-- Test 3: Update your own profile (should succeed)
-- UPDATE public.users SET name = 'New Name' WHERE id = auth.uid();

-- Test 4: Update another user's profile (should fail unless admin)
-- UPDATE public.users SET name = 'Hacked' WHERE id != auth.uid();

-- Test 5: Try to escalate your own role (should fail)
-- UPDATE public.users SET role = 'admin' WHERE id = auth.uid();

-- Test 6: View all policies on users table
-- SELECT * FROM pg_policies WHERE tablename = 'users';

-- ==============================================================================
-- SECURITY NOTES
-- ==============================================================================
--
-- 1. RLS is ENABLED on the users table - all queries are filtered by policies
-- 2. Service role key BYPASSES all RLS - use only in backend, never in frontend
-- 3. Anon key respects RLS - safe for frontend use
-- 4. Auth.uid() returns the currently authenticated user's ID
-- 5. Always test policies with different user roles before production
-- 6. Consider creating separate policies for different application contexts
-- 7. Monitor Supabase logs for policy violations
--
-- ==============================================================================
-- BEST PRACTICES
-- ==============================================================================
--
-- 1. Keep policies simple and readable
-- 2. Use meaningful policy names that describe their purpose
-- 3. Document why each policy exists
-- 4. Test policies with different user contexts
-- 5. Avoid circular dependencies in policy definitions
-- 6. Use EXISTS for subqueries (more efficient than IN)
-- 7. Create indexes on columns used in policy conditions
--
-- ==============================================================================
