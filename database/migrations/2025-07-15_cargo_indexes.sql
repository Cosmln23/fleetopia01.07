-- CARGO PERFORMANCE INDEXES MIGRATION
-- Date: 15.07.2025
-- Purpose: Add performance indexes for cargo table queries

-- Performance indexes for cargo table
CREATE INDEX IF NOT EXISTS idx_cargo_status ON cargo(status);
CREATE INDEX IF NOT EXISTS idx_cargo_created_ts ON cargo(created_ts);
CREATE INDEX IF NOT EXISTS idx_cargo_from_country ON cargo(from_country);
CREATE INDEX IF NOT EXISTS idx_cargo_to_country ON cargo(to_country);
CREATE INDEX IF NOT EXISTS idx_cargo_weight ON cargo(weight);
CREATE INDEX IF NOT EXISTS idx_cargo_provider ON cargo(provider_name);

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_cargo_status_created ON cargo(status, created_ts DESC);
CREATE INDEX IF NOT EXISTS idx_cargo_country_status ON cargo(from_country, to_country, status);
CREATE INDEX IF NOT EXISTS idx_cargo_weight_status ON cargo(weight, status);

-- Indexes for offer_requests table performance
CREATE INDEX IF NOT EXISTS idx_offer_requests_cargo_id ON offer_requests(cargo_id);
CREATE INDEX IF NOT EXISTS idx_offer_requests_status ON offer_requests(status);
CREATE INDEX IF NOT EXISTS idx_offer_requests_created_ts ON offer_requests(created_ts);
CREATE INDEX IF NOT EXISTS idx_offer_requests_transporter ON offer_requests(transporter_id);

-- Composite index for offer queries
CREATE INDEX IF NOT EXISTS idx_offer_requests_cargo_status ON offer_requests(cargo_id, status);

-- Text search indexes for cargo search functionality
CREATE INDEX IF NOT EXISTS idx_cargo_title_text ON cargo USING gin(to_tsvector('english', title));
CREATE INDEX IF NOT EXISTS idx_cargo_from_addr_text ON cargo USING gin(to_tsvector('english', from_addr));
CREATE INDEX IF NOT EXISTS idx_cargo_to_addr_text ON cargo USING gin(to_tsvector('english', to_addr));

-- Partial indexes for active cargo (most common queries)
CREATE INDEX IF NOT EXISTS idx_cargo_active_status ON cargo(created_ts DESC) WHERE status IN ('NEW', 'OPEN');
CREATE INDEX IF NOT EXISTS idx_cargo_active_weight ON cargo(weight) WHERE status IN ('NEW', 'OPEN');

-- Geospatial indexes for location-based queries
CREATE INDEX IF NOT EXISTS idx_cargo_from_coords ON cargo(from_lat, from_lng) WHERE from_lat IS NOT NULL AND from_lng IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_cargo_to_coords ON cargo(to_lat, to_lng) WHERE to_lat IS NOT NULL AND to_lng IS NOT NULL;

-- Performance monitoring views
CREATE OR REPLACE VIEW v_cargo_performance_stats AS
SELECT 
    status,
    COUNT(*) as cargo_count,
    AVG(weight) as avg_weight,
    MIN(created_ts) as oldest_cargo,
    MAX(created_ts) as newest_cargo,
    COUNT(DISTINCT from_country) as countries_from,
    COUNT(DISTINCT to_country) as countries_to
FROM cargo 
GROUP BY status;

-- Offer performance view
CREATE OR REPLACE VIEW v_offer_performance_stats AS
SELECT 
    o.status,
    COUNT(*) as offer_count,
    AVG(o.proposed_price) as avg_price,
    COUNT(DISTINCT o.cargo_id) as unique_cargo,
    COUNT(DISTINCT o.transporter_id) as unique_transporters
FROM offer_requests o
GROUP BY o.status;

-- Popular routes view
CREATE OR REPLACE VIEW v_popular_routes AS
SELECT 
    from_country,
    to_country,
    COUNT(*) as cargo_count,
    AVG(weight) as avg_weight,
    AVG(price) as avg_price
FROM cargo 
WHERE status IN ('NEW', 'OPEN', 'COMPLETED')
GROUP BY from_country, to_country
HAVING COUNT(*) > 5
ORDER BY cargo_count DESC;

-- Comments for maintenance
COMMENT ON INDEX idx_cargo_status IS 'Primary index for cargo status filtering';
COMMENT ON INDEX idx_cargo_created_ts IS 'Temporal index for cargo sorting and date filtering';
COMMENT ON INDEX idx_cargo_status_created IS 'Composite index for status + date queries (most common)';
COMMENT ON VIEW v_cargo_performance_stats IS 'Performance monitoring view for cargo statistics';
COMMENT ON VIEW v_offer_performance_stats IS 'Performance monitoring view for offer statistics';
COMMENT ON VIEW v_popular_routes IS 'Analytics view for popular transport routes';

-- Analyze tables for query planner optimization
ANALYZE cargo;
ANALYZE offer_requests;