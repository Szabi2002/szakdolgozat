#!/usr/bin/env node

/**
 * Import route_stops relationships from id_mapping.json to Supabase
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
function loadEnvFile() {
  const envPath = path.join(__dirname, '..', 'backend', '.env');
  if (!fs.existsSync(envPath)) {
    console.error('❌ Error: backend/.env file not found');
    process.exit(1);
  }

  const envContent = fs.readFileSync(envPath, 'utf8');
  const env = {};

  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim().replace(/^["']|["']$/g, '');
      env[key] = value;
    }
  });

  return env;
}

const env = loadEnvFile();
const supabaseUrl = env.SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in backend/.env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const ID_MAPPING_FILE = path.join(__dirname, '..', 'database', 'gtfs-import', 'id_mapping.json');
const BATCH_SIZE = 50;

async function loadIdMapping() {
  console.log('📖 Loading ID mapping...');

  const mappingContent = fs.readFileSync(ID_MAPPING_FILE, 'utf8');
  const mapping = JSON.parse(mappingContent);

  console.log(`  ✓ Loaded mapping for ${Object.keys(mapping.routes).length} routes`);
  console.log(`  ✓ Loaded mapping for ${Object.keys(mapping.stops).length} stops`);

  return mapping;
}

async function fetchDatabaseIds() {
  console.log('\n🔍 Fetching database IDs for routes and stops...');

  // Fetch all routes
  const { data: routes, error: routesError } = await supabase
    .from('routes')
    .select('id, route_number');

  if (routesError) {
    throw new Error(`Failed to fetch routes: ${routesError.message}`);
  }

  // Fetch all stops
  const { data: stops, error: stopsError } = await supabase
    .from('stops')
    .select('id, name, latitude, longitude');

  if (stopsError) {
    throw new Error(`Failed to fetch stops: ${stopsError.message}`);
  }

  console.log(`  ✓ Fetched ${routes.length} routes from database`);
  console.log(`  ✓ Fetched ${stops.length} stops from database`);

  // Create lookup maps
  const routeMap = {};
  routes.forEach(r => {
    routeMap[r.route_number] = r.id;
  });

  const stopMap = {};
  stops.forEach(s => {
    const key = `${s.name}|${parseFloat(s.latitude).toFixed(6)}|${parseFloat(s.longitude).toFixed(6)}`;
    stopMap[key] = s.id;
  });

  return { routeMap, stopMap };
}

async function buildRouteStopsData(mapping, routeMap, stopMap) {
  console.log('\n🔗 Building route-stop relationships...');

  const routeStops = [];
  let missingRoutes = 0;
  let missingStops = 0;

  for (const [gtfsRouteId, routeData] of Object.entries(mapping.routes)) {
    // Use route_number from mapping (not GTFS route_id)
    const routeNumber = routeData.route_number;
    const routeId = routeMap[routeNumber];

    if (!routeId) {
      console.warn(`  ⚠️  Route ${routeNumber} (GTFS: ${gtfsRouteId}) not found in database`);
      missingRoutes++;
      continue;
    }

    // Process each stop in the route
    routeData.stops.forEach(stop => {
      const stopKey = `${stop.name}|${parseFloat(stop.latitude).toFixed(6)}|${parseFloat(stop.longitude).toFixed(6)}`;
      const stopId = stopMap[stopKey];

      if (!stopId) {
        console.warn(`  ⚠️  Stop "${stop.name}" (${stop.latitude}, ${stop.longitude}) not found`);
        missingStops++;
        return;
      }

      routeStops.push({
        route_id: routeId,
        stop_id: stopId,
        stop_order: stop.stop_order,
        arrival_offset: stop.arrival_offset
      });
    });
  }

  console.log(`  ✓ Built ${routeStops.length} route-stop relationships`);
  if (missingRoutes > 0) {
    console.log(`  ⚠️  ${missingRoutes} routes not found in database`);
  }
  if (missingStops > 0) {
    console.log(`  ⚠️  ${missingStops} stops not found in database`);
  }

  return routeStops;
}

async function importRouteStops(routeStops) {
  console.log(`\n🚏 Importing ${routeStops.length} route-stop relationships in batches of ${BATCH_SIZE}...`);

  let imported = 0;
  let errors = 0;

  for (let i = 0; i < routeStops.length; i += BATCH_SIZE) {
    const batch = routeStops.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(routeStops.length / BATCH_SIZE);

    console.log(`  Processing batch ${batchNum}/${totalBatches} (${batch.length} relationships)...`);

    try {
      const { data, error } = await supabase
        .from('route_stops')
        .insert(batch)
        .select('route_id, stop_id');

      if (error) {
        console.error(`    ❌ Error in batch ${batchNum}:`, error.message);
        errors += batch.length;
      } else {
        console.log(`    ✓ Batch ${batchNum} imported successfully (${data.length} relationships)`);
        imported += data.length;
      }
    } catch (err) {
      console.error(`    ❌ Exception in batch ${batchNum}:`, err.message);
      errors += batch.length;
    }

    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log(`\n✅ Import completed:`);
  console.log(`  - Successfully imported: ${imported} relationships`);
  console.log(`  - Errors: ${errors} relationships`);

  return { imported, errors };
}

async function main() {
  console.log('🚀 Supabase Route-Stops Import Script\n');

  try {
    const mapping = await loadIdMapping();
    const { routeMap, stopMap } = await fetchDatabaseIds();
    const routeStops = await buildRouteStopsData(mapping, routeMap, stopMap);
    const result = await importRouteStops(routeStops);

    if (result.errors === 0) {
      console.log('\n🎉 All route-stop relationships imported successfully!');
      process.exit(0);
    } else {
      console.log('\n⚠️  Import completed with some errors');
      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ Fatal error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
