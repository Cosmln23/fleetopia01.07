import { useEffect, useRef, useState } from 'react'
import { io, Socket } from 'socket.io-client'

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
  const [socket, setSocket] = useState<Socket | null>(null)
  const [connected, setConnected] = useState(false)
  const [messages, setMessages] = useState<WebSocketMessage[]>([])
  const [quoteUpdate, setQuoteUpdate] = useState<QuoteUpdate | null>(null)
  const [negotiationStatus, setNegotiationStatus] = useState<NegotiationStatus | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    // Initialize socket connection
    const initSocket = () => {
      try {
        const wsUrl = window.location.origin; // Force relative to current domain to fix mismatch
        const newSocket = io(wsUrl, {
          path: '/api/socket',
          transports: ['websocket', 'polling'],
          upgrade: true,
          rememberUpgrade: true,
          timeout: 20000,
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000
        })

        newSocket.on('connect', () => {
          console.log('WebSocket connected:', newSocket.id)
          setConnected(true)
          setError(null)
          
          // Join cargo room if cargoId provided
          if (cargoId) {
            newSocket.emit('join-cargo', cargoId)
          }
        })

        newSocket.on('disconnect', () => {
          console.log('WebSocket disconnected')
          setConnected(false)
        })

        newSocket.on('connect_error', (error) => {
          console.error('WebSocket connection error:', error)
          setError(error.message)
          setConnected(false)
        })

        newSocket.on('error', (error) => {
          console.error('WebSocket error:', error)
          setError(error.message)
        })

        // Handle chat messages
        newSocket.on('chat-message', (data: { cargoId: string; message: WebSocketMessage }) => {
          if (data.cargoId === cargoId) {
            setMessages(prev => [...prev, data.message])
          }
        })

        // Handle quote updates
        newSocket.on('quote-update', (data: QuoteUpdate) => {
          if (data.cargoId === cargoId) {
            setQuoteUpdate(data)
          }
        })

        // Handle negotiation status
        newSocket.on('negotiation-status', (data: NegotiationStatus) => {
          if (data.cargoId === cargoId) {
            setNegotiationStatus(data)
          }
        })

        // Handle notifications
        newSocket.on('notification', (data: any) => {
          console.log('Notification received:', data)
          // You can handle notifications here
        })

        socketRef.current = newSocket
        setSocket(newSocket)

        return newSocket
      } catch (error) {
        console.error('Failed to initialize WebSocket:', error)
        setError('Failed to connect to WebSocket server')
        return null
      }
    }

    const socketInstance = initSocket()

    // Cleanup on unmount
    return () => {
      if (socketInstance) {
        if (cargoId) {
          socketInstance.emit('leave-cargo', cargoId)
        }
        socketInstance.disconnect()
      }
    }
  }, [cargoId])

  // Send quote
  const sendQuote = (price: number, message?: string) => {
    if (socket && connected && cargoId) {
      socket.emit('send-quote', {
        cargoId,
        price,
        message
      })
    } else {
      console.error('Cannot send quote: WebSocket not connected or cargoId missing')
    }
  }

  // Send chat message
  const sendChatMessage = (
    content: string, 
    messageType: 'text' | 'quote' | 'counter' | 'accept' | 'reject' = 'text',
    priceAmount?: number
  ) => {
    if (socket && connected && cargoId) {
      socket.emit('send-chat-message', {
        cargoId,
        content,
        messageType,
        priceAmount
      })
    } else {
      console.error('Cannot send message: WebSocket not connected or cargoId missing')
    }
  }

  // Handle negotiation action
  const handleNegotiationAction = (
    action: 'accept' | 'reject' | 'counter',
    quoteId: string,
    counterPrice?: number
  ) => {
    if (socket && connected && cargoId) {
      socket.emit('negotiation-action', {
        cargoId,
        action,
        quoteId,
        counterPrice
      })
    } else {
      console.error('Cannot handle negotiation action: WebSocket not connected or cargoId missing')
    }
  }

  // Join different cargo room
  const joinCargo = (newCargoId: string) => {
    if (socket && connected) {
      if (cargoId) {
        socket.emit('leave-cargo', cargoId)
      }
      socket.emit('join-cargo', newCargoId)
    }
  }

  return {
    socket,
    connected,
    messages,
    quoteUpdate,
    negotiationStatus,
    error,
    sendQuote,
    sendChatMessage,
    handleNegotiationAction,
    joinCargo,
    // Utility functions
    clearMessages: () => setMessages([]),
    clearQuoteUpdate: () => setQuoteUpdate(null),
    clearNegotiationStatus: () => setNegotiationStatus(null),
    clearError: () => setError(null)
  }
}

export default useWebSocket