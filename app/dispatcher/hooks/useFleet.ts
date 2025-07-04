// app/dispatcher/hooks/useFleet.ts
import { useState, useEffect } from 'react'

interface Vehicle {
  id: string
  name: string
  lat?: number | null
  lng?: number | null
  status: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE'
  capacity: number
}

/**
 * Hook to fetch and manage fleet data
 * TODO: Replace with real API call to /api/vehicles
 */
export function useFleet() {
  const [fleet, setFleet] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchFleet = async () => {
    try {
      setLoading(true)
      
      // TODO: Replace with real API call
      // const response = await fetch('/api/vehicles')
      // const data = await response.json()
      // setFleet(data)
      
      // For now, return empty array until API integration
      setFleet([])
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch fleet')
      setFleet([])
    } finally {
      setLoading(false)
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
    refetch
  }
}