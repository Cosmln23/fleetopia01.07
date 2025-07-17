-- FLEETOPIA MARKETPLACE DATABASE SCHEMA
-- PostgreSQL Schema for Cargo Management System
-- Created: 02.07.2025

-- Cargo table for marketplace listings
CREATE TABLE IF NOT EXISTS cargo (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  type TEXT NOT NULL,
  urgency TEXT NOT NULL,
  weight REAL NOT NULL,
  volume REAL,
  from_addr TEXT NOT NULL,
  from_country TEXT NOT NULL,
  from_postal TEXT,
  from_city TEXT,
  to_addr TEXT NOT NULL,
  to_country TEXT NOT NULL,
  to_postal TEXT,
  to_city TEXT,
  from_lat REAL,
  from_lng REAL,
  to_lat REAL,
  to_lng REAL,
  load_date TEXT NOT NULL,
  delivery_date TEXT NOT NULL,
  price REAL,                   -- NULL = negotiable
  price_per_kg REAL,
  provider_name TEXT NOT NULL,
  provider_status TEXT NOT NULL,
  status TEXT DEFAULT 'NEW',    -- NEW | OPEN | TAKEN | IN_PROGRESS | COMPLETED
  created_ts BIGINT NOT NULL,
  updated_ts BIGINT NOT NULL,
  posting_date TEXT NOT NULL
);

-- Offer requests table for bidding system
CREATE TABLE IF NOT EXISTS offer_requests (
  id TEXT PRIMARY KEY,
  cargo_id TEXT NOT NULL,
  transporter_id TEXT NOT NULL,
  proposed_price REAL NOT NULL,
  message TEXT,
  status TEXT DEFAULT 'PENDING', -- PENDING | ACCEPTED | REJECTED
  created_ts BIGINT NOT NULL,
  FOREIGN KEY (cargo_id) REFERENCES cargo(id) ON DELETE CASCADE
);

-- Users table for basic user management and onboarding
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  clerk_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  company TEXT,
  vat_number TEXT,
  role TEXT, -- provider | carrier
  industry TEXT,
  address TEXT,
  city TEXT,
  country TEXT DEFAULT 'Romania',
  vehicle_count INTEGER,
  rating REAL DEFAULT 0,
  verified BOOLEAN DEFAULT FALSE,
  avatar TEXT,
  last_seen BIGINT,
  is_online BOOLEAN DEFAULT FALSE,
  profile_completed BOOLEAN DEFAULT FALSE,
  trial_started BOOLEAN DEFAULT FALSE,
  verification_status VARCHAR(20) DEFAULT 'unverified',
  verification_documents JSONB,
  verification_submitted_at TIMESTAMP,
  verification_processed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP
);

-- Notifications table for user alerts and messages
CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL, -- 'system', 'cargo', 'message', 'quote'
  title TEXT NOT NULL,
  content TEXT,
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,
  metadata JSONB
);

-- Verification requests table for document management
CREATE TABLE IF NOT EXISTS verification_requests (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  documents_uploaded JSONB,
  status VARCHAR(20) DEFAULT 'pending',
  submitted_at TIMESTAMP DEFAULT NOW(),
  processed_at TIMESTAMP,
  processed_by TEXT,
  rejection_reason TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES users(clerk_id)
);

-- Chat Messages Table for HTTP polling fallback
CREATE TABLE IF NOT EXISTS chat_messages (
  id TEXT PRIMARY KEY,
  cargo_id TEXT NOT NULL,
  sender_id TEXT NOT NULL,
  sender_name TEXT NOT NULL,
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text',
  price_amount REAL,
  created_ts BIGINT NOT NULL,
  FOREIGN KEY (cargo_id) REFERENCES cargo(id) ON DELETE CASCADE
);

-- Fleet Management Tables
CREATE TABLE IF NOT EXISTS vehicles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  license_plate TEXT NOT NULL,
  type TEXT NOT NULL,
  capacity REAL,
  status TEXT DEFAULT 'active',
  driver_name TEXT,
  driver_phone TEXT,
  fuel_type TEXT DEFAULT 'diesel',
  gps_device_id TEXT,
  last_manual_lat REAL,
  last_manual_lng REAL,
  last_manual_location TEXT,
  created_ts BIGINT NOT NULL,
  updated_ts BIGINT NOT NULL
);

CREATE TABLE IF NOT EXISTS gps_devices (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  imei TEXT,
  api_key TEXT,
  assigned BOOLEAN DEFAULT false,
  created_ts BIGINT NOT NULL,
  updated_ts BIGINT NOT NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_cargo_status ON cargo(status);
CREATE INDEX IF NOT EXISTS idx_cargo_created ON cargo(created_ts);
CREATE INDEX IF NOT EXISTS idx_cargo_country ON cargo(from_country, to_country);
CREATE INDEX IF NOT EXISTS idx_cargo_type ON cargo(type);
CREATE INDEX IF NOT EXISTS idx_cargo_urgency ON cargo(urgency);
CREATE INDEX IF NOT EXISTS idx_cargo_price ON cargo(price);
CREATE INDEX IF NOT EXISTS idx_offer_cargo ON offer_requests(cargo_id);
CREATE INDEX IF NOT EXISTS idx_users_clerk_id ON users(clerk_id);
CREATE INDEX IF NOT EXISTS idx_users_profile_completed ON users(profile_completed);
CREATE INDEX IF NOT EXISTS idx_users_vat_number ON users(vat_number);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);
CREATE INDEX IF NOT EXISTS idx_chat_messages_cargo ON chat_messages(cargo_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created ON chat_messages(created_ts);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read_at ON notifications(read_at);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_users_verification_status ON users(verification_status);
CREATE INDEX IF NOT EXISTS idx_verification_requests_user_id ON verification_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_verification_requests_status ON verification_requests(status);
CREATE INDEX IF NOT EXISTS idx_offer_status ON offer_requests(status);
CREATE INDEX IF NOT EXISTS idx_vehicles_gps_device ON vehicles(gps_device_id);
CREATE INDEX IF NOT EXISTS idx_gps_devices_assigned ON gps_devices(assigned);

-- Global Chat Conversations Table
CREATE TABLE IF NOT EXISTS conversations (
  id TEXT PRIMARY KEY,
  participant1_id TEXT NOT NULL,
  participant1_name TEXT NOT NULL,
  participant1_avatar TEXT,
  participant2_id TEXT NOT NULL,
  participant2_name TEXT NOT NULL,
  participant2_avatar TEXT,
  cargo_id TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (cargo_id) REFERENCES cargo(id) ON DELETE SET NULL
);

-- Update chat_messages table to support conversations
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS conversation_id TEXT;
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS read BOOLEAN DEFAULT false;

-- Add indexes for conversation support
CREATE INDEX IF NOT EXISTS idx_conversations_participant1 ON conversations(participant1_id);
CREATE INDEX IF NOT EXISTS idx_conversations_participant2 ON conversations(participant2_id);
CREATE INDEX IF NOT EXISTS idx_conversations_cargo ON conversations(cargo_id);
CREATE INDEX IF NOT EXISTS idx_conversations_updated ON conversations(updated_at);
CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation ON chat_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_read ON chat_messages(read);