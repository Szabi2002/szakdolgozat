-- Migration: 010_fix_tickets_table_schema
-- Description: Add missing columns to tickets table and fix ticket_type column
-- Created: 2025-11-12
-- Issue: Tickets table missing from_stop_id, to_stop_id, transaction_id, updated_at columns
--        and has ticket_type (TEXT) instead of ticket_type_id (UUID)

-- ==============================================================================
-- ADD MISSING COLUMNS TO TICKETS TABLE
-- ==============================================================================

-- Add ticket_type_id as UUID foreign key
ALTER TABLE public.tickets
ADD COLUMN IF NOT EXISTS ticket_type_id UUID REFERENCES public.ticket_types(id);

-- Add from_stop_id column
ALTER TABLE public.tickets
ADD COLUMN IF NOT EXISTS from_stop_id UUID;

-- Add to_stop_id column
ALTER TABLE public.tickets
ADD COLUMN IF NOT EXISTS to_stop_id UUID;

-- Add transaction_id column
ALTER TABLE public.tickets
ADD COLUMN IF NOT EXISTS transaction_id UUID;

-- Add updated_at column with default
ALTER TABLE public.tickets
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- ==============================================================================
-- MIGRATE EXISTING DATA FROM ticket_type TO ticket_type_id
-- ==============================================================================

-- Update existing tickets to link ticket_type (TEXT) to ticket_type_id (UUID)
-- This assumes ticket_types table has a 'type' column matching the old ticket_type values
UPDATE public.tickets
SET ticket_type_id = (
  SELECT id FROM public.ticket_types
  WHERE public.ticket_types.type = public.tickets.ticket_type
  LIMIT 1
)
WHERE ticket_type_id IS NULL AND ticket_type IS NOT NULL;

-- ==============================================================================
-- MAKE ticket_type_id NOT NULL (after data migration)
-- ==============================================================================

-- Now that data is migrated, make ticket_type_id required
ALTER TABLE public.tickets
ALTER COLUMN ticket_type_id SET NOT NULL;

-- ==============================================================================
-- OPTIONAL: DROP OLD ticket_type COLUMN (commented out for safety)
-- ==============================================================================

-- Uncomment the following line to drop the old ticket_type column after verification
-- ALTER TABLE public.tickets DROP COLUMN IF EXISTS ticket_type;

-- ==============================================================================
-- CREATE TRIGGER FOR updated_at COLUMN
-- ==============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS update_tickets_updated_at ON public.tickets;

-- Create trigger for tickets table
CREATE TRIGGER update_tickets_updated_at
  BEFORE UPDATE ON public.tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ==============================================================================
-- MIGRATION COMPLETE
-- ==============================================================================

-- Verification queries (run manually):
-- SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'tickets' ORDER BY ordinal_position;
-- SELECT COUNT(*) FROM tickets WHERE ticket_type_id IS NULL; -- Should be 0
-- SELECT COUNT(*) FROM tickets WHERE updated_at IS NULL; -- Should be 0
