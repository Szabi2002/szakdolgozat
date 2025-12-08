#!/usr/bin/env node

/**
 * Budapest GTFS Data Import Script
 *
 * Extracts representative routes, stops, and schedules from GTFS files
 * and generates SQL INSERT statements for Supabase database.
 *
 * Usage: node scripts/import-gtfs-data.js
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Configuration
const GTFS_DIR = 'C:\\Users\\Szabolcs\\Desktop\\Adatbazis';
const OUTPUT_DIR = path.join(__dirname, '..', 'database', 'gtfs-import');

const SELECTED_ROUTES = {
  // Metro lines
  '5100': { number: 'M1', type: 'metro' },
  '5200': { number: 'M2', type: 'metro' },
  '5300': { number: 'M3', type: 'metro' },
  '5400': { number: 'M4', type: 'metro' },
  // Tram lines
  '3040': { number: '4', type: 'tram' },
  '3060': { number: '6', type: 'tram' },
  '3020': { number: '2', type: 'tram' },
  // Bus lines
  '0070': { number: '7', type: 'bus' },
  '0090': { number: '9', type: 'bus' },
  '0160': { number: '16', type: 'bus' }
};

// Data storage
const data = {
  routes: new Map(),
  stops: new Map(),
  trips: new Map(),
  stopTimes: new Map(),
  routeStops: new Map()
};

/**
 * Parse CSV file line by line
 */
async function parseCSV(filePath, callback) {
  const fileStream = fs.createReadStream(filePath, { encoding: 'utf8' });
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let headers = null;
  let lineCount = 0;

  for await (const line of rl) {
    lineCount++;

    if (lineCount === 1) {
      headers = parseCSVLine(line);
      continue;
    }

    // Parse CSV line handling quoted fields
    const values = parseCSVLine(line);
    const row = {};

    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });

    await callback(row, lineCount);
  }

  return lineCount - 1; // Exclude header
}

/**
 * Parse CSV line handling quoted fields with commas
 */
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

/**
 * Step 1: Extract selected routes
 */
async function extractRoutes() {
  console.log('📋 Step 1: Extracting routes...');

  let routeCount = 0;

  await parseCSV(path.join(GTFS_DIR, 'routes.txt'), (row) => {
    const routeId = row.route_id;

    if (SELECTED_ROUTES[routeId]) {
      const config = SELECTED_ROUTES[routeId];

      data.routes.set(routeId, {
        gtfs_id: routeId,
        route_number: config.number,
        name: row.route_desc || row.route_long_name,
        type: config.type,
        route_short_name: row.route_short_name,
        color: row.route_color || null
      });

      routeCount++;
      console.log(`  ✓ ${config.number} (${config.type}): ${row.route_desc}`);
    }
  });

  console.log(`  Total routes extracted: ${routeCount}\n`);
}

/**
 * Step 2: Extract representative trips for selected routes
 */
async function extractTrips() {
  console.log('🚌 Step 2: Extracting trips...');

  let tripCount = 0;

  await parseCSV(path.join(GTFS_DIR, 'trips.txt'), (row) => {
    const routeId = row.route_id;

    if (SELECTED_ROUTES[routeId]) {
      const tripId = row.trip_id;
      const direction = parseInt(row.direction_id);

      // Store trip data
      if (!data.trips.has(routeId)) {
        data.trips.set(routeId, { direction0: [], direction1: [] });
      }

      const routeTrips = data.trips.get(routeId);
      const directionKey = `direction${direction}`;

      routeTrips[directionKey].push({
        trip_id: tripId,
        headsign: row.trip_headsign,
        direction_id: direction,
        service_id: row.service_id
      });

      tripCount++;
    }
  });

  console.log(`  Total trips found: ${tripCount}`);

  // Select representative trips (only first trip from first available direction)
  // Note: We only select 1 trip per route to avoid duplicate stop_orders
  const selectedTrips = new Map();

  data.trips.forEach((trips, routeId) => {
    const route = data.routes.get(routeId);
    const selected = [];

    // Pick first trip from first available direction
    if (trips.direction0.length > 0) {
      selected.push(trips.direction0[0]);
    } else if (trips.direction1.length > 0) {
      selected.push(trips.direction1[0]);
    }

    selectedTrips.set(routeId, selected);

    console.log(`  ✓ Route ${route.route_number}: ${selected.length} trip selected (${selected[0].direction_id === 0 ? 'outbound' : 'inbound'})`);
  });

  data.trips = selectedTrips;
  console.log();
}

