import { User, UserChatMessage, SystemAlert, ChatConversation } from './types'

// Real API calls for communication data
export const getUnreadMessagesCount = async (): Promise<number> => {
  try {
    const response = await fetch('/api/messages/unread-count')
    if (!response.ok) {
      // Fallback to 0 if API endpoint doesn't exist yet
      if (response.status === 404) {
        return 0
      }
      return 0
    }
    const data = await response.json()
    return data.count || 0
  } catch (error) {
    // Fallback for any network or API errors
    if (error instanceof Error) {
      console.warn('Messages API not available, using fallback:', error.message)
    } else {
      console.warn('Messages API not available, using fallback with unknown error.')
    }
    return 0
  }
}

export const getUnreadNotificationsCount = async (): Promise<number> => {
  try {
    const response = await fetch('/api/notifications/unread-count')
    if (!response.ok) {
      // Fallback to 0 if API endpoint doesn't exist yet
      if (response.status === 404) {
        return 0
      }
      return 0
    }
    const data = await response.json()
    return data.count || 0
  } catch (error) {
    // Fallback for any network or API errors
    if (error instanceof Error) {
      console.warn('Notifications API not available, using fallback:', error.message)
    } else {
      console.warn('Notifications API not available, using fallback with unknown error.')
    }
    return 0
  }
}

export const getMessagesByConversation = async (conversationId: string): Promise<UserChatMessage[]> => {
  try {
    const response = await fetch(`/api/messages/conversation/${conversationId}`)
    if (!response.ok) return []
    const data = await response.json()
    return data.messages || []
  } catch (error) {
    console.error('Error fetching messages by conversation:', error)
    return []
  }
}

export const getChatConversations = async (): Promise<ChatConversation[]> => {
  try {
    const response = await fetch('/api/messages/conversations')
    if (!response.ok) return []
    const data = await response.json()
    return data.conversations || []
  } catch (error) {
    console.error('Error fetching chat conversations:', error)
    return []
  }
}

export const getSystemAlerts = async (): Promise<SystemAlert[]> => {
  try {
    const response = await fetch('/api/notifications/alerts')
    if (!response.ok) return []
    const data = await response.json()
    return data.alerts || []
  } catch (error) {
    console.error('Error fetching system alerts:', error)
    return []
  }
}

export const sendChatMessage = async (conversationId: string, message: string): Promise<UserChatMessage | null> => {
  try {
    const response = await fetch('/api/messages/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        conversationId,
        message
      })
    })
    if (!response.ok) return null
    const data = await response.json()
    return data.message || null
  } catch (error) {
    console.error('Error sending chat message:', error)
    return null
  }
}

export const markMessagesAsRead = async (conversationId: string): Promise<boolean> => {
  try {
    const response = await fetch(`/api/messages/mark-read/${conversationId}`, {
      method: 'POST'
    })
    return response.ok
  } catch (error) {
    console.error('Error marking messages as read:', error)
    return false
  }
}

export const markNotificationAsRead = async (notificationId: string): Promise<boolean> => {
  try {
    const response = await fetch(`/api/notifications/mark-read/${notificationId}`, {
      method: 'POST'
    })
    return response.ok
  } catch (error) {
    console.error('Error marking notification as read:', error)
    return false
  }
}

// Synchronous fallback functions for backward compatibility
export const getUnreadNotificationsCountSync = (): number => {
  // Fallback to 0 for synchronous calls
  return 0
}

export const getUnreadMessagesCountSync = (): number => {
  // Fallback to 0 for synchronous calls
  return 0
}

// Deprecated - keeping for backward compatibility
export const mockUsers: User[] = []
export const mockChatConversations: ChatConversation[] = []
export const mockChatMessages: UserChatMessage[] = []
export const mockSystemAlerts: SystemAlert[] = []

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