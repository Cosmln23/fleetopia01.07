'use client'

import { useState, useEffect, useRef } from 'react'
import { useWebSocket } from '@/hooks/useWebSocket'

interface Message {
  id: string
  content: string
  senderId: string
  senderType: 'user' | 'shipper' | 'agent'
  messageType: 'text' | 'quote' | 'counter' | 'accept' | 'reject' | 'audit'
  timestamp: string
  status: 'sending' | 'sent' | 'failed'
  // Negotiation specific
  priceAmount?: number
  actions?: string[]
  calculationDetails?: any
  relatedMessageId?: string
}

interface ChatPanelProps {
  cargoId: string
  onQuoteSent?: (price: number) => void
  suggestedPrice?: number
}

export default function ChatPanel({ cargoId, onQuoteSent, suggestedPrice }: ChatPanelProps) {
  // WebSocket integration
  const {
    connected: wsConnected,
    messages: wsMessages,
    quoteUpdate,
    negotiationStatus,
    sendQuote: wsSendQuote,
    sendChatMessage: wsSendChatMessage,
    handleNegotiationAction,
    error: wsError
  } = useWebSocket(cargoId)
  
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: 'Hello! I\'m interested in your cargo. Can we discuss the details?',
      senderId: 'current-user',
      senderType: 'user',
      messageType: 'text',
      timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
      status: 'sent'
    },
    {
      id: '2',
      content: 'Hi! Thanks for your interest. The cargo is time-sensitive - needs to be delivered by tomorrow evening.',
      senderId: 'shipper-123',
      senderType: 'shipper',
      messageType: 'text',
      timestamp: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
      status: 'sent'
    },
    {
      id: '3',
      content: '€750',
      senderId: 'current-user',
      senderType: 'user',
      messageType: 'quote',
      timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      status: 'sent',
      priceAmount: 750
    },
    {
      id: '4',
      content: 'Received €750',
      senderId: 'shipper-123',
      senderType: 'shipper',
      messageType: 'text',
      timestamp: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
      status: 'sent',
      actions: ['accept', 'reject', 'counter']
    }
  ])
  const [newMessage, setNewMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [agentTyping, setAgentTyping] = useState(false)
  const [showQuoteInput, setShowQuoteInput] = useState(false)
  const [quoteAmount, setQuoteAmount] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])
  
  // Handle WebSocket messages
  useEffect(() => {
    if (wsMessages.length > 0) {
      const latestWsMessage = wsMessages[wsMessages.length - 1]
      const newMessage: Message = {
        id: latestWsMessage.id,
        content: latestWsMessage.content,
        senderId: latestWsMessage.senderId,
        senderType: latestWsMessage.senderType,
        messageType: latestWsMessage.messageType,
        timestamp: latestWsMessage.timestamp,
        status: 'sent',
        priceAmount: latestWsMessage.priceAmount
      }
      
      setMessages(prev => {
        // Avoid duplicates
        const exists = prev.some(msg => msg.id === newMessage.id)
        if (!exists) {
          return [...prev, newMessage]
        }
        return prev
      })
    }
  }, [wsMessages])

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 100) + 'px'
    }
  }, [newMessage])

  const sendMessage = async () => {
    if (!newMessage.trim() || isTyping) return

    const messageToSend = newMessage.trim()
    setNewMessage('')
    setIsTyping(true)

    // Add user message with sending status
    const userMessage: Message = {
      id: Date.now().toString(),
      content: messageToSend,
      senderId: 'current-user',
      senderType: 'user',
      messageType: 'text',
      timestamp: new Date().toISOString(),
      status: 'sending'
    }

    setMessages(prev => [...prev, userMessage])

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Update message status to sent
      setMessages(prev => 
        prev.map(msg => 
          msg.id === userMessage.id 
            ? { ...msg, status: 'sent' as const }
            : msg
        )
      )

      // Simulate shipper response after a delay
      setTimeout(() => {
        const shipperResponse: Message = {
          id: (Date.now() + 1).toString(),
          content: 'Thank you for your interest! The cargo needs to be delivered by the specified date. Are you able to handle this?',
          senderId: 'shipper-123',
          senderType: 'shipper',
          messageType: 'text',
          timestamp: new Date().toISOString(),
          status: 'sent'
        }
        setMessages(prev => [...prev, shipperResponse])
      }, 2000)

    } catch (error) {
      // Update message status to failed
      setMessages(prev => 
        prev.map(msg => 
          msg.id === userMessage.id 
            ? { ...msg, status: 'failed' as const }
            : msg
        )
      )
    } finally {
      setIsTyping(false)
    }
  }

  const sendQuote = async (amount: number) => {
    if (isTyping) return
    
    setIsTyping(true)
    
    const quoteMessage: Message = {
      id: Date.now().toString(),
      content: `€${amount}`,
      senderId: 'current-user',
      senderType: 'user',
      messageType: 'quote',
      timestamp: new Date().toISOString(),
      status: 'sending',
      priceAmount: amount
    }
    
    setMessages(prev => [...prev, quoteMessage])
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Update message status to sent
      setMessages(prev => 
        prev.map(msg => 
          msg.id === quoteMessage.id 
            ? { ...msg, status: 'sent' as const }
            : msg
        )
      )
      
      // Call parent callback
      onQuoteSent?.(amount)
      
      // Simulate shipper response with actions
      setTimeout(() => {
        const shipperResponse: Message = {
          id: (Date.now() + 1).toString(),
          content: `Received €${amount}`,
          senderId: 'shipper-123',
          senderType: 'shipper',
          messageType: 'text',
          timestamp: new Date().toISOString(),
          status: 'sent',
          actions: ['accept', 'reject', 'counter']
        }
        setMessages(prev => [...prev, shipperResponse])
      }, 1500)
      
    } catch (error) {
      setMessages(prev => 
        prev.map(msg => 
          msg.id === quoteMessage.id 
            ? { ...msg, status: 'failed' as const }
            : msg
        )
      )
    } finally {
      setIsTyping(false)
    }
  }
  
  const handleNegotiationAction = async (action: string, originalMessage: Message) => {
    if (isTyping) return
    
    setIsTyping(true)
    
    let responseContent = ''
    let responseType: Message['messageType'] = 'text'
    
    switch (action) {
      case 'accept':
        responseContent = `Accepted your offer of €${originalMessage.priceAmount}! 🎉`
        responseType = 'accept'
        break
      case 'reject':
        responseContent = `Sorry, can't accept €${originalMessage.priceAmount}. Too low for this cargo.`
        responseType = 'reject'
        break
      case 'counter':
        const counterAmount = Math.round((originalMessage.priceAmount || 0) * 1.15)
        responseContent = `Counter offer: €${counterAmount}`
        responseType = 'counter'
        break
    }
    
    const actionMessage: Message = {
      id: Date.now().toString(),
      content: responseContent,
      senderId: 'shipper-123',
      senderType: 'shipper',
      messageType: responseType,
      timestamp: new Date().toISOString(),
      status: 'sent',
      relatedMessageId: originalMessage.id
    }
    
    // Remove actions from original message
    setMessages(prev => 
      prev.map(msg => 
        msg.id === originalMessage.id 
          ? { ...msg, actions: undefined }
          : msg
      )
    )
    
    // Add response message
    setTimeout(() => {
      setMessages(prev => [...prev, actionMessage])
      setIsTyping(false)
    }, 1500)
  }
  
  const askAgentCalculation = () => {
    const agentAuditMessage: Message = {
      id: Date.now().toString(),
      content: `Cost calculation breakdown:

Distance: 450km
Base rate: €1.20/km
Base cost: 450 × €1.20 = €540
Fees: €80
Total cost: €620
Margin (15%): €93
Suggested price: €713

Your quote: €${quoteAmount || suggestedPrice || 800}
Profit margin: ${((parseFloat(quoteAmount || suggestedPrice?.toString() || '800') - 620) / 620 * 100).toFixed(1)}%`,
      senderId: 'agent-ai',
      senderType: 'agent',
      messageType: 'audit',
      timestamp: new Date().toISOString(),
      status: 'sent',
      calculationDetails: {
        distance: 450,
        baseRate: 1.20,
        baseCost: 540,
        fees: 80,
        totalCost: 620,
        margin: 15,
        suggestedPrice: 713
      }
    }
    
    setMessages(prev => [...prev, agentAuditMessage])
  }

  const retryMessage = async (messageId: string) => {
    setMessages(prev => 
      prev.map(msg => 
        msg.id === messageId 
          ? { ...msg, status: 'sending' as const }
          : msg
      )
    )

    try {
      await new Promise(resolve => setTimeout(resolve, 1000))
      setMessages(prev => 
        prev.map(msg => 
          msg.id === messageId 
            ? { ...msg, status: 'sent' as const }
            : msg
        )
      )
    } catch (error) {
      setMessages(prev => 
        prev.map(msg => 
          msg.id === messageId 
            ? { ...msg, status: 'failed' as const }
            : msg
        )
      )
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const getMessageBubbleClass = (senderType: string, messageType: string) => {
    const baseClass = 'px-3 py-2 rounded-lg text-sm max-w-xs'
    
    switch (senderType) {
      case 'user':
        return `${baseClass} bg-blue-600 text-white ml-auto`
      case 'shipper':
        return `${baseClass} bg-[#363636] text-white mr-auto`
      case 'agent':
        if (messageType === 'audit') {
          return `${baseClass} bg-gray-800 text-white mx-auto border border-blue-500 font-mono max-w-md`
        }
        return `${baseClass} bg-green-600 text-white mx-auto border border-green-500`
      default:
        return `${baseClass} bg-[#363636] text-white mr-auto`
    }
  }

  const getMessageStatusIcon = (status: string) => {
    switch (status) {
      case 'sending':
        return <div className="w-3 h-3 border border-gray-300 border-t-transparent rounded-full animate-spin" />
      case 'sent':
        return <svg className="w-3 h-3 text-green-400" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      case 'failed':
        return <button 
          onClick={() => retryMessage(status)}
          className="text-red-400 hover:text-red-300 text-xs underline"
        >
          Retry
        </button>
      default:
        return null
    }
  }

  return (
    <div className="bg-[#2d2d2d] rounded-lg p-4">
      <h3 className="text-white text-lg font-bold mb-4">Chat with shipper</h3>
      
      {/* Messages Container */}
      {/* Connection Status */}
      {wsError && (
        <div className="bg-red-600/20 border border-red-600/30 rounded-lg p-2 mb-3">
          <p className="text-red-400 text-xs">🔌 WebSocket Error: {wsError}</p>
        </div>
      )}
      
      {!wsConnected && (
        <div className="bg-yellow-600/20 border border-yellow-600/30 rounded-lg p-2 mb-3">
          <p className="text-yellow-400 text-xs">🔄 Connecting to real-time chat...</p>
        </div>
      )}
      
      {wsConnected && (
        <div className="bg-green-600/20 border border-green-600/30 rounded-lg p-2 mb-3">
          <p className="text-green-400 text-xs">✅ Real-time chat connected</p>
        </div>
      )}
      
      <div className="bg-[#1a1a1a] rounded-lg p-3 h-64 overflow-y-auto mb-4 space-y-3">
        {messages.map((message) => (
          <div key={message.id} className="flex flex-col">
            <div className={getMessageBubbleClass(message.senderType, message.messageType)}>
              {message.senderType === 'agent' && (
                <div className="text-xs text-green-200 mb-1">
                  {message.messageType === 'audit' ? 'Agent Calculation' : 'Agent Assistant'}
                </div>
              )}
              
              {message.messageType === 'audit' ? (
                <pre className="text-xs text-blue-200 whitespace-pre-wrap">{message.content}</pre>
              ) : (
                <p>{message.content}</p>
              )}
              
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs opacity-75">
                  {new Date(message.timestamp).toLocaleTimeString()}
                </span>
                {message.senderType === 'user' && (
                  <div className="ml-2">
                    {getMessageStatusIcon(message.status)}
                  </div>
                )}
              </div>
            </div>
            
            {/* Inline Action Buttons */}
            {message.actions && message.actions.length > 0 && (
              <div className="flex gap-2 mt-2 ml-auto mr-auto">
                {message.actions.map((action) => (
                  <button
                    key={action}
                    onClick={() => handleNegotiationAction(action, message)}
                    className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                      action === 'accept' 
                        ? 'bg-green-600 hover:bg-green-700 text-white' 
                        : action === 'reject'
                        ? 'bg-red-600 hover:bg-red-700 text-white'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    {action === 'accept' && '✔️ Accept'}
                    {action === 'reject' && '❌ Refuse'}
                    {action === 'counter' && '🔄 Counter'}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
        
        {/* Agent typing indicator */}
        {agentTyping && (
          <div className="flex justify-center">
            <div className="bg-green-600 text-white px-3 py-2 rounded-lg text-sm max-w-xs">
              <div className="flex items-center space-x-1">
                <span>Agent is typing</span>
                <div className="flex space-x-1">
                  <div className="w-1 h-1 bg-white rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                  <div className="w-1 h-1 bg-white rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                  <div className="w-1 h-1 bg-white rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Actions */}
      <div className="flex gap-2 mb-3">
        <button
          onClick={() => setShowQuoteInput(!showQuoteInput)}
          className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
        >
          💰 Send Quote
        </button>
        <button
          onClick={askAgentCalculation}
          className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
        >
          🤖 Ask Agent
        </button>
        {suggestedPrice && (
          <button
            onClick={() => sendQuote(suggestedPrice)}
            className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
          >
            ⭐ Use Suggested €{suggestedPrice}
          </button>
        )}
      </div>
      
      {/* Quote Input */}
      {showQuoteInput && (
        <div className="bg-[#363636] rounded-lg p-3 mb-3">
          <div className="flex gap-2">
            <input
              type="number"
              value={quoteAmount}
              onChange={(e) => setQuoteAmount(e.target.value)}
              placeholder="Enter your quote amount..."
              className="flex-1 bg-[#4d4d4d] border border-[#666] rounded px-3 py-2 text-white placeholder-[#adadad] focus:outline-none focus:border-white"
            />
            <button
              onClick={() => {
                if (quoteAmount) {
                  sendQuote(parseFloat(quoteAmount))
                  setQuoteAmount('')
                  setShowQuoteInput(false)
                }
              }}
              disabled={!quoteAmount || isTyping}
              className="bg-green-600 hover:bg-green-700 disabled:bg-green-800 text-white px-4 py-2 rounded transition-colors"
            >
              Send €{quoteAmount}
            </button>
          </div>
        </div>
      )}

      {/* Message Input */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            className="w-full bg-[#363636] border border-[#4d4d4d] rounded-lg px-3 py-2 text-white placeholder-[#adadad] focus:outline-none focus:border-white resize-none min-h-[40px] max-h-[100px]"
            rows={1}
          />
        </div>
        <button
          onClick={sendMessage}
          disabled={!newMessage.trim() || isTyping}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </div>
    </div>
  )
}