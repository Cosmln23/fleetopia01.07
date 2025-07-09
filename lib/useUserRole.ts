import { useUser } from '@clerk/nextjs'

export function useUserRole() {
  const { user, isLoaded } = useUser()
  
  // Extract metadata
  const metadata = user?.publicMetadata || {}
  const createdAt = metadata.createdAt as number
  const profileCompleted = metadata.profileCompleted as boolean
  const trialStarted = metadata.trialStarted as boolean
  
  // Calculate trial status
  const now = Date.now()
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000
  const trialTimeElapsed = createdAt ? now - createdAt : 0
  const trialExpired = trialTimeElapsed > sevenDaysMs
  const daysLeft = createdAt ? Math.max(0, Math.ceil((sevenDaysMs - trialTimeElapsed) / (24 * 60 * 60 * 1000))) : 0
  
  // Verification status logic
  const verificationStatus = metadata.verification_status as 'unverified' | 'pending' | 'verified' || 'unverified'
  const isVerified = verificationStatus === 'verified'
  const isPending = verificationStatus === 'pending'
  const canAccessAgent = isVerified || (!trialExpired && trialStarted)
  const canSendQuotes = isVerified || (!trialExpired && trialStarted)
  
  return {
    isLoaded,
    userId: user?.id,
    role: metadata.role as 'provider' | 'carrier' | undefined,
    user,
    // Trial status
    profileCompleted,
    trialStarted,
    trialExpired,
    daysLeft,
    needsOnboarding: trialExpired && !profileCompleted,
    // Verification status
    verificationStatus,
    isVerified,
    isPending,
    canAccessAgent,
    canSendQuotes,
    // Additional metadata
    company: metadata.company as string,
    completedAt: metadata.completedAt as number,
    createdAt
  }
}