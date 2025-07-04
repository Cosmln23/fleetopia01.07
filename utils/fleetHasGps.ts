// utils/fleetHasGps.ts

interface Vehicle {
  id: string
  lat?: number | null
  lng?: number | null
  status?: string
}

/**
 * Checks if fleet has any vehicles with GPS coordinates
 * @param fleet Array of vehicles
 * @returns true if at least one vehicle has lat/lng coordinates
 */
export function fleetHasGps(fleet: Vehicle[]): boolean {
  return fleet.some(vehicle => 
    vehicle.lat !== null && 
    vehicle.lat !== undefined && 
    vehicle.lng !== null && 
    vehicle.lng !== undefined
  )
}

/**
 * Gets count of vehicles with GPS coordinates
 * @param fleet Array of vehicles  
 * @returns number of vehicles with GPS
 */
export function getGpsVehicleCount(fleet: Vehicle[]): number {
  return fleet.filter(vehicle =>
    vehicle.lat !== null && 
    vehicle.lat !== undefined && 
    vehicle.lng !== null && 
    vehicle.lng !== undefined
  ).length
}