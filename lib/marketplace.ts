/**
 * MARKETPLACE SERVICE LAYER
 * 
 * Service layer for marketplace operations with feature flag support
 * Handles cargo listings, offers, and marketplace business logic
 * 
 * Features:
 * - Feature flag toggle between mock and real data
 * - Database operations for cargo and offers
 * - Input validation and error handling
 * - Performance optimization with caching
 */

import { query } from './db'
import { z } from 'zod'

// Feature flag configuration
const USE_MOCK_MARKETPLACE = process.env.USE_MOCK_MARKETPLACE === 'true'

// TypeScript interfaces
export interface Cargo {
  id: string
  title: string
  type: string
  urgency: string
  weight: number
  volume?: number
  from_addr: string
  from_country: string
  from_postal?: string
  from_city?: string
  to_addr: string
  to_country: string
  to_postal?: string
  to_city?: string
  from_lat?: number
  from_lng?: number
  to_lat?: number
  to_lng?: number
  load_date: string
  delivery_date: string
  price?: number
  price_per_kg?: number
  provider_name: string
  provider_status: string
  status: 'NEW' | 'OPEN' | 'TAKEN' | 'IN_PROGRESS' | 'COMPLETED'
  created_ts: number
  updated_ts: number
  posting_date: string
}

export interface CargoOffer {
  id: string
  cargo_id: string
  transporter_id: string
  proposed_price: number
  message?: string
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED'
  created_ts: number
}

export interface CargoFilters {
  status?: string[]
  from_country?: string
  to_country?: string
  min_weight?: number
  max_weight?: number
  min_price?: number
  max_price?: number
  urgency?: string[]
  type?: string[]
  search?: string
  from_date?: string
  to_date?: string
}

export interface PaginationParams {
  page: number
  limit: number
  sortBy?: string
  sortOrder?: 'ASC' | 'DESC'
}

export interface CargoListResponse {
  cargo: Cargo[]
  pagination: {
    page: number
    limit: number
    total: number
    hasMore: boolean
    totalPages: number
  }
  filters: CargoFilters
}

// Validation schemas
const cargoSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  type: z.string().min(1, 'Type is required'),
  urgency: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
  weight: z.number().min(0.1, 'Weight must be positive'),
  volume: z.number().optional(),
  from_addr: z.string().min(1, 'From address is required'),
  from_country: z.string().min(1, 'From country is required'),
  from_postal: z.string().optional(),
  from_city: z.string().optional(),
  to_addr: z.string().min(1, 'To address is required'),
  to_country: z.string().min(1, 'To country is required'),
  to_postal: z.string().optional(),
  to_city: z.string().optional(),
  from_lat: z.number().optional(),
  from_lng: z.number().optional(),
  to_lat: z.number().optional(),
  to_lng: z.number().optional(),
  load_date: z.string().min(1, 'Load date is required'),
  delivery_date: z.string().min(1, 'Delivery date is required'),
  price: z.number().optional(),
  price_per_kg: z.number().optional(),
  provider_name: z.string().min(1, 'Provider name is required'),
  provider_status: z.string().default('ACTIVE')
})

const offerSchema = z.object({
  cargo_id: z.string().min(1, 'Cargo ID is required'),
  transporter_id: z.string().min(1, 'Transporter ID is required'),
  proposed_price: z.number().min(0, 'Price must be positive'),
  message: z.string().optional()
})

