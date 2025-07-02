-- Clerk User Management Migration
-- Adds foreign key relationships for provider/carrier roles

-- Create users table for Clerk user management
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  clerk_id TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('provider', 'carrier')),
  created_ts INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  updated_ts INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
);

-- Add foreign key columns to existing tables
ALTER TABLE cargo ADD COLUMN provider_id TEXT REFERENCES users(clerk_id);
ALTER TABLE vehicles ADD COLUMN owner_id TEXT REFERENCES users(clerk_id);

-- Create offer_requests table if it doesn't exist (for quotes)
CREATE TABLE IF NOT EXISTS offer_requests (
  id TEXT PRIMARY KEY,
  cargo_id TEXT NOT NULL REFERENCES cargo(id),
  carrier_id TEXT NOT NULL REFERENCES users(clerk_id),
  proposed_price REAL NOT NULL,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACCEPTED', 'REJECTED')),
  created_ts INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  updated_ts INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_cargo_provider ON cargo(provider_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_owner ON vehicles(owner_id);
CREATE INDEX IF NOT EXISTS idx_offers_cargo ON offer_requests(cargo_id);
CREATE INDEX IF NOT EXISTS idx_offers_carrier ON offer_requests(carrier_id);
CREATE INDEX IF NOT EXISTS idx_users_clerk ON users(clerk_id);

-- Update trigger for users table
CREATE TRIGGER IF NOT EXISTS update_users_timestamp 
AFTER UPDATE ON users
BEGIN
  UPDATE users SET updated_ts = strftime('%s', 'now') WHERE id = NEW.id;
END;

-- Update trigger for offer_requests table  
CREATE TRIGGER IF NOT EXISTS update_offers_timestamp
AFTER UPDATE ON offer_requests
BEGIN
  UPDATE offer_requests SET updated_ts = strftime('%s', 'now') WHERE id = NEW.id;
END;