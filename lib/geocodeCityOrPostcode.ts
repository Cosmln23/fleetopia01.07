// Universal geocoding for European cities and postcodes

interface Coordinates {
  lat: number
  lng: number
}

// European cities database
const europeanCities: { [key: string]: Coordinates } = {
  // Romania
  'bucuresti': { lat: 44.4268, lng: 26.1025 },
  'bucharest': { lat: 44.4268, lng: 26.1025 },
  'cluj-napoca': { lat: 46.7712, lng: 23.6236 },
  'cluj': { lat: 46.7712, lng: 23.6236 },
  'timisoara': { lat: 45.7489, lng: 21.2087 },
  'iasi': { lat: 47.1585, lng: 27.6014 },
  'constanta': { lat: 44.1598, lng: 28.6348 },
  'craiova': { lat: 44.3302, lng: 23.7949 },
  'brasov': { lat: 45.6427, lng: 25.5887 },
  'oradea': { lat: 47.0722, lng: 21.9211 },
  'arad': { lat: 46.1667, lng: 21.3167 },
  'sibiu': { lat: 45.7983, lng: 24.1256 },
  
  // Germany
  'berlin': { lat: 52.5200, lng: 13.4050 },
  'munich': { lat: 48.1351, lng: 11.5820 },
  'hamburg': { lat: 53.5511, lng: 9.9937 },
  'cologne': { lat: 50.9375, lng: 6.9603 },
  'frankfurt': { lat: 50.1109, lng: 8.6821 },
  'stuttgart': { lat: 48.7758, lng: 9.1829 },
  'dusseldorf': { lat: 51.2277, lng: 6.7735 },
  'dortmund': { lat: 51.5136, lng: 7.4653 },
  'essen': { lat: 51.4556, lng: 7.0116 },
  'bremen': { lat: 53.0793, lng: 8.8017 },
  
  // France
  'paris': { lat: 48.8566, lng: 2.3522 },
  'marseille': { lat: 43.2965, lng: 5.3698 },
  'lyon': { lat: 45.7640, lng: 4.8357 },
  'toulouse': { lat: 43.6047, lng: 1.4442 },
  'nice': { lat: 43.7102, lng: 7.2620 },
  'nantes': { lat: 47.2184, lng: -1.5536 },
  'strasbourg': { lat: 48.5734, lng: 7.7521 },
  'montpellier': { lat: 43.6108, lng: 3.8767 },
  'bordeaux': { lat: 44.8378, lng: -0.5792 },
  
  // Italy
  'rome': { lat: 41.9028, lng: 12.4964 },
  'milan': { lat: 45.4642, lng: 9.1900 },
  'naples': { lat: 40.8518, lng: 14.2681 },
  'turin': { lat: 45.0703, lng: 7.6869 },
  'palermo': { lat: 38.1157, lng: 13.3615 },
  'genoa': { lat: 44.4056, lng: 8.9463 },
  'bologna': { lat: 44.4949, lng: 11.3426 },
  'florence': { lat: 43.7696, lng: 11.2558 },
  'venice': { lat: 45.4408, lng: 12.3155 },
  
  // Spain
  'madrid': { lat: 40.4168, lng: -3.7038 },
  'barcelona': { lat: 41.3851, lng: 2.1734 },
  'valencia': { lat: 39.4699, lng: -0.3763 },
  'seville': { lat: 37.3891, lng: -5.9845 },
  'zaragoza': { lat: 41.6488, lng: -0.8891 },
  'malaga': { lat: 36.7213, lng: -4.4213 },
  'bilbao': { lat: 43.2627, lng: -2.9253 },
  
  // Netherlands
  'amsterdam': { lat: 52.3676, lng: 4.9041 },
  'rotterdam': { lat: 51.9244, lng: 4.4777 },
  'the-hague': { lat: 52.0705, lng: 4.3007 },
  'utrecht': { lat: 52.0907, lng: 5.1214 },
  'eindhoven': { lat: 51.4416, lng: 5.4697 },
  
  // Belgium
  'brussels': { lat: 50.8503, lng: 4.3517 },
  'antwerp': { lat: 51.2194, lng: 4.4025 },
  'ghent': { lat: 51.0543, lng: 3.7174 },
  'bruges': { lat: 51.2093, lng: 3.2247 },
  
  // Austria
  'vienna': { lat: 48.2082, lng: 16.3738 },
  'salzburg': { lat: 47.8095, lng: 13.0550 },
  'innsbruck': { lat: 47.2692, lng: 11.4041 },
  'graz': { lat: 47.0707, lng: 15.4395 },
  
  // Hungary
  'budapest': { lat: 47.4979, lng: 19.0402 },
  'debrecen': { lat: 47.5316, lng: 21.6273 },
  'szeged': { lat: 46.2530, lng: 20.1414 },
  
  // Poland
  'warsaw': { lat: 52.2297, lng: 21.0122 },
  'krakow': { lat: 50.0647, lng: 19.9450 },
  'gdansk': { lat: 54.3520, lng: 18.6466 },
  'wroclaw': { lat: 51.1079, lng: 17.0385 },
  'poznan': { lat: 52.4064, lng: 16.9252 },
  
  // Czech Republic
  'prague': { lat: 50.0755, lng: 14.4378 },
  'brno': { lat: 49.1951, lng: 16.6068 },
  'ostrava': { lat: 49.8209, lng: 18.2625 },
  
  // Other European capitals
  'london': { lat: 51.5074, lng: -0.1278 },
  'dublin': { lat: 53.3498, lng: -6.2603 },
  'lisbon': { lat: 38.7223, lng: -9.1393 },
  'stockholm': { lat: 59.3293, lng: 18.0686 },
  'oslo': { lat: 59.9139, lng: 10.7522 },
  'copenhagen': { lat: 55.6761, lng: 12.5683 },
  'helsinki': { lat: 60.1699, lng: 24.9384 },
  'zurich': { lat: 47.3769, lng: 8.5417 }
}

