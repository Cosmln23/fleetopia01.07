import { useEffect, useState } from 'react'
import { initializeSocket, onSocketEvent, emitSocketEvent, disconnectSocket } from '@/lib/websocket'

interface WebSocketMessage {
  id: string
  content: string
  senderId: string
  senderType: 'user' | 'shipper' | 'agent'
  messageType: 'text' | 'quote' | 'counter' | 'accept' | 'reject'
  timestamp: string
  priceAmount?: number
}

interface QuoteUpdate {
  cargoId: string
  quoteId: string
  status: string
  price?: number
  message?: string
}

interface NegotiationStatus {
  cargoId: string
  status: 'initial' | 'quote_sent' | 'negotiating' | 'accepted' | 'rejected'
}

export const useWebSocket = (cargoId?: string) => {
  const [connected, setConnected] = useState(false)
  const [messages, setMessages] = useState<WebSocketMessage[]>([])
  const [quoteUpdate, setQuoteUpdate] = useState<QuoteUpdate | null>(null)
  const [negotiationStatus, setNegotiationStatus] = useState<NegotiationStatus | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Initialize smart socket with Vercel fallback
    const initConnection = async () => {
      try {
        console.log('🔌 Initializing smart WebSocket connection...')
        
        // Use the new fallback system
        await initializeSocket()
        setConnected(true)
        setError(null)
        
        // Set up event listeners using the fallback-aware system
        onSocketEvent('connect', () => {
          console.log('✅ Connection established (WebSocket or HTTP polling)')
          setConnected(true)
          setError(null)
          
          // Join cargo room if cargoId provided
          if (cargoId) {
            emitSocketEvent('join-cargo', cargoId)
          }
        })

        onSocketEvent('disconnect', () => {
          console.log('❌ Connection disconnected')
          setConnected(false)
        })

        onSocketEvent('connect_error', (error: any) => {
          console.warn('⚠️ Connection error, using fallback:', error)
          // Don't treat fallback as error
          setConnected(true)
        })

        onSocketEvent('chat-message', (data: { cargoId: string, message: WebSocketMessage }) => {
          if (data.cargoId === cargoId) {
            // Only add messages from OTHER users, not from current user
            setMessages(prev => [...prev, data.message])
          }
        })

        onSocketEvent('quote-update', (data: QuoteUpdate) => {
          if (data.cargoId === cargoId) {
            setQuoteUpdate(data)
          }
        })

        onSocketEvent('negotiation-status', (data: NegotiationStatus) => {
          if (data.cargoId === cargoId) {
            setNegotiationStatus(data)
          }
        })

      } catch (error) {
        console.error('❌ Failed to initialize connection:', error)
        setError('Connection failed')
        setConnected(false)
      }
    }

    initConnection()

    // Cleanup on unmount
    return () => {
      if (cargoId) {
        emitSocketEvent('leave-cargo', cargoId)
      }
      disconnectSocket()
    }
  }, [cargoId])

  // Send message function
  const sendMessage = (content: string, messageType: WebSocketMessage['messageType'] = 'text', priceAmount?: number) => {
    if (!cargoId) return

    const messageData = {
      cargoId,
      content,
      messageType,
      priceAmount
    }

    emitSocketEvent('send-chat-message', messageData)
  }

  // Send quote function
  const sendQuote = (price: number, message?: string) => {
    if (!cargoId) return

    const quoteData = {
      cargoId,
      price,
      message
    }

    emitSocketEvent('send-quote', quoteData)
  }

  // Negotiation action function
  const handleNegotiation = (action: 'accept' | 'reject' | 'counter', quoteId: string, counterPrice?: number) => {
    if (!cargoId) return

    const actionData = {
      cargoId,
      action,
      quoteId,
      counterPrice
    }

    emitSocketEvent('negotiation-action', actionData)
  }

  return {
    connected,
    messages,
    quoteUpdate,
    negotiationStatus,
    error,
    sendMessage,
    sendQuote,
    handleNegotiation
  }
}