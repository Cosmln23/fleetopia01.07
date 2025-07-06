'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useDispatcherStore } from '@/app/dispatcher/state/store'
import { useQuoteManagement } from './useQuoteManagement'
import { CargoOffer } from '@/lib/types'
import { getCargoDistance } from '@/lib/distanceCalculator'

interface AgentState {
  isProcessing: boolean
  currentLevel: 'L0' | 'L1' | 'L2' | 'L3' | 'L4' | null
  processedOffers: Set<string>
  suggestions: AgentSuggestion[]
  metrics: AgentMetrics
}

interface AgentSuggestion {
  id: string
  cargoId: string
  type: 'quote' | 'counter' | 'negotiate' | 'skip'
  price?: number
  confidence: number
  reasoning: string
  createdAt: string
}

interface AgentMetrics {
  totalProcessed: number
  quotesGenerated: number
  acceptanceRate: number
  averageProfit: number
  responseTime: number
  learningProgress: number
}

interface CounterOfferData {
  originalPrice: number
  counterPrice: number
  minAcceptable: number
  maxCounters: number
  currentCounters: number
}

const AGENT_PROCESSING_DELAY = 500 // ms
const L4_COUNTER_THRESHOLD = 0.7 // confidence threshold for counter-offers
const MAX_COUNTER_ATTEMPTS = 3

