/**
 * In-App Chat System
 * Mock implementation for messaging between users
 */

export interface ChatMessage {
  id: string
  senderId: string
  senderName: string
  senderAvatar?: string
  receiverId: string
  content: string
  timestamp: string
  read: boolean
  type: 'text' | 'system'
}

export interface ChatConversation {
  id: string
  participants: {
    id: string
    name: string
    avatar?: string
    isOnline: boolean
  }[]
  lastMessage?: ChatMessage
  unreadCount: number
  updatedAt: string
}

// Mock current user (dispatcher)
export const mockCurrentUser = {
  id: 'dispatcher_001',
  name: 'Transport Manager',
  avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
  isOnline: true
}

// Mock chat conversations
export const mockConversations: ChatConversation[] = [
  {
    id: 'conv_001',
    participants: [
      mockCurrentUser,
      {
        id: 'sender_001',
        name: 'Marco Rossi',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
        isOnline: true
      }
    ],
    lastMessage: {
      id: 'msg_001',
      senderId: 'sender_001',
      senderName: 'Marco Rossi',
      receiverId: 'dispatcher_001',
      content: 'Hi, I have a new cargo offer for Milan-Munich route. Are you interested?',
      timestamp: '2025-01-08T10:30:00Z',
      read: false,
      type: 'text'
    },
    unreadCount: 1,
    updatedAt: '2025-01-08T10:30:00Z'
  }
]

// Mock messages for conversations
export const mockMessages: Record<string, ChatMessage[]> = {
  'conv_001': [
    {
      id: 'msg_001',
      senderId: 'sender_001',
      senderName: 'Marco Rossi',
      receiverId: 'dispatcher_001',
      content: 'Hi, I have a new cargo offer for Milan-Munich route. Are you interested?',
      timestamp: '2025-01-08T10:30:00Z',
      read: false,
      type: 'text'
    }
  ]
}

// Helper functions
export function getConversationById(conversationId: string): ChatConversation | undefined {
  return mockConversations.find(conv => conv.id === conversationId)
}

export function getMessagesForConversation(conversationId: string): ChatMessage[] {
  return mockMessages[conversationId] || []
}

export function createConversation(participantId: string, participantName: string, participantAvatar?: string): ChatConversation {
  const conversationId = `conv_${Date.now()}`
  
  const newConversation: ChatConversation = {
    id: conversationId,
    participants: [
      mockCurrentUser,
      {
        id: participantId,
        name: participantName,
        avatar: participantAvatar,
        isOnline: true
      }
    ],
    unreadCount: 0,
    updatedAt: new Date().toISOString()
  }
  
  mockConversations.push(newConversation)
  mockMessages[conversationId] = []
  
  return newConversation
}

export function sendMessage(conversationId: string, content: string): ChatMessage {
  const message: ChatMessage = {
    id: `msg_${Date.now()}`,
    senderId: mockCurrentUser.id,
    senderName: mockCurrentUser.name,
    senderAvatar: mockCurrentUser.avatar,
    receiverId: '', // Will be set based on conversation
    content,
    timestamp: new Date().toISOString(),
    read: false,
    type: 'text'
  }
  
  if (!mockMessages[conversationId]) {
    mockMessages[conversationId] = []
  }
  
  mockMessages[conversationId].push(message)
  
  // Update conversation
  const conversation = getConversationById(conversationId)
  if (conversation) {
    conversation.lastMessage = message
    conversation.updatedAt = message.timestamp
  }
  
  return message
}

export function formatMessageTime(timestamp: string): string {
  const date = new Date(timestamp)
  const now = new Date()
  const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)
  
  if (diffInHours < 1) {
    return 'Just now'
  } else if (diffInHours < 24) {
    return `${Math.floor(diffInHours)}h ago`
  } else {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }
}