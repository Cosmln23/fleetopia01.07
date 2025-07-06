// app/dispatcher/state/store.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { CargoOffer } from '@/lib/types'

interface Quote {
  id: string
  cargoId: string
  price: number
  status: 'pending' | 'accepted' | 'refused' | 'countered'
  message?: string
  counterPrice?: number
  createdAt: string
  updatedAt: string
  source: 'manual' | 'agent'
}

interface ChatMessage {
  id: string
  cargoId: string
  content: string
  senderId: string
  senderType: 'user' | 'shipper' | 'agent'
  timestamp: string
  status: 'sending' | 'sent' | 'failed'
}

interface FailedRequest {
  id: string
  type: 'quote' | 'message'
  data: any
  retryCount: number
  lastAttempt: string
}

interface LevelSettings {
  L0: boolean
  L1: boolean
  L2: boolean
  L3: boolean
  L4: boolean
}

interface CostSettings {
  costPerKm: number
  costPerHour: number
  averageSpeed: number
  insuranceFee: number
  roadFee: number
  marginPct: number
  defaultDistance: number
}

interface DispatcherState {
  // Agent state
  agentEnabled: boolean
  manualMode: boolean
  autoAssignEnabled: boolean
  
  // Per-vehicle auto-assign state
  vehicleAutoAssign: Record<string, boolean>
  
  // GPS fallback state  
  gpsFallbackAllowed: boolean
  
  // Agent levels
  levelSettings: LevelSettings
  
  // Cost settings
  costSettings: CostSettings
  
  // External offers from marketplace
  externalOffers: CargoOffer[]
  
  // Quotes management
  quotes: Quote[]
  
  // Chat messages
  chatMessages: ChatMessage[]
  
  // Failed requests retry queue
  retryQueue: FailedRequest[]
  
  // Current negotiation
  currentNegotiation: string | null
  
  // Actions - Agent controls
  setAgentEnabled: (enabled: boolean) => void
  setManualMode: (enabled: boolean) => void
  setAutoAssignEnabled: (enabled: boolean) => void
  setVehicleAutoAssign: (vehicleId: string, enabled: boolean) => void
  setGpsFallbackAllowed: (allowed: boolean) => void
  
  // Actions - Level settings
  updateLevelSettings: (settings: Partial<LevelSettings>) => void
  setLevel: (level: keyof LevelSettings, enabled: boolean) => void
  
  // Actions - Cost settings
  updateCostSettings: (settings: Partial<CostSettings>) => void
  
  // Actions - External offers
  setExternalOffers: (offers: CargoOffer[]) => void
  addExternalOffers: (offers: CargoOffer[]) => void
  removeExternalOffer: (offerId: string) => void
  
  // Actions - Quotes
  addQuote: (quote: Quote) => void
  updateQuoteStatus: (quoteId: string, status: Quote['status'], counterPrice?: number) => void
  
  // Actions - Chat
  addChatMessage: (message: ChatMessage) => void
  updateMessageStatus: (messageId: string, status: ChatMessage['status']) => void
  
  // Actions - Retry queue
  addToRetryQueue: (request: FailedRequest) => void
  removeFromRetryQueue: (requestId: string) => void
  incrementRetryCount: (requestId: string) => void
  
  // Actions - Negotiation
  setCurrentNegotiation: (cargoId: string | null) => void
  
  // Actions - Agent learning
  logFeedback: (quoteId: string, success: boolean) => void
  adjustMargin: (feedback: 'positive' | 'negative') => void
}

