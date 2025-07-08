'use client'

import { useState } from 'react'
import { UserProfile } from '@/lib/user-profiles'

interface RequestQuoteModalProps {
  profile: UserProfile
  onClose: () => void
}

export default function RequestQuoteModal({ profile, onClose }: RequestQuoteModalProps) {
  const [formData, setFormData] = useState({
    fromLocation: '',
    toLocation: '',
    cargoType: '',
    weight: '',
    volume: '',
    loadingDate: '',
    deliveryDate: '',
    specialRequirements: '',
    budget: ''
  })

  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Mock successful submission
      alert(`Quote request sent to ${profile.name}!`)
      onClose()
    } catch (error) {
      console.error('Failed to send quote request:', error)
      alert('Failed to send quote request. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const isFormValid = formData.fromLocation && formData.toLocation && formData.cargoType && formData.loadingDate

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-[#1a1a1a] rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-[#363636]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#363636]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#363636] flex items-center justify-center overflow-hidden">
              {profile.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt={profile.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-[#adadad] text-sm font-medium">
                  {profile.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div>
              <h3 className="text-white font-bold text-lg">Request Quote</h3>
              <p className="text-[#adadad] text-sm">Send request to {profile.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#adadad] hover:text-white transition-colors p-1"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Route Information */}
          <div className="space-y-4">
            <h4 className="text-white font-medium">Route Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[#adadad] text-sm font-medium mb-2">
                  From Location *
                </label>
                <input
                  type="text"
                  value={formData.fromLocation}
                  onChange={(e) => handleInputChange('fromLocation', e.target.value)}
                  placeholder="e.g., Milan, Italy"
                  className="w-full px-3 py-2 bg-[#2d2d2d] border border-[#363636] rounded-lg text-white placeholder-[#adadad] focus:outline-none focus:border-green-500"
                  required
                />
              </div>
              <div>
                <label className="block text-[#adadad] text-sm font-medium mb-2">
                  To Location *
                </label>
                <input
                  type="text"
                  value={formData.toLocation}
                  onChange={(e) => handleInputChange('toLocation', e.target.value)}
                  placeholder="e.g., Munich, Germany"
                  className="w-full px-3 py-2 bg-[#2d2d2d] border border-[#363636] rounded-lg text-white placeholder-[#adadad] focus:outline-none focus:border-green-500"
                  required
                />
              </div>
            </div>
          </div>

          {/* Cargo Information */}
          <div className="space-y-4">
            <h4 className="text-white font-medium">Cargo Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[#adadad] text-sm font-medium mb-2">
                  Cargo Type *
                </label>
                <select
                  value={formData.cargoType}
                  onChange={(e) => handleInputChange('cargoType', e.target.value)}
                  className="w-full px-3 py-2 bg-[#2d2d2d] border border-[#363636] rounded-lg text-white focus:outline-none focus:border-green-500"
                  required
                >
                  <option value="">Select type</option>
                  <option value="General">General Cargo</option>
                  <option value="Refrigerated">Refrigerated</option>
                  <option value="Dangerous">Dangerous Goods</option>
                  <option value="Automotive">Automotive</option>
                  <option value="Electronics">Electronics</option>
                  <option value="Fashion">Fashion</option>
                  <option value="Food & Beverage">Food & Beverage</option>
                  <option value="Pharmaceuticals">Pharmaceuticals</option>
                </select>
              </div>
              <div>
                <label className="block text-[#adadad] text-sm font-medium mb-2">
                  Weight (kg)
                </label>
                <input
                  type="number"
                  value={formData.weight}
                  onChange={(e) => handleInputChange('weight', e.target.value)}
                  placeholder="e.g., 1500"
                  className="w-full px-3 py-2 bg-[#2d2d2d] border border-[#363636] rounded-lg text-white placeholder-[#adadad] focus:outline-none focus:border-green-500"
                />
              </div>
              <div>
                <label className="block text-[#adadad] text-sm font-medium mb-2">
                  Volume (m³)
                </label>
                <input
                  type="number"
                  value={formData.volume}
                  onChange={(e) => handleInputChange('volume', e.target.value)}
                  placeholder="e.g., 25"
                  className="w-full px-3 py-2 bg-[#2d2d2d] border border-[#363636] rounded-lg text-white placeholder-[#adadad] focus:outline-none focus:border-green-500"
                />
              </div>
            </div>
          </div>

          {/* Dates */}
          <div className="space-y-4">
            <h4 className="text-white font-medium">Schedule</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[#adadad] text-sm font-medium mb-2">
                  Loading Date *
                </label>
                <input
                  type="date"
                  value={formData.loadingDate}
                  onChange={(e) => handleInputChange('loadingDate', e.target.value)}
                  className="w-full px-3 py-2 bg-[#2d2d2d] border border-[#363636] rounded-lg text-white focus:outline-none focus:border-green-500"
                  required
                />
              </div>
              <div>
                <label className="block text-[#adadad] text-sm font-medium mb-2">
                  Delivery Date
                </label>
                <input
                  type="date"
                  value={formData.deliveryDate}
                  onChange={(e) => handleInputChange('deliveryDate', e.target.value)}
                  className="w-full px-3 py-2 bg-[#2d2d2d] border border-[#363636] rounded-lg text-white focus:outline-none focus:border-green-500"
                />
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div className="space-y-4">
            <h4 className="text-white font-medium">Additional Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[#adadad] text-sm font-medium mb-2">
                  Budget Range (EUR)
                </label>
                <input
                  type="text"
                  value={formData.budget}
                  onChange={(e) => handleInputChange('budget', e.target.value)}
                  placeholder="e.g., 800-1200"
                  className="w-full px-3 py-2 bg-[#2d2d2d] border border-[#363636] rounded-lg text-white placeholder-[#adadad] focus:outline-none focus:border-green-500"
                />
              </div>
              <div>
                <label className="block text-[#adadad] text-sm font-medium mb-2">
                  Special Requirements
                </label>
                <textarea
                  value={formData.specialRequirements}
                  onChange={(e) => handleInputChange('specialRequirements', e.target.value)}
                  rows={3}
                  placeholder="Any special handling requirements..."
                  className="w-full px-3 py-2 bg-[#2d2d2d] border border-[#363636] rounded-lg text-white placeholder-[#adadad] focus:outline-none focus:border-green-500 resize-none"
                />
              </div>
            </div>
          </div>

          {/* Provider Info */}
          <div className="bg-[#2d2d2d] border border-[#363636] rounded-lg p-4">
            <h4 className="text-white font-medium mb-2">Quote will be sent to:</h4>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#363636] flex items-center justify-center overflow-hidden">
                {profile.avatarUrl ? (
                  <img
                    src={profile.avatarUrl}
                    alt={profile.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-[#adadad] text-xs font-medium">
                    {profile.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div>
                <p className="text-white font-medium">{profile.name}</p>
                <p className="text-[#adadad] text-sm">{profile.company}</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-[#adadad] hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isFormValid || isSubmitting}
              className="px-6 py-2 bg-green-500 hover:bg-green-600 disabled:bg-[#363636] disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Sending...
                </div>
              ) : (
                'Send Quote Request'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}