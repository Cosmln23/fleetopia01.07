'use client'

import { useState, useCallback, useRef } from 'react'
import { useDispatcherStore } from '@/app/dispatcher/state/store'

interface QuoteRequest {
  cargoId: string
  price: number
  message?: string
  source: 'manual' | 'agent'
}

interface RateLimitState {
  [key: string]: number // cargoId -> timestamp of last quote
}

const RATE_LIMIT_WINDOW = 30000 // 30 seconds between quotes for same cargo
const MAX_RETRIES = 3
const RETRY_DELAY = 1000 // 1 second base retry delay

export function useQuoteManagement() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [rateLimitState, setRateLimitState] = useState<RateLimitState>({})
  const retryTimeoutsRef = useRef<{ [key: string]: NodeJS.Timeout }>({})
  
  const {
    addQuote,
    updateQuoteStatus,
    addToRetryQueue,
    removeFromRetryQueue,
    logFeedback,
    costSettings,
    levelSettings
  } = useDispatcherStore()

  // Check if rate limit allows sending quote for cargo
  const canSendQuote = useCallback((cargoId: string): boolean => {
    const lastQuoteTime = rateLimitState[cargoId]
    if (!lastQuoteTime) return true
    
    const timeSinceLastQuote = Date.now() - lastQuoteTime
    return timeSinceLastQuote >= RATE_LIMIT_WINDOW
  }, [rateLimitState])

  // Get remaining time for rate limit
  const getRateLimitRemaining = useCallback((cargoId: string): number => {
    const lastQuoteTime = rateLimitState[cargoId]
    if (!lastQuoteTime) return 0
    
    const timeSinceLastQuote = Date.now() - lastQuoteTime
    const remaining = RATE_LIMIT_WINDOW - timeSinceLastQuote
    return Math.max(0, Math.ceil(remaining / 1000))
  }, [rateLimitState])

  // Send quote with rate limiting
  const sendQuote = useCallback(async (request: QuoteRequest): Promise<{ success: boolean; quoteId?: string; error?: string }> => {
    const { cargoId, price, message, source } = request

    // Check rate limit
    if (!canSendQuote(cargoId)) {
      const remainingSeconds = getRateLimitRemaining(cargoId)
      return {
        success: false,
        error: `Rate limit exceeded. Please wait ${remainingSeconds} seconds before sending another quote for this cargo.`
      }
    }

    // Validate price
    if (price <= 0) {
      return {
        success: false,
        error: 'Price must be greater than 0.'
      }
    }

    setIsSubmitting(true)

    try {
      // Add quote to store with pending status
      const quoteData = {
        cargoId,
        price,
        message,
        source,
        status: 'pending' as const
      }
      
      addQuote(quoteData)
      
      // Update rate limit
      setRateLimitState(prev => ({
        ...prev,
        [cargoId]: Date.now()
      }))

      // Simulate API call (replace with real API call)
      const response = await fetch('/api/quotes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cargoId,
          price,
          message,
          source
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      const quoteId = result.id

      // Update quote status to sent
      updateQuoteStatus(quoteId, 'pending')

      // If L3 is enabled, we'll track this for learning
      if (levelSettings.L3) {
        // Set up a timeout to check for acceptance/rejection
        setTimeout(() => {
          // This would normally be handled by WebSocket or polling
          // For now, simulate random feedback after 30 seconds
          const success = Math.random() > 0.5
          logFeedback(quoteId, success)
          updateQuoteStatus(quoteId, success ? 'accepted' : 'refused')
        }, 30000)
      }

      return {
        success: true,
        quoteId
      }

    } catch (error) {
      console.error('Failed to send quote:', error)
      
      // Add to retry queue
      addToRetryQueue({
        type: 'quote',
        data: request
      })

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send quote. Added to retry queue.'
      }
    } finally {
      setIsSubmitting(false)
    }
  }, [
    canSendQuote,
    getRateLimitRemaining,
    addQuote,
    updateQuoteStatus,
    addToRetryQueue,
    logFeedback,
    levelSettings
  ])

  // Retry failed quote with exponential backoff
  const retryQuote = useCallback(async (requestId: string, request: QuoteRequest, retryCount: number = 0): Promise<boolean> => {
    if (retryCount >= MAX_RETRIES) {
      console.error('Max retries exceeded for quote request')
      removeFromRetryQueue(requestId)
      return false
    }

    const delay = RETRY_DELAY * Math.pow(2, retryCount) // Exponential backoff
    
    return new Promise((resolve) => {
      const timeout = setTimeout(async () => {
        try {
          const result = await sendQuote(request)
          if (result.success) {
            removeFromRetryQueue(requestId)
            resolve(true)
          } else {
            resolve(await retryQuote(requestId, request, retryCount + 1))
          }
        } catch (error) {
          console.error('Retry failed:', error)
          resolve(await retryQuote(requestId, request, retryCount + 1))
        }
        
        delete retryTimeoutsRef.current[requestId]
      }, delay)
      
      retryTimeoutsRef.current[requestId] = timeout
    })
  }, [sendQuote, removeFromRetryQueue])

  // Cancel pending retry
  const cancelRetry = useCallback((requestId: string) => {
    const timeout = retryTimeoutsRef.current[requestId]
    if (timeout) {
      clearTimeout(timeout)
      delete retryTimeoutsRef.current[requestId]
      removeFromRetryQueue(requestId)
    }
  }, [removeFromRetryQueue])

  // Calculate suggested price based on agent settings
  const calculateSuggestedPrice = useCallback((cargoPostedPrice: number, distance: number): number => {
    if (!levelSettings.L1) {
      // If L1 not enabled, suggest 15% below posted price
      return Math.round(cargoPostedPrice * 0.85)
    }

    // Use L1 cost calculation
    const estimatedTime = distance / costSettings.averageSpeed
    const fuelCost = distance * costSettings.costPerKm
    const driverCost = estimatedTime * costSettings.costPerHour
    const fixedCosts = costSettings.insuranceFee + costSettings.roadFee
    const totalCost = fuelCost + driverCost + fixedCosts
    const suggestedPrice = totalCost * (1 + costSettings.marginPct / 100)
    
    return Math.round(suggestedPrice)
  }, [levelSettings.L1, costSettings])

  // Get profit analysis for a price
  const getProfitAnalysis = useCallback((price: number, distance: number) => {
    const estimatedTime = distance / costSettings.averageSpeed
    const fuelCost = distance * costSettings.costPerKm
    const driverCost = estimatedTime * costSettings.costPerHour
    const fixedCosts = costSettings.insuranceFee + costSettings.roadFee
    const totalCost = fuelCost + driverCost + fixedCosts
    
    const profit = price - totalCost
    const profitPct = (profit / totalCost) * 100
    
    let profitLevel: 'excellent' | 'good' | 'low' | 'loss'
    let color: string
    
    if (profitPct >= 20) {
      profitLevel = 'excellent'
      color = 'text-green-400'
    } else if (profitPct >= 10) {
      profitLevel = 'good' 
      color = 'text-yellow-400'
    } else if (profitPct >= 0) {
      profitLevel = 'low'
      color = 'text-orange-400'
    } else {
      profitLevel = 'loss'
      color = 'text-red-400'
    }
    
    return {
      totalCost,
      profit,
      profitPct,
      profitLevel,
      color,
      breakdown: {
        fuelCost,
        driverCost,
        fixedCosts,
        estimatedTime
      }
    }
  }, [costSettings])

  // Cleanup timeouts on unmount
  const cleanup = useCallback(() => {
    Object.values(retryTimeoutsRef.current).forEach(timeout => {
      clearTimeout(timeout)
    })
    retryTimeoutsRef.current = {}
  }, [])

  return {
    // State
    isSubmitting,
    rateLimitState,
    
    // Actions
    sendQuote,
    retryQuote,
    cancelRetry,
    
    // Utilities
    canSendQuote,
    getRateLimitRemaining,
    calculateSuggestedPrice,
    getProfitAnalysis,
    cleanup,
    
    // Constants
    RATE_LIMIT_WINDOW,
    MAX_RETRIES
  }
}