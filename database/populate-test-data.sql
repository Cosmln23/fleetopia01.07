-- Populate test data for GPS and Vehicles
-- PostgreSQL version

-- Insert test GPS devices if they don't exist
INSERT INTO gps_devices (id, label, imei, api_key, assigned, created_ts, updated_ts) 
VALUES 
  ('gps_test_001', 'Fleet GPS Tracker A', 'IMEI111222333', 'api_key_test_001', false, extract(epoch from now()) * 1000, extract(epoch from now()) * 1000),
  ('gps_test_002', 'Fleet GPS Tracker B', 'IMEI444555666', 'api_key_test_002', false, extract(epoch from now()) * 1000, extract(epoch from now()) * 1000),
  ('gps_test_003', 'Fleet GPS Tracker C', 'IMEI777888999', 'api_key_test_003', false, extract(epoch from now()) * 1000, extract(epoch from now()) * 1000),
  ('gps_test_004', 'Advanced GPS Unit', 'IMEI101112131', 'api_key_test_004', false, extract(epoch from now()) * 1000, extract(epoch from now()) * 1000)
ON CONFLICT (id) DO NOTHING;

-- Insert test vehicles with some having GPS assigned
INSERT INTO vehicles (
  id, name, license_plate, type, capacity, status, 
  driver_name, driver_phone, fuel_type, 
  gps_device_id, last_manual_lat, last_manual_lng, last_manual_location,
  created_ts, updated_ts
) VALUES 
  (
    'vehicle_test_001', 'Mercedes Truck Alpha', 'B-ABC-123', 'Truck', 
    18.5, 'active', 'John Doe', '+40721123456', 'diesel',
    'gps_test_001', 44.4268, 26.1025, 'Bucharest, Romania',
    extract(epoch from now()) * 1000, extract(epoch from now()) * 1000
  ),
  (
    'vehicle_test_002', 'Volvo Van Beta', 'IF-XYZ-789', 'Van', 
    3.5, 'active', 'Maria Popescu', '+40721654321', 'diesel',
    NULL, 46.7712, 23.6236, 'Cluj-Napoca, Romania',
    extract(epoch from now()) * 1000, extract(epoch from now()) * 1000
  ),
  (
    'vehicle_test_003', 'Scania Semi Gamma', 'TM-DEF-456', 'Semi-Truck', 
    40.0, 'active', 'Alexandru Ion', '+40721987654', 'diesel',
    'gps_test_002', 45.7489, 21.2087, 'Timisoara, Romania',
    extract(epoch from now()) * 1000, extract(epoch from now()) * 1000
  )
ON CONFLICT (id) DO NOTHING;

-- Mark assigned GPS devices
UPDATE gps_devices SET assigned = true, updated_ts = extract(epoch from now()) * 1000
WHERE id IN ('gps_test_001', 'gps_test_002'); 