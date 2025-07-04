'use client'

import { useState } from 'react'
import { useStickyNavigation } from '@/contexts/StickyNavigationContext'
import { UserButton } from '@clerk/nextjs'

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const { isModalOpen } = useStickyNavigation()
  
  return (
    <>
      <div className="relative flex size-full min-h-screen flex-col bg-[#1a1a1a] dark group/design-root overflow-x-hidden" style={{fontFamily: '"Space Grotesk", "Noto Sans", sans-serif'}}>
        <div className="layout-container flex h-full grow flex-col">
          {/* HEADER STICKY */}
          <header className="fixed top-0 left-0 right-0 w-full z-[1000] flex items-center justify-between whitespace-nowrap border-b border-solid border-b-[#363636] px-10 py-3 bg-[#1a1a1a]">
            <div className="flex items-center gap-4 text-white">
              <h2 className="text-white text-lg font-bold leading-tight tracking-[-0.015em]">Fleetopia</h2>
            </div>
            <div className="flex flex-1 justify-end gap-8">
              <div className="flex items-center gap-4">
                <UserButton 
                  appearance={{
                    elements: {
                      avatarBox: "w-8 h-8",
                      userButtonPopoverCard: "bg-[#1a1a1a] border border-[#363636]",
                      userButtonPopoverText: "text-white"
                    }
                  }}
                />
              </div>
            </div>
          </header>
          
          {/* CONTENT */}
          <div className={`px-40 flex flex-1 justify-center py-5 ${isModalOpen ? 'pt-5 pb-5' : 'pt-[120px] pb-[180px]'}`}>
            <div className="layout-content-container flex flex-col max-w-[960px] flex-1">
              {children}
            </div>
          </div>
        </div>
      </div>
    </>
  )
} 