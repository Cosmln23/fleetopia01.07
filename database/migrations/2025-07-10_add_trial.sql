-- Migration: Add trial functionality to users table
-- Date: 2025-07-10
-- Author: Claude Code Assistant

-- Add trial-related columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'TRIAL',
ADD COLUMN IF NOT EXISTS trial_expires_at TIMESTAMP;

-- Update existing users to have trial expiration (7 days from creation)
UPDATE users 
SET 
  trial_expires_at = created_at + INTERVAL '7 days',
  status = CASE 
    WHEN verification_status = 'verified' THEN 'ACTIVE'
    WHEN profile_completed = true THEN 'TRIAL'
    ELSE 'TRIAL'
  END
WHERE trial_expires_at IS NULL;

-- Add index for efficient trial expiration queries
CREATE INDEX IF NOT EXISTS idx_users_trial_expires_at ON users(trial_expires_at);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

-- Add check constraint for valid status values
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'chk_users_status' 
    AND table_name = 'users'
  ) THEN
    ALTER TABLE users 
    ADD CONSTRAINT chk_users_status 
    CHECK (status IN ('TRIAL', 'ACTIVE', 'DISABLED', 'SUSPENDED'));
  END IF;
END $$;

-- Update verification status logic: verified users should be ACTIVE
UPDATE users 
SET status = 'ACTIVE' 
WHERE verification_status = 'verified' AND status = 'TRIAL';

-- Add function to automatically expire trials (for cron jobs)
CREATE OR REPLACE FUNCTION expire_trials() RETURNS INTEGER AS $$
DECLARE
  expired_count INTEGER;
BEGIN
  -- Update expired trial users to DISABLED status
  UPDATE users 
  SET status = 'DISABLED', updated_at = NOW()
  WHERE status = 'TRIAL' 
    AND trial_expires_at < NOW()
    AND verification_status != 'verified';
  
  GET DIAGNOSTICS expired_count = ROW_COUNT;
  
  -- Log the operation
  INSERT INTO notifications (user_id, type, title, content, created_at)
  SELECT 
    'system' as user_id,
    'system' as type,
    'Trial Expiration Batch' as title,
    'Expired ' || expired_count || ' trial accounts' as content,
    NOW() as created_at;
  
  RETURN expired_count;
END;
$$ LANGUAGE plpgsql;

-- Add function to get users needing trial reminders
CREATE OR REPLACE FUNCTION get_trial_reminder_users(days_before INTEGER) 
RETURNS TABLE (
  clerk_id TEXT,
  email TEXT,
  name TEXT,
  trial_expires_at TIMESTAMP,
  days_left INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.clerk_id,
    u.email,
    u.name,
    u.trial_expires_at,
    EXTRACT(DAYS FROM (u.trial_expires_at - NOW()))::INTEGER as days_left
  FROM users u
  WHERE u.status = 'TRIAL'
    AND u.verification_status != 'verified'
    AND u.trial_expires_at IS NOT NULL
    AND EXTRACT(DAYS FROM (u.trial_expires_at - NOW())) = days_before
    AND u.trial_expires_at > NOW();
END;
$$ LANGUAGE plpgsql;

-- Migration completed successfully
-- Next steps:
-- 1. Update Clerk webhook to set trial_expires_at for new users
-- 2. Update middleware to check trial expiration
-- 3. Set up cron jobs to call expire_trials() and send reminders