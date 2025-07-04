'use client'

import { useState } from 'react'
import NoGpsLocationModal from '@/app/dispatcher/components/NoGpsLocationModal'

interface Vehicle {
  id: string
  name: string
  license_plate: string
  capacity: number
  lat?: number
  lng?: number
  last_manual_lat?: number
  last_manual_lng?: number
  gps_device_id?: string
  has_gps?: boolean
}

interface CardVehicleProps {
  vehicle: Vehicle
  onLocationUpdate?: () => void
  onVehicleDeleted?: () => void
}

export default function CardVehicle({ vehicle, onLocationUpdate, onVehicleDeleted }: CardVehicleProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleSetLocation = async (location: string, lat: number, lng: number) => {
    try {
      const response = await fetch(`/api/vehicles/${vehicle.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          last_manual_lat: lat, 
          last_manual_lng: lng,
          last_manual_location: location
        })
      })
      
      if (response.ok) {
        setIsModalOpen(false)
        onLocationUpdate?.() // Refresh parent component
      }
    } catch (error) {
      console.error('Error updating vehicle location:', error)
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/vehicles/${vehicle.id}`, {
        method: 'DELETE',
      })
      
      if (response.ok) {
        setIsDeleteConfirmOpen(false)
        onVehicleDeleted?.() // Refresh parent component
      } else {
        console.error('Failed to delete vehicle')
      }
    } catch (error) {
      console.error('Error deleting vehicle:', error)
    } finally {
      setIsDeleting(false)
    }
  }

  const hasGPS = vehicle.has_gps || (vehicle.gps_device_id !== null && vehicle.gps_device_id !== undefined)
  
  return (
    <>
      <div className="w-64 bg-[#2d2d2d] rounded-lg p-4 flex flex-col gap-3">
        {/* Header with truck icon, GPS badge, and delete button */}
        <div className="flex items-center justify-between">
          <div className="text-2xl">🚛</div>
          <div className="flex items-center gap-2">
            {hasGPS ? (
              <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                🟢 GPS linked
              </span>
            ) : (
              <span className="bg-yellow-500 text-black text-xs px-2 py-1 rounded-full flex items-center gap-1">
                🟡 No GPS
              </span>
            )}
            <button
              onClick={() => setIsDeleteConfirmOpen(true)}
              className="bg-red-500/20 hover:bg-red-500/30 text-red-400 p-1 rounded transition-colors border border-red-500/30"
              title="Delete vehicle"
            >
              🗑️
            </button>
          </div>
        </div>

        {/* Vehicle info */}
        <div className="space-y-1">
          <h3 className="text-white font-medium text-sm truncate">{vehicle.name}</h3>
          <p className="text-[#adadad] text-xs">{vehicle.license_plate}</p>
          <p className="text-[#adadad] text-xs">{vehicle.capacity}t capacity</p>
        </div>

        {/* Set location button - only show if no GPS */}
        {!hasGPS && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="w-full bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 px-3 py-2 rounded-lg text-sm font-medium transition-colors border border-yellow-500/30"
          >
            📍 Set location
          </button>
        )}

        {/* Show coordinates if available */}
        {((vehicle.lat && vehicle.lng) || (vehicle.last_manual_lat && vehicle.last_manual_lng)) && (
          <div className="text-[#666] text-xs">
            📍 {(vehicle.lat || vehicle.last_manual_lat)?.toFixed(4)}, {(vehicle.lng || vehicle.last_manual_lng)?.toFixed(4)}
          </div>
        )}
      </div>

      {/* NoGpsLocationModal */}
      <NoGpsLocationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onLocationSet={handleSetLocation}
        vehicleName={vehicle.name}
      />

      {/* Delete Confirmation Modal */}
      {isDeleteConfirmOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-[#1a1a1a] border border-[#363636] rounded-xl p-6 w-full max-w-md mx-4 shadow-2xl">
            <h3 className="text-white text-lg font-bold mb-4">Delete Vehicle</h3>
            <p className="text-[#adadad] mb-6">
              Are you sure you want to delete <strong className="text-white">{vehicle.name}</strong> ({vehicle.license_plate})?
            </p>
            <p className="text-red-400 text-sm mb-6">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setIsDeleteConfirmOpen(false)}
                disabled={isDeleting}
                className="flex-1 bg-[#2d2d2d] hover:bg-[#363636] text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center"
              >
                {isDeleting ? '⏳ Deleting...' : '🗑️ Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
} 