-- Migration: 003_seed_demo_data
-- Description: Seeds demo data with 3 routes and 10 stops from Budapest
-- Created: 2025-11-02
-- Dependencies: 002_create_core_tables.sql

-- ==============================================================================
-- 1. INSERT DEMO STOPS (10 Budapest stops)
-- ==============================================================================

INSERT INTO public.stops (id, name, latitude, longitude, type, is_accessible, description) VALUES
  -- Metro stops
  ('550e8400-e29b-41d4-a716-446655440001', 'Deák Ferenc tér', 47.497913, 19.054184, 'metro', true, 'Metro interchange station (M1, M2, M3)'),
  ('550e8400-e29b-41d4-a716-446655440002', 'Keleti pályaudvar', 47.500556, 19.083333, 'metro', true, 'Eastern Railway Station - M2, M4'),
  ('550e8400-e29b-41d4-a716-446655440003', 'Blaha Lujza tér', 47.497222, 19.070278, 'metro', true, 'M2 metro station'),

  -- Tram stops
  ('550e8400-e29b-41d4-a716-446655440004', 'Nyugati pályaudvar', 47.510833, 19.057222, 'tram', true, 'Western Railway Station - tram 4, 6'),
  ('550e8400-e29b-41d4-a716-446655440005', 'Széll Kálmán tér', 47.507222, 19.024444, 'tram', true, 'Major transport hub - tram 4, 6, 17, 61'),
  ('550e8400-e29b-41d4-a716-446655440006', 'Jászai Mari tér', 47.513056, 19.050000, 'tram', true, 'Tram 2 riverside stop'),

  -- Bus stops
  ('550e8400-e29b-41d4-a716-446655440007', 'Móricz Zsigmond körtér', 47.473611, 19.049722, 'bus', true, 'South Buda transport hub'),
  ('550e8400-e29b-41d4-a716-446655440008', 'Bosnyák tér', 47.513333, 19.107778, 'bus', true, 'East Pest bus terminal'),
  ('550e8400-e29b-41d4-a716-446655440009', 'Újpest-Városkapu', 47.561111, 19.090000, 'bus', false, 'Northern terminus'),
  ('550e8400-e29b-41d4-a716-446655440010', 'Óbuda, Szentlélek tér', 47.535556, 19.041667, 'bus', true, 'Óbuda district center')
ON CONFLICT (id) DO NOTHING;

-- ==============================================================================
-- 2. INSERT DEMO ROUTES (3 routes)
-- ==============================================================================

INSERT INTO public.routes (id, route_number, name, is_accessible, is_active, description) VALUES
  ('660e8400-e29b-41d4-a716-446655440001', '7E', 'Bosnyák tér - Móricz Zsigmond körtér', true, true, 'Express trolleybus line connecting East and South Pest'),
  ('660e8400-e29b-41d4-a716-446655440002', 'M2', 'Déli pályaudvar - Örs vezér tere', true, true, 'Metro line 2 (Red line) - East-West metro'),
  ('660e8400-e29b-41d4-a716-446655440003', '4-6', 'Nyugati pályaudvar - Széll Kálmán tér', true, true, 'Iconic yellow tram running on the Grand Boulevard')
ON CONFLICT (id) DO NOTHING;

-- ==============================================================================
-- 3. INSERT ROUTE-STOP CONNECTIONS
-- ==============================================================================

-- Route 7E: Bosnyák tér -> Keleti -> Blaha -> Deák -> Móricz Zsigmond körtér
INSERT INTO public.route_stops (route_id, stop_id, stop_order, arrival_time, departure_time) VALUES
  ('660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440008', 1, '06:00:00', '06:00:00'),  -- Bosnyák tér
  ('660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002', 2, '06:08:00', '06:09:00'),  -- Keleti pályaudvar
  ('660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440003', 3, '06:12:00', '06:13:00'),  -- Blaha Lujza tér
  ('660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 4, '06:16:00', '06:17:00'),  -- Deák Ferenc tér
  ('660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440007', 5, '06:25:00', '06:25:00')   -- Móricz Zsigmond körtér
ON CONFLICT DO NOTHING;

-- Route M2: Deák -> Blaha -> Keleti (simplified, actual M2 has more stops)
INSERT INTO public.route_stops (route_id, stop_id, stop_order, arrival_time, departure_time) VALUES
  ('660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', 1, '05:00:00', '05:00:00'),  -- Deák Ferenc tér
  ('660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440003', 2, '05:03:00', '05:04:00'),  -- Blaha Lujza tér
  ('660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002', 3, '05:07:00', '05:07:00')   -- Keleti pályaudvar
ON CONFLICT DO NOTHING;

-- Route 4-6: Nyugati -> Jászai -> Széll Kálmán
INSERT INTO public.route_stops (route_id, stop_id, stop_order, arrival_time, departure_time) VALUES
  ('660e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440004', 1, '06:00:00', '06:00:00'),  -- Nyugati pályaudvar
  ('660e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440006', 2, '06:05:00', '06:06:00'),  -- Jászai Mari tér
  ('660e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440005', 3, '06:15:00', '06:15:00')   -- Széll Kálmán tér
ON CONFLICT DO NOTHING;

-- ==============================================================================
-- 4. INSERT SAMPLE RATINGS (Optional - for demo purposes)
-- ==============================================================================

-- Note: These ratings will only be inserted if users exist in the database
-- In a real scenario, users would create these through the application

-- Sample ratings will be added when users are created through authentication

-- ==============================================================================
-- VERIFICATION QUERIES
-- ==============================================================================

-- Uncomment to verify the data:
-- SELECT COUNT(*) as total_stops FROM public.stops;
-- SELECT COUNT(*) as total_routes FROM public.routes;
-- SELECT COUNT(*) as total_route_stops FROM public.route_stops;
--
-- SELECT
--   r.route_number,
--   r.name,
--   COUNT(rs.id) as stop_count
-- FROM public.routes r
-- LEFT JOIN public.route_stops rs ON r.id = rs.route_id
-- GROUP BY r.id, r.route_number, r.name
-- ORDER BY r.route_number;
--
-- SELECT
--   r.route_number,
--   s.name as stop_name,
--   rs.stop_order,
--   rs.arrival_time
-- FROM public.route_stops rs
-- JOIN public.routes r ON rs.route_id = r.id
-- JOIN public.stops s ON rs.stop_id = s.id
-- ORDER BY r.route_number, rs.stop_order;

-- ==============================================================================
-- MIGRATION COMPLETE
-- ==============================================================================
-- Summary:
-- - 10 stops inserted (3 metro, 3 tram, 4 bus)
-- - 3 routes inserted (7E bus, M2 metro, 4-6 tram)
-- - 11 route-stop connections created
-- ==============================================================================
