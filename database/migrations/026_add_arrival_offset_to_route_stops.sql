-- Migration: Add arrival_offset column to route_stops table
-- Created: 2025-12-07
-- Purpose: Support GTFS-style relative arrival times from first stop

-- Add arrival_offset column
ALTER TABLE public.route_stops
ADD COLUMN arrival_offset interval;

-- Comment
COMMENT ON COLUMN public.route_stops.arrival_offset IS 'Time offset from first stop on route (e.g., 00:05:30 means 5.5 minutes from route start)';

-- Drop old absolute time columns if they exist and are not used
-- We'll keep them for now for backwards compatibility but arrival_offset is preferred
COMMENT ON COLUMN public.route_stops.arrival_time IS 'DEPRECATED: Use arrival_offset instead for relative timing';
COMMENT ON COLUMN public.route_stops.departure_time IS 'DEPRECATED: Use arrival_offset instead for relative timing';
