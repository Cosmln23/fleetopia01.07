'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

interface StickyNavigationContextType {
  isModalOpen: boolean
  setModalOpen: (isOpen: boolean) => void
}

const StickyNavigationContext = createContext<StickyNavigationContextType | undefined>(undefined)

export function StickyNavigationProvider({ children }: { children: ReactNode }) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  const setModalOpen = (isOpen: boolean) => {
    setIsModalOpen(isOpen)
  }

  return (
    <StickyNavigationContext.Provider value={{ isModalOpen, setModalOpen }}>
      {children}
    </StickyNavigationContext.Provider>
  )
}

export function useStickyNavigation() {
  const context = useContext(StickyNavigationContext)
  if (context === undefined) {
    throw new Error('useStickyNavigation must be used within a StickyNavigationProvider')
  }
  return context
}