# Agent & Auto-Assign Logic Implementation - 05.07.2025

## 🎯 Obiectiv
Implementarea logicii complete pentru Agent și Auto-Assign care recunoaște tipurile de vehicule și restricționează funcționalitățile în mod logic.

## 📋 Logica Finală Definită

### Scenario 1: Nu există vehicule
**Trigger:** `vehicles.length === 0`
**Modal:** "No GPS found - You have no vehicles..."
**Opțiuni:** [Continue without GPS] [Add location]
**Rezultat:** 
- Agent: ON
- Auto-Assign: DISABLED (nu are sens fără vehicule)

### Scenario 2: Vehicule cu locații manuale
**Trigger:** `vehicles.length > 0 && hasManualLocations && !hasGPS`
**Modal:** "Manual locations detected..."
**Opțiuni:** [Continue without GPS]
**Rezultat:**
- Agent: ON  
- Auto-Assign: ENABLED (cu toggle ON/OFF)
- Lista vehicule: Fiecare vehicul cu toggle individual

### Scenario 3: Vehicule cu GPS
**Trigger:** `vehicles.some(v => v.has_gps || v.gps_device_id)`
**Modal:** NU apare
**Rezultat:**
- Agent: ON direct
- Auto-Assign: ENABLED (cu toggle ON/OFF)
- Lista vehicule: Fiecare vehicul cu toggle individual

### Scenario 4: Vehicule mixte (GPS + Manual + Fără locație)
**Trigger:** Mixed fleet
**Modal:** Bazat pe cel mai restrictiv tip
**Rezultat:**
- Agent: ON
- Auto-Assign: ENABLED
- Vehicule individuale:
  - Cu GPS: Toggle ON/OFF disponibil
  - Cu locație manuală: Toggle ON/OFF disponibil  
  - Fără locație: Toggle DISABLED (forțat OFF)

## 🛠️ Implementare Plan

### Etapa 1: Vehicle Detection Logic
**Fișier:** `app/dispatcher/hooks/useFleet.ts`
**Funcție:** `getFleetStatus()`

```typescript
interface FleetStatus {
  hasVehicles: boolean
  hasGPS: boolean  
  hasManualLocations: boolean
  hasVehiclesWithoutLocation: boolean
  scenario: 'no-vehicles' | 'manual-only' | 'gps-available' | 'mixed'
  availableVehicles: Vehicle[]
}
```

### Etapa 2: Modal Logic Update
**Fișier:** `app/dispatcher/components/NoGpsModal.tsx`
- Update mesaje pentru fiecare scenario
- Adăugare info buttons cu explicații
- Implementare acțiuni diferite pentru butoane

### Etapa 3: Auto-Assign Component
**Fișier:** `app/dispatcher/components/AutoAssignSection.tsx` (NOU)
- Toggle principal Auto-Assign (ENABLED doar cu vehicule)
- Lista vehicule cu toggle-uri individuale
- Logică de enable/disable bazată pe tipul vehiculului

### Etapa 4: State Management
**Fișier:** `app/dispatcher/state/store.ts`
- Actualizare store cu fleet status
- Auto-assign settings per vehicul
- Sincronizare cu server

### Etapa 5: Integration cu Dispatcher Page
**Fișier:** `app/dispatcher/page.tsx`
- Conectare fleet status cu modal logic
- Integration Auto-Assign section
- Update agent activation flow

## 📊 State Structure Propusă

```typescript
interface DispatcherState {
  isAgentActive: boolean
  autoAssignVehicle: boolean  // Master toggle
  vehicleAutoAssign: Record<string, boolean>  // Per vehicle
  fleetStatus: FleetStatus
  selectedVehicleForLocation: Vehicle | null
  gpsFallbackAllowed: boolean
}
```

## 🔗 Integration Points

### Agent Activation Flow:
1. User click Agent toggle
2. Check fleet status (`getFleetStatus()`)
3. Show appropriate modal sau activate direct
4. Update agent state + auto-assign availability

### Auto-Assign Logic:
1. Master toggle enabled doar când `hasVehicles === true`
2. Individual toggles bazate pe vehicle location type
3. Persist settings în localStorage + server sync

### Vehicle Location Updates:
1. Când se adaugă/update vehicul → refresh fleet status
2. Re-evaluate auto-assign availability
3. Update UI în consecință

## 📝 Files to Modify/Create

### Modified:
- `app/dispatcher/page.tsx` - Main integration
- `app/dispatcher/components/NoGpsModal.tsx` - Scenario handling
- `app/dispatcher/state/store.ts` - State updates
- `app/dispatcher/hooks/useFleet.ts` - Fleet status logic

### Created:
- `app/dispatcher/components/AutoAssignSection.tsx` - Vehicle toggles
- `app/dispatcher/components/InfoTooltip.tsx` - Reusable info component

## ⚙️ Implementation Order

1. **Fleet Status Detection** - useFleet hook logic
2. **Modal Updates** - Scenario-based messages & actions  
3. **Auto-Assign Component** - Vehicle list with toggles
4. **State Integration** - Connect everything together
5. **Testing & Refinement** - Verify all scenarios work

---

## 📋 Progress Tracking
- [ ] Fleet status detection logic
- [ ] Modal scenario updates
- [ ] Auto-assign component creation
- [ ] State management updates
- [ ] Integration testing
- [ ] UI/UX polish