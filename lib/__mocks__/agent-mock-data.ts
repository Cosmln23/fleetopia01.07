// DISPATCHER AI MOCK SYSTEM
// Simulează Agent L0-L4 cu mock data

import { mockCargoOffers, type CargoOffer } from '../mock-data'
import { fleetMockApi, type Vehicle } from './fleet-mock-data'

export interface DispatcherSuggestion {
  id: string
  offerId: string
  offer: CargoOffer
  vehicleId: string
  vehicle: Vehicle
  cost: number
  quote: number
  profit: number
  profitPct: number
  score: number
  distance: number
  level: 'L0' | 'L1' | 'L2' | 'L3' | 'L4'
  status: 'pending' | 'quoted' | 'accepted' | 'rejected'
  createdAt: number
}

export interface DriverPrefs {
  maxDistance: number // km
  ratePerKm: number // EUR/km
  ratePerHour: number // EUR/hour
  fuelPrice: number // EUR/L
  insuranceCost: number // EUR per trip
  roadFees: number // EUR per trip
  marginPercent: number // %
  blockedCargoTypes: string[]
}

// Mock driver preferences
const mockDriverPrefs: DriverPrefs = {
  maxDistance: 500,
  ratePerKm: 1.2,
  ratePerHour: 25,
  fuelPrice: 1.45,
  insuranceCost: 50,
  roadFees: 30,
  marginPercent: 15,
  blockedCargoTypes: ['Dangerous']
}

// Mock suggestions database
let mockSuggestions: DispatcherSuggestion[] = []

// Distance calculation (Haversine formula)
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371 // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}

// Cost calculation
function calculateCost(
  distance: number, 
  vehicle: Vehicle, 
  prefs: DriverPrefs
): number {
  const fuelNeeded = (distance / 100) * vehicle.fuelConsumption
  const fuelCost = fuelNeeded * prefs.fuelPrice
  const drivingHours = distance / 60 + 2 // avg speed 60km/h + 2h loading/unloading
  const driverCost = drivingHours * prefs.ratePerHour
  const distanceCost = distance * prefs.ratePerKm
  
  return fuelCost + driverCost + distanceCost + prefs.insuranceCost + prefs.roadFees
}

// Score calculation
function calculateScore(
  profitPct: number,
  distance: number,
  urgency: string,
  cargoType: string
): number {
  let score = 0
  
  // Profit score
  if (profitPct >= 20) score += 5
  else if (profitPct >= 15) score += 4
  else if (profitPct >= 10) score += 3
  else if (profitPct >= 5) score += 2
  else if (profitPct >= 0) score += 1
  
  // Distance score
  if (distance <= 100) score += 3
  else if (distance <= 300) score += 2
  else if (distance <= 500) score += 1
  
  // Urgency bonus
  if (urgency === 'Urgent') score += 3
  else if (urgency === 'High') score += 2
  else if (urgency === 'Medium') score += 1
  
  // Cargo type bonus
  if (cargoType === 'Refrigerated') score += 2
  else if (cargoType === 'Fragile') score += 1
  
  return Math.max(0, score)
}

