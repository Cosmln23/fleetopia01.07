/**
 * CHAT BUTTON COMPONENT
 * 
 * Simple chat button to initiate conversations with cargo providers
 * Features:
 * - Opens chat modal with provider
 * - Handles chat room creation
 * - Integration with Socket.io
 */

'use client'

import { useState } from 'react'
import ChatModal from './Chat/ChatModal'

interface ChatButtonProps {
  cargoId: string
  providerId: string
  providerName: string
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export default function ChatButton({
  cargoId,
  providerId,
  providerName,
  className = '',
  size = 'md'
}: ChatButtonProps) {
  const [isChatOpen, setIsChatOpen] = useState(false)

  // Size configurations
  const sizeConfig = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  }

  const handleChatClick = () => {
    setIsChatOpen(true)
  }

  const handleChatClose = () => {
    setIsChatOpen(false)
  }

  return (
    <>
      <button
        onClick={handleChatClick}
        className={`
          ${sizeConfig[size]}
          bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg
          transition-colors duration-200 flex items-center space-x-2
          ${className}
        `}
      >
        {/* Chat Icon */}
        <svg 
          className="w-4 h-4" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" 
          />
        </svg>
        <span>Chat cu Furnizorul</span>
      </button>

      {/* Chat Modal */}
      {isChatOpen && (
        <ChatModal
          cargoId={cargoId}
          providerId={providerId}
          providerName={providerName}
          onClose={handleChatClose}
        />
      )}
    </>
  )
}