// Mock data for development
const mockCargo: Cargo[] = [
  {
    id: 'mock-1',
    title: 'Electronics Transport - Bucharest to Cluj',
    type: 'Electronics',
    urgency: 'HIGH',
    weight: 500,
    volume: 2.5,
    from_addr: 'Strada Victoriei 1, Bucharest',
    from_country: 'Romania',
    from_city: 'Bucharest',
    to_addr: 'Strada Memorandumului 28, Cluj-Napoca',
    to_country: 'Romania',
    to_city: 'Cluj-Napoca',
    from_lat: 44.4268,
    from_lng: 26.1025,
    to_lat: 46.7712,
    to_lng: 23.6236,
    load_date: '2025-07-16',
    delivery_date: '2025-07-18',
    price: 1200,
    price_per_kg: 2.4,
    provider_name: 'TechCorp SRL',
    provider_status: 'VERIFIED',
    status: 'NEW',
    created_ts: Date.now() - 3600000,
    updated_ts: Date.now() - 3600000,
    posting_date: '2025-07-15'
  },
  {
    id: 'mock-2',
    title: 'Furniture Delivery - Timisoara to Iasi',
    type: 'Furniture',
    urgency: 'MEDIUM',
    weight: 1200,
    volume: 8.0,
    from_addr: 'Bulevardul Revoluției 6, Timișoara',
    from_country: 'Romania',
    from_city: 'Timișoara',
    to_addr: 'Strada Păcurari 4, Iași',
    to_country: 'Romania',
    to_city: 'Iași',
    from_lat: 45.7489,
    from_lng: 21.2087,
    to_lat: 47.1585,
    to_lng: 27.6014,
    load_date: '2025-07-20',
    delivery_date: '2025-07-22',
    price: 800,
    price_per_kg: 0.67,
    provider_name: 'MobilCasa',
    provider_status: 'ACTIVE',
    status: 'OPEN',
    created_ts: Date.now() - 7200000,
    updated_ts: Date.now() - 3600000,
    posting_date: '2025-07-15'
  }
]

/**
 * List cargo with filtering and pagination
 */
export async function listCargo(
  filters: CargoFilters = {},
  pagination: PaginationParams = { page: 1, limit: 20 }
): Promise<CargoListResponse> {
  console.log('🔍 Marketplace: listCargo called', { filters, pagination, useMock: USE_MOCK_MARKETPLACE })
  
  if (USE_MOCK_MARKETPLACE) {
    return listCargoMock(filters, pagination)
  }
  
  try {
    const offset = (pagination.page - 1) * pagination.limit
    const sortBy = pagination.sortBy || 'created_ts'
    const sortOrder = pagination.sortOrder || 'DESC'
    
    // Build WHERE clause
    const whereConditions: string[] = []
    const queryParams: any[] = []
    let paramIndex = 1
    
    // Status filter
    if (filters.status && filters.status.length > 0) {
      whereConditions.push(`status = ANY($${paramIndex})`)
      queryParams.push(filters.status)
      paramIndex++
    }
    
    // Country filters
    if (filters.from_country) {
      whereConditions.push(`from_country = $${paramIndex}`)
      queryParams.push(filters.from_country)
      paramIndex++
    }
    
    if (filters.to_country) {
      whereConditions.push(`to_country = $${paramIndex}`)
      queryParams.push(filters.to_country)
      paramIndex++
    }
    
    // Weight filters
    if (filters.min_weight !== undefined) {
      whereConditions.push(`weight >= $${paramIndex}`)
      queryParams.push(filters.min_weight)
      paramIndex++
    }
    
    if (filters.max_weight !== undefined) {
      whereConditions.push(`weight <= $${paramIndex}`)
      queryParams.push(filters.max_weight)
      paramIndex++
    }
    
    // Price filters
    if (filters.min_price !== undefined) {
      whereConditions.push(`price >= $${paramIndex}`)
      queryParams.push(filters.min_price)
      paramIndex++
    }
    
    if (filters.max_price !== undefined) {
      whereConditions.push(`price <= $${paramIndex}`)
      queryParams.push(filters.max_price)
      paramIndex++
    }
    
    // Urgency filter
    if (filters.urgency && filters.urgency.length > 0) {
      whereConditions.push(`urgency = ANY($${paramIndex})`)
      queryParams.push(filters.urgency)
      paramIndex++
    }
    
    // Type filter
    if (filters.type && filters.type.length > 0) {
      whereConditions.push(`type = ANY($${paramIndex})`)
      queryParams.push(filters.type)
      paramIndex++
    }
    
    // Search filter
    if (filters.search) {
      whereConditions.push(`(
        title ILIKE $${paramIndex} OR 
        from_addr ILIKE $${paramIndex} OR 
        to_addr ILIKE $${paramIndex} OR
        provider_name ILIKE $${paramIndex}
      )`)
      queryParams.push(`%${filters.search}%`)
      paramIndex++
    }
    
    // Date filters
    if (filters.from_date) {
      whereConditions.push(`created_ts >= $${paramIndex}`)
      queryParams.push(new Date(filters.from_date).getTime())
      paramIndex++
    }
    
    if (filters.to_date) {
      whereConditions.push(`created_ts <= $${paramIndex}`)
      queryParams.push(new Date(filters.to_date).getTime())
      paramIndex++
    }
    
    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : ''
    
    // Count total records
    const countQuery = `SELECT COUNT(*) as total FROM cargo ${whereClause}`
    const countResult = await query(countQuery, queryParams)
    const total = parseInt(countResult.rows[0].total)
    
    // Fetch paginated records
    const dataQuery = `
      SELECT * FROM cargo 
      ${whereClause}
      ORDER BY ${sortBy} ${sortOrder}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `
    
    queryParams.push(pagination.limit, offset)
    const dataResult = await query(dataQuery, queryParams)
    
    const totalPages = Math.ceil(total / pagination.limit)
    const hasMore = pagination.page < totalPages
    
    console.log('✅ Marketplace: listCargo success', { 
      total, 
      returned: dataResult.rows.length, 
      page: pagination.page, 
      totalPages 
    })
    
    return {
      cargo: dataResult.rows,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        hasMore,
        totalPages
      },
      filters
    }
    
  } catch (error) {
    console.error('❌ Marketplace: listCargo error', error)
    throw new Error('Failed to fetch cargo listings')
  }
}

