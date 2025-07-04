'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

interface GpsDevice {
  id: string
  label: string
  imei: string
  api_key: string
  assigned: boolean
}

interface Vehicle {
  id: string
  name: string
  license_plate: string
  type: string
  gps_device_id?: string
}

export default function GpsSettingsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false)
  const [selectedDeviceId, setSelectedDeviceId] = useState('')
  
  // Debug logs removed for performance
  const [formData, setFormData] = useState({
    label: '',
    imei: '',
    api_key: ''
  })
  
  const queryClient = useQueryClient()
  
  const { data: devices = [], isLoading } = useQuery<GpsDevice[]>({
    queryKey: ['gps-devices'],
    queryFn: () => fetch('/api/gps-devices').then(r => r.json())
  })

  const { data: vehicles = [] } = useQuery<Vehicle[]>({
    queryKey: ['vehicles'],
    queryFn: () => fetch('/api/vehicles').then(r => r.json())
  })
  
  const createDevice = useMutation({
    mutationFn: (data: typeof formData) => 
      fetch('/api/gps-devices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gps-devices'] })
      setIsModalOpen(false)
      setFormData({ label: '', imei: '', api_key: '' })
    }
  })

  const assignDevice = useMutation({
    mutationFn: ({ deviceId, vehicleId }: { deviceId: string, vehicleId: string }) =>
      fetch(`/api/gps-devices/${deviceId}/assign`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vehicle_id: vehicleId })
      }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gps-devices'] })
      queryClient.invalidateQueries({ queryKey: ['vehicles'] })
      setIsAssignModalOpen(false)
      setSelectedDeviceId('')
    }
  })

  const unassignDevice = useMutation({
    mutationFn: (deviceId: string) =>
      fetch(`/api/gps-devices/${deviceId}/assign`, {
        method: 'DELETE'
      }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gps-devices'] })
      queryClient.invalidateQueries({ queryKey: ['vehicles'] })
    }
  })
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.label || !formData.imei) return
    createDevice.mutate(formData)
  }

  const handleAssignSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const form = new FormData(e.target as HTMLFormElement)
    const vehicleId = form.get('vehicleId') as string
    if (!vehicleId || !selectedDeviceId) return
    
    assignDevice.mutate({ deviceId: selectedDeviceId, vehicleId })
  }

  const openAssignModal = (deviceId: string) => {
    setSelectedDeviceId(deviceId)
    setIsAssignModalOpen(true)
  }

  const handleUnassign = (deviceId: string) => {
    if (confirm('Are you sure you want to unassign this GPS device?')) {
      unassignDevice.mutate(deviceId)
    }
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <h1 className="text-white text-2xl font-bold mb-6">GPS Devices</h1>
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-[#2d2d2d] h-16 rounded-lg"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-white text-2xl font-bold">GPS Devices</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-white hover:bg-gray-100 text-black px-4 py-2 rounded-lg font-medium transition-colors"
        >
          Add GPS Device
        </button>
      </div>

      <div className="space-y-3">
        {devices.length === 0 ? (
          <div className="bg-[#2d2d2d] rounded-lg p-6 text-center">
            <p className="text-[#adadad]">No GPS devices configured</p>
            <p className="text-[#666] text-sm mt-1">Add your first GPS tracker to get started</p>
          </div>
        ) : (
          devices.map(device => {
            const assignedVehicle = vehicles.find(v => v.id === device.id) // This needs to be fixed based on actual relationship
            
            return (
              <div key={device.id} className="bg-[#2d2d2d] rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h3 className="text-white font-medium">{device.label}</h3>
                    <p className="text-[#adadad] text-sm">IMEI: {device.imei}</p>
                    {device.api_key && (
                      <p className="text-[#adadad] text-xs">API: {device.api_key.substring(0, 12)}...</p>
                    )}
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    device.assigned 
                      ? 'bg-green-500/20 text-green-400' 
                      : 'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    {device.assigned ? 'Assigned' : 'Free'}
                  </span>
                </div>
                
                <div className="border-t border-[#363636] pt-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-[#adadad] text-xs mb-1">Vehicle Assignment</p>
                      {device.assigned ? (
                        <p className="text-white text-sm">Vehicle connected</p>
                      ) : (
                        <p className="text-[#666] text-sm">No vehicle assigned</p>
                      )}
                    </div>
                    
                    <div className="flex gap-2">
                      {device.assigned ? (
                        <button
                          onClick={() => handleUnassign(device.id)}
                          disabled={unassignDevice.isPending}
                          className="text-red-400 hover:text-red-300 text-sm px-3 py-1 border border-red-400/30 rounded hover:border-red-400/50 transition-colors disabled:opacity-50"
                        >
                          Disconnect
                        </button>
                      ) : (
                        <button
                          onClick={() => openAssignModal(device.id)}
                          disabled={vehicles.length === 0}
                          className="text-white bg-white/10 hover:bg-white/20 text-sm px-3 py-1 rounded transition-colors disabled:opacity-50 flex items-center gap-1"
                        >
                          🔗 Connect
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Add Device Modal */}
      {isModalOpen && !isAssignModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-[#1a1a1a] border border-[#363636] rounded-xl p-6 w-full max-w-md">
            <h2 className="text-white text-lg font-bold mb-4">Add GPS Device</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[#adadad] text-sm mb-1">Device Label</label>
                <input
                  type="text"
                  value={formData.label}
                  onChange={(e) => setFormData(prev => ({ ...prev, label: e.target.value }))}
                  placeholder="e.g. Fleet Tracker #1"
                  className="w-full bg-[#2d2d2d] border border-[#363636] rounded-lg px-3 py-2 text-white"
                  required
                />
              </div>
              
              <div>
                <label className="block text-[#adadad] text-sm mb-1">IMEI Number</label>
                <input
                  type="text"
                  value={formData.imei}
                  onChange={(e) => setFormData(prev => ({ ...prev, imei: e.target.value }))}
                  placeholder="e.g. 123456789012345"
                  className="w-full bg-[#2d2d2d] border border-[#363636] rounded-lg px-3 py-2 text-white"
                  required
                />
              </div>
              
              <div>
                <label className="block text-[#adadad] text-sm mb-1">API Key (Optional)</label>
                <input
                  type="text"
                  value={formData.api_key}
                  onChange={(e) => setFormData(prev => ({ ...prev, api_key: e.target.value }))}
                  placeholder="API key for device access"
                  className="w-full bg-[#2d2d2d] border border-[#363636] rounded-lg px-3 py-2 text-white"
                />
              </div>
              
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-[#363636] hover:bg-[#4a4a4a] text-white px-4 py-2 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createDevice.isPending}
                  className="flex-1 bg-white hover:bg-gray-100 text-black px-4 py-2 rounded-lg font-medium disabled:opacity-50"
                >
                  {createDevice.isPending ? 'Adding...' : 'Add Device'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign GPS Device Modal */}
      {isAssignModalOpen && selectedDeviceId && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-[#1a1a1a] border border-[#363636] rounded-xl p-6 w-full max-w-md">
            <h2 className="text-white text-lg font-bold mb-4">Assign GPS Device</h2>
            
            <form onSubmit={handleAssignSubmit} className="space-y-4">
              <div>
                <label className="block text-[#adadad] text-sm mb-1">Select Vehicle</label>
                <select
                  name="vehicleId"
                  required
                  className="w-full bg-[#2d2d2d] border border-[#363636] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-white"
                >
                  <option value="">Choose a vehicle...</option>
                  {vehicles
                    .filter(vehicle => !vehicle.gps_device_id) // Only show vehicles without GPS
                    .map(vehicle => (
                      <option key={vehicle.id} value={vehicle.id}>
                        {vehicle.name} ({vehicle.license_plate})
                      </option>
                    ))
                  }
                </select>
                {vehicles.filter(v => !v.gps_device_id).length === 0 && (
                  <p className="text-[#adadad] text-xs mt-1">
                    All vehicles already have GPS devices assigned
                  </p>
                )}
              </div>
              
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAssignModalOpen(false)}
                  className="flex-1 bg-[#363636] hover:bg-[#4a4a4a] text-white px-4 py-2 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={assignDevice.isPending || vehicles.filter(v => !v.gps_device_id).length === 0}
                  className="flex-1 bg-white hover:bg-gray-100 text-black px-4 py-2 rounded-lg font-medium disabled:opacity-50"
                >
                  {assignDevice.isPending ? 'Connecting...' : 'Connect'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}