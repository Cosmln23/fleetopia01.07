-- Migration: Add sender_id column to cargo table
-- Date: 2025-07-21
-- Purpose: Enable proper ownership tracking for cargo listings

-- Add sender_id column to cargo table
ALTER TABLE cargo ADD COLUMN IF NOT EXISTS sender_id TEXT;

-- Create index for better performance on ownership queries
CREATE INDEX IF NOT EXISTS idx_cargo_sender_id ON cargo(sender_id);

-- Update existing cargo records to set sender_id based on provider_name
-- Match with users table by name or company
UPDATE cargo 
SET sender_id = (
  SELECT u.clerk_id 
  FROM users u 
  WHERE u.name = cargo.provider_name OR u.company = cargo.provider_name
  LIMIT 1
)
WHERE sender_id IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN cargo.sender_id IS 'Clerk user ID of the cargo owner/sender for proper ownership tracking'; 