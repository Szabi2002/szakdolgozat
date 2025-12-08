-- Migration 013: Add Foreign Key Constraints for Tickets-Stops Relationship
-- Description: Adds foreign key constraints to tickets table for from_stop_id and to_stop_id
-- Date: 2025-11-13
-- Fixes: BUG-004 - stops.code column does not exist error

-- =====================================================
-- ADD FOREIGN KEY CONSTRAINTS
-- =====================================================

-- Add foreign key constraint for from_stop_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'tickets_from_stop_id_fkey'
    AND table_name = 'tickets'
  ) THEN
    ALTER TABLE tickets
      ADD CONSTRAINT tickets_from_stop_id_fkey
      FOREIGN KEY (from_stop_id)
      REFERENCES stops(id)
      ON DELETE SET NULL;

    RAISE NOTICE 'Added foreign key constraint: tickets_from_stop_id_fkey';
  ELSE
    RAISE NOTICE 'Foreign key constraint tickets_from_stop_id_fkey already exists';
  END IF;
END $$;

-- Add foreign key constraint for to_stop_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'tickets_to_stop_id_fkey'
    AND table_name = 'tickets'
  ) THEN
    ALTER TABLE tickets
      ADD CONSTRAINT tickets_to_stop_id_fkey
      FOREIGN KEY (to_stop_id)
      REFERENCES stops(id)
      ON DELETE SET NULL;

    RAISE NOTICE 'Added foreign key constraint: tickets_to_stop_id_fkey';
  ELSE
    RAISE NOTICE 'Foreign key constraint tickets_to_stop_id_fkey already exists';
  END IF;
END $$;

-- =====================================================
-- ADD INDEXES FOR PERFORMANCE
-- =====================================================

-- Index for from_stop_id (if not exists)
CREATE INDEX IF NOT EXISTS idx_tickets_from_stop_id ON tickets(from_stop_id);

-- Index for to_stop_id (if not exists)
CREATE INDEX IF NOT EXISTS idx_tickets_to_stop_id ON tickets(to_stop_id);

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON CONSTRAINT tickets_from_stop_id_fkey ON tickets IS
  'Foreign key to stops table for origin stop of route-specific tickets';

COMMENT ON CONSTRAINT tickets_to_stop_id_fkey ON tickets IS
  'Foreign key to stops table for destination stop of route-specific tickets';

COMMENT ON COLUMN tickets.from_stop_id IS
  'Origin stop ID for route-specific tickets. NULL for general passes.';

COMMENT ON COLUMN tickets.to_stop_id IS
  'Destination stop ID for route-specific tickets. NULL for general passes.';

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

-- Verify constraints
SELECT
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'tickets'
  AND tc.constraint_name LIKE '%stop%'
ORDER BY tc.constraint_name;
