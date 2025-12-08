-- Migration: 012_fix_tickets_valid_period_constraint
-- Description: Fix CHECK constraints that prevent NULL valid_until for monthly/yearly passes
-- Created: 2025-11-13
-- Issue: Two problematic constraints:
--        1. valid_period CHECK (valid_until > valid_from) - doesn't allow NULL
--        2. 2200_17553_8_not_null CHECK (valid_until IS NOT NULL) - forces NOT NULL
-- Solution: Drop both constraints and create a new one that allows NULL but validates when present

-- ==============================================================================
-- DROP PROBLEMATIC CONSTRAINTS
-- ==============================================================================

-- Drop the constraint that doesn't allow NULL valid_until
ALTER TABLE public.tickets
DROP CONSTRAINT IF EXISTS valid_period;

-- Drop the NOT NULL check constraint on valid_until
-- This was automatically created and has a system-generated name
ALTER TABLE public.tickets
DROP CONSTRAINT IF EXISTS "2200_17553_8_not_null";

-- ==============================================================================
-- CREATE NEW CONSTRAINT THAT ALLOWS NULL
-- ==============================================================================

-- Add a new constraint that allows NULL but checks when both values are present
-- This allows:
-- 1. valid_until = NULL (for monthly/yearly passes without expiry)
-- 2. valid_until > valid_from (when both are specified)
ALTER TABLE public.tickets
ADD CONSTRAINT valid_period_check
CHECK (valid_until IS NULL OR valid_until > valid_from);

-- ==============================================================================
-- ALTER COLUMN TO ALLOW NULL
-- ==============================================================================

-- Explicitly set valid_until to allow NULL values
ALTER TABLE public.tickets
ALTER COLUMN valid_until DROP NOT NULL;

-- ==============================================================================
-- VERIFICATION
-- ==============================================================================

-- The following queries can be run to verify the fix:
--
-- 1. Check constraints on tickets table:
-- SELECT constraint_name, check_clause
-- FROM information_schema.check_constraints
-- WHERE constraint_name LIKE '%valid%'
--   AND constraint_schema = 'public';
--
-- 2. Test inserting a ticket with NULL valid_until (should succeed):
-- INSERT INTO tickets (user_id, ticket_type_id, qr_code, valid_from, valid_until, status, price)
-- VALUES (
--   (SELECT id FROM auth.users LIMIT 1),
--   (SELECT id FROM ticket_types WHERE type = 'monthly' LIMIT 1),
--   'TEST_QR_' || gen_random_uuid()::text,
--   NOW(),
--   NULL,
--   'active',
--   9500.00
-- );
--
-- 3. Test inserting a ticket with valid_until > valid_from (should succeed):
-- INSERT INTO tickets (user_id, ticket_type_id, qr_code, valid_from, valid_until, status, price)
-- VALUES (
--   (SELECT id FROM auth.users LIMIT 1),
--   (SELECT id FROM ticket_types WHERE type = 'single' LIMIT 1),
--   'TEST_QR_' || gen_random_uuid()::text,
--   NOW(),
--   NOW() + INTERVAL '90 minutes',
--   'active',
--   350.00
-- );
--
-- 4. Test inserting a ticket with valid_until < valid_from (should FAIL):
-- INSERT INTO tickets (user_id, ticket_type_id, qr_code, valid_from, valid_until, status, price)
-- VALUES (
--   (SELECT id FROM auth.users LIMIT 1),
--   (SELECT id FROM ticket_types WHERE type = 'single' LIMIT 1),
--   'TEST_QR_' || gen_random_uuid()::text,
--   NOW(),
--   NOW() - INTERVAL '1 hour',
--   'active',
--   350.00
-- );

-- ==============================================================================
-- MIGRATION COMPLETE
-- ==============================================================================

COMMENT ON CONSTRAINT valid_period_check ON public.tickets IS
'Ensures valid_until is either NULL (for passes without expiry) or greater than valid_from';
