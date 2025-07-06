'use client'

import { CargoOffer } from '@/lib/types'
import { formatPrice } from '@/lib/formatters'

interface CostBreakdownProps {
  cargo: CargoOffer
  distance: number
}

// Default cost settings (should come from user preferences in production)
const DEFAULT_COST_SETTINGS = {
  costPerKm: 1.2, // €/km
  costPerHour: 25, // €/hour
  averageSpeed: 80, // km/h
  insuranceFee: 50, // € per trip
  roadFee: 30, // € per trip (tolls, etc.)
  marginPct: 15 // % profit margin
}

export default function CostBreakdown({ cargo, distance }: CostBreakdownProps) {
  // Helper function to format currency properly
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)
  }

  // Calculate costs with proper rounding
  const estimatedTime = parseFloat((distance / DEFAULT_COST_SETTINGS.averageSpeed).toFixed(2))
  const fuelCost = parseFloat((distance * DEFAULT_COST_SETTINGS.costPerKm).toFixed(2))
  const driverCost = parseFloat((estimatedTime * DEFAULT_COST_SETTINGS.costPerHour).toFixed(2))
  const fixedCosts = DEFAULT_COST_SETTINGS.insuranceFee + DEFAULT_COST_SETTINGS.roadFee
  const totalCost = parseFloat((fuelCost + driverCost + fixedCosts).toFixed(2))
  
  // Agent recommendation should never be below posted price
  const agentRecommendation = parseFloat((totalCost * (1 + DEFAULT_COST_SETTINGS.marginPct / 100)).toFixed(2))
  const recommendedPrice = Math.max(agentRecommendation, cargo.price)
  const profitMargin = parseFloat((recommendedPrice - totalCost).toFixed(2))
  
  // Calculate profit if taking the posted price
  const postedPriceProfit = parseFloat((cargo.price - totalCost).toFixed(2))
  const postedProfitPct = parseFloat(((postedPriceProfit / totalCost) * 100).toFixed(1))

  const getProfitColor = (profitPct: number) => {
    if (profitPct >= 20) return 'text-green-400'
    if (profitPct >= 10) return 'text-yellow-400'
    return 'text-red-400'
  }

  return (
    <div className="space-y-4">
      {/* Cost Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-3">
          <h4 className="text-white font-medium text-sm mb-3">Estimated Costs</h4>
          
          <div className="flex justify-between text-sm">
            <span className="text-[#adadad]">Fuel & vehicle ({distance}km × €{DEFAULT_COST_SETTINGS.costPerKm.toFixed(2)}/km):</span>
            <span className="text-white">€{formatCurrency(fuelCost)}</span>
          </div>
          
          <div className="flex justify-between text-sm">
            <span className="text-[#adadad]">Driver pay ({estimatedTime}h × €{DEFAULT_COST_SETTINGS.costPerHour.toFixed(2)}/h):</span>
            <span className="text-white">€{formatCurrency(driverCost)}</span>
          </div>
          
          <div className="flex justify-between text-sm">
            <span className="text-[#adadad]">Insurance & fees:</span>
            <span className="text-white">€{formatCurrency(fixedCosts)}</span>
          </div>
          
          <div className="border-t border-[#4d4d4d] pt-2">
            <div className="flex justify-between text-sm font-medium">
              <span className="text-white">Total Cost:</span>
              <span className="text-white">€{formatCurrency(totalCost)}</span>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="text-white font-medium text-sm mb-3">Profit Analysis</h4>
          
          <div className="bg-[#363636] rounded-lg p-3 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-[#adadad]">Agent recommendation:</span>
              <span className="text-white">€{formatCurrency(recommendedPrice)}</span>
            </div>
            
            <div className="flex justify-between text-sm">
              <span className="text-[#adadad]">Profit at recommendation:</span>
              <span className="text-green-400">€{formatCurrency(profitMargin)}</span>
            </div>
            
            {recommendedPrice > agentRecommendation && (
              <div className="text-xs text-yellow-400">
                * Adjusted to match posted price (min. €{formatCurrency(cargo.price)})
              </div>
            )}
          </div>
          
          <div className="bg-[#363636] rounded-lg p-3 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-[#adadad]">Posted price:</span>
              <span className="text-white">€{formatCurrency(cargo.price)}</span>
            </div>
            
            <div className="flex justify-between text-sm">
              <span className="text-[#adadad]">Your profit at posted price:</span>
              <span className={getProfitColor(postedProfitPct)}>
                €{formatCurrency(postedPriceProfit)} ({postedProfitPct}%)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Profit Indicator */}
      <div className="bg-[#363636] rounded-lg p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-white font-medium text-sm">Profit Assessment</span>
          <span className={`text-sm font-medium ${getProfitColor(postedProfitPct)}`}>
            {postedProfitPct >= 20 ? 'Excellent' : postedProfitPct >= 10 ? 'Good' : 'Low'}
          </span>
        </div>
        
        {/* Profit bar visualization */}
        <div className="w-full bg-[#2d2d2d] rounded-full h-2 mb-2">
          <div 
            className={`h-2 rounded-full transition-all duration-300 ${
              postedProfitPct >= 20 ? 'bg-green-400' : 
              postedProfitPct >= 10 ? 'bg-yellow-400' : 'bg-red-400'
            }`}
            style={{ width: `${Math.min(Math.max(postedProfitPct, 0), 50)}%` }}
          />
        </div>
        
        <p className="text-[#adadad] text-xs">
          {postedProfitPct >= 20 && 'Great profit margin! This is a highly profitable cargo.'}
          {postedProfitPct >= 10 && postedProfitPct < 20 && 'Decent profit margin. Consider market conditions.'}
          {postedProfitPct < 10 && 'Low profit margin. You might want to negotiate a higher price.'}
        </p>
      </div>

      {/* Additional Notes */}
      <div className="text-xs text-[#adadad] space-y-1">
        <p>• Estimated travel time: {estimatedTime.toFixed(1)} hours at {DEFAULT_COST_SETTINGS.averageSpeed} km/h average</p>
        <p>• Costs are estimates based on current fuel prices and market rates</p>
        <p>• Consider additional factors like loading/unloading time, route difficulty, and return trip</p>
      </div>
    </div>
  )
}