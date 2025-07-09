'use client'

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

export type VerificationStatus = 'unverified' | 'pending' | 'verified'

interface VerificationBadgeProps {
  status: VerificationStatus
  className?: string
  showTooltip?: boolean
}

export default function VerificationBadge({ 
  status, 
  className = '', 
  showTooltip = true 
}: VerificationBadgeProps) {
  const config = {
    verified: {
      color: 'bg-green-600 text-white',
      text: 'Verified',
      icon: '✓',
      tooltip: 'This user has been verified with valid business documents'
    },
    pending: {
      color: 'bg-orange-500 text-white',
      text: 'Pending Verification',
      icon: '⏳',
      tooltip: 'Verification documents are being reviewed (max 72h)'
    },
    unverified: {
      color: 'bg-yellow-500 text-black',
      text: 'Unverified',
      icon: '!',
      tooltip: 'This user has not submitted verification documents'
    }
  }

  const badgeConfig = config[status]

  const BadgeComponent = (
    <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${badgeConfig.color} ${className}`}>
      <span className="mr-1">{badgeConfig.icon}</span>
      {badgeConfig.text}
    </span>
  )

  if (!showTooltip) {
    return BadgeComponent
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {BadgeComponent}
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-sm">{badgeConfig.tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

// Compact version for smaller spaces
export function VerificationIcon({ status }: { status: VerificationStatus }) {
  const config = {
    verified: { icon: '✓', color: 'text-green-400' },
    pending: { icon: '⏳', color: 'text-orange-400' },
    unverified: { icon: '!', color: 'text-yellow-400' }
  }

  const { icon, color } = config[status]

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={`inline-flex items-center justify-center w-4 h-4 text-xs ${color}`}>
            {icon}
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-sm capitalize">{status}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}