/**
 * Step 3: Extract stop times for selected trips
 */
async function extractStopTimes() {
  console.log('⏰ Step 3: Extracting stop times...');

  // Build a set of selected trip IDs for faster lookup
  const selectedTripIds = new Set();
  data.trips.forEach(trips => {
    trips.forEach(trip => selectedTripIds.add(trip.trip_id));
  });

  let stopTimeCount = 0;

  await parseCSV(path.join(GTFS_DIR, 'stop_times.txt'), (row) => {
    const tripId = row.trip_id;

    if (selectedTripIds.has(tripId)) {
      if (!data.stopTimes.has(tripId)) {
        data.stopTimes.set(tripId, []);
      }

      data.stopTimes.get(tripId).push({
        trip_id: tripId,
        stop_id: row.stop_id,
        arrival_time: row.arrival_time,
        departure_time: row.departure_time,
        stop_sequence: parseInt(row.stop_sequence)
      });

      stopTimeCount++;
    }
  });

  console.log(`  Total stop times extracted: ${stopTimeCount}\n`);
}

/**
 * Step 4: Extract stops used in selected trips
 */
async function extractStops() {
  console.log('🚏 Step 4: Extracting stops...');

  // Build a set of required stop IDs
  const requiredStopIds = new Set();
  data.stopTimes.forEach(stopTimes => {
    stopTimes.forEach(st => requiredStopIds.add(st.stop_id));
  });

  let stopCount = 0;

  await parseCSV(path.join(GTFS_DIR, 'stops.txt'), (row) => {
    const stopId = row.stop_id;

    if (requiredStopIds.has(stopId)) {
      const lat = parseFloat(row.stop_lat);
      const lon = parseFloat(row.stop_lon);

      // Validate coordinates (Budapest area)
      if (lat >= 47.0 && lat <= 48.0 && lon >= 18.5 && lon <= 20.0) {
        data.stops.set(stopId, {
          gtfs_id: stopId,
          name: row.stop_name,
          latitude: lat,
          longitude: lon,
          stop_code: row.stop_code
        });

        stopCount++;
      } else {
        console.warn(`  ⚠ Invalid coordinates for stop ${stopId}: ${lat}, ${lon}`);
      }
    }
  });

  console.log(`  Total stops extracted: ${stopCount}\n`);
}

/**
 * Step 5: Calculate arrival offsets and build route-stop relationships
 */
function calculateOffsets() {
  console.log('⏱️  Step 5: Calculating arrival offsets...');

  data.trips.forEach((trips, routeId) => {
    const route = data.routes.get(routeId);
    const allStops = new Map(); // stop_id -> { stop_order, arrival_offset }

    trips.forEach(trip => {
      const stopTimes = data.stopTimes.get(trip.trip_id);

      if (!stopTimes || stopTimes.length === 0) {
        console.warn(`  ⚠ No stop times for trip ${trip.trip_id}`);
        return;
      }

      // Sort by stop_sequence
      stopTimes.sort((a, b) => a.stop_sequence - b.stop_sequence);

      // First stop is the baseline
      const firstArrival = timeToSeconds(stopTimes[0].arrival_time);

      stopTimes.forEach((st, index) => {
        const arrivalSeconds = timeToSeconds(st.arrival_time);
        const offsetSeconds = arrivalSeconds - firstArrival;

        if (!allStops.has(st.stop_id)) {
          allStops.set(st.stop_id, {
            stop_order: index + 1,
            arrival_offset_seconds: offsetSeconds,
            arrival_offset: formatInterval(offsetSeconds)
          });
        }
      });
    });

    // Store route-stop relationships
    data.routeStops.set(routeId, Array.from(allStops.entries()).map(([stopId, info]) => ({
      route_id: routeId,
      stop_id: stopId,
      stop_order: info.stop_order,
      arrival_offset: info.arrival_offset
    })));

    console.log(`  ✓ Route ${route.route_number}: ${allStops.size} stops processed`);
  });

  console.log();
}

/**
 * Convert HH:MM:SS to seconds
 */
function timeToSeconds(timeStr) {
  const [hours, minutes, seconds] = timeStr.split(':').map(Number);
  return hours * 3600 + minutes * 60 + seconds;
}

/**
 * Convert seconds to PostgreSQL interval format (HH:MM:SS)
 */
