'use client'

import { useState } from 'react'
import { useUserRole } from '@/lib/useUserRole'
import { useRouter } from 'next/navigation'

export default function TrialBanner() {
  const { isLoaded, trialStarted, profileCompleted, daysLeft, trialExpired } = useUserRole()
  const [dismissed, setDismissed] = useState(false)
  const router = useRouter()

  // Don't show if not loaded, no trial started, profile already completed, or dismissed
  if (!isLoaded || !trialStarted || profileCompleted || dismissed) {
    return null
  }

  // Don't show if trial expired (middleware will handle redirect)
  if (trialExpired) {
    return null
  }

  // Only show when 2 days or less remaining
  if (daysLeft > 2) {
    return null
  }

  const handleCompleteProfile = () => {
    router.push('/onboarding')
  }

  const handleDismiss = () => {
    setDismissed(true)
  }

  const getUrgencyColor = () => {
    if (daysLeft <= 1) return 'bg-red-600/20 border-red-600/30'
    if (daysLeft <= 2) return 'bg-orange-600/20 border-orange-600/30'
    return 'bg-yellow-600/20 border-yellow-600/30'
  }

  const getTextColor = () => {
    if (daysLeft <= 1) return 'text-red-400'
    if (daysLeft <= 2) return 'text-orange-400'
    return 'text-yellow-400'
  }

  const getButtonColor = () => {
    if (daysLeft <= 1) return 'bg-red-600 hover:bg-red-700'
    if (daysLeft <= 2) return 'bg-orange-600 hover:bg-orange-700'
    return 'bg-yellow-600 hover:bg-yellow-700'
  }

  return (
    <div className={`${getUrgencyColor()} border rounded-lg p-4 mb-4 mx-4`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            {daysLeft <= 1 ? (
              <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className={`w-5 h-5 ${getTextColor()}`} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            )}
          </div>
          <div className="flex-1">
            <p className={`${getTextColor()} font-medium`}>
              {daysLeft === 0 && 'Perioada de trial expiră astăzi!'}
              {daysLeft === 1 && 'Perioada de trial expiră mâine!'}
              {daysLeft === 2 && 'Perioada de trial expiră în 2 zile!'}
            </p>
            <p className="text-[#adadad] text-sm mt-1">
              Completează-ți profilul de business pentru a continua accesul complet la platformă.
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleCompleteProfile}
            className={`${getButtonColor()} text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors`}
          >
            Completează profilul
          </button>
          <button
            onClick={handleDismiss}
            className="text-[#adadad] hover:text-white transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}