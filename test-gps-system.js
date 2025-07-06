// Test script pentru sistemul GPS-Vehicle
// Rulează cu: node test-gps-system.js

const { Client } = require('pg');

const DB_URL = process.env.DATABASE_URL || 'postgresql://postgres:FHeFHPzxXbDOSWJHlAHkgCrcMLmEPaeF@interchange.proxy.rlwy.net:42409/railway';

async function testGpsVehicleSystem() {
  const client = new Client({
    connectionString: DB_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    // Test 1: Check GPS devices
    const gpsResult = await client.query('SELECT * FROM gps_devices ORDER BY created_ts DESC LIMIT 5');
    console.log(`📡 GPS Devices found: ${gpsResult.rows.length}`);
    gpsResult.rows.forEach(device => {
      console.log(`  - ${device.label} (${device.imei}) - Assigned: ${device.assigned}`);
    });

    // Test 2: Check vehicles with GPS info
    const vehicleResult = await client.query(`
      SELECT 
        v.name, v.license_plate, v.gps_device_id,
        g.label as gps_label, g.imei,
        CASE WHEN v.gps_device_id IS NOT NULL THEN true ELSE false END as has_gps
      FROM vehicles v
      LEFT JOIN gps_devices g ON v.gps_device_id = g.id
      ORDER BY v.created_ts DESC LIMIT 5
    `);
    console.log(`🚛 Vehicles found: ${vehicleResult.rows.length}`);
    vehicleResult.rows.forEach(vehicle => {
      console.log(`  - ${vehicle.name} (${vehicle.license_plate}) - GPS: ${vehicle.has_gps ? 'YES ✅' : 'NO ❌'}`);
      if (vehicle.has_gps) {
        console.log(`    GPS Device: ${vehicle.gps_label} (${vehicle.imei})`);
      }
    });

    // Test 3: Check unassigned GPS devices
    const freeGpsResult = await client.query('SELECT * FROM gps_devices WHERE assigned = false');
    console.log(`📍 Free GPS devices: ${freeGpsResult.rows.length}`);

    console.log('\n🎯 SUMMARY:');
    console.log(`- Total GPS devices: ${gpsResult.rows.length}`);
    console.log(`- Total vehicles: ${vehicleResult.rows.length}`);
    console.log(`- Free GPS devices: ${freeGpsResult.rows.length}`);
    console.log(`- Vehicles with GPS: ${vehicleResult.rows.filter(v => v.has_gps).length}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

// Run the test
testGpsVehicleSystem().catch(console.error); 