'use client'

import { useState, useEffect } from 'react'
import CostSettingsModal from '@/components/CostSettingsModal'
import { useStickyNavigation } from '@/contexts/StickyNavigationContext'

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
  const [isAgentActive, setIsAgentActive] = useState(false)
  const { setModalOpen } = useStickyNavigation()
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

  // Load settings from localStorage on component mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('costSettings')
    if (savedSettings) {
      setCostSettings(JSON.parse(savedSettings))
    }
    
    const savedAgent = localStorage.getItem('agentActive')
    if (savedAgent) {
      setIsAgentActive(JSON.parse(savedAgent))
    }
    
    const savedLevels = localStorage.getItem('levelSettings')
    if (savedLevels) {
      setLevelSettings(JSON.parse(savedLevels))
    }
  }, [])

  const handleSaveSettings = (newSettings: CostSettings) => {
    setCostSettings(newSettings)
    localStorage.setItem('costSettings', JSON.stringify(newSettings))
  }

  const handleAgentToggle = () => {
    const newState = !isAgentActive
    setIsAgentActive(newState)
    localStorage.setItem('agentActive', JSON.stringify(newState))
    
    // Când agent se dezactivează, toate nivelurile se dezactivează
    if (!newState) {
      const resetLevels = { L0: false, L1: false, L2: false, L3: false, L4: false }
      setLevelSettings(resetLevels)
      localStorage.setItem('levelSettings', JSON.stringify(resetLevels))
    }
  }

  const handleLevelToggle = (level: keyof LevelSettings) => {
    if (!isAgentActive) return // Nu permite toggle dacă agentul nu e activ
    
    const newLevels = { ...levelSettings, [level]: !levelSettings[level] }
    setLevelSettings(newLevels)
    localStorage.setItem('levelSettings', JSON.stringify(newLevels))
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

          {/* Cost Settings Button */}
          <div className="px-4 py-2">
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
          {/* Recommended Loads Section */}
          <h3 className="text-white text-lg font-bold leading-tight tracking-[-0.015em] px-4 pb-2 pt-4">Recommended Loads</h3>
          
          {/* Load 1 */}
          <div className="p-4">
            <div className="flex items-stretch justify-between gap-4 rounded-xl">
              <div className="flex flex-[2_2_0px] flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <p className="text-[#adadad] text-sm font-normal leading-normal">Route: New York to Los Angeles</p>
                  <p className="text-white text-base font-bold leading-tight">Distance: 2,400 miles</p>
                  <p className="text-[#adadad] text-sm font-normal leading-normal">ETA: 40 hours | Cost: $1,200 | Suggested Price: $2,000</p>
                </div>
                <button className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-full h-8 px-4 flex-row-reverse bg-[#363636] text-white text-sm font-medium leading-normal w-fit">
                  <span className="truncate">Send Quote</span>
                </button>
              </div>
              <div className="w-full bg-center bg-no-repeat aspect-video bg-cover rounded-xl flex-1 bg-[#363636] flex items-center justify-center">
                <div className="text-[#adadad] text-2xl">🚛</div>
              </div>
            </div>
          </div>

          {/* Load 2 */}
          <div className="p-4">
            <div className="flex items-stretch justify-between gap-4 rounded-xl">
              <div className="flex flex-[2_2_0px] flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <p className="text-[#adadad] text-sm font-normal leading-normal">Route: Chicago to Miami</p>
                  <p className="text-white text-base font-bold leading-tight">Distance: 1,300 miles</p>
                  <p className="text-[#adadad] text-sm font-normal leading-normal">ETA: 22 hours | Cost: $800 | Suggested Price: $1,500</p>
                </div>
                <button className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-full h-8 px-4 flex-row-reverse bg-[#363636] text-white text-sm font-medium leading-normal w-fit">
                  <span className="truncate">Send Quote</span>
                </button>
              </div>
              <div className="w-full bg-center bg-no-repeat aspect-video bg-cover rounded-xl flex-1 bg-[#363636] flex items-center justify-center">
                <div className="text-[#adadad] text-2xl">🚛</div>
              </div>
            </div>
          </div>

          {/* Load 3 */}
          <div className="p-4">
            <div className="flex items-stretch justify-between gap-4 rounded-xl">
              <div className="flex flex-[2_2_0px] flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <p className="text-[#adadad] text-sm font-normal leading-normal">Route: Seattle to Denver</p>
                  <p className="text-white text-base font-bold leading-tight">Distance: 1,100 miles</p>
                  <p className="text-[#adadad] text-sm font-normal leading-normal">ETA: 18 hours | Cost: $600 | Suggested Price: $1,200</p>
                </div>
                <button className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-full h-8 px-4 flex-row-reverse bg-[#363636] text-white text-sm font-medium leading-normal w-fit">
                  <span className="truncate">Send Quote</span>
                </button>
              </div>
              <div className="w-full bg-center bg-no-repeat aspect-video bg-cover rounded-xl flex-1 bg-[#363636] flex items-center justify-center">
                <div className="text-[#adadad] text-2xl">🚛</div>
              </div>
            </div>
          </div>

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
    </>
  )
}/* Force recompile */
