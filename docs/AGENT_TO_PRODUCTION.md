# DISPATCHER AI - MIGRATION TO PRODUCTION

**Current Status**: Mock L0-L4 implementation complete  
**Target**: Production AI system with real data processing

---

## 🎯 MIGRATION OVERVIEW

Transform the mock Dispatcher AI into a production system with:
- Real database operations for suggestions & feedback
- Integration with production Fleet system
- Integration with production Marketplace system
- Cron jobs for automated agent levels
- Learning system with feedback loops

---

## 📋 MIGRATION CHECKLIST

### 1. DATABASE SCHEMA FOR AGENT

**Target File**: `/database/schema.sql`

```sql
-- Agent Suggestions Table
CREATE TABLE IF NOT EXISTS agent_suggestions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  driver_id TEXT NOT NULL DEFAULT 'default_driver',
  cargo_id TEXT NOT NULL,
  vehicle_id TEXT NOT NULL,
  
  -- Cost & Profit Calculations
  calculated_cost REAL NOT NULL,
  suggested_quote REAL NOT NULL,
  profit_amount REAL NOT NULL,
  profit_percentage REAL NOT NULL,
  
  -- Scoring & Metadata
  score INTEGER NOT NULL,
  distance_km REAL NOT NULL,
  agent_level TEXT NOT NULL, -- L0, L1, L2, L3, L4
  status TEXT NOT NULL DEFAULT 'PENDING', -- PENDING, SENT, ACCEPTED, REJECTED
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  sent_at TIMESTAMP,
  responded_at TIMESTAMP,
  
  -- Foreign Keys
  FOREIGN KEY (cargo_id) REFERENCES cargo(id),
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id)
);

-- Agent Feedback Table
CREATE TABLE IF NOT EXISTS agent_feedback (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  suggestion_id TEXT NOT NULL,
  feedback_type TEXT NOT NULL, -- THUMBS_UP, THUMBS_DOWN, ACCEPTED, REJECTED
  profit_actual REAL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  
  FOREIGN KEY (suggestion_id) REFERENCES agent_suggestions(id)
);

-- Driver Preferences Table
CREATE TABLE IF NOT EXISTS driver_preferences (
  driver_id TEXT PRIMARY KEY DEFAULT 'default_driver',
  max_distance_km INTEGER DEFAULT 500,
  min_profit_percentage REAL DEFAULT 15.0,
  rate_per_km REAL DEFAULT 1.2,
  rate_per_hour REAL DEFAULT 25.0,
  fuel_price_per_liter REAL DEFAULT 1.45,
  insurance_cost_per_trip REAL DEFAULT 50.0,
  road_fees_per_trip REAL DEFAULT 30.0,
  blocked_cargo_types TEXT[], -- Array of blocked cargo types
  preferred_routes TEXT[], -- Array of preferred countries/regions
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Agent Performance Logs
CREATE TABLE IF NOT EXISTS agent_logs (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  level TEXT NOT NULL, -- L0, L1, L2, L3, L4
  action TEXT NOT NULL,
  payload JSONB,
  success BOOLEAN DEFAULT TRUE,
  error_message TEXT,
  execution_time_ms INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_suggestions_status ON agent_suggestions(status);
CREATE INDEX IF NOT EXISTS idx_suggestions_driver ON agent_suggestions(driver_id);
CREATE INDEX IF NOT EXISTS idx_suggestions_created ON agent_suggestions(created_at);
CREATE INDEX IF NOT EXISTS idx_feedback_suggestion ON agent_feedback(suggestion_id);
CREATE INDEX IF NOT EXISTS idx_logs_level ON agent_logs(level);
```

**Action Required**:
```bash
psql $DATABASE_URL -f database/schema_agent.sql
```

---

### 2. PRODUCTION AGENT CORE

**Create**: `/lib/agent-production.ts`

