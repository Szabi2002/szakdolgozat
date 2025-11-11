-- ==============================================================================
-- ROW LEVEL SECURITY POLICIES FOR TICKETS TABLE
-- ==============================================================================
-- Description: Defines RLS policies to control data access in public.tickets
-- Security Model: Users can only access their own tickets, admins can access all
-- Created: 2025-11-11
-- ==============================================================================

-- ==============================================================================
-- ENABLE ROW LEVEL SECURITY
-- ==============================================================================

ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- DROP EXISTING POLICIES (for idempotency)
-- ==============================================================================

DROP POLICY IF EXISTS "Users can view own tickets" ON public.tickets;
DROP POLICY IF EXISTS "Users can insert own tickets" ON public.tickets;
DROP POLICY IF EXISTS "Users can update own tickets" ON public.tickets;
DROP POLICY IF EXISTS "Admins can view all tickets" ON public.tickets;
DROP POLICY IF EXISTS "Admins can update any ticket" ON public.tickets;
DROP POLICY IF EXISTS "Admins can delete tickets" ON public.tickets;

-- ==============================================================================
-- SELECT POLICIES (Read Access)
-- ==============================================================================

-- Policy 1: Users can view their own tickets
-- Allows authenticated users to read their own ticket records
CREATE POLICY "Users can view own tickets"
  ON public.tickets
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy 2: Admins can view all tickets
-- Allows admin users to read all ticket records
CREATE POLICY "Admins can view all tickets"
  ON public.tickets
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ==============================================================================
-- INSERT POLICIES (Create Access)
-- ==============================================================================

-- Policy 3: Users can create their own tickets
-- Allows authenticated users to create tickets for themselves
CREATE POLICY "Users can insert own tickets"
  ON public.tickets
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- ==============================================================================
-- UPDATE POLICIES (Write Access)
-- ==============================================================================

-- Policy 4: Users can update their own tickets
-- Allows authenticated users to modify their own ticket records (e.g., cancel)
-- Restrictions: Users cannot change user_id or ticket_type_id after creation
CREATE POLICY "Users can update own tickets"
  ON public.tickets
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND OLD.user_id = NEW.user_id
    AND OLD.ticket_type_id = NEW.ticket_type_id
  );

-- Policy 5: Admins can update any ticket
-- Allows admin users to modify any ticket record
CREATE POLICY "Admins can update any ticket"
  ON public.tickets
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

-- Policy 6: Only admins can delete tickets
-- Allows admin users to delete ticket records
CREATE POLICY "Admins can delete tickets"
  ON public.tickets
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Note: Regular users cannot permanently delete tickets
-- They can only cancel/deactivate them via the UPDATE policy

-- ==============================================================================
-- POLICY TESTING QUERIES
-- ==============================================================================
-- Use these queries to test policies (uncomment to run):

-- Test 1: View your own tickets (should succeed)
-- SELECT * FROM public.tickets WHERE user_id = auth.uid();

-- Test 2: Try to view another user's tickets (should fail unless admin)
-- SELECT * FROM public.tickets WHERE user_id != auth.uid();

-- Test 3: Create a ticket for yourself (should succeed)
-- INSERT INTO public.tickets (user_id, ticket_type_id) VALUES (auth.uid(), 'valid-ticket-type-id');

-- Test 4: Try to create a ticket for another user (should fail)
-- INSERT INTO public.tickets (user_id, ticket_type_id) VALUES ('other-user-id', 'valid-ticket-type-id');

-- Test 5: Update your own ticket (should succeed)
-- UPDATE public.tickets SET status = 'cancelled' WHERE id = 'your-ticket-id';

-- Test 6: Try to change ticket ownership (should fail)
-- UPDATE public.tickets SET user_id = 'other-user-id' WHERE id = 'your-ticket-id';

-- ==============================================================================
-- SECURITY NOTES
-- ==============================================================================
--
-- 1. RLS is ENABLED on the tickets table - all queries are filtered by policies
-- 2. Service role key BYPASSES all RLS - use only in backend, never in frontend
-- 3. Users can only see and manage their own tickets
-- 4. Tickets are soft-deleted via status updates, not hard deletes
-- 5. Admin role required for viewing all tickets and performing hard deletes
-- 6. User cannot transfer ticket ownership (user_id is immutable)
--
-- ==============================================================================
