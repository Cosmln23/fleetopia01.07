'use client'

import { useState } from 'react'

interface InfoTooltipProps {
  title: string
  description: string
}

export default function InfoTooltip({ title, description }: InfoTooltipProps) {
  const [showTooltip, setShowTooltip] = useState(false)

  return (
    <div className="relative inline-block">
      <button
        className="ml-2 w-4 h-4 rounded-full border border-red-400 text-red-400 text-xs flex items-center justify-center hover:bg-red-400 hover:text-white transition-colors"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onClick={() => setShowTooltip(!showTooltip)}
        aria-label={`Info about ${title}`}
      >
        i
      </button>
      
      {showTooltip && (
        <div className="absolute left-0 top-6 bg-[#1a1a1a] border border-[#363636] rounded-lg p-3 shadow-2xl z-50 w-80 max-w-[90vw] text-left md:left-6 md:top-0 md:w-96">
          <div className="text-white font-medium text-sm mb-1">{title}</div>
          <div className="text-[#adadad] text-xs leading-relaxed">{description}</div>
          
          {/* Arrow pointing up on mobile, left on desktop */}
          <div className="absolute -top-1 left-3 w-2 h-2 bg-[#1a1a1a] border-l border-t border-[#363636] transform rotate-45 md:-left-1 md:top-3 md:rotate-45"></div>
        </div>
      )}
    </div>
  )
}