'use client'

import { useState, useEffect } from 'react'
import AddFleetModal from '@/components/AddFleetModal'
import CardVehicle from './CardVehicle'

interface VehicleData {
  id: string
  name: string
  license_plate: string
  type: string
  capacity: number
  status: string
  driver_name: string
  driver_phone?: string
  fuel_type: string
  gps_device_id?: string
  last_manual_lat?: number
  last_manual_lng?: number
  last_manual_location?: string
  has_gps: boolean
  gps_label?: string
  gps_imei?: string
  created_ts: number
  updated_ts: number
}

export default function FleetPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [showTraffic, setShowTraffic] = useState(false)
  const [vehicles, setVehicles] = useState<VehicleData[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch vehicles on component mount
  useEffect(() => {
    fetchVehicles()
  }, [])

  const fetchVehicles = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/vehicles')
      if (response.ok) {
        const vehicleData = await response.json()
        setVehicles(vehicleData)
      }
    } catch (error) {
      console.error('Error fetching vehicles:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddVehicle = async (vehicleData: any) => {
    try {
      const response = await fetch('/api/vehicles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: vehicleData.name,
          license_plate: vehicleData.licensePlate,
          type: vehicleData.vehicleType,
          capacity: vehicleData.capacity,
          status: vehicleData.status.toLowerCase(),
          driver_name: vehicleData.driver,
          fuel_type: 'diesel',
          gps_device_id: vehicleData.gpsDeviceId,
          last_manual_lat: vehicleData.coordinates?.lat,
          last_manual_lng: vehicleData.coordinates?.lng,
          last_manual_location: vehicleData.location
        })
      })
      
      if (response.ok) {
        // Refresh vehicles list
        fetchVehicles()
      }
    } catch (error) {
      console.error('Error adding vehicle:', error)
    }
  }



  useEffect(() => {
    const loadGoogleMaps = () => {
      if (typeof window !== 'undefined' && (window as any).google) {
        initializeMap()
        return
      }

      // Check if script already exists
      if (document.querySelector('script[src*="maps.googleapis.com"]')) {
        return
      }

      const script = document.createElement('script')
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places&callback=initFleetMap`
      script.async = true
      script.defer = true
      
      ;(window as any).initFleetMap = initializeMap
      document.head.appendChild(script)
    }

    const initializeMap = () => {
      const mapElement = document.getElementById('fleet-map')
      if (!mapElement) return

      const map = new (window as any).google.maps.Map(mapElement, {
        center: { lat: 45.9432, lng: 24.9668 }, // Romania center
        zoom: 7,
        styles: []
      })

      // Initialize traffic layer
      const trafficLayer = new (window as any).google.maps.TrafficLayer()
      if (showTraffic) {
        trafficLayer.setMap(map)
      }

      // Add markers for each vehicle
      vehicles.forEach((vehicle) => {
        const coordinates = vehicle.last_manual_lat && vehicle.last_manual_lng 
          ? { lat: vehicle.last_manual_lat, lng: vehicle.last_manual_lng }
          : getDefaultCoordinates(vehicle.last_manual_location || 'Bucharest, Romania')
        
        const isActive = vehicle.status === 'active'
        const hasGps = vehicle.has_gps
        
        new (window as any).google.maps.Marker({
          position: coordinates,
          map: map,
          title: `${vehicle.name} - ${vehicle.license_plate}${hasGps ? ' (GPS)' : ''}`,
          icon: {
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="${
                hasGps ? '#0bda0b' : isActive ? '#ffa500' : '#adadad'
              }" viewBox="0 0 256 256">
                <path d="M247.42,117l-14-35A15.93,15.93,0,0,0,218.58,72H184V64a8,8,0,0,0-8-8H24A16,16,0,0,0,8,72V184a16,16,0,0,0,16,16H41a32,32,0,0,0,62,0h50a32,32,0,0,0,62,0h17a16,16,0,0,0,16-16V120A7.94,7.94,0,0,0,247.42,117ZM184,88h34.58l9.6,24H184ZM24,72H168v64H24ZM72,208a16,16,0,1,1,16-16A16,16,0,0,1,72,208Zm81-24H103a32,32,0,0,0-62,0H24V152H168v12.31A32.11,32.11,0,0,0,153,184Zm31,24a16,16,0,1,1,16-16A16,16,0,0,1,184,208Zm48-24H215a32.06,32.06,0,0,0-31-24V128h48Z"/>
              </svg>
            `),
            scaledSize: new (window as any).google.maps.Size(24, 24)
          }
        })
      })
    }

    const getDefaultCoordinates = (location: string) => {
      const coordinates: { [key: string]: { lat: number; lng: number } } = {
        'Bucharest, Romania': { lat: 44.4268, lng: 26.1025 },
        'Cluj, Romania': { lat: 46.7712, lng: 23.6236 },
        'Timisoara, Romania': { lat: 45.7489, lng: 21.2087 },
        'Constanta, Romania': { lat: 44.1598, lng: 28.6348 },
        'Iasi, Romania': { lat: 47.1585, lng: 27.6014 }
      }
      return coordinates[location] || { lat: 45.9432, lng: 24.9668 }
    }

    loadGoogleMaps()
  }, [vehicles, showTraffic])

  return (
    <>
      {/* FLEET CONTENT */}
      <h2 className="text-white tracking-light text-[28px] font-bold leading-tight px-4 text-left pb-3 pt-5">Fleet Overview</h2>
      <div className="px-4 py-3">
        <div className="w-full h-[600px] relative bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div id="fleet-map" className="w-full h-full"></div>
          
          {/* Traffic Toggle - Bottom Left */}
          <div className="absolute bottom-6 left-6 z-20">
            <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-lg border border-gray-200/50 p-2">
              <button
                onClick={() => setShowTraffic(!showTraffic)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                  showTraffic
                    ? 'bg-green-500 text-white shadow-md'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <span>🚦</span>
                <span>Traffic</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Vehicle Details Header with Add Fleet Button */}
      <div className="flex justify-between items-center px-4 pb-3 pt-5">
        <h2 className="text-white text-[22px] font-bold leading-tight tracking-[-0.015em]">Vehicle Details</h2>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-white hover:bg-gray-100 text-black px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 256 256">
            <path d="M224,128a8,8,0,0,1-8,8H136v80a8,8,0,0,1-16,0V136H40a8,8,0,0,1,0-16h80V40a8,8,0,0,1,16,0v80h80A8,8,0,0,1,224,128Z"></path>
          </svg>
          Add Fleet
        </button>
      </div>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(256px,1fr))] gap-4 p-4 justify-items-center">
        {loading ? (
          // Loading state
          Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="w-64 bg-[#2d2d2d] rounded-lg p-4 animate-pulse">
              <div className="flex items-center justify-between mb-3">
                <div className="w-8 h-8 bg-[#363636] rounded"></div>
                <div className="w-16 h-6 bg-[#363636] rounded-full"></div>
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-[#363636] rounded w-3/4"></div>
                <div className="h-3 bg-[#363636] rounded w-1/2"></div>
                <div className="h-3 bg-[#363636] rounded w-2/3"></div>
              </div>
            </div>
          ))
        ) : vehicles.length === 0 ? (
          // Empty state
          <div className="col-span-full text-center py-12">
            <div className="text-[#adadad] text-6xl mb-4">🚛</div>
            <p className="text-[#adadad] text-lg mb-2">No vehicles yet</p>
            <p className="text-[#666] text-sm">Add your first vehicle to get started</p>
          </div>
        ) : (
          // Vehicle cards
          vehicles.map((vehicle) => (
            <CardVehicle 
              key={vehicle.id} 
              vehicle={vehicle} 
              onLocationUpdate={fetchVehicles}
              onVehicleDeleted={fetchVehicles}
            />
          ))
        )}
      </div>

      {/* Add Fleet Modal */}
      <AddFleetModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleAddVehicle}
      />
    </>
  )
}