export const agentMockApi = {
  // L0: Radar - Get available offers
  getAvailableOffers: (): CargoOffer[] => {
    return mockCargoOffers.filter(offer => 
      offer.status === 'OPEN' || offer.status === 'NEW'
    )
  },

  // L1: Calculator - Generate suggestions
  generateSuggestions: (): DispatcherSuggestion[] => {
    const activeVehicles = fleetMockApi.getActiveVehicles()
    const availableOffers = agentMockApi.getAvailableOffers()
    const suggestions: DispatcherSuggestion[] = []

    activeVehicles.forEach(vehicle => {
      availableOffers.forEach(offer => {
        // Check if vehicle can handle the cargo
        if (offer.weight > vehicle.capacity * 1000) return // convert tons to kg
        
        // Check cargo type restrictions
        if (mockDriverPrefs.blockedCargoTypes.includes(offer.cargoType)) return

        // Calculate distance from vehicle to pickup
        const vehiclePos = fleetMockApi.getVehiclePosition(vehicle)
        const distance = calculateDistance(
          vehiclePos.lat, vehiclePos.lng,
          offer.pickupLat || 0, offer.pickupLng || 0
        )

        // Check distance limit
        if (distance > mockDriverPrefs.maxDistance) return

        // Calculate costs and profit
        const totalDistance = distance + calculateDistance(
          offer.pickupLat || 0, offer.pickupLng || 0,
          offer.deliveryLat || 0, offer.deliveryLng || 0
        )
        
        const cost = calculateCost(totalDistance, vehicle, mockDriverPrefs)
        const quote = Math.round(cost * (1 + mockDriverPrefs.marginPercent / 100))
        const profit = quote - cost
        const profitPct = (profit / cost) * 100
        
        // Calculate score
        const score = calculateScore(profitPct, distance, offer.urgency, offer.cargoType)

        suggestions.push({
          id: `sug_${Math.random().toString(36).substr(2, 9)}`,
          offerId: offer.id,
          offer,
          vehicleId: vehicle.id,
          vehicle,
          cost,
          quote,
          profit,
          profitPct,
          score,
          distance,
          level: 'L1',
          status: 'pending',
          createdAt: Date.now()
        })
      })
    })

    // Sort by score and take top 10
    const topSuggestions = suggestions
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)

    // Update mock database
    mockSuggestions = topSuggestions
    return topSuggestions
  },

  // Get current suggestions
  getSuggestions: (): DispatcherSuggestion[] => {
    return mockSuggestions.sort((a, b) => b.score - a.score)
  },

  // L2: Quote Bot - Send quote
  sendQuote: (suggestionId: string): DispatcherSuggestion | null => {
    const suggestion = mockSuggestions.find(s => s.id === suggestionId)
    if (suggestion) {
      suggestion.status = 'quoted'
      suggestion.level = 'L2'
      return suggestion
    }
    return null
  },

  // L3: Auto-Tune - Adjust margins
  autoTuneMargins: (): void => {
    const recentSuggestions = mockSuggestions.filter(s => 
      Date.now() - s.createdAt < 24 * 60 * 60 * 1000 // last 24h
    )
    
    if (recentSuggestions.length >= 5) {
      const avgProfit = recentSuggestions.reduce((sum, s) => sum + s.profitPct, 0) / recentSuggestions.length
      
      if (avgProfit < 8) {
        mockDriverPrefs.marginPercent += 2
      } else if (avgProfit > 25) {
        mockDriverPrefs.marginPercent -= 1
      }
      
      // Regenerate suggestions with new margin
      agentMockApi.generateSuggestions()
    }
  },

  // L4: Negotiation - Handle counter offers
  handleCounterOffer: (suggestionId: string, counterPrice: number): DispatcherSuggestion | null => {
    const suggestion = mockSuggestions.find(s => s.id === suggestionId)
    if (suggestion) {
      const minPrice = suggestion.cost * 1.05 // minimum 5% profit
      const finalPrice = Math.max(counterPrice, minPrice)
      
      suggestion.quote = finalPrice
      suggestion.profit = finalPrice - suggestion.cost
      suggestion.profitPct = (suggestion.profit / suggestion.cost) * 100
      suggestion.level = 'L4'
      
      if (finalPrice >= minPrice) {
        suggestion.status = 'accepted'
      } else {
        suggestion.status = 'rejected'
      }
      
      return suggestion
    }
    return null
  },

  // Get agent statistics
  getAgentStats: () => {
    const total = mockSuggestions.length
    const quoted = mockSuggestions.filter(s => s.status === 'quoted').length
    const accepted = mockSuggestions.filter(s => s.status === 'accepted').length
    const avgProfit = total > 0 
      ? mockSuggestions.reduce((sum, s) => sum + s.profitPct, 0) / total 
      : 0

    return {
      totalSuggestions: total,
      quotedSuggestions: quoted,
      acceptedSuggestions: accepted,
      averageProfitPct: Math.round(avgProfit * 10) / 10,
      currentMargin: mockDriverPrefs.marginPercent,
      activeVehicles: fleetMockApi.getActiveVehicles().length
    }
  },

  // Simulate agent levels working
  simulateAgentWork: () => {
    console.log('🤖 Agent L0: Scanning marketplace...')
    const offers = agentMockApi.getAvailableOffers()
    
    console.log('🧮 Agent L1: Calculating suggestions...')
    const suggestions = agentMockApi.generateSuggestions()
    
    console.log('📊 Agent L3: Auto-tuning margins...')
    agentMockApi.autoTuneMargins()
    
    return {
      offers: offers.length,
      suggestions: suggestions.length,
      topScore: suggestions[0]?.score || 0
    }
  }
}

// Initialize with some suggestions
setTimeout(() => {
  agentMockApi.generateSuggestions()
}, 1000)