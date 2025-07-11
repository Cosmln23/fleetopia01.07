-- AI FEEDBACK SYSTEM MIGRATION
-- Date: 11.07.2025
-- Purpose: Add AI feedback system with thumbs up/down for agent suggestions

-- Create agent_feedback table
CREATE TABLE IF NOT EXISTS agent_feedback (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  suggestion_id TEXT,
  feedback_type VARCHAR(10) NOT NULL CHECK (feedback_type IN ('UP', 'DOWN')),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Foreign key to users table
  CONSTRAINT fk_agent_feedback_user 
    FOREIGN KEY (user_id) 
    REFERENCES users(clerk_id) 
    ON DELETE CASCADE,
    
  -- Ensure one feedback per user per suggestion
  UNIQUE(user_id, suggestion_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_agent_feedback_user_id ON agent_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_feedback_suggestion_id ON agent_feedback(suggestion_id);
CREATE INDEX IF NOT EXISTS idx_agent_feedback_type ON agent_feedback(feedback_type);
CREATE INDEX IF NOT EXISTS idx_agent_feedback_created_at ON agent_feedback(created_at);

-- Create agent_suggestions table if it doesn't exist (for AI dispatcher)
CREATE TABLE IF NOT EXISTS agent_suggestions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  cargo_id TEXT,
  suggestion_type VARCHAR(50) NOT NULL,
  suggestion_data JSONB NOT NULL,
  confidence_score REAL DEFAULT 0,
  status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACCEPTED', 'REJECTED', 'EXPIRED')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,
  
  -- Foreign key to users table
  CONSTRAINT fk_agent_suggestions_user 
    FOREIGN KEY (user_id) 
    REFERENCES users(clerk_id) 
    ON DELETE CASCADE
);

-- Create indexes for agent_suggestions
CREATE INDEX IF NOT EXISTS idx_agent_suggestions_user_id ON agent_suggestions(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_suggestions_cargo_id ON agent_suggestions(cargo_id);
CREATE INDEX IF NOT EXISTS idx_agent_suggestions_status ON agent_suggestions(status);
CREATE INDEX IF NOT EXISTS idx_agent_suggestions_created_at ON agent_suggestions(created_at);
CREATE INDEX IF NOT EXISTS idx_agent_suggestions_type ON agent_suggestions(suggestion_type);

-- Create function to get feedback statistics
CREATE OR REPLACE FUNCTION get_feedback_stats(suggestion_id_param TEXT DEFAULT NULL)
RETURNS TABLE(
  total_feedback BIGINT,
  positive_feedback BIGINT,
  negative_feedback BIGINT,
  positive_percentage NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_feedback,
    COUNT(*) FILTER (WHERE feedback_type = 'UP') as positive_feedback,
    COUNT(*) FILTER (WHERE feedback_type = 'DOWN') as negative_feedback,
    CASE 
      WHEN COUNT(*) > 0 
      THEN ROUND((COUNT(*) FILTER (WHERE feedback_type = 'UP') * 100.0) / COUNT(*), 2)
      ELSE 0 
    END as positive_percentage
  FROM agent_feedback
  WHERE (suggestion_id_param IS NULL OR suggestion_id = suggestion_id_param);
END;
$$ LANGUAGE plpgsql;

-- Create function to get user feedback history
CREATE OR REPLACE FUNCTION get_user_feedback_history(user_id_param TEXT, limit_param INTEGER DEFAULT 50)
RETURNS TABLE(
  id INTEGER,
  suggestion_id TEXT,
  feedback_type VARCHAR(10),
  notes TEXT,
  created_at TIMESTAMP,
  suggestion_data JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    af.id,
    af.suggestion_id,
    af.feedback_type,
    af.notes,
    af.created_at,
    COALESCE(ags.suggestion_data, '{}'::jsonb) as suggestion_data
  FROM agent_feedback af
  LEFT JOIN agent_suggestions ags ON ags.id = af.suggestion_id
  WHERE af.user_id = user_id_param
  ORDER BY af.created_at DESC
  LIMIT limit_param;
END;
$$ LANGUAGE plpgsql;

-- Create view for feedback analytics
CREATE OR REPLACE VIEW v_feedback_analytics AS
SELECT 
  DATE_TRUNC('day', created_at) as feedback_date,
  feedback_type,
  COUNT(*) as feedback_count,
  COUNT(DISTINCT user_id) as unique_users
FROM agent_feedback
GROUP BY DATE_TRUNC('day', created_at), feedback_type
ORDER BY feedback_date DESC;

-- Create view for suggestion performance
CREATE OR REPLACE VIEW v_suggestion_performance AS
SELECT 
  ags.suggestion_type,
  COUNT(ags.id) as total_suggestions,
  COUNT(af.id) as suggestions_with_feedback,
  COUNT(af.id) FILTER (WHERE af.feedback_type = 'UP') as positive_feedback,
  COUNT(af.id) FILTER (WHERE af.feedback_type = 'DOWN') as negative_feedback,
  CASE 
    WHEN COUNT(af.id) > 0 
    THEN ROUND((COUNT(af.id) FILTER (WHERE af.feedback_type = 'UP') * 100.0) / COUNT(af.id), 2)
    ELSE NULL 
  END as positive_percentage,
  AVG(ags.confidence_score) as avg_confidence_score
FROM agent_suggestions ags
LEFT JOIN agent_feedback af ON af.suggestion_id = ags.id
GROUP BY ags.suggestion_type
ORDER BY positive_percentage DESC NULLS LAST;

-- Function to record feedback
CREATE OR REPLACE FUNCTION record_agent_feedback(
  user_id_param TEXT,
  suggestion_id_param TEXT,
  feedback_type_param VARCHAR(10),
  notes_param TEXT DEFAULT NULL
)
RETURNS TABLE(
  feedback_id INTEGER,
  created_at TIMESTAMP,
  updated BOOLEAN
) AS $$
DECLARE
  feedback_record_id INTEGER;
  is_update BOOLEAN := FALSE;
BEGIN
  -- Insert or update feedback
  INSERT INTO agent_feedback (user_id, suggestion_id, feedback_type, notes, created_at, updated_at)
  VALUES (user_id_param, suggestion_id_param, feedback_type_param, notes_param, NOW(), NOW())
  ON CONFLICT (user_id, suggestion_id)
  DO UPDATE SET 
    feedback_type = EXCLUDED.feedback_type,
    notes = EXCLUDED.notes,
    updated_at = NOW()
  RETURNING id, agent_feedback.created_at, (xmax != 0) INTO feedback_record_id, created_at, is_update;
  
  RETURN QUERY SELECT feedback_record_id, created_at, is_update;
END;
$$ LANGUAGE plpgsql;

-- Comments for maintenance
COMMENT ON TABLE agent_feedback IS 'User feedback on AI agent suggestions with thumbs up/down';
COMMENT ON TABLE agent_suggestions IS 'AI agent suggestions for users with tracking and performance data';
COMMENT ON FUNCTION get_feedback_stats IS 'Get feedback statistics for all or specific suggestion';
COMMENT ON FUNCTION get_user_feedback_history IS 'Get user feedback history with suggestion context';
COMMENT ON FUNCTION record_agent_feedback IS 'Record or update user feedback on agent suggestions';
COMMENT ON VIEW v_feedback_analytics IS 'Daily feedback analytics for monitoring AI performance';
COMMENT ON VIEW v_suggestion_performance IS 'Performance metrics for different suggestion types';

-- Analyze tables for query planner optimization
ANALYZE agent_feedback;
ANALYZE agent_suggestions;