export function useAgentNegotiator() {
  const [agentState, setAgentState] = useState<AgentState>({
    isProcessing: false,
    currentLevel: null,
    processedOffers: new Set(),
    suggestions: [],
    metrics: {
      totalProcessed: 0,
      quotesGenerated: 0,
      acceptanceRate: 0,
      averageProfit: 0,
      responseTime: 0,
      learningProgress: 0
    }
  })

  const processingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const metricsIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const {
    agentEnabled,
    levelSettings,
    costSettings,
    externalOffers,
    quotes,
    addChatMessage,
    logFeedback,
    adjustMargin,
    setCurrentNegotiation
  } = useDispatcherStore()

  const { sendQuote, calculateSuggestedPrice, getProfitAnalysis } = useQuoteManagement()

  // L1: Calculate cost and profit for an offer
  const processL1Calculator = useCallback((offer: CargoOffer) => {
    if (!levelSettings.L1) return null

    const distance = getCargoDistance(offer)
    const estimatedTime = distance / costSettings.averageSpeed
    const fuelCost = distance * costSettings.costPerKm
    const driverCost = estimatedTime * costSettings.costPerHour
    const fixedCosts = costSettings.insuranceFee + costSettings.roadFee
    const totalCost = fuelCost + driverCost + fixedCosts

    const profitAtPostedPrice = offer.price - totalCost
    const profitPct = (profitAtPostedPrice / totalCost) * 100

    const suggestedPrice = totalCost * (1 + costSettings.marginPct / 100)
    const confidence = calculateConfidence(profitPct, distance, offer.urgency)

    return {
      totalCost,
      suggestedPrice: Math.round(suggestedPrice),
      profitAtPostedPrice,
      profitPct,
      confidence,
      distance,
      estimatedTime,
      breakdown: { fuelCost, driverCost, fixedCosts }
    }
  }, [levelSettings.L1, costSettings])

  // Calculate confidence score for agent decisions
  const calculateConfidence = useCallback((profitPct: number, distance: number, urgency: string): number => {
    let confidence = 0.5 // Base confidence

    // Profit factor
    if (profitPct > 25) confidence += 0.3
    else if (profitPct > 15) confidence += 0.2
    else if (profitPct > 5) confidence += 0.1
    else if (profitPct < 0) confidence -= 0.4

    // Distance factor
    if (distance < 500) confidence += 0.1
    else if (distance > 1500) confidence -= 0.1

    // Urgency factor
    if (urgency === 'Urgent') confidence += 0.1
    else if (urgency === 'High') confidence += 0.05

    // Experience factor (based on learning progress)
    confidence += agentState.metrics.learningProgress * 0.1

    return Math.max(0, Math.min(1, confidence))
  }, [agentState.metrics.learningProgress])

  // L2: Generate quote suggestion
  const processL2QuoteBot = useCallback((offer: CargoOffer, l1Data: any): AgentSuggestion | null => {
    if (!levelSettings.L2 || !l1Data) return null

    const { suggestedPrice, confidence, profitPct } = l1Data

    // Don't suggest quotes for unprofitable offers
    if (profitPct < 0) {
      return {
        id: `suggestion-${Date.now()}-${offer.id}`,
        cargoId: offer.id,
        type: 'skip',
        confidence,
        reasoning: `Unprofitable: ${profitPct.toFixed(1)}% loss. Agent recommends skipping.`,
        createdAt: new Date().toISOString()
      }
    }

    // Auto-send quote if confidence is high and L2 is enabled
    const shouldAutoSend = confidence > 0.8 && agentState.metrics.acceptanceRate > 0.6

    return {
      id: `suggestion-${Date.now()}-${offer.id}`,
      cargoId: offer.id,
      type: 'quote',
      price: suggestedPrice,
      confidence,
      reasoning: `Profit: ${profitPct.toFixed(1)}%. ${shouldAutoSend ? 'Auto-sending quote.' : 'Suggested quote price.'}`,
      createdAt: new Date().toISOString()
    }
  }, [levelSettings.L2, agentState.metrics.acceptanceRate])

  // L3: Auto-tune based on feedback
  const processL3AutoTune = useCallback((quoteId: string, success: boolean) => {
    if (!levelSettings.L3) return

    console.log(`Agent L3: Processing feedback for quote ${quoteId}: ${success ? 'ACCEPTED' : 'REJECTED'}`)

    // Update metrics
    setAgentState(prev => {
      const newQuotesGenerated = prev.metrics.quotesGenerated + 1
      const newAcceptanceRate = success 
        ? (prev.metrics.acceptanceRate * (newQuotesGenerated - 1) + 1) / newQuotesGenerated
        : (prev.metrics.acceptanceRate * (newQuotesGenerated - 1)) / newQuotesGenerated

      return {
        ...prev,
        metrics: {
          ...prev.metrics,
          quotesGenerated: newQuotesGenerated,
          acceptanceRate: newAcceptanceRate,
          learningProgress: Math.min(1, prev.metrics.learningProgress + 0.01)
        }
      }
    })

    // Trigger margin adjustment
    adjustMargin(success ? 'positive' : 'negative')

    // Log learning event
    const adjustment = success ? 'reducing margin (more competitive)' : 'increasing margin (more conservative)'
    console.log(`Agent L3: Learning event - ${adjustment}. New acceptance rate: ${agentState.metrics.acceptanceRate.toFixed(2)}`)

  }, [levelSettings.L3, adjustMargin, agentState.metrics.acceptanceRate])

  // L4: Negotiation assist and counter-offers
  const processL4Negotiation = useCallback((
    offer: CargoOffer, 
    counterOfferData: CounterOfferData
  ): AgentSuggestion | null => {
    if (!levelSettings.L4) return null

    const { counterPrice, minAcceptable, currentCounters, maxCounters } = counterOfferData
    
    // Don't counter if we've reached max attempts
    if (currentCounters >= maxCounters) {
      return {
        id: `suggestion-${Date.now()}-${offer.id}`,
        cargoId: offer.id,
        type: 'negotiate',
        confidence: 0.3,
        reasoning: `Max counter attempts reached (${maxCounters}). Consider accepting or walking away.`,
        createdAt: new Date().toISOString()
      }
    }

    // Calculate if counter-offer is acceptable
    const l1Data = processL1Calculator(offer)
    if (!l1Data) return null

    const profitAtCounter = counterPrice - l1Data.totalCost
    const profitPctAtCounter = (profitAtCounter / l1Data.totalCost) * 100

    // If counter-offer is profitable, suggest acceptance
    if (profitPctAtCounter >= (costSettings.marginPct * 0.5)) {
      return {
        id: `suggestion-${Date.now()}-${offer.id}`,
        cargoId: offer.id,
        type: 'negotiate',
        price: counterPrice,
        confidence: 0.8,
        reasoning: `Counter-offer acceptable: ${profitPctAtCounter.toFixed(1)}% profit. Agent recommends accepting.`,
        createdAt: new Date().toISOString()
      }
    }

    // Generate counter to counter-offer
    const ourCounter = Math.round((counterPrice + l1Data.suggestedPrice) / 2)
    const confidenceScore = calculateConfidence(profitPctAtCounter, l1Data.distance, offer.urgency)

    return {
      id: `suggestion-${Date.now()}-${offer.id}`,
      cargoId: offer.id,
      type: 'counter',
      price: ourCounter,
      confidence: confidenceScore,
      reasoning: `Counter-offer too low (${profitPctAtCounter.toFixed(1)}% profit). Suggesting counter: €${ourCounter}`,
      createdAt: new Date().toISOString()
    }
  }, [levelSettings.L4, costSettings.marginPct, processL1Calculator, calculateConfidence])

  // Process offers through agent pipeline
  const processOffer = useCallback(async (offer: CargoOffer) => {
    if (agentState.processedOffers.has(offer.id)) return

    setAgentState(prev => ({
      ...prev,
      isProcessing: true,
      currentLevel: 'L1',
      processedOffers: new Set(prev.processedOffers).add(offer.id)
    }))

    try {
      const startTime = Date.now()

      // L1: Calculate costs and profits
      const l1Data = processL1Calculator(offer)
      if (!l1Data) return

      await new Promise(resolve => setTimeout(resolve, AGENT_PROCESSING_DELAY))
      setAgentState(prev => ({ ...prev, currentLevel: 'L2' }))

      // L2: Generate quote suggestion
      const l2Suggestion = processL2QuoteBot(offer, l1Data)
      if (l2Suggestion) {
        setAgentState(prev => ({
          ...prev,
          suggestions: [...prev.suggestions, l2Suggestion].slice(-20) // Keep last 20 suggestions
        }))

        // Auto-send quote if confidence is very high
        if (l2Suggestion.type === 'quote' && l2Suggestion.confidence > 0.9 && l2Suggestion.price) {
          console.log(`Agent L2: Auto-sending quote for ${offer.id} at €${l2Suggestion.price}`)
          
          const result = await sendQuote({
            cargoId: offer.id,
            price: l2Suggestion.price,
            source: 'agent'
          })

          if (result.success && result.quoteId) {
            // Add agent message to chat
            addChatMessage({
              cargoId: offer.id,
              content: `Agent auto-sent quote: €${l2Suggestion.price}. ${l2Suggestion.reasoning}`,
              senderId: 'agent-system',
              senderType: 'agent',
              status: 'sent'
            })
          }
        }
      }

      // Update metrics
      const processingTime = Date.now() - startTime
      setAgentState(prev => ({
        ...prev,
        metrics: {
          ...prev.metrics,
          totalProcessed: prev.metrics.totalProcessed + 1,
          responseTime: (prev.metrics.responseTime + processingTime) / 2
        }
      }))

    } catch (error) {
      console.error('Agent processing error:', error)
    } finally {
      setAgentState(prev => ({
        ...prev,
        isProcessing: false,
        currentLevel: null
      }))
    }
  }, [
    agentState.processedOffers,
    processL1Calculator,
    processL2QuoteBot,
    sendQuote,
    addChatMessage
  ])

  // Auto-process new external offers
  useEffect(() => {
    if (!agentEnabled || agentState.isProcessing) return

    const unprocessedOffers = externalOffers.filter(
      offer => !agentState.processedOffers.has(offer.id)
    )

    if (unprocessedOffers.length > 0) {
      console.log(`Agent: Processing ${unprocessedOffers.length} new offers`)
      
      // Process offers sequentially to avoid overwhelming the system
      unprocessedOffers.slice(0, 3).forEach((offer, index) => {
        setTimeout(() => {
          processOffer(offer)
        }, index * 1000) // 1 second delay between processing
      })
    }
  }, [agentEnabled, externalOffers, agentState.isProcessing, agentState.processedOffers, processOffer])

  // Handle quote status updates for L3 learning
  useEffect(() => {
    quotes.forEach(quote => {
      if (quote.source === 'agent' && quote.status !== 'pending') {
        const success = quote.status === 'accepted'
        processL3AutoTune(quote.id, success)
      }
    })
  }, [quotes, processL3AutoTune])

  // Send agent message for negotiation
  const sendAgentNegotiationMessage = useCallback((cargoId: string, suggestion: AgentSuggestion) => {
    let message = ''
    
    switch (suggestion.type) {
      case 'counter':
        message = `Agent suggests counter-offer: €${suggestion.price}. ${suggestion.reasoning}`
        break
      case 'negotiate':
        message = `Agent recommendation: ${suggestion.reasoning}`
        break
      default:
        message = suggestion.reasoning
    }

    addChatMessage({
      cargoId,
      content: message,
      senderId: 'agent-system',
      senderType: 'agent',
      status: 'sent'
    })
  }, [addChatMessage])

  // Get agent suggestion for a specific cargo
  const getCargoSuggestion = useCallback((cargoId: string): AgentSuggestion | null => {
    return agentState.suggestions
      .filter(s => s.cargoId === cargoId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0] || null
  }, [agentState.suggestions])

  // Clear old suggestions (cleanup)
  const clearOldSuggestions = useCallback(() => {
    const cutoffTime = Date.now() - (2 * 60 * 60 * 1000) // 2 hours ago
    setAgentState(prev => ({
      ...prev,
      suggestions: prev.suggestions.filter(
        suggestion => new Date(suggestion.createdAt).getTime() > cutoffTime
      )
    }))
  }, [])

  // Cleanup effect
  useEffect(() => {
    const cleanupInterval = setInterval(clearOldSuggestions, 30 * 60 * 1000) // Every 30 minutes
    return () => clearInterval(cleanupInterval)
  }, [clearOldSuggestions])

  // Start metrics tracking
  useEffect(() => {
    if (agentEnabled) {
      metricsIntervalRef.current = setInterval(() => {
        // Update learning progress based on activity
        setAgentState(prev => ({
          ...prev,
          metrics: {
            ...prev.metrics,
            learningProgress: Math.min(1, prev.metrics.learningProgress + 0.001)
          }
        }))
      }, 60000) // Every minute
    } else {
      if (metricsIntervalRef.current) {
        clearInterval(metricsIntervalRef.current)
        metricsIntervalRef.current = null
      }
    }

    return () => {
      if (metricsIntervalRef.current) {
        clearInterval(metricsIntervalRef.current)
      }
    }
  }, [agentEnabled])

  return {
    // State
    agentState,
    
    // Actions
    processOffer,
    processL4Negotiation,
    sendAgentNegotiationMessage,
    
    // Utilities
    getCargoSuggestion,
    calculateConfidence,
    clearOldSuggestions,
    
    // Level processors
    processL1Calculator,
    processL2QuoteBot,
    processL3AutoTune,
    
    // Constants
    L4_COUNTER_THRESHOLD,
    MAX_COUNTER_ATTEMPTS
  }
}