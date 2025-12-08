-- Generated on 2025-12-07T20:39:53.102Z
-- Validation queries for GTFS import

-- 1. Check route count by type
SELECT type, COUNT(*) as count
FROM routes
GROUP BY type
ORDER BY type;
-- Expected: bus: 3, metro: 4, tram: 3

-- 2. Check total stop count
SELECT COUNT(*) as total_stops FROM stops;
-- Expected: 172

-- 3. Check route-stop relationships
SELECT r.route_number, r.name, COUNT(rs.stop_id) as stop_count
FROM routes r
LEFT JOIN route_stops rs ON r.id = rs.route_id
GROUP BY r.route_number, r.name
ORDER BY r.route_number;
-- Each route should have 5-30 stops

-- 4. Verify arrival_offset consistency for M1 metro
SELECT r.route_number, s.name, rs.stop_order, rs.arrival_offset
FROM routes r
JOIN route_stops rs ON r.id = rs.route_id
JOIN stops s ON rs.stop_id = s.id
WHERE r.route_number = 'M1'
ORDER BY rs.stop_order;
-- Offsets should increase monotonically

-- 5. Check for orphaned records
SELECT 'Orphaned route_stops' as issue, COUNT(*) as count
FROM route_stops rs
WHERE NOT EXISTS (SELECT 1 FROM routes WHERE id = rs.route_id)
   OR NOT EXISTS (SELECT 1 FROM stops WHERE id = rs.stop_id);
-- Expected: 0

-- 6. GPS coordinate validation
SELECT COUNT(*) as invalid_coordinates
FROM stops
WHERE latitude < 47.0 OR latitude > 48.0
   OR longitude < 18.5 OR longitude > 20.0;
-- Expected: 0

-- 7. List all routes with their first and last stop
SELECT
  r.route_number,
  r.type,
  first_stop.name as first_stop,
  last_stop.name as last_stop,
  COUNT(rs.stop_id) as total_stops
FROM routes r
LEFT JOIN route_stops rs ON r.id = rs.route_id
LEFT JOIN stops first_stop ON rs.stop_id = first_stop.id AND rs.stop_order = 1
LEFT JOIN LATERAL (
  SELECT s.name
  FROM route_stops rs2
  JOIN stops s ON rs2.stop_id = s.id
  WHERE rs2.route_id = r.id
  ORDER BY rs2.stop_order DESC
  LIMIT 1
) last_stop ON true
GROUP BY r.route_number, r.type, first_stop.name, last_stop.name
ORDER BY r.type, r.route_number;
