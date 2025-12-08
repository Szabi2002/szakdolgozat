#!/usr/bin/env node

/**
 * Import stops from generated SQL to Supabase
 *
 * This script reads the generated 002_insert_stops.sql file
 * and imports stops in batches using Supabase JavaScript client
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Load environment variables from backend/.env manually
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
      const value = match[2].trim().replace(/^["']|["']$/g, ''); // Remove quotes
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

// Read the id_mapping.json to get GTFS stop_id -> stop names mapping
const SQL_FILE = path.join(__dirname, '..', 'database', 'gtfs-import', '002_insert_stops.sql');
const BATCH_SIZE = 100;

async function parseStopsFromSQL() {
  console.log('📖 Parsing stops from SQL file...');

  const sqlContent = fs.readFileSync(SQL_FILE, 'utf8');

  // Extract VALUES section using regex
  const valuesMatch = sqlContent.match(/VALUES\s+([\s\S]+?)ON CONFLICT/);
  if (!valuesMatch) {
    throw new Error('Could not find VALUES section in SQL file');
  }

  const valuesSection = valuesMatch[1];

  // Parse each stop entry - format: ('Name', lat, lon, NOW(), NOW()),
  const stopRegex = /\('([^']+)',\s*([\d.]+),\s*([\d.]+),\s*NOW\(\),\s*NOW\(\)\)/g;
  const stops = [];

  let match;
  while ((match = stopRegex.exec(valuesSection)) !== null) {
    stops.push({
      name: match[1],
      latitude: parseFloat(match[2]),
      longitude: parseFloat(match[3])
    });
  }

  console.log(`  ✓ Parsed ${stops.length} stops`);
  return stops;
}

async function importStops(stops) {
  console.log(`\n🚏 Importing ${stops.length} stops in batches of ${BATCH_SIZE}...`);

  let imported = 0;
  let errors = 0;

  for (let i = 0; i < stops.length; i += BATCH_SIZE) {
    const batch = stops.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(stops.length / BATCH_SIZE);

    console.log(`  Processing batch ${batchNum}/${totalBatches} (${batch.length} stops)...`);

    try {
      const { data, error } = await supabase
        .from('stops')
        .insert(batch)
        .select('id, name');

      if (error) {
        console.error(`    ❌ Error in batch ${batchNum}:`, error.message);
        errors += batch.length;
      } else {
        console.log(`    ✓ Batch ${batchNum} imported successfully (${data.length} stops)`);
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
  console.log(`  - Successfully imported: ${imported} stops`);
  console.log(`  - Errors: ${errors} stops`);

  return { imported, errors };
}

async function main() {
  console.log('🚀 Supabase Stops Import Script\n');

  try {
    const stops = await parseStopsFromSQL();
    const result = await importStops(stops);

    if (result.errors === 0) {
      console.log('\n🎉 All stops imported successfully!');
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
