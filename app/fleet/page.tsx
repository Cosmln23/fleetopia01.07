'use client'

import { useState, useEffect } from 'react'
import AddFleetModal from '@/components/AddFleetModal'
import { useStickyNavigation } from '@/contexts/StickyNavigationContext'

interface VehicleData {
  name: string
  licensePlate: string
  vehicleType: string
  capacity: number
  consumption: number
  location: string
  coordinates?: {
    lat: number
    lng: number
  }
  driver: string
  status: 'Active' | 'Inactive'
}

export default function FleetPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const { setModalOpen } = useStickyNavigation()
  const [showTraffic, setShowTraffic] = useState(false)
  const [vehicles, setVehicles] = useState<VehicleData[]>([
    {
      name: "Fleet Alpha",
      licensePlate: "ABC123",
      vehicleType: "Truck",
      capacity: 25,
      consumption: 35.5,
      location: "Bucharest, Romania",
      driver: "Ethan Carter",
      status: "Active"
    },
    {
      name: "Fleet Beta",
      licensePlate: "DEF456",
      vehicleType: "Van",
      capacity: 3.5,
      consumption: 12.0,
      location: "Cluj, Romania",
      driver: "Olivia Bennett",
      status: "Inactive"
    },
    {
      name: "Fleet Gamma",
      licensePlate: "GHI789",
      vehicleType: "Semi-Truck",
      capacity: 40,
      consumption: 38.2,
      location: "Timisoara, Romania",
      driver: "Noah Thompson",
      status: "Active"
    },
    {
      name: "Fleet Delta",
      licensePlate: "JKL012",
      vehicleType: "Refrigerated Truck",
      capacity: 20,
      consumption: 42.0,
      location: "Constanta, Romania",
      driver: "Ava Martinez",
      status: "Inactive"
    },
    {
      name: "Fleet Echo",
      licensePlate: "MNO345",
      vehicleType: "Trailer",
      capacity: 45,
      consumption: 40.5,
      location: "Iasi, Romania",
      driver: "Liam Harris",
      status: "Active"
    }
  ])

  const handleAddVehicle = (vehicleData: VehicleData) => {
    setVehicles(prev => [...prev, vehicleData])
  }

  useEffect(() => {
    const loadGoogleMaps = () => {
      if (typeof window !== 'undefined' && (window as any).google) {
        initializeMap()
        return
      }

      const script = document.createElement('script')
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&callback=initMap`
      script.async = true
      script.defer = true
      
      ;(window as any).initMap = initializeMap
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
        const defaultCoordinates = getDefaultCoordinates(vehicle.location)
        
        new (window as any).google.maps.Marker({
          position: vehicle.coordinates || defaultCoordinates,
          map: map,
          title: `${vehicle.name} - ${vehicle.licensePlate}`,
          icon: {
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="${vehicle.status === 'Active' ? '#0bda0b' : '#adadad'}" viewBox="0 0 256 256">
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
          onClick={() => {
            setIsModalOpen(true)
            setModalOpen(true)
          }}
          className="bg-white hover:bg-gray-100 text-black px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 256 256">
            <path d="M224,128a8,8,0,0,1-8,8H136v80a8,8,0,0,1-16,0V136H40a8,8,0,0,1,0-16h80V40a8,8,0,0,1,16,0v80h80A8,8,0,0,1,224,128Z"></path>
          </svg>
          Add Fleet
        </button>
      </div>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(158px,1fr))] gap-3 p-4">
        {vehicles.map((vehicle, index) => (
          <div key={`${vehicle.licensePlate}-${index}`} className="flex flex-col gap-3 pb-3">
            <div className="w-full bg-center bg-no-repeat aspect-square bg-cover rounded-xl bg-[#363636] flex items-center justify-center">
              <div className="text-[#adadad] text-3xl">🚛</div>
            </div>
            <div>
              <p className="text-white text-base font-medium leading-normal">{vehicle.name}</p>
              <p className="text-[#adadad] text-sm font-normal leading-normal">License: {vehicle.licensePlate}</p>
              <p className="text-[#adadad] text-sm font-normal leading-normal">Type: {vehicle.vehicleType}</p>
              <p className="text-[#adadad] text-sm font-normal leading-normal">Capacity: {vehicle.capacity}t</p>
              <p className="text-[#adadad] text-sm font-normal leading-normal">Driver: {vehicle.driver}</p>
              <p className={`text-sm font-normal leading-normal ${vehicle.status === 'Active' ? 'text-[#0bda0b]' : 'text-[#adadad]'}`}>
                Status: {vehicle.status}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Add Fleet Modal */}
      <AddFleetModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setModalOpen(false)
        }}
        onSubmit={handleAddVehicle}
      />
    </>
  )
}