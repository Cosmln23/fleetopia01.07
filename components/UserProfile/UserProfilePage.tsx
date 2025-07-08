'use client'

import { useState } from 'react'
import { UserProfile } from '@/lib/user-profiles'
import { createConversation } from '@/lib/chat-system'
import RatingDisplay from './RatingDisplay'
import ChatModal from '../Chat/ChatModal'
import RequestQuoteModal from '../Chat/RequestQuoteModal'

interface UserProfilePageProps {
  profile: UserProfile
  onClose?: () => void
}

export default function UserProfilePage({ profile, onClose }: UserProfilePageProps) {
  const [showChatModal, setShowChatModal] = useState(false)
  const [showQuoteModal, setShowQuoteModal] = useState(false)
  const [chatConversation, setChatConversation] = useState<any>(null)
  const [isFavorited, setIsFavorited] = useState(false)

  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })
    } catch {
      return dateString
    }
  }

  const successRate = Math.round((profile.stats.completed / profile.stats.posted) * 100)

  const handleSendMessage = () => {
    const conversation = createConversation(profile.id, profile.name, profile.avatarUrl)
    setChatConversation(conversation)
    setShowChatModal(true)
  }

  const handleRequestQuote = () => {
    setShowQuoteModal(true)
  }

  const handleToggleFavorite = () => {
    setIsFavorited(!isFavorited)
    // In real app, this would save to backend or localStorage
    const favorites = JSON.parse(localStorage.getItem('favoriteProfiles') || '[]')
    if (!isFavorited) {
      favorites.push(profile.id)
      localStorage.setItem('favoriteProfiles', JSON.stringify(favorites))
    } else {
      const updated = favorites.filter((id: string) => id !== profile.id)
      localStorage.setItem('favoriteProfiles', JSON.stringify(updated))
    }
  }

  return (
    <div className="min-h-screen bg-[#1a1a1a]">
      {/* Header */}
      <div className="bg-[#2d2d2d] border-b border-[#363636] px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <h1 className="text-white text-2xl font-bold">User Profile</h1>
          {onClose && (
            <button
              onClick={onClose}
              className="text-[#adadad] hover:text-white transition-colors p-2 hover:bg-[#363636] rounded-lg"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Profile Header */}
        <div className="bg-[#2d2d2d] border border-[#363636] rounded-xl p-6">
          <div className="flex items-start gap-6">
            {/* Avatar */}
            <div className="w-24 h-24 rounded-full bg-[#363636] flex items-center justify-center overflow-hidden flex-shrink-0">
              {profile.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt={profile.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-[#adadad] text-3xl font-medium">
                  {profile.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            {/* Main Info */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-white text-3xl font-bold">{profile.name}</h2>
                {profile.verified && (
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    width="24" 
                    height="24" 
                    fill="currentColor" 
                    viewBox="0 0 256 256"
                    className="text-green-400"
                  >
                    <path d="M225.86,102.82c-3.77-3.94-5.7-9.62-5.7-16.82s1.93-12.88,5.7-16.82C232.47,61.39,232,52.85,227.74,44.74c-4.26-8.11-12.31-12.37-23.9-12.37-7.2,0-12.88-1.93-16.82-5.7C179.23,19.06,170.69,18.59,162.58,22.85c-8.11,4.26-12.37,12.31-12.37,23.9,0,7.2-1.93,12.88-5.7,16.82C136.72,71.18,136.25,79.72,140.51,87.83c4.26,8.11,12.31,12.37,23.9,12.37,7.2,0,12.88,1.93,16.82,5.7,7.79,7.61,16.33,8.08,24.44,3.82,8.11-4.26,12.37-12.31,12.37-23.9C218.04,115.94,219.97,110.26,225.86,102.82ZM176,152a76,76,0,1,1,76-76A76.08,76.08,0,0,1,176,152Z"></path>
                  </svg>
                )}
                {profile.isOnline && (
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                    <span className="text-green-400 text-sm">Online</span>
                  </div>
                )}
              </div>
              
              <p className="text-[#adadad] text-xl font-medium mb-2">{profile.company}</p>
              <p className="text-[#adadad] mb-3">
                {profile.location.city}, {profile.location.country} • {profile.location.postalCode}
              </p>
              
              <div className="flex items-center gap-4 text-sm text-[#adadad]">
                <span>Joined {formatDate(profile.joinDate)}</span>
                <span>•</span>
                <span>Last active {profile.lastActive}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-2">
              <button 
                onClick={handleSendMessage}
                className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors font-medium"
              >
                Send Message
              </button>
              <button 
                onClick={handleRequestQuote}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors font-medium"
              >
                Request Quote
              </button>
              <button 
                onClick={handleToggleFavorite}
                className={`px-4 py-2 rounded-lg transition-colors font-medium ${
                  isFavorited 
                    ? 'bg-yellow-500 hover:bg-yellow-600 text-white' 
                    : 'bg-[#363636] hover:bg-[#4d4d4d] text-white'
                }`}
              >
                {isFavorited ? 'Saved ★' : 'Save Favorite'}
              </button>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* About */}
            <div className="bg-[#2d2d2d] border border-[#363636] rounded-xl p-6">
              <h3 className="text-white text-lg font-bold mb-4">About</h3>
              <p className="text-[#adadad] leading-relaxed">{profile.bio}</p>
            </div>

            {/* Performance Stats */}
            <div className="bg-[#2d2d2d] border border-[#363636] rounded-xl p-6">
              <h3 className="text-white text-lg font-bold mb-4">Performance & Activity</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-white text-2xl font-bold">{profile.stats.posted}</div>
                  <div className="text-[#adadad] text-sm">Offers Posted</div>
                </div>
                <div className="text-center">
                  <div className="text-white text-2xl font-bold">{profile.stats.completed}</div>
                  <div className="text-[#adadad] text-sm">Completed</div>
                </div>
                <div className="text-center">
                  <div className="text-green-400 text-2xl font-bold">{successRate}%</div>
                  <div className="text-[#adadad] text-sm">Success Rate</div>
                </div>
                <div className="text-center">
                  <div className="text-white text-2xl font-bold">{profile.stats.cancelRate}%</div>
                  <div className="text-[#adadad] text-sm">Cancel Rate</div>
                </div>
                <div className="text-center">
                  <div className="text-white text-2xl font-bold">{profile.stats.avgMargin}%</div>
                  <div className="text-[#adadad] text-sm">Avg Margin</div>
                </div>
                <div className="text-center">
                  <div className="text-white text-2xl font-bold">{(profile.stats.kmTraveled / 1000).toFixed(0)}k</div>
                  <div className="text-[#adadad] text-sm">Km Traveled</div>
                </div>
              </div>
            </div>

            {/* Fleet & Capabilities */}
            <div className="bg-[#2d2d2d] border border-[#363636] rounded-xl p-6">
              <h3 className="text-white text-lg font-bold mb-4">Fleet & Capabilities</h3>
              <div className="space-y-4">
                {/* Fleet */}
                <div>
                  <h4 className="text-white font-medium mb-2">Vehicles</h4>
                  <div className="flex flex-wrap gap-2">
                    {profile.fleet.map((vehicle, index) => (
                      <span 
                        key={index}
                        className="px-3 py-1 bg-[#363636] text-[#adadad] rounded-full text-sm"
                      >
                        {vehicle.type} x{vehicle.count}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Preferred Cargo */}
                <div>
                  <h4 className="text-white font-medium mb-2">Preferred Cargo</h4>
                  <div className="flex flex-wrap gap-2">
                    {profile.preferredCargo.map((cargo, index) => (
                      <span 
                        key={index}
                        className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm border border-blue-500/30"
                      >
                        {cargo}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Operation Zones */}
                <div>
                  <h4 className="text-white font-medium mb-2">Operation Zones</h4>
                  <div className="flex flex-wrap gap-2">
                    {profile.operationZones.map((zone, index) => (
                      <span 
                        key={index}
                        className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm border border-green-500/30"
                      >
                        {zone}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Rating & Reviews */}
            <div className="bg-[#2d2d2d] border border-[#363636] rounded-xl p-6">
              <h3 className="text-white text-lg font-bold mb-4">Rating & Reviews</h3>
              <RatingDisplay rating={profile.rating} showBreakdown={true} />
            </div>

            {/* Contact Information */}
            <div className="bg-[#2d2d2d] border border-[#363636] rounded-xl p-6">
              <h3 className="text-white text-lg font-bold mb-4">Contact Information</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 256 256" className="text-[#adadad]">
                    <path d="M224,48H32a8,8,0,0,0-8,8V192a16,16,0,0,0,16,16H216a16,16,0,0,0,16-16V56A8,8,0,0,0,224,48ZM203.43,64,128,133.15,52.57,64ZM216,192H40V74.19l82.59,75.71a8,8,0,0,0,10.82,0L216,74.19V192Z"></path>
                  </svg>
                  <span className="text-[#adadad]">{profile.contact.email}</span>
                </div>
                
                <div className="flex items-center gap-3">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 256 256" className="text-[#adadad]">
                    <path d="M222.37,158.46l-47.11-21.11-.13-.06a16,16,0,0,0-15.17,1.4,8.12,8.12,0,0,0-.75.56L134.87,160c-15.42-7.49-31.34-23.29-38.83-38.51l20.78-24.71c.2-.25.39-.5.57-.77a16,16,0,0,0,1.32-15.06l0-.12L97.54,33.64a16,16,0,0,0-16.62-9.52A56.26,56.26,0,0,0,32,80c0,79.4,64.6,144,144,144a56.26,56.26,0,0,0,55.88-48.92A16,16,0,0,0,222.37,158.46Z"></path>
                  </svg>
                  <span className="text-[#adadad]">{profile.contact.phone}</span>
                </div>

                {profile.contact.website && (
                  <div className="flex items-center gap-3">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 256 256" className="text-[#adadad]">
                      <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24ZM101.63,168h52.74C149,186.34,140,202.87,128,215.89,116,202.87,107,186.34,101.63,168ZM98,152a145.72,145.72,0,0,1,0-48h60a145.72,145.72,0,0,1,0,48ZM40,128a87.61,87.61,0,0,1,3.33-24H81.79a161.79,161.79,0,0,0,0,48H43.33A87.61,87.61,0,0,1,40,128Zm114.37-64H101.63C107,46.34,116,29.87,128,16.11,140,29.87,149,46.34,154.37,64Zm19.84,16h38.46a88.15,88.15,0,0,1,0,48H174.21a161.79,161.79,0,0,0,0-48Zm32.16-16H170.94a142.39,142.39,0,0,0-20.26-45A88.37,88.37,0,0,1,206.37,64ZM105.32,19A142.39,142.39,0,0,0,85.06,64H49.63A88.37,88.37,0,0,1,105.32,19ZM49.63,192H85.06a142.39,142.39,0,0,0,20.26,45A88.37,88.37,0,0,1,49.63,192Zm101.05,45a142.39,142.39,0,0,0,20.26-45h35.43A88.37,88.37,0,0,1,150.68,237Z"></path>
                    </svg>
                    <a 
                      href={profile.contact.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-green-400 hover:text-green-300 transition-colors"
                    >
                      Website
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Business Terms */}
            <div className="bg-[#2d2d2d] border border-[#363636] rounded-xl p-6">
              <h3 className="text-white text-lg font-bold mb-4">Business Terms</h3>
              <div className="space-y-3">
                <div>
                  <div className="text-[#adadad] text-sm">Payment Terms</div>
                  <div className="text-white font-medium">{profile.paymentTerms}</div>
                </div>
              </div>
            </div>

            {/* Certifications */}
            <div className="bg-[#2d2d2d] border border-[#363636] rounded-xl p-6">
              <h3 className="text-white text-lg font-bold mb-4">Certifications</h3>
              <div className="space-y-2">
                {profile.certifications.map((cert, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 256 256" className="text-green-400">
                      <path d="M225.86,102.82c-3.77-3.94-5.7-9.62-5.7-16.82s1.93-12.88,5.7-16.82C232.47,61.39,232,52.85,227.74,44.74c-4.26-8.11-12.31-12.37-23.9-12.37-7.2,0-12.88-1.93-16.82-5.7C179.23,19.06,170.69,18.59,162.58,22.85c-8.11,4.26-12.37,12.31-12.37,23.9,0,7.2-1.93,12.88-5.7,16.82C136.72,71.18,136.25,79.72,140.51,87.83c4.26,8.11,12.31,12.37,23.9,12.37,7.2,0,12.88,1.93,16.82,5.7,7.79,7.61,16.33,8.08,24.44,3.82,8.11-4.26,12.37-12.31,12.37-23.9C218.04,115.94,219.97,110.26,225.86,102.82ZM176,152a76,76,0,1,1,76-76A76.08,76.08,0,0,1,176,152Z"></path>
                    </svg>
                    <span className="text-[#adadad] text-sm">{cert}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Languages */}
            <div className="bg-[#2d2d2d] border border-[#363636] rounded-xl p-6">
              <h3 className="text-white text-lg font-bold mb-4">Languages</h3>
              <div className="flex flex-wrap gap-2">
                {profile.languages.map((lang, index) => (
                  <span 
                    key={index}
                    className="px-3 py-1 bg-[#363636] text-[#adadad] rounded-full text-sm"
                  >
                    {lang}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showChatModal && chatConversation && (
        <ChatModal
          conversation={chatConversation}
          onClose={() => setShowChatModal(false)}
        />
      )}

      {showQuoteModal && (
        <RequestQuoteModal
          profile={profile}
          onClose={() => setShowQuoteModal(false)}
        />
      )}
    </div>
  )
}