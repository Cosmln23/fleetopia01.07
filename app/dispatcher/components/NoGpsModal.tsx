// app/dispatcher/components/NoGpsModal.tsx
'use client'

import { useRouter } from 'next/navigation'
import * as Dialog from '@radix-ui/react-dialog'
import { useDispatcherStore } from '../state/store'
import { FleetStatus } from '../hooks/useFleet'
import { useState } from 'react'

interface NoGpsModalProps {
  isOpen: boolean
  onClose: () => void
  onContinueWithoutGps: () => void
  onAddVehicle: () => void
  fleetStatus: FleetStatus
}

export default function NoGpsModal({ 
  isOpen, 
  onClose, 
  onContinueWithoutGps,
  onAddVehicle,
  fleetStatus
}: NoGpsModalProps) {
  const router = useRouter()
  const { setGpsFallbackAllowed } = useDispatcherStore()
  const [showInfo, setShowInfo] = useState(false)

  const handleContinueWithoutGps = () => {
    setGpsFallbackAllowed(true)
    onContinueWithoutGps()
    onClose()
  }

  const handleAddLocation = () => {
    onClose()
    onAddVehicle() // Open AddFleetModal instead of navigating
  }

  // Get scenario-specific content
  const getModalContent = () => {
    switch (fleetStatus.scenario) {
      case 'no-vehicles':
        return {
          title: 'No vehicles found',
          description: 'You need to create a vehicle first to enable the Agent for route optimization.',
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 256 256" className="text-[#adadad]">
              <path d="M247.42,117l-14-35A15.93,15.93,0,0,0,218.58,72H184V64a8,8,0,0,0-8-8H24A16,16,0,0,0,8,72V184a16,16,0,0,0,16,16H41a32,32,0,0,0,62,0h50a32,32,0,0,0,62,0h17a16,16,0,0,0,16-16V120A7.94,7.94,0,0,0,247.42,117ZM184,88h34.58l9.6,24H184ZM24,72H168v64H24ZM72,208a16,16,0,1,1,16-16A16,16,0,0,1,72,208Zm81-24H103a32,32,0,0,0-62,0H24V152H168v12.31A32.11,32.11,0,0,0,153,184Zm31,24a16,16,0,1,1,16-16A16,16,0,0,1,184,208Zm48-24H215a32.06,32.06,0,0,0-31-24V128h48Z"/>
            </svg>
          ),
          showAddLocation: true,
          infoText: 'Create a vehicle and set its location (GPS or manual) for optimal Agent performance'
        }
      
      case 'manual-only':
        return {
          title: 'Manual locations detected',
          description: 'You have vehicles with manual locations. The Agent will work with reduced precision.',
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 256 256" className="text-[#adadad]">
              <path d="M128,64a40,40,0,1,0,40,40A40,40,0,0,0,128,64Zm0,64a24,24,0,1,1,24-24A24,24,0,0,1,128,128ZM128,16a88.1,88.1,0,0,0-88,88c0,31.4,14.51,64.68,42,96.25a254.19,254.19,0,0,0,41.45,38.3,8,8,0,0,0,9.18,0A254.19,254.19,0,0,0,174,200.25c27.45-31.57,42-64.85,42-96.25A88.1,88.1,0,0,0,128,16Zm0,206c-16.53-13-72-60.75-72-118a72,72,0,0,1,144,0C200,161.23,144.53,209,128,222Z"></path>
            </svg>
          ),
          showAddLocation: false,
          infoText: 'Add GPS devices to vehicles for real-time tracking and optimal route optimization'
        }
      
      case 'mixed':
        return {
          title: 'Mixed fleet detected',
          description: 'You have both GPS and manual locations. The Agent will prioritize GPS vehicles.',
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 256 256" className="text-[#adadad]">
              <path d="M128,64a40,40,0,1,0,40,40A40,40,0,0,0,128,64Zm0,64a24,24,0,1,1,24-24A24,24,0,0,1,128,128ZM128,16a88.1,88.1,0,0,0-88,88c0,31.4,14.51,64.68,42,96.25a254.19,254.19,0,0,0,41.45,38.3,8,8,0,0,0,9.18,0A254.19,254.19,0,0,0,174,200.25c27.45-31.57,42-64.85,42-96.25A88.1,88.1,0,0,0,128,16Zm0,206c-16.53-13-72-60.75-72-118a72,72,0,0,1,144,0C200,161.23,144.53,209,128,222Z"></path>
            </svg>
          ),
          showAddLocation: false,
          infoText: 'GPS vehicles will be prioritized for auto-assignment over manual locations'
        }
      
      default:
        return {
          title: 'No GPS found',
          description: 'You have no active vehicle location. The Agent can still work but route optimization will be limited.',
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 256 256" className="text-[#adadad]">
              <path d="M128,64a40,40,0,1,0,40,40A40,40,0,0,0,128,64Zm0,64a24,24,0,1,1,24-24A24,24,0,0,1,128,128ZM128,16a88.1,88.1,0,0,0-88,88c0,31.4,14.51,64.68,42,96.25a254.19,254.19,0,0,0,41.45,38.3,8,8,0,0,0,9.18,0A254.19,254.19,0,0,0,174,200.25c27.45-31.57,42-64.85,42-96.25A88.1,88.1,0,0,0,128,16Zm0,206c-16.53-13-72-60.75-72-118a72,72,0,0,1,144,0C200,161.23,144.53,209,128,222Z"></path>
            </svg>
          ),
          showAddLocation: true,
          infoText: 'Set vehicle locations for better Agent performance'
        }
    }
  }

  const content = getModalContent()

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#1a1a1a] border border-[#363636] rounded-xl p-6 w-full max-w-md z-50 shadow-2xl">
          
          {/* Header with icon */}
          <div className="flex items-center gap-3 mb-4">
            {content.icon}
            <div className="flex-1">
              <Dialog.Title className="text-white text-lg font-bold">
                {content.title}
              </Dialog.Title>
            </div>
            <button
              onClick={() => setShowInfo(!showInfo)}
              className="text-[#adadad] hover:text-white transition-colors p-1"
              title="More info"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 256 256">
                <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm12-88a12,12,0,0,1-24,0V96a12,12,0,0,1,24,0Zm-12,40a12,12,0,1,1,12-12A12,12,0,0,1,128,168Z"></path>
              </svg>
            </button>
          </div>
          
          <Dialog.Description className="text-[#adadad] text-sm mb-4">
            {content.description}
          </Dialog.Description>

          {/* Info tooltip */}
          {showInfo && (
            <div className="bg-[#2d2d2d] border border-[#4d4d4d] rounded-lg p-3 mb-4">
              <div className="flex items-start gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 256 256" className="text-blue-400 mt-0.5 flex-shrink-0">
                  <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm12-88a12,12,0,0,1-24,0V96a12,12,0,0,1,24,0Zm-12,40a12,12,0,1,1,12-12A12,12,0,0,1,128,168Z"></path>
                </svg>
                <p className="text-[#adadad] text-xs">{content.infoText}</p>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleContinueWithoutGps}
              className="flex-1 bg-[#363636] hover:bg-[#4a4a4a] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Continue without GPS
            </button>
            
            {content.showAddLocation && (
              <button
                onClick={handleAddLocation}
                className="flex-1 bg-white hover:bg-gray-100 text-black px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                {fleetStatus.scenario === 'no-vehicles' ? 'Create vehicle' : 'Add location'}
              </button>
            )}
          </div>

          <Dialog.Close asChild>
            <button
              className="absolute top-4 right-4 text-[#adadad] hover:text-white transition-colors"
              aria-label="Close"
            >
              <svg width="16" height="16" viewBox="0 0 15 15" fill="none">
                <path
                  d="m11.7816 4.03157c.0824-.07446.0824-.19618 0-.27064L11.4659 3.444c-.0746-.08243-.1962-.08243-.2708 0L7.5 7.1896 3.8047 3.444c-.0746-.08243-.1962-.08243-.2708 0L3.2184 3.76096c-.0824.07446-.0824.19618 0 .27064L7.2289 7.5 3.2184 11.4694c-.0824.0744-.0824.1961 0 .2706l.3155.3165c.0746.0824.1962.0824.2708 0L7.5 8.8104l3.6953 3.7456c.0746.0824.1962.0824.2708 0l.3155-.3165c.0824-.0745.0824-.1962 0-.2706L8.7711 7.5 11.7816 4.03157Z"
                  fill="currentColor"
                />
              </svg>
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}