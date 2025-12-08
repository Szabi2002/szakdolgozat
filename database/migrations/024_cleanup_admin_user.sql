-- ==============================================================================
-- CLEANUP SCRIPT: Remove Partial Admin User
-- ==============================================================================
-- Run this BEFORE executing 024_add_email_password_auth.sql
-- This removes the partially created admin user from the previous failed migration

-- Delete from auth.users (this will CASCADE delete from public.users due to FK)
DELETE FROM auth.users WHERE email = 'admin@admin.com';

-- Double check: manually delete from public.users if still exists
DELETE FROM public.users WHERE email = 'admin@admin.com';

-- Verify cleanup
SELECT 'Cleanup complete. Admin user removed. You can now run the full migration.' AS status;
