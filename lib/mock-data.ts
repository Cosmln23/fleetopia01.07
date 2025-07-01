import { CargoOffer, CargoStatus, CargoType, UrgencyLevel, OfferRequest } from './types'

export const mockCargoOffers: CargoOffer[] = [
  {
    id: '123456',
    title: 'Electronics Transport - Urgent Delivery',
    weight: 566,
    volume: 2.5,
    price: 900,
    pricePerKg: 1.59,
    urgency: UrgencyLevel.HIGH,
    cargoType: CargoType.GENERAL,
    
    fromAddress: 'The Hague, Netherlands, 2595 AA',
    toAddress: 'Carei, Romania, 445100',
    fromCountry: 'Netherlands',
    toCountry: 'Romania',
    pickupLat: 52.0705,
    pickupLng: 4.3007,
    deliveryLat: 47.6912,
    deliveryLng: 22.4569,
    
    loadingDate: 'July 2, 2025',
    deliveryDate: 'July 4, 2025',
    postingDate: 'June 20, 2024',
    
    provider: 'Martinos',
    providerStatus: 'New, Verified',
    
    status: CargoStatus.OPEN,
    createdAt: '2024-06-20T10:00:00Z',
    updatedAt: '2024-06-20T10:00:00Z'
  },
  {
    id: '789012',
    title: 'Automotive Parts - Standard Shipping',
    weight: 1250,
    volume: 8.0,
    price: 1800,
    pricePerKg: 1.44,
    urgency: UrgencyLevel.MEDIUM,
    cargoType: CargoType.GENERAL,
    
    fromAddress: 'Munich, Germany, 80331',
    toAddress: 'Bucharest, Romania, 010011',
    fromCountry: 'Germany',
    toCountry: 'Romania',
    pickupLat: 48.1351,
    pickupLng: 11.5820,
    deliveryLat: 44.4268,
    deliveryLng: 26.1025,
    
    loadingDate: 'July 5, 2025',
    deliveryDate: 'July 8, 2025',
    postingDate: 'June 25, 2024',
    
    provider: 'AutoLogistics GmbH',
    providerStatus: 'Experienced, Premium',
    
    status: CargoStatus.NEW,
    createdAt: '2024-06-25T14:30:00Z',
    updatedAt: '2024-06-25T14:30:00Z'
  },
  {
    id: '345678',
    title: 'Fresh Produce - Temperature Controlled',
    weight: 800,
    volume: 12.0,
    price: 2200,
    pricePerKg: 2.75,
    urgency: UrgencyLevel.URGENT,
    cargoType: CargoType.REFRIGERATED,
    
    fromAddress: 'Rotterdam, Netherlands, 3011 AD',
    toAddress: 'Milan, Italy, 20121',
    fromCountry: 'Netherlands',
    toCountry: 'Italy',
    pickupLat: 51.9244,
    pickupLng: 4.4777,
    deliveryLat: 45.4642,
    deliveryLng: 9.1900,
    
    loadingDate: 'July 1, 2025',
    deliveryDate: 'July 2, 2025',
    postingDate: 'June 28, 2024',
    
    provider: 'FreshFlow Logistics',
    providerStatus: 'Verified, Specialized',
    
    status: CargoStatus.IN_PROGRESS,
    createdAt: '2024-06-28T08:15:00Z',
    updatedAt: '2024-07-01T06:00:00Z'
  },
  {
    id: '567890',
    title: 'Machinery Components - Heavy Load',
    weight: 3200,
    volume: 15.5,
    price: 4500,
    pricePerKg: 1.41,
    urgency: UrgencyLevel.LOW,
    cargoType: CargoType.OVERSIZED,
    
    fromAddress: 'Hamburg, Germany, 20095',
    toAddress: 'Warsaw, Poland, 00-001',
    fromCountry: 'Germany',
    toCountry: 'Poland',
    pickupLat: 53.5511,
    pickupLng: 9.9937,
    deliveryLat: 52.2297,
    deliveryLng: 21.0122,
    
    loadingDate: 'July 10, 2025',
    deliveryDate: 'July 15, 2025',
    postingDate: 'June 22, 2024',
    
    provider: 'HeavyHaul International',
    providerStatus: 'Premium, Certified',
    
    status: CargoStatus.TAKEN,
    createdAt: '2024-06-22T16:45:00Z',
    updatedAt: '2024-06-30T12:00:00Z'
  },
  {
    id: '901234',
    title: 'Pharmaceutical Supplies - Fragile',
    weight: 320,
    volume: 1.8,
    price: 1200,
    pricePerKg: 3.75,
    urgency: UrgencyLevel.HIGH,
    cargoType: CargoType.FRAGILE,
    
    fromAddress: 'Basel, Switzerland, 4001',
    toAddress: 'Vienna, Austria, 1010',
    fromCountry: 'Switzerland',
    toCountry: 'Austria',
    pickupLat: 47.5596,
    pickupLng: 7.5886,
    deliveryLat: 48.2082,
    deliveryLng: 16.3738,
    
    loadingDate: 'July 3, 2025',
    deliveryDate: 'July 4, 2025',
    postingDate: 'June 30, 2024',
    
    provider: 'MedTransport AG',
    providerStatus: 'Specialized, Certified',
    
    status: CargoStatus.COMPLETED,
    createdAt: '2024-06-30T11:20:00Z',
    updatedAt: '2024-07-04T18:30:00Z'
  }
]