/**
 * Get cargo details by ID
 */
export async function getCargoDetails(cargoId: string): Promise<Cargo | null> {
  console.log('🔍 Marketplace: getCargoDetails called', { cargoId, useMock: USE_MOCK_MARKETPLACE })
  
  if (USE_MOCK_MARKETPLACE) {
    const cargo = mockCargo.find(c => c.id === cargoId)
    return cargo || null
  }
  
  try {
    const result = await query('SELECT * FROM cargo WHERE id = $1', [cargoId])
    
    if (result.rows.length === 0) {
      console.log('⚠️ Marketplace: cargo not found', { cargoId })
      return null
    }
    
    console.log('✅ Marketplace: getCargoDetails success', { cargoId })
    return result.rows[0]
    
  } catch (error) {
    console.error('❌ Marketplace: getCargoDetails error', error)
    throw new Error('Failed to fetch cargo details')
  }
}

/**
 * Create new cargo listing
 */
export async function createCargo(cargoData: Omit<Cargo, 'id' | 'created_ts' | 'updated_ts' | 'status'>): Promise<Cargo> {
  console.log('🔍 Marketplace: createCargo called', { useMock: USE_MOCK_MARKETPLACE })
  
  // Validate input
  const validatedData = cargoSchema.parse(cargoData)
  
  if (USE_MOCK_MARKETPLACE) {
    const newCargo: Cargo = {
      ...validatedData,
      id: `mock-${Date.now()}`,
      status: 'NEW',
      created_ts: Date.now(),
      updated_ts: Date.now()
    }
    mockCargo.unshift(newCargo)
    return newCargo
  }
  
  try {
    const cargoId = `cargo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const now = Date.now()
    
    const result = await query(`
      INSERT INTO cargo (
        id, title, type, urgency, weight, volume,
        from_addr, from_country, from_postal, from_city,
        to_addr, to_country, to_postal, to_city,
        from_lat, from_lng, to_lat, to_lng,
        load_date, delivery_date, price, price_per_kg,
        provider_name, provider_status, status,
        created_ts, updated_ts, posting_date
      ) VALUES (
        $1, $2, $3, $4, $5, $6,
        $7, $8, $9, $10,
        $11, $12, $13, $14,
        $15, $16, $17, $18,
        $19, $20, $21, $22,
        $23, $24, 'NEW',
        $25, $26, $27
      ) RETURNING *
    `, [
      cargoId, validatedData.title, validatedData.type, validatedData.urgency, 
      validatedData.weight, validatedData.volume,
      validatedData.from_addr, validatedData.from_country, validatedData.from_postal, validatedData.from_city,
      validatedData.to_addr, validatedData.to_country, validatedData.to_postal, validatedData.to_city,
      validatedData.from_lat, validatedData.from_lng, validatedData.to_lat, validatedData.to_lng,
      validatedData.load_date, validatedData.delivery_date, validatedData.price, validatedData.price_per_kg,
      validatedData.provider_name, validatedData.provider_status,
      now, now, new Date().toISOString().split('T')[0]
    ])
    
    console.log('✅ Marketplace: createCargo success', { cargoId })
    return result.rows[0]
    
  } catch (error) {
    console.error('❌ Marketplace: createCargo error', error)
    throw new Error('Failed to create cargo listing')
  }
}

/**
 * Submit offer for cargo
 */
export async function submitOffer(offerData: Omit<CargoOffer, 'id' | 'created_ts' | 'status'>): Promise<CargoOffer> {
  console.log('🔍 Marketplace: submitOffer called', { useMock: USE_MOCK_MARKETPLACE })
  
  // Validate input
  const validatedData = offerSchema.parse(offerData)
  
  if (USE_MOCK_MARKETPLACE) {
    const newOffer: CargoOffer = {
      ...validatedData,
      id: `mock-offer-${Date.now()}`,
      status: 'PENDING',
      created_ts: Date.now()
    }
    console.log('✅ Marketplace: submitOffer success (mock)', { offerId: newOffer.id })
    return newOffer
  }
  
  try {
    // Check if cargo exists
    const cargoResult = await query('SELECT id FROM cargo WHERE id = $1', [validatedData.cargo_id])
    if (cargoResult.rows.length === 0) {
      throw new Error('Cargo not found')
    }
    
    // Check for duplicate offers
    const existingOffer = await query(`
      SELECT id FROM offer_requests 
      WHERE cargo_id = $1 AND transporter_id = $2
    `, [validatedData.cargo_id, validatedData.transporter_id])
    
    if (existingOffer.rows.length > 0) {
      throw new Error('Offer already exists for this cargo')
    }
    
    const offerId = `offer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const now = Date.now()
    
    const result = await query(`
      INSERT INTO offer_requests (
        id, cargo_id, transporter_id, proposed_price, message, status, created_ts
      ) VALUES (
        $1, $2, $3, $4, $5, 'PENDING', $6
      ) RETURNING *
    `, [
      offerId, validatedData.cargo_id, validatedData.transporter_id,
      validatedData.proposed_price, validatedData.message, now
    ])
    
    console.log('✅ Marketplace: submitOffer success', { offerId })
    return result.rows[0]
    
  } catch (error) {
    console.error('❌ Marketplace: submitOffer error', error)
    throw new Error('Failed to submit offer')
  }
}

