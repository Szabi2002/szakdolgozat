-- ==============================================================================
-- USERS TABLE SCHEMA DEFINITION
-- ==============================================================================
-- Description: Defines the structure of the public.users table
-- This schema extends Supabase auth.users with application-specific data
-- Created: 2025-11-04
-- ==============================================================================

-- Table: public.users
-- Purpose: Store application-specific user profile data
-- Relationship: One-to-one with auth.users (user_id as foreign key)

CREATE TABLE IF NOT EXISTS public.users (
  -- Primary Key (references Supabase auth.users)
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Basic Profile Information
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  profile_picture_url TEXT,

  -- OAuth Integration
  google_id TEXT UNIQUE,

  -- Role-Based Access Control
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'provider')),

  -- User Preferences
  notification_preferences JSONB DEFAULT '{"email": true}'::jsonb,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- COLUMN DESCRIPTIONS
-- ==============================================================================

COMMENT ON TABLE public.users IS 'Application user profiles extending Supabase auth.users';
COMMENT ON COLUMN public.users.id IS 'User ID (references auth.users.id)';
COMMENT ON COLUMN public.users.email IS 'User email address (synced from auth.users)';
COMMENT ON COLUMN public.users.name IS 'User display name (from OAuth or manual entry)';
COMMENT ON COLUMN public.users.profile_picture_url IS 'URL to profile picture in Supabase Storage';
COMMENT ON COLUMN public.users.google_id IS 'Google OAuth unique identifier';
COMMENT ON COLUMN public.users.role IS 'User role: user (default), admin, or provider';
COMMENT ON COLUMN public.users.notification_preferences IS 'JSON object with notification settings';
COMMENT ON COLUMN public.users.created_at IS 'Timestamp when user profile was created';
COMMENT ON COLUMN public.users.updated_at IS 'Timestamp when user profile was last updated';

-- ==============================================================================
-- INDEXES FOR PERFORMANCE
-- ==============================================================================

-- Fast email lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

-- Fast OAuth lookups
CREATE INDEX IF NOT EXISTS idx_users_google_id ON public.users(google_id) WHERE google_id IS NOT NULL;

-- Fast role-based queries
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);

-- Fast timestamp-based queries
CREATE INDEX IF NOT EXISTS idx_users_created_at ON public.users(created_at);

-- ==============================================================================
-- CONSTRAINTS
-- ==============================================================================

-- Ensure email is valid format (basic check)
ALTER TABLE public.users ADD CONSTRAINT users_email_format_check
  CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

-- Ensure role is one of the allowed values
-- (already handled by CHECK constraint in column definition)

-- ==============================================================================
-- GRANTS AND PERMISSIONS
-- ==============================================================================

-- Authenticated users can read/update their own data (via RLS policies)
GRANT SELECT, UPDATE ON public.users TO authenticated;

-- Anonymous users have no access
REVOKE ALL ON public.users FROM anon;

-- ==============================================================================
-- NOTES
-- ==============================================================================
--
-- 1. Row Level Security (RLS) policies are defined in: database/policies/users_rls.sql
-- 2. This table is automatically populated by a trigger on auth.users
-- 3. The trigger function is defined in: database/migrations/001_create_users_table.sql
-- 4. Always use Supabase client libraries to interact with this table
-- 5. Never expose the service_role key to frontend applications
--
-- ==============================================================================
