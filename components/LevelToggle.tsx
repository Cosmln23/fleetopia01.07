'use client'

import InfoTooltip from './InfoTooltip'

interface LevelToggleProps {
  id: 'L0' | 'L1' | 'L2' | 'L3' | 'L4'
  label: string
  shortDesc: string
  detailedDesc: string
  enabled: boolean
  disabled?: boolean
  onToggle: (id: string, enabled: boolean) => void
}

export default function LevelToggle({ 
  id, 
  label, 
  shortDesc, 
  detailedDesc, 
  enabled, 
  disabled = false,
  onToggle 
}: LevelToggleProps) {
  const handleToggle = () => {
    if (!disabled) {
      onToggle(id, !enabled)
    }
  }

  return (
    <div className="flex flex-col py-2">
      {/* Main toggle row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <span className={`font-medium ${disabled ? 'text-[#666]' : 'text-white'}`}>
            {id} — {label}
          </span>
        </div>
        
        <button
          onClick={handleToggle}
          disabled={disabled}
          className={`
            px-4 py-1 rounded-full text-sm font-medium transition-colors
            ${disabled 
              ? 'bg-[#2d2d2d] text-[#666] cursor-not-allowed'
              : enabled 
                ? 'bg-green-500 text-white hover:bg-green-600' 
                : 'bg-[#363636] text-[#adadad] hover:bg-[#4d4d4d]'
            }
          `}
        >
          {enabled ? 'ON' : 'OFF'}
        </button>
      </div>
      
      {/* Red description with info tooltip */}
      <div className="flex items-center mt-1 ml-0">
        <span className="text-red-400 text-xs">
          {shortDesc}
        </span>
        <InfoTooltip 
          title={`${id}: ${label}`}
          description={detailedDesc}
        />
      </div>
    </div>
  )
}