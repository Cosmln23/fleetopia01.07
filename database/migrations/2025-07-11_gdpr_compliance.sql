-- GDPR COMPLIANCE MIGRATION
-- Date: 11.07.2025
-- Purpose: Add GDPR compliance tracking and data management

-- Add GDPR consent tracking to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS gdpr_consented_at TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS privacy_policy_version VARCHAR(10) DEFAULT '1.0';
ALTER TABLE users ADD COLUMN IF NOT EXISTS marketing_consent BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS data_processing_consent BOOLEAN DEFAULT TRUE;

-- Create GDPR consent log table
CREATE TABLE IF NOT EXISTS gdpr_consent_log (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  consent_type VARCHAR(50) NOT NULL, -- 'privacy_policy', 'marketing', 'data_processing'
  consent_given BOOLEAN NOT NULL,
  consent_version VARCHAR(10),
  ip_address INET,
  user_agent TEXT,
  consent_method VARCHAR(50), -- 'signup', 'settings_update', 'explicit_request'
  created_at TIMESTAMP DEFAULT NOW(),
  
  -- Foreign key to users table
  CONSTRAINT fk_gdpr_consent_user 
    FOREIGN KEY (user_id) 
    REFERENCES users(clerk_id) 
    ON DELETE CASCADE
);

-- Create data processing activities log
CREATE TABLE IF NOT EXISTS data_processing_log (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  activity_type VARCHAR(100) NOT NULL, -- 'profile_view', 'cargo_creation', 'offer_submission', etc.
  activity_description TEXT,
  data_subject TEXT, -- What data was processed
  legal_basis VARCHAR(50), -- 'consent', 'contract', 'legitimate_interest'
  retention_period VARCHAR(50), -- '7_years', '3_years', 'until_deletion_request'
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  
  -- Foreign key to users table
  CONSTRAINT fk_data_processing_user 
    FOREIGN KEY (user_id) 
    REFERENCES users(clerk_id) 
    ON DELETE CASCADE
);

-- Create data deletion requests table
CREATE TABLE IF NOT EXISTS data_deletion_requests (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  request_type VARCHAR(50) NOT NULL, -- 'full_deletion', 'partial_deletion', 'data_export'
  request_reason TEXT,
  requested_data TEXT[], -- Array of data types to delete
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'rejected'
  processed_by TEXT,
  processed_at TIMESTAMP,
  completion_date TIMESTAMP,
  retention_override_reason TEXT, -- Reason if deletion cannot be completed
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Foreign key to users table
  CONSTRAINT fk_deletion_request_user 
    FOREIGN KEY (user_id) 
    REFERENCES users(clerk_id) 
    ON DELETE CASCADE
);

-- Create rate limiting table
CREATE TABLE IF NOT EXISTS rate_limits (
  id SERIAL PRIMARY KEY,
  identifier TEXT NOT NULL, -- user_id or IP address
  identifier_type VARCHAR(20) NOT NULL, -- 'user_id', 'ip_address'
  endpoint VARCHAR(200) NOT NULL,
  request_count INTEGER DEFAULT 1,
  window_start TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Unique constraint for rate limiting buckets
  UNIQUE(identifier, endpoint, window_start)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_gdpr_consent_log_user_id ON gdpr_consent_log(user_id);
CREATE INDEX IF NOT EXISTS idx_gdpr_consent_log_type ON gdpr_consent_log(consent_type);
CREATE INDEX IF NOT EXISTS idx_gdpr_consent_log_created_at ON gdpr_consent_log(created_at);

CREATE INDEX IF NOT EXISTS idx_data_processing_log_user_id ON data_processing_log(user_id);
CREATE INDEX IF NOT EXISTS idx_data_processing_log_activity ON data_processing_log(activity_type);
CREATE INDEX IF NOT EXISTS idx_data_processing_log_created_at ON data_processing_log(created_at);

CREATE INDEX IF NOT EXISTS idx_data_deletion_requests_user_id ON data_deletion_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_data_deletion_requests_status ON data_deletion_requests(status);
CREATE INDEX IF NOT EXISTS idx_data_deletion_requests_created_at ON data_deletion_requests(created_at);

CREATE INDEX IF NOT EXISTS idx_rate_limits_identifier ON rate_limits(identifier);
CREATE INDEX IF NOT EXISTS idx_rate_limits_endpoint ON rate_limits(endpoint);
CREATE INDEX IF NOT EXISTS idx_rate_limits_window ON rate_limits(window_start);

-- Function to record GDPR consent
CREATE OR REPLACE FUNCTION record_gdpr_consent(
  user_id_param TEXT,
  consent_type_param VARCHAR(50),
  consent_given_param BOOLEAN,
  consent_version_param VARCHAR(10) DEFAULT '1.0',
  ip_address_param INET DEFAULT NULL,
  user_agent_param TEXT DEFAULT NULL,
  consent_method_param VARCHAR(50) DEFAULT 'explicit_request'
)
RETURNS INTEGER AS $$
DECLARE
  consent_id INTEGER;
BEGIN
  -- Insert consent log
  INSERT INTO gdpr_consent_log (
    user_id, consent_type, consent_given, consent_version,
    ip_address, user_agent, consent_method, created_at
  ) VALUES (
    user_id_param, consent_type_param, consent_given_param, consent_version_param,
    ip_address_param, user_agent_param, consent_method_param, NOW()
  ) RETURNING id INTO consent_id;
  
  -- Update user table based on consent type
  IF consent_type_param = 'privacy_policy' THEN
    UPDATE users 
    SET gdpr_consented_at = CASE WHEN consent_given_param THEN NOW() ELSE NULL END,
        privacy_policy_version = consent_version_param,
        updated_at = NOW()
    WHERE clerk_id = user_id_param;
  ELSIF consent_type_param = 'marketing' THEN
    UPDATE users 
    SET marketing_consent = consent_given_param,
        updated_at = NOW()
    WHERE clerk_id = user_id_param;
  ELSIF consent_type_param = 'data_processing' THEN
    UPDATE users 
    SET data_processing_consent = consent_given_param,
        updated_at = NOW()
    WHERE clerk_id = user_id_param;
  END IF;
  
  RETURN consent_id;
END;
$$ LANGUAGE plpgsql;

-- Function to log data processing activity
CREATE OR REPLACE FUNCTION log_data_processing(
  user_id_param TEXT,
  activity_type_param VARCHAR(100),
  activity_description_param TEXT DEFAULT NULL,
  data_subject_param TEXT DEFAULT NULL,
  legal_basis_param VARCHAR(50) DEFAULT 'consent',
  retention_period_param VARCHAR(50) DEFAULT '7_years',
  ip_address_param INET DEFAULT NULL,
  user_agent_param TEXT DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
  log_id INTEGER;
BEGIN
  INSERT INTO data_processing_log (
    user_id, activity_type, activity_description, data_subject,
    legal_basis, retention_period, ip_address, user_agent, created_at
  ) VALUES (
    user_id_param, activity_type_param, activity_description_param, data_subject_param,
    legal_basis_param, retention_period_param, ip_address_param, user_agent_param, NOW()
  ) RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$$ LANGUAGE plpgsql;

-- Function to check rate limit
CREATE OR REPLACE FUNCTION check_rate_limit(
  identifier_param TEXT,
  identifier_type_param VARCHAR(20),
  endpoint_param VARCHAR(200),
  max_requests INTEGER DEFAULT 100,
  window_minutes INTEGER DEFAULT 60
)
RETURNS BOOLEAN AS $$
DECLARE
  current_window TIMESTAMP;
  request_count INTEGER;
BEGIN
  -- Calculate current window start (truncate to window_minutes)
  current_window := DATE_TRUNC('hour', NOW()) + 
    (EXTRACT(MINUTE FROM NOW())::INTEGER / window_minutes) * 
    (window_minutes || ' minutes')::INTERVAL;
  
  -- Get current request count for this window
  SELECT COALESCE(SUM(request_count), 0) INTO request_count
  FROM rate_limits
  WHERE identifier = identifier_param
    AND identifier_type = identifier_type_param
    AND endpoint = endpoint_param
    AND window_start >= current_window
    AND window_start < current_window + (window_minutes || ' minutes')::INTERVAL;
  
  -- Check if under limit
  IF request_count < max_requests THEN
    -- Insert or update rate limit record
    INSERT INTO rate_limits (identifier, identifier_type, endpoint, request_count, window_start, created_at, updated_at)
    VALUES (identifier_param, identifier_type_param, endpoint_param, 1, current_window, NOW(), NOW())
    ON CONFLICT (identifier, endpoint, window_start)
    DO UPDATE SET 
      request_count = rate_limits.request_count + 1,
      updated_at = NOW();
    
    RETURN TRUE;
  ELSE
    RETURN FALSE;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to export user data (GDPR data portability)
CREATE OR REPLACE FUNCTION export_user_data(user_id_param TEXT)
RETURNS JSONB AS $$
DECLARE
  user_data JSONB;
  cargo_data JSONB;
  offers_data JSONB;
  feedback_data JSONB;
  consent_data JSONB;
BEGIN
  -- Get user profile data
  SELECT to_jsonb(u) INTO user_data
  FROM (
    SELECT clerk_id, name, email, phone, company, vat_number, role,
           verification_status, created_at, updated_at, gdpr_consented_at,
           privacy_policy_version, marketing_consent, data_processing_consent
    FROM users WHERE clerk_id = user_id_param
  ) u;
  
  -- Get cargo data
  SELECT COALESCE(jsonb_agg(to_jsonb(c)), '[]'::jsonb) INTO cargo_data
  FROM (
    SELECT id, title, type, weight, from_addr, to_addr, 
           price, status, created_ts, updated_ts
    FROM cargo WHERE provider_name = (
      SELECT name FROM users WHERE clerk_id = user_id_param
    )
  ) c;
  
  -- Get offer data
  SELECT COALESCE(jsonb_agg(to_jsonb(o)), '[]'::jsonb) INTO offers_data
  FROM (
    SELECT id, cargo_id, proposed_price, message, status, created_ts
    FROM offer_requests WHERE transporter_id = user_id_param
  ) o;
  
  -- Get feedback data
  SELECT COALESCE(jsonb_agg(to_jsonb(f)), '[]'::jsonb) INTO feedback_data
  FROM (
    SELECT id, suggestion_id, feedback_type, notes, created_at
    FROM agent_feedback WHERE user_id = user_id_param
  ) f;
  
  -- Get consent history
  SELECT COALESCE(jsonb_agg(to_jsonb(g)), '[]'::jsonb) INTO consent_data
  FROM (
    SELECT consent_type, consent_given, consent_version, 
           consent_method, created_at
    FROM gdpr_consent_log WHERE user_id = user_id_param
    ORDER BY created_at DESC
  ) g;
  
  -- Combine all data
  RETURN jsonb_build_object(
    'user_profile', user_data,
    'cargo_listings', cargo_data,
    'transport_offers', offers_data,
    'ai_feedback', feedback_data,
    'consent_history', consent_data,
    'export_date', NOW(),
    'format_version', '1.0'
  );
END;
$$ LANGUAGE plpgsql;

-- Create view for GDPR compliance dashboard
CREATE OR REPLACE VIEW v_gdpr_compliance_stats AS
SELECT 
  COUNT(*) as total_users,
  COUNT(*) FILTER (WHERE gdpr_consented_at IS NOT NULL) as users_with_consent,
  COUNT(*) FILTER (WHERE marketing_consent = TRUE) as marketing_consent_users,
  COUNT(*) FILTER (WHERE data_processing_consent = FALSE) as data_processing_opt_out,
  COUNT(DISTINCT ddr.user_id) as pending_deletion_requests,
  ROUND(
    (COUNT(*) FILTER (WHERE gdpr_consented_at IS NOT NULL) * 100.0) / COUNT(*), 2
  ) as consent_percentage
FROM users u
LEFT JOIN data_deletion_requests ddr ON ddr.user_id = u.clerk_id AND ddr.status = 'pending';

-- Clean up old rate limit records (keep last 24 hours)
CREATE OR REPLACE FUNCTION cleanup_old_rate_limits()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM rate_limits 
  WHERE created_at < NOW() - INTERVAL '24 hours';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Comments for maintenance
COMMENT ON TABLE gdpr_consent_log IS 'Log of all GDPR consent actions by users';
COMMENT ON TABLE data_processing_log IS 'Log of data processing activities for audit purposes';
COMMENT ON TABLE data_deletion_requests IS 'User requests for data deletion (Right to be Forgotten)';
COMMENT ON TABLE rate_limits IS 'Rate limiting tracking per user/IP and endpoint';
COMMENT ON FUNCTION record_gdpr_consent IS 'Record user consent for GDPR compliance';
COMMENT ON FUNCTION log_data_processing IS 'Log data processing activity for audit trail';
COMMENT ON FUNCTION check_rate_limit IS 'Check and enforce rate limits per user/IP';
COMMENT ON FUNCTION export_user_data IS 'Export all user data for GDPR data portability';
COMMENT ON VIEW v_gdpr_compliance_stats IS 'GDPR compliance statistics dashboard';

-- Update existing users to have default GDPR consent (migration only)
UPDATE users 
SET gdpr_consented_at = created_at,
    privacy_policy_version = '1.0',
    data_processing_consent = TRUE
WHERE gdpr_consented_at IS NULL;

-- Analyze tables for query planner optimization
ANALYZE gdpr_consent_log;
ANALYZE data_processing_log;
ANALYZE data_deletion_requests;
ANALYZE rate_limits;