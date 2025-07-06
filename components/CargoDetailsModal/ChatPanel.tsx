'use client'

import { useState, useEffect, useRef } from 'react'

interface Message {
  id: string
  content: string
  senderId: string
  senderType: 'user' | 'shipper' | 'agent'
  timestamp: string
  status: 'sending' | 'sent' | 'failed'
}

interface ChatPanelProps {
  cargoId: string
}

export default function ChatPanel({ cargoId }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: 'Hello! I\'m interested in your cargo. Can we discuss the details?',
      senderId: 'current-user',
      senderType: 'user',
      timestamp: new Date().toISOString(),
      status: 'sent'
    }
  ])
  const [newMessage, setNewMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [agentTyping, setAgentTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

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

  const getMessageBubbleClass = (senderType: string) => {
    switch (senderType) {
      case 'user':
        return 'bg-blue-600 text-white ml-auto'
      case 'shipper':
        return 'bg-[#363636] text-white mr-auto'
      case 'agent':
        return 'bg-green-600 text-white mx-auto border border-green-500'
      default:
        return 'bg-[#363636] text-white mr-auto'
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
      <div className="bg-[#1a1a1a] rounded-lg p-3 h-64 overflow-y-auto mb-4 space-y-3">
        {messages.map((message) => (
          <div key={message.id} className="flex flex-col">
            <div className={`max-w-xs px-3 py-2 rounded-lg text-sm ${getMessageBubbleClass(message.senderType)}`}>
              {message.senderType === 'agent' && (
                <div className="text-xs text-green-200 mb-1">Agent Assistant</div>
              )}
              <p>{message.content}</p>
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