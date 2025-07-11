# SPRINT 2: MARKETPLACE & FLEET REAL IMPLEMENTATION

**Data Start**: 11.07.2025  
**Durată**: 20h (≈ 3-4 zile efective)  
**Obiectiv**: Scoatem mock-urile din joc - cargo din DB, vehicule în Postgres, GPS real

---

## 🎯 OBIECTIVE SPRINT 2

### **Primary Goals**
1. **Marketplace Real Data** - Eliminare mock-uri, cargo din database
2. **Fleet Management** - Sistem complet vehicule + GPS tracking
3. **API Integration** - Endpoints reale pentru cargo, oferte, vehicule
4. **Feature Toggle** - Switch între mock/real data pentru staging/production

### **Success Metrics**
- ✅ User poate posta cargo → apare în listă
- ✅ Transportator poate trimite ofertă → se salvează în DB
- ✅ Fleet management complet funcțional
- ✅ GPS tracking real-time
- ✅ 0 erori 5xx pe /api/cargo după deploy

---

## 📋 TASK SHEET DETALIAT

### **1. Branch Setup** ✅
- **Command**: `git checkout -b feature/marketplace-fleet`
- **Status**: COMPLETED

### **2. Database Analysis** ✅
- **Schema cargo existing**: COMPLET cu toate câmpurile necesare
- **Origin**: `from_addr`, `from_country`, `from_city`, `from_lat`, `from_lng`
- **Destination**: `to_addr`, `to_country`, `to_city`, `to_lat`, `to_lng`
- **Weight**: `weight` (REAL)
- **Price**: `price` (REAL, nullable = negotiable)
- **Status**: `status` (NEW/OPEN/TAKEN/IN_PROGRESS/COMPLETED)
- **Timestamps**: `created_ts`, `updated_ts`

### **3. Database Migrations** (0.5h)
- **File**: `database/migrations/2025-07-15_cargo_indexes.sql`
- **Content**: Performance indexes pentru cargo table
- **Indexes**: `status`, `created_ts`, `from_country`, `to_country`

### **4. Service Layer** (2h)
- **File**: `lib/marketplace.ts`
- **Functions**:
  - `listCargo()` - Lista cargo cu filtrare și paginare
  - `getCargoDetails(id)` - Detalii cargo individual
  - `createCargo()` - Postare cargo nou
  - `submitOffer()` - Trimitere ofertă transportator
- **Feature Flag**: `USE_MOCK_MARKETPLACE` toggle

### **5. API Routes** (4h)
- **GET /api/cargo** - Lista cargo cu filtrare și paginare
- **GET /api/cargo/[id]** - Detalii cargo individual
- **POST /api/cargo** - Post marfă nouă
- **POST /api/cargo/[id]/offer** - Trimite ofertă transportator
- **Middleware**: Auth, validation, rate limiting

### **6. Fleet Migration & API** (6h)
- **Migration**: `database/migrations/2025-07-15_fleet.sql`
- **Tables**: `vehicles`, `gps_devices`
- **API Routes**:
  - `GET/POST /api/vehicles` - Lista și creare vehicule
  - `PATCH/DELETE /api/vehicles/[id]` - Update și delete vehicule
  - `POST /api/gps/push` - GPS tracking endpoint

### **7. GPS Integration** (2h)
- **Endpoint**: `POST /api/gps/push`
- **Payload**: `{imei, lat, lon, ts}`
- **Update**: `gps_devices` + `vehicles.last_*`
- **Real-time**: WebSocket notifications

### **8. UI Wiring** (2h)
- **Hook**: `useMarketplace()` pentru API calls
- **Cleanup**: Remove mock data imports (16 files)
- **Integration**: Connect components to real endpoints

### **9. Testing** (3h)
- **File**: `e2e/cargo.spec.ts` - Post cargo → list → detail
- **File**: `e2e/offer.spec.ts` - Send offer → expect 201
- **Coverage**: Full user journey testing

### **10. Documentation** (1h)
- **File**: `docs/MARKETPLACE_INTERNAL_API.md`
- **Content**: API contracts, example payloads, error handling

---

## 🔄 FLOW LOGIC ANALYSIS

### **User Journey - Cargo Provider**
1. **Login** → Dashboard
2. **Post Cargo** → Fill form → Submit
3. **Cargo Listed** → Appears in marketplace
4. **Receive Offers** → Transportatori trimite oferte
5. **Accept/Reject** → Nego process
6. **Track Status** → In progress → Completed

### **User Journey - Transporter**
1. **Login** → Dashboard
2. **Browse Cargo** → Filter by location/type
3. **View Details** → Cargo information
4. **Submit Offer** → Price + message
5. **Track Status** → Pending → Accepted/Rejected
6. **Execute Transport** → GPS tracking

### **Fleet Management Flow**
1. **Add Vehicle** → Registration data
2. **GPS Assignment** → Device pairing
3. **Live Tracking** → Real-time coordinates
4. **Route Planning** → Optimal paths
5. **Performance Analytics** → Usage metrics

### **Data Flow Architecture**
```
Frontend (React) 
    ↓ useMarketplace() hook
API Routes (/api/cargo/*, /api/vehicles/*)
    ↓ Input validation
Service Layer (lib/marketplace.ts)
    ↓ Business logic
Database (PostgreSQL)
    ↓ CRUD operations
Real-time Updates (WebSocket)
```

---

## 🚀 IMPLEMENTATION PROGRESS

