'use client'

import { useState } from 'react'

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

interface AddFleetModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (vehicleData: VehicleData) => void
}

export default function AddFleetModal({ isOpen, onClose, onSubmit }: AddFleetModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    licensePlate: '',
    vehicleType: 'Truck',
    capacity: '',
    consumption: '',
    location: '',
    coordinates: '',
    driver: '',
    status: 'Active' as const
  })

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    let coordinates = undefined
    if (formData.coordinates) {
      const [lat, lng] = formData.coordinates.split(',').map(coord => parseFloat(coord.trim()))
      if (!isNaN(lat) && !isNaN(lng)) {
        coordinates = { lat, lng }
      }
    }

    const vehicleData: VehicleData = {
      name: formData.name,
      licensePlate: formData.licensePlate,
      vehicleType: formData.vehicleType,
      capacity: parseFloat(formData.capacity) || 0,
      consumption: parseFloat(formData.consumption) || 0,
      location: formData.location,
      coordinates,
      driver: formData.driver,
      status: formData.status
    }

    onSubmit(vehicleData)
    onClose()
    
    // Reset form
    setFormData({
      name: '',
      licensePlate: '',
      vehicleType: 'Truck',
      capacity: '',
      consumption: '',
      location: '',
      coordinates: '',
      driver: '',
      status: 'Active'
    })
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1a1a] rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-[#1a1a1a] border-b border-[#363636] px-6 py-4 flex justify-between items-center">
          <h2 className="text-white text-xl font-bold">Add Fleet Vehicle</h2>
          <button
            onClick={onClose}
            className="text-[#adadad] hover:text-white transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 256 256">
              <path d="M205.66,194.34a8,8,0,0,1-11.32,11.32L128,139.31,61.66,205.66a8,8,0,0,1-11.32-11.32L116.69,128,50.34,61.66A8,8,0,0,1,61.66,50.34L128,116.69l66.34-66.35a8,8,0,0,1,11.32,11.32L139.31,128Z"></path>
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          {/* Vehicle Name */}
          <div>
            <label className="block text-white text-sm font-medium mb-2">Vehicle Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="e.g. Truck Alpha"
              className="w-full px-3 py-2 bg-[#363636] border border-[#4d4d4d] rounded-lg text-white placeholder-[#adadad] focus:outline-none focus:border-white"
            />
          </div>

          {/* License Plate */}
          <div>
            <label className="block text-white text-sm font-medium mb-2">License Plate</label>
            <input
              type="text"
              required
              value={formData.licensePlate}
              onChange={(e) => handleInputChange('licensePlate', e.target.value)}
              placeholder="e.g. ABC123"
              className="w-full px-3 py-2 bg-[#363636] border border-[#4d4d4d] rounded-lg text-white placeholder-[#adadad] focus:outline-none focus:border-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Vehicle Type */}
            <div>
              <label className="block text-white text-sm font-medium mb-2">Vehicle Type</label>
              <select
                required
                value={formData.vehicleType}
                onChange={(e) => handleInputChange('vehicleType', e.target.value)}
                className="w-full px-3 py-2 bg-[#363636] border border-[#4d4d4d] rounded-lg text-white focus:outline-none focus:border-white"
              >
                <option value="Truck">Truck</option>
                <option value="Van">Van</option>
                <option value="Trailer">Trailer</option>
                <option value="Semi-Truck">Semi-Truck</option>
                <option value="Refrigerated Truck">Refrigerated Truck</option>
              </select>
            </div>

            {/* Capacity */}
            <div>
              <label className="block text-white text-sm font-medium mb-2">Capacity (tons)</label>
              <input
                type="number"
                required
                min="0"
                step="0.5"
                value={formData.capacity}
                onChange={(e) => handleInputChange('capacity', e.target.value)}
                placeholder="e.g. 25"
                className="w-full px-3 py-2 bg-[#363636] border border-[#4d4d4d] rounded-lg text-white placeholder-[#adadad] focus:outline-none focus:border-white"
              />
            </div>
          </div>

          {/* Fuel Consumption */}
          <div>
            <label className="block text-white text-sm font-medium mb-2">Fuel Consumption (L/100km)</label>
            <input
              type="number"
              required
              min="0"
              step="0.1"
              value={formData.consumption}
              onChange={(e) => handleInputChange('consumption', e.target.value)}
              placeholder="e.g. 35.5"
              className="w-full px-3 py-2 bg-[#363636] border border-[#4d4d4d] rounded-lg text-white placeholder-[#adadad] focus:outline-none focus:border-white"
            />
          </div>

          {/* Location */}
          <div>
            <label className="block text-white text-sm font-medium mb-2">Current Location</label>
            <input
              type="text"
              required
              value={formData.location}
              onChange={(e) => handleInputChange('location', e.target.value)}
              placeholder="e.g. Bucharest, Romania"
              className="w-full px-3 py-2 bg-[#363636] border border-[#4d4d4d] rounded-lg text-white placeholder-[#adadad] focus:outline-none focus:border-white"
            />
          </div>

          {/* GPS Coordinates */}
          <div>
            <label className="block text-white text-sm font-medium mb-2">GPS Coordinates (optional)</label>
            <input
              type="text"
              value={formData.coordinates}
              onChange={(e) => handleInputChange('coordinates', e.target.value)}
              placeholder="e.g. 44.4268, 26.1025"
              className="w-full px-3 py-2 bg-[#363636] border border-[#4d4d4d] rounded-lg text-white placeholder-[#adadad] focus:outline-none focus:border-white"
            />
            <p className="text-[#adadad] text-xs mt-1">Enter as: latitude, longitude</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Driver */}
            <div>
              <label className="block text-white text-sm font-medium mb-2">Driver</label>
              <input
                type="text"
                required
                value={formData.driver}
                onChange={(e) => handleInputChange('driver', e.target.value)}
                placeholder="e.g. John Doe"
                className="w-full px-3 py-2 bg-[#363636] border border-[#4d4d4d] rounded-lg text-white placeholder-[#adadad] focus:outline-none focus:border-white"
              />
            </div>

            {/* Status */}
            <div>
              <label className="block text-white text-sm font-medium mb-2">Status</label>
              <select
                required
                value={formData.status}
                onChange={(e) => handleInputChange('status', e.target.value as 'Active' | 'Inactive')}
                className="w-full px-3 py-2 bg-[#363636] border border-[#4d4d4d] rounded-lg text-white focus:outline-none focus:border-white"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-[#363636] hover:bg-[#4d4d4d] text-white py-3 px-4 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-white hover:bg-gray-100 text-black py-3 px-4 rounded-lg font-medium transition-colors"
            >
              Add Vehicle
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}