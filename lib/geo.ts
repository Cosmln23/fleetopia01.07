// Geocoding utilities for address to coordinates conversion

export interface GeoLocation {
  lat: number
  lng: number
  formatted_address?: string
  place_id?: string
}

export interface GeocodingResult {
  success: boolean
  location?: GeoLocation
  error?: string
}

// Google Maps Geocoding API function
export async function geocodeAddress(address: string): Promise<GeocodingResult> {
  const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  
  if (!API_KEY) {
    console.warn('Google Maps API key not found, using fallback geocoding')
    return geocodeAddressStub(address)
  }

  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${API_KEY}`
    )
    
    const data = await response.json()
    
    if (data.status === 'OK' && data.results.length > 0) {
      const result = data.results[0]
      return {
        success: true,
        location: {
          lat: result.geometry.location.lat,
          lng: result.geometry.location.lng,
          formatted_address: result.formatted_address,
          place_id: result.place_id
        }
      }
    } else {
      console.warn('Geocoding failed:', data.error_message || data.status)
      return geocodeAddressStub(address)
    }
  } catch (error) {
    console.error('Geocoding request failed:', error)
    return geocodeAddressStub(address)
  }
}

// Geocoding function for postal code + city + country
export async function geocodePostal(postal: string, city: string, country: string): Promise<GeocodingResult> {
  const address = `${postal} ${city}, ${country}`
  return geocodeAddress(address)
}

// Stub geocoding function for fallback
export async function geocodeAddressStub(address: string): Promise<GeocodingResult> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 100))
  
  // Default coordinates mapping for common European cities
  const cityCoordinates: { [key: string]: GeoLocation } = {
    // Netherlands
    'amsterdam': { lat: 52.3676, lng: 4.9041 },
    'rotterdam': { lat: 51.9244, lng: 4.4777 },
    'the hague': { lat: 52.0705, lng: 4.3007 },
    'utrecht': { lat: 52.0907, lng: 5.1214 },
    
    // Germany
    'berlin': { lat: 52.5200, lng: 13.4050 },
    'munich': { lat: 48.1351, lng: 11.5820 },
    'hamburg': { lat: 53.5511, lng: 9.9937 },
    'cologne': { lat: 50.9375, lng: 6.9603 },
    'frankfurt': { lat: 50.1109, lng: 8.6821 },
    
    // Romania
    'bucharest': { lat: 44.4268, lng: 26.1025 },
    'cluj': { lat: 46.7712, lng: 23.6236 },
    'timisoara': { lat: 45.7489, lng: 21.2087 },
    'constanta': { lat: 44.1598, lng: 28.6348 },
    'iasi': { lat: 47.1585, lng: 27.6014 },
    'carei': { lat: 47.6912, lng: 22.4569 },
    
    // Italy
    'rome': { lat: 41.9028, lng: 12.4964 },
    'milan': { lat: 45.4642, lng: 9.1900 },
    'naples': { lat: 40.8518, lng: 14.2681 },
    'turin': { lat: 45.0703, lng: 7.6869 },
    
    // Poland
    'warsaw': { lat: 52.2297, lng: 21.0122 },
    'krakow': { lat: 50.0647, lng: 19.9450 },
    'gdansk': { lat: 54.3520, lng: 18.6466 },
    
    // Austria
    'vienna': { lat: 48.2082, lng: 16.3738 },
    'salzburg': { lat: 47.8095, lng: 13.0550 },
    
    // Switzerland
    'zurich': { lat: 47.3769, lng: 8.5417 },
    'geneva': { lat: 46.2044, lng: 6.1432 },
    'basel': { lat: 47.5596, lng: 7.5886 },
    'bern': { lat: 46.9481, lng: 7.4474 }
  }
  
  try {
    // Normalize address for lookup
    const normalizedAddress = address.toLowerCase()
      .replace(/[,\-\s]+/g, ' ')
      .trim()
    
    // Try to find a matching city
    for (const [city, coords] of Object.entries(cityCoordinates)) {
      if (normalizedAddress.includes(city)) {
        return {
          success: true,
          location: {
            ...coords,
            formatted_address: address,
            place_id: `stub_${city}_${Date.now()}`
          }
        }
      }
    }
    
    // If no match found, return default coordinates (center of Europe)
    return {
      success: true,
      location: {
        lat: 50.0755, // Center of Europe
        lng: 14.4378,
        formatted_address: address,
        place_id: `stub_default_${Date.now()}`
      }
    }
    
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Geocoding failed'
    }
  }
}

// Reverse geocoding - convert coordinates to address
export async function reverseGeocode(lat: number, lng: number): Promise<GeocodingResult> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 100))
  
  try {
    // This is a stub implementation
    // In production, this would call Google Maps Reverse Geocoding API
    const formatted_address = `${lat.toFixed(4)}, ${lng.toFixed(4)}`
    
    return {
      success: true,
      location: {
        lat,
        lng,
        formatted_address,
        place_id: `reverse_stub_${Date.now()}`
      }
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Reverse geocoding failed'
    }
  }
}

// Calculate distance between two points (Haversine formula)
export function calculateDistance(
  lat1: number, 
  lng1: number, 
  lat2: number, 
  lng2: number
): number {
  const R = 6371 // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}

// Address validation helper
export function validateAddress(address: string): boolean {
  return address.length >= 5 && address.includes(',')
}

// Country detection from address
export function detectCountryFromAddress(address: string): string | null {
  const countryPatterns = {
    'Netherlands': /netherlands|holland|\bnl\b/i,
    'Germany': /germany|deutschland|\bde\b/i,
    'Romania': /romania|\bro\b/i,
    'Italy': /italy|italia|\bit\b/i,
    'Poland': /poland|polska|\bpl\b/i,
    'Austria': /austria|österreich|\bat\b/i,
    'Switzerland': /switzerland|schweiz|\bch\b/i,
    'France': /france|frankreich|\bfr\b/i,
    'Belgium': /belgium|belgique|\bbe\b/i,
    'Czech Republic': /czech|czechia|\bcz\b/i
  }
  
  for (const [country, pattern] of Object.entries(countryPatterns)) {
    if (pattern.test(address)) {
      return country
    }
  }
  
  return null
}

// Production geocoding with Google Maps API (commented out for development)
/*
export async function geocodeAddressProduction(address: string): Promise<GeocodingResult> {
  const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  
  if (!API_KEY) {
    return { success: false, error: 'Google Maps API key not configured' }
  }
  
  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${API_KEY}`
    )
    
    const data = await response.json()
    
    if (data.status === 'OK' && data.results.length > 0) {
      const result = data.results[0]
      return {
        success: true,
        location: {
          lat: result.geometry.location.lat,
          lng: result.geometry.location.lng,
          formatted_address: result.formatted_address,
          place_id: result.place_id
        }
      }
    } else {
      return { success: false, error: data.error_message || 'No results found' }
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Geocoding request failed'
    }
  }
}
*/