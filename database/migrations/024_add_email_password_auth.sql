-- Migration: 024_add_email_password_auth
-- Description: Adds email/password authentication support and creates admin user
-- Created: 2025-11-16
-- Dependencies: 001_create_users_table.sql

-- ==============================================================================
-- 1. ALTER USERS TABLE - ADD EMAIL/PASSWORD AUTH COLUMNS
-- ==============================================================================

-- Add password hash column for email/password authentication
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- Add email verification columns
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;

ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS verification_token TEXT;

ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS verification_token_expires TIMESTAMPTZ;

-- Add password reset columns
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS reset_token TEXT;

ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS reset_token_expires TIMESTAMPTZ;

-- Make google_id nullable (users can sign up with email/password OR Google)
ALTER TABLE public.users
ALTER COLUMN google_id DROP NOT NULL;

-- Add comments for new columns
COMMENT ON COLUMN public.users.password_hash IS 'Bcrypt hashed password (null for Google-only users)';
COMMENT ON COLUMN public.users.email_verified IS 'Whether email has been verified';
COMMENT ON COLUMN public.users.verification_token IS 'Token for email verification';
COMMENT ON COLUMN public.users.verification_token_expires IS 'Expiration time for verification token';
COMMENT ON COLUMN public.users.reset_token IS 'Token for password reset';
COMMENT ON COLUMN public.users.reset_token_expires IS 'Expiration time for reset token';

-- ==============================================================================
-- 2. CREATE INDEXES FOR TOKEN LOOKUPS
-- ==============================================================================

-- Index for verification token lookups
CREATE INDEX IF NOT EXISTS idx_users_verification_token
ON public.users(verification_token)
WHERE verification_token IS NOT NULL;

-- Index for reset token lookups
CREATE INDEX IF NOT EXISTS idx_users_reset_token
ON public.users(reset_token)
WHERE reset_token IS NOT NULL;

-- ==============================================================================
-- 3. CREATE ADMIN USER
-- ==============================================================================

-- Create admin user in auth.users table
DO $$
DECLARE
  admin_user_id UUID;
BEGIN
  -- Check if admin user already exists
  SELECT id INTO admin_user_id
  FROM auth.users
  WHERE email = 'admin@admin.com';

  -- Only create if doesn't exist
  IF admin_user_id IS NULL THEN
    -- Generate a new UUID for admin user
    admin_user_id := gen_random_uuid();

    -- Insert into auth.users with encrypted password
    -- Password: 'admin' hashed with bcrypt (10 rounds)
    -- Hash generated using: bcrypt.hash('admin', 10)
    -- NOTE: The on_auth_user_created trigger will automatically create the public.users record
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      admin_user_id,
      'authenticated',
      'authenticated',
      'admin@admin.com',
      '$2b$10$asr6IpV58LswTZmWc5oar.HoZU4j3.yHnqZq.6Mw2Dg/DYQPl0sLm', -- Bcrypt hash for 'admin'
      NOW(),
      '{"provider":"email","providers":["email"]}',
      '{"name":"Admin User"}',
      NOW(),
      NOW(),
      '',
      '',
      '',
      ''
    );

    -- The trigger handle_new_user() automatically creates the public.users record
    -- Now we need to update it to set the admin role and other specific fields
    UPDATE public.users
    SET
      role = 'admin',
      email_verified = TRUE,
      notification_preferences = jsonb_build_object(
        'emailTicketPurchase', true,
        'emailRouteDisruptions', true,
        'emailPromotional', false,
        'pushNotifications', false
      )
    WHERE id = admin_user_id;

    RAISE NOTICE 'Admin user created with ID: %', admin_user_id;
  ELSE
    RAISE NOTICE 'Admin user already exists with ID: %', admin_user_id;
  END IF;
END $$;

-- ==============================================================================
-- 4. UPDATE RLS POLICIES FOR EMAIL AUTH
-- ==============================================================================

-- Policy: Allow service role to insert users (for email signup)
DROP POLICY IF EXISTS "Service role can insert users" ON public.users;
CREATE POLICY "Service role can insert users"
  ON public.users
  FOR INSERT
  WITH CHECK (true);

-- ==============================================================================
-- 5. ADMIN ACTIVITY LOG TABLE
-- ==============================================================================

-- NOTE: The admin_activity_log table was already created in migration 020_admin_moderation_fixed.sql
-- We don't need to recreate it here, it already exists with the following structure:
--   - id UUID PRIMARY KEY
--   - admin_id UUID NOT NULL (FK to users)
--   - action VARCHAR(100) NOT NULL
--   - details JSONB
--   - ip_address INET
--   - user_agent TEXT
--   - created_at TIMESTAMPTZ
-- The table already has RLS enabled and appropriate policies.

-- ==============================================================================
-- 6. UPDATE HANDLE_NEW_USER FUNCTION FOR EMAIL AUTH
-- ==============================================================================

-- Update the trigger function to handle email/password signups
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert a new row into public.users when a user signs up
  INSERT INTO public.users (
    id,
    email,
    name,
    google_id,
    email_verified,
    password_hash,
    preferred_language,
    notification_preferences,
    last_login_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'name',
      NEW.raw_user_meta_data->>'full_name',
      split_part(NEW.email, '@', 1)
    ),
    NEW.raw_user_meta_data->>'sub',  -- Google's unique user ID (null for email signups)
    COALESCE(NEW.email_confirmed_at IS NOT NULL, FALSE),
    NEW.encrypted_password,  -- Store the encrypted password from auth.users
    'hu',  -- Default to Hungarian
    jsonb_build_object(
      'emailTicketPurchase', true,
      'emailRouteDisruptions', false,
      'emailPromotional', false,
      'pushNotifications', false
    ),
    NOW()  -- Set last_login_at to signup time
  )
  ON CONFLICT (id) DO NOTHING;  -- Prevent duplicates if trigger fires multiple times

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the auth signup
    RAISE WARNING 'Failed to create user profile for %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- ==============================================================================
-- MIGRATION COMPLETE
-- ==============================================================================

-- Verification queries (uncomment to test):
-- SELECT id, email, name, role, email_verified, password_hash IS NOT NULL as has_password FROM public.users WHERE email = 'admin@admin.com';
-- SELECT * FROM pg_indexes WHERE tablename = 'users' AND indexname LIKE '%token%';
-- SELECT * FROM admin_activity_log LIMIT 10;