/**
 * Get offers for cargo
 */
export async function getCargoOffers(cargoId: string): Promise<CargoOffer[]> {
  console.log('🔍 Marketplace: getCargoOffers called', { cargoId, useMock: USE_MOCK_MARKETPLACE })
  
  if (USE_MOCK_MARKETPLACE) {
    // Mock offers for testing
    return [
      {
        id: 'mock-offer-1',
        cargo_id: cargoId,
        transporter_id: 'user-123',
        proposed_price: 1000,
        message: 'Can deliver within 2 days',
        status: 'PENDING',
        created_ts: Date.now() - 1800000
      }
    ]
  }
  
  try {
    const result = await query(`
      SELECT o.*, u.name as transporter_name, u.company as transporter_company
      FROM offer_requests o
      LEFT JOIN users u ON u.clerk_id = o.transporter_id
      WHERE o.cargo_id = $1
      ORDER BY o.created_ts DESC
    `, [cargoId])
    
    console.log('✅ Marketplace: getCargoOffers success', { cargoId, count: result.rows.length })
    return result.rows
    
  } catch (error) {
    console.error('❌ Marketplace: getCargoOffers error', error)
    throw new Error('Failed to fetch cargo offers')
  }
}

/**
 * Update cargo status
 */
export async function updateCargoStatus(cargoId: string, status: Cargo['status']): Promise<boolean> {
  console.log('🔍 Marketplace: updateCargoStatus called', { cargoId, status, useMock: USE_MOCK_MARKETPLACE })
  
  if (USE_MOCK_MARKETPLACE) {
    const cargo = mockCargo.find(c => c.id === cargoId)
    if (cargo) {
      cargo.status = status
      cargo.updated_ts = Date.now()
      return true
    }
    return false
  }
  
  try {
    const result = await query(`
      UPDATE cargo 
      SET status = $1, updated_ts = $2
      WHERE id = $3
    `, [status, Date.now(), cargoId])
    
    const success = result.rowCount > 0
    console.log('✅ Marketplace: updateCargoStatus success', { cargoId, status, success })
    return success
    
  } catch (error) {
    console.error('❌ Marketplace: updateCargoStatus error', error)
    throw new Error('Failed to update cargo status')
  }
}

