'use client'

import { useState, ReactNode } from 'react'

interface TooltipProps {
  children: ReactNode
}

interface TooltipTriggerProps {
  asChild?: boolean
  children: ReactNode
}

interface TooltipContentProps {
  children: ReactNode
}

export function TooltipProvider({ children }: { children: ReactNode }) {
  return <>{children}</>
}

export function Tooltip({ children }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false)

  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
      >
        {children}
      </div>
    </div>
  )
}

export function TooltipTrigger({ children, asChild }: TooltipTriggerProps) {
  return <>{children}</>
}

export function TooltipContent({ children }: TooltipContentProps) {
  return (
    <div className="absolute z-50 px-2 py-1 text-xs text-white bg-gray-900 rounded shadow-lg -top-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
      {children}
      <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
    </div>
  )
}