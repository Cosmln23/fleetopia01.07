# FLEET SYSTEM - MIGRATION TO PRODUCTION

**Current Status**: Mock implementation complete  
**Target**: Real PostgreSQL backend + GPS integration

---

## 🎯 MIGRATION OVERVIEW

Transform the mock Fleet system into a production-ready backend with:
- Real PostgreSQL database operations
- API endpoints for CRUD operations  
- GPS tracking with external providers
- Integration with existing Railway database

---

## 📋 MIGRATION CHECKLIST

### 1. DATABASE SCHEMA UPDATE

**Target File**: `/database/schema.sql`

```sql
-- Add to existing PostgreSQL schema
CREATE TABLE IF NOT EXISTS vehicles (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  license_plate TEXT NOT NULL UNIQUE,
  vehicle_type TEXT NOT NULL,
  capacity REAL NOT NULL, -- tons
  fuel_consumption REAL NOT NULL, -- L/100km
  status TEXT NOT NULL DEFAULT 'INACTIVE', -- ACTIVE | INACTIVE
  city TEXT NOT NULL,
  country TEXT NOT NULL,
  lat REAL,
  lng REAL,
  driver_name TEXT,
  
  -- GPS Tracking fields
  gps_enabled BOOLEAN DEFAULT FALSE,
  tracker_id TEXT,
  tracker_token TEXT,
  last_seen_ts TIMESTAMP,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_vehicles_status ON vehicles(status);
CREATE INDEX IF NOT EXISTS idx_vehicles_gps ON vehicles(gps_enabled);
CREATE INDEX IF NOT EXISTS idx_vehicles_location ON vehicles(lat, lng);
```

**Action Required**:
```bash
# Run against Railway PostgreSQL
psql $DATABASE_URL -f database/schema_vehicles.sql
```

---

### 2. API ROUTES IMPLEMENTATION

**Create**: `/app/api/vehicles/route.ts`

```typescript
import { NextRequest } from 'next/server'
import { pool } from '@/lib/db'
import { vehicleCreateSchema } from '@/lib/zodSchemas'

export async function GET() {
  try {
    const result = await pool.query(`
      SELECT * FROM vehicles 
      ORDER BY created_at DESC
    `)
    return Response.json(result.rows)
  } catch (error) {
    return Response.json({ error: 'Database error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = vehicleCreateSchema.parse(body)
    
    // Geocode if city/country provided
    const coordinates = await geocodeAddress(`${validatedData.city}, ${validatedData.country}`)
    
    const result = await pool.query(`
      INSERT INTO vehicles (
        name, license_plate, vehicle_type, capacity, fuel_consumption,
        city, country, lat, lng, driver_name, gps_enabled, tracker_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `, [
      validatedData.name, validatedData.licensePlate, validatedData.vehicleType,
      validatedData.capacity, validatedData.fuelConsumption, validatedData.city,
      validatedData.country, coordinates.lat, coordinates.lng, validatedData.driverName,
      validatedData.gpsEnabled || false, validatedData.trackerId || null
    ])
    
    return Response.json(result.rows[0], { status: 201 })
  } catch (error) {
    return Response.json({ error: 'Validation failed' }, { status: 400 })
  }
}
```

**Create**: `/app/api/vehicles/[id]/route.ts`

```typescript
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  // GET single vehicle
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  // UPDATE vehicle (status, location, etc.)
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  // DELETE vehicle
}
```

---

### 3. ZODSCHEMA UPDATES

**Update**: `/lib/zodSchemas.ts`

```typescript
export const vehicleCreateSchema = z.object({
  name: z.string().min(1, 'Vehicle name required').max(100),
  licensePlate: z.string().min(3, 'License plate required').max(20),
  vehicleType: z.enum(['Truck', 'Van', 'Semi-Truck', 'Refrigerated Truck', 'Trailer']),
  capacity: z.number().min(0.5).max(50), // tons
  fuelConsumption: z.number().min(5).max(60), // L/100km
  city: z.string().min(2, 'City required'),
  country: z.string().min(2, 'Country required'),
  driverName: z.string().min(2, 'Driver name required'),
  
  // GPS tracking fields
  gpsEnabled: z.boolean().optional(),
  trackerId: z.string().optional(),
  trackerToken: z.string().optional()
})

export const vehicleUpdateSchema = z.object({
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  gpsEnabled: z.boolean().optional()
})
```

---

### 4. COMPONENT UPDATES

**Update**: `/components/AddFleetModal.tsx`

```typescript
// Replace mock API calls with real API calls
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  
  try {
    const response = await fetch('/api/vehicles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    })
    
    if (response.ok) {
      const newVehicle = await response.json()
      onVehicleAdded(newVehicle)
      onClose()
    }
  } catch (error) {
    console.error('Failed to create vehicle:', error)
  }
}
```

**Update**: `/app/fleet/page.tsx`

```typescript
// Replace mock API with real API calls
useEffect(() => {
  async function loadVehicles() {
    try {
      const response = await fetch('/api/vehicles')
      const vehicles = await response.json()
      setVehicles(vehicles)
    } catch (error) {
      console.error('Failed to load vehicles:', error)
    }
  }
  
  loadVehicles()
}, [])

const handleStatusToggle = async (vehicleId: string) => {
  try {
    const vehicle = vehicles.find(v => v.id === vehicleId)
    const newStatus = vehicle.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
    
    const response = await fetch(`/api/vehicles/${vehicleId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    })
    
    if (response.ok) {
      // Reload vehicles
      loadVehicles()
    }
  } catch (error) {
    console.error('Failed to update vehicle status:', error)
  }
}
```

---

### 5. GPS TRACKING IMPLEMENTATION

**Create**: `/scripts/gps-tracker.ts`

```typescript
import { pool } from '@/lib/db'

// GPS Provider integrations
const providers = {
  wialon: async (trackerId: string, token: string) => {
    const response = await fetch(`https://hst-api.wialon.com/wialon/ajax.html`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        svc: 'core/search_items',
        params: JSON.stringify({
          spec: { itemsType: 'avl_unit', propName: 'sys_id', propValueMask: trackerId }
        }),
        sid: token
      })
    })
    
    const data = await response.json()
    // Extract lat/lng from response
    return { lat: data.lat, lng: data.lng }
  }
}

export async function updateGpsPositions() {
  const result = await pool.query(`
    SELECT id, tracker_id, tracker_token 
    FROM vehicles 
    WHERE gps_enabled = TRUE AND tracker_id IS NOT NULL
  `)
  
  for (const vehicle of result.rows) {
    try {
      const position = await providers.wialon(vehicle.tracker_id, vehicle.tracker_token)
      
      await pool.query(`
        UPDATE vehicles 
        SET lat = $1, lng = $2, last_seen_ts = NOW()
        WHERE id = $3
      `, [position.lat, position.lng, vehicle.id])
      
    } catch (error) {
      console.error(`GPS update failed for vehicle ${vehicle.id}:`, error)
    }
  }
}
```

**Cron Job Setup**:
```bash
# Add to crontab (every 5 minutes)
*/5 * * * * node /path/to/scripts/gps-tracker.js
```

---

### 6. ENVIRONMENT VARIABLES

**Add to**: `.env.local`

```env
# Existing variables...

# GPS Tracking
GPS_WIALON_API_URL=https://hst-api.wialon.com
GPS_UPDATE_INTERVAL=300000  # 5 minutes in ms

# Vehicle Management
VEHICLE_MAX_CAPACITY=50     # tons
VEHICLE_MAX_DISTANCE=1000   # km for filtering
```

---

## 🚨 MIGRATION DEPENDENCIES

### Required Packages:
```bash
npm install @types/pg
# GPS providers may require additional packages
```

### External Dependencies:
- GPS tracking provider account (Wialon, GSMtasks, etc.)
- API tokens for GPS services
- Cron job setup on server

---

## 🧪 TESTING CHECKLIST

### 1. Database Operations:
- [ ] Create vehicle via API
- [ ] Update vehicle status  
- [ ] Delete vehicle
- [ ] GPS coordinate updates

### 2. Integration Testing:
- [ ] Fleet UI connects to real API
- [ ] Vehicle data flows to Agent system
- [ ] Status changes reflect in Agent filtering
- [ ] GPS updates appear on map

### 3. Performance Testing:
- [ ] API response times < 200ms
- [ ] Database queries optimized
- [ ] GPS updates don't block UI

---

## 📊 ROLLBACK PLAN

If migration fails:
1. Keep mock implementation as fallback
2. Environment variable to switch mock/real mode
3. Database rollback scripts ready
4. Component version control for quick revert

---

**ESTIMATED MIGRATION TIME**: 4-6 hours  
**COMPLEXITY**: Medium  
**RISK LEVEL**: Low (mock system provides fallback)