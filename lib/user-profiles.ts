/**
 * User Profile System
 * Interface definitions and mock data for user profiles
 */

export interface UserProfile {
  id: string
  name: string
  verified: boolean
  avatarUrl?: string
  company: string
  location: { 
    city: string
    country: string
    postalCode: string 
  }
  rating: { 
    avg: number
    count: number
    breakdown: number[] // [5star, 4star, 3star, 2star, 1star]
  }
  contact: { 
    email: string
    phone: string
    website?: string 
  }
  paymentTerms: string
  documents: { 
    label: string
    url: string 
  }[]
  stats: {
    posted: number
    completed: number
    cancelRate: number
    avgMargin: number
    kmTraveled: number
  }
  fleet: { 
    type: string
    count: number 
  }[]
  preferredCargo: string[]
  operationZones: string[]
  bio: string
  certifications: string[]
  languages: string[]
  joinDate: string
  lastActive: string
  isOnline: boolean
}

// Mock user profiles data - matches the sender data from populate-cargo-with-senders.sql
export const mockUserProfiles: UserProfile[] = [
  {
    id: 'sender_001',
    name: 'Marco Rossi',
    verified: true,
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
    company: 'Logistica Italia SpA',
    location: {
      city: 'Milan',
      country: 'Italy',
      postalCode: '20121'
    },
    rating: {
      avg: 4.8,
      count: 47,
      breakdown: [32, 12, 2, 1, 0] // 5★: 32, 4★: 12, 3★: 2, 2★: 1, 1★: 0
    },
    contact: {
      email: 'marco.rossi@logitalia.com',
      phone: '+39 02 1234 5678',
      website: 'https://logitalia.com'
    },
    paymentTerms: '30 days, 20% advance',
    documents: [
      { label: 'Business License', url: '/docs/license-logitalia.pdf' },
      { label: 'Insurance Certificate', url: '/docs/insurance-logitalia.pdf' }
    ],
    stats: {
      posted: 156,
      completed: 142,
      cancelRate: 5,
      avgMargin: 14,
      kmTraveled: 89000
    },
    fleet: [
      { type: 'Truck', count: 8 },
      { type: 'Trailer', count: 12 },
      { type: 'Van', count: 4 }
    ],
    preferredCargo: ['General', 'Refrigerated', 'Automotive'],
    operationZones: ['Italy', 'Switzerland', 'Austria', 'Germany', 'France'],
    bio: 'Leading logistics provider in Northern Italy with 15+ years experience in European transport. Specialized in automotive and refrigerated cargo.',
    certifications: ['ISO 9001', 'ADR', 'HACCP', 'AEO'],
    languages: ['Italian', 'English', 'German'],
    joinDate: '2019-03-15',
    lastActive: '2 hours ago',
    isOnline: true
  },
  
  {
    id: 'sender_002',
    name: 'Emma van der Berg',
    verified: true,
    avatarUrl: 'https://images.unsplash.com/photo-1494790108755-2616b9e0b23e?w=100&h=100&fit=crop&crop=face',
    company: 'Holland Freight Solutions',
    location: {
      city: 'Amsterdam',
      country: 'Netherlands',
      postalCode: '1012 AB'
    },
    rating: {
      avg: 4.6,
      count: 34,
      breakdown: [22, 8, 3, 1, 0]
    },
    contact: {
      email: 'emma.vandeberg@hollandfreight.nl',
      phone: '+31 20 1234 567',
      website: 'https://hollandfreight.nl'
    },
    paymentTerms: '45 days, no advance',
    documents: [
      { label: 'KvK Registration', url: '/docs/kvk-holland.pdf' },
      { label: 'Transport License', url: '/docs/transport-holland.pdf' }
    ],
    stats: {
      posted: 89,
      completed: 81,
      cancelRate: 7,
      avgMargin: 12,
      kmTraveled: 45000
    },
    fleet: [
      { type: 'Truck', count: 5 },
      { type: 'Van', count: 8 }
    ],
    preferredCargo: ['General', 'Electronics', 'Fashion'],
    operationZones: ['Netherlands', 'Belgium', 'Germany', 'UK'],
    bio: 'Innovative freight solutions across Western Europe. Specialized in electronics and fashion retail distribution.',
    certifications: ['ISO 14001', 'TAPA FSR', 'GDP'],
    languages: ['Dutch', 'English', 'German'],
    joinDate: '2020-07-22',
    lastActive: '1 hour ago',
    isOnline: true
  },

  {
    id: 'sender_003',
    name: 'Klaus Müller',
    verified: true,
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
    company: 'Deutsche Transport GmbH',
    location: {
      city: 'Munich',
      country: 'Germany',
      postalCode: '80331'
    },
    rating: {
      avg: 4.9,
      count: 67,
      breakdown: [58, 7, 2, 0, 0]
    },
    contact: {
      email: 'klaus.mueller@deutschetransport.de',
      phone: '+49 89 1234 5678',
      website: 'https://deutschetransport.de'
    },
    paymentTerms: '30 days, 15% advance',
    documents: [
      { label: 'German Transport License', url: '/docs/license-deutsche.pdf' },
      { label: 'ADR Certificate', url: '/docs/adr-deutsche.pdf' }
    ],
    stats: {
      posted: 203,
      completed: 195,
      cancelRate: 3,
      avgMargin: 16,
      kmTraveled: 124000
    },
    fleet: [
      { type: 'Truck', count: 15 },
      { type: 'Trailer', count: 20 },
      { type: 'Tanker', count: 5 }
    ],
    preferredCargo: ['Dangerous', 'Chemical', 'Industrial'],
    operationZones: ['Germany', 'Austria', 'Czech Republic', 'Poland', 'Switzerland'],
    bio: 'Premium transport services with focus on dangerous goods and industrial chemicals. 25+ years market experience.',
    certifications: ['ISO 9001', 'ISO 14001', 'ADR', 'SQAS'],
    languages: ['German', 'English', 'Czech'],
    joinDate: '2018-01-10',
    lastActive: '30 minutes ago',
    isOnline: true
  },

  {
    id: 'sender_004',
    name: 'Sophie Dubois',
    verified: true,
    avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face',
    company: 'French Cargo Express',
    location: {
      city: 'Lyon',
      country: 'France',
      postalCode: '69001'
    },
    rating: {
      avg: 4.4,
      count: 28,
      breakdown: [18, 6, 3, 1, 0]
    },
    contact: {
      email: 'sophie.dubois@frenchcargo.fr',
      phone: '+33 4 1234 5678',
      website: 'https://frenchcargo.fr'
    },
    paymentTerms: '60 days, 25% advance',
    documents: [
      { label: 'French Transport License', url: '/docs/license-french.pdf' }
    ],
    stats: {
      posted: 72,
      completed: 65,
      cancelRate: 8,
      avgMargin: 11,
      kmTraveled: 38000
    },
    fleet: [
      { type: 'Van', count: 12 },
      { type: 'Truck', count: 6 }
    ],
    preferredCargo: ['Food & Beverage', 'Pharmaceuticals', 'Cosmetics'],
    operationZones: ['France', 'Spain', 'Italy', 'Belgium'],
    bio: 'Specialized in temperature-controlled transport for food, pharma and cosmetics across Southern Europe.',
    certifications: ['GDP', 'HACCP', 'BRC'],
    languages: ['French', 'English', 'Spanish'],
    joinDate: '2021-11-05',
    lastActive: '3 hours ago',
    isOnline: false
  }
]

// Helper function to get user profile by ID
export function getUserProfile(userId: string): UserProfile | undefined {
  return mockUserProfiles.find(profile => profile.id === userId)
}

// Helper function to get user profile by name (for backward compatibility)
export function getUserProfileByName(name: string): UserProfile | undefined {
  return mockUserProfiles.find(profile => profile.name === name)
}