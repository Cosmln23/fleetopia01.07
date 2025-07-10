-- EXTEND TRIAL TO 14 DAYS + 5 CARGO LIMIT MIGRATION
-- Date: 11.07.2025
-- Purpose: Update trial system to 14 days with 5 cargo posting limit

-- Rename trial_expires_at to trial_started_at for better tracking
ALTER TABLE users RENAME COLUMN trial_expires_at TO trial_started_at;

-- Update existing trial users to have proper trial_started_at timestamp
UPDATE users 
SET trial_started_at = NOW() 
WHERE status = 'TRIAL' AND trial_started_at IS NULL;

-- Add cargo_count_trial to track cargo posted during trial
ALTER TABLE users ADD COLUMN IF NOT EXISTS cargo_count_trial INTEGER DEFAULT 0;

-- Update existing users' cargo count for trial period
UPDATE users 
SET cargo_count_trial = (
  SELECT COUNT(*) 
  FROM cargo 
  WHERE cargo.provider_name = users.name 
  AND cargo.created_ts >= EXTRACT(EPOCH FROM users.trial_started_at) * 1000
) 
WHERE status = 'TRIAL' AND trial_started_at IS NOT NULL;

-- Create function to check trial validity (14 days)
CREATE OR REPLACE FUNCTION is_trial_valid(user_trial_started_at TIMESTAMP, user_status TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  -- If not a trial user, return true (not applicable)
  IF user_status != 'TRIAL' THEN
    RETURN TRUE;
  END IF;
  
  -- If no trial start date, return false
  IF user_trial_started_at IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Check if within 14 days
  RETURN (NOW() - user_trial_started_at) <= INTERVAL '14 days';
END;
$$ LANGUAGE plpgsql;

-- Create function to check cargo limit (5 cargo)
CREATE OR REPLACE FUNCTION is_cargo_limit_valid(user_id TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  user_status TEXT;
  trial_started_at TIMESTAMP;
  cargo_count INTEGER;
BEGIN
  -- Get user info
  SELECT status, trial_started_at INTO user_status, trial_started_at
  FROM users WHERE clerk_id = user_id;
  
  -- If not a trial user, return true (not applicable)
  IF user_status != 'TRIAL' THEN
    RETURN TRUE;
  END IF;
  
  -- Count cargo posted during trial period
  SELECT COUNT(*) INTO cargo_count
  FROM cargo 
  WHERE provider_name IN (
    SELECT name FROM users WHERE clerk_id = user_id
  )
  AND created_ts >= EXTRACT(EPOCH FROM trial_started_at) * 1000;
  
  -- Check if under 5 cargo limit
  RETURN cargo_count < 5;
END;
$$ LANGUAGE plpgsql;

-- Create function to get trial days remaining
CREATE OR REPLACE FUNCTION get_trial_days_remaining(user_trial_started_at TIMESTAMP, user_status TEXT)
RETURNS INTEGER AS $$
DECLARE
  days_elapsed INTEGER;
  days_remaining INTEGER;
BEGIN
  -- If not a trial user, return -1 (not applicable)
  IF user_status != 'TRIAL' THEN
    RETURN -1;
  END IF;
  
  -- If no trial start date, return 0
  IF user_trial_started_at IS NULL THEN
    RETURN 0;
  END IF;
  
  -- Calculate days elapsed
  days_elapsed := EXTRACT(DAYS FROM (NOW() - user_trial_started_at));
  
  -- Calculate days remaining (14 - elapsed)
  days_remaining := 14 - days_elapsed;
  
  -- Return 0 if expired, otherwise remaining days
  RETURN GREATEST(0, days_remaining);
END;
$$ LANGUAGE plpgsql;

-- Create function to get cargo count during trial
CREATE OR REPLACE FUNCTION get_trial_cargo_count(user_id TEXT)
RETURNS INTEGER AS $$
DECLARE
  user_status TEXT;
  trial_started_at TIMESTAMP;
  cargo_count INTEGER;
BEGIN
  -- Get user info
  SELECT status, trial_started_at INTO user_status, trial_started_at
  FROM users WHERE clerk_id = user_id;
  
  -- If not a trial user, return -1 (not applicable)
  IF user_status != 'TRIAL' THEN
    RETURN -1;
  END IF;
  
  -- If no trial start date, return 0
  IF trial_started_at IS NULL THEN
    RETURN 0;
  END IF;
  
  -- Count cargo posted during trial period
  SELECT COUNT(*) INTO cargo_count
  FROM cargo 
  WHERE provider_name IN (
    SELECT name FROM users WHERE clerk_id = user_id
  )
  AND created_ts >= EXTRACT(EPOCH FROM trial_started_at) * 1000;
  
  RETURN cargo_count;
END;
$$ LANGUAGE plpgsql;

-- Update trial reminder functions to use 14 days
DROP FUNCTION IF EXISTS get_trial_reminder_users(INTEGER);

CREATE OR REPLACE FUNCTION get_trial_reminder_users(days_before INTEGER)
RETURNS TABLE(
  clerk_id TEXT,
  email TEXT,
  name TEXT,
  trial_started_at TIMESTAMP,
  days_remaining INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.clerk_id,
    u.email,
    u.name,
    u.trial_started_at,
    get_trial_days_remaining(u.trial_started_at, u.status) as days_remaining
  FROM users u
  WHERE u.status = 'TRIAL'
    AND u.trial_started_at IS NOT NULL
    AND get_trial_days_remaining(u.trial_started_at, u.status) = days_before
    AND get_trial_days_remaining(u.trial_started_at, u.status) > 0;
END;
$$ LANGUAGE plpgsql;

-- Update expire trials function for 14 days
DROP FUNCTION IF EXISTS expire_trials();

CREATE OR REPLACE FUNCTION expire_trials()
RETURNS TABLE(
  expired_count INTEGER,
  expired_users TEXT[]
) AS $$
DECLARE
  expired_user_ids TEXT[];
  expired_count INTEGER;
BEGIN
  -- Get expired trial users
  SELECT ARRAY_AGG(clerk_id) INTO expired_user_ids
  FROM users
  WHERE status = 'TRIAL'
    AND trial_started_at IS NOT NULL
    AND NOT is_trial_valid(trial_started_at, status);
  
  -- Count expired users
  expired_count := COALESCE(array_length(expired_user_ids, 1), 0);
  
  -- Update expired users to DISABLED status
  UPDATE users
  SET status = 'DISABLED', updated_at = NOW()
  WHERE status = 'TRIAL'
    AND trial_started_at IS NOT NULL
    AND NOT is_trial_valid(trial_started_at, status);
  
  -- Return results
  RETURN QUERY SELECT expired_count, expired_user_ids;
END;
$$ LANGUAGE plpgsql;

-- Create view for trial statistics
CREATE OR REPLACE VIEW v_trial_stats AS
SELECT 
  COUNT(*) FILTER (WHERE status = 'TRIAL') as total_trial_users,
  COUNT(*) FILTER (WHERE status = 'TRIAL' AND is_trial_valid(trial_started_at, status)) as active_trials,
  COUNT(*) FILTER (WHERE status = 'TRIAL' AND NOT is_trial_valid(trial_started_at, status)) as expired_trials,
  COUNT(*) FILTER (WHERE status = 'TRIAL' AND get_trial_days_remaining(trial_started_at, status) <= 3) as expiring_soon,
  COUNT(*) FILTER (WHERE status = 'TRIAL' AND get_trial_cargo_count(clerk_id) >= 4) as near_cargo_limit,
  COUNT(*) FILTER (WHERE status = 'TRIAL' AND get_trial_cargo_count(clerk_id) >= 5) as at_cargo_limit,
  AVG(get_trial_days_remaining(trial_started_at, status)) FILTER (WHERE status = 'TRIAL' AND is_trial_valid(trial_started_at, status)) as avg_days_remaining
FROM users;

-- Comments for maintenance
COMMENT ON FUNCTION is_trial_valid IS 'Check if trial user is within 14-day trial period';
COMMENT ON FUNCTION is_cargo_limit_valid IS 'Check if trial user is under 5 cargo posting limit';
COMMENT ON FUNCTION get_trial_days_remaining IS 'Get number of days remaining in 14-day trial';
COMMENT ON FUNCTION get_trial_cargo_count IS 'Get number of cargo posted during trial period';
COMMENT ON VIEW v_trial_stats IS 'Statistics view for 14-day trial system with cargo limits';

-- Analyze tables for query planner optimization
ANALYZE users;
ANALYZE cargo;