// FLEET MOCK DATA SYSTEM
// Simulează backend real pentru Fleet Management

export interface Vehicle {
  id: string
  name: string
  licensePlate: string
  vehicleType: string
  capacity: number // tons
  fuelConsumption: number // L/100km
  status: 'ACTIVE' | 'INACTIVE'
  city: string
  country: string
  lat: number
  lng: number
  gpsEnabled: boolean
  trackerId?: string
  trackerToken?: string
  lastSeenTs?: number
  driverName: string
  createdTs: number
}

// Mock vehicles database
let mockVehicles: Vehicle[] = [
  {
    id: 'fleet_001',
    name: 'Fleet Alpha',
    licensePlate: 'ABC123',
    vehicleType: 'Truck',
    capacity: 25,
    fuelConsumption: 35.5,
    status: 'ACTIVE',
    city: 'Bucharest',
    country: 'Romania',
    lat: 44.4268,
    lng: 26.1025,
    gpsEnabled: false,
    driverName: 'Ethan Carter',
    createdTs: Date.now() - 86400000
  },
  {
    id: 'fleet_002', 
    name: 'Fleet Beta',
    licensePlate: 'DEF456',
    vehicleType: 'Van',
    capacity: 3.5,
    fuelConsumption: 12.0,
    status: 'INACTIVE',
    city: 'Cluj',
    country: 'Romania',
    lat: 46.7712,
    lng: 23.6236,
    gpsEnabled: true,
    trackerId: 'GPS001',
    trackerToken: 'token123',
    lastSeenTs: Date.now() - 1800000, // 30 min ago
    driverName: 'Olivia Bennett',
    createdTs: Date.now() - 172800000
  },
  {
    id: 'fleet_003',
    name: 'Fleet Gamma', 
    licensePlate: 'GHI789',
    vehicleType: 'Semi-Truck',
    capacity: 40,
    fuelConsumption: 38.2,
    status: 'ACTIVE',
    city: 'Timisoara',
    country: 'Romania', 
    lat: 45.7489,
    lng: 21.2087,
    gpsEnabled: true,
    trackerId: 'GPS002',
    trackerToken: 'token456',
    lastSeenTs: Date.now() - 600000, // 10 min ago
    driverName: 'Noah Thompson',
    createdTs: Date.now() - 259200000
  },
  {
    id: 'fleet_004',
    name: 'Fleet Delta',
    licensePlate: 'JKL012', 
    vehicleType: 'Refrigerated Truck',
    capacity: 20,
    fuelConsumption: 42.0,
    status: 'INACTIVE',
    city: 'Constanta',
    country: 'Romania',
    lat: 44.1598,
    lng: 28.6348,
    gpsEnabled: false,
    driverName: 'Ava Martinez',
    createdTs: Date.now() - 345600000
  },
  {
    id: 'fleet_005',
    name: 'Fleet Echo',
    licensePlate: 'MNO345',
    vehicleType: 'Trailer', 
    capacity: 45,
    fuelConsumption: 40.5,
    status: 'ACTIVE',
    city: 'Iasi',
    country: 'Romania',
    lat: 47.1585,
    lng: 27.6014,
    gpsEnabled: true,
    trackerId: 'GPS003', 
    trackerToken: 'token789',
    lastSeenTs: Date.now() - 300000, // 5 min ago
    driverName: 'Liam Harris',
    createdTs: Date.now() - 432000000
  }
]

// Mock API functions
export const fleetMockApi = {
  // Get all vehicles
  getVehicles: (): Vehicle[] => {
    return [...mockVehicles].sort((a, b) => b.createdTs - a.createdTs)
  },

  // Get single vehicle
  getVehicle: (id: string): Vehicle | null => {
    return mockVehicles.find(v => v.id === id) || null
  },

  // Get active vehicles only
  getActiveVehicles: (): Vehicle[] => {
    return mockVehicles.filter(v => v.status === 'ACTIVE')
  },

  // Add new vehicle
  addVehicle: (vehicleData: Omit<Vehicle, 'id' | 'createdTs'>): Vehicle => {
    const newVehicle: Vehicle = {
      ...vehicleData,
      id: `fleet_${Math.random().toString(36).substr(2, 9)}`,
      createdTs: Date.now()
    }
    mockVehicles.unshift(newVehicle)
    return newVehicle
  },

  // Update vehicle status
  updateStatus: (id: string, status: 'ACTIVE' | 'INACTIVE'): Vehicle | null => {
    const vehicle = mockVehicles.find(v => v.id === id)
    if (vehicle) {
      vehicle.status = status
      return vehicle
    }
    return null
  },

  // Update vehicle location (GPS simulation)
  updateLocation: (id: string, lat: number, lng: number): Vehicle | null => {
    const vehicle = mockVehicles.find(v => v.id === id)
    if (vehicle) {
      vehicle.lat = lat
      vehicle.lng = lng
      vehicle.lastSeenTs = Date.now()
      return vehicle
    }
    return null
  },

  // Get vehicle position (with GPS fallback logic)
  getVehiclePosition: (vehicle: Vehicle): { lat: number, lng: number } => {
    if (vehicle.gpsEnabled && vehicle.lastSeenTs) {
      const thirtyMinutesAgo = Date.now() - (30 * 60 * 1000)
      if (vehicle.lastSeenTs > thirtyMinutesAgo) {
        // GPS data is fresh, use it
        return { lat: vehicle.lat, lng: vehicle.lng }
      }
    }
    // Fallback to manual coordinates
    return { lat: vehicle.lat, lng: vehicle.lng }
  },

  // Simulate GPS updates (for testing)
  simulateGpsUpdate: (id: string) => {
    const vehicle = mockVehicles.find(v => v.id === id)
    if (vehicle && vehicle.gpsEnabled) {
      // Simulate small movement (±0.01 degrees ≈ ±1km)
      const latOffset = (Math.random() - 0.5) * 0.02
      const lngOffset = (Math.random() - 0.5) * 0.02
      vehicle.lat += latOffset
      vehicle.lng += lngOffset
      vehicle.lastSeenTs = Date.now()
      return vehicle
    }
    return null
  }
}

// GPS Status helpers
export const getGpsStatusText = (vehicle: Vehicle): string => {
  if (!vehicle.gpsEnabled) return 'Manual'
  if (!vehicle.lastSeenTs) return 'GPS Setup'
  
  const minutesAgo = Math.floor((Date.now() - vehicle.lastSeenTs) / 60000)
  if (minutesAgo < 5) return 'Live'
  if (minutesAgo < 30) return `${minutesAgo}m ago`
  return 'GPS Lost'
}

export const getGpsStatusColor = (vehicle: Vehicle): string => {
  if (!vehicle.gpsEnabled) return 'text-[#adadad]'
  if (!vehicle.lastSeenTs) return 'text-yellow-400'
  
  const minutesAgo = Math.floor((Date.now() - vehicle.lastSeenTs) / 60000)
  if (minutesAgo < 5) return 'text-green-400'
  if (minutesAgo < 30) return 'text-yellow-400'
  return 'text-red-400'
}