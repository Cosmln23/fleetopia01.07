'use client'

import Link from 'next/link'
import { useUserRole } from '@/lib/useUserRole'

interface UpgradePromptProps {
  message?: string
  className?: string
  showIcon?: boolean
}

export default function UpgradePrompt({ 
  message = 'Upgrade to Verified →', 
  className = '',
  showIcon = true
}: UpgradePromptProps) {
  const { isVerified, isPending } = useUserRole()

  // Don't show if already verified or pending
  if (isVerified || isPending) {
    return null
  }

  return (
    <Link 
      href="/settings/verification" 
      className={`inline-flex items-center text-xs text-blue-400 hover:text-blue-300 underline transition-colors ${className}`}
    >
      {showIcon && (
        <span className="mr-1">🔓</span>
      )}
      {message}
    </Link>
  )
}

// Component for blocked buttons
export function BlockedButton({ 
  children, 
  upgradeMessage = 'Upgrade to Verified →',
  className = '' 
}: { 
  children: React.ReactNode
  upgradeMessage?: string
  className?: string
}) {
  return (
    <div className={`relative ${className}`}>
      <div className="opacity-50 cursor-not-allowed">
        {children}
      </div>
      <div className="absolute -bottom-6 left-0">
        <UpgradePrompt message={upgradeMessage} />
      </div>
    </div>
  )
}

// Banner component for trial expiration
export function TrialExpirationBanner() {
  const { daysLeft, trialExpired, isVerified } = useUserRole()

  // Don't show if verified or trial hasn't started expiring
  if (isVerified || trialExpired || daysLeft > 2) {
    return null
  }

  const getBannerColor = () => {
    if (daysLeft <= 1) return 'bg-red-600/20 border-red-600/30 text-red-400'
    if (daysLeft <= 2) return 'bg-orange-600/20 border-orange-600/30 text-orange-400'
    return 'bg-yellow-600/20 border-yellow-600/30 text-yellow-400'
  }

  return (
    <div className={`${getBannerColor()} border rounded-lg p-3 mb-4`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-lg">⏰</span>
          <div>
            <p className="font-medium">
              {daysLeft === 0 && 'Trial expires today!'}
              {daysLeft === 1 && 'Trial expires tomorrow!'}
              {daysLeft === 2 && 'Trial expires in 2 days!'}
            </p>
            <p className="text-sm opacity-75">
              Upload verification documents to maintain full access.
            </p>
          </div>
        </div>
        <Link
          href="/settings/verification"
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          Upgrade to Verified
        </Link>
      </div>
    </div>
  )
}