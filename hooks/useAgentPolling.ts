'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useDispatcherStore } from '@/app/dispatcher/state/store'
import { CargoOffer } from '@/lib/types'

interface PollingState {
  isActive: boolean
  lastPollTime: number | null
  pollCount: number
  errorCount: number
  nextPollIn: number
}

interface FilterCriteria {
  maxWeight?: number
  maxDistance?: number
  excludedRoutes?: string[]
  minProfit?: number
}

const BASE_POLLING_INTERVAL = 30000 // 30 seconds
const MAX_POLLING_INTERVAL = 600000 // 10 minutes
const ERROR_BACKOFF_MULTIPLIER = 2
const MAX_ERROR_COUNT = 5

export function useAgentPolling() {
  const [pollingState, setPollingState] = useState<PollingState>({
    isActive: false,
    lastPollTime: null,
    pollCount: 0,
    errorCount: 0,
    nextPollIn: 0
  })
  
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null)
  
  const {
    agentEnabled,
    levelSettings,
    costSettings,
    externalOffers,
    setExternalOffers,
    addExternalOffers,
    removeExternalOffer
  } = useDispatcherStore()

  // Calculate current polling interval based on error count
  const getCurrentPollingInterval = useCallback(() => {
    const baseInterval = BASE_POLLING_INTERVAL
    const backoffMultiplier = Math.pow(ERROR_BACKOFF_MULTIPLIER, pollingState.errorCount)
    const interval = Math.min(baseInterval * backoffMultiplier, MAX_POLLING_INTERVAL)
    return interval
  }, [pollingState.errorCount])

  // Check if offer meets agent criteria (L0 filtering)
  const isOfferEligible = useCallback((offer: CargoOffer, criteria: FilterCriteria = {}): boolean => {
    // Basic weight check
    if (criteria.maxWeight && offer.weight > criteria.maxWeight) {
      return false
    }

    // Distance check (if coordinates available)
    if (criteria.maxDistance && offer.pickupLat && offer.pickupLng && offer.deliveryLat && offer.deliveryLng) {
      const distance = calculateDistance(
        { lat: offer.pickupLat, lng: offer.pickupLng },
        { lat: offer.deliveryLat, lng: offer.deliveryLng }
      )
      if (distance > criteria.maxDistance) {
        return false
      }
    }

    // Route exclusion check
    if (criteria.excludedRoutes?.length) {
      const route = `${offer.fromAddress.toLowerCase()}-${offer.toAddress.toLowerCase()}`
      if (criteria.excludedRoutes.some(excluded => route.includes(excluded.toLowerCase()))) {
        return false
      }
    }

    // Profit check (if L1 is enabled)
    if (levelSettings.L1 && criteria.minProfit) {
      const estimatedProfit = calculateProfitEstimate(offer)
      if (estimatedProfit < criteria.minProfit) {
        return false
      }
    }

    return true
  }, [levelSettings.L1])

  // Calculate estimated profit for an offer
  const calculateProfitEstimate = useCallback((offer: CargoOffer): number => {
    // Use default distance if coordinates not available
    const distance = offer.pickupLat && offer.deliveryLat 
      ? calculateDistance(
          { lat: offer.pickupLat, lng: offer.pickupLng! },
          { lat: offer.deliveryLat, lng: offer.deliveryLng! }
        )
      : costSettings.defaultDistance

    const estimatedTime = distance / costSettings.averageSpeed
    const fuelCost = distance * costSettings.costPerKm
    const driverCost = estimatedTime * costSettings.costPerHour
    const fixedCosts = costSettings.insuranceFee + costSettings.roadFee
    const totalCost = fuelCost + driverCost + fixedCosts
    
    return offer.price - totalCost
  }, [costSettings])

  // Simple distance calculation
  const calculateDistance = (from: { lat: number; lng: number }, to: { lat: number; lng: number }): number => {
    const R = 6371 // Earth's radius in km
    const dLat = toRadians(to.lat - from.lat)
    const dLng = toRadians(to.lng - from.lng)
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRadians(from.lat)) * Math.cos(toRadians(to.lat)) * 
      Math.sin(dLng / 2) * Math.sin(dLng / 2)
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return Math.round(R * c)
  }

  const toRadians = (degrees: number): number => degrees * (Math.PI / 180)

  // Fetch offers from marketplace API
  const fetchMarketplaceOffers = useCallback(async (): Promise<CargoOffer[]> => {
    try {
      const response = await fetch('/api/marketplace-offers?agent=true', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        if (response.status === 204) {
          // No new offers available
          return []
        }
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return data.offers || []
    } catch (error) {
      console.error('Failed to fetch marketplace offers:', error)
      throw error
    }
  }, [])

  // Process offers through L0 filter
  const processOffers = useCallback((offers: CargoOffer[]): CargoOffer[] => {
    if (!levelSettings.L0) {
      return offers
    }

    const criteria: FilterCriteria = {
      maxWeight: 40000, // 40 tons max
      maxDistance: 2000, // 2000 km max
      minProfit: levelSettings.L1 ? 100 : undefined, // Minimum €100 profit if L1 enabled
      excludedRoutes: [] // Could be configured in settings
    }

    return offers.filter(offer => isOfferEligible(offer, criteria))
  }, [levelSettings.L0, levelSettings.L1, isOfferEligible])

  // Perform polling operation
  const performPoll = useCallback(async () => {
    if (!agentEnabled || !levelSettings.L0) {
      return
    }

    try {
      console.log('Agent L0: Polling marketplace for new offers...')
      
      const allOffers = await fetchMarketplaceOffers()
      const filteredOffers = processOffers(allOffers)
      
      console.log(`Agent L0: Found ${allOffers.length} total offers, ${filteredOffers.length} after filtering`)

      // Update external offers
      if (filteredOffers.length > 0) {
        addExternalOffers(filteredOffers)
      }

      // Reset error count on success
      setPollingState(prev => ({
        ...prev,
        lastPollTime: Date.now(),
        pollCount: prev.pollCount + 1,
        errorCount: 0
      }))

    } catch (error) {
      console.error('Agent L0: Polling failed:', error)
      
      setPollingState(prev => ({
        ...prev,
        errorCount: prev.errorCount + 1
      }))

      // Stop polling if too many errors
      if (pollingState.errorCount >= MAX_ERROR_COUNT) {
        console.error('Agent L0: Too many errors, stopping polling')
        stopPolling()
      }
    }
  }, [agentEnabled, levelSettings.L0, fetchMarketplaceOffers, processOffers, addExternalOffers, pollingState.errorCount])

  // Start polling
  const startPolling = useCallback(() => {
    if (pollingIntervalRef.current || !agentEnabled || !levelSettings.L0) {
      return
    }

    console.log('Agent L0: Starting marketplace polling...')
    
    setPollingState(prev => ({ ...prev, isActive: true }))

    // Perform initial poll
    performPoll()

    // Set up recurring polling
    const interval = getCurrentPollingInterval()
    pollingIntervalRef.current = setInterval(performPoll, interval)

    // Start countdown timer
    startCountdown(interval)
  }, [agentEnabled, levelSettings.L0, performPoll, getCurrentPollingInterval])

  // Stop polling
  const stopPolling = useCallback(() => {
    console.log('Agent L0: Stopping marketplace polling...')
    
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current)
      pollingIntervalRef.current = null
    }

    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current)
      countdownIntervalRef.current = null
    }

    setPollingState(prev => ({
      ...prev,
      isActive: false,
      nextPollIn: 0
    }))
  }, [])

  // Start countdown timer for next poll
  const startCountdown = useCallback((interval: number) => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current)
    }

    let remaining = Math.floor(interval / 1000)
    setPollingState(prev => ({ ...prev, nextPollIn: remaining }))

    countdownIntervalRef.current = setInterval(() => {
      remaining -= 1
      setPollingState(prev => ({ ...prev, nextPollIn: remaining }))

      if (remaining <= 0) {
        clearInterval(countdownIntervalRef.current!)
        countdownIntervalRef.current = null
      }
    }, 1000)
  }, [])

  // Restart polling with new interval (useful after error recovery)
  const restartPolling = useCallback(() => {
    stopPolling()
    setTimeout(() => {
      if (agentEnabled && levelSettings.L0) {
        startPolling()
      }
    }, 1000)
  }, [agentEnabled, levelSettings.L0, stopPolling, startPolling])

  // Effect to handle agent and L0 state changes
  useEffect(() => {
    if (agentEnabled && levelSettings.L0) {
      startPolling()
    } else {
      stopPolling()
    }

    return () => {
      stopPolling()
    }
  }, [agentEnabled, levelSettings.L0, startPolling, stopPolling])

  // Effect to adjust polling interval when error count changes
  useEffect(() => {
    if (pollingState.isActive && pollingIntervalRef.current) {
      const newInterval = getCurrentPollingInterval()
      
      // Restart with new interval
      clearInterval(pollingIntervalRef.current)
      pollingIntervalRef.current = setInterval(performPoll, newInterval)
      startCountdown(newInterval)
    }
  }, [pollingState.errorCount, pollingState.isActive, getCurrentPollingInterval, performPoll, startCountdown])

  // Manual poll trigger
  const triggerManualPoll = useCallback(async () => {
    if (pollingState.isActive) {
      await performPoll()
    }
  }, [pollingState.isActive, performPoll])

  // Clear old offers (cleanup)
  const clearOldOffers = useCallback(() => {
    const cutoffTime = Date.now() - (24 * 60 * 60 * 1000) // 24 hours ago
    externalOffers.forEach(offer => {
      const offerTime = new Date(offer.createdAt).getTime()
      if (offerTime < cutoffTime) {
        removeExternalOffer(offer.id)
      }
    })
  }, [externalOffers, removeExternalOffer])

  // Clean up old offers periodically
  useEffect(() => {
    const cleanupInterval = setInterval(clearOldOffers, 60 * 60 * 1000) // Every hour
    return () => clearInterval(cleanupInterval)
  }, [clearOldOffers])

  return {
    // State
    pollingState,
    currentInterval: getCurrentPollingInterval(),
    
    // Data
    externalOffers,
    
    // Actions
    startPolling,
    stopPolling,
    restartPolling,
    triggerManualPoll,
    clearOldOffers,
    
    // Utilities
    isOfferEligible,
    calculateProfitEstimate,
    
    // Constants
    BASE_POLLING_INTERVAL,
    MAX_POLLING_INTERVAL,
    MAX_ERROR_COUNT
  }
}