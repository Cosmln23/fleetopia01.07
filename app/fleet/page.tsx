'use client'

import { useState } from 'react'
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

  return (
    <>
      {/* FLEET CONTENT */}
      <h2 className="text-white tracking-light text-[28px] font-bold leading-tight px-4 text-left pb-3 pt-5">Fleet Overview</h2>
      <div className="flex px-4 py-3">
        <div
          className="w-full bg-center bg-no-repeat aspect-video bg-cover rounded-xl object-cover bg-[#363636]"
          style={{backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuBQ2-OPtexEwlIaQqUI9QB-Chs9DJQbe7k7Dm0Ed5H9UWtaDwqKihSGM_kiiOTsOS12Lcef5vF1BNNTnji_OctBhQKIvi8c7zqtedCBDjMs6qFKu6qsC9wuypmxs3JQXPnQXzulVS-IodckTEL6IOdjnRefYWQYf0gq9vBYRJxmJMDF8itsXdZEcUrh8knsf4_Sm2EnGO7ZT17BPIpUOJZyOGljsBJmXSVlOvwpTWIguvP7HlNz_BV-HF3KydhKJYv7jO9YYb35C3v7")'}}
        ></div>
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