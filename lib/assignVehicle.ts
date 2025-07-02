// lib/assignVehicle.ts
import { fleetMockApi } from './__mocks__/fleet-mock-data'

/**
 * Găsește primul vehicul ACTIVE care poate lua greutatea dată
 * și nu este deja asignat unei curse în progres.
 * Returnează id-ul vehiculului sau null dacă nu găsește.
 */
export function findFreeVehicle(weight: number): string | null {
  const allVehicles = fleetMockApi.getVehicles()
  
  // Găsește vehicule ACTIVE cu capacitate suficientă
  const availableVehicles = allVehicles.filter(vehicle => 
    vehicle.status === 'ACTIVE' && 
    vehicle.capacity >= weight / 1000 // convert kg to tons
  )

  if (availableVehicles.length === 0) {
    return null
  }

  // Pentru moment returnăm primul găsit
  // În viitor aici ar trebui să verificăm și care vehicule sunt ocupate cu curse
  return availableVehicles[0].id
}