# PRODUCTION DEPLOYMENT CHECKLIST

**Target Environment**: Railway + PostgreSQL  
**Deployment Type**: Full Stack Next.js + Background Jobs

---

## 🎯 PRE-DEPLOYMENT CHECKLIST

### 1. ENVIRONMENT SETUP

**Environment Variables**:
```env
# Existing variables
DATABASE_URL=postgresql://...
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=...

# New Fleet Management Variables
VEHICLE_MAX_CAPACITY=50
VEHICLE_MAX_DISTANCE=1000
GPS_UPDATE_INTERVAL=300000

# Agent System Variables
AGENT_POLLING_INTERVAL=300000
AGENT_MAX_SUGGESTIONS=10
AGENT_MIN_SCORE_THRESHOLD=5
AGENT_DEFAULT_MARGIN=15

# GPS Tracking Variables (Optional)
GPS_WIALON_API_URL=https://hst-api.wialon.com
GPS_PROVIDER=wialon
GPS_FALLBACK_TIMEOUT=30000

# Performance Settings
MAX_CONCURRENT_CALCULATIONS=5
SUGGESTION_CACHE_TTL=3600
LOG_RETENTION_DAYS=30
```

**Required Secrets**:
- [ ] Database connection string verified
- [ ] Google Maps API key has Geocoding + Static Maps enabled
- [ ] GPS provider API credentials (if using GPS tracking)

---

### 2. DATABASE MIGRATION

**Schema Deployment Order**:
```bash
# 1. Fleet Management Tables
psql $DATABASE_URL -f database/schema_vehicles.sql

# 2. Agent System Tables  
psql $DATABASE_URL -f database/schema_agent.sql

# 3. Integration Updates
psql $DATABASE_URL -f database/schema_integrations.sql

# 4. Indexes and Performance
psql $DATABASE_URL -f database/indexes.sql

# 5. Initial Data (Optional)
psql $DATABASE_URL -f database/seed_agent_preferences.sql
```

**Migration Verification**:
```sql
-- Verify all tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'vehicles', 'agent_suggestions', 'agent_feedback', 
  'driver_preferences', 'agent_logs', 'agent_offer_cache'
);

-- Verify foreign keys
SELECT constraint_name, table_name, column_name 
FROM information_schema.key_column_usage 
WHERE constraint_schema = 'public';

-- Test basic operations
INSERT INTO driver_preferences (driver_id) VALUES ('test_driver');
DELETE FROM driver_preferences WHERE driver_id = 'test_driver';
```

---

### 3. CODE DEPLOYMENT

**File Deployment Checklist**:
- [ ] `/lib/fleet-mock-data.ts` → Keep for fallback
- [ ] `/lib/agent-mock-data.ts` → Keep for fallback  
- [ ] `/lib/agent-production.ts` → Deploy new production system
- [ ] All API routes created and tested
- [ ] Environment variable switches implemented
- [ ] Error handling and logging added

**Component Updates**:
- [ ] Fleet page connects to production API
- [ ] Dispatcher page connects to production API
- [ ] Marketplace integration working
- [ ] Error boundaries implemented
- [ ] Loading states added

---

### 4. BACKGROUND JOBS SETUP

**Cron Jobs Configuration**:
```bash
# Agent L0 - Radar (every 5 minutes)
*/5 * * * * cd /app && node scripts/agent-l0.js >> /var/log/agent-l0.log 2>&1

# Agent L1 - Calculator (every 10 minutes)  
*/10 * * * * cd /app && node scripts/agent-l1.js >> /var/log/agent-l1.log 2>&1

# Agent L2 - Quote Bot (every 30 minutes)
*/30 * * * * cd /app && node scripts/agent-l2.js >> /var/log/agent-l2.log 2>&1

# Agent L3 - Auto-Tune (daily at 2 AM)
0 2 * * * cd /app && node scripts/agent-l3.js >> /var/log/agent-l3.log 2>&1

# GPS Updates (every 5 minutes, if enabled)
*/5 * * * * cd /app && node scripts/gps-tracker.js >> /var/log/gps-tracker.log 2>&1

# Cleanup old logs (daily at 3 AM)
0 3 * * * cd /app && node scripts/cleanup-logs.js >> /var/log/cleanup.log 2>&1
```

**Job Scripts**:
```javascript
// scripts/agent-l0.js
const { productionAgent } = require('../lib/agent-production')
productionAgent.runL0Radar()
  .then(() => console.log('L0 completed'))
  .catch(err => console.error('L0 failed:', err))
```

---

### 5. MONITORING & LOGGING

**Logging Setup**:
```typescript
// lib/logger.ts
export class AgentLogger {
  static info(level: string, message: string, data?: any) {
    console.log(`[${new Date().toISOString()}] ${level}: ${message}`, data)
  }
  
  static error(level: string, message: string, error: Error, data?: any) {
    console.error(`[${new Date().toISOString()}] ${level} ERROR: ${message}`, {
      error: error.message,
      stack: error.stack,
      data
    })
  }
}
```

**Health Check Endpoints**:
```typescript
// app/api/health/fleet/route.ts
export async function GET() {
  try {
    const result = await pool.query('SELECT COUNT(*) FROM vehicles')
    return Response.json({ 
      status: 'healthy', 
      vehicles: result.rows[0].count,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return Response.json({ status: 'unhealthy', error: error.message }, { status: 500 })
  }
}

// app/api/health/agent/route.ts  
export async function GET() {
  try {
    const stats = await pool.query(`
      SELECT 
        COUNT(*) as total_suggestions,
        MAX(created_at) as last_suggestion,
        COUNT(CASE WHEN created_at > NOW() - INTERVAL '1 hour' THEN 1 END) as recent_suggestions
      FROM agent_suggestions
    `)
    
    return Response.json({ 
      status: 'healthy',
      ...stats.rows[0],
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return Response.json({ status: 'unhealthy', error: error.message }, { status: 500 })
  }
}
```

