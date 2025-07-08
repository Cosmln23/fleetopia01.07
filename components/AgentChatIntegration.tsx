<<<<<<< HEAD
'use client'

import { useState } from 'react'
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

export default function AgentChatIntegration() {
  const [showFullHistory, setShowFullHistory] = useState(false)
  const { agentEnabled, chatMessages, quotes } = useDispatcherStore()

  // Mock recent agent decisions (în producție, vin din store)
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
    },
    {
      id: '4',
      type: 'L3',
      action: 'Learning adjustment',
      result: 'Adjusted margin from 15% to 16.5% based on feedback',
      timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString()
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

  if (!agentEnabled) {
    return (
      <div className="relative mb-4">
        {/* Container cu design curbat */}
        <div className="bg-[#2d2d2d] border border-[#363636] rounded-xl relative overflow-hidden">
          <div className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-[#363636] flex items-center justify-center">
                <div className="text-[#adadad] text-sm">🤖</div>
              </div>
              <div>
                <h3 className="text-[#adadad] font-medium text-sm">Agent Decisions</h3>
                <p className="text-[#666] text-xs">Agent is currently disabled</p>
              </div>
            </div>
            
            <div className="text-center py-6 text-[#666]">
              <div className="text-2xl mb-2">😴</div>
              <p className="text-sm">Enable agent to see decisions here</p>
            </div>
          </div>
        </div>

        {/* Curba organică SVG */}
        <div className="relative -mt-1">
          <svg
            viewBox="0 0 400 40"
            className="w-full h-10 text-[#2d2d2d]"
            preserveAspectRatio="none"
          >
            <path
              d="M0,0 Q100,25 200,30 Q300,25 400,0 L400,40 L0,40 Z"
              fill="currentColor"
            />
          </svg>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="relative mb-2">
        {/* Container principal cu design curbat */}
        <div 
          className="bg-[#2d2d2d] border border-[#363636] rounded-t-xl relative overflow-hidden cursor-pointer hover:bg-[#333333] transition-colors group"
          onClick={() => setShowFullHistory(true)}
        >
          <div className="p-3">
            {/* Header cu status */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                </div>
                <div>
                  <h3 className="text-white font-medium text-sm">Agent Decisions</h3>
                  <p className="text-[#adadad] text-xs">{recentDecisions.length} recent actions</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 text-[#666] group-hover:text-[#adadad] transition-colors">
                <span className="text-xs">View All</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 256 256">
                  <path d="M181.66,133.66l-80,80a8,8,0,0,1-11.32-11.32L164.69,128,90.34,53.66a8,8,0,0,1,11.32-11.32l80,80A8,8,0,0,1,181.66,133.66Z"></path>
                </svg>
              </div>
            </div>

            {/* Preview ultimele 2 decizii */}
            <div className="space-y-1 max-h-20 overflow-hidden">
              {recentDecisions.slice(0, 2).map((decision, index) => (
                <div 
                  key={decision.id}
                  className={`flex items-center gap-2 p-1.5 rounded bg-[#1a1a1a]/50 border ${getLevelBg(decision.type)} transition-all duration-200`}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className={`text-xs font-bold px-1.5 py-0.5 rounded ${getLevelColor(decision.type)} bg-current/10`}>
                    {decision.type}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-xs font-medium truncate">
                      {decision.result}
                    </p>
                    <p className="text-[#666] text-xs">
                      {decision.action} • {formatTimeAgo(decision.timestamp)}
                    </p>
                  </div>

                  {decision.confidence && (
                    <div className="text-[#adadad] text-xs">
                      {Math.round(decision.confidence * 100)}%
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Footer cu statistici */}
            <div className="mt-3 pt-3 border-t border-[#363636] flex items-center justify-between">
              <div className="flex items-center gap-4 text-xs">
                <span className="text-[#adadad]">
                  Success: <span className="text-green-400 font-medium">89%</span>
                </span>
                <span className="text-[#adadad]">
                  Active: <span className="text-blue-400 font-medium">L0-L4</span>
                </span>
              </div>
              
              <div className="text-[#666] text-xs group-hover:text-[#adadad] transition-colors">
                Click for full history
              </div>
            </div>
          </div>
        </div>

        {/* Curba organică SVG care coboară spre DispatcherAI */}
        <div className="relative -mt-1">
          <svg
            viewBox="0 0 400 40"
            className="w-full h-10 text-[#2d2d2d]"
            preserveAspectRatio="none"
          >
            <path
              d="M0,0 Q100,25 200,30 Q300,25 400,0 L400,40 L0,40 Z"
              fill="currentColor"
              className="drop-shadow-sm"
            />
          </svg>
        </div>
      </div>

      {/* Modal pentru istoricul complet */}
      {showFullHistory && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-[#1a1a1a] border border-[#363636] rounded-xl p-6 w-full max-w-4xl mx-4 max-h-[80vh] overflow-hidden flex flex-col shadow-2xl">
            {/* Header modal */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center">
                  <div className="text-green-400 text-lg">🤖</div>
                </div>
                <div>
                  <h2 className="text-white text-xl font-bold">Agent Decisions History</h2>
                  <p className="text-[#adadad] text-sm">Complete log of AI agent actions and decisions</p>
                </div>
              </div>
              
              <button
                onClick={() => setShowFullHistory(false)}
                className="text-[#adadad] hover:text-white transition-colors p-2 hover:bg-[#363636] rounded-lg"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 256 256">
                  <path d="M205.66,194.34a8,8,0,0,1-11.32,11.32L128,139.31,61.66,205.66a8,8,0,0,1-11.32-11.32L116.69,128,50.34,61.66A8,8,0,0,1,61.66,50.34L128,116.69l66.34-66.35a8,8,0,0,1,11.32,11.32L139.31,128Z"></path>
                </svg>
              </button>
            </div>

            {/* Lista completă de decizii */}
            <div className="flex-1 overflow-y-auto space-y-3">
              {recentDecisions.map((decision) => (
                <div 
                  key={decision.id}
                  className={`p-4 rounded-xl border ${getLevelBg(decision.type)} bg-[#2d2d2d] hover:bg-[#333333] transition-colors`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className={`text-sm font-bold px-2 py-1 rounded-lg ${getLevelColor(decision.type)} bg-current/10 border border-current/20`}>
                        {decision.type}
                      </div>
                      <div>
                        <h3 className="text-white font-medium">{decision.action}</h3>
                        <p className="text-[#adadad] text-sm">{formatTimeAgo(decision.timestamp)}</p>
                      </div>
                    </div>
                    
                    {decision.confidence && (
                      <div className="text-right">
                        <div className="text-white font-medium">{Math.round(decision.confidence * 100)}%</div>
                        <div className="text-[#666] text-xs">confidence</div>
                      </div>
                    )}
                  </div>
                  
                  <p className="text-white mb-2">{decision.result}</p>
                  
                  {decision.cargoId && (
                    <div className="text-[#666] text-xs">
                      Cargo ID: {decision.cargoId}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Footer modal */}
            <div className="mt-6 pt-4 border-t border-[#363636] flex items-center justify-between">
              <div className="text-[#adadad] text-sm">
                Showing {recentDecisions.length} decisions from the last 24 hours
              </div>
              
              <div className="flex gap-2">
                <button className="px-4 py-2 bg-[#363636] hover:bg-[#4d4d4d] text-white rounded-lg transition-colors text-sm">
                  Export Log
                </button>
                <button className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors text-sm border border-red-500/30">
                  Clear History
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
=======
'use client'

import { useState } from 'react'
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

export default function AgentChatIntegration() {
  const [showFullHistory, setShowFullHistory] = useState(false)
  const { agentEnabled, chatMessages, quotes } = useDispatcherStore()

  // Mock recent agent decisions (în producție, vin din store)
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
    },
    {
      id: '4',
      type: 'L3',
      action: 'Learning adjustment',
      result: 'Adjusted margin from 15% to 16.5% based on feedback',
      timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString()
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

  // Small navigation icon version
  return (
    <>
      {/* Small icon in navigation bar */}
      <div className="flex items-center">
        <button
          onClick={() => setShowFullHistory(true)}
          className="flex items-center gap-2 px-3 py-2 bg-[#2d2d2d] hover:bg-[#363636] border border-[#4d4d4d] rounded-lg transition-colors group"
          title="View Agent Decisions"
        >
          {/* Agent icon */}
          <div className="w-6 h-6 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center">
            {agentEnabled ? (
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            ) : (
              <div className="w-2 h-2 bg-[#666] rounded-full"></div>
            )}
          </div>
          
          {/* Decision count badge */}
          {agentEnabled && recentDecisions.length > 0 && (
            <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full border border-blue-500/30">
              {recentDecisions.length}
            </span>
          )}
          
          {/* Chevron */}
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 256 256" className="text-[#666] group-hover:text-[#adadad] transition-colors">
            <path d="M213.66,101.66l-80,80a8,8,0,0,1-11.32,0l-80-80A8,8,0,0,1,53.66,90.34L128,164.69l74.34-74.35a8,8,0,0,1,11.32,11.32Z"></path>
          </svg>
        </button>
      </div>

      {/* Full history modal - appears when icon is clicked */}
      {showFullHistory && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-[#1a1a1a] border border-[#363636] rounded-xl w-full max-w-4xl mx-4 max-h-[80vh] overflow-hidden flex flex-col shadow-2xl">
            {/* Header with organic curve */}
            <div className="relative">
              <div className="bg-[#2d2d2d] border-b border-[#363636] p-6 relative overflow-hidden">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center">
                      <div className="text-green-400 text-lg">🤖</div>
                    </div>
                    <div>
                      <h2 className="text-white text-xl font-bold">Agent Decisions History</h2>
                      <p className="text-[#adadad] text-sm">Complete log of AI agent actions and decisions</p>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => setShowFullHistory(false)}
                    className="text-[#adadad] hover:text-white transition-colors p-2 hover:bg-[#363636] rounded-lg"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 256 256">
                      <path d="M205.66,194.34a8,8,0,0,1-11.32,11.32L128,139.31,61.66,205.66a8,8,0,0,1-11.32-11.32L116.69,128,50.34,61.66A8,8,0,0,1,61.66,50.34L128,116.69l66.34-66.35a8,8,0,0,1,11.32,11.32L139.31,128Z"></path>
                    </svg>
                  </button>
                </div>

                {/* Stats bar */}
                <div className="flex items-center gap-4 text-xs">
                  <span className="text-[#adadad]">
                    Success: <span className="text-green-400 font-medium">89%</span>
                  </span>
                  <span className="text-[#adadad]">
                    Active: <span className="text-blue-400 font-medium">L0-L4</span>
                  </span>
                  <span className="text-[#adadad]">
                    Decisions: <span className="text-white font-medium">{recentDecisions.length}</span>
                  </span>
                </div>
              </div>

              {/* Organic curve flowing down */}
              <div className="relative -mt-1">
                <svg
                  viewBox="0 0 400 30"
                  className="w-full h-8 text-[#2d2d2d]"
                  preserveAspectRatio="none"
                >
                  <path
                    d="M0,0 Q100,20 200,25 Q300,20 400,0 L400,30 L0,30 Z"
                    fill="currentColor"
                    className="drop-shadow-sm"
                  />
                </svg>
              </div>
            </div>

            {/* Content area */}
            <div className="flex-1 overflow-y-auto p-6">
              {!agentEnabled ? (
                <div className="text-center py-12">
                  <div className="text-4xl mb-4">😴</div>
                  <h3 className="text-white text-lg font-medium mb-2">Agent is Disabled</h3>
                  <p className="text-[#adadad] text-sm">Enable the agent to start seeing decisions here</p>
                </div>
              ) : recentDecisions.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-4xl mb-4">🔍</div>
                  <h3 className="text-white text-lg font-medium mb-2">No Decisions Yet</h3>
                  <p className="text-[#adadad] text-sm">Agent decisions will appear here as they're made</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentDecisions.map((decision) => (
                    <div 
                      key={decision.id}
                      className={`p-4 rounded-xl border ${getLevelBg(decision.type)} bg-[#2d2d2d] hover:bg-[#333333] transition-colors`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`text-sm font-bold px-2 py-1 rounded-lg ${getLevelColor(decision.type)} bg-current/10 border border-current/20`}>
                            {decision.type}
                          </div>
                          <div>
                            <h3 className="text-white font-medium">{decision.action}</h3>
                            <p className="text-[#adadad] text-sm">{formatTimeAgo(decision.timestamp)}</p>
                          </div>
                        </div>
                        
                        {decision.confidence && (
                          <div className="text-right">
                            <div className="text-white font-medium">{Math.round(decision.confidence * 100)}%</div>
                            <div className="text-[#666] text-xs">confidence</div>
                          </div>
                        )}
                      </div>
                      
                      <p className="text-white mb-2">{decision.result}</p>
                      
                      {decision.cargoId && (
                        <div className="text-[#666] text-xs">
                          Cargo ID: {decision.cargoId}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-[#363636] p-4 bg-[#1a1a1a] flex items-center justify-between">
              <div className="text-[#adadad] text-sm">
                {agentEnabled ? `Showing ${recentDecisions.length} decisions from the last 24 hours` : 'Agent is currently disabled'}
              </div>
              
              <div className="flex gap-2">
                <button className="px-4 py-2 bg-[#363636] hover:bg-[#4d4d4d] text-white rounded-lg transition-colors text-sm">
                  Export Log
                </button>
                <button className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors text-sm border border-red-500/30">
                  Clear History
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
>>>>>>> integrate-all
}