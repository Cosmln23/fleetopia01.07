import { User, UserChatMessage, SystemAlert, ChatConversation } from './types'

// TODO: Replace with real API calls for communication data

// Empty arrays until API integration
export const mockUsers: User[] = []
export const mockChatConversations: ChatConversation[] = []
export const mockChatMessages: UserChatMessage[] = []
export const mockSystemAlerts: SystemAlert[] = []

// Helper functions with fallback values
export const getUnreadMessagesCount = (): number => 0
export const getUnreadNotificationsCount = (): number => 0

export const getMessagesByConversation = (conversationId: string): UserChatMessage[] => []

export const getAlertTypeColor = (type: string): string => {
  switch (type) {
    case 'info': return '#0099ff'
    case 'warning': return '#ffaa00'
    case 'error': return '#ff6666'
    case 'success': return '#0bda0b'
    default: return '#adadad'
  }
}

export const getAlertTypeIcon = (type: string): string => {
  switch (type) {
    case 'info': return 'ℹ️'
    case 'warning': return '⚠️'
    case 'error': return '❌'
    case 'success': return '✅'
    default: return '📢'
  }
}