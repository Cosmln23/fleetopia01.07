'use client'

import { UserProfile } from '@/lib/user-profiles'

interface UserProfileCardProps {
  profile: UserProfile
  onViewFullProfile?: () => void
  compact?: boolean
}

export default function UserProfileCard({ profile, onViewFullProfile, compact = false }: UserProfileCardProps) {
  const formatRating = (rating: number): string => {
    return rating.toFixed(1)
  }

  const renderStars = (rating: number) => {
    const fullStars = Math.floor(rating)
    const hasHalfStar = rating % 1 >= 0.5
    
    return (
      <div className="flex items-center gap-1">
        {[...Array(5)].map((_, i) => (
          <svg 
            key={i}
            xmlns="http://www.w3.org/2000/svg" 
            width="14" 
            height="14" 
            fill="currentColor" 
            viewBox="0 0 256 256"
            className={`${
              i < fullStars 
                ? 'text-yellow-400' 
                : i === fullStars && hasHalfStar 
                  ? 'text-yellow-400' 
                  : 'text-[#363636]'
            }`}
          >
            <path d="M234.5,114.38l-45.1,39.36,13.51,58.6a16,16,0,0,1-23.84,17.34l-51.11-31-51,31a16,16,0,0,1-23.84-17.34L66.61,153.8,21.5,114.38a16,16,0,0,1,9.11-28.06l59.46-5.15,23.21-55.36a15.95,15.95,0,0,1,29.44,0L166,81.17l59.44,5.15a16,16,0,0,1,9.11,28.06Z"></path>
          </svg>
        ))}
      </div>
    )
  }

  const successRate = Math.round((profile.stats.completed / profile.stats.posted) * 100)

  if (compact) {
    return (
      <div className="bg-[#2d2d2d] border border-[#363636] rounded-lg p-3">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="w-10 h-10 rounded-full bg-[#363636] flex items-center justify-center overflow-hidden flex-shrink-0">
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

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-white font-medium text-sm truncate">{profile.name}</span>
              {profile.verified && (
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  width="14" 
                  height="14" 
                  fill="currentColor" 
                  viewBox="0 0 256 256"
                  className="text-green-400 flex-shrink-0"
                >
                  <path d="M225.86,102.82c-3.77-3.94-5.7-9.62-5.7-16.82s1.93-12.88,5.7-16.82C232.47,61.39,232,52.85,227.74,44.74c-4.26-8.11-12.31-12.37-23.9-12.37-7.2,0-12.88-1.93-16.82-5.7C179.23,19.06,170.69,18.59,162.58,22.85c-8.11,4.26-12.37,12.31-12.37,23.9,0,7.2-1.93,12.88-5.7,16.82C136.72,71.18,136.25,79.72,140.51,87.83c4.26,8.11,12.31,12.37,23.9,12.37,7.2,0,12.88,1.93,16.82,5.7,7.79,7.61,16.33,8.08,24.44,3.82,8.11-4.26,12.37-12.31,12.37-23.9C218.04,115.94,219.97,110.26,225.86,102.82ZM176,152a76,76,0,1,1,76-76A76.08,76.08,0,0,1,176,152Z"></path>
                </svg>
              )}
            </div>
            <div className="flex items-center gap-3 mt-1">
              <div className="flex items-center gap-1">
                {renderStars(profile.rating.avg)}
                <span className="text-yellow-400 text-xs font-medium ml-1">
                  {formatRating(profile.rating.avg)}
                </span>
              </div>
              <span className="text-[#adadad] text-xs">
                {successRate}% success
              </span>
            </div>
          </div>

          {/* Action */}
          {onViewFullProfile && (
            <button
              onClick={onViewFullProfile}
              className="text-xs text-green-400 hover:text-green-300 transition-colors flex-shrink-0"
            >
              View Profile
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-[#2d2d2d] border border-[#363636] rounded-xl p-4">
      {/* Header */}
      <div className="flex items-start gap-4 mb-4">
        {/* Avatar */}
        <div className="w-16 h-16 rounded-full bg-[#363636] flex items-center justify-center overflow-hidden flex-shrink-0">
          {profile.avatarUrl ? (
            <img
              src={profile.avatarUrl}
              alt={profile.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-[#adadad] text-xl font-medium">
              {profile.name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        {/* Main Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-white font-bold text-lg truncate">{profile.name}</h3>
            {profile.verified && (
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="18" 
                height="18" 
                fill="currentColor" 
                viewBox="0 0 256 256"
                className="text-green-400 flex-shrink-0"
              >
                <path d="M225.86,102.82c-3.77-3.94-5.7-9.62-5.7-16.82s1.93-12.88,5.7-16.82C232.47,61.39,232,52.85,227.74,44.74c-4.26-8.11-12.31-12.37-23.9-12.37-7.2,0-12.88-1.93-16.82-5.7C179.23,19.06,170.69,18.59,162.58,22.85c-8.11,4.26-12.37,12.31-12.37,23.9,0,7.2-1.93,12.88-5.7,16.82C136.72,71.18,136.25,79.72,140.51,87.83c4.26,8.11,12.31,12.37,23.9,12.37,7.2,0,12.88,1.93,16.82,5.7,7.79,7.61,16.33,8.08,24.44,3.82,8.11-4.26,12.37-12.31,12.37-23.9C218.04,115.94,219.97,110.26,225.86,102.82ZM176,152a76,76,0,1,1,76-76A76.08,76.08,0,0,1,176,152Z"></path>
              </svg>
            )}
            {profile.isOnline && (
              <div className="w-3 h-3 bg-green-400 rounded-full flex-shrink-0"></div>
            )}
          </div>
          
          <p className="text-[#adadad] font-medium mb-1">{profile.company}</p>
          <p className="text-[#adadad] text-sm">
            {profile.location.city}, {profile.location.country} • {profile.location.postalCode}
          </p>
        </div>

        {/* Action Button */}
        {onViewFullProfile && (
          <button
            onClick={onViewFullProfile}
            className="px-3 py-1 bg-[#363636] hover:bg-[#4d4d4d] text-white text-sm rounded-lg transition-colors"
          >
            Full Profile
          </button>
        )}
      </div>

      {/* Rating & Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        {/* Rating */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            {renderStars(profile.rating.avg)}
            <span className="text-yellow-400 font-medium">
              {formatRating(profile.rating.avg)}
            </span>
          </div>
          <p className="text-[#adadad] text-xs">
            {profile.rating.count} reviews
          </p>
        </div>

        {/* Success Rate */}
        <div>
          <p className="text-white font-medium text-lg">{successRate}%</p>
          <p className="text-[#adadad] text-xs">Success rate</p>
        </div>

        {/* Completed Jobs */}
        <div>
          <p className="text-white font-medium text-lg">{profile.stats.completed}</p>
          <p className="text-[#adadad] text-xs">Completed jobs</p>
        </div>
      </div>

      {/* Quick Info */}
      <div className="space-y-2">
        {/* Contact */}
        <div className="flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 256 256" className="text-[#adadad]">
            <path d="M224,48H32a8,8,0,0,0-8,8V192a16,16,0,0,0,16,16H216a16,16,0,0,0,16-16V56A8,8,0,0,0,224,48ZM203.43,64,128,133.15,52.57,64ZM216,192H40V74.19l82.59,75.71a8,8,0,0,0,10.82,0L216,74.19V192Z"></path>
          </svg>
          <span className="text-[#adadad] text-sm">{profile.contact.email}</span>
        </div>

        {/* Phone */}
        <div className="flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 256 256" className="text-[#adadad]">
            <path d="M222.37,158.46l-47.11-21.11-.13-.06a16,16,0,0,0-15.17,1.4,8.12,8.12,0,0,0-.75.56L134.87,160c-15.42-7.49-31.34-23.29-38.83-38.51l20.78-24.71c.2-.25.39-.5.57-.77a16,16,0,0,0,1.32-15.06l0-.12L97.54,33.64a16,16,0,0,0-16.62-9.52A56.26,56.26,0,0,0,32,80c0,79.4,64.6,144,144,144a56.26,56.26,0,0,0,55.88-48.92A16,16,0,0,0,222.37,158.46Z"></path>
          </svg>
          <span className="text-[#adadad] text-sm">{profile.contact.phone}</span>
        </div>

        {/* Payment Terms */}
        <div className="flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 256 256" className="text-[#adadad]">
            <path d="M224,48H32A16,16,0,0,0,16,64V192a16,16,0,0,0,16,16H224a16,16,0,0,0,16-16V64A16,16,0,0,0,224,48Zm0,16V88H32V64Zm0,128H32V104H224v88Z"></path>
          </svg>
          <span className="text-[#adadad] text-sm">{profile.paymentTerms}</span>
        </div>
      </div>
    </div>
  )
}