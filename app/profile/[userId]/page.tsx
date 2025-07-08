'use client'

import { useParams, useRouter } from 'next/navigation'
import { getUserProfile } from '@/lib/user-profiles'
import UserProfilePage from '@/components/UserProfile/UserProfilePage'

export default function ProfilePage() {
  const params = useParams()
  const router = useRouter()
  const userId = params.userId as string

  const profile = getUserProfile(userId)

  if (!profile) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-white text-2xl font-bold mb-4">Profile Not Found</h1>
          <p className="text-[#adadad] mb-6">The user profile you're looking for doesn't exist.</p>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  return (
    <UserProfilePage 
      profile={profile} 
      onClose={() => router.back()}
    />
  )
}