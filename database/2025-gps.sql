-- GPS Devices Registry Migration - PostgreSQL version
-- Run: psql $DATABASE_URL < database/2025-gps.sql

CREATE TABLE IF NOT EXISTS gps_devices (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  imei TEXT,
  api_key TEXT,
  assigned BOOLEAN DEFAULT false,
  created_ts BIGINT NOT NULL,
  updated_ts BIGINT NOT NULL
);

-- Add GPS device reference to vehicles (if not exists)
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS gps_device_id TEXT;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS last_manual_lat REAL;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS last_manual_lng REAL;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS last_manual_location TEXT;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_gps_devices_assigned ON gps_devices(assigned);
CREATE INDEX IF NOT EXISTS idx_vehicles_gps_device ON vehicles(gps_device_id);

-- Insert demo GPS devices for testing
INSERT INTO gps_devices (id, label, imei, api_key, assigned, created_ts, updated_ts) 
VALUES 
  ('gps_demo_1', 'Demo GPS Tracker #1', 'IMEI123456789', 'demo_api_key_123', false, extract(epoch from now()) * 1000, extract(epoch from now()) * 1000),
  ('gps_demo_2', 'Demo GPS Tracker #2', 'IMEI987654321', 'demo_api_key_456', false, extract(epoch from now()) * 1000, extract(epoch from now()) * 1000),
  ('gps_demo_3', 'Test GPS Device', 'IMEI555666777', 'test_api_key_789', false, extract(epoch from now()) * 1000, extract(epoch from now()) * 1000)
ON CONFLICT (id) DO NOTHING;