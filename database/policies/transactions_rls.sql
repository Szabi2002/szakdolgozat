-- ==============================================================================
-- ROW LEVEL SECURITY POLICIES FOR TRANSACTIONS TABLE
-- ==============================================================================
-- Description: Defines RLS policies to control data access in public.transactions
-- Security Model: Users can only access their own transactions, admins can access all
-- Created: 2025-11-11
-- ==============================================================================

-- ==============================================================================
-- ENABLE ROW LEVEL SECURITY
-- ==============================================================================

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- DROP EXISTING POLICIES (for idempotency)
-- ==============================================================================

DROP POLICY IF EXISTS "Users can view own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can insert own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Admins can view all transactions" ON public.transactions;
DROP POLICY IF EXISTS "Admins can update transactions" ON public.transactions;
DROP POLICY IF EXISTS "Admins can delete transactions" ON public.transactions;

-- ==============================================================================
-- SELECT POLICIES (Read Access)
-- ==============================================================================

-- Policy 1: Users can view their own transactions
-- Allows authenticated users to read their own transaction records
CREATE POLICY "Users can view own transactions"
  ON public.transactions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy 2: Admins can view all transactions
-- Allows admin users to read all transaction records (for financial reports)
CREATE POLICY "Admins can view all transactions"
  ON public.transactions
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

-- Policy 3: Users can create their own transactions
-- Allows authenticated users to create transactions for themselves
-- This happens when purchasing tickets
CREATE POLICY "Users can insert own transactions"
  ON public.transactions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- ==============================================================================
-- UPDATE POLICIES (Write Access)
-- ==============================================================================

-- Policy 4: Only admins can update transactions
-- Transactions should be immutable after creation (audit trail)
-- Only admins can correct mistakes or update payment status
CREATE POLICY "Admins can update transactions"
  ON public.transactions
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

-- Note: Regular users CANNOT update transactions after creation
-- This ensures transaction integrity and audit trail

-- ==============================================================================
-- DELETE POLICIES (Delete Access)
-- ==============================================================================

-- Policy 5: Only admins can delete transactions
-- Allows admin users to delete transaction records (use sparingly)
-- Prefer soft-delete or marking as voided for audit trail
CREATE POLICY "Admins can delete transactions"
  ON public.transactions
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Note: Transaction deletion should be rare
-- Consider adding a 'status' field (completed, pending, failed, voided)
-- for better audit trail instead of hard deletes

-- ==============================================================================
-- POLICY TESTING QUERIES
-- ==============================================================================
-- Use these queries to test policies (uncomment to run):

-- Test 1: View your own transactions (should succeed)
-- SELECT * FROM public.transactions WHERE user_id = auth.uid();

-- Test 2: Try to view another user's transactions (should fail unless admin)
-- SELECT * FROM public.transactions WHERE user_id != auth.uid();

-- Test 3: Create a transaction for yourself (should succeed)
-- INSERT INTO public.transactions (user_id, amount, transaction_type, status)
-- VALUES (auth.uid(), 350.00, 'ticket_purchase', 'completed');

-- Test 4: Try to create a transaction for another user (should fail)
-- INSERT INTO public.transactions (user_id, amount, transaction_type, status)
-- VALUES ('other-user-id', 350.00, 'ticket_purchase', 'completed');

-- Test 5: Try to update your own transaction (should fail unless admin)
-- UPDATE public.transactions SET amount = 0.00 WHERE id = 'your-transaction-id';

-- Test 6: Try to delete your own transaction (should fail unless admin)
-- DELETE FROM public.transactions WHERE id = 'your-transaction-id';

-- ==============================================================================
-- SECURITY NOTES
-- ==============================================================================
--
-- 1. RLS is ENABLED on the transactions table - all queries are filtered by policies
-- 2. Service role key BYPASSES all RLS - use only in backend, never in frontend
-- 3. Transactions are IMMUTABLE after creation for regular users
-- 4. Only admins can modify or delete transactions (for corrections)
-- 5. Users can only see their own transaction history
-- 6. Transaction data is sensitive financial information - protect carefully
-- 7. Consider implementing transaction versioning for audit trail
-- 8. Log all admin modifications to transactions
--
-- ==============================================================================
-- BEST PRACTICES
-- ==============================================================================
--
-- 1. Never hard-delete transactions - use status field instead (voided, refunded)
-- 2. Store all transaction amounts in smallest currency unit (cents)
-- 3. Include correlation IDs for tracking related transactions
-- 4. Implement transaction reconciliation processes
-- 5. Keep transaction records indefinitely for compliance
-- 6. Encrypt sensitive payment data at rest
-- 7. Index user_id and created_at for fast queries
-- 8. Implement transaction limits and fraud detection
--
-- ==============================================================================
