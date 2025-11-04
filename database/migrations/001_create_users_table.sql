-- Migration: 001_create_users_table
-- Description: Creates the public users table that extends auth.users
-- Created: 2025-11-02
-- Dependencies: Supabase Auth (auth.users table must exist)

-- ==============================================================================
-- 1. CREATE PUBLIC USERS TABLE
-- ==============================================================================

-- Public users table (extends Supabase auth.users with application-specific data)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  profile_picture_url TEXT,
  google_id TEXT UNIQUE,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'provider')),
  notification_preferences JSONB DEFAULT '{"email": true}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add comments for documentation
COMMENT ON TABLE public.users IS 'Application user profiles extending Supabase auth.users';
COMMENT ON COLUMN public.users.id IS 'User ID (references auth.users.id)';
COMMENT ON COLUMN public.users.email IS 'User email address';
COMMENT ON COLUMN public.users.name IS 'User display name';
COMMENT ON COLUMN public.users.profile_picture_url IS 'URL to profile picture in Supabase Storage';
COMMENT ON COLUMN public.users.google_id IS 'Google OAuth ID for Google sign-in users';
COMMENT ON COLUMN public.users.role IS 'User role: user, admin, or provider';
COMMENT ON COLUMN public.users.notification_preferences IS 'JSON object with notification settings';

-- ==============================================================================
-- 2. CREATE INDEXES FOR PERFORMANCE
-- ==============================================================================

-- Index on email for fast lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

-- Index on google_id for OAuth lookups
CREATE INDEX IF NOT EXISTS idx_users_google_id ON public.users(google_id) WHERE google_id IS NOT NULL;

-- Index on role for admin queries
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);

-- ==============================================================================
-- 3. ENABLE ROW LEVEL SECURITY (RLS)
-- ==============================================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- 4. CREATE RLS POLICIES
-- ==============================================================================

-- Policy: Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON public.users
  FOR SELECT
  USING (auth.uid() = id);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON public.users
  FOR UPDATE
  USING (auth.uid() = id);

-- Policy: Admins can view all users
CREATE POLICY "Admins can view all users"
  ON public.users
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Policy: Admins can update any user
CREATE POLICY "Admins can update any user"
  ON public.users
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Policy: Service role can insert users (for auth trigger)
-- Note: INSERT is restricted to the handle_new_user() trigger function
-- No direct INSERT policy for regular users

-- ==============================================================================
-- 5. CREATE TRIGGER FUNCTION FOR AUTO USER PROFILE CREATION
-- ==============================================================================

-- Function to automatically create a user profile when a new auth user is created
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert a new row into public.users when a user signs up
  INSERT INTO public.users (id, email, name, google_id)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'sub'  -- Google's unique user ID
  );

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the auth signup
    RAISE WARNING 'Failed to create user profile for %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- Add comment
COMMENT ON FUNCTION public.handle_new_user() IS 'Automatically creates a user profile in public.users when a new auth.users record is inserted';

-- ==============================================================================
-- 6. CREATE TRIGGER ON AUTH.USERS
-- ==============================================================================

-- Drop trigger if it already exists (for idempotency)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger to call handle_new_user() after auth user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- 7. CREATE TRIGGER FUNCTION FOR UPDATED_AT TIMESTAMP
-- ==============================================================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ==============================================================================
-- 8. GRANT PERMISSIONS
-- ==============================================================================

-- Grant authenticated users access to the users table (controlled by RLS)
GRANT SELECT, UPDATE ON public.users TO authenticated;

-- Anon users can't access the table directly (auth only)
REVOKE ALL ON public.users FROM anon;

-- ==============================================================================
-- MIGRATION COMPLETE
-- ==============================================================================

-- Verification queries (uncomment to test):
-- SELECT * FROM public.users LIMIT 1;
-- SELECT * FROM pg_policies WHERE tablename = 'users';
-- SELECT * FROM pg_indexes WHERE tablename = 'users';
