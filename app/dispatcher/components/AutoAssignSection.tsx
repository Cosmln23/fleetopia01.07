'use client'

import { useState } from 'react'
import { Vehicle, FleetStatus } from '../hooks/useFleet'

interface AutoAssignSectionProps {
  isEnabled: boolean
  onToggle: (enabled: boolean) => void
  fleetStatus: FleetStatus
  vehicleAutoAssign: Record<string, boolean>
  onVehicleToggle: (vehicleId: string, enabled: boolean) => void
}

export default function AutoAssignSection({
  isEnabled,
  onToggle,
  fleetStatus,
  vehicleAutoAssign,
  onVehicleToggle
}: AutoAssignSectionProps) {
  const [showVehicles, setShowVehicles] = useState(false)
  
  // Auto-assign is only available when we have vehicles
  const canEnable = fleetStatus.hasVehicles
  
  const getVehicleIcon = (vehicle: Vehicle) => {
    if (vehicle.has_gps || vehicle.gps_device_id) {
      // GPS icon
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 256 256" className="text-green-400">
          <path d="M128,64a40,40,0,1,0,40,40A40,40,0,0,0,128,64Zm0,64a24,24,0,1,1,24-24A24,24,0,0,1,128,128ZM128,16a88.1,88.1,0,0,0-88,88c0,31.4,14.51,64.68,42,96.25a254.19,254.19,0,0,0,41.45,38.3,8,8,0,0,0,9.18,0A254.19,254.19,0,0,0,174,200.25c27.45-31.57,42-64.85,42-96.25A88.1,88.1,0,0,0,128,16Zm0,206c-16.53-13-72-60.75-72-118a72,72,0,0,1,144,0C200,161.23,144.53,209,128,222Z"></path>
        </svg>
      )
    } else if (vehicle.last_manual_lat && vehicle.last_manual_lng) {
      // Manual location icon
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 256 256" className="text-yellow-400">
          <path d="M128,64a40,40,0,1,0,40,40A40,40,0,0,0,128,64Zm0,64a24,24,0,1,1,24-24A24,24,0,0,1,128,128ZM128,16a88.1,88.1,0,0,0-88,88c0,31.4,14.51,64.68,42,96.25a254.19,254.19,0,0,0,41.45,38.3,8,8,0,0,0,9.18,0A254.19,254.19,0,0,0,174,200.25c27.45-31.57,42-64.85,42-96.25A88.1,88.1,0,0,0,128,16Zm0,206c-16.53-13-72-60.75-72-118a72,72,0,0,1,144,0C200,161.23,144.53,209,128,222Z"></path>
        </svg>
      )
    } else {
      // No location icon
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 256 256" className="text-[#666]">
          <path d="M128,64a40,40,0,1,0,40,40A40,40,0,0,0,128,64Zm0,64a24,24,0,1,1,24-24A24,24,0,0,1,128,128ZM128,16a88.1,88.1,0,0,0-88,88c0,31.4,14.51,64.68,42,96.25a254.19,254.19,0,0,0,41.45,38.3,8,8,0,0,0,9.18,0A254.19,254.19,0,0,0,174,200.25c27.45-31.57,42-64.85,42-96.25A88.1,88.1,0,0,0,128,16Zm0,206c-16.53-13-72-60.75-72-118a72,72,0,0,1,144,0C200,161.23,144.53,209,128,222Z"></path>
        </svg>
      )
    }
  }
  
  const getVehicleStatus = (vehicle: Vehicle) => {
    if (vehicle.has_gps || vehicle.gps_device_id) {
      return { text: 'GPS connected', color: 'text-green-400' }
    } else if (vehicle.last_manual_lat && vehicle.last_manual_lng) {
      return { text: 'Manual location', color: 'text-yellow-400' }
    } else {
      return { text: 'No location', color: 'text-[#666]' }
    }
  }
  
  const isVehicleAssignable = (vehicle: Vehicle) => {
    return (vehicle.has_gps || vehicle.gps_device_id) || 
           (vehicle.last_manual_lat && vehicle.last_manual_lng)
  }

  return (
    <div className="bg-[#2d2d2d] rounded-xl p-4">
      {/* Master Auto-Assign Toggle */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="text-[#adadad]" data-icon="Robot" data-size="20px" data-weight="regular">
            <svg xmlns="http://www.w3.org/2000/svg" width="20px" height="20px" fill="currentColor" viewBox="0 0 256 256">
              <path d="M200,56H56A16,16,0,0,0,40,72V184a16,16,0,0,0,16,16H200a16,16,0,0,0,16-16V72A16,16,0,0,0,200,56ZM56,72H200V184H56ZM96,116a12,12,0,1,1,12,12A12,12,0,0,1,96,116Zm52,0a12,12,0,1,1,12,12A12,12,0,0,1,148,116Z"></path>
            </svg>
          </div>
          <span className="text-white font-medium">Auto-Assign Vehicle</span>
          {!canEnable && (
            <span className="text-[#666] text-xs">(No vehicles available)</span>
          )}
        </div>
        
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={isEnabled && canEnable}
            onChange={(e) => canEnable && onToggle(e.target.checked)}
            disabled={!canEnable}
            className="sr-only peer"
          />
          <div className={`relative w-11 h-6 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all ${
            canEnable 
              ? isEnabled 
                ? 'bg-blue-600 peer-focus:ring-4 peer-focus:ring-blue-300' 
                : 'bg-gray-700 peer-focus:ring-4 peer-focus:ring-gray-800'
              : 'bg-gray-800 cursor-not-allowed'
          }`}></div>
          <span className="ml-3 text-sm font-medium text-white">
            {isEnabled && canEnable ? 'ON' : 'OFF'}
          </span>
        </label>
      </div>

      {/* Vehicle List */}
      {canEnable && isEnabled && fleetStatus.availableVehicles.length > 0 && (
        <div className="border-t border-[#4d4d4d] pt-3">
          <button
            onClick={() => setShowVehicles(!showVehicles)}
            className="flex items-center gap-2 text-[#adadad] hover:text-white transition-colors text-sm mb-3"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="12" 
              height="12" 
              fill="currentColor" 
              viewBox="0 0 256 256"
              className={`transition-transform ${showVehicles ? 'rotate-90' : ''}`}
            >
              <path d="m181.66,133.66l-80,80a8,8,0,0,1-11.32-11.32L164.69,128,90.34,53.66a8,8,0,0,1,11.32-11.32l80,80A8,8,0,0,1,181.66,133.66Z"></path>
            </svg>
            <span>
              {fleetStatus.availableVehicles.length} vehicle{fleetStatus.availableVehicles.length !== 1 ? 's' : ''} available
            </span>
          </button>

          {showVehicles && (
            <div className="space-y-2">
              {fleetStatus.fleet.map((vehicle) => {
                const status = getVehicleStatus(vehicle)
                const canAssign = isVehicleAssignable(vehicle)
                const isAssigned = Boolean(vehicleAutoAssign[vehicle.id])
                
                return (
                  <div key={vehicle.id} className="flex items-center justify-between bg-[#363636] rounded-lg p-3">
                    <div className="flex items-center gap-3">
                      {getVehicleIcon(vehicle)}
                      <div>
                        <div className="text-white text-sm font-medium">{vehicle.name}</div>
                        <div className="flex items-center gap-2">
                          <span className="text-[#adadad] text-xs">{vehicle.license_plate}</span>
                          <span className={`text-xs ${status.color}`}>• {status.text}</span>
                        </div>
                      </div>
                    </div>
                    
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={Boolean(isAssigned && canAssign)}
                        onChange={(e) => canAssign && onVehicleToggle(vehicle.id, e.target.checked)}
                        disabled={!canAssign}
                        className="sr-only peer"
                      />
                      <div className={`relative w-9 h-5 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[1px] after:left-[1px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all ${
                        canAssign 
                          ? isAssigned 
                            ? 'bg-blue-600' 
                            : 'bg-gray-700'
                          : 'bg-gray-800 cursor-not-allowed'
                      }`}></div>
                      <span className="ml-2 text-xs font-medium text-white">
                        {isAssigned && canAssign ? 'ON' : 'OFF'}
                      </span>
                    </label>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
      
      {/* No vehicles message */}
      {!canEnable && (
        <div className="border-t border-[#4d4d4d] pt-3">
          <div className="text-[#666] text-sm text-center">
            Create vehicles to enable auto-assignment
          </div>
        </div>
      )}
    </div>
  )
}