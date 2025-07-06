'use client'

import { useState, useEffect } from 'react'
import NoGpsLocationModal from '@/app/dispatcher/components/NoGpsLocationModal'

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
  gpsDeviceId?: string
}

interface GpsDevice {
  id: string
  label: string
  imei: string
  assigned: boolean
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
    coordinates: { lat: 0, lng: 0 },
    driver: '',
    status: 'Active' as const,
    gpsDeviceId: ''
  })

  const [gpsDevices, setGpsDevices] = useState<GpsDevice[]>([])
  const [loadingGps, setLoadingGps] = useState(false)
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false)

  // Fetch available GPS devices when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchGpsDevices()
    }
  }, [isOpen])

  const fetchGpsDevices = async () => {
    setLoadingGps(true)
    try {
      const response = await fetch('/api/gps-devices?free=1')
      if (response.ok) {
        const devices = await response.json()
        setGpsDevices(devices)
      }
    } catch (error) {
      console.error('Error fetching GPS devices:', error)
    } finally {
      setLoadingGps(false)
    }
  }

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    let coordinates = undefined
    if (formData.coordinates && formData.coordinates.lat !== 0 && formData.coordinates.lng !== 0) {
      coordinates = formData.coordinates
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
      status: formData.status,
      gpsDeviceId: formData.gpsDeviceId || undefined
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
      coordinates: { lat: 0, lng: 0 },
      driver: '',
      status: 'Active',
      gpsDeviceId: ''
    })
    setIsLocationModalOpen(false)
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleLocationSet = (location: string, lat: number, lng: number) => {
    setFormData(prev => ({
      ...prev,
      location,
      coordinates: { lat, lng }
    }))
    setIsLocationModalOpen(false)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1a1a] rounded-xl w-full max-w-lg max-h-[85vh] flex flex-col">
        <div className="flex-shrink-0 bg-[#1a1a1a] border-b border-[#363636] px-6 py-4 flex justify-between items-center rounded-t-xl">
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

        <div className="flex-1 overflow-y-auto px-6 py-4">
          <form id="vehicle-form" onSubmit={handleSubmit} className="space-y-4">
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

            {/* GPS Device */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <label className="block text-white text-sm font-medium">GPS Device</label>
                <button
                  type="button"
                  className="text-[#adadad] hover:text-white transition-colors group relative"
                  onMouseEnter={(e) => {
                    const tooltip = e.currentTarget.querySelector('.tooltip')
                    if (tooltip) tooltip.classList.remove('opacity-0', 'pointer-events-none')
                  }}
                  onMouseLeave={(e) => {
                    const tooltip = e.currentTarget.querySelector('.tooltip')
                    if (tooltip) tooltip.classList.add('opacity-0', 'pointer-events-none')
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 256 256">
                    <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm12-88a12,12,0,1,1-12-12A12,12,0,0,1,140,128Zm-12-44a12,12,0,1,0,12,12A12,12,0,0,0,128,84Z"></path>
                  </svg>
                  <div className="tooltip absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-[#2d2d2d] border border-[#4d4d4d] rounded-lg text-xs text-white shadow-lg opacity-0 pointer-events-none transition-opacity z-10">
                    <div className="font-medium mb-1">GPS Device Info</div>
                    <div className="text-[#adadad]">
                      GPS devices provide automatic real-time location tracking. Configure and manage your devices in Settings → GPS Devices.
                    </div>
                    <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-[#2d2d2d]"></div>
                  </div>
                </button>
              </div>
              <select
                value={formData.gpsDeviceId}
                onChange={(e) => handleInputChange('gpsDeviceId', e.target.value)}
                disabled={loadingGps}
                className="w-full px-3 py-2 bg-[#363636] border border-[#4d4d4d] rounded-lg text-white focus:outline-none focus:border-white disabled:opacity-50"
              >
                <option value="">No GPS device</option>
                {loadingGps ? (
                  <option value="" disabled>Loading GPS devices...</option>
                ) : (
                  gpsDevices.map(device => (
                    <option key={device.id} value={device.id}>
                      {device.label} (IMEI: {device.imei})
                    </option>
                  ))
                )}
              </select>
              {gpsDevices.length === 0 && !loadingGps && (
                <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 256 256">
                    <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm-4,48a4,4,0,0,1,8,0v56a4,4,0,0,1-8,0Zm4,104a12,12,0,1,1,12-12A12,12,0,0,1,128,176Z"></path>
                  </svg>
                  No GPS devices available. Add one in Settings → GPS Devices
                </p>
              )}
            </div>

            {/* Vehicle Location - Only show if no GPS device selected */}
            {!formData.gpsDeviceId && (
              <div>
                <label className="block text-white text-sm font-medium mb-2">Vehicle Location</label>
                <button
                  type="button"
                  onClick={() => setIsLocationModalOpen(true)}
                  className="w-full bg-[#363636] hover:bg-[#4d4d4d] text-white px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 border border-[#4d4d4d] focus:outline-none focus:border-white"
                >
                  <div className="text-white" data-icon="MapPin" data-size="16px" data-weight="regular">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16px" height="16px" fill="currentColor" viewBox="0 0 256 256">
                      <path d="M128,64a40,40,0,1,0,40,40A40,40,0,0,0,128,64Zm0,64a24,24,0,1,1,24-24A24,24,0,0,1,128,128ZM128,16a88.1,88.1,0,0,0-88,88c0,31.4,14.51,64.68,42,96.25a254.19,254.19,0,0,0,41.45,38.3,8,8,0,0,0,9.18,0A254.19,254.19,0,0,0,174,200.25c27.45-31.57,42-64.85,42-96.25A88.1,88.1,0,0,0,128,16Zm0,206c-16.53-13-72-60.75-72-118a72,72,0,0,1,144,0C200,161.23,144.53,209,128,222Z"></path>
                    </svg>
                  </div>
                  <span>
                    {formData.location ? `📍 ${formData.location}` : 'Set Manual Location'}
                  </span>
                </button>
                {formData.coordinates && formData.coordinates.lat !== 0 && formData.coordinates.lng !== 0 && (
                  <p className="text-[#adadad] text-xs mt-1">
                    📍 {formData.coordinates.lat.toFixed(6)}, {formData.coordinates.lng.toFixed(6)}
                  </p>
                )}
              </div>
            )}

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
          </form>
        </div>

        {/* Fixed Bottom Buttons */}
        <div className="flex-shrink-0 bg-[#1a1a1a] border-t border-[#363636] px-6 py-4 rounded-b-xl">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-[#363636] hover:bg-[#4d4d4d] text-white py-3 px-4 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="vehicle-form"
              className="flex-1 bg-white hover:bg-gray-100 text-black py-3 px-4 rounded-lg font-medium transition-colors"
            >
              Add Vehicle
            </button>
          </div>
        </div>
      </div>

      {/* NoGpsLocationModal */}
      <NoGpsLocationModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        onLocationSet={handleLocationSet}
        vehicleName={formData.name || 'New Vehicle'}
      />
    </div>
  )
}