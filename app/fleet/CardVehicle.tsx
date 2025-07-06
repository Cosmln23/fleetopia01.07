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
          <div className="text-[#adadad]" data-icon="Truck" data-size="24px" data-weight="regular">
            <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" fill="currentColor" viewBox="0 0 256 256">
              <path d="M247.42,117l-14-35A15.93,15.93,0,0,0,218.58,72H184V64a8,8,0,0,0-8-8H24A16,16,0,0,0,8,72V184a16,16,0,0,0,16,16H41a32,32,0,0,0,62,0h50a32,32,0,0,0,62,0h17a16,16,0,0,0,16-16V120A7.94,7.94,0,0,0,247.42,117ZM184,88h34.58l9.6,24H184ZM24,72H168v64H24ZM72,208a16,16,0,1,1,16-16A16,16,0,0,1,72,208Zm81-24H103a32,32,0,0,0-62,0H24V152H168v12.31A32.11,32.11,0,0,0,153,184Zm31,24a16,16,0,1,1,16-16A16,16,0,0,1,184,208Zm48-24H215a32.06,32.06,0,0,0-31-24V128h48Z"></path>
            </svg>
          </div>
          <div className="flex items-center gap-2">
            {hasGPS ? (
              <span className="bg-[#363636] text-[#adadad] text-xs px-2 py-1 rounded-full border border-[#4d4d4d]">
                GPS linked
              </span>
            ) : (
              <span className="bg-[#2d2d2d] text-[#adadad] text-xs px-2 py-1 rounded-full border border-[#4d4d4d]">
                No GPS
              </span>
            )}
            <button
              onClick={() => setIsDeleteConfirmOpen(true)}
              className="bg-[#2d2d2d] hover:bg-[#363636] text-[#adadad] hover:text-white p-1.5 rounded transition-colors border border-[#4d4d4d]"
              title="Delete vehicle"
            >
              <div className="text-[#adadad]" data-icon="Trash" data-size="14px" data-weight="regular">
                <svg xmlns="http://www.w3.org/2000/svg" width="14px" height="14px" fill="currentColor" viewBox="0 0 256 256">
                  <path d="M216,48H176V40a24,24,0,0,0-24-24H104A24,24,0,0,0,80,40v8H40a8,8,0,0,0,0,16h8V208a16,16,0,0,0,16,16H192a16,16,0,0,0,16-16V64h8a8,8,0,0,0,0-16ZM96,40a8,8,0,0,1,8-8h48a8,8,0,0,1,8,8v8H96Zm96,168H64V64H192ZM112,104v64a8,8,0,0,1-16,0V104a8,8,0,0,1,16,0Zm48,0v64a8,8,0,0,1-16,0V104a8,8,0,0,1,16,0Z"></path>
                </svg>
              </div>
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
            className="w-full bg-[#363636] hover:bg-[#4d4d4d] text-white px-3 py-2 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2"
          >
            <div className="text-white" data-icon="MapPin" data-size="14px" data-weight="regular">
              <svg xmlns="http://www.w3.org/2000/svg" width="14px" height="14px" fill="currentColor" viewBox="0 0 256 256">
                <path d="M128,64a40,40,0,1,0,40,40A40,40,0,0,0,128,64Zm0,64a24,24,0,1,1,24-24A24,24,0,0,1,128,128ZM128,16a88.1,88.1,0,0,0-88,88c0,31.4,14.51,64.68,42,96.25a254.19,254.19,0,0,0,41.45,38.3,8,8,0,0,0,9.18,0A254.19,254.19,0,0,0,174,200.25c27.45-31.57,42-64.85,42-96.25A88.1,88.1,0,0,0,128,16Zm0,206c-16.53-13-72-60.75-72-118a72,72,0,0,1,144,0C200,161.23,144.53,209,128,222Z"></path>
              </svg>
            </div>
            <span>Set location</span>
          </button>
        )}

        {/* Show coordinates if available */}
        {((vehicle.lat && vehicle.lng) || (vehicle.last_manual_lat && vehicle.last_manual_lng)) && (
          <div className="text-[#666] text-xs flex items-center gap-1">
            <div className="text-[#666]" data-icon="MapPin" data-size="10px" data-weight="regular">
              <svg xmlns="http://www.w3.org/2000/svg" width="10px" height="10px" fill="currentColor" viewBox="0 0 256 256">
                <path d="M128,64a40,40,0,1,0,40,40A40,40,0,0,0,128,64Zm0,64a24,24,0,1,1,24-24A24,24,0,0,1,128,128ZM128,16a88.1,88.1,0,0,0-88,88c0,31.4,14.51,64.68,42,96.25a254.19,254.19,0,0,0,41.45,38.3,8,8,0,0,0,9.18,0A254.19,254.19,0,0,0,174,200.25c27.45-31.57,42-64.85,42-96.25A88.1,88.1,0,0,0,128,16Zm0,206c-16.53-13-72-60.75-72-118a72,72,0,0,1,144,0C200,161.23,144.53,209,128,222Z"></path>
              </svg>
            </div>
            <span>{(vehicle.lat || vehicle.last_manual_lat)?.toFixed(4)}, {(vehicle.lng || vehicle.last_manual_lng)?.toFixed(4)}</span>
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
                className="flex-1 bg-[#363636] hover:bg-[#4d4d4d] text-white px-4 py-2 rounded-xl transition-colors disabled:opacity-50 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2 font-medium"
              >
                {isDeleting ? (
                  <>
                    <div className="animate-spin text-white" data-icon="Circle" data-size="14px" data-weight="regular">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14px" height="14px" fill="currentColor" viewBox="0 0 256 256">
                        <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Z" opacity=".2"></path>
                        <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,16a88,88,0,0,1,88,88,8,8,0,0,1-16,0,72,72,0,0,0-72-72,8,8,0,0,1,0-16Z"></path>
                      </svg>
                    </div>
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <div className="text-white" data-icon="Trash" data-size="14px" data-weight="regular">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14px" height="14px" fill="currentColor" viewBox="0 0 256 256">
                        <path d="M216,48H176V40a24,24,0,0,0-24-24H104A24,24,0,0,0,80,40v8H40a8,8,0,0,0,0,16h8V208a16,16,0,0,0,16,16H192a16,16,0,0,0,16-16V64h8a8,8,0,0,0,0-16ZM96,40a8,8,0,0,1,8-8h48a8,8,0,0,1,8,8v8H96Zm96,168H64V64H192ZM112,104v64a8,8,0,0,1-16,0V104a8,8,0,0,1,16,0Zm48,0v64a8,8,0,0,1-16,0V104a8,8,0,0,1,16,0Z"></path>
                      </svg>
                    </div>
                    <span>Delete</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
} 