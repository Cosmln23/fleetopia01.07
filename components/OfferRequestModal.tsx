'use client'

import { useState } from 'react'
import { OfferRequest } from '@/lib/types'
import { formatPrice } from '@/lib/formatters'

interface OfferRequestModalProps {
  isOpen: boolean
  onClose: () => void
  cargoId: string
  cargoTitle: string
  originalPrice: number
  onSubmit: (offerData: Omit<OfferRequest, 'id' | 'createdAt' | 'status'>) => void
}

export default function OfferRequestModal({ 
  isOpen, 
  onClose, 
  cargoId, 
  cargoTitle,
  originalPrice,
  onSubmit 
}: OfferRequestModalProps) {
  const [formData, setFormData] = useState({
    proposedPrice: '',
    message: ''
  })

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const offerData: Omit<OfferRequest, 'id' | 'createdAt' | 'status'> = {
      cargoOfferId: cargoId,
      transporterId: 'current_user_id', // In real app, get from auth
      proposedPrice: parseFloat(formData.proposedPrice),
      message: formData.message || undefined
    }

    onSubmit(offerData)
    onClose()
    setFormData({ proposedPrice: '', message: '' })
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const proposedPrice = parseFloat(formData.proposedPrice)
  const savings = originalPrice - proposedPrice
  const savingsPercent = originalPrice > 0 ? ((savings / originalPrice) * 100).toFixed(1) : 0

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1a1a] rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-[#1a1a1a] border-b border-[#363636] px-6 py-4 flex justify-between items-center">
          <h2 className="text-white text-xl font-bold">Submit Offer</h2>
          <button
            onClick={onClose}
            className="text-[#adadad] hover:text-white transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 256 256">
              <path d="M205.66,194.34a8,8,0,0,1-11.32,11.32L128,139.31,61.66,205.66a8,8,0,0,1-11.32-11.32L116.69,128,50.34,61.66A8,8,0,0,1,61.66,50.34L128,116.69l66.34-66.35a8,8,0,0,1,11.32,11.32L139.31,128Z"></path>
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-6">
          {/* Cargo Info */}
          <div className="bg-[#2d2d2d] rounded-lg p-4">
            <h3 className="text-white text-lg font-bold mb-2">Cargo Details</h3>
            <p className="text-[#adadad] text-sm mb-1">{cargoTitle}</p>
            <p className="text-white text-lg font-bold">Original Price: €{formatPrice(originalPrice)}</p>
          </div>

          {/* Price Offer */}
          <div>
            <label className="block text-white text-sm font-medium mb-2">Your Price Offer (EUR)</label>
            <input
              type="number"
              required
              min="1"
              step="0.01"
              value={formData.proposedPrice}
              onChange={(e) => handleInputChange('proposedPrice', e.target.value)}
              placeholder={`e.g. ${Math.round(originalPrice * 0.9)}`}
              className="w-full px-3 py-2 bg-[#363636] border border-[#4d4d4d] rounded-lg text-white placeholder-[#adadad] focus:outline-none focus:border-white"
            />
            {proposedPrice > 0 && (
              <div className="mt-2 text-sm">
                {savings > 0 ? (
                  <p className="text-green-400">
                    💰 Client saves €{formatPrice(savings)} ({savingsPercent}% less)
                  </p>
                ) : savings < 0 ? (
                  <p className="text-red-400">
                    ⚠️ €{formatPrice(Math.abs(savings))} more than original price
                  </p>
                ) : (
                  <p className="text-[#adadad]">Same as original price</p>
                )}
              </div>
            )}
          </div>

          {/* Message */}
          <div>
            <label className="block text-white text-sm font-medium mb-2">Message (Optional)</label>
            <textarea
              rows={4}
              value={formData.message}
              onChange={(e) => handleInputChange('message', e.target.value)}
              placeholder="Explain why you're the best choice for this transport. Mention your experience, equipment, or special services..."
              className="w-full px-3 py-2 bg-[#363636] border border-[#4d4d4d] rounded-lg text-white placeholder-[#adadad] focus:outline-none focus:border-white resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-[#363636] hover:bg-[#4d4d4d] text-white py-3 px-4 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!formData.proposedPrice}
              className="flex-1 bg-white hover:bg-gray-100 disabled:bg-[#4d4d4d] disabled:text-[#adadad] text-black py-3 px-4 rounded-lg font-medium transition-colors"
            >
              Submit Offer
            </button>
          </div>
        </form>
      </div>
    </div>
  )
} 