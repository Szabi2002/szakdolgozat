-- Migration: 009_cleanup_duplicate_rls_policies
-- Description: Remove duplicate and conflicting RLS policies that cause infinite recursion
-- Created: 2025-11-12
-- Issue: Migration 008 created new policies but didn't drop old ones, causing circular dependencies

-- ==============================================================================
-- REMOVE DUPLICATE AND PROBLEMATIC RLS POLICIES
-- ==============================================================================

-- Drop old problematic policies on USERS table (cause self-referencing infinite recursion)
DROP POLICY IF EXISTS "users_select_policy" ON public.users;
DROP POLICY IF EXISTS "users_update_policy" ON public.users;

-- Drop old problematic policies on TICKETS table (cause circular dependency with users table)
DROP POLICY IF EXISTS "tickets_select_policy" ON public.tickets;
DROP POLICY IF EXISTS "tickets_insert_policy" ON public.tickets;

-- Drop old problematic policies on TICKET_TYPES table (reference auth.users causing recursion)
DROP POLICY IF EXISTS "ticket_types_admin_insert" ON public.ticket_types;
DROP POLICY IF EXISTS "ticket_types_admin_update" ON public.ticket_types;
DROP POLICY IF EXISTS "ticket_types_admin_delete" ON public.ticket_types;

-- Drop old problematic policies on TRANSACTIONS table (reference auth.users causing recursion)
DROP POLICY IF EXISTS "transactions_admin_select" ON public.transactions;

-- ==============================================================================
-- RECREATE CLEAN POLICIES USING JWT CLAIMS (NO CIRCULAR DEPENDENCIES)
-- ==============================================================================

-- USERS table policies (already created by migration 008, but listed here for reference)
-- ✅ "Admins can view all users" - Uses auth.jwt() + is_admin()
-- ✅ "Admins can update any user" - Uses auth.jwt() + is_admin()

-- TICKETS table policies
-- Policy: Users can view their own tickets (drop first to avoid duplicates)
DROP POLICY IF EXISTS "Users can view own tickets" ON public.tickets;
CREATE POLICY "Users can view own tickets"
  ON public.tickets
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own tickets
DROP POLICY IF EXISTS "Users can insert own tickets" ON public.tickets;
CREATE POLICY "Users can insert own tickets"
  ON public.tickets
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own tickets
DROP POLICY IF EXISTS "Users can update own tickets" ON public.tickets;
CREATE POLICY "Users can update own tickets"
  ON public.tickets
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Admins can view all tickets (using JWT claims, no subquery)
DROP POLICY IF EXISTS "Admins can view all tickets" ON public.tickets;
CREATE POLICY "Admins can view all tickets"
  ON public.tickets
  FOR SELECT
  USING ((auth.jwt() ->> 'role')::text = 'admin');

-- TICKET_TYPES table policies
-- Policy: Everyone can view active ticket types
DROP POLICY IF EXISTS "Anyone can view active ticket types" ON public.ticket_types;
CREATE POLICY "Anyone can view active ticket types"
  ON public.ticket_types
  FOR SELECT
  USING (is_active = true);

-- Policy: Admins can insert ticket types (using JWT claims)
DROP POLICY IF EXISTS "Admins can insert ticket types" ON public.ticket_types;
CREATE POLICY "Admins can insert ticket types"
  ON public.ticket_types
  FOR INSERT
  WITH CHECK ((auth.jwt() ->> 'role')::text = 'admin');

-- Policy: Admins can update ticket types (using JWT claims)
DROP POLICY IF EXISTS "Admins can update ticket types" ON public.ticket_types;
CREATE POLICY "Admins can update ticket types"
  ON public.ticket_types
  FOR UPDATE
  USING ((auth.jwt() ->> 'role')::text = 'admin');

-- Policy: Admins can delete ticket types (using JWT claims)
DROP POLICY IF EXISTS "Admins can delete ticket types" ON public.ticket_types;
CREATE POLICY "Admins can delete ticket types"
  ON public.ticket_types
  FOR DELETE
  USING ((auth.jwt() ->> 'role')::text = 'admin');

-- TRANSACTIONS table policies
-- Policy: Users can view their own transactions
DROP POLICY IF EXISTS "Users can view own transactions" ON public.transactions;
CREATE POLICY "Users can view own transactions"
  ON public.transactions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own transactions
DROP POLICY IF EXISTS "Users can insert own transactions" ON public.transactions;
CREATE POLICY "Users can insert own transactions"
  ON public.transactions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Admins can view all transactions (using JWT claims)
DROP POLICY IF EXISTS "Admins can view all transactions" ON public.transactions;
CREATE POLICY "Admins can view all transactions"
  ON public.transactions
  FOR SELECT
  USING ((auth.jwt() ->> 'role')::text = 'admin');

-- ==============================================================================
-- OPTIMIZATION: Use SELECT subquery for auth.uid() (Performance improvement)
-- ==============================================================================
-- Note: Supabase advisors recommend using (SELECT auth.uid()) instead of auth.uid()
-- to prevent row-by-row re-evaluation. This can be implemented in a future migration
-- if performance issues arise.

-- ==============================================================================
-- MIGRATION COMPLETE
-- ==============================================================================

-- Verification queries (run manually to verify):
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual FROM pg_policies WHERE tablename IN ('users', 'tickets', 'ticket_types', 'transactions') ORDER BY tablename, policyname;
-- SELECT COUNT(*) FROM pg_policies WHERE tablename = 'users'; -- Should be 2 (admin view, admin update)
-- SELECT COUNT(*) FROM pg_policies WHERE tablename = 'tickets'; -- Should be 4 (user view/insert/update, admin view)
-- SELECT COUNT(*) FROM pg_policies WHERE tablename = 'ticket_types'; -- Should be 4 (anyone view, admin insert/update/delete)
-- SELECT COUNT(*) FROM pg_policies WHERE tablename = 'transactions'; -- Should be 3 (user view/insert, admin view)
