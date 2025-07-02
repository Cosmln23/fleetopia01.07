import { User, UserChatMessage, SystemAlert, ChatConversation } from './types'

// Mock Users for communication
export const mockUsers: User[] = [
  {
    id: 'user_001',
    name: 'Current User',
    email: 'user@fleetopia.com',
    role: 'CARGO_OWNER',
    rating: 4.8,
    verified: true,
    avatar: '👤',
    isOnline: true,
    lastSeen: new Date().toISOString()
  },
  {
    id: 'trans_001',
    name: 'Alex Transport',
    email: 'alex@transport.com',
    role: 'TRANSPORTER',
    rating: 4.9,
    verified: true,
    avatar: '🚛',
    isOnline: true,
    lastSeen: new Date().toISOString()
  },
  {
    id: 'trans_002',
    name: 'Maria Logistics',
    email: 'maria@logistics.eu',
    role: 'TRANSPORTER',
    rating: 4.7,
    verified: true,
    avatar: '🚚',
    isOnline: false,
    lastSeen: '2024-07-07T10:30:00Z'
  },
  {
    id: 'trans_003',
    name: 'Stefan Heavy',
    email: 'stefan@heavy.de',
    role: 'TRANSPORTER',
    rating: 4.6,
    verified: true,
    avatar: '🚜',
    isOnline: true,
    lastSeen: new Date().toISOString()
  }
]

// Mock Chat Messages
export const mockChatMessages: UserChatMessage[] = [
  {
    id: 'msg_001',
    content: 'Hello! I\'m interested in your electronics transport offer. Can we discuss the details?',
    createdAt: '2024-07-07T09:30:00Z',
    read: true,
    sender: mockUsers[1], // Alex Transport
    receiver: mockUsers[0], // Current User
    cargoOffer: undefined // Will be linked to actual cargo
  },
  {
    id: 'msg_002',
    content: 'Hi Alex! Yes, absolutely. What specific questions do you have about the shipment?',
    createdAt: '2024-07-07T09:32:00Z',
    read: true,
    sender: mockUsers[0], // Current User
    receiver: mockUsers[1], // Alex Transport
  },
  {
    id: 'msg_003',
    content: 'I have a specialized truck with temperature control and GPS tracking. Can deliver within your timeline.',
    createdAt: '2024-07-07T09:35:00Z',
    read: false,
    sender: mockUsers[1], // Alex Transport
    receiver: mockUsers[0], // Current User
  },
  {
    id: 'msg_004',
    content: 'Are you available for the heavy machinery transport? I have 20+ years experience.',
    createdAt: '2024-07-07T11:15:00Z',
    read: false,
    sender: mockUsers[3], // Stefan Heavy
    receiver: mockUsers[0], // Current User
  },
  {
    id: 'msg_005',
    content: 'Perfect! That sounds exactly what we need. What\'s your proposed price?',
    createdAt: '2024-07-07T14:20:00Z',
    read: false,
    sender: mockUsers[0], // Current User
    receiver: mockUsers[2], // Maria Logistics
  }
]

// Mock System Notifications
export const mockSystemAlerts: SystemAlert[] = [
  {
    id: 'alert_001',
    message: 'New offer received for "Electronics Transport - Urgent Delivery"',
    type: 'SUCCESS',
    read: false,
    createdAt: '2024-07-07T14:30:00Z',
    relatedId: '123456',
    details: 'Alex Transport submitted an offer of €850',
    action: {
      label: 'View Offer',
      url: '/marketplace/123456'
    }
  },
  {
    id: 'alert_002',
    message: 'Cargo status updated to "IN_PROGRESS"',
    type: 'INFO',
    read: false,
    createdAt: '2024-07-07T13:45:00Z',
    relatedId: '345678',
    details: 'Fresh Produce shipment is now in transit',
    action: {
      label: 'Track Shipment',
      url: '/marketplace/345678'
    }
  },
  {
    id: 'alert_003',
    message: 'Payment completed successfully',
    type: 'SUCCESS',
    read: true,
    createdAt: '2024-07-07T12:20:00Z',
    relatedId: '567890',
    details: 'Payment of €4,500 for machinery transport'
  },
  {
    id: 'alert_004',
    message: 'Urgent: Delivery deadline approaching',
    type: 'WARNING',
    read: false,
    createdAt: '2024-07-07T11:00:00Z',
    relatedId: '345678',
    details: 'Fresh Produce delivery due in 6 hours',
    action: {
      label: 'Contact Driver',
      url: '/fleet/track'
    }
  },
  {
    id: 'alert_005',
    message: 'New message from Maria Logistics',
    type: 'INFO',
    read: true,
    createdAt: '2024-07-07T10:15:00Z',
    relatedId: 'trans_002',
    details: 'Regarding pharmaceutical supplies transport'
  }
]

// Mock Chat Conversations (grouped messages)
export const mockChatConversations: ChatConversation[] = [
  {
    id: 'conv_001',
    participants: [mockUsers[0], mockUsers[1]], // Current User + Alex Transport
    lastMessage: mockChatMessages[2], // Latest unread message
    unreadCount: 1,
    updatedAt: '2024-07-07T09:35:00Z'
  },
  {
    id: 'conv_002',
    participants: [mockUsers[0], mockUsers[3]], // Current User + Stefan Heavy
    lastMessage: mockChatMessages[3],
    unreadCount: 1,
    updatedAt: '2024-07-07T11:15:00Z'
  },
  {
    id: 'conv_003',
    participants: [mockUsers[0], mockUsers[2]], // Current User + Maria Logistics
    lastMessage: mockChatMessages[4],
    unreadCount: 0, // User sent last message
    updatedAt: '2024-07-07T14:20:00Z'
  }
]

// Helper functions
export function getUnreadMessagesCount(): number {
  return mockChatMessages.filter(msg => !msg.read && msg.receiver.id === 'user_001').length
}

export function getUnreadNotificationsCount(): number {
  return mockSystemAlerts.filter(alert => !alert.read).length
}

export function getConversationById(id: string): ChatConversation | undefined {
  return mockChatConversations.find(conv => conv.id === id)
}

export function getMessagesByConversation(conversationId: string): UserChatMessage[] {
  const conversation = getConversationById(conversationId)
  if (!conversation) return []
  
  const participantIds = conversation.participants.map(p => p.id)
  return mockChatMessages.filter(msg => 
    participantIds.includes(msg.sender.id) && participantIds.includes(msg.receiver.id)
  ).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
}

export function getAlertTypeColor(type: SystemAlert['type']): string {
  switch (type) {
    case 'SUCCESS':
      return 'text-green-400'
    case 'WARNING':
      return 'text-yellow-400'
    case 'ERROR':
      return 'text-red-400'
    case 'INFO':
    default:
      return 'text-blue-400'
  }
}

export function getAlertTypeIcon(type: SystemAlert['type']): string {
  switch (type) {
    case 'SUCCESS':
      return '✅'
    case 'WARNING':
      return '⚠️'
    case 'ERROR':
      return '❌'
    case 'INFO':
    default:
      return 'ℹ️'
  }
} 