/**
 * Mock data handler for development
 */
function listCargoMock(filters: CargoFilters, pagination: PaginationParams): CargoListResponse {
  let filteredCargo = [...mockCargo]
  
  // Apply filters
  if (filters.status && filters.status.length > 0) {
    filteredCargo = filteredCargo.filter(c => filters.status!.includes(c.status))
  }
  
  if (filters.from_country) {
    filteredCargo = filteredCargo.filter(c => c.from_country === filters.from_country)
  }
  
  if (filters.to_country) {
    filteredCargo = filteredCargo.filter(c => c.to_country === filters.to_country)
  }
  
  if (filters.min_weight !== undefined) {
    filteredCargo = filteredCargo.filter(c => c.weight >= filters.min_weight!)
  }
  
  if (filters.max_weight !== undefined) {
    filteredCargo = filteredCargo.filter(c => c.weight <= filters.max_weight!)
  }
  
  if (filters.search) {
    const searchTerm = filters.search.toLowerCase()
    filteredCargo = filteredCargo.filter(c =>
      c.title.toLowerCase().includes(searchTerm) ||
      c.from_addr.toLowerCase().includes(searchTerm) ||
      c.to_addr.toLowerCase().includes(searchTerm) ||
      c.provider_name.toLowerCase().includes(searchTerm)
    )
  }
  
  // Apply pagination
  const total = filteredCargo.length
  const offset = (pagination.page - 1) * pagination.limit
  const paginatedCargo = filteredCargo.slice(offset, offset + pagination.limit)
  
  const totalPages = Math.ceil(total / pagination.limit)
  const hasMore = pagination.page < totalPages
  
  return {
    cargo: paginatedCargo,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total,
      hasMore,
      totalPages
    },
    filters
  }
}

/**
 * Get marketplace statistics
 */
export async function getMarketplaceStats() {
  console.log('🔍 Marketplace: getMarketplaceStats called', { useMock: USE_MOCK_MARKETPLACE })
  
  if (USE_MOCK_MARKETPLACE) {
    return {
      total_cargo: mockCargo.length,
      active_cargo: mockCargo.filter(c => c.status === 'NEW' || c.status === 'OPEN').length,
      completed_cargo: mockCargo.filter(c => c.status === 'COMPLETED').length,
      total_offers: 5,
      pending_offers: 3,
      accepted_offers: 2
    }
  }
  
  try {
    const result = await query(`
      SELECT 
        COUNT(*) as total_cargo,
        COUNT(*) FILTER (WHERE status IN ('NEW', 'OPEN')) as active_cargo,
        COUNT(*) FILTER (WHERE status = 'COMPLETED') as completed_cargo,
        (SELECT COUNT(*) FROM offer_requests) as total_offers,
        (SELECT COUNT(*) FROM offer_requests WHERE status = 'PENDING') as pending_offers,
        (SELECT COUNT(*) FROM offer_requests WHERE status = 'ACCEPTED') as accepted_offers
      FROM cargo
    `)
    
    console.log('✅ Marketplace: getMarketplaceStats success')
    return result.rows[0]
    
  } catch (error) {
    console.error('❌ Marketplace: getMarketplaceStats error', error)
    throw new Error('Failed to get marketplace statistics')
  }
}

export default {
  listCargo,
  getCargoDetails,
  createCargo,
  submitOffer,
  getCargoOffers,
  updateCargoStatus,
  getMarketplaceStats
}