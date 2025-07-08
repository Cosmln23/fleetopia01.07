'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useDispatcherStore } from '@/app/dispatcher/state/store'

interface SendMessageRequest {
  cargoId: string
  content: string
  senderType: 'user' | 'shipper' | 'agent'
}

interface ConnectionState {
  isConnected: boolean
  connectionType: 'websocket' | 'polling' | 'offline'
  lastReconnectAttempt?: number
  reconnectAttempts: number
}

const MAX_RECONNECT_ATTEMPTS = 5
const RECONNECT_DELAY = 1000 // Base delay for reconnection
const POLLING_INTERVAL = 5000 // Fallback polling interval
const MESSAGE_RETRY_DELAY = 2000 // Delay before retrying failed messages

export function useChatNegotiation(cargoId: string) {
  const [connectionState, setConnectionState] = useState<ConnectionState>({
    isConnected: false,
    connectionType: 'offline',
    reconnectAttempts: 0
  })
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set())
  const [agentTyping, setAgentTyping] = useState(false)
  
  const wsRef = useRef<WebSocket | null>(null)
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  const {
    chatMessages,
    addChatMessage,
    updateMessageStatus,
    addToRetryQueue,
    removeFromRetryQueue,
    setCurrentNegotiation,
    levelSettings
  } = useDispatcherStore()

  // Get messages for this cargo
  const messages = chatMessages.filter(msg => msg.cargoId === cargoId)

  // Initialize WebSocket connection
  const initializeWebSocket = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return true
    }

    try {
      // In production, this would be the actual WebSocket URL
      const wsUrl = `ws://localhost:3001/chat/${cargoId}`
      wsRef.current = new WebSocket(wsUrl)

      wsRef.current.onopen = () => {
        console.log('WebSocket connected for cargo:', cargoId)
        setConnectionState({
          isConnected: true,
          connectionType: 'websocket',
          reconnectAttempts: 0
        })
        
        // Clear any polling interval
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current)
          pollingIntervalRef.current = null
        }
      }

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          handleIncomingMessage(data)
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error)
        }
      }

      wsRef.current.onclose = () => {
        console.log('WebSocket disconnected for cargo:', cargoId)
        setConnectionState(prev => ({ ...prev, isConnected: false }))
        
        // Attempt to reconnect or fallback to polling
        handleConnectionLoss()
      }

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error)
        setConnectionState(prev => ({ ...prev, isConnected: false }))
      }

      return true
    } catch (error) {
      console.error('Failed to initialize WebSocket:', error)
      return false
    }
  }, [cargoId])

  // Handle incoming messages from WebSocket or polling
  const handleIncomingMessage = useCallback((data: any) => {
    switch (data.type) {
      case 'message':
        addChatMessage({
          id: data.id || crypto.randomUUID(),
          cargoId: data.cargoId,
          content: data.content,
          senderId: data.senderId,
          senderType: data.senderType,
          timestamp: data.timestamp || new Date().toISOString(),
          status: 'sent'
        })
        break
        
      case 'typing':
        if (data.senderType === 'agent') {
          setAgentTyping(true)
          // Clear typing indicator after 3 seconds
          if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current)
          }
          typingTimeoutRef.current = setTimeout(() => {
            setAgentTyping(false)
          }, 3000)
        } else {
          setTypingUsers(prev => new Set(prev).add(data.senderId))
          setTimeout(() => {
            setTypingUsers(prev => {
              const newSet = new Set(prev)
              newSet.delete(data.senderId)
              return newSet
            })
          }, 3000)
        }
        break
        
      case 'quote_status':
        // Handle quote status updates
        console.log('Quote status update:', data)
        break
        
      case 'agent_suggestion':
        // Handle agent suggestions
        if (levelSettings.L4) {
          handleAgentSuggestion(data)
        }
        break
    }
  }, [addChatMessage, levelSettings.L4])

  // Handle agent suggestions for L4 negotiation
  const handleAgentSuggestion = useCallback((data: any) => {
    setAgentTyping(true)
    
    // Simulate agent processing time
    setTimeout(() => {
      const agentMessage = `Agent suggests: ${data.suggestion}. Counter-offer: €${data.counterPrice}`
      
      addChatMessage({
        id: crypto.randomUUID(),
        cargoId,
        content: agentMessage,
        senderId: 'agent-system',
        senderType: 'agent',
        timestamp: new Date().toISOString(),
        status: 'sent'
      })
      
      setAgentTyping(false)
    }, 2000)
  }, [cargoId, addChatMessage])

  // Handle connection loss and implement fallback
  const handleConnectionLoss = useCallback(() => {
    const currentState = connectionState
    
    if (currentState.reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      // Switch to polling mode
      console.log('Max reconnect attempts reached, switching to polling mode')
      setConnectionState({
        isConnected: true,
        connectionType: 'polling',
        reconnectAttempts: 0
      })
      startPolling()
      return
    }

    // Attempt reconnection with exponential backoff
    const delay = RECONNECT_DELAY * Math.pow(2, currentState.reconnectAttempts)
    
    reconnectTimeoutRef.current = setTimeout(() => {
      console.log(`Reconnect attempt ${currentState.reconnectAttempts + 1}`)
      setConnectionState(prev => ({
        ...prev,
        reconnectAttempts: prev.reconnectAttempts + 1,
        lastReconnectAttempt: Date.now()
      }))
      
      if (!initializeWebSocket()) {
        handleConnectionLoss()
      }
    }, delay)
  }, [connectionState, initializeWebSocket])

  // Start polling as fallback
  const startPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current)
    }

    pollingIntervalRef.current = setInterval(async () => {
      try {
        const response = await fetch(`/api/chat/${cargoId}/messages?since=${Date.now() - POLLING_INTERVAL}`)
        if (response.ok) {
          const data = await response.json()
          data.messages?.forEach((message: any) => {
            handleIncomingMessage({ type: 'message', ...message })
          })
        }
      } catch (error) {
        console.error('Polling failed:', error)
        setConnectionState(prev => ({ ...prev, connectionType: 'offline' }))
      }
    }, POLLING_INTERVAL)
  }, [cargoId, handleIncomingMessage])

  // Send message with retry logic
  const sendMessage = useCallback(async (request: SendMessageRequest): Promise<{ success: boolean; messageId?: string; error?: string }> => {
    const { content, senderType } = request

    if (!content.trim()) {
      return { success: false, error: 'Message cannot be empty' }
    }

    const messageId = crypto.randomUUID();

    // Add message to local state with sending status
    const messageData = {
      id: messageId,
      cargoId,
      content: content.trim(),
      senderId: 'current-user', // This should come from auth context
      senderType,
      timestamp: new Date().toISOString(),
      status: 'sending' as const,
    };

    addChatMessage(messageData);

    try {
      if (connectionState.connectionType === 'websocket' && wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'message', ...messageData }))
        updateMessageStatus(messageId, 'sent')
        return { success: true, messageId }
      } else {
        throw new Error('Not connected via WebSocket')
      }
    } catch (error) {
      console.warn('Failed to send message, adding to retry queue:', error)
      updateMessageStatus(messageId, 'failed')
      addToRetryQueue({
        id: messageId,
        type: 'message',
        data: messageData,
        retryCount: 0,
        lastAttempt: new Date().toISOString()
      })
      return { success: false, error: (error as Error).message, messageId }
    }
  }, [cargoId, addChatMessage, updateMessageStatus, connectionState, addToRetryQueue])

  // Retry failed message
  const retryMessage = useCallback(async (messageId: string, request: SendMessageRequest) => {
    updateMessageStatus(messageId, 'sending')
    
    const result = await sendMessage(request)
    
    if (result.success) {
      removeFromRetryQueue(messageId)
    }
  }, [sendMessage, updateMessageStatus, removeFromRetryQueue])

  // Send typing indicator
  const sendTypingIndicator = useCallback(() => {
    if (connectionState.connectionType === 'websocket' && wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'typing',
        cargoId,
        senderId: 'current-user',
        senderType: 'user'
      }))
    }
  }, [cargoId, connectionState.connectionType])

  // Initialize connection when component mounts
  useEffect(() => {
    setCurrentNegotiation(cargoId)
    
    // Try WebSocket first, fallback to polling
    if (!initializeWebSocket()) {
      startPolling()
    }

    return () => {
      // Cleanup on unmount
      if (wsRef.current) {
        wsRef.current.close()
      }
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
      setCurrentNegotiation(null)
    }
  }, [cargoId, initializeWebSocket, startPolling, setCurrentNegotiation])

  return {
    // State
    messages,
    connectionState,
    typingUsers,
    agentTyping,
    
    // Actions
    sendMessage,
    retryMessage,
    sendTypingIndicator,
    
    // Connection management
    initializeWebSocket,
    startPolling,
    
    // Constants
    POLLING_INTERVAL,
    MAX_RECONNECT_ATTEMPTS
  }
}