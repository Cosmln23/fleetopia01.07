// app/dispatcher/hooks/useFleet.ts
import { useState, useEffect } from 'react'

export interface Vehicle {
  id: string
  name: string
  license_plate: string
  capacity: number
  status: string
  has_gps: boolean
  gps_device_id?: string | null
  last_manual_lat?: number | null
  last_manual_lng?: number | null
  last_manual_location?: string | null
}

export interface FleetStatus {
  hasVehicles: boolean
  hasGPS: boolean
  hasManualLocations: boolean
  hasVehiclesWithoutLocation: boolean
  scenario: 'no-vehicles' | 'manual-only' | 'gps-available' | 'mixed'
  fleet: Vehicle[]
  availableVehicles: Vehicle[]
  vehiclesWithGPS: Vehicle[]
  vehiclesWithManualLocation: Vehicle[]
  vehiclesWithoutLocation: Vehicle[]
}

/**
 * Hook to fetch and manage fleet data with status detection
 */
export function useFleet() {
  const [fleet, setFleet] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchFleet = async () => {
    try {
      setLoading(true)
      
      // Real API call to fetch vehicles
      const response = await fetch('/api/vehicles')
      if (!response.ok) {
        throw new Error('Failed to fetch vehicles')
      }
      const data = await response.json()
      setFleet(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch fleet')
      setFleet([])
    } finally {
      setLoading(false)
    }
  }

  // Calculate fleet status based on current vehicles
  const getFleetStatus = (): FleetStatus => {
    const hasVehicles = fleet.length > 0
    
    const vehiclesWithGPS = fleet.filter(v => v.has_gps || v.gps_device_id)
    const vehiclesWithManualLocation = fleet.filter(v => 
      !v.has_gps && !v.gps_device_id && v.last_manual_lat && v.last_manual_lng
    )
    const vehiclesWithoutLocation = fleet.filter(v => 
      !v.has_gps && !v.gps_device_id && (!v.last_manual_lat || !v.last_manual_lng)
    )
    
    const hasGPS = vehiclesWithGPS.length > 0
    const hasManualLocations = vehiclesWithManualLocation.length > 0
    const hasVehiclesWithoutLocation = vehiclesWithoutLocation.length > 0
    
    // Determine scenario
    let scenario: FleetStatus['scenario']
    if (!hasVehicles) {
      scenario = 'no-vehicles'
    } else if (hasGPS && (hasManualLocations || hasVehiclesWithoutLocation)) {
      scenario = 'mixed'
    } else if (hasGPS) {
      scenario = 'gps-available'
    } else {
      scenario = 'manual-only'
    }
    
    // Available vehicles are those with either GPS or manual location
    const availableVehicles = [...vehiclesWithGPS, ...vehiclesWithManualLocation]
    
    return {
      hasVehicles,
      hasGPS,
      hasManualLocations,
      hasVehiclesWithoutLocation,
      scenario,
      fleet,
      availableVehicles,
      vehiclesWithGPS,
      vehiclesWithManualLocation,
      vehiclesWithoutLocation
    }
  }

  useEffect(() => {
    fetchFleet()
  }, [])

  const refetch = async () => {
    await fetchFleet()
  }

  return {
    fleet,
    loading,
    error,
    refetch,
    fleetStatus: getFleetStatus()
  }
}