'use client'

import { useRouter } from 'next/navigation'
import { User } from '@/lib/types'

interface SenderHeaderProps {
  sender?: User
  postedAt: string
  providerName: string // fallback for old data without sender
}

export default function SenderHeader({ sender, postedAt, providerName }: SenderHeaderProps) {
  const router = useRouter()
  // Format date
  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', { 
        day: 'numeric', 
        month: 'short', 
        year: 'numeric' 
      })
    } catch {
      return 'Unknown'
    }
  }

  // Use sender data if available, otherwise fallback to provider name
  const displayName = sender?.name || providerName || 'Unknown Sender'
  const displayCompany = sender?.company || sender?.location
  const hasAvatar = sender?.avatar
  const isVerified = sender?.verified || false
  const rating = sender?.rating

  return (
    <div className="flex items-center justify-between p-4 pr-16 border-b border-[#363636]">
      <div className="flex items-center space-x-4">
        {/* Avatar */}
        <div className="w-12 h-12 rounded-full bg-[#363636] flex items-center justify-center overflow-hidden">
          {hasAvatar ? (
            <img
              src={sender!.avatar}
              alt={displayName}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-[#adadad] text-lg font-medium">
              {displayName.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        {/* User Info */}
        <div>
          <div className="flex items-center space-x-2">
            <p className="text-white font-medium">{displayName}</p>
            {isVerified && (
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="16" 
                height="16" 
                fill="currentColor" 
                viewBox="0 0 256 256"
                className="text-green-400"
              >
                <path d="M225.86,102.82c-3.77-3.94-5.7-9.62-5.7-16.82s1.93-12.88,5.7-16.82C232.47,61.39,232,52.85,227.74,44.74c-4.26-8.11-12.31-12.37-23.9-12.37-7.2,0-12.88-1.93-16.82-5.7C179.23,19.06,170.69,18.59,162.58,22.85c-8.11,4.26-12.37,12.31-12.37,23.9,0,7.2-1.93,12.88-5.7,16.82C136.72,71.18,136.25,79.72,140.51,87.83c4.26,8.11,12.31,12.37,23.9,12.37,7.2,0,12.88,1.93,16.82,5.7,7.79,7.61,16.33,8.08,24.44,3.82,8.11-4.26,12.37-12.31,12.37-23.9C218.04,115.94,219.97,110.26,225.86,102.82ZM176,152a76,76,0,1,1,76-76A76.08,76.08,0,0,1,176,152Z"></path>
              </svg>
            )}
          </div>
          
          {/* Company/Location and Rating */}
          <div className="flex items-center space-x-3">
            {displayCompany && (
              <p className="text-sm text-[#adadad]">{displayCompany}</p>
            )}
            {rating && (
              <div className="flex items-center space-x-1">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  width="14" 
                  height="14" 
                  fill="currentColor" 
                  viewBox="0 0 256 256"
                  className="text-yellow-400"
                >
                  <path d="M234.5,114.38l-45.1,39.36,13.51,58.6a16,16,0,0,1-23.84,17.34l-51.11-31-51,31a16,16,0,0,1-23.84-17.34L66.61,153.8,21.5,114.38a16,16,0,0,1,9.11-28.06l59.46-5.15,23.21-55.36a15.95,15.95,0,0,1,29.44,0L166,81.17l59.44,5.15a16,16,0,0,1,9.11,28.06Z"></path>
                </svg>
                <span className="text-sm text-yellow-400 font-medium">
                  {rating.toFixed(1)}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Side - Posted Date and Profile Button */}
      <div className="flex flex-col items-end space-y-1">
        <span className="text-sm text-[#adadad]">
          Posted: {formatDate(postedAt)}
        </span>
        {sender && (
          <button 
            className="text-xs text-green-400 hover:text-green-300 hover:underline transition-colors"
            onClick={() => {
              router.push(`/profile/${sender.id}`)
            }}
          >
            View Profile
          </button>
        )}
      </div>
    </div>
  )
}