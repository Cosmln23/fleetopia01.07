'use client'

import { useState, useEffect } from 'react'
import CostSettingsModal from '@/components/CostSettingsModal'
import StatsPanel from '@/components/StatsPanel'
import { useStickyNavigation } from '@/contexts/StickyNavigationContext'
// Mock API import commented out for production build
// import { agentMockApi, type DispatcherSuggestion } from '@/lib/__mocks__/agent-mock-data'
import { formatPrice } from '@/lib/formatters'
import { useFleet } from './hooks/useFleet'
import { fleetHasGps } from '@/utils/fleetHasGps'
import { useDispatcherStore } from './state/store'
import NoGpsModal from './components/NoGpsModal'
import NoGpsLocationModal from './components/NoGpsLocationModal'
import AutoAssignSection from './components/AutoAssignSection'
import AddFleetModal from '@/components/AddFleetModal'

// Temporary interface for production build (replace with real API later)
interface DispatcherSuggestion {
  id: string
  status: 'pending' | 'quoted' | 'accepted' | 'rejected'
  offer: {
    fromAddress: string
    toAddress: string
    weight: number
  }
  distance: number
  vehicle: {
    name: string
  }
  cost: number
  quote: number
  profitPct: number
  score: number
}

interface CostSettings {
  driverPay: number
  fuel: number
  maintenance: number
  tolls: number
  insurance: number
}

interface LevelSettings {
  L0: boolean
  L1: boolean
  L2: boolean
  L3: boolean
  L4: boolean
}

