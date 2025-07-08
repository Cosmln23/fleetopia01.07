'use client'

import { useState, useEffect } from 'react'
import { useDispatcherStore } from '@/app/dispatcher/state/store'
import AgentChatPanel from './AgentChatPanel'

interface AgentDecision {
  id: string
  type: 'L0' | 'L1' | 'L2' | 'L3' | 'L4'
  action: string
  cargoId?: string
  result: string
  timestamp: string
  confidence?: number
}

interface AgentDropletProps {
  agentPopupOpen: boolean
  setAgentPopupOpen: (open: boolean) => void
}

export default function AgentDroplet({ agentPopupOpen, setAgentPopupOpen }: AgentDropletProps) {
  const { agentEnabled } = useDispatcherStore()

  // Mock recent agent decisions
  const recentDecisions: AgentDecision[] = [
    {
      id: '1',
      type: 'L2',
      action: 'Auto-sent quote',
      cargoId: 'cargo-1',
      result: 'Quote €850 for Amsterdam → Berlin cargo',
      timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      confidence: 0.92
    },
    {
      id: '2', 
      type: 'L4',
      action: 'Negotiated counter',
      cargoId: 'cargo-2',
      result: 'Counter-offer €1,200 accepted by shipper',
      timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      confidence: 0.85
    },
    {
      id: '3',
      type: 'L1',
      action: 'Cost analysis',
      cargoId: 'cargo-3', 
      result: 'Calculated optimal price €650 (18% margin)',
      timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      confidence: 0.78
    }
  ]

  const formatTimeAgo = (timestamp: string) => {
    const diff = Date.now() - new Date(timestamp).getTime()
    const minutes = Math.floor(diff / (1000 * 60))
    if (minutes < 1) return 'just now'
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    return 'yesterday'
  }

  const getLevelColor = (type: string) => {
    switch (type) {
      case 'L0': return 'text-blue-400'
      case 'L1': return 'text-green-400' 
      case 'L2': return 'text-yellow-400'
      case 'L3': return 'text-orange-400'
      case 'L4': return 'text-purple-400'
      default: return 'text-[#adadad]'
    }
  }

  const getLevelBg = (type: string) => {
    switch (type) {
      case 'L0': return 'bg-blue-500/20 border-blue-500/30'
      case 'L1': return 'bg-green-500/20 border-green-500/30'
      case 'L2': return 'bg-yellow-500/20 border-yellow-500/30'
      case 'L3': return 'bg-orange-500/20 border-orange-500/30'
      case 'L4': return 'bg-purple-500/20 border-purple-500/30'
      default: return 'bg-[#363636] border-[#4d4d4d]'
    }
  }

  // Close popup when clicking outside
  useEffect(() => {
    function onClickOutside(evt: MouseEvent) {
      if (!document.getElementById('agent-button-container')?.contains(evt.target as Node) &&
          !document.getElementById('agent-popup')?.contains(evt.target as Node)) {
        setAgentPopupOpen(false)
      }
    }
    if (agentPopupOpen) {
      document.addEventListener('click', onClickOutside)
      return () => document.removeEventListener('click', onClickOutside)
    }
  }, [agentPopupOpen])

  // Picătura e FIXĂ - întotdeauna vizibilă
  return (
    <>
      {/* Semicercul F - vizibil DOAR când popup-ul e închis */}
      {!agentPopupOpen && (
        <div 
          className="absolute -top-10 left-1/2 transform -translate-x-1/2 w-20 h-10 bg-[#1a1a1a] shadow-lg flex items-center justify-center pointer-events-auto z-30 hover:bg-[#2a2a2a] transition-colors cursor-pointer overflow-hidden"
          style={{
            borderRadius: '40px 40px 0 0',
            border: '1px solid #4d4d4d',
            borderBottom: 'none'
          }}
          id="agent-button-container"
          onClick={(e) => { 
            e.preventDefault() 
            e.stopPropagation()
            setAgentPopupOpen(true) 
          }}
        >
          {/* Litera F */}
          <div className={`${agentEnabled ? 'text-green-400' : 'text-[#adadad]'} text-lg font-bold`}>
            F
          </div>
          
          {/* Badge cu numărul de decizii - mai mic și mai discret */}
          {agentEnabled && recentDecisions.length > 0 && (
            <div className="absolute -top-0.5 -right-0.5 bg-blue-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold text-xs">
              {recentDecisions.length}
            </div>
          )}
        </div>
      )}

      {/* Popup - vizibil DOAR când e deschis, ACEEAȘI poziție ca semicerculul */}
      {agentPopupOpen && (
        <div 
          id="agent-popup"
          className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-full bg-[#1a1a1a] shadow-xl border border-[#4d4d4d] z-20 flex flex-col"
          style={{
            width: '512px',
            height: '512px',
            borderRadius: '12px 12px 0 0',
            borderBottom: 'none'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header - 50px */}
          <div className="h-12 flex items-center justify-between px-4 border-b border-[#363636]">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center">
                {agentEnabled ? (
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                ) : (
                  <div className="w-2 h-2 bg-[#666] rounded-full"></div>
                )}
              </div>
              <h4 className="text-white font-bold text-sm">Agent AI</h4>
            </div>
            <button
              onClick={() => setAgentPopupOpen(false)}
              className="text-[#666] hover:text-white transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Chat Messages Only - flex-grow */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0">
            <AgentChatPanel agentEnabled={agentEnabled} />
          </div>

          {/* Agent Status - auto-height */}
          <div className="border-t border-[#363636] p-3">
            {!agentEnabled ? (
              <div className="text-center py-2">
                <div className="text-xl mb-1">😴</div>
                <p className="text-[#666] text-sm">Agent is disabled</p>
                <p className="text-[#666] text-xs">Enable to see decisions</p>
              </div>
            ) : recentDecisions.length === 0 ? (
              <div className="text-center py-2">
                <div className="text-xl mb-1">🔍</div>
                <p className="text-[#666] text-sm">No decisions yet</p>
                <p className="text-[#666] text-xs">Waiting for agent activity</p>
              </div>
            ) : (
              <div className="py-2">
                <div className="bg-[#2d2d2d] border border-[#363636] rounded-lg p-3">
                  <p className="text-white text-sm mb-2">Hi! I'm monitoring cargo offers. How can I help?</p>
                  <p className="text-[#adadad] text-xs">
                    {new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Input Area - între status și footer */}
          <div className="h-12 border-t border-[#363636] p-2 flex gap-2">
            <input
              type="text"
              placeholder={agentEnabled ? "Ask agent about page activities..." : "Enable agent to ask about page"}
              disabled={!agentEnabled}
              className="flex-1 bg-[#2d2d2d] border border-[#363636] rounded px-2 py-1 text-white text-sm placeholder-[#666] focus:outline-none focus:border-green-500 disabled:opacity-50"
              onKeyPress={(e) => {
                if (e.key === 'Enter' && (e.target as HTMLInputElement).value.trim()) {
                  // Simulez trimiterea mesajului
                  console.log('Message sent:', (e.target as HTMLInputElement).value);
                  (e.target as HTMLInputElement).value = '';
                }
              }}
            />
            <button
              disabled={!agentEnabled}
              className="w-8 h-8 bg-green-500 hover:bg-green-600 disabled:bg-[#363636] disabled:cursor-not-allowed text-white rounded flex items-center justify-center transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>

          {/* Footer - 50px */}
          <div className="h-12 border-t border-[#363636] px-4 flex items-center justify-between">
            <div className="text-[#666] text-xs">
              {agentEnabled ? 'Live monitoring' : 'Enable agent to start'}
            </div>
            <button 
              className="text-blue-400 text-xs hover:text-blue-300 transition-colors"
              onClick={() => {
                setAgentPopupOpen(false)
                window.location.href = '/dispatcher'
              }}
            >
              View All →
            </button>
          </div>
        </div>
      )}
    </>
  )
}