function formatInterval(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

/**
 * Step 6: Generate SQL INSERT statements
 */
function generateSQL() {
  console.log('📝 Step 6: Generating SQL files...');

  // Create output directory
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Generate routes SQL
  generateRoutesSQL();

  // Generate stops SQL
  generateStopsSQL();

  // Generate route_stops SQL
  generateRouteStopsSQL();

  // Generate validation queries
  generateValidationSQL();

  // Generate ID mapping
  generateIdMapping();

  console.log(`\n✅ All SQL files generated in: ${OUTPUT_DIR}\n`);
}

/**
 * Generate routes INSERT statements
 */
function generateRoutesSQL() {
  const filePath = path.join(OUTPUT_DIR, '001_insert_routes.sql');
  let sql = `-- Generated on ${new Date().toISOString()}
-- Insert Budapest public transport routes

-- Temporarily disable RLS for bulk insert
ALTER TABLE routes DISABLE ROW LEVEL SECURITY;

-- Insert routes
INSERT INTO routes (route_number, name, route_type, created_at, updated_at)
VALUES\n`;

  const values = [];
  data.routes.forEach(route => {
    const name = escapeSQLString(route.name);
    values.push(`  ('${route.route_number}', '${name}', '${route.type}', NOW(), NOW())`);
  });

  sql += values.join(',\n');
  sql += '\nON CONFLICT (route_number) DO NOTHING;\n\n';
  sql += '-- Re-enable RLS\nALTER TABLE routes ENABLE ROW LEVEL SECURITY;\n';

  fs.writeFileSync(filePath, sql, 'utf8');
  console.log(`  ✓ Generated: 001_insert_routes.sql (${data.routes.size} routes)`);
}

/**
 * Generate stops INSERT statements
 */
function generateStopsSQL() {
  const filePath = path.join(OUTPUT_DIR, '002_insert_stops.sql');
  let sql = `-- Generated on ${new Date().toISOString()}
-- Insert Budapest public transport stops

-- Temporarily disable RLS for bulk insert
ALTER TABLE stops DISABLE ROW LEVEL SECURITY;

-- Insert stops
INSERT INTO stops (name, latitude, longitude, created_at, updated_at)
VALUES\n`;

  const values = [];
  data.stops.forEach(stop => {
    const name = escapeSQLString(stop.name);
    values.push(`  ('${name}', ${stop.latitude}, ${stop.longitude}, NOW(), NOW())`);
  });

  sql += values.join(',\n');
  sql += '\nON CONFLICT DO NOTHING;\n\n';
  sql += '-- Re-enable RLS\nALTER TABLE stops ENABLE ROW LEVEL SECURITY;\n';

  fs.writeFileSync(filePath, sql, 'utf8');
  console.log(`  ✓ Generated: 002_insert_stops.sql (${data.stops.size} stops)`);
}

/**
 * Generate route_stops INSERT statements
 */
function generateRouteStopsSQL() {
  const filePath = path.join(OUTPUT_DIR, '003_insert_route_stops.sql');
  let sql = `-- Generated on ${new Date().toISOString()}
-- Insert route-stop relationships

-- Temporarily disable RLS for bulk insert
ALTER TABLE route_stops DISABLE ROW LEVEL SECURITY;

`;

  data.routeStops.forEach((routeStops, routeId) => {
    const route = data.routes.get(routeId);

    sql += `\n-- Route: ${route.route_number} (${route.name})\n`;
    sql += `WITH route_ref AS (SELECT id FROM routes WHERE route_number = '${route.route_number}' LIMIT 1)\n`;

    routeStops.forEach((rs, index) => {
      const stop = data.stops.get(rs.stop_id);
      if (!stop) {
        console.warn(`  ⚠ Stop ${rs.stop_id} not found for route ${route.route_number}`);
        return;
      }

      const stopName = escapeSQLString(stop.name);

      sql += `${index === 0 ? '' : ','}\nINSERT INTO route_stops (route_id, stop_id, stop_order, arrival_offset, created_at, updated_at)\n`;
      sql += `SELECT (SELECT id FROM route_ref), id, ${rs.stop_order}, '${rs.arrival_offset}'::interval, NOW(), NOW()\n`;
      sql += `FROM stops WHERE name = '${stopName}' AND latitude = ${stop.latitude} AND longitude = ${stop.longitude} LIMIT 1`;
    });

    sql += '\nON CONFLICT DO NOTHING;\n';
  });

  sql += '\n-- Re-enable RLS\nALTER TABLE route_stops ENABLE ROW LEVEL SECURITY;\n';

  fs.writeFileSync(filePath, sql, 'utf8');

  const totalRelationships = Array.from(data.routeStops.values())
    .reduce((sum, rs) => sum + rs.length, 0);

  console.log(`  ✓ Generated: 003_insert_route_stops.sql (${totalRelationships} relationships)`);
}

/**
 * Generate validation SQL queries
 */
function generateValidationSQL() {
  const filePath = path.join(OUTPUT_DIR, '004_validation_queries.sql');
  const sql = `-- Generated on ${new Date().toISOString()}
-- Validation queries for GTFS import

-- 1. Check route count by type
SELECT type, COUNT(*) as count
FROM routes
GROUP BY type
ORDER BY type;
-- Expected: bus: 3, metro: 4, tram: 3

-- 2. Check total stop count
SELECT COUNT(*) as total_stops FROM stops;
-- Expected: ${data.stops.size}

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
`;

  fs.writeFileSync(filePath, sql, 'utf8');
  console.log(`  ✓ Generated: 004_validation_queries.sql`);
}

/**
 * Generate ID mapping file for reference
 */
function generateIdMapping() {
  const filePath = path.join(OUTPUT_DIR, 'id_mapping.json');

  const mapping = {
    generated_at: new Date().toISOString(),
    routes: {},
    stops: {},
    route_stops: {},
    statistics: {
      routes_count: data.routes.size,
      stops_count: data.stops.size,
      route_stops_count: Array.from(data.routeStops.values())
        .reduce((sum, rs) => sum + rs.length, 0)
    }
  };

  data.routes.forEach((route, gtfsId) => {
    mapping.routes[gtfsId] = {
      route_number: route.route_number,
      name: route.name,
      type: route.type,
      stops: [] // Will be populated below
    };
  });

  data.stops.forEach((stop, gtfsId) => {
    mapping.stops[gtfsId] = {
      name: stop.name,
      latitude: stop.latitude,
      longitude: stop.longitude
    };
  });

  // Add route_stops relationships
  data.routeStops.forEach((stops, gtfsRouteId) => {
    const route = data.routes.get(gtfsRouteId);
    if (!route) return;

    stops.forEach(routeStop => {
      // Lookup stop details from data.stops
      const stopDetails = data.stops.get(routeStop.stop_id);
      if (!stopDetails) {
        console.warn(`  ⚠️  Stop ${routeStop.stop_id} not found in stops data`);
        return;
      }

      // Add to route's stops array in mapping.routes
      mapping.routes[gtfsRouteId].stops.push({
        name: stopDetails.name,
        latitude: stopDetails.latitude,
        longitude: stopDetails.longitude,
        stop_order: routeStop.stop_order,
        arrival_offset: routeStop.arrival_offset
      });
    });
  });

  fs.writeFileSync(filePath, JSON.stringify(mapping, null, 2), 'utf8');
  console.log(`  ✓ Generated: id_mapping.json`);
}

/**
 * Escape single quotes in SQL strings
 */
function escapeSQLString(str) {
  return str.replace(/'/g, "''");
}

/**
 * Main execution
 */
async function main() {
  console.log('\n🚀 Budapest GTFS Data Import Script\n');
  console.log(`GTFS Source: ${GTFS_DIR}`);
  console.log(`Output Directory: ${OUTPUT_DIR}\n`);

  try {
    await extractRoutes();
    await extractTrips();
    await extractStopTimes();
    await extractStops();
    calculateOffsets();
    generateSQL();

    console.log('✅ Import script completed successfully!\n');
    console.log('📋 Summary:');
    console.log(`  - Routes: ${data.routes.size}`);
    console.log(`  - Stops: ${data.stops.size}`);
    console.log(`  - Route-Stop Relationships: ${Array.from(data.routeStops.values()).reduce((sum, rs) => sum + rs.length, 0)}`);
    console.log('\n🔧 Next Steps:');
    console.log('  1. Review generated SQL files in:', OUTPUT_DIR);
    console.log('  2. Open Supabase Dashboard → SQL Editor');
    console.log('  3. Execute files in order: 001, 002, 003');
    console.log('  4. Run validation queries: 004');
    console.log('\n');

  } catch (error) {
    console.error('\n❌ Error during import:', error);
    process.exit(1);
  }
}

// Run the script
main();
