'use client'

import { useState } from 'react'
import { CargoType, UrgencyLevel, CargoOffer, CargoStatus } from '@/lib/types'
import { geocodePostal } from '@/lib/geo'

interface AddCargoModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (cargoData: Omit<CargoOffer, 'id' | 'createdAt' | 'updatedAt'>) => void
}

export default function AddCargoModal({ isOpen, onClose, onSubmit }: AddCargoModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    weight: '',
    volume: '',
    price: '',
    urgency: UrgencyLevel.MEDIUM,
    cargoType: CargoType.GENERAL,
    fromAddress: '',
    toAddress: '',
    fromCountry: '',
    toCountry: '',
    fromPostal: '',
    fromCity: '',
    toPostal: '',
    toCity: '',
    pickupLat: '',
    pickupLng: '',
    deliveryLat: '',
    deliveryLng: '',
    loadingDate: '',
    deliveryDate: '',
    postingDate: '',
    provider: '',
    providerStatus: 'New, Verified'
  })

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Calculate price per kg
    const weightNum = parseFloat(formData.weight)
    const priceNum = parseFloat(formData.price)
    const pricePerKg = weightNum > 0 ? priceNum / weightNum : 0

    // Geocode pickup and delivery locations
    let pickupCoords = { lat: 0, lng: 0 }
    let deliveryCoords = { lat: 0, lng: 0 }

    if (formData.fromPostal && formData.fromCity && formData.fromCountry) {
      const fromResult = await geocodePostal(formData.fromPostal, formData.fromCity, formData.fromCountry)
      if (fromResult.success && fromResult.location) {
        pickupCoords = { lat: fromResult.location.lat, lng: fromResult.location.lng }
      }
    }

    if (formData.toPostal && formData.toCity && formData.toCountry) {
      const toResult = await geocodePostal(formData.toPostal, formData.toCity, formData.toCountry)
      if (toResult.success && toResult.location) {
        deliveryCoords = { lat: toResult.location.lat, lng: toResult.location.lng }
      }
    }

    const cargoData: Omit<CargoOffer, 'id' | 'createdAt' | 'updatedAt'> = {
      title: formData.title,
      weight: weightNum,
      volume: formData.volume ? parseFloat(formData.volume) : undefined,
      price: priceNum,
      pricePerKg: parseFloat(pricePerKg.toFixed(2)),
      urgency: formData.urgency,
      cargoType: formData.cargoType,
      fromAddress: formData.fromAddress,
      toAddress: formData.toAddress,
      fromCountry: formData.fromCountry,
      toCountry: formData.toCountry,
      fromPostal: formData.fromPostal,
      fromCity: formData.fromCity,
      toPostal: formData.toPostal,
      toCity: formData.toCity,
      pickupLat: pickupCoords.lat,
      pickupLng: pickupCoords.lng,
      deliveryLat: deliveryCoords.lat,
      deliveryLng: deliveryCoords.lng,
      loadingDate: formData.loadingDate,
      deliveryDate: formData.deliveryDate,
      postingDate: new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      provider: formData.provider,
      providerStatus: formData.providerStatus,
      status: CargoStatus.NEW
    }

    onSubmit(cargoData)
    onClose()
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1a1a] rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-[#1a1a1a] border-b border-[#363636] px-6 py-4 flex justify-between items-center">
          <h2 className="text-white text-2xl font-bold">Add Cargo</h2>
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
          {/* Cargo Details Section */}
          <div>
            <h3 className="text-white text-lg font-bold mb-4">Cargo Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-white text-sm font-medium mb-2">Cargo Title</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="e.g. Electronics Transport - Urgent Delivery"
                  className="w-full px-3 py-2 bg-[#363636] border border-[#4d4d4d] rounded-lg text-white placeholder-[#adadad] focus:outline-none focus:border-white"
                />
              </div>
              <div>
                <label className="block text-white text-sm font-medium mb-2">Cargo Type</label>
                <select
                  required
                  value={formData.cargoType}
                  onChange={(e) => handleInputChange('cargoType', e.target.value)}
                  className="w-full px-3 py-2 bg-[#363636] border border-[#4d4d4d] rounded-lg text-white focus:outline-none focus:border-white"
                >
                  <option value={CargoType.GENERAL}>General</option>
                  <option value={CargoType.REFRIGERATED}>Refrigerated</option>
                  <option value={CargoType.FRAGILE}>Fragile</option>
                  <option value={CargoType.DANGEROUS}>Dangerous</option>
                  <option value={CargoType.OVERSIZED}>Oversized</option>
                </select>
              </div>
              <div>
                <label className="block text-white text-sm font-medium mb-2">Weight (kg)</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={formData.weight}
                  onChange={(e) => handleInputChange('weight', e.target.value)}
                  placeholder="e.g. 566"
                  className="w-full px-3 py-2 bg-[#363636] border border-[#4d4d4d] rounded-lg text-white placeholder-[#adadad] focus:outline-none focus:border-white"
                />
              </div>
              <div>
                <label className="block text-white text-sm font-medium mb-2">Volume (m³) - Optional</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={formData.volume}
                  onChange={(e) => handleInputChange('volume', e.target.value)}
                  placeholder="e.g. 2.5"
                  className="w-full px-3 py-2 bg-[#363636] border border-[#4d4d4d] rounded-lg text-white placeholder-[#adadad] focus:outline-none focus:border-white"
                />
              </div>
              <div>
                <label className="block text-white text-sm font-medium mb-2">Urgency Level</label>
                <select
                  required
                  value={formData.urgency}
                  onChange={(e) => handleInputChange('urgency', e.target.value)}
                  className="w-full px-3 py-2 bg-[#363636] border border-[#4d4d4d] rounded-lg text-white focus:outline-none focus:border-white"
                >
                  <option value={UrgencyLevel.LOW}>Low</option>
                  <option value={UrgencyLevel.MEDIUM}>Medium</option>
                  <option value={UrgencyLevel.HIGH}>High</option>
                  <option value={UrgencyLevel.URGENT}>Urgent</option>
                </select>
              </div>
            </div>
          </div>

          {/* Route Information Section */}
          <div>
            <h3 className="text-white text-lg font-bold mb-4">Route Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-white text-sm font-medium mb-2">From Address</label>
                <input
                  type="text"
                  required
                  value={formData.fromAddress}
                  onChange={(e) => handleInputChange('fromAddress', e.target.value)}
                  placeholder="e.g. The Hague, Netherlands, 2595 AA"
                  className="w-full px-3 py-2 bg-[#363636] border border-[#4d4d4d] rounded-lg text-white placeholder-[#adadad] focus:outline-none focus:border-white"
                />
              </div>
              <div>
                <label className="block text-white text-sm font-medium mb-2">To Address</label>
                <input
                  type="text"
                  required
                  value={formData.toAddress}
                  onChange={(e) => handleInputChange('toAddress', e.target.value)}
                  placeholder="e.g. Carei, Romania, 445100"
                  className="w-full px-3 py-2 bg-[#363636] border border-[#4d4d4d] rounded-lg text-white placeholder-[#adadad] focus:outline-none focus:border-white"
                />
              </div>
              <div>
                <label className="block text-white text-sm font-medium mb-2">From Country</label>
                <input
                  type="text"
                  required
                  value={formData.fromCountry}
                  onChange={(e) => handleInputChange('fromCountry', e.target.value)}
                  placeholder="e.g. Netherlands"
                  className="w-full px-3 py-2 bg-[#363636] border border-[#4d4d4d] rounded-lg text-white placeholder-[#adadad] focus:outline-none focus:border-white"
                />
              </div>
              <div>
                <label className="block text-white text-sm font-medium mb-2">To Country</label>
                <input
                  type="text"
                  required
                  value={formData.toCountry}
                  onChange={(e) => handleInputChange('toCountry', e.target.value)}
                  placeholder="e.g. Romania"
                  className="w-full px-3 py-2 bg-[#363636] border border-[#4d4d4d] rounded-lg text-white placeholder-[#adadad] focus:outline-none focus:border-white"
                />
              </div>
              <div>
                <label className="block text-white text-sm font-medium mb-2">From Postal Code</label>
                <input
                  type="text"
                  required
                  value={formData.fromPostal || ''}
                  onChange={(e) => handleInputChange('fromPostal', e.target.value)}
                  placeholder="e.g. 2595 AA"
                  className="w-full px-3 py-2 bg-[#363636] border border-[#4d4d4d] rounded-lg text-white placeholder-[#adadad] focus:outline-none focus:border-white"
                />
              </div>
              <div>
                <label className="block text-white text-sm font-medium mb-2">To Postal Code</label>
                <input
                  type="text"
                  required
                  value={formData.toPostal || ''}
                  onChange={(e) => handleInputChange('toPostal', e.target.value)}
                  placeholder="e.g. 445100"
                  className="w-full px-3 py-2 bg-[#363636] border border-[#4d4d4d] rounded-lg text-white placeholder-[#adadad] focus:outline-none focus:border-white"
                />
              </div>
              <div>
                <label className="block text-white text-sm font-medium mb-2">From City</label>
                <input
                  type="text"
                  required
                  value={formData.fromCity || ''}
                  onChange={(e) => handleInputChange('fromCity', e.target.value)}
                  placeholder="e.g. The Hague"
                  className="w-full px-3 py-2 bg-[#363636] border border-[#4d4d4d] rounded-lg text-white placeholder-[#adadad] focus:outline-none focus:border-white"
                />
              </div>
              <div>
                <label className="block text-white text-sm font-medium mb-2">To City</label>
                <input
                  type="text"
                  required
                  value={formData.toCity || ''}
                  onChange={(e) => handleInputChange('toCity', e.target.value)}
                  placeholder="e.g. Carei"
                  className="w-full px-3 py-2 bg-[#363636] border border-[#4d4d4d] rounded-lg text-white placeholder-[#adadad] focus:outline-none focus:border-white"
                />
              </div>
            </div>
          </div>

          {/* Schedule Section */}
          <div>
            <h3 className="text-white text-lg font-bold mb-4">Schedule</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-white text-sm font-medium mb-2">Loading Date</label>
                <input
                  type="date"
                  required
                  value={formData.loadingDate}
                  onChange={(e) => handleInputChange('loadingDate', e.target.value)}
                  className="w-full px-3 py-2 bg-[#363636] border border-[#4d4d4d] rounded-lg text-white focus:outline-none focus:border-white"
                />
              </div>
              <div>
                <label className="block text-white text-sm font-medium mb-2">Delivery Date</label>
                <input
                  type="date"
                  required
                  value={formData.deliveryDate}
                  onChange={(e) => handleInputChange('deliveryDate', e.target.value)}
                  className="w-full px-3 py-2 bg-[#363636] border border-[#4d4d4d] rounded-lg text-white focus:outline-none focus:border-white"
                />
              </div>
            </div>
          </div>

          {/* Price Information Section */}
          <div>
            <h3 className="text-white text-lg font-bold mb-4">Price Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-white text-sm font-medium mb-2">Total Price (EUR)</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={formData.price}
                  onChange={(e) => handleInputChange('price', e.target.value)}
                  placeholder="e.g. 900"
                  className="w-full px-3 py-2 bg-[#363636] border border-[#4d4d4d] rounded-lg text-white placeholder-[#adadad] focus:outline-none focus:border-white"
                />
              </div>
              <div>
                <label className="block text-white text-sm font-medium mb-2">Price per kg (auto-calculated)</label>
                <input
                  type="text"
                  readOnly
                  value={formData.weight && formData.price ? `€${(parseFloat(formData.price) / parseFloat(formData.weight)).toFixed(2)}` : '€0.00'}
                  className="w-full px-3 py-2 bg-[#2d2d2d] border border-[#4d4d4d] rounded-lg text-[#adadad] cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          {/* Provider Information Section */}
          <div>
            <h3 className="text-white text-lg font-bold mb-4">Provider Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-white text-sm font-medium mb-2">Provider Name</label>
                <input
                  type="text"
                  required
                  value={formData.provider}
                  onChange={(e) => handleInputChange('provider', e.target.value)}
                  placeholder="e.g. Martinos"
                  className="w-full px-3 py-2 bg-[#363636] border border-[#4d4d4d] rounded-lg text-white placeholder-[#adadad] focus:outline-none focus:border-white"
                />
              </div>
              <div>
                <label className="block text-white text-sm font-medium mb-2">Provider Status</label>
                <select
                  required
                  value={formData.providerStatus}
                  onChange={(e) => handleInputChange('providerStatus', e.target.value)}
                  className="w-full px-3 py-2 bg-[#363636] border border-[#4d4d4d] rounded-lg text-white focus:outline-none focus:border-white"
                >
                  <option value="New, Verified">New, Verified</option>
                  <option value="Experienced, Premium">Experienced, Premium</option>
                  <option value="Verified, Specialized">Verified, Specialized</option>
                  <option value="Premium, Certified">Premium, Certified</option>
                  <option value="Specialized, Certified">Specialized, Certified</option>
                </select>
              </div>
            </div>
          </div>

          {/* Submit Buttons */}
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
              className="flex-1 bg-white hover:bg-gray-100 text-black py-3 px-4 rounded-lg font-medium transition-colors"
            >
              Add Cargo
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}