export const useDispatcherStore = create<DispatcherState>()(
  persist(
    (set, get) => ({
      // Initial state
      agentEnabled: false,
      manualMode: true,
      autoAssignEnabled: false,
      vehicleAutoAssign: {},
      gpsFallbackAllowed: false,
      
      // Agent levels - all disabled by default
      levelSettings: {
        L0: false,
        L1: false,
        L2: false,
        L3: false,
        L4: false
      },
      
      // Default cost settings
      costSettings: {
        costPerKm: 1.2,
        costPerHour: 25,
        averageSpeed: 80,
        insuranceFee: 50,
        roadFee: 30,
        marginPct: 15,
        defaultDistance: 500
      },
      
      // Data arrays
      externalOffers: [],
      quotes: [],
      chatMessages: [],
      retryQueue: [],
      currentNegotiation: null,
      
      // Actions - Agent controls
      setAgentEnabled: (enabled) => set({ agentEnabled: enabled }),
      setManualMode: (enabled) => set({ manualMode: enabled }),
      setAutoAssignEnabled: (enabled) => set({ autoAssignEnabled: enabled }),
      setVehicleAutoAssign: (vehicleId, enabled) => set((state) => ({
        vehicleAutoAssign: { ...state.vehicleAutoAssign, [vehicleId]: enabled }
      })),
      setGpsFallbackAllowed: (allowed) => set({ gpsFallbackAllowed: allowed }),
      
      // Actions - Level settings
      updateLevelSettings: (settings) => set((state) => ({
        levelSettings: { ...state.levelSettings, ...settings }
      })),
      setLevel: (level, enabled) => set((state) => ({
        levelSettings: { ...state.levelSettings, [level]: enabled }
      })),
      
      // Actions - Cost settings
      updateCostSettings: (settings) => set((state) => ({
        costSettings: { ...state.costSettings, ...settings }
      })),
      
      // Actions - External offers
      setExternalOffers: (offers) => set({ externalOffers: offers }),
      addExternalOffers: (offers) => set((state) => ({
        externalOffers: [...state.externalOffers, ...offers].filter((offer, index, array) =>
          array.findIndex(o => o.id === offer.id) === index
        )
      })),
      removeExternalOffer: (offerId) => set((state) => ({
        externalOffers: state.externalOffers.filter(offer => offer.id !== offerId)
      })),
      
      // Actions - Quotes
      addQuote: (quote) => set((state) => ({
        quotes: [...state.quotes, quote]
      })),
      updateQuoteStatus: (quoteId, status, counterPrice) => set((state) => ({
        quotes: state.quotes.map(quote =>
          quote.id === quoteId
            ? { ...quote, status, counterPrice, updatedAt: new Date().toISOString() }
            : quote
        )
      })),
      
      // Actions - Chat
      addChatMessage: (message) => set((state) => ({
        chatMessages: [...state.chatMessages, message]
      })),
      updateMessageStatus: (messageId, status) => set((state) => ({
        chatMessages: state.chatMessages.map(message =>
          message.id === messageId ? { ...message, status } : message
        )
      })),
      
      // Actions - Retry queue
      addToRetryQueue: (request) => set((state) => ({
        retryQueue: [...state.retryQueue, request]
      })),
      removeFromRetryQueue: (requestId) => set((state) => ({
        retryQueue: state.retryQueue.filter(req => req.id !== requestId)
      })),
      incrementRetryCount: (requestId) => set((state) => ({
        retryQueue: state.retryQueue.map(req =>
          req.id === requestId
            ? { ...req, retryCount: req.retryCount + 1, lastAttempt: new Date().toISOString() }
            : req
        )
      })),
      
      // Actions - Negotiation
      setCurrentNegotiation: (cargoId) => set({ currentNegotiation: cargoId }),
      
      // Actions - Agent learning
      logFeedback: (quoteId, success) => {
        console.log(`Agent feedback: Quote ${quoteId} was ${success ? 'successful' : 'unsuccessful'}`)
        // Could implement learning logic here
      },
      adjustMargin: (feedback) => {
        const state = get()
        const adjustment = feedback === 'positive' ? -0.5 : 0.5
        const newMargin = Math.max(5, Math.min(30, state.costSettings.marginPct + adjustment))
        
        set((state) => ({
          costSettings: { ...state.costSettings, marginPct: newMargin }
        }))
        
        console.log(`Agent margin adjusted: ${feedback} feedback, new margin: ${newMargin}%`)
      }
    }),
    {
      name: 'dispatcher-storage',
      // Only persist settings, not transient data
      partialize: (state) => ({
        agentEnabled: state.agentEnabled,
        manualMode: state.manualMode,
        autoAssignEnabled: state.autoAssignEnabled,
        vehicleAutoAssign: state.vehicleAutoAssign,
        gpsFallbackAllowed: state.gpsFallbackAllowed,
        levelSettings: state.levelSettings,
        costSettings: state.costSettings,
      }),
    }
  )
)