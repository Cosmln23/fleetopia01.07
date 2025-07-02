import { useUser } from '@clerk/nextjs'

export function useUserRole() {
  const { user, isLoaded } = useUser()
  
  return {
    isLoaded,
    userId: user?.id,
    role: user?.publicMetadata.role as 'provider' | 'carrier' | undefined,
    user
  }
}