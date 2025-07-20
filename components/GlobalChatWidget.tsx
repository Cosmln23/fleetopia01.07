'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import ChatConversationsList from './Chat/ChatConversationsList'
import ChatWindow from './Chat/ChatWindow'

interface GlobalChatWidgetProps {
  className?: string
}

export default function GlobalChatWidget({ className = '' }: GlobalChatWidgetProps) {
  const { user, isLoaded } = useUser()
  const [isOpen, setIsOpen] = useState(false)
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null)
  const [unreadCount, setUnreadCount] = useState(0)

  // Listen for custom events to open specific conversations
  useEffect(() => {
    const handleOpenGlobalChat = (event: CustomEvent) => {
      const { conversationId } = event.detail
      if (conversationId) {
        setSelectedConversationId(conversationId)
        setIsOpen(true)
      }
    }

    window.addEventListener('openGlobalChat', handleOpenGlobalChat as EventListener)
    
    return () => {
      window.removeEventListener('openGlobalChat', handleOpenGlobalChat as EventListener)
    }
  }, [])

  // Remove the condition that hides the widget if no user
  // if (!isLoaded || !user) {
  //   return null
  // }

  const handleConversationSelect = (conversationId: string) => {
    setSelectedConversationId(conversationId)
  }

  const handleBackToList = () => {
    setSelectedConversationId(null)
  }

  const handleClose = () => {
    setIsOpen(false)
    setSelectedConversationId(null)
  }

  return (
    <>
      {/* Chat Widget Button - Fixed Bottom Right */}
      <div className={`fixed bottom-4 right-4 z-50 ${className}`}>
        {!isOpen && (
          <button
            onClick={() => {
              if (!user) {
                // Redirect to sign-in or show prompt
                window.location.href = '/sign-in'
              } else {
                setIsOpen(true)
              }
            }}
            className="relative bg-blue-600 hover:bg-blue-700 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg transition-all duration-200 hover:scale-105"
            aria-label="Open chat"
          >
            {/* Chat Icon */}
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            
            {/* Unread Messages Badge */}
            {unreadCount > 0 && (
              <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold">
                {unreadCount > 99 ? '99+' : unreadCount}
              </div>
            )}
          </button>
        )}
      </div>

      {/* Chat Window - Overlay */}
      {isOpen && user && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-end justify-end z-50 p-4">
          {/* Chat Container */}
          <div className="bg-[#1a1a1a] rounded-lg border border-[#363636] w-full max-w-md h-[600px] max-h-[80vh] flex flex-col overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="bg-[#2d2d2d] px-4 py-3 border-b border-[#363636] flex items-center justify-between">
              <div className="flex items-center gap-3">
                {selectedConversationId && (
                  <button
                    onClick={handleBackToList}
                    className="text-[#adadad] hover:text-white transition-colors p-1"
                    aria-label="Back to conversations"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                )}
                <h3 className="text-white font-semibold">
                  {selectedConversationId ? 'Chat' : 'Messages'}
                </h3>
              </div>
              
              <button
                onClick={handleClose}
                className="text-[#adadad] hover:text-white transition-colors p-1"
                aria-label="Close chat"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden">
              {selectedConversationId ? (
                <ChatWindow 
                  conversationId={selectedConversationId}
                  onClose={handleBackToList}
                />
              ) : (
                <ChatConversationsList 
                  onConversationSelect={handleConversationSelect}
                  onUnreadCountChange={setUnreadCount}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* If not user and isOpen (though we redirect, just in case) */}
      {isOpen && !user && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a1a] rounded-lg p-6 text-center">
            <p className="text-white mb-4">Please sign in to use chat</p>
            <button onClick={() => window.location.href = '/sign-in'} className="bg-blue-600 px-4 py-2 rounded text-white">
              Sign In
            </button>
          </div>
        </div>
      )}
    </>
  )
}