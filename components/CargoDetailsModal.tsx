'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { CargoOffer } from '@/lib/types'
import { formatPrice } from '@/lib/formatters'
import { getCargoDistance, formatDistance } from '@/lib/distanceCalculator'
import { getGoogleMapsDirURL, buildCompleteAddress } from '@/lib/googleMaps'
import ChatPanel from './CargoDetailsModal/ChatPanel'
import CostBreakdown from './CargoDetailsModal/CostBreakdown'
import QuoteStatus from './CargoDetailsModal/QuoteStatus'
import SenderHeader from './CargoDetailsModal/SenderHeader'
import { useGlobalChat } from '@/hooks/useGlobalChat'

interface CargoDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  cargo: CargoOffer | null
  onSendQuote: (cargoId: string, price: number) => void
  onIgnore: (cargoId: string) => void
}

export default function CargoDetailsModal({
  isOpen,
  onClose,
  cargo,
  onSendQuote,
  onIgnore
}: CargoDetailsModalProps) {
  const { user } = useUser()
  const { startChatWithCargoOwner } = useGlobalChat()
  const [showChat, setShowChat] = useState(false)
  const [showCostBreakdown, setShowCostBreakdown] = useState(false)
  const [customPrice, setCustomPrice] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [negotiationStatus, setNegotiationStatus] = useState<'initial' | 'quote_sent' | 'negotiating' | 'accepted' | 'rejected'>('initial')

  // Check if current user is the cargo owner
  // Use provider name or user full name comparison since sender might not be populated
  const isOwner = Boolean(
    user && cargo && (
      cargo.provider === user.fullName ||
      cargo.provider === `${user.firstName} ${user.lastName}`.trim() ||
      (cargo.sender && user.id === cargo.sender.id)
    )
  )

  // Debug logging
  console.log('🔍 Delete button debug:', {
    hasUser: !!user,
    hasCargo: !!cargo,
    userFullName: user?.fullName,
    userFirstLast: user ? `${user.firstName} ${user.lastName}`.trim() : null,
    cargoProvider: cargo?.provider,
    isOwner
  })

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setShowChat(false)
      setShowCostBreakdown(false)
      setCustomPrice('')
      setIsSubmitting(false)
    }
  }, [isOpen])

  if (!isOpen || !cargo) return null

  const distance = getCargoDistance(cargo)
  const suggestedPrice = Math.round(cargo.price * 0.85) // 15% lower than posted price

  const handleSendQuote = async () => {
    if (isSubmitting || isOwner) return
    
    setIsSubmitting(true)
    try {
      const price = customPrice ? parseFloat(customPrice) : suggestedPrice
      await onSendQuote(cargo.id, price)
      setNegotiationStatus('quote_sent')
      setShowChat(true) // Auto-open chat after quote sent
      setCustomPrice('') // Clear input
    } catch (error) {
      console.error('Failed to send quote:', error)
    } finally {
      setIsSubmitting(false)
    }
  }
  
  const handleQuoteSentFromChat = (price: number) => {
    setNegotiationStatus('negotiating')
    // Could trigger additional actions here
  }
  
  const getNegotiationStatusDisplay = () => {
    switch (negotiationStatus) {
      case 'quote_sent':
        return (
          <div className="bg-blue-600/20 border border-blue-600/30 rounded-lg p-3 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
              <span className="text-blue-400 font-medium">Quote sent - waiting for response</span>
            </div>
          </div>
        )
      case 'negotiating':
        return (
          <div className="bg-yellow-600/20 border border-yellow-600/30 rounded-lg p-3 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
              <span className="text-yellow-400 font-medium">Negotiating price...</span>
            </div>
          </div>
        )
      case 'accepted':
        return (
          <div className="bg-green-600/20 border border-green-600/30 rounded-lg p-3 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span className="text-green-400 font-medium">Quote accepted! 🎉</span>
            </div>
          </div>
        )
      case 'rejected':
        return (
          <div className="bg-red-600/20 border border-red-600/30 rounded-lg p-3 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-red-400 rounded-full"></div>
              <span className="text-red-400 font-medium">Quote rejected</span>
            </div>
          </div>
        )
      default:
        return null
    }
  }

  const handleIgnore = async () => {
    if (isSubmitting) return
    
    setIsSubmitting(true)
    try {
      await onIgnore(cargo.id)
      onClose()
    } catch (error) {
      console.error('Failed to ignore cargo:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteCargo = async () => {
    if (isSubmitting) return
    
    const confirmed = window.confirm(
      'Are you sure you want to delete this cargo listing? This action cannot be undone.'
    )
    
    if (!confirmed) return
    
    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/cargo/${cargo.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      })
      
      if (response.ok) {
        onClose()
        // Refresh the page to update the cargo list
        window.location.reload()
      } else {
        throw new Error('Failed to delete cargo')
      }
    } catch (error) {
      console.error('Failed to delete cargo:', error)
      alert('Failed to delete cargo. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose()
    }
  }

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      <div className="bg-[#1a1a1a] rounded-xl border border-[#363636] w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Sender Header */}
        <div className="relative">
          <SenderHeader 
            sender={cargo.sender}
            postedAt={cargo.postingDate}
            providerName={cargo.provider}
          />
          <div className="absolute top-4 right-4 flex gap-2">
            {/* Delete button - only for cargo owner */}
            {isOwner && (
              <button
                onClick={() => handleDeleteCargo()}
                className="text-red-400 hover:text-red-300 transition-colors p-2 hover:bg-red-900/20 rounded-lg"
                aria-label="Delete cargo"
                title="Delete this cargo listing"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
            
            {/* Close button */}
            <button
              onClick={onClose}
              className="text-[#adadad] hover:text-white transition-colors p-2 hover:bg-[#2d2d2d] rounded-lg"
              aria-label="Close modal"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* Title Header */}
        <div className="px-6 py-4 border-b border-[#363636]">
          <h2 className="text-white text-xl font-bold">Cargo Details</h2>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Negotiation Status */}
          {getNegotiationStatusDisplay()}
          {/* Main Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#2d2d2d] rounded-lg p-4">
              <h3 className="text-[#adadad] text-sm font-medium mb-1">Weight & Volume</h3>
              <p className="text-white text-lg font-bold">{cargo.weight}kg</p>
              {cargo.volume && <p className="text-[#adadad] text-sm">{cargo.volume}m³</p>}
            </div>
            
            <div className="bg-[#2d2d2d] rounded-lg p-4">
              <h3 className="text-[#adadad] text-sm font-medium mb-1">Cargo Type</h3>
              <p className="text-white text-lg font-bold">{cargo.cargoType}</p>
              <p className="text-[#adadad] text-sm">Urgency: {cargo.urgency}</p>
            </div>
            
            <div className="bg-[#2d2d2d] rounded-lg p-4">
              <h3 className="text-[#adadad] text-sm font-medium mb-1">Loading Date</h3>
              <p className="text-white text-lg font-bold">{cargo.loadingDate}</p>
            </div>
            
            <div className="bg-[#2d2d2d] rounded-lg p-4">
              <h3 className="text-[#adadad] text-sm font-medium mb-1">Delivery Date</h3>
              <p className="text-white text-lg font-bold">{cargo.deliveryDate}</p>
            </div>
          </div>

          {/* Distance Section */}
          <div className="bg-[#2d2d2d] rounded-lg p-4">
            <h3 className="text-white text-lg font-bold mb-3">Distance Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* From Address */}
              <div>
                <span className="text-[#adadad] text-sm font-medium">From:</span>
                <div className="mt-1 text-white">
                  <div className="font-medium">{cargo.fromAddress}</div>
                  {(cargo.fromPostal || cargo.fromCity) && (
                    <div className="text-sm text-[#adadad] mt-0.5">
                      {[cargo.fromPostal, cargo.fromCity].filter(Boolean).join(' ')}
                    </div>
                  )}
                  {cargo.fromCountry && (
                    <div className="text-sm text-[#adadad]">{cargo.fromCountry}</div>
                  )}
                </div>
              </div>
              
              {/* To Address */}
              <div>
                <span className="text-[#adadad] text-sm font-medium">To:</span>
                <div className="mt-1 text-white">
                  <div className="font-medium">{cargo.toAddress}</div>
                  {(cargo.toPostal || cargo.toCity) && (
                    <div className="text-sm text-[#adadad] mt-0.5">
                      {[cargo.toPostal, cargo.toCity].filter(Boolean).join(' ')}
                    </div>
                  )}
                  {cargo.toCountry && (
                    <div className="text-sm text-[#adadad]">{cargo.toCountry}</div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Route Button */}
            <div className="mt-4 pt-4 border-t border-[#363636]">
              <a
                href={getGoogleMapsDirURL(
                  buildCompleteAddress(cargo.fromAddress, cargo.fromCity, cargo.fromPostal, cargo.fromCountry),
                  buildCompleteAddress(cargo.toAddress, cargo.toCity, cargo.toPostal, cargo.toCountry)
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors font-medium text-sm"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 256 256">
                  <path d="M240,208H224V96a16,16,0,0,0-16-16H184V72a16,16,0,0,0-16-16H88A16,16,0,0,0,72,72v8H48A16,16,0,0,0,32,96V208H16a8,8,0,0,0,0,16H240a8,8,0,0,0,0-16ZM88,72h80v8H88Zm120,24V208H160V184a16,16,0,0,0-16-16H112a16,16,0,0,0-16,16v24H48V96ZM144,208H112V184h32Z"></path>
                </svg>
                View full route ({formatDistance(distance)})
              </a>
            </div>
          </div>

          {/* Cost Breakdown - Collapsible */}
          <div className="bg-[#2d2d2d] rounded-lg">
            <button
              onClick={() => setShowCostBreakdown(!showCostBreakdown)}
              className="w-full p-4 text-left flex justify-between items-center hover:bg-[#333333] transition-colors"
            >
              <h3 className="text-white text-lg font-bold">Cost Details</h3>
              <svg 
                className={`w-5 h-5 text-[#adadad] transition-transform ${showCostBreakdown ? 'rotate-180' : ''}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {showCostBreakdown && (
              <div className="px-4 pb-4">
                <CostBreakdown cargo={cargo} distance={distance} />
              </div>
            )}
          </div>

          {/* Quote Status */}
          <QuoteStatus cargoId={cargo.id} />

          {/* Quote Input */}
          <div className="bg-[#2d2d2d] rounded-lg p-4">
            <h3 className="text-white text-lg font-bold mb-3">Send Quote</h3>
            <div className="space-y-3">
              <div>
                <label className="text-[#adadad] text-sm block mb-1">
                  Your Price (Suggested: €{formatPrice(suggestedPrice)})
                </label>
                <input
                  type="number"
                  value={customPrice}
                  onChange={(e) => setCustomPrice(e.target.value)}
                  placeholder={suggestedPrice.toString()}
                  className="w-full bg-[#363636] border border-[#4d4d4d] rounded-lg px-3 py-2 text-white placeholder-[#adadad] focus:outline-none focus:border-white"
                />
              </div>
              <p className="text-[#adadad] text-xs">
                Posted price: €{formatPrice(cargo.price)} | Price per kg: €{cargo.pricePerKg}/kg
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-[#363636]">
            {!isOwner && (
              <>
                <button
                  onClick={handleSendQuote}
                  disabled={isSubmitting}
                  className="bg-green-600 hover:bg-green-700 disabled:bg-green-800 text-white px-6 py-3 rounded-lg font-medium transition-colors flex-1"
                >
                  {isSubmitting ? 'Sending...' : `Take cargo €${customPrice || suggestedPrice}`}
                </button>
                
                <button
                  onClick={handleIgnore}
                  disabled={isSubmitting}
                  className="bg-[#363636] hover:bg-[#4d4d4d] disabled:bg-[#2d2d2d] text-[#adadad] hover:text-white px-4 py-3 rounded-lg font-medium transition-colors"
                >
                  Ignore
                </button>
              </>
            )}
            
            <button
              onClick={async () => {
                if (!isOwner && cargo.sender?.id) {
                  // For non-owners, create global conversation
                  const conversationId = await startChatWithCargoOwner(
                    cargo.id,
                    cargo.provider,
                    cargo.sender.id
                  )
                  if (conversationId) {
                    // Close modal and let global chat widget handle the conversation
                    onClose()
                    // Trigger global chat to open this conversation
                    window.dispatchEvent(new CustomEvent('openGlobalChat', { 
                      detail: { conversationId } 
                    }))
                  }
                } else {
                  // For owners, toggle local chat panel
                  setShowChat(!showChat)
                }
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              {isOwner ? 'View Messages' : 'Chat with shipper'}
            </button>
          </div>

          {/* Chat Panel - Collapsible */}
          {showChat && (
            <div className="border-t border-[#363636] pt-6">
              <ChatPanel 
                cargoId={cargo.id} 
                onQuoteSent={handleQuoteSentFromChat}
                suggestedPrice={suggestedPrice}
                isOwner={isOwner}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}