'use client'

import { useState, useEffect } from 'react'
import { useDispatcherStore } from '@/app/dispatcher/state/store'

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
  isVisible: boolean
  onToggle: () => void
}

export default function AgentDroplet({ isVisible, onToggle }: AgentDropletProps) {
  const [agentPopupOpen, setAgentPopupOpen] = useState(false)
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

  if (!isVisible) {
    return null
  }

  return (
    <>
      {/* 1. Contur picătură cu iconiță - răsturnată, DEASUPRA barei de meniu, mai lată la bază */}
      <div 
        className="absolute -top-12 left-1/2 transform -translate-x-1/2 w-16 h-12 bg-[#1a1a1a] shadow-lg flex items-center justify-center pointer-events-auto z-20 border border-[#4d4d4d] hover:bg-[#2a2a2a] transition-colors cursor-pointer"
        style={{
          clipPath: 'polygon(40% 0%, 60% 0%, 90% 100%, 10% 100%)'
        }}
        id="agent-button-container"
        onClick={(e) => { 
          e.preventDefault() 
          e.stopPropagation()
          setAgentPopupOpen(o => !o) 
        }}
      >
        {/* 2. Iconiță Agent - același stil ca celelalte iconițe din bara de meniu */}
        <div className={`${agentEnabled ? 'text-green-400' : 'text-[#adadad]'}`} data-icon="Robot" data-size="24px" data-weight="regular">
          <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" fill="currentColor" viewBox="0 0 256 256">
            <path d="M200,48H136V16a8,8,0,0,0-16,0V48H56A32,32,0,0,0,24,80V192a32,32,0,0,0,32,32H200a32,32,0,0,0,32-32V80A32,32,0,0,0,200,48Zm16,144a16,16,0,0,1-16,16H56a16,16,0,0,1-16-16V80A16,16,0,0,1,56,64H200a16,16,0,0,1,16,16Zm-52-56H92a28,28,0,0,0,0,56h72a28,28,0,0,0,0-56Zm-28,16v24H120V152ZM80,164a12,12,0,0,1,12-12h12v24H92A12,12,0,0,1,80,164Zm84,12H152V152h12a12,12,0,0,1,0,24ZM72,108a12,12,0,1,1,12,12A12,12,0,0,1,72,108Zm88,0a12,12,0,1,1,12,12A12,12,0,0,1,160,108Z" />
          </svg>
        </div>
        
        {/* Badge cu numărul de decizii */}
        {agentEnabled && recentDecisions.length > 0 && (
          <div className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
            {recentDecisions.length}
          </div>
        )}
      </div>

      {/* 3. Mini-interfața ascunsă (popup) */}
      <div 
        id="agent-popup"
        className={`absolute -top-48 left-1/2 transform -translate-x-1/2 w-64 bg-[#1a1a1a] p-4 rounded-xl shadow-xl transition-all duration-200 z-10 border border-[#363636] ${
          agentPopupOpen ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible translate-y-2'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
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
            className="text-[#666] hover:text-[#adadad] transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 256 256">
              <path d="M205.66,194.34a8,8,0,0,1-11.32,11.32L128,139.31,61.66,205.66a8,8,0,0,1-11.32-11.32L116.69,128,50.34,61.66A8,8,0,0,1,61.66,50.34L128,116.69l66.34-66.35a8,8,0,0,1,11.32,11.32L139.31,128Z"></path>
            </svg>
          </button>
        </div>

        {/* Status și decizii recente */}
        {!agentEnabled ? (
          <div className="text-center py-4">
            <div className="text-2xl mb-2">😴</div>
            <p className="text-[#666] text-sm">Agent is disabled</p>
            <p className="text-[#666] text-xs mt-1">Enable to see decisions</p>
          </div>
        ) : recentDecisions.length === 0 ? (
          <div className="text-center py-4">
            <div className="text-2xl mb-2">🔍</div>
            <p className="text-[#666] text-sm">No decisions yet</p>
            <p className="text-[#666] text-xs mt-1">Waiting for agent activity</p>
          </div>
        ) : (
          <div>
            <p className="text-sm text-[#adadad] mb-3">Recent agent decisions ({recentDecisions.length})</p>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {recentDecisions.slice(0, 3).map((decision) => (
                <div 
                  key={decision.id}
                  className={`p-2 rounded-lg border ${getLevelBg(decision.type)} bg-[#2d2d2d]/50`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`text-xs font-bold px-1.5 py-0.5 rounded ${getLevelColor(decision.type)} bg-current/10`}>
                      {decision.type}
                    </div>
                    <span className="text-[#666] text-xs">{formatTimeAgo(decision.timestamp)}</span>
                  </div>
                  <p className="text-white text-xs font-medium truncate">{decision.result}</p>
                  <p className="text-[#666] text-xs">{decision.action}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer cu acțiuni */}
        <div className="mt-4 pt-3 border-t border-[#363636] flex items-center justify-between">
          <div className="text-[#666] text-xs">
            {agentEnabled ? 'Live monitoring' : 'Enable agent to start'}
          </div>
          <button 
            className="text-blue-400 text-xs hover:text-blue-300 transition-colors"
            onClick={() => {
              setAgentPopupOpen(false)
              // Aici poți naviga către pagina dispatcher sau deschide un modal complet
              window.location.href = '/dispatcher'
            }}
          >
            View All →
          </button>
        </div>
      </div>
    </>
  )
}