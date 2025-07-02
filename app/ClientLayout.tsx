'use client'

import { useState } from 'react'
import { useStickyNavigation } from '@/contexts/StickyNavigationContext'
import QueryProvider from '@/contexts/QueryProvider'
import RoleAwareNavBar from '@/components/RoleAwareNavBar'
import ChatWidget from '@/components/ChatWidget'
import UserChatDropdown from '@/components/UserChatDropdown'
import NotificationsDropdown from '@/components/NotificationsDropdown'
import { getUnreadMessagesCount, getUnreadNotificationsCount } from '@/lib/communication-data'

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const { isModalOpen } = useStickyNavigation()
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)
  
  const unreadMessagesCount = getUnreadMessagesCount()
  const unreadNotificationsCount = getUnreadNotificationsCount()
  
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.gstatic.com/" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?display=swap&family=Noto+Sans:wght@400;500;700;900&family=Space+Grotesk:wght@400;500;700"
        />
      </head>
      <body>
        <div className="relative flex size-full min-h-screen flex-col bg-[#1a1a1a] dark group/design-root overflow-x-hidden" style={{fontFamily: '"Space Grotesk", "Noto Sans", sans-serif'}}>
          <div className="layout-container flex h-full grow flex-col">
            {/* HEADER STICKY - Conditional */}
            <header className={`${isModalOpen ? 'hidden' : 'fixed'} top-0 left-0 right-0 w-full z-[1000] flex items-center justify-between whitespace-nowrap border-b border-solid border-b-[#363636] px-10 py-3 bg-[#1a1a1a]`}>
              <div className="flex items-center gap-4 text-white">
                <div className="size-4">
                  <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M13.8261 30.5736C16.7203 29.8826 20.2244 29.4783 24 29.4783C27.7756 29.4783 31.2797 29.8826 34.1739 30.5736C36.9144 31.2278 39.9967 32.7669 41.3563 33.8352L24.8486 7.36089C24.4571 6.73303 23.5429 6.73303 23.1514 7.36089L6.64374 33.8352C8.00331 32.7669 11.0856 31.2278 13.8261 30.5736Z"
                      fill="currentColor"
                    />
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M39.998 35.764C39.9944 35.7463 39.9875 35.7155 39.9748 35.6706C39.9436 35.5601 39.8949 35.4259 39.8346 35.2825C39.8168 35.2403 39.7989 35.1993 39.7813 35.1602C38.5103 34.2887 35.9788 33.0607 33.7095 32.5189C30.9875 31.8691 27.6413 31.4783 24 31.4783C20.3587 31.4783 17.0125 31.8691 14.2905 32.5189C12.0012 33.0654 9.44505 34.3104 8.18538 35.1832C8.17384 35.2075 8.16216 35.233 8.15052 35.2592C8.09919 35.3751 8.05721 35.4886 8.02977 35.589C8.00356 35.6848 8.00039 35.7333 8.00004 35.7388C8.00004 35.739 8 35.7393 8.00004 35.7388C8.00004 35.7641 8.0104 36.0767 8.68485 36.6314C9.34546 37.1746 10.4222 37.7531 11.9291 38.2772C14.9242 39.319 19.1919 40 24 40C28.8081 40 33.0758 39.319 36.0709 38.2772C37.5778 37.7531 38.6545 37.1746 39.3151 36.6314C39.9006 36.1499 39.9857 35.8511 39.998 35.764ZM4.95178 32.7688L21.4543 6.30267C22.6288 4.4191 25.3712 4.41909 26.5457 6.30267L43.0534 32.777C43.0709 32.8052 43.0878 32.8338 43.104 32.8629L41.3563 33.8352C43.104 32.8629 43.1038 32.8626 43.104 32.8629L43.1051 32.865L43.1065 32.8675L43.1101 32.8739L43.1199 32.8918C43.1276 32.906 43.1377 32.9246 43.1497 32.9473C43.1738 32.9925 43.2062 33.0545 43.244 33.1299C43.319 33.2792 43.4196 33.489 43.5217 33.7317C43.6901 34.1321 44 34.9311 44 35.7391C44 37.4427 43.003 38.7775 41.8558 39.7209C40.6947 40.6757 39.1354 41.4464 37.385 42.0552C33.8654 43.2794 29.133 44 24 44C18.867 44 14.1346 43.2794 10.615 42.0552C8.86463 41.4464 7.30529 40.6757 6.14419 39.7209C4.99695 38.7775 3.99999 37.4427 3.99999 35.7391C3.99999 34.8725 4.29264 34.0922 4.49321 33.6393C4.60375 33.3898 4.71348 33.1804 4.79687 33.0311C4.83898 32.9556 4.87547 32.8935 4.9035 32.8471C4.91754 32.8238 4.92954 32.8043 4.93916 32.7889L4.94662 32.777L4.95178 32.7688ZM35.9868 29.004L24 9.77997L12.0131 29.004C12.4661 28.8609 12.9179 28.7342 13.3617 28.6282C16.4281 27.8961 20.0901 27.4783 24 27.4783C27.9099 27.4783 31.5719 27.8961 34.6383 28.6282C35.082 28.7342 35.5339 28.8609 35.9868 29.004Z"
                      fill="currentColor"
                    />
                  </svg>
                </div>
                <h2 className="text-white text-lg font-bold leading-tight tracking-[-0.015em]">Fleetopia</h2>
              </div>
              <div className="flex flex-1 justify-end gap-8">
                <div className="flex items-center gap-4">
                  {/* Chat Icon */}
                  <button
                    onClick={() => {
                      setIsChatOpen(!isChatOpen)
                      setIsNotificationsOpen(false)
                    }}
                    className="relative text-[#adadad] hover:text-white transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 256 256">
                      <path d="M216,48H40A16,16,0,0,0,24,64V224a8,8,0,0,0,13.07,6.19L60.69,208H216a16,16,0,0,0,16-16V64A16,16,0,0,0,216,48ZM40,192V64H216V192H62.93a8,8,0,0,0-4.8,1.6Z"></path>
                    </svg>
                    {unreadMessagesCount > 0 && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">{unreadMessagesCount}</span>
                      </div>
                    )}
                  </button>

                  {/* Notifications Icon */}
                  <button
                    onClick={() => {
                      setIsNotificationsOpen(!isNotificationsOpen)
                      setIsChatOpen(false)
                    }}
                    className="relative text-[#adadad] hover:text-white transition-colors"
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
                  <RoleAwareNavBar />
                </div>
              </div>
            </footer>
            
            {/* Communication System */}
            <UserChatDropdown isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
            <NotificationsDropdown isOpen={isNotificationsOpen} onClose={() => setIsNotificationsOpen(false)} />
            
            {/* Sticky Chat Widget */}
            <ChatWidget />
          </div>
        </div>
      </body>
    </html>
  )
} 