```typescript
import { pool } from '@/lib/db'
import { geocodeAddress } from '@/lib/geo'

export interface ProductionSuggestion {
  id: string
  cargoId: string
  vehicleId: string
  calculatedCost: number
  suggestedQuote: number
  profitAmount: number
  profitPercentage: number
  score: number
  distanceKm: number
  agentLevel: string
  status: string
  createdAt: Date
}

export class ProductionAgent {
  private driverId = 'default_driver'

  // L0: RADAR - Get active cargo offers
  async runL0Radar(): Promise<void> {
    const startTime = Date.now()
    
    try {
      // Get new cargo offers from marketplace
      const result = await pool.query(`
        SELECT * FROM cargo 
        WHERE status IN ('NEW', 'OPEN') 
        AND created_at > NOW() - INTERVAL '24 hours'
      `)
      
      await this.logActivity('L0', 'RADAR_SCAN', {
        offersFound: result.rows.length
      }, true, Date.now() - startTime)
      
    } catch (error) {
      await this.logActivity('L0', 'RADAR_SCAN', null, false, Date.now() - startTime, error.message)
      throw error
    }
  }

  // L1: CALCULATOR - Generate suggestions
  async runL1Calculator(): Promise<ProductionSuggestion[]> {
    const startTime = Date.now()
    
    try {
      // Get active vehicles
      const vehiclesResult = await pool.query(`
        SELECT * FROM vehicles WHERE status = 'ACTIVE'
      `)
      
      // Get available cargo
      const cargoResult = await pool.query(`
        SELECT * FROM cargo 
        WHERE status IN ('NEW', 'OPEN')
        AND id NOT IN (
          SELECT cargo_id FROM agent_suggestions 
          WHERE created_at > NOW() - INTERVAL '6 hours'
        )
      `)
      
      // Get driver preferences
      const prefsResult = await pool.query(`
        SELECT * FROM driver_preferences WHERE driver_id = $1
      `, [this.driverId])
      
      const preferences = prefsResult.rows[0] || this.getDefaultPreferences()
      const suggestions: ProductionSuggestion[] = []
      
      for (const vehicle of vehiclesResult.rows) {
        for (const cargo of cargoResult.rows) {
          // Filter by capacity
          if (cargo.weight > vehicle.capacity * 1000) continue
          
          // Calculate distance
          const distance = await this.calculateDistance(vehicle, cargo)
          if (distance > preferences.max_distance_km) continue
          
          // Calculate costs and profit
          const cost = await this.calculateCost(distance, cargo, vehicle, preferences)
          const quote = cost * (1 + preferences.min_profit_percentage / 100)
          const profit = quote - cost
          const profitPct = (profit / cost) * 100
          
          // Score the opportunity
          const score = this.calculateScore(profitPct, distance, cargo)
          
          // Create suggestion
          const suggestion = await this.createSuggestion({
            cargoId: cargo.id,
            vehicleId: vehicle.id,
            calculatedCost: cost,
            suggestedQuote: Math.round(quote),
            profitAmount: profit,
            profitPercentage: profitPct,
            score,
            distanceKm: distance,
            agentLevel: 'L1'
          })
          
          suggestions.push(suggestion)
        }
      }
      
      // Keep only top suggestions
      const topSuggestions = suggestions
        .sort((a, b) => b.score - a.score)
        .slice(0, 10)
      
      await this.logActivity('L1', 'CALCULATOR_RUN', {
        vehiclesActive: vehiclesResult.rows.length,
        cargoAvailable: cargoResult.rows.length,
        suggestionsGenerated: topSuggestions.length
      }, true, Date.now() - startTime)
      
      return topSuggestions
      
    } catch (error) {
      await this.logActivity('L1', 'CALCULATOR_RUN', null, false, Date.now() - startTime, error.message)
      throw error
    }
  }

  // L2: QUOTE BOT - Send quotes automatically
  async runL2QuoteBot(): Promise<void> {
    const startTime = Date.now()
    let sentCount = 0
    
    try {
      // Get pending suggestions with high scores
      const result = await pool.query(`
        SELECT s.*, c.title, c.price as original_price
        FROM agent_suggestions s
        JOIN cargo c ON c.id = s.cargo_id
        WHERE s.status = 'PENDING' 
        AND s.score >= 7
        AND s.created_at > NOW() - INTERVAL '1 hour'
        ORDER BY s.score DESC
        LIMIT 5
      `)
      
      for (const suggestion of result.rows) {
        // Send quote to marketplace (create offer_request)
        await pool.query(`
          INSERT INTO offer_requests (
            cargo_id, provider_name, proposed_price, message, status
          ) VALUES ($1, $2, $3, $4, 'PENDING')
        `, [
          suggestion.cargo_id,
          'FleetOpia AI Agent',
          suggestion.suggested_quote,
          `Automated quote generated by AI. Ready for immediate pickup with ${suggestion.vehicle_name}.`
        ])
        
        // Update suggestion status
        await pool.query(`
          UPDATE agent_suggestions 
          SET status = 'SENT', sent_at = NOW()
          WHERE id = $1
        `, [suggestion.id])
        
        sentCount++
      }
      
      await this.logActivity('L2', 'QUOTE_BOT_RUN', {
        quotesSent: sentCount
      }, true, Date.now() - startTime)
      
    } catch (error) {
      await this.logActivity('L2', 'QUOTE_BOT_RUN', null, false, Date.now() - startTime, error.message)
      throw error
    }
  }

  // L3: AUTO-TUNE - Optimize margins
  async runL3AutoTune(): Promise<void> {
    const startTime = Date.now()
    
    try {
      // Get recent suggestions performance
      const result = await pool.query(`
        SELECT 
          AVG(profit_percentage) as avg_profit,
          COUNT(*) as total_suggestions,
          COUNT(CASE WHEN status = 'ACCEPTED' THEN 1 END) as accepted_count
        FROM agent_suggestions 
        WHERE created_at > NOW() - INTERVAL '7 days'
      `)
      
      const stats = result.rows[0]
      const acceptanceRate = stats.total_suggestions > 0 ? 
        stats.accepted_count / stats.total_suggestions : 0
      
      // Get current preferences
      const prefsResult = await pool.query(`
        SELECT * FROM driver_preferences WHERE driver_id = $1
      `, [this.driverId])
      
      let currentMargin = prefsResult.rows[0]?.min_profit_percentage || 15
      
      // Adjust margin based on performance
      if (acceptanceRate < 0.2 && stats.avg_profit > 20) {
        // Lower margin to increase acceptance
        currentMargin = Math.max(8, currentMargin - 2)
      } else if (acceptanceRate > 0.8 && stats.avg_profit < 30) {
        // Increase margin to maximize profit
        currentMargin = Math.min(35, currentMargin + 2)
      }
      
      // Update preferences
      await pool.query(`
        INSERT INTO driver_preferences (driver_id, min_profit_percentage, updated_at)
        VALUES ($1, $2, NOW())
        ON CONFLICT (driver_id) 
        DO UPDATE SET min_profit_percentage = $2, updated_at = NOW()
      `, [this.driverId, currentMargin])
      
      await this.logActivity('L3', 'AUTO_TUNE_RUN', {
        oldMargin: prefsResult.rows[0]?.min_profit_percentage || 15,
        newMargin: currentMargin,
        acceptanceRate,
        avgProfit: stats.avg_profit
      }, true, Date.now() - startTime)
      
    } catch (error) {
      await this.logActivity('L3', 'AUTO_TUNE_RUN', null, false, Date.now() - startTime, error.message)
      throw error
    }
  }

  // Helper methods
  private async calculateDistance(vehicle: any, cargo: any): Promise<number> {
    // Use Haversine formula or geocoding service
    const R = 6371 // Earth's radius in km
    const dLat = (cargo.from_lat - vehicle.lat) * Math.PI / 180
    const dLng = (cargo.from_lng - vehicle.lng) * Math.PI / 180
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(vehicle.lat * Math.PI / 180) * Math.cos(cargo.from_lat * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c
  }

  private async calculateCost(distance: number, cargo: any, vehicle: any, prefs: any): Promise<number> {
    const totalDistance = distance * 2 // Round trip
    const estimatedHours = totalDistance / 60 + 8 // Average speed + loading time
    
    const fuelCost = (totalDistance / 100) * vehicle.fuel_consumption * prefs.fuel_price_per_liter
    const driverCost = estimatedHours * prefs.rate_per_hour
    const distanceCost = totalDistance * prefs.rate_per_km
    
    return fuelCost + driverCost + distanceCost + prefs.insurance_cost_per_trip + prefs.road_fees_per_trip
  }

  private calculateScore(profitPct: number, distance: number, cargo: any): number {
    let score = 0
    
    // Profit scoring
    if (profitPct >= 25) score += 5
    else if (profitPct >= 20) score += 4
    else if (profitPct >= 15) score += 3
    else if (profitPct >= 10) score += 2
    else if (profitPct >= 5) score += 1
    
    // Distance scoring
    if (distance <= 100) score += 3
    else if (distance <= 300) score += 2
    else if (distance <= 500) score += 1
    
    // Urgency scoring
    if (cargo.urgency === 'HIGH') score += 3
    else if (cargo.urgency === 'MEDIUM') score += 2
    else if (cargo.urgency === 'LOW') score += 1
    
    return Math.max(0, score)
  }

  private async createSuggestion(data: Partial<ProductionSuggestion>): Promise<ProductionSuggestion> {
    const result = await pool.query(`
      INSERT INTO agent_suggestions (
        driver_id, cargo_id, vehicle_id, calculated_cost, suggested_quote,
        profit_amount, profit_percentage, score, distance_km, agent_level
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `, [
      this.driverId, data.cargoId, data.vehicleId, data.calculatedCost,
      data.suggestedQuote, data.profitAmount, data.profitPercentage,
      data.score, data.distanceKm, data.agentLevel
    ])
    
    return result.rows[0]
  }

  private async logActivity(level: string, action: string, payload: any, success: boolean, executionTime: number, errorMessage?: string): Promise<void> {
    await pool.query(`
      INSERT INTO agent_logs (level, action, payload, success, error_message, execution_time_ms)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [level, action, JSON.stringify(payload), success, errorMessage || null, executionTime])
  }

  private getDefaultPreferences() {
    return {
      max_distance_km: 500,
      min_profit_percentage: 15.0,
      rate_per_km: 1.2,
      rate_per_hour: 25.0,
      fuel_price_per_liter: 1.45,
      insurance_cost_per_trip: 50.0,
      road_fees_per_trip: 30.0,
      blocked_cargo_types: [],
      preferred_routes: []
    }
  }
}

