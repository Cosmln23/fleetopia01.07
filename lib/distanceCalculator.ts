// Distance calculation utilities with caching support
interface Coordinates {
  lat: number
  lng: number
}

interface DistanceCache {
  [key: string]: number
}

// Simple in-memory cache for distance calculations
const distanceCache: DistanceCache = {}

/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in kilometers
 */
export function calculateDistance(from: Coordinates, to: Coordinates): number {
  const cacheKey = `${from.lat},${from.lng}-${to.lat},${to.lng}`
  
  // Check cache first
  if (distanceCache[cacheKey]) {
    return distanceCache[cacheKey]
  }

  const R = 6371 // Earth's radius in kilometers
  const dLat = toRadians(to.lat - from.lat)
  const dLng = toRadians(to.lng - from.lng)
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(from.lat)) * Math.cos(toRadians(to.lat)) * 
    Math.sin(dLng / 2) * Math.sin(dLng / 2)
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const distance = Math.round(R * c)
  
  // Cache the result
  distanceCache[cacheKey] = distance
  
  return distance
}

/**
 * Convert degrees to radians
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180)
}

/**
 * Estimate distance from postal codes or city names
 * This is a fallback when GPS coordinates are not available
 */
export function estimateDistanceFromLocations(fromAddress: string, toAddress: string): number {
  // Simple estimation based on common European routes
  // In production, this would use a proper geocoding service
  
  const routes: { [key: string]: number } = {
    'madrid-bucuresti': 1900,
    'bucuresti-madrid': 1900,
    'bucuresti-berlin': 1100,
    'berlin-bucuresti': 1100,
    'paris-roma': 1400,
    'roma-paris': 1400,
    'amsterdam-wien': 1200,
    'wien-amsterdam': 1200,
    'cluj-timisoara': 330,
    'timisoara-cluj': 330,
    'bucuresti-cluj': 460,
    'cluj-bucuresti': 460,
  }
  
  // Normalize addresses for lookup
  const normalizeAddress = (addr: string) => 
    addr.toLowerCase()
      .replace(/[^a-z]/g, '')
      .substring(0, 10) // Take first part of address
  
  const fromNorm = normalizeAddress(fromAddress)
  const toNorm = normalizeAddress(toAddress)
  const routeKey = `${fromNorm}-${toNorm}`
  
  // Look for exact match
  if (routes[routeKey]) {
    return routes[routeKey]
  }
  
  // Fallback estimation based on address length and common patterns
  const addressDistance = Math.abs(fromAddress.length - toAddress.length) * 50
  return Math.max(100, Math.min(2000, addressDistance + 500)) // Between 100-2000 km
}

/**
 * Get distance for a cargo offer, using GPS coordinates when available
 * or falling back to address-based estimation
 */
export function getCargoDistance(offer: {
  pickupLat?: number
  pickupLng?: number
  deliveryLat?: number
  deliveryLng?: number
  fromAddress: string
  toAddress: string
}): number {
  // Use GPS coordinates if available
  if (offer.pickupLat && offer.pickupLng && offer.deliveryLat && offer.deliveryLng) {
    return calculateDistance(
      { lat: offer.pickupLat, lng: offer.pickupLng },
      { lat: offer.deliveryLat, lng: offer.deliveryLng }
    )
  }
  
  // Fallback to address-based estimation
  return estimateDistanceFromLocations(offer.fromAddress, offer.toAddress)
}

/**
 * Format distance for display
 */
export function formatDistance(distance: number): string {
  if (distance < 1000) {
    return `≈ ${distance} km`
  } else {
    return `≈ ${(distance / 1000).toFixed(1)}k km`
  }
}