-- Migration: 011_remove_legacy_ticket_type
-- Description: Remove legacy ticket_type TEXT column from tickets table
-- Created: 2025-11-12
-- Issue: ticket_type (TEXT) column is causing NOT NULL constraint violations
--        because backend code only inserts ticket_type_id (UUID)
-- Solution: Drop the legacy column since all data has been migrated to ticket_type_id

-- ==============================================================================
-- DROP LEGACY ticket_type COLUMN
-- ==============================================================================

-- Drop the old ticket_type TEXT column
ALTER TABLE public.tickets
DROP COLUMN IF EXISTS ticket_type;

-- ==============================================================================
-- VERIFY CONSTRAINTS ON ticket_type_id
-- ==============================================================================

-- Ensure ticket_type_id is NOT NULL (should already be set from migration 010)
ALTER TABLE public.tickets
ALTER COLUMN ticket_type_id SET NOT NULL;

-- ==============================================================================
-- VERIFY FOREIGN KEY CONSTRAINT
-- ==============================================================================

-- Drop existing foreign key if it exists
ALTER TABLE public.tickets
DROP CONSTRAINT IF EXISTS tickets_ticket_type_id_fkey;

-- Add foreign key constraint
ALTER TABLE public.tickets
ADD CONSTRAINT tickets_ticket_type_id_fkey
FOREIGN KEY (ticket_type_id) REFERENCES public.ticket_types(id) ON DELETE RESTRICT;

-- ==============================================================================
-- ADD FOREIGN KEY CONSTRAINTS FOR STOPS (if not already present)
-- ==============================================================================

-- Add foreign key for from_stop_id
ALTER TABLE public.tickets
DROP CONSTRAINT IF EXISTS tickets_from_stop_id_fkey;

ALTER TABLE public.tickets
ADD CONSTRAINT tickets_from_stop_id_fkey
FOREIGN KEY (from_stop_id) REFERENCES public.stops(id) ON DELETE SET NULL;

-- Add foreign key for to_stop_id
ALTER TABLE public.tickets
DROP CONSTRAINT IF EXISTS tickets_to_stop_id_fkey;

ALTER TABLE public.tickets
ADD CONSTRAINT tickets_to_stop_id_fkey
FOREIGN KEY (to_stop_id) REFERENCES public.stops(id) ON DELETE SET NULL;

-- ==============================================================================
-- ADD FOREIGN KEY CONSTRAINT FOR TRANSACTION
-- ==============================================================================

-- Add foreign key for transaction_id
ALTER TABLE public.tickets
DROP CONSTRAINT IF EXISTS tickets_transaction_id_fkey;

ALTER TABLE public.tickets
ADD CONSTRAINT tickets_transaction_id_fkey
FOREIGN KEY (transaction_id) REFERENCES public.transactions(id) ON DELETE SET NULL;

-- ==============================================================================
-- MIGRATION COMPLETE
-- ==============================================================================

-- Verification query (run manually):
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'tickets'
-- ORDER BY ordinal_position;
--
-- Expected: ticket_type column should NOT appear in results