// Postcode patterns for major Romanian regions
const postcodeRegions: { [pattern: string]: Coordinates } = {
  // Bucharest postcodes (01xxxx - 06xxxx)
  '01': { lat: 44.4268, lng: 26.1025 },
  '02': { lat: 44.4268, lng: 26.1025 },
  '03': { lat: 44.4268, lng: 26.1025 },
  '04': { lat: 44.4268, lng: 26.1025 },
  '05': { lat: 44.4268, lng: 26.1025 },
  '06': { lat: 44.4268, lng: 26.1025 },
  
  // Cluj postcodes (40xxxx - 41xxxx)
  '40': { lat: 46.7712, lng: 23.6236 },
  '41': { lat: 46.7712, lng: 23.6236 },
  
  // Timis postcodes (30xxxx - 31xxxx)
  '30': { lat: 45.7489, lng: 21.2087 },
  '31': { lat: 45.7489, lng: 21.2087 },
  
  // Iasi postcodes (70xxxx - 71xxxx)
  '70': { lat: 47.1585, lng: 27.6014 },
  '71': { lat: 47.1585, lng: 27.6014 },
  
  // Constanta postcodes (90xxxx - 91xxxx)
  '90': { lat: 44.1598, lng: 28.6348 },
  '91': { lat: 44.1598, lng: 28.6348 }
}

/**
 * Geocode a European city name or postcode to coordinates
 * @param location City name or postcode
 * @returns Coordinates or null if not found
 */
export function geocodeCityOrPostcode(location: string): Coordinates | null {
  if (!location) return null
  
  const normalized = location.toLowerCase().trim()
  
  // Try exact city match first
  if (europeanCities[normalized]) {
    return europeanCities[normalized]
  }
  
  // Try partial city match (for variations like "Cluj Napoca" vs "Cluj-Napoca")
  const cityKeys = Object.keys(europeanCities)
  const partialMatch = cityKeys.find(key => 
    key.includes(normalized) || normalized.includes(key)
  )
  
  if (partialMatch) {
    return europeanCities[partialMatch]
  }
  
  // Try postcode pattern matching (for Romanian postcodes)
  const postcodeMatch = normalized.match(/^(\d{2})\d{4}$/)
  if (postcodeMatch) {
    const region = postcodeMatch[1]
    if (postcodeRegions[region]) {
      return postcodeRegions[region]
    }
  }
  
  // Return null if not found (no default fallback)
  return null
}

/**
 * Get all available European cities for autocomplete
 */
export function getEuropeanCities(): string[] {
  return Object.keys(europeanCities).map(city => 
    city.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join('-')
  )
}

/**
 * Validate if a location string is likely a European city or postcode
 */
export function isValidLocation(location: string): boolean {
  if (!location) return false
  
  const normalized = location.toLowerCase().trim()
  
  // Check if it's a known city
  if (europeanCities[normalized]) return true
  
  // Check if it's a valid Romanian postcode format
  if (/^\d{6}$/.test(normalized)) return true
  
  // Check partial city matches
  const cityKeys = Object.keys(europeanCities)
  return cityKeys.some(key => 
    key.includes(normalized) || normalized.includes(key)
  )
}

// Legacy aliases for backward compatibility
export const getRomanianCities = getEuropeanCities
export const isValidRomanianLocation = isValidLocation