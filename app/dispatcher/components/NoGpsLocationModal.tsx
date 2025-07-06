'use client'

import { useState, useEffect, useRef } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { Loader } from '@googlemaps/js-api-loader'

/// <reference types="@types/google.maps" />

interface NoGpsLocationModalProps {
  isOpen: boolean
  onClose: () => void
  onLocationSet: (location: string, lat: number, lng: number) => void
  vehicleName?: string
}

export default function NoGpsLocationModal({ 
  isOpen, 
  onClose, 
  onLocationSet,
  vehicleName = 'Vehicle'
}: NoGpsLocationModalProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const autocompleteRef = useRef<HTMLInputElement>(null)
  const [map, setMap] = useState<google.maps.Map | null>(null)
  const [marker, setMarker] = useState<google.maps.Marker | null>(null)
  const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null)
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number }>({ lat: 45.943, lng: 24.966 })
  const [searchValue, setSearchValue] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  // Initialize Google Maps
  useEffect(() => {
    if (!isOpen || !mapRef.current) return

    const initMap = async () => {
      const loader = new Loader({
        apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
        version: 'weekly',
        libraries: ['places']
      })

      try {
        await loader.load()
        
        // Initialize map with smooth animation
        const googleMap = new google.maps.Map(mapRef.current!, {
          center: currentLocation,
          zoom: 13,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          gestureHandling: 'cooperative'
        })

        // Initialize marker with custom icon
        const googleMarker = new google.maps.Marker({
          position: currentLocation,
          map: googleMap,
          draggable: true,
          title: `${vehicleName} location`,
          animation: google.maps.Animation.DROP,
          icon: {
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="#ef4444" viewBox="0 0 256 256">
                <path d="M128,64a40,40,0,1,0,40,40A40,40,0,0,0,128,64Zm0,64a24,24,0,1,1,24-24A24,24,0,0,1,128,128ZM128,16a88.1,88.1,0,0,0-88,88c0,31.4,14.51,64.68,42,96.25a254.19,254.19,0,0,0,41.45,38.3,8,8,0,0,0,9.18,0A254.19,254.19,0,0,0,174,200.25c27.45-31.57,42-64.85,42-96.25A88.1,88.1,0,0,0,128,16Zm0,206c-16.53-13-72-60.75-72-118a72,72,0,0,1,144,0C200,161.23,144.53,209,128,222Z"/>
              </svg>
            `),
            scaledSize: new google.maps.Size(32, 32),
            anchor: new google.maps.Point(16, 32)
          }
        })

        // Initialize autocomplete
        if (autocompleteRef.current) {
          const googleAutocomplete = new google.maps.places.Autocomplete(autocompleteRef.current, {
            types: ['geocode']
            // No componentRestrictions for global search
          })

          // Handle autocomplete selection with smooth animation
          googleAutocomplete.addListener('place_changed', () => {
            const place = googleAutocomplete.getPlace()
            if (place.geometry?.location) {
              const newPos = {
                lat: place.geometry.location.lat(),
                lng: place.geometry.location.lng()
              }
              updateMapLocation(newPos, googleMap, googleMarker, place.formatted_address || '')
            }
          })

          setAutocomplete(googleAutocomplete)
        }

        // Handle marker drag with smooth updates
        googleMarker.addListener('dragstart', () => {
          googleMarker.setAnimation(null)
        })

        googleMarker.addListener('dragend', () => {
          const position = googleMarker.getPosition()
          if (position) {
            const newPos = {
              lat: position.lat(),
              lng: position.lng()
            }
            setCurrentLocation(newPos)
            // Smooth pan to new position
            googleMap.panTo(newPos)
            // Clear search input when manually dragging
            setSearchValue('')
            if (autocompleteRef.current) {
              autocompleteRef.current.value = ''
            }
          }
        })

        setMap(googleMap)
        setMarker(googleMarker)
        setIsLoading(false)

      } catch (error) {
        console.error('Failed to load Google Maps:', error)
        setIsLoading(false)
      }
    }

    initMap()
  }, [isOpen, vehicleName])

  // Helper function to update map location with smooth animation
  const updateMapLocation = (newPos: { lat: number; lng: number }, googleMap: google.maps.Map, googleMarker: google.maps.Marker, address?: string) => {
    setCurrentLocation(newPos)
    
    // Smooth pan with zoom adjustment if needed
    googleMap.panTo(newPos)
    
    // If the zoom is too low, smooth zoom in
    if (googleMap.getZoom()! < 13) {
      googleMap.setZoom(13)
    }
    
    // Animate marker movement
    googleMarker.setPosition(newPos)
    googleMarker.setAnimation(google.maps.Animation.BOUNCE)
    
    // Stop bouncing after 1 second
    setTimeout(() => {
      googleMarker.setAnimation(null)
    }, 1000)
    
    // Update search value if address provided
    if (address) {
      setSearchValue(address)
      if (autocompleteRef.current) {
        autocompleteRef.current.value = address
      }
    }
  }

  // Use current location with enhanced UX
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by this browser.')
      return
    }

    // Show loading state
    setSearchValue('🌍 Getting your location...')

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newPos = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        }
        
        if (map && marker) {
          updateMapLocation(newPos, map, marker, `📍 Your current location`)
        }
      },
      (error) => {
        console.error('Error getting current location:', error)
        setSearchValue('')
        alert('Could not get your current location. Please check your location permissions.')
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 600000 }
    )
  }

  // Save location with enhanced feedback
  const handleSave = () => {
    const locationString = searchValue || `📍 ${currentLocation.lat.toFixed(6)}, ${currentLocation.lng.toFixed(6)}`
    onLocationSet(locationString, currentLocation.lat, currentLocation.lng)
    
    // Show success animation before closing
    if (marker) {
      marker.setAnimation(google.maps.Animation.BOUNCE)
      setTimeout(() => {
        marker.setAnimation(null)
        onClose()
      }, 500)
    } else {
      onClose()
    }
  }

  // Handle modal close
  const handleClose = () => {
    setSearchValue('')
    onClose()
  }

  return (
    <Dialog.Root open={isOpen} onOpenChange={handleClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#1a1a1a] border border-[#363636] rounded-xl p-6 w-full max-w-lg z-50 shadow-2xl">
          <Dialog.Title className="text-white text-lg font-bold mb-4 text-center">
            📍 Set Location for {vehicleName}
          </Dialog.Title>

          <div className="space-y-4">
            {/* Use current location button */}
            <button
              onClick={handleUseCurrentLocation}
              className="w-full bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 px-4 py-2 rounded-lg transition-colors flex items-center gap-2 border border-blue-500/30"
            >
              <span>🎯</span>
              <span>① Use my current location</span>
            </button>

            {/* Search input */}
            <div className="relative">
              <input
                ref={autocompleteRef}
                type="text"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder="② Search address / city globally"
                className="w-full bg-[#2d2d2d] border border-[#363636] rounded-lg px-3 py-2 text-white placeholder-[#666] focus:border-blue-400 focus:outline-none transition-colors"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#666]">🔍</span>
            </div>

            {/* Google Map */}
            <div className="relative">
              <div 
                ref={mapRef} 
                className="w-full h-64 rounded-lg overflow-hidden bg-[#2d2d2d] flex items-center justify-center border border-[#363636]"
              >
                {isLoading && (
                  <div className="text-[#666] flex flex-col items-center gap-2">
                    <div className="animate-spin text-2xl">🌍</div>
                    <div>Loading Interactive Map...</div>
                  </div>
                )}
              </div>
              
              {/* Coordinates display */}
              <div className="absolute bottom-2 left-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
                📍 {currentLocation.lat.toFixed(6)}, {currentLocation.lng.toFixed(6)}
              </div>
            </div>

            {/* Instructions */}
            <div className="text-[#666] text-xs text-center">
              💡 Tip: Drag the red marker to fine-tune the exact location
            </div>

            {/* Save button */}
            <button
              onClick={handleSave}
              disabled={isLoading}
              className="w-full bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <span>💾</span>
              <span>Save Location</span>
            </button>
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