// Cargo Status Workflow: NEW → OPEN → TAKEN → IN_PROGRESS → COMPLETED
export enum CargoStatus {
  NEW = 'NEW',
  OPEN = 'OPEN', 
  TAKEN = 'TAKEN',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED'
}

export enum CargoType {
  GENERAL = 'General',
  REFRIGERATED = 'Refrigerated',
  FRAGILE = 'Fragile',
  DANGEROUS = 'Dangerous',
  OVERSIZED = 'Oversized'
}

export enum UrgencyLevel {
  LOW = 'Low',
  MEDIUM = 'Medium', 
  HIGH = 'High',
  URGENT = 'Urgent'
}

export interface CargoOffer {
  id: string
  title: string
  weight: number // kg
  volume?: number // m³
  price: number // EUR
  pricePerKg: number // EUR/kg
  urgency: UrgencyLevel
  cargoType: CargoType
  
  // Locations
  fromAddress: string
  toAddress: string
  fromCountry: string
  toCountry: string
  fromPostal?: string
  fromCity?: string
  toPostal?: string
  toCity?: string
  pickupLat?: number
  pickupLng?: number
  deliveryLat?: number
  deliveryLng?: number
  
  // Dates
  loadingDate: string
  deliveryDate: string
  postingDate: string
  
  // Provider info
  provider: string
  providerStatus: string
  
  // Status and metadata
  status: CargoStatus
  createdAt: string
  updatedAt: string
  
  // Relations (for future implementation)
  chatMessages?: ChatMessage[]
  offerRequests?: OfferRequest[]
}

export interface ChatMessage {
  id: string
  cargoOfferId: string
  senderId: string
  content: string
  createdAt: string
  read: boolean
}

export interface OfferRequest {
  id: string
  cargoOfferId: string
  transporterId: string
  proposedPrice: number
  message?: string
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED'
  createdAt: string
}

export interface User {
  id: string
  name: string
  email: string
  role: 'CARGO_OWNER' | 'TRANSPORTER'
  rating?: number
  verified: boolean
  avatar?: string
  lastSeen?: string
  isOnline?: boolean
}

// User-to-User Chat System (different from ChatMessage for AI)
export interface UserChatMessage {
  id: string
  content: string
  createdAt: string
  read: boolean
  sender: User
  receiver: User
  cargoOffer?: CargoOffer
  attachments?: string[]
}

// System Notifications & Alerts
export interface SystemAlert {
  id: string
  message: string
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR'
  read: boolean
  createdAt: string
  relatedId?: string // Can be cargoId, offerId, etc.
  details?: string
  action?: {
    label: string
    url: string
  }
}

// Chat Conversation for grouping messages
export interface ChatConversation {
  id: string
  participants: User[]
  cargoOffer?: CargoOffer
  lastMessage?: UserChatMessage
  unreadCount: number
  updatedAt: string
}