---

### 6. PERFORMANCE OPTIMIZATION

**Database Optimization**:
```sql
-- Analyze query performance
EXPLAIN ANALYZE SELECT * FROM agent_suggestions 
WHERE created_at > NOW() - INTERVAL '24 hours' 
ORDER BY score DESC;

-- Create additional indexes if needed
CREATE INDEX CONCURRENTLY idx_suggestions_score_date 
ON agent_suggestions(score DESC, created_at DESC);

-- Update table statistics
ANALYZE vehicles;
ANALYZE agent_suggestions;
ANALYZE cargo;
```

**Caching Strategy**:
```typescript
// lib/cache.ts
export class AgentCache {
  private static cache = new Map()
  
  static set(key: string, value: any, ttl: number = 3600) {
    this.cache.set(key, {
      value,
      expires: Date.now() + (ttl * 1000)
    })
  }
  
  static get(key: string) {
    const item = this.cache.get(key)
    if (!item || Date.now() > item.expires) {
      this.cache.delete(key)
      return null
    }
    return item.value
  }
}
```

---

### 7. ROLLBACK STRATEGY

**Feature Flags**:
```typescript
// lib/feature-flags.ts
export const featureFlags = {
  PRODUCTION_FLEET: process.env.ENABLE_PRODUCTION_FLEET === 'true',
  PRODUCTION_AGENT: process.env.ENABLE_PRODUCTION_AGENT === 'true',
  GPS_TRACKING: process.env.ENABLE_GPS_TRACKING === 'true',
  AUTO_QUOTES: process.env.ENABLE_AUTO_QUOTES === 'true'
}

// Usage in components
if (featureFlags.PRODUCTION_FLEET) {
  // Use production API
} else {
  // Use mock data
}
```

**Deployment Phases**:
1. **Phase 1**: Deploy with all flags OFF (mock mode)
2. **Phase 2**: Enable PRODUCTION_FLEET only
3. **Phase 3**: Enable PRODUCTION_AGENT (L0, L1 only)
4. **Phase 4**: Enable AUTO_QUOTES (L2, L3)
5. **Phase 5**: Enable GPS_TRACKING (optional)

---

### 8. TESTING IN PRODUCTION

**Smoke Tests**:
```bash
# Test API endpoints
curl https://your-app.com/api/health/fleet
curl https://your-app.com/api/health/agent
curl https://your-app.com/api/vehicles

# Test agent functionality
curl -X POST https://your-app.com/api/agent/test-l0
curl -X POST https://your-app.com/api/agent/test-l1

# Test UI pages
curl https://your-app.com/fleet
curl https://your-app.com/dispatcher
```

**User Acceptance Tests**:
- [ ] Fleet management - Add vehicle works
- [ ] Fleet management - Status toggle works
- [ ] Fleet management - GPS tracking works (if enabled)
- [ ] Dispatcher - Agent toggle works
- [ ] Dispatcher - Level activation works
- [ ] Dispatcher - Suggestions appear
- [ ] Dispatcher - Send quote works
- [ ] Marketplace - Agent quotes appear
- [ ] Marketplace - Quote acceptance works

---

### 9. POST-DEPLOYMENT MONITORING

**Key Metrics to Monitor**:
```sql
-- Agent Performance
SELECT 
  DATE_TRUNC('hour', created_at) as hour,
  COUNT(*) as suggestions_generated,
  AVG(score) as avg_score,
  COUNT(CASE WHEN status = 'ACCEPTED' THEN 1 END) as accepted_count
FROM agent_suggestions 
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY DATE_TRUNC('hour', created_at)
ORDER BY hour;

-- System Health
SELECT 
  level,
  COUNT(*) as executions,
  AVG(execution_time_ms) as avg_time,
  COUNT(CASE WHEN success = false THEN 1 END) as failures
FROM agent_logs 
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY level;
```

**Alert Thresholds**:
- Agent execution failures > 5% in 1 hour
- Database response time > 1 second
- No suggestions generated in 2 hours
- GPS tracking failures > 20%

---

### 10. DOCUMENTATION UPDATES

**Update Documentation**:
- [ ] API documentation with new endpoints
- [ ] User manual for Fleet management
- [ ] User manual for Dispatcher AI
- [ ] Troubleshooting guide
- [ ] Performance tuning guide

**Team Handover**:
- [ ] Production access credentials
- [ ] Monitoring dashboard access
- [ ] Log file locations
- [ ] Escalation procedures
- [ ] Rollback procedures

---

## 🚨 GO/NO-GO CRITERIA

**Prerequisites for Deployment**:
- [ ] All database migrations successful
- [ ] All tests passing in staging
- [ ] Feature flags implemented
- [ ] Monitoring setup complete
- [ ] Rollback plan tested
- [ ] Team trained on new system

**Success Criteria**:
- [ ] All APIs responding < 500ms
- [ ] Agent generates suggestions within 10 minutes
- [ ] No database errors in first hour
- [ ] UI fully functional
- [ ] Background jobs running successfully

---

**DEPLOYMENT TIMELINE**: 4-6 hours total  
**MAINTENANCE WINDOW**: 2 hours recommended  
**ROLLBACK TIME**: 30 minutes maximum