// Helper function to get status color
export function getStatusColor(status: CargoStatus): string {
  switch (status) {
    case CargoStatus.NEW:
      return 'text-blue-400'
    case CargoStatus.OPEN:
      return 'text-green-400'
    case CargoStatus.TAKEN:
      return 'text-yellow-400'
    case CargoStatus.IN_PROGRESS:
      return 'text-orange-400'
    case CargoStatus.COMPLETED:
      return 'text-gray-400'
    default:
      return 'text-white'
  }
}

// Helper function to get status background + text color (PĂSTRÂND CULORILE ORIGINALE)
export function getStatusBadgeStyles(status: CargoStatus): string {
  switch (status) {
    case CargoStatus.NEW:
      return 'bg-blue-400 text-white font-bold'        // Albastru original + text alb
    case CargoStatus.OPEN:
      return 'bg-green-400 text-black font-bold'       // Verde original + text negru  
    case CargoStatus.TAKEN:
      return 'bg-yellow-400 text-black font-bold'      // Galben original + text negru
    case CargoStatus.IN_PROGRESS:
      return 'bg-orange-400 text-black font-bold'      // Portocaliu original + text negru
    case CargoStatus.COMPLETED:
      return 'bg-gray-400 text-white font-bold'        // Gri original + text alb
    default:
      return 'bg-[#363636] text-white'
  }
}

// Helper function to get urgency color
export function getUrgencyColor(urgency: UrgencyLevel): string {
  switch (urgency) {
    case UrgencyLevel.LOW:
      return 'text-green-400'
    case UrgencyLevel.MEDIUM:
      return 'text-yellow-400'
    case UrgencyLevel.HIGH:
      return 'text-orange-400'
    case UrgencyLevel.URGENT:
      return 'text-red-400'
    default:
      return 'text-white'
  }
}

// Helper function to get urgency background + text color (PĂSTRÂND CULORILE ORIGINALE)
export function getUrgencyBadgeStyles(urgency: UrgencyLevel): string {
  switch (urgency) {
    case UrgencyLevel.LOW:
      return 'bg-green-400 text-black font-bold'       // Verde original + text negru
    case UrgencyLevel.MEDIUM:
      return 'bg-yellow-400 text-black font-bold'      // Galben original + text negru
    case UrgencyLevel.HIGH:
      return 'bg-orange-400 text-black font-bold'      // Portocaliu original + text negru
    case UrgencyLevel.URGENT:
      return 'bg-red-400 text-white font-bold'         // Roșu original + text alb
    default:
      return 'bg-[#363636] text-white'
  }
}

// Mock Offer Requests for testing bidding system
export const mockOfferRequests: OfferRequest[] = [
  {
    id: 'req_001',
    cargoOfferId: '123456',
    transporterId: 'trans_001',
    proposedPrice: 850,
    message: 'I can deliver this cargo with special handling for electronics. 15+ years experience in tech transport.',
    status: 'PENDING',
    createdAt: '2024-07-01T08:30:00Z'
  },
  {
    id: 'req_002', 
    cargoOfferId: '123456',
    transporterId: 'trans_002',
    proposedPrice: 920,
    message: 'Express delivery available. Temperature controlled truck with GPS tracking.',
    status: 'PENDING',
    createdAt: '2024-07-01T10:15:00Z'
  },
  {
    id: 'req_003',
    cargoOfferId: '789012',
    transporterId: 'trans_003', 
    proposedPrice: 1650,
    message: 'Specialized in automotive parts transport. Secure loading systems.',
    status: 'ACCEPTED',
    createdAt: '2024-06-26T14:20:00Z'
  },
  {
    id: 'req_004',
    cargoOfferId: '345678',
    transporterId: 'trans_004',
    proposedPrice: 2100,
    message: 'Refrigerated transport specialist. 24/7 temperature monitoring.',
    status: 'REJECTED',
    createdAt: '2024-06-29T16:45:00Z'
  }
]

// Helper function to get offers by cargo ID
export function getOffersByCargoId(cargoId: string): OfferRequest[] {
  return mockOfferRequests.filter(offer => offer.cargoOfferId === cargoId)
}

// Helper function to get offer status color
export function getOfferStatusColor(status: 'PENDING' | 'ACCEPTED' | 'REJECTED'): string {
  switch (status) {
    case 'PENDING':
      return 'text-yellow-400'
    case 'ACCEPTED':
      return 'text-green-400'
    case 'REJECTED':
      return 'text-red-400'
    default:
      return 'text-white'
  }
}

// Helper function to get offer status background + text color (PĂSTRÂND CULORILE ORIGINALE)
export function getOfferStatusBadgeStyles(status: 'PENDING' | 'ACCEPTED' | 'REJECTED'): string {
  switch (status) {
    case 'PENDING':
      return 'bg-yellow-400 text-black font-bold'      // Galben original + text negru
    case 'ACCEPTED':
      return 'bg-green-400 text-black font-bold'       // Verde original + text negru
    case 'REJECTED':
      return 'bg-red-400 text-white font-bold'         // Roșu original + text alb
    default:
      return 'bg-[#363636] text-white'
  }
}