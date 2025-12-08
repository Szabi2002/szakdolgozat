-- Migration: Fix ticket_types RLS policy for JOIN queries
-- Description: Allows authenticated users to view all ticket_types (not just active ones)
--              This is required for JOIN queries when fetching user tickets
-- Created: 2025-11-13
-- Issue: BUG-004 - Ticket type showing as "Unknown" in My Tickets page

-- =====================================================
-- TICKET TYPES RLS POLICY FIX
-- =====================================================

-- Drop existing restrictive policy
DROP POLICY IF EXISTS "Anyone can view active ticket types" ON ticket_types;

-- Create new policy that allows viewing ALL ticket types for authenticated users
-- This is safe because:
-- 1. ticket_types is public reference data (like routes and stops)
-- 2. It's needed for JOIN queries when users view their tickets
-- 3. Only admins can create/update/delete ticket types (existing policies remain)
CREATE POLICY "Authenticated users can view all ticket types"
  ON ticket_types FOR SELECT
  USING (true);

-- Note: This policy allows all authenticated users to view all ticket types,
-- including inactive ones. This is intentional because:
-- - Users need to see ticket types for their purchased tickets even if those types are now inactive
-- - JOIN queries in tickets.service.ts require this access
-- - ticket_types table is public reference data (no sensitive information)

-- Verify the policy was created
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'ticket_types'
    AND policyname = 'Authenticated users can view all ticket types'
  ) THEN
    RAISE NOTICE 'RLS policy for ticket_types updated successfully';
  ELSE
    RAISE EXCEPTION 'Failed to create RLS policy for ticket_types';
  END IF;
END $$;