export default function DispatcherPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [suggestions, setSuggestions] = useState<DispatcherSuggestion[]>([])
  const [agentStats, setAgentStats] = useState<any>(null)
  const [isNoGpsModalOpen, setIsNoGpsModalOpen] = useState(false)
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false)
  const [isAddFleetModalOpen, setIsAddFleetModalOpen] = useState(false)
  const [selectedVehicleForLocation, setSelectedVehicleForLocation] = useState<any>(null)
  const { setModalOpen } = useStickyNavigation()
  
  // Fleet and GPS state
  const { fleet, loading: fleetLoading, fleetStatus, refetch: refetchFleet } = useFleet()
  const { 
    agentEnabled: isAgentActive, 
    autoAssignEnabled: autoAssignVehicle,
    vehicleAutoAssign,
    gpsFallbackAllowed,
    setAgentEnabled: setIsAgentActive,
    setAutoAssignEnabled: setAutoAssignVehicle,
    setVehicleAutoAssign
  } = useDispatcherStore()
  const [costSettings, setCostSettings] = useState<CostSettings>({
    driverPay: 500,
    fuel: 300,
    maintenance: 100,
    tolls: 50,
    insurance: 50
  })
  const [levelSettings, setLevelSettings] = useState<LevelSettings>({
    L0: false,
    L1: false,
    L2: false,
    L3: false,
    L4: false
  })

  // Load settings from localStorage and server on component mount
  useEffect(() => {
    const initializeSettings = async () => {
      // Load cost settings from localStorage (keep local)
      const savedSettings = localStorage.getItem('costSettings')
      if (savedSettings) {
        setCostSettings(JSON.parse(savedSettings))
      }
      
      // Load level settings from localStorage (keep local)
      const savedLevels = localStorage.getItem('levelSettings')
      if (savedLevels) {
        setLevelSettings(JSON.parse(savedLevels))
      }

      // Load agent and auto-assign settings from server
      try {
        const response = await fetch('/api/settings')
        const serverSettings = await response.json()
        setIsAgentActive(serverSettings.agentOn)
        setAutoAssignVehicle(serverSettings.autoAssign)
      } catch (error) {
        console.error('Failed to load server settings:', error)
        // Fallback to localStorage if server fails
        const savedAgent = localStorage.getItem('agentActive')
        if (savedAgent) {
          setIsAgentActive(JSON.parse(savedAgent))
        }
        const savedAutoAssign = localStorage.getItem('autoAssignVehicle')
        if (savedAutoAssign) {
          setAutoAssignVehicle(JSON.parse(savedAutoAssign))
        }
      }

      // Load initial agent data
      updateAgentStats()
    }

    initializeSettings()
  }, [])

  const handleSaveSettings = (newSettings: CostSettings) => {
    setCostSettings(newSettings)
    localStorage.setItem('costSettings', JSON.stringify(newSettings))
  }

  const handleAgentToggle = async () => {
    const newState = !isAgentActive
    
    // Direct toggle - no modals, user decides
    setIsAgentActive(newState)
    
    // If deactivating agent, reset all levels and auto-assign
    if (!newState) {
      const resetLevels = { L0: false, L1: false, L2: false, L3: false, L4: false }
      setLevelSettings(resetLevels)
      localStorage.setItem('levelSettings', JSON.stringify(resetLevels))
      setAutoAssignVehicle(false)
    }
    
    // Sync with server
    try {
      await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentOn: newState })
      })
    } catch (error) {
      console.error('Failed to sync agent setting with server:', error)
      localStorage.setItem('agentActive', JSON.stringify(newState))
    }
  }

  const handleContinueWithoutGps = async () => {
    // This will actually toggle the agent ON after user confirms
    setIsAgentActive(true)
    
    // Sync with server
    try {
      await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentOn: true })
      })
    } catch (error) {
      console.error('Failed to sync agent setting with server:', error)
      localStorage.setItem('agentActive', JSON.stringify(true))
    }
  }

  const handleAgentLocationSet = async (location: string, lat: number, lng: number) => {
    if (!selectedVehicleForLocation) return

    try {
      // Update vehicle location
      const response = await fetch(`/api/vehicles/${selectedVehicleForLocation.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          last_manual_lat: lat,
          last_manual_lng: lng,
          last_manual_location: location
        })
      })

      if (response.ok) {
        // Set GPS fallback allowed and turn on agent
        const { setGpsFallbackAllowed } = useDispatcherStore.getState()
        setGpsFallbackAllowed(true)
        
        // Now actually toggle the agent ON
        setIsAgentActive(true)
        
        // Sync with server
        await fetch('/api/settings', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ agentOn: true })
        })
      }
    } catch (error) {
      console.error('Error updating vehicle location:', error)
    }
  }

  const handleAutoAssignToggle = async () => {
    const newState = !autoAssignVehicle
    setAutoAssignVehicle(newState)
    
    // Sync with server
    try {
      await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ autoAssign: newState })
      })
    } catch (error) {
      console.error('Failed to sync auto-assign setting with server:', error)
      // Fallback to localStorage
      localStorage.setItem('autoAssignVehicle', JSON.stringify(newState))
    }
  }

  const handleLevelToggle = (level: keyof LevelSettings) => {
    if (!isAgentActive) return // Nu permite toggle dacă agentul nu e activ
    
    const newState = !levelSettings[level]
    const newLevels = { ...levelSettings, [level]: newState }
    setLevelSettings(newLevels)
    localStorage.setItem('levelSettings', JSON.stringify(newLevels))
    
    // Execute agent level actions
    if (newState) {
      switch(level) {
        case 'L0':
          console.log('🔄 Starting L0 RADAR...')
          break
        case 'L1':
          console.log('🧮 Running L1 CALCULATOR...')
          // Mock API disabled - will show "Coming soon" message
          // if (newLevels.L0) {
          //   const newSuggestions = agentMockApi.generateSuggestions()
          //   setSuggestions(newSuggestions)
          //   updateAgentStats()
          // }
          break
        case 'L2':
          console.log('📤 L2 QUOTE BOT activated')
          break
        case 'L3':
          console.log('🎯 Running L3 AUTO-TUNE...')
          // Mock API disabled
          // agentMockApi.autoTuneMargins()
          updateAgentStats()
          break
        case 'L4':
          console.log('🤝 L4 NEGOTIATION ready')
          break
      }
    }
  }

  const updateAgentStats = () => {
    // Mock API disabled - using static stats for UI demo
    const stats = {
      totalSuggestions: 0,
      averageProfitPct: 0,
      activeVehicles: 0
    }
    setAgentStats(stats)
  }

  const handleSendQuote = (suggestionId: string) => {
    // Mock API disabled - function will do nothing for now
    console.log('Send quote requested for:', suggestionId)
    // const result = agentMockApi.sendQuote(suggestionId)
    // if (result) {
    //   setSuggestions(prev => prev.map(s => s.id === suggestionId ? result : s))
    //   updateAgentStats()
    // }
  }

  const totalCost = costSettings.driverPay + costSettings.fuel + costSettings.maintenance + costSettings.tolls + costSettings.insurance

  const levelDescriptions = {
    L0: 'Radar',
    L1: 'Calculator', 
    L2: 'Quote Bot',
    L3: 'Auto‑Tune',
    L4: 'Negotiation Assist'
  }

  return (
    <>
      {/* DISPATCHER AI CONTENT */}
      <div className="gap-1 px-6 flex flex-1 justify-center py-5">
        <div className="layout-content-container flex flex-col w-80">
          <div className="flex flex-wrap justify-between gap-3 p-4">
            <p className="text-white tracking-light text-[32px] font-bold leading-tight min-w-72">Dispatcher AI</p>
          </div>
          
          {/* Agent Toggle */}
          <div className="flex items-center gap-4 bg-[#1a1a1a] px-4 min-h-14 justify-between">
            <p className="text-white text-base font-normal leading-normal flex-1 truncate">Agent</p>
            <div className="shrink-0">
              <label className={`relative flex h-[31px] w-[51px] cursor-pointer items-center rounded-full border-none p-0.5 transition-colors ${isAgentActive ? 'bg-[#0bda0b] justify-end' : 'bg-[#363636]'}`}>
                <div className="h-full w-[27px] rounded-full bg-white" style={{boxShadow: "rgba(0, 0, 0, 0.15) 0px 3px 8px, rgba(0, 0, 0, 0.06) 0px 3px 1px"}}></div>
                <input 
                  type="checkbox" 
                  className="invisible absolute"
                  checked={isAgentActive}
                  onChange={handleAgentToggle}
                />
              </label>
            </div>
          </div>

          {/* Auto-Assign Section - only visible when Agent ON */}
          {isAgentActive && (
            <div className="px-4 py-2">
              <AutoAssignSection
                isEnabled={autoAssignVehicle}
                onToggle={handleAutoAssignToggle}
                fleetStatus={fleetStatus}
                vehicleAutoAssign={vehicleAutoAssign}
                onVehicleToggle={setVehicleAutoAssign}
              />
            </div>
          )}

          {/* Cost Settings Button */}
          <div className="px-4 py-2" style={{marginTop: '8px'}}>
            <button
              onClick={() => {
                setIsModalOpen(true)
                setModalOpen(true)
              }}
              className="flex items-center gap-2 w-full bg-[#363636] hover:bg-[#4d4d4d] text-white px-4 py-2 rounded-lg transition-colors"
            >
              <div className="text-white" data-icon="Gear" data-size="16px" data-weight="regular">
                <svg xmlns="http://www.w3.org/2000/svg" width="16px" height="16px" fill="currentColor" viewBox="0 0 256 256">
                  <path d="M128,80a48,48,0,1,0,48,48A48.05,48.05,0,0,0,128,80Zm0,80a32,32,0,1,1,32-32A32,32,0,0,1,128,160Zm88-29.84q.06-2.16,0-4.32l14.92-18.64a8,8,0,0,0,1.48-7.06,107.21,107.21,0,0,0-10.88-26.25,8,8,0,0,0-6-3.93l-23.72-2.64q-1.48-1.56-3-3L186,40.54a8,8,0,0,0-3.94-6,107.71,107.71,0,0,0-26.25-10.87,8,8,0,0,0-7.06,1.49L130.16,40Q128,40,125.84,40L107.2,25.11a8,8,0,0,0-7.06-1.48A107.6,107.6,0,0,0,73.89,34.51a8,8,0,0,0-3.93,6L67.32,64.27q-1.56,1.49-3,3L40.54,70a8,8,0,0,0-6,3.94,107.71,107.71,0,0,0-10.87,26.25,8,8,0,0,0,1.49,7.06L40,125.84Q40,128,40,130.16L25.11,148.8a8,8,0,0,0-1.48,7.06,107.21,107.21,0,0,0,10.88,26.25,8,8,0,0,0,6,3.93l23.72,2.64q1.49,1.56,3,3L70,215.46a8,8,0,0,0,3.94,6,107.71,107.71,0,0,0,26.25,10.87,8,8,0,0,0,7.06-1.49L125.84,216q2.16.06,4.32,0l18.64,14.92a8,8,0,0,0,7.06,1.48,107.21,107.21,0,0,0,26.25-10.88,8,8,0,0,0,3.93-6l2.64-23.72q1.56-1.48,3-3L215.46,186a8,8,0,0,0,6-3.94,107.71,107.71,0,0,0,10.87-26.25,8,8,0,0,0-1.49-7.06Zm-16.1-6.5a73.93,73.93,0,0,1,0,8.68,8,8,0,0,0,1.74,5.48l14.19,17.73a91.57,91.57,0,0,1-6.23,15L187,173.11a8,8,0,0,0-5.1,2.64,74.11,74.11,0,0,1-6.14,6.14,8,8,0,0,0-2.64,5.1l-2.51,22.58a91.32,91.32,0,0,1-15,6.23l-17.74-14.19a8,8,0,0,0-5-1.75h-.48a73.93,73.93,0,0,1-8.68,0,8,8,0,0,0-5.48,1.74L100.45,215.8a91.57,91.57,0,0,1-15-6.23L82.89,187a8,8,0,0,0-2.64-5.1,74.11,74.11,0,0,1-6.14-6.14,8,8,0,0,0-5.1-2.64L46.43,170.6a91.32,91.32,0,0,1-6.23-15l14.19-17.74a8,8,0,0,0,1.74-5.48,73.93,73.93,0,0,1,0-8.68,8,8,0,0,0-1.74-5.48L40.2,100.45a91.57,91.57,0,0,1,6.23-15L69,82.89a8,8,0,0,0,5.1-2.64,74.11,74.11,0,0,1,6.14-6.14A8,8,0,0,0,82.89,69L85.4,46.43a91.32,91.32,0,0,1,15-6.23l17.74,14.19a8,8,0,0,0,5.48,1.74,73.93,73.93,0,0,1,8.68,0,8,8,0,0,0,5.48-1.74L155.55,40.2a91.57,91.57,0,0,1,15,6.23L173.11,69a8,8,0,0,0,2.64,5.1,74.11,74.11,0,0,1,6.14,6.14,8,8,0,0,0,5.1,2.64l22.58,2.51a91.32,91.32,0,0,1,6.23,15l-14.19,17.74A8,8,0,0,0,199.87,123.66Z"></path>
                </svg>
              </div>
              <span className="text-sm font-medium">Cost Settings</span>
            </button>
          </div>

          {/* Level Implementation Section */}
          <h3 className="text-white text-lg font-bold leading-tight tracking-[-0.015em] px-4 pb-2 pt-4">Level Implementation</h3>
          
          {/* Level Items */}
          {(Object.keys(levelDescriptions) as Array<keyof LevelSettings>).map((level) => (
            <div key={level} className="flex items-center gap-4 bg-[#1a1a1a] px-4 min-h-[60px] py-2 justify-between">
              <div className="flex items-center gap-3">
                <span className="text-white text-base font-medium leading-normal">{level}</span>
                <span className="text-[#adadad] text-sm font-normal leading-normal">– {levelDescriptions[level]}</span>
              </div>
              <div className="shrink-0">
                <button
                  onClick={() => handleLevelToggle(level)}
                  disabled={!isAgentActive}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                    !isAgentActive 
                      ? 'bg-[#363636] text-[#666666] cursor-not-allowed'
                      : levelSettings[level]
                        ? 'bg-[#0bda0b] text-white hover:bg-[#0bc40b]'
                        : 'bg-[#363636] text-[#adadad] hover:bg-[#4d4d4d]'
                  }`}
                >
                  {levelSettings[level] ? 'ON' : 'OFF'}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Main Content Area */}
        <div className="layout-content-container flex flex-col max-w-[960px] flex-1">
          {/* Agent Performance Section - Dynamic Stats */}
          <div className="px-4 py-2">
            <div className="bg-[#2d2d2d] rounded-xl p-4">
              <h4 className="text-white text-md font-bold mb-3">Agent Performance</h4>
              <StatsPanel />
            </div>
          </div>

          {/* Recommended Loads Section */}
          <h3 className="text-white text-lg font-bold leading-tight tracking-[-0.015em] px-4 pb-2 pt-4">AI Suggestions</h3>
          
          {suggestions.length === 0 ? (
            <div className="p-4">
              <div className="bg-[#2d2d2d] rounded-xl p-6 text-center">
                <div className="text-[#adadad] mb-2 flex justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 256 256">
                    <path d="M200,56H56A16,16,0,0,0,40,72V184a16,16,0,0,0,16,16H200a16,16,0,0,0,16-16V72A16,16,0,0,0,200,56ZM56,72H200V184H56ZM96,116a12,12,0,1,1,12,12A12,12,0,0,1,96,116Zm52,0a12,12,0,1,1,12,12A12,12,0,0,1,148,116Z"></path>
                  </svg>
                </div>
                <p className="text-[#adadad] text-sm">AI Suggestions - Coming Soon</p>
                <p className="text-[#666] text-xs mt-1">
                  {!isAgentActive ? 'Turn on Agent to see the interface' : 
                   'Mock AI system temporarily disabled for production build. Real AI integration coming soon.'}
                </p>
              </div>
            </div>
          ) : (
            suggestions.slice(0, 5).map((suggestion) => (
              <div key={suggestion.id} className="p-4">
                <div className="flex items-stretch justify-between gap-4 rounded-xl">
                  <div className="flex flex-[2_2_0px] flex-col gap-4">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <p className="text-[#adadad] text-sm font-normal leading-normal">
                          Route: {suggestion.offer.fromAddress.split(',')[0]} → {suggestion.offer.toAddress.split(',')[0]}
                        </p>
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                          suggestion.status === 'quoted' ? 'bg-blue-400 text-white' :
                          suggestion.status === 'accepted' ? 'bg-green-400 text-black' :
                          suggestion.status === 'rejected' ? 'bg-red-400 text-white' :
                          'bg-gray-400 text-white'
                        }`}>
                          {suggestion.status.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-white text-base font-bold leading-tight">
                        Distance: {Math.round(suggestion.distance)}km | Weight: {suggestion.offer.weight}kg
                      </p>
                      <p className="text-[#adadad] text-sm font-normal leading-normal">
                        Vehicle: {suggestion.vehicle.name} | Cost: €{formatPrice(suggestion.cost)} | Quote: €{formatPrice(suggestion.quote)}
                      </p>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-medium ${
                          suggestion.profitPct >= 15 ? 'text-green-400' :
                          suggestion.profitPct >= 8 ? 'text-yellow-400' :
                          'text-red-400'
                        }`}>
                          Profit: {suggestion.profitPct.toFixed(1)}%
                        </span>
                        <span className="text-xs text-[#adadad]">Score: {suggestion.score}</span>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleSendQuote(suggestion.id)}
                      disabled={suggestion.status !== 'pending' || !levelSettings.L2}
                      className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-full h-8 px-4 flex-row-reverse bg-[#363636] hover:bg-[#4d4d4d] disabled:bg-[#2d2d2d] disabled:cursor-not-allowed text-white text-sm font-medium leading-normal w-fit transition-colors"
                    >
                      <span className="truncate">
                        {suggestion.status === 'pending' ? 'Send Quote' :
                         suggestion.status === 'quoted' ? 'Quote Sent' :
                         suggestion.status === 'accepted' ? 'Accepted ✓' :
                         'Rejected ✗'}
                      </span>
                    </button>
                  </div>
                  <div className="w-full bg-center bg-no-repeat aspect-video bg-cover rounded-xl flex-1 bg-[#363636] flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" viewBox="0 0 256 256" className="text-[#adadad]">
                      <path d="M223.68,66.15,135.68,18a15.88,15.88,0,0,0-15.36,0l-88,48.17a16,16,0,0,0-8.32,14v95.64a16,16,0,0,0,8.32,14l88,48.17a15.88,15.88,0,0,0,15.36,0l88-48.17a16,16,0,0,0,8.32-14V80.18A16,16,0,0,0,223.68,66.15ZM128,32l80.34,44L128,120,47.66,76ZM40,90l80,43.78v85.79L40,175.82Zm96,129.57V133.82L216,90v85.82Z"></path>
                    </svg>
                  </div>
                </div>
              </div>
            ))
          )}

        </div>
      </div>

      {/* Cost Settings Modal */}
      <CostSettingsModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setModalOpen(false)
        }}
        currentSettings={costSettings}
        onSave={handleSaveSettings}
      />

      <NoGpsModal
        isOpen={isNoGpsModalOpen}
        onClose={() => setIsNoGpsModalOpen(false)}
        onContinueWithoutGps={handleContinueWithoutGps}
        onAddVehicle={() => setIsAddFleetModalOpen(true)}
        fleetStatus={fleetStatus}
      />

      <NoGpsLocationModal
        isOpen={isLocationModalOpen}
        onClose={() => {
          setIsLocationModalOpen(false)
          setSelectedVehicleForLocation(null)
        }}
        onLocationSet={handleAgentLocationSet}
        vehicleName={selectedVehicleForLocation?.name || 'Vehicle'}
      />

      <AddFleetModal
        isOpen={isAddFleetModalOpen}
        onClose={() => setIsAddFleetModalOpen(false)}
        onSubmit={(vehicleData) => {
          setIsAddFleetModalOpen(false)
          refetchFleet() // Refresh fleet data after adding vehicle
        }}
      />
    </>
  )
}
