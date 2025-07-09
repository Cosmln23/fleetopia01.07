'use client'

import { useState, useEffect } from 'react'
import { useStickyNavigation } from '@/contexts/StickyNavigationContext'
import QueryProvider from '@/contexts/QueryProvider'
import FullNavigationBar from '@/components/FullNavigationBar'
import NotificationsDropdown from '@/components/NotificationsDropdown'
import { getUnreadNotificationsCount } from '@/lib/communication-data'
import { UserButton } from '@clerk/nextjs'

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const { isModalOpen } = useStickyNavigation()
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0)
  
  // Fetch unread notifications count
  useEffect(() => {
    const fetchNotificationsCount = async () => {
      try {
        const count = await getUnreadNotificationsCount()
        setUnreadNotificationsCount(count)
      } catch (error) {
        console.error('Error fetching notifications count:', error)
        setUnreadNotificationsCount(0)
      }
    }
    
    fetchNotificationsCount()
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchNotificationsCount, 30000)
    
    return () => clearInterval(interval)
  }, [])
  
  return (
    <>
      <div className="relative flex size-full min-h-screen flex-col bg-[#1a1a1a] dark group/design-root overflow-x-hidden" style={{fontFamily: '"Space Grotesk", "Noto Sans", sans-serif'}}>
        <div className="layout-container flex h-full grow flex-col">
          {/* HEADER STICKY */}
          <header className="fixed top-0 left-0 right-0 w-full z-[1000] flex items-center justify-between whitespace-nowrap border-b border-solid border-b-[#363636] px-10 py-3 bg-[#1a1a1a]" style={{ display: 'flex', visibility: 'visible' }}>
            <div className="flex items-center gap-4 text-white">
              <div className="w-6 h-6 flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2L22 20H2L12 2Z" fill="currentColor"/>
                  <circle cx="12" cy="16" r="2" fill="#1a1a1a"/>
                </svg>
              </div>
              <h2 className="text-white text-lg font-bold leading-tight tracking-[-0.015em]">Fleetopia</h2>
            </div>
            <div className="flex flex-1 justify-end gap-8">
              <div className="flex items-center gap-4" style={{ display: 'flex', visibility: 'visible' }}>
                {/* Notifications Icon */}
                <button
                  onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                  className="relative text-[#adadad] hover:text-white transition-colors"
                  style={{ display: 'block', visibility: 'visible' }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 256 256">
                    <path d="M221.8,175.94C216.25,166.38,208,139.33,208,104a80,80,0,1,0-160,0c0,35.34-8.26,62.38-13.81,71.94A16,16,0,0,0,48,200H88.81a40,40,0,0,0,78.38,0H208a16,16,0,0,0,13.8-24.06ZM128,216a24,24,0,0,1-22.62-16h45.24A24,24,0,0,1,128,216ZM48,184c7.7-13.24,16-43.92,16-80a64,64,0,1,1,128,0c0,36.05,8.28,66.73,16,80Z"></path>
                  </svg>
                  {unreadNotificationsCount > 0 && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">{unreadNotificationsCount}</span>
                    </div>
                  )}
                </button>

                {/* User Button */}
                <div style={{ display: 'block', visibility: 'visible' }}>
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
            </div>
          </header>
          
          {/* CONȚINUT DINAMIC - Conditional Spacing */}
          <div className={`px-40 flex flex-1 justify-center py-5 ${isModalOpen ? 'pt-5 pb-5' : 'pt-[120px] pb-[180px]'}`}>
            <div className="layout-content-container flex flex-col max-w-[960px] flex-1">
              <QueryProvider>
                {children}
              </QueryProvider>
            </div>
          </div>
          
          {/* FOOTER STICKY - Conditional */}
          <footer className={`${isModalOpen ? 'hidden' : 'fixed'} bottom-0 left-0 right-0 w-full z-[1000] bg-[#1a1a1a] border-t border-solid border-t-[#363636] flex justify-center`}>
            <div className="flex max-w-[960px] flex-1 flex-col">
              <div className="pb-3">
                <FullNavigationBar />
              </div>
            </div>
          </footer>
          
          {/* Communication System */}
          <NotificationsDropdown isOpen={isNotificationsOpen} onClose={() => setIsNotificationsOpen(false)} />
        </div>
      </div>
    </>
  )
} 