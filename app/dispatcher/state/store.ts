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
  
  // Failed requests for retry
  retryQueue: FailedRequest[]
  
  // Current negotiation
  currentNegotiation: string | null
  
  // Actions - Agent controls
  setAgentEnabled: (enabled: boolean) => void
  setManualMode: (enabled: boolean) => void
  setAutoAssignEnabled: (enabled: boolean) => void
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
  addQuote: (quote: Omit<Quote, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateQuoteStatus: (quoteId: string, status: Quote['status'], data?: Partial<Quote>) => void
  removeQuote: (quoteId: string) => void
  
  // Actions - Chat
  addChatMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void
  updateMessageStatus: (messageId: string, status: ChatMessage['status']) => void
  removeChatMessage: (messageId: string) => void
  
  // Actions - Retry queue
  addToRetryQueue: (request: Omit<FailedRequest, 'id' | 'retryCount' | 'lastAttempt'>) => void
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
      gpsFallbackAllowed: false,
      
      // Agent levels - all disabled by default
      levelSettings: {
        L0: false,
        L1: false,
        L2: false,
        L3: false,
        L4: false,
      },
      
      // Default cost settings
      costSettings: {
        costPerKm: 1.2,
        costPerHour: 25,
        averageSpeed: 80,
        insuranceFee: 50,
        roadFee: 30,
        marginPct: 15,
        defaultDistance: 500,
      },
      
      // Data arrays
      externalOffers: [],
      quotes: [],
      chatMessages: [],
      retryQueue: [],
      currentNegotiation: null,
      
      // Actions - Agent controls
      setAgentEnabled: (enabled: boolean) => set({ agentEnabled: enabled }),
      setManualMode: (enabled: boolean) => set({ manualMode: enabled }),
      setAutoAssignEnabled: (enabled: boolean) => set({ autoAssignEnabled: enabled }),
      setGpsFallbackAllowed: (allowed: boolean) => set({ gpsFallbackAllowed: allowed }),
      
      // Actions - Level settings
      updateLevelSettings: (settings: Partial<LevelSettings>) =>
        set((state) => ({
          levelSettings: { ...state.levelSettings, ...settings }
        })),
        
      setLevel: (level: keyof LevelSettings, enabled: boolean) =>
        set((state) => ({
          levelSettings: { ...state.levelSettings, [level]: enabled }
        })),
      
      // Actions - Cost settings
      updateCostSettings: (settings: Partial<CostSettings>) =>
        set((state) => ({
          costSettings: { ...state.costSettings, ...settings }
        })),
      
      // Actions - External offers
      setExternalOffers: (offers: CargoOffer[]) => set({ externalOffers: offers }),
      
      addExternalOffers: (offers: CargoOffer[]) =>
        set((state) => ({
          externalOffers: [...state.externalOffers, ...offers.filter(
            newOffer => !state.externalOffers.some(existing => existing.id === newOffer.id)
          )]
        })),
        
      removeExternalOffer: (offerId: string) =>
        set((state) => ({
          externalOffers: state.externalOffers.filter(offer => offer.id !== offerId)
        })),
      
      // Actions - Quotes
      addQuote: (quote: Omit<Quote, 'id' | 'createdAt' | 'updatedAt'>) => {
        const newQuote: Quote = {
          ...quote,
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        set((state) => ({ quotes: [...state.quotes, newQuote] }))
      },
      
      updateQuoteStatus: (quoteId: string, status: Quote['status'], data?: Partial<Quote>) =>
        set((state) => ({
          quotes: state.quotes.map(quote =>
            quote.id === quoteId
              ? { ...quote, status, ...data, updatedAt: new Date().toISOString() }
              : quote
          )
        })),
        
      removeQuote: (quoteId: string) =>
        set((state) => ({
          quotes: state.quotes.filter(quote => quote.id !== quoteId)
        })),
      
      // Actions - Chat
      addChatMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => {
        const newMessage: ChatMessage = {
          ...message,
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          timestamp: new Date().toISOString(),
        }
        set((state) => ({ chatMessages: [...state.chatMessages, newMessage] }))
      },
      
      updateMessageStatus: (messageId: string, status: ChatMessage['status']) =>
        set((state) => ({
          chatMessages: state.chatMessages.map(message =>
            message.id === messageId ? { ...message, status } : message
          )
        })),
        
      removeChatMessage: (messageId: string) =>
        set((state) => ({
          chatMessages: state.chatMessages.filter(message => message.id !== messageId)
        })),
      
      // Actions - Retry queue
      addToRetryQueue: (request: Omit<FailedRequest, 'id' | 'retryCount' | 'lastAttempt'>) => {
        const newRequest: FailedRequest = {
          ...request,
          id: Date.now().toString(),
          retryCount: 0,
          lastAttempt: new Date().toISOString(),
        }
        set((state) => ({ retryQueue: [...state.retryQueue, newRequest] }))
      },
      
      removeFromRetryQueue: (requestId: string) =>
        set((state) => ({
          retryQueue: state.retryQueue.filter(request => request.id !== requestId)
        })),
        
      incrementRetryCount: (requestId: string) =>
        set((state) => ({
          retryQueue: state.retryQueue.map(request =>
            request.id === requestId
              ? { ...request, retryCount: request.retryCount + 1, lastAttempt: new Date().toISOString() }
              : request
          )
        })),
      
      // Actions - Negotiation
      setCurrentNegotiation: (cargoId: string | null) => set({ currentNegotiation: cargoId }),
      
      // Actions - Agent learning
      logFeedback: (quoteId: string, success: boolean) => {
        // Find the quote and log feedback
        const state = get()
        const quote = state.quotes.find(q => q.id === quoteId)
        if (quote) {
          console.log(`Feedback for quote ${quoteId}: ${success ? 'SUCCESS' : 'FAILED'}`)
          
          // If L3 is enabled, trigger margin adjustment
          if (state.levelSettings.L3) {
            get().adjustMargin(success ? 'positive' : 'negative')
          }
        }
      },
      
      adjustMargin: (feedback: 'positive' | 'negative') => {
        set((state) => {
          const adjustment = feedback === 'positive' ? -2 : 3 // Reduce margin on success, increase on failure
          const newMargin = Math.max(5, Math.min(50, state.costSettings.marginPct + adjustment))
          
          console.log(`Adjusting margin from ${state.costSettings.marginPct}% to ${newMargin}% (${feedback})`)
          
          return {
            costSettings: {
              ...state.costSettings,
              marginPct: newMargin
            }
          }
        })
      },
    }),
    {
      name: 'dispatcher-store',
      // Only persist settings, not transient data
      partialize: (state) => ({
        agentEnabled: state.agentEnabled,
        manualMode: state.manualMode,
        autoAssignEnabled: state.autoAssignEnabled,
        gpsFallbackAllowed: state.gpsFallbackAllowed,
        levelSettings: state.levelSettings,
        costSettings: state.costSettings,
      }),
    }
  )
)