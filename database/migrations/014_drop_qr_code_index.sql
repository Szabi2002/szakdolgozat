-- Migration 014: Drop QR code index
-- Date: 2025-11-13
-- Issue: idx_tickets_qr_code index also has B-tree size limit of 2704 bytes
-- Previous migration (013) only removed UNIQUE constraint but left the regular index
-- Root Cause: Both UNIQUE constraints AND regular indexes use B-tree with 2704 byte limit

-- Drop the index on qr_code column
DROP INDEX IF EXISTS idx_tickets_qr_code;

-- Verify the index was removed
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM pg_indexes
        WHERE tablename = 'tickets'
        AND indexname = 'idx_tickets_qr_code'
    ) THEN
        RAISE EXCEPTION 'Failed to drop idx_tickets_qr_code index';
    ELSE
        RAISE NOTICE 'Successfully dropped idx_tickets_qr_code index';
    END IF;
END $$;
