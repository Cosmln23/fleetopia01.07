'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import debounce from 'lodash.debounce'
import { loadGoogle } from '@/lib/google'

/// <reference types="@types/google.maps" />

// Fleetopia dark map styling
const fleetopiaMapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#1a1a1a' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#1a1a1a' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#adadad' }] },
  { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#ffffff' }] },
  { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#adadad' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#2d2d2d' }] },
  { featureType: 'poi.park', elementType: 'labels.text.fill', stylers: [{ color: '#6b7280' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#363636' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#4d4d4d' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#ffffff' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#4d4d4d' }] },
  { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#6b7280' }] },
  { featureType: 'road.highway', elementType: 'labels.text.fill', stylers: [{ color: '#ffffff' }] },
  { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#2d2d2d' }] },
  { featureType: 'transit.station', elementType: 'labels.text.fill', stylers: [{ color: '#adadad' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0f172a' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#6b7280' }] }
]

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
  const mapInstanceRef = useRef<google.maps.Map | null>(null)
  const markerInstanceRef = useRef<google.maps.Marker | null>(null)
  const autocompleteInstanceRef = useRef<google.maps.places.Autocomplete | null>(null)
  const [map, setMap] = useState<google.maps.Map | null>(null)
  const [marker, setMarker] = useState<google.maps.Marker | null>(null)
  const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null)
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number }>({ lat: 45.943, lng: 24.966 })
  const [searchValue, setSearchValue] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [initAttempts, setInitAttempts] = useState(0)

  // Debounced search to prevent API spam
  const debouncedSearch = useMemo(
    () => debounce((query: string) => {
      console.log('[SEARCH] 🎯 Search triggered for:', query)
      
      if (!query.trim()) {
        console.log('[SEARCH] ⏭️ Skipping empty query')
        return
      }
      
      // Only search if map is fully loaded
      if (!map || !marker || isLoading) {
        console.log('[SEARCH] ⚠️ Map not ready yet, search skipped')
        return
      }
      
      if (!window.google || !window.google.maps || !window.google.maps.places) {
        console.log('[SEARCH] ❌ Google API not ready')
        return
      }
      
      console.log('[SEARCH] 🔍 Starting search for:', query)
      
      try {
        const service = new google.maps.places.AutocompleteService()
        
        service.getPlacePredictions(
          { 
            input: query,
            types: ['geocode']
          },
          (predictions, status) => {
            console.log('[SEARCH] 📊 API Response - Status:', status)
            
            if (status !== google.maps.places.PlacesServiceStatus.OK) {
              console.warn('[SEARCH] ⚠️ Search failed with status:', status)
              return
            }
            
            if (predictions && predictions.length > 0) {
              console.log('[SEARCH] ✅ Found predictions, getting details for first result')
              const placesService = new google.maps.places.PlacesService(mapRef.current!)
              placesService.getDetails(
                { placeId: predictions[0].place_id },
                (place, detailStatus) => {
                  console.log('[SEARCH] 📊 Place details status:', detailStatus)
                  
                  if (detailStatus === google.maps.places.PlacesServiceStatus.OK && place?.geometry?.location) {
                    const newPos = {
                      lat: place.geometry.location.lat(),
                      lng: place.geometry.location.lng()
                    }
                    console.log('[SEARCH] ✅ Found location:', newPos)
                    
                    // Map and marker are guaranteed to exist here
                    updateMapLocation(newPos, map, marker, place.formatted_address || query)
                  } else {
                    console.error('[SEARCH] ❌ Failed to get place details:', detailStatus)
                  }
                }
              )
            } else {
              console.log('[SEARCH] 📊 No predictions found')
            }
          }
        )
      } catch (error) {
        console.error('[SEARCH] ❌ Search error:', error)
      }
    }, 300),
    [map, marker, isLoading]
  )

  // Cleanup function
  const cleanupMap = () => {
    console.log('[MAP] 🧹 Starting cleanup...')
    
    // Clear event listeners first
    if (mapInstanceRef.current) {
      google.maps.event.clearInstanceListeners(mapInstanceRef.current)
    }
    if (markerInstanceRef.current) {
      google.maps.event.clearInstanceListeners(markerInstanceRef.current)
    }
    if (autocompleteInstanceRef.current) {
      google.maps.event.clearInstanceListeners(autocompleteInstanceRef.current)
    }
    
    // Clear map container manually
    if (mapRef.current) {
      mapRef.current.innerHTML = ''
    }
    
    // Reset refs
    mapInstanceRef.current = null
    markerInstanceRef.current = null
    autocompleteInstanceRef.current = null
    
    // Reset state
    setMap(null)
    setMarker(null)
    setAutocomplete(null)
    setIsLoading(true)
    setError(null)
    
    console.log('[MAP] ✅ Cleanup complete')
  }

  // Initialize Google Maps using clean loader
  useEffect(() => {
    console.log('[MAP] 🔍 Map useEffect - isOpen:', isOpen, 'mapRef.current:', !!mapRef.current, 'attempts:', initAttempts)
    
    if (!isOpen) {
      console.log('[MAP] ⏭️ Modal not open')
      // Clean up existing map when modal closes
      cleanupMap()
      setInitAttempts(0)
      return;
    }
    
    // Prevent infinite retries
    if (initAttempts >= 3) {
      console.log('[MAP] ❌ Max initialization attempts reached')
      setError('Failed to load map after multiple attempts. Please refresh the page.')
      setIsLoading(false)
      return;
    }
    
    setInitAttempts(prev => prev + 1)
    
    // Use timeout to ensure DOM is rendered
    const timeout = setTimeout(() => {
      console.log('[MAP] ⏰ Timeout check - mapRef.current:', !!mapRef.current)
      console.log('[MAP] 🔍 DOM element:', mapRef.current)
      console.log('[MAP] 🔍 Element dimensions:', mapRef.current?.offsetWidth, 'x', mapRef.current?.offsetHeight)
      console.log('[MAP] 🔍 window.google exists:', !!window.google)
      console.log('[MAP] 🔍 window.google.maps exists:', !!window.google?.maps)
      console.log('[MAP] 🔍 window.google.maps.places exists:', !!window.google?.maps?.places)
      
      if (!mapRef.current) {
        console.log('[MAP] ❌ mapRef still not ready after timeout')
        // Try again with fallback
        setError('Map container not ready. Please close and reopen.')
        setIsLoading(false)
        return;
      }

      console.log('[MAP] 🚀 Starting clean Google Maps initialization...')
      setError(null)
      setIsLoading(true)

      // Check if Google Maps is available
      if (window.google && window.google.maps) {
        console.log('[MAP] ✅ Using existing Google Maps, creating map...')
        
        try {
          // Initialize map with Fleetopia dark theme
          const googleMap = new google.maps.Map(mapRef.current!, {
            center: currentLocation,
            zoom: 13,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false,
            gestureHandling: 'cooperative',
            styles: fleetopiaMapStyle,
            backgroundColor: '#1a1a1a'
          })

          // Store in ref for cleanup
          mapInstanceRef.current = googleMap
          console.log('[MAP] ✅ Map created successfully:', googleMap)

          // Wait for map to be ready before creating marker
          google.maps.event.addListenerOnce(googleMap, 'idle', () => {
            console.log('[MAP] ✅ Map is ready, creating marker...')
            
            // Initialize marker
            const googleMarker = new google.maps.Marker({
              position: currentLocation,
              map: googleMap,
              draggable: true,
              title: `${vehicleName} location`,
              animation: google.maps.Animation.DROP,
              icon: {
                url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 256 256">
                    <path d="M128,16a88.1,88.1,0,0,0-88,88c0,31.4,14.51,64.68,42,96.25a254.19,254.19,0,0,0,41.45,38.3,8,8,0,0,0,9.18,0A254.19,254.19,0,0,0,174,200.25c27.45-31.57,42-64.85,42-96.25A88.1,88.1,0,0,0,128,16Zm0,206c-16.53-13-72-60.75-72-118a72,72,0,0,1,144,0C200,161.23,144.53,209,128,222Z" fill="#adadad"/>
                    <circle cx="128" cy="104" r="24" fill="#1a1a1a" stroke="#adadad" stroke-width="2"/>
                  </svg>
                `),
                scaledSize: new google.maps.Size(32, 32),
                anchor: new google.maps.Point(16, 32)
              }
            })

            // Store in ref for cleanup
            markerInstanceRef.current = googleMarker
            console.log('[MAP] ✅ Marker created, setting up autocomplete...')

            // Initialize autocomplete - Places API is guaranteed to be available
            if (autocompleteRef.current && window.google.maps.places) {
              const googleAutocomplete = new google.maps.places.Autocomplete(autocompleteRef.current, {
                types: ['geocode']
              })

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

              // Store in ref for cleanup
              autocompleteInstanceRef.current = googleAutocomplete
              setAutocomplete(googleAutocomplete)
              console.log('[MAP] ✅ Autocomplete initialized')
            }

            // Handle marker drag
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
                googleMap.panTo(newPos)
                setSearchValue('')
                if (autocompleteRef.current) {
                  autocompleteRef.current.value = ''
                }
              }
            })

            setMap(googleMap)
            setMarker(googleMarker)
            setIsLoading(false)
            
            console.log('[MAP] 🎉 Everything initialized successfully!')
          })
          
        } catch (error) {
          console.error('[MAP] ❌ Error creating map:', error)
          setError('Failed to initialize map. Please try again.')
          setIsLoading(false)
        }
        
      } else {
        console.log('[MAP] ⚠️ Google Maps not loaded yet, using fallback loader...')
        
        loadGoogle().then((google) => {
          console.log('[MAP] ✅ Fallback loader complete, creating map...')
          
          if (!mapRef.current) {
            console.log('[MAP] ❌ mapRef lost during loading')
            setError('Map container lost during loading. Please try again.')
            setIsLoading(false)
            return
          }
          
          try {
            // Same map creation logic as above
            const googleMap = new google.maps.Map(mapRef.current!, {
              center: currentLocation,
              zoom: 13,
              mapTypeControl: false,
              streetViewControl: false,
              fullscreenControl: false,
              gestureHandling: 'cooperative',
              styles: fleetopiaMapStyle,
              backgroundColor: '#1a1a1a'
            })

            mapInstanceRef.current = googleMap
            console.log('[MAP] ✅ Fallback map created successfully')

            google.maps.event.addListenerOnce(googleMap, 'idle', () => {
              console.log('[MAP] ✅ Fallback map is ready')
              
              const googleMarker = new google.maps.Marker({
                position: currentLocation,
                map: googleMap,
                draggable: true,
                title: `${vehicleName} location`,
                animation: google.maps.Animation.DROP,
                icon: {
                  url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 256 256">
                      <path d="M128,16a88.1,88.1,0,0,0-88,88c0,31.4,14.51,64.68,42,96.25a254.19,254.19,0,0,0,41.45,38.3,8,8,0,0,0,9.18,0A254.19,254.19,0,0,0,174,200.25c27.45-31.57,42-64.85,42-96.25A88.1,88.1,0,0,0,128,16Zm0,206c-16.53-13-72-60.75-72-118a72,72,0,0,1,144,0C200,161.23,144.53,209,128,222Z" fill="#adadad"/>
                      <circle cx="128" cy="104" r="24" fill="#1a1a1a" stroke="#adadad" stroke-width="2"/>
                    </svg>
                  `),
                  scaledSize: new google.maps.Size(32, 32),
                  anchor: new google.maps.Point(16, 32)
                }
              })

              markerInstanceRef.current = googleMarker

              // Marker event listeners
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
                  googleMap.panTo(newPos)
                  setSearchValue('')
                  if (autocompleteRef.current) {
                    autocompleteRef.current.value = ''
                  }
                }
              })

              setMap(googleMap)
              setMarker(googleMarker)
              setIsLoading(false)
              
              console.log('[MAP] 🎉 Fallback initialization complete!')
            })
            
          } catch (error) {
            console.error('[MAP] ❌ Fallback map creation failed:', error)
            setError('Failed to create map. Please try again.')
            setIsLoading(false)
          }
          
        }).catch((error) => {
          console.error('[MAP] ❌ Failed to load Google Maps:', error)
          setError('Failed to load Google Maps. Please check your internet connection and try again.')
          setIsLoading(false)
        })
      }
    }, 200) // Slightly longer delay for DOM rendering

    return () => {
      clearTimeout(timeout)
    }
  }, [isOpen, vehicleName])

  // Safety timeout to prevent infinite loading
  useEffect(() => {
    if (!isOpen || !isLoading) return

    const safetyTimeout = setTimeout(() => {
      console.log('[MAP] ⚠️ Safety timeout triggered - forcing error state')
      setError('Map loading timed out. Please close and try again.')
      setIsLoading(false)
    }, 10000) // 10 seconds max loading time

    return () => clearTimeout(safetyTimeout)
  }, [isOpen, isLoading])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupMap()
    }
  }, [])
  
  // Trigger map resize when modal becomes visible
  useEffect(() => {
    if (isOpen && map && !isLoading) {
      setTimeout(() => {
        google.maps.event.trigger(map, 'resize')
        console.log('[MAP] 🔄 Map resize triggered')
      }, 150)
    }
  }, [isOpen, map, isLoading])

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

    console.log('[GPS] 📍 Requesting current location...')
    setSearchValue('Getting your location...')

    navigator.geolocation.getCurrentPosition(
      (position) => {
        console.log('[GPS] ✅ Location obtained:', position.coords)
        const newPos = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        }
        
        if (map && marker) {
          updateMapLocation(newPos, map, marker, 'Your current location')
        }
        
        // Clear the loading text
        setSearchValue('')
      },
      (error) => {
        console.error('[GPS] ❌ Geolocation error:', error)
        setSearchValue('') // Clear loading text on error
        
        let errorMessage = 'Could not get your current location.'
        if (error.code === error.PERMISSION_DENIED) {
          errorMessage = 'Location access denied. Please enable location permissions.'
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          errorMessage = 'Location information unavailable.'
        } else if (error.code === error.TIMEOUT) {
          errorMessage = 'Location request timed out.'
        }
        
        alert(errorMessage)
      },
      { 
        enableHighAccuracy: true, 
        timeout: 10000, 
        maximumAge: 300000 // 5 minutes
      }
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
        <Dialog.Content 
          className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#1a1a1a] border border-[#363636] rounded-xl p-6 w-full max-w-lg z-50 shadow-2xl"
        >
          <Dialog.Title className="text-white text-lg font-bold mb-4 text-center">
            📍 Set Location for {vehicleName}
          </Dialog.Title>
          
          <Dialog.Description className="text-[#adadad] text-sm text-center mb-4">
            Select a location using search, GPS, or by dragging the map pin
          </Dialog.Description>

          <div className="space-y-4">
            {/* Map container - ALWAYS rendered so mapRef exists */}
            <div className="relative">
              <div className="w-full h-64 rounded-xl overflow-hidden bg-[#2d2d2d] border border-[#363636] flex items-center justify-center">
                {isLoading ? (
                  /* Loading overlay */
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#2d2d2d] z-10">
                    <div className="animate-spin mb-4">
                      <svg xmlns="http://www.w3.org/2000/svg" width="32px" height="32px" fill="currentColor" viewBox="0 0 256 256" className="text-[#adadad]">
                        <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Z" opacity=".2"></path>
                        <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm78.38,47.66a7.89,7.89,0,0,1-2.15.94,15.93,15.93,0,0,1-4.16.54c-13.14,0-26.13-11.7-35.2-23.79C158.73,37.79,144.67,32,128,32S97.27,37.79,91.13,49.35C82.06,61.44,69.07,73.14,55.93,73.14a15.93,15.93,0,0,1-4.16-.54,7.89,7.89,0,0,1-2.15-.94A88.08,88.08,0,0,1,128,40C170.53,40,205.94,62.81,206.38,71.66Z"></path>
                      </svg>
                    </div>
                    <div className="text-[#adadad] font-medium text-lg">Loading Interactive Map...</div>
                    <div className="text-[#666] text-sm mt-2">Preparing location services</div>
                  </div>
                ) : error ? (
                  /* Error overlay */
                  <div className="absolute inset-0 flex items-center justify-center bg-[#2d2d2d] z-10">
                    <div className="text-red-400 text-sm p-4 bg-red-500/10 rounded-lg border border-red-500/20 max-w-xs text-center">
                      <div className="font-medium mb-1">Map Loading Failed</div>
                      <div className="text-xs opacity-90">{error}</div>
                    </div>
                  </div>
                ) : null}
                
                {/* Map container - ALWAYS exists for ref */}
                <div 
                  ref={mapRef} 
                  className="w-full h-full"
                  style={{ visibility: isLoading || error ? 'hidden' : 'visible' }}
                />
              </div>
              
              {/* Coordinates display - only when loaded */}
              {!isLoading && !error && (
                <div className="absolute bottom-2 left-2 bg-[#1a1a1a]/90 backdrop-blur-sm text-white text-xs px-3 py-1 rounded-lg border border-[#363636]/50">
                  📍 {currentLocation.lat.toFixed(6)}, {currentLocation.lng.toFixed(6)}
                </div>
              )}
            </div>

            {/* Controls - only when loaded */}
            {!isLoading && !error && (
              <>
                {/* Use current location button */}
                <button
                  onClick={handleUseCurrentLocation}
                  className="w-full bg-[#2d2d2d] hover:bg-[#363636] text-[#adadad] hover:text-white px-4 py-2 rounded-xl transition-colors flex items-center gap-2 border border-[#4d4d4d] font-medium text-sm"
                >
                  <div className="text-[#adadad]" data-icon="Target" data-size="16px" data-weight="regular">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16px" height="16px" fill="currentColor" viewBox="0 0 256 256">
                      <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm0-160a72,72,0,1,0,72,72A72.08,72.08,0,0,0,128,56Zm0,128a56,56,0,1,1,56-56A56.06,56.06,0,0,1,128,184Z"></path>
                    </svg>
                  </div>
                  <span>Use my current location</span>
                </button>

                {/* Search input */}
                <div className="relative">
                  <input
                    ref={autocompleteRef}
                    type="text"
                    value={searchValue}
                    onChange={(e) => {
                      setSearchValue(e.target.value)
                      debouncedSearch(e.target.value)
                    }}
                    placeholder="Search address / city globally"
                    className="w-full bg-[#363636] border border-[#4d4d4d] rounded-xl px-4 py-2 pr-10 text-white placeholder-[#adadad] focus:border-[#adadad] focus:outline-none transition-colors font-medium text-sm"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[#adadad]" data-icon="MagnifyingGlass" data-size="16px" data-weight="regular">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16px" height="16px" fill="currentColor" viewBox="0 0 256 256">
                      <path d="M229.66,218.34l-50.07-50.06a88.11,88.11,0,1,0-11.31,11.31l50.06,50.07a8,8,0,0,0,11.32-11.32ZM40,112a72,72,0,1,1,72,72A72.08,72.08,0,0,1,40,112Z"></path>
                    </svg>
                  </div>
                </div>

                {/* Instructions - Fleetopia styled */}
                <div className="text-[#adadad] text-xs text-center font-medium">
                  Tip: Drag the marker to fine-tune the exact location
                </div>

                {/* Save button - Fleetopia styled */}
                <button
                  onClick={handleSave}
                  className="w-full bg-[#363636] hover:bg-[#4d4d4d] text-white px-4 py-2 rounded-xl font-medium text-sm transition-colors flex items-center justify-center gap-2"
                >
                  <div className="text-white" data-icon="FloppyDisk" data-size="16px" data-weight="regular">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16px" height="16px" fill="currentColor" viewBox="0 0 256 256">
                      <path d="M224,48H180.69L161.37,28.68A15.89,15.89,0,0,0,150.06,24H72A16,16,0,0,0,56,40V216a16,16,0,0,0,16,16H184a16,16,0,0,0,16-16V168a8,8,0,0,1,8-8h8a8,8,0,0,0,8-8V64A16,16,0,0,0,224,48ZM72,40h78.06l16,16H72ZM72,216V168a24,24,0,0,1,24-24h80V216Z"></path>
                    </svg>
                  </div>
                  <span>Save Location</span>
                </button>
              </>
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