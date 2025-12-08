const fs = require('fs');
const path = require('path');

const mappingFile = path.join(__dirname, '..', 'database', 'gtfs-import', 'id_mapping.json');
const mapping = JSON.parse(fs.readFileSync(mappingFile, 'utf8'));

console.log('Checking for duplicate stop_orders in routes...\n');

let hasDuplicates = false;

Object.entries(mapping.routes).forEach(([gtfsId, route]) => {
  const stops = route.stops || [];
  const orders = stops.map(s => s.stop_order);
  const uniqueOrders = new Set(orders);

  if (orders.length !== uniqueOrders.size) {
    hasDuplicates = true;
    console.log(`❌ Route ${route.route_number} has duplicate stop_orders:`);
    const orderCounts = {};
    orders.forEach(o => orderCounts[o] = (orderCounts[o] || 0) + 1);
    Object.entries(orderCounts)
      .filter(([k,v]) => v > 1)
      .forEach(([order, count]) => {
        console.log(`  stop_order ${order}: ${count} times`);
      });
    console.log();
  }
});

if (!hasDuplicates) {
  console.log('✅ No duplicate stop_orders found!');
}
