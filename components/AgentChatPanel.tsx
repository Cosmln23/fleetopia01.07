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

  // No auto-welcome message - handled in status area instead

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

  const getPageContext = () => {
    // Mock page data - în production va citi din store-uri
    return {
      vehicles: [
        { id: 'v001', driver: 'John Smith', location: 'Amsterdam, Netherlands', status: 'available' },
        { id: 'v002', driver: 'Maria Garcia', location: 'Berlin, Germany', status: 'in_transit', route: 'Munich → Vienna', eta: '18:30' },
        { id: 'v003', driver: 'Pierre Dubois', location: 'Lyon, France', status: 'loading' }
      ],
      cargoOffers: [
        { id: 'c001', route: 'Amsterdam → Berlin', distance: '650km', shipper: 'Marco Rossi', status: 'quote_sent', amount: '€850' },
        { id: 'c002', route: 'Munich → Vienna', distance: '435km', shipper: 'Klaus Müller', status: 'analyzing' },
        { id: 'c003', route: 'Lyon → Milan', distance: '320km', shipper: 'Sophie Dubois', status: 'monitoring' }
      ],
      agentLevels: {
        L0: { enabled: true, description: 'Automatic cargo opportunity detection' },
        L1: { enabled: true, description: 'Automatic cost and profit calculation' },
        L2: { enabled: false, description: 'Automatic quote generation and sending' },
        L3: { enabled: true, description: 'Automatic pricing optimization' },
        L4: { enabled: false, description: 'Automatic negotiation management' }
      }
    }
  }

  const categorizeUserInput = (message: string): 'page-activity' | 'off-topic' => {
    const pageKeywords = [
      'vehicle', 'cargo', 'offer', 'quote', 'decision', 'calculate', 'suggest', 'recommend',
      'where', 'status', 'margin', 'route', 'analyze', 'optimize', 'level', 'L0', 'L1', 'L2', 'L3', 'L4',
      'distance', 'cost', 'price', 'shipper', 'driver', 'location', 'available', 'monitoring'
    ]
    
    return pageKeywords.some(keyword => message.toLowerCase().includes(keyword)) ? 'page-activity' : 'off-topic'
  }

  const generateAgentResponse = (userMessage: string): AgentChatMessage => {
    const context = getPageContext()
    const category = categorizeUserInput(userMessage)
    const lowerMessage = userMessage.toLowerCase()
    
    let response = ''
    
    if (category === 'off-topic') {
      response = 'I only track dispatcher page activities. Ask me about: vehicle locations, cargo offers, agent decisions, route calculations, or current page status.'
    } else {
      // Vehicle location queries
      if (lowerMessage.includes('where') && (lowerMessage.includes('vehicle') || lowerMessage.includes('driver'))) {
        response = `Vehicle locations: ${context.vehicles.map(v => 
          `${v.driver} in ${v.location} (${v.status})`
        ).join(', ')}`
      }
      // Cargo/offers queries
      else if (lowerMessage.includes('cargo') || lowerMessage.includes('offer')) {
        response = `Active cargo: ${context.cargoOffers.length} offers. ${context.cargoOffers.map(c => 
          `${c.route} (${c.status})`
        ).join(', ')}`
      }
      // Agent levels queries
      else if (lowerMessage.includes('level') || lowerMessage.includes('L')) {
        const activeLevels = Object.entries(context.agentLevels)
          .filter(([_, level]) => level.enabled)
          .map(([key, _]) => key)
        response = `Active levels: ${activeLevels.join(', ')}. L0 monitoring offers, L1 calculating costs, L3 optimizing margins.`
      }
      // Quote/pricing queries
      else if (lowerMessage.includes('quote') || lowerMessage.includes('price')) {
        response = 'L2 sent quote €850 for Amsterdam→Berlin: 650km × €1.20/km = €780 + €70 margin (9%). L3 suggests increasing to 16% (+€120).'
      }
      // Margin/profit queries
      else if (lowerMessage.includes('margin') || lowerMessage.includes('profit')) {
        response = 'L1 calculated optimal margins: Amsterdam→Berlin 15%, Munich→Vienna 16%, Lyon→Milan 14%. L3 recommends increasing by 2% based on fuel trends.'
      }
      // Status/summary queries
      else if (lowerMessage.includes('status') || lowerMessage.includes('summary')) {
        response = `Page status: ${context.vehicles.length} vehicles (2 available), ${context.cargoOffers.length} cargo offers, ${Object.values(context.agentLevels).filter(l => l.enabled).length}/5 agent levels active.`
      }
      // Decision queries
      else if (lowerMessage.includes('decision') || lowerMessage.includes('why')) {
        response = 'Recent decisions: L0 detected Amsterdam→Berlin offer, L1 calculated €780 base cost, L3 suggested 15% margin, result: €850 quote sent.'
      }
      // Suggestions/recommendations
      else if (lowerMessage.includes('suggest') || lowerMessage.includes('recommend')) {
        response = 'L3 suggestions: Increase Amsterdam→Berlin margin to 16% (+€120), monitor Munich→Vienna for better rates, optimize Lyon→Milan route timing.'
      }
      // Default page summary
      else {
        response = `Monitoring dispatcher page: ${context.vehicles.filter(v => v.status === 'available').length} available vehicles, ${context.cargoOffers.filter(c => c.status === 'quote_sent').length} quotes sent, L0-L1-L3 systems active.`
      }
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