export const productionAgent = new ProductionAgent()
```

---

### 3. API ROUTES FOR AGENT

**Create**: `/app/api/agent/suggestions/route.ts`

```typescript
import { NextRequest } from 'next/server'
import { pool } from '@/lib/db'

export async function GET() {
  try {
    const result = await pool.query(`
      SELECT 
        s.*,
        c.title as cargo_title,
        c.weight as cargo_weight,
        c.from_addr as pickup_address,
        c.to_addr as delivery_address,
        v.name as vehicle_name,
        v.license_plate as vehicle_license
      FROM agent_suggestions s
      JOIN cargo c ON c.id = s.cargo_id
      JOIN vehicles v ON v.id = s.vehicle_id
      WHERE s.created_at > NOW() - INTERVAL '24 hours'
      ORDER BY s.score DESC, s.created_at DESC
      LIMIT 20
    `)
    
    return Response.json(result.rows)
  } catch (error) {
    return Response.json({ error: 'Database error' }, { status: 500 })
  }
}
```

**Create**: `/app/api/agent/stats/route.ts`

```typescript
export async function GET() {
  try {
    const result = await pool.query(`
      SELECT 
        COUNT(*) as total_suggestions,
        COUNT(CASE WHEN status = 'SENT' THEN 1 END) as quotes_sent,
        COUNT(CASE WHEN status = 'ACCEPTED' THEN 1 END) as quotes_accepted,
        AVG(profit_percentage) as avg_profit,
        (SELECT COUNT(*) FROM vehicles WHERE status = 'ACTIVE') as active_vehicles
      FROM agent_suggestions 
      WHERE created_at > NOW() - INTERVAL '7 days'
    `)
    
    const stats = result.rows[0]
    const acceptanceRate = stats.quotes_sent > 0 ? 
      (stats.quotes_accepted / stats.quotes_sent * 100) : 0
    
    return Response.json({
      totalSuggestions: parseInt(stats.total_suggestions),
      quotesSent: parseInt(stats.quotes_sent),
      quotesAccepted: parseInt(stats.quotes_accepted),
      acceptanceRate: Math.round(acceptanceRate),
      avgProfit: parseFloat(stats.avg_profit || 0).toFixed(1),
      activeVehicles: parseInt(stats.active_vehicles)
    })
  } catch (error) {
    return Response.json({ error: 'Database error' }, { status: 500 })
  }
}
```

---

### 4. CRON JOBS SETUP

**Create**: `/scripts/agent-cron.ts`

```typescript
import { productionAgent } from '@/lib/agent-production'

export async function runAgentLevel(level: string) {
  console.log(`🤖 Running Agent ${level}...`)
  
  try {
    switch (level) {
      case 'L0':
        await productionAgent.runL0Radar()
        break
      case 'L1':
        await productionAgent.runL1Calculator()
        break
      case 'L2':
        await productionAgent.runL2QuoteBot()
        break
      case 'L3':
        await productionAgent.runL3AutoTune()
        break
      default:
        throw new Error(`Unknown agent level: ${level}`)
    }
    
    console.log(`✅ Agent ${level} completed successfully`)
  } catch (error) {
    console.error(`❌ Agent ${level} failed:`, error)
  }
}

// Run all active levels
export async function runActiveAgentLevels() {
  // Check which levels are enabled in database/config
  // Run them in sequence: L0 → L1 → L2 → L3
  
  await runAgentLevel('L0')
  await runAgentLevel('L1')
  await runAgentLevel('L2')
  await runAgentLevel('L3')
}
```

**Cron Setup**:
```bash
# Every 5 minutes - L0 Radar
*/5 * * * * node /path/to/scripts/agent-l0.js

# Every 10 minutes - L1 Calculator  
*/10 * * * * node /path/to/scripts/agent-l1.js

# Every 30 minutes - L2 Quote Bot
*/30 * * * * node /path/to/scripts/agent-l2.js

# Daily at 2 AM - L3 Auto-Tune
0 2 * * * node /path/to/scripts/agent-l3.js
```

---

### 5. UI COMPONENT UPDATES

**Update**: `/app/dispatcher/page.tsx`

```typescript
// Replace mock API calls with real API calls
useEffect(() => {
  async function loadSuggestions() {
    try {
      const response = await fetch('/api/agent/suggestions')
      const suggestions = await response.json()
      setSuggestions(suggestions)
    } catch (error) {
      console.error('Failed to load suggestions:', error)
    }
  }
  
  async function loadStats() {
    try {
      const response = await fetch('/api/agent/stats')
      const stats = await response.json()
      setAgentStats(stats)
    } catch (error) {
      console.error('Failed to load agent stats:', error)
    }
  }
  
  if (isAgentActive && levelSettings.L1) {
    loadSuggestions()
    loadStats()
  }
}, [isAgentActive, levelSettings])
```

---

## 🚨 MIGRATION DEPENDENCIES

### Database Requirements:
- All Fleet tables must exist
- All Marketplace tables must exist
- Agent tables created
- Proper foreign key relationships

### API Dependencies:
- Production Fleet API working
- Production Marketplace API working
- Geocoding service functional

### Infrastructure:
- Cron job capability on server
- Background job processing
- Error monitoring & logging

---

**ESTIMATED MIGRATION TIME**: 6-8 hours  
**COMPLEXITY**: High  
**RISK LEVEL**: Medium (complex integration points)