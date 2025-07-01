'use client'

import { useState } from 'react'

interface CostSettings {
  driverPay: number
  fuel: number
  maintenance: number
  tolls: number
  insurance: number
}

interface CostSettingsModalProps {
  isOpen: boolean
  onClose: () => void
  currentSettings: CostSettings
  onSave: (settings: CostSettings) => void
}

export default function CostSettingsModal({ 
  isOpen, 
  onClose, 
  currentSettings, 
  onSave 
}: CostSettingsModalProps) {
  const [settings, setSettings] = useState<CostSettings>(currentSettings)

  if (!isOpen) return null

  const handleSave = () => {
    onSave(settings)
    onClose()
  }

  const handleReset = () => {
    const defaultSettings: CostSettings = {
      driverPay: 500,
      fuel: 300,
      maintenance: 100,
      tolls: 50,
      insurance: 50
    }
    setSettings(defaultSettings)
  }

  const handleInputChange = (field: keyof CostSettings, value: string) => {
    const numValue = Math.max(0, parseFloat(value) || 0)
    setSettings(prev => ({ ...prev, [field]: numValue }))
  }

  const totalCost = settings.driverPay + settings.fuel + settings.maintenance + settings.tolls + settings.insurance

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1a1a] rounded-xl w-full max-w-md">
        <div className="border-b border-[#363636] px-6 py-4 flex justify-between items-center">
          <h2 className="text-white text-xl font-bold">Agent Cost Settings</h2>
          <button
            onClick={onClose}
            className="text-[#adadad] hover:text-white transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 256 256">
              <path d="M205.66,194.34a8,8,0,0,1-11.32,11.32L128,139.31,61.66,205.66a8,8,0,0,1-11.32-11.32L116.69,128,50.34,61.66A8,8,0,0,1,61.66,50.34L128,116.69l66.34-66.35a8,8,0,0,1,11.32,11.32L139.31,128Z"></path>
            </svg>
          </button>
        </div>

        <div className="px-6 py-4 space-y-4">
          <p className="text-[#adadad] text-sm">
            Configure cost parameters that the AI Agent will use for load recommendations and decision making.
          </p>

          {/* Driver Pay */}
          <div>
            <label className="block text-white text-sm font-medium mb-2">Driver Pay</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#adadad]">$</span>
              <input
                type="number"
                min="0"
                step="10"
                value={settings.driverPay}
                onChange={(e) => handleInputChange('driverPay', e.target.value)}
                className="w-full pl-8 pr-3 py-2 bg-[#363636] border border-[#4d4d4d] rounded-lg text-white focus:outline-none focus:border-white"
              />
            </div>
          </div>

          {/* Fuel */}
          <div>
            <label className="block text-white text-sm font-medium mb-2">Fuel</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#adadad]">$</span>
              <input
                type="number"
                min="0"
                step="10"
                value={settings.fuel}
                onChange={(e) => handleInputChange('fuel', e.target.value)}
                className="w-full pl-8 pr-3 py-2 bg-[#363636] border border-[#4d4d4d] rounded-lg text-white focus:outline-none focus:border-white"
              />
            </div>
          </div>

          {/* Maintenance */}
          <div>
            <label className="block text-white text-sm font-medium mb-2">Maintenance</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#adadad]">$</span>
              <input
                type="number"
                min="0"
                step="5"
                value={settings.maintenance}
                onChange={(e) => handleInputChange('maintenance', e.target.value)}
                className="w-full pl-8 pr-3 py-2 bg-[#363636] border border-[#4d4d4d] rounded-lg text-white focus:outline-none focus:border-white"
              />
            </div>
          </div>

          {/* Tolls */}
          <div>
            <label className="block text-white text-sm font-medium mb-2">Tolls</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#adadad]">$</span>
              <input
                type="number"
                min="0"
                step="5"
                value={settings.tolls}
                onChange={(e) => handleInputChange('tolls', e.target.value)}
                className="w-full pl-8 pr-3 py-2 bg-[#363636] border border-[#4d4d4d] rounded-lg text-white focus:outline-none focus:border-white"
              />
            </div>
          </div>

          {/* Insurance */}
          <div>
            <label className="block text-white text-sm font-medium mb-2">Insurance</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#adadad]">$</span>
              <input
                type="number"
                min="0"
                step="5"
                value={settings.insurance}
                onChange={(e) => handleInputChange('insurance', e.target.value)}
                className="w-full pl-8 pr-3 py-2 bg-[#363636] border border-[#4d4d4d] rounded-lg text-white focus:outline-none focus:border-white"
              />
            </div>
          </div>

          {/* Total Display */}
          <div className="border-t border-[#4d4d4d] pt-4">
            <div className="flex justify-between items-center">
              <span className="text-white font-medium">Total Base Cost:</span>
              <span className="text-white text-lg font-bold">${totalCost}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="border-t border-[#363636] px-6 py-4 flex gap-3">
          <button
            onClick={handleReset}
            className="flex-1 bg-[#363636] hover:bg-[#4d4d4d] text-white py-2 px-4 rounded-lg font-medium transition-colors"
          >
            Reset Defaults
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-[#363636] hover:bg-[#4d4d4d] text-white py-2 px-4 rounded-lg font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 bg-white hover:bg-gray-100 text-black py-2 px-4 rounded-lg font-medium transition-colors"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  )
}