### **Phase 1: Core Infrastructure** (6h)
- [x] Branch creation
- [x] Database analysis
- [ ] Migrations creation
- [ ] Service layer implementation
- [ ] Basic API routes

### **Phase 2: Marketplace Features** (8h)
- [ ] Cargo CRUD operations
- [ ] Offer system
- [ ] Feature flag implementation
- [ ] UI integration

### **Phase 3: Fleet Management** (6h)
- [ ] Vehicle management
- [ ] GPS integration
- [ ] Real-time tracking
- [ ] Fleet analytics

### **Phase 4: Testing & Documentation** (4h)
- [ ] E2E testing
- [ ] API documentation
- [ ] QA manual testing
- [ ] Performance optimization

---

## 📊 TECHNICAL SPECIFICATIONS

### **Database Schema Extensions**
```sql
-- Cargo table (already exists) - add indexes
CREATE INDEX idx_cargo_status ON cargo(status);
CREATE INDEX idx_cargo_created ON cargo(created_ts);
CREATE INDEX idx_cargo_from_country ON cargo(from_country);
CREATE INDEX idx_cargo_to_country ON cargo(to_country);

-- Vehicles table (new)
CREATE TABLE vehicles (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  plate TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL,
  capacity INTEGER NOT NULL,
  gps_device_id INTEGER,
  status TEXT DEFAULT 'ACTIVE',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- GPS devices table (new)
CREATE TABLE gps_devices (
  id SERIAL PRIMARY KEY,
  imei TEXT UNIQUE NOT NULL,
  vehicle_id INTEGER REFERENCES vehicles(id),
  last_lat NUMERIC,
  last_lon NUMERIC,
  last_ping_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### **API Endpoints Contract**
```typescript
// GET /api/cargo
interface CargoListResponse {
  cargo: Cargo[]
  pagination: {
    page: number
    limit: number
    total: number
    hasMore: boolean
  }
  filters: {
    status?: string
    country?: string
    minWeight?: number
    maxWeight?: number
  }
}

// POST /api/cargo
interface CreateCargoRequest {
  title: string
  type: string
  weight: number
  fromAddr: string
  toAddr: string
  loadDate: string
  deliveryDate: string
  price?: number
}

// POST /api/cargo/[id]/offer
interface SubmitOfferRequest {
  proposedPrice: number
  message?: string
  transporterId: string
}
```

### **Feature Flag Configuration**
```typescript
// .env configuration
USE_MOCK_MARKETPLACE=true  // Development
USE_MOCK_MARKETPLACE=false // Production

// lib/config.ts
export const config = {
  marketplace: {
    useMock: process.env.USE_MOCK_MARKETPLACE === 'true',
    apiUrl: process.env.MARKETPLACE_API_URL,
    timeout: 5000,
    retries: 1
  }
}
```

---

## 🧪 TESTING STRATEGY

### **Unit Tests**
- Service layer functions
- API route handlers
- Database operations
- Utility functions

### **Integration Tests**
- API endpoint flows
- Database transactions
- Feature flag switching
- Error handling

### **E2E Tests**
- Complete user journeys
- Cross-browser compatibility
- Mobile responsiveness
- Performance benchmarks

### **Manual QA Checklist**
- [ ] Post cargo → appears in list
- [ ] Send offer → saves in database
- [ ] Fleet management CRUD
- [ ] GPS tracking updates
- [ ] Feature flag toggle works
- [ ] Error handling graceful
- [ ] Performance acceptable

---

## 🚨 RISK MITIGATION

### **Technical Risks**
- **Database Performance**: Index optimization, query analysis
- **API Timeouts**: Retry logic, circuit breakers
- **Feature Flag Issues**: Rollback strategy, monitoring
- **GPS Integration**: Fallback mechanisms, error handling

### **Business Risks**
- **Data Migration**: Backup strategy, rollback plan
- **User Experience**: Gradual rollout, A/B testing
- **Performance Impact**: Load testing, monitoring
- **Bug Introduction**: Comprehensive testing, code review

### **Rollback Strategy**
1. **Immediate**: Feature flag toggle to mock data
2. **Database**: Migration rollback scripts
3. **Code**: Git revert to previous stable version
4. **Monitoring**: 24h observation period post-deploy

---

## 📈 SUCCESS METRICS

### **Performance Targets**
- API response time < 500ms
- Database queries < 100ms
- GPS updates < 5s latency
- Zero 5xx errors on /api/cargo

### **User Experience Metrics**
- Cargo posting success rate > 99%
- Offer submission success rate > 99%
- Fleet registration completion > 95%
- GPS tracking accuracy > 98%

### **Business Metrics**
- Increased cargo listings
- Higher offer conversion rates
- Improved fleet utilization
- Reduced manual interventions

---

## 🔮 NEXT STEPS POST-SPRINT

### **Sprint 3 Planning**
- AI optimization engine
- Advanced analytics dashboard
- Mobile app development
- Multi-language support

### **Production Readiness**
- Load testing
- Security audit
- Performance optimization
- Monitoring setup

### **User Feedback Integration**
- Beta testing program
- Feedback collection system
- Iterative improvements
- Feature prioritization

---

**STATUS**: IN PROGRESS  
**NEXT UPDATE**: Daily standup @ 09:00  
**COMPLETION TARGET**: 15.07.2025

---

*Generated: 11.07.2025*  
*Last Updated: 11.07.2025*