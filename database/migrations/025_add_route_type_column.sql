-- Migration: Add route_type column to routes table
-- Created: 2025-12-07
-- Purpose: Support GTFS data import with route type classification

-- Create route_type enum
CREATE TYPE route_type AS ENUM ('bus', 'tram', 'metro', 'trolley');

-- Add route_type column to routes table
ALTER TABLE public.routes
ADD COLUMN route_type route_type;

-- Add comment
COMMENT ON COLUMN public.routes.route_type IS 'Type of public transport route: bus, tram, metro, or trolley';

-- Create index for filtering by route type
CREATE INDEX idx_routes_route_type ON public.routes(route_type);

-- Update existing routes based on route_number pattern (if any exist)
-- Metro lines start with 'M'
UPDATE public.routes
SET route_type = 'metro'
WHERE route_number LIKE 'M%';

-- Trams are typically single or double digit numbers 1-99 (with optional letter suffix)
UPDATE public.routes
SET route_type = 'tram'
WHERE route_number ~ '^[0-9]{1,2}[A-Z]?$'
AND route_type IS NULL;

-- Everything else defaults to bus (can be updated manually later)
UPDATE public.routes
SET route_type = 'bus'
WHERE route_type IS NULL;
