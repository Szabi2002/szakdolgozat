-- Migration 021: Add Foreign Key Constraint to Ratings Table
-- Description: Adds missing foreign key constraint from ratings.route_id to routes.id
--              This enables Supabase relationship queries and ensures data integrity
-- Date: 2025-11-16
-- Sprint: Current

-- =====================================================
-- ADD FOREIGN KEY CONSTRAINT
-- =====================================================

-- Add foreign key constraint from ratings.route_id to routes.id
-- This was missing in migration 018_ratings_system.sql
ALTER TABLE ratings
  ADD CONSTRAINT fk_ratings_route_id
  FOREIGN KEY (route_id)
  REFERENCES routes(id)
  ON DELETE CASCADE;

-- =====================================================
-- VERIFY CONSTRAINT
-- =====================================================

-- Verify the foreign key was created successfully
-- Uncomment to test:
-- SELECT
--   tc.constraint_name,
--   tc.table_name,
--   kcu.column_name,
--   ccu.table_name AS foreign_table_name,
--   ccu.column_name AS foreign_column_name
-- FROM information_schema.table_constraints AS tc
-- JOIN information_schema.key_column_usage AS kcu
--   ON tc.constraint_name = kcu.constraint_name
-- JOIN information_schema.constraint_column_usage AS ccu
--   ON ccu.constraint_name = tc.constraint_name
-- WHERE tc.constraint_type = 'FOREIGN KEY'
--   AND tc.table_name = 'ratings';

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON CONSTRAINT fk_ratings_route_id ON ratings IS 'Foreign key to routes table - ensures ratings reference valid routes';

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

-- This migration fixes the issue where Supabase relationship queries failed with:
-- "Could not find a relationship between 'ratings' and 'routes' in the schema cache"
--
-- The foreign key constraint now allows:
-- 1. Supabase to automatically detect the relationship
-- 2. Data integrity - prevents orphaned ratings
-- 3. Cascade deletion - removes ratings when route is deleted
