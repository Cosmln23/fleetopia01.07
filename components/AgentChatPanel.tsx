'use client'

import { useState, useEffect, useRef } from 'react'
import { useDispatcherStore } from '@/app/dispatcher/state/store'

interface AgentChatMessage {
  id: string
  sender: 'agent' | 'user'
  content: string
  timestamp: string
  relatedDecision?: string
}

interface AgentChatPanelProps {
  agentEnabled: boolean
}

export default function AgentChatPanel({ agentEnabled }: AgentChatPanelProps) {
  const [messages, setMessages] = useState<AgentChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Initialize with welcome message
  useEffect(() => {
    if (agentEnabled && messages.length === 0) {
      setMessages([
        {
          id: '1',
          sender: 'agent',
          content: 'Hi! I\'m monitoring cargo offers. How can I help?',
          timestamp: new Date().toISOString()
        }
      ])
    }
  }, [agentEnabled, messages.length])

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return

    const userMessage: AgentChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      content: newMessage,
      timestamp: new Date().toISOString()
    }

    setMessages(prev => [...prev, userMessage])
    setNewMessage('')

    if (agentEnabled) {
      setIsTyping(true)
      
      // Simulate agent response after 1.5 seconds
      setTimeout(() => {
        const agentResponse = generateAgentResponse(newMessage)
        setMessages(prev => [...prev, agentResponse])
        setIsTyping(false)
      }, 1500)
    }
  }

  const generateAgentResponse = (userMessage: string): AgentChatMessage => {
    const lowerMessage = userMessage.toLowerCase()
    
    let response = ''
    
    if (lowerMessage.includes('margin') || lowerMessage.includes('profit')) {
      response = 'Based on L1 analysis, I recommend 15-18% margins for current routes. Munich routes show 16.5% optimal.'
    } else if (lowerMessage.includes('quote') || lowerMessage.includes('price')) {
      response = 'I just sent a €850 quote for Amsterdam→Berlin. L2 auto-quoting is active on 3 offers.'
    } else if (lowerMessage.includes('status') || lowerMessage.includes('offers')) {
      response = 'Monitoring 5 cargo offers. 2 quotes sent, 1 negotiation active. L0-L4 systems running.'
    } else if (lowerMessage.includes('help') || lowerMessage.includes('?')) {
      response = 'I can help with: pricing analysis, quote generation, route optimization, and negotiation. What do you need?'
    } else {
      response = 'I understand. Let me analyze that and get back to you with recommendations.'
    }

    return {
      id: Date.now().toString(),
      sender: 'agent',
      content: response,
      timestamp: new Date().toISOString()
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  return (
    <>
      {/* Messages Area DOAR */}
      {messages.length === 0 ? (
        <div className="text-center text-[#666] text-sm py-4">
          {agentEnabled ? 'Start a conversation...' : 'Enable agent to chat'}
        </div>
      ) : (
        messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} mb-2`}
          >
            <div
              className={`max-w-[80%] p-2 rounded-lg text-sm ${
                message.sender === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-[#2d2d2d] text-white border border-[#363636]'
              }`}
            >
              <p className="text-xs">{message.content}</p>
              <p className={`text-xs mt-1 opacity-70 ${
                message.sender === 'user' ? 'text-blue-100' : 'text-[#adadad]'
              }`}>
                {formatTime(message.timestamp)}
              </p>
            </div>
          </div>
        ))
      )}
      
      {/* Typing indicator */}
      {isTyping && (
        <div className="flex justify-start mb-2">
          <div className="bg-[#2d2d2d] border border-[#363636] rounded-lg p-2 text-sm">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-[#adadad] text-xs">Agent is typing...</span>
            </div>
          </div>
        </div>
      )}
      
      <div ref={messagesEndRef} />

      {/* Returnez și funcțiile pentru folosire în AgentDroplet */}
      <div style={{ display: 'none' }}>
        <input
          ref={(el) => {
            if (el) {
              (window as any).agentChatHandlers = {
                newMessage,
                setNewMessage,
                handleSendMessage,
                handleKeyPress,
                agentEnabled
              }
            }
          }}
        />
      </div>
    </>
  )
}