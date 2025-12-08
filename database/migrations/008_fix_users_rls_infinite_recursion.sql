-- Migration: 008_fix_users_rls_infinite_recursion
-- Description: Fix infinite recursion in users RLS policies by using auth.jwt() instead of self-referencing
-- Created: 2025-11-12
-- Issue: Admin policies on public.users reference public.users creating infinite recursion

-- ==============================================================================
-- FIX INFINITE RECURSION IN USERS RLS POLICIES
-- ==============================================================================

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Admins can update any user" ON public.users;

-- Create new admin policies using auth.jwt() to avoid self-reference
-- The JWT contains the user's custom claims including role

-- Helper function to check if current user is admin (SECURITY DEFINER to bypass RLS)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if current user has admin role (bypasses RLS due to SECURITY DEFINER)
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$;

-- Policy: Admins can view all users (using helper function to avoid infinite recursion)
CREATE POLICY "Admins can view all users"
  ON public.users
  FOR SELECT
  USING (
    -- Check role from JWT claims OR use SECURITY DEFINER function
    (auth.jwt() ->> 'role')::text = 'admin'
    OR
    public.is_admin() = true
  );

-- Policy: Admins can update any user (using helper function to avoid infinite recursion)
CREATE POLICY "Admins can update any user"
  ON public.users
  FOR UPDATE
  USING (
    -- Check role from JWT claims OR use SECURITY DEFINER function
    (auth.jwt() ->> 'role')::text = 'admin'
    OR
    public.is_admin() = true
  );

-- ==============================================================================
-- UPDATE AUTH.USERS METADATA WITH ROLE (FOR JWT CLAIMS)
-- ==============================================================================

-- Function to sync role to auth.users.raw_user_meta_data
-- This ensures the role is available in JWT tokens
CREATE OR REPLACE FUNCTION public.sync_user_role_to_auth_metadata()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update auth.users.raw_user_meta_data with the new role
  UPDATE auth.users
  SET raw_user_meta_data =
    COALESCE(raw_user_meta_data, '{}'::jsonb) ||
    jsonb_build_object('role', NEW.role)
  WHERE id = NEW.id;

  RETURN NEW;
END;
$$;

-- Create trigger to sync role changes
DROP TRIGGER IF EXISTS sync_user_role_trigger ON public.users;

CREATE TRIGGER sync_user_role_trigger
  AFTER INSERT OR UPDATE OF role ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_user_role_to_auth_metadata();

-- ==============================================================================
-- BACKFILL EXISTING USERS' ROLES TO AUTH METADATA
-- ==============================================================================

-- Update all existing users' roles in auth.users metadata
DO $$
DECLARE
  user_record RECORD;
BEGIN
  FOR user_record IN
    SELECT id, role FROM public.users
  LOOP
    UPDATE auth.users
    SET raw_user_meta_data =
      COALESCE(raw_user_meta_data, '{}'::jsonb) ||
      jsonb_build_object('role', user_record.role)
    WHERE id = user_record.id;
  END LOOP;
END $$;

-- ==============================================================================
-- MIGRATION COMPLETE
-- ==============================================================================

-- Verification: Check that policies are correctly created
-- SELECT * FROM pg_policies WHERE tablename = 'users' AND policyname LIKE '%Admin%';
