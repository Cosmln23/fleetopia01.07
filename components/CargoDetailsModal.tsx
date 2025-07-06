'use client'

import { useState, useEffect } from 'react'
import { CargoOffer } from '@/lib/types'
import { formatPrice } from '@/lib/formatters'
import { getCargoDistance, formatDistance } from '@/lib/distanceCalculator'
import ChatPanel from './CargoDetailsModal/ChatPanel'
import CostBreakdown from './CargoDetailsModal/CostBreakdown'
import QuoteStatus from './CargoDetailsModal/QuoteStatus'

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
  const [showChat, setShowChat] = useState(false)
  const [showCostBreakdown, setShowCostBreakdown] = useState(false)
  const [customPrice, setCustomPrice] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

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
    if (isSubmitting) return
    
    setIsSubmitting(true)
    try {
      const price = customPrice ? parseFloat(customPrice) : suggestedPrice
      await onSendQuote(cargo.id, price)
      onClose()
    } catch (error) {
      console.error('Failed to send quote:', error)
    } finally {
      setIsSubmitting(false)
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
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-[#363636]">
          <div className="flex-1">
            <h2 className="text-white text-xl font-bold mb-1">Cargo Details</h2>
            <p className="text-[#adadad] text-sm">
              Route: {cargo.fromAddress.split(',')[0]} → {cargo.toAddress.split(',')[0]} ({formatDistance(distance)})
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-[#adadad] hover:text-white transition-colors p-2"
            aria-label="Close modal"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-[#adadad]">From:</span>
                <p className="text-white font-medium">{cargo.fromAddress}</p>
              </div>
              <div>
                <span className="text-[#adadad]">To:</span>
                <p className="text-white font-medium">{cargo.toAddress}</p>
              </div>
              <div>
                <span className="text-[#adadad]">Distance:</span>
                <p className="text-white font-medium">{formatDistance(distance)}</p>
              </div>
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
            <button
              onClick={handleSendQuote}
              disabled={isSubmitting}
              className="bg-green-600 hover:bg-green-700 disabled:bg-green-800 text-white px-6 py-3 rounded-lg font-medium transition-colors flex-1"
            >
              {isSubmitting ? 'Sending...' : `Take cargo €${customPrice || suggestedPrice}`}
            </button>
            
            <button
              onClick={() => setShowChat(!showChat)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Chat with shipper
            </button>
            
            <button
              onClick={handleIgnore}
              disabled={isSubmitting}
              className="bg-[#363636] hover:bg-[#4d4d4d] disabled:bg-[#2d2d2d] text-[#adadad] hover:text-white px-4 py-3 rounded-lg font-medium transition-colors"
            >
              Ignore
            </button>
          </div>

          {/* Chat Panel - Collapsible */}
          {showChat && (
            <div className="border-t border-[#363636] pt-6">
              <ChatPanel cargoId={cargo.id} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}