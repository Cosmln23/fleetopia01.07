/**
 * Google Maps utility functions for cargo route visualization
 */

/**
 * Generate Google Maps directions URL for route between two addresses
 * @param from - Complete origin address
 * @param to - Complete destination address
 * @returns Google Maps directions URL
 */
export function getGoogleMapsDirURL(from: string, to: string): string {
  const baseUrl = 'https://www.google.com/maps/dir/'
  const encodedFrom = encodeURIComponent(from)
  const encodedTo = encodeURIComponent(to)
  
  return `${baseUrl}${encodedFrom}/${encodedTo}/`
}

/**
 * Build complete address string from cargo location data
 * @param address - Street address
 * @param city - City name
 * @param postalCode - Postal/ZIP code
 * @param country - Country name
 * @returns Formatted complete address string
 */
export function buildCompleteAddress(
  address: string,
  city?: string,
  postalCode?: string,
  country?: string
): string {
  const parts = [address]
  
  if (city || postalCode) {
    const cityPart = [postalCode, city].filter(Boolean).join(' ')
    if (cityPart) parts.push(cityPart)
  }
  
  if (country) {
    parts.push(country)
  }
  
  return parts.join(', ')
}