-- Migration 013: Fix QR code index size limit
-- Date: 2025-11-13
-- Issue: QR code column has UNIQUE constraint with B-tree index that exceeds 2704 bytes limit
--        "index row size 5808 exceeds btree version 4 maximum 2704 for index tickets_qr_code_key"
-- Solution: Remove UNIQUE constraint from qr_code column since:
--   1. QR codes are too large for B-tree indexing (base64 encoded PNG ~5808 bytes)
--   2. Ticket uniqueness is already guaranteed by ticket ID (primary key)
--   3. QR code contains ticket ID, so it's implicitly unique
--   4. No business requirement for enforcing QR code uniqueness at DB level

-- Drop the UNIQUE constraint on qr_code column
ALTER TABLE tickets DROP CONSTRAINT IF EXISTS tickets_qr_code_key;

-- Optional: Add a non-unique index for faster lookups if needed (commented out by default)
-- Since QR codes are large and lookups by QR code are rare, we skip indexing
-- CREATE INDEX IF NOT EXISTS idx_tickets_qr_code_hash ON tickets (md5(qr_code));

-- Update column comment to reflect the change
COMMENT ON COLUMN tickets.qr_code IS
'Base64 encoded QR code image. Not indexed due to size constraints. Contains ticket ID and validation signature.';

-- Verify the constraint was removed
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'tickets_qr_code_key'
        AND conrelid = 'tickets'::regclass
    ) THEN
        RAISE EXCEPTION 'Failed to remove tickets_qr_code_key constraint';
    ELSE
        RAISE NOTICE 'Successfully removed tickets_qr_code_key constraint';
    END IF;
END $$;
