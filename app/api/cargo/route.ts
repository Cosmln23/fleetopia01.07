import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { listCargo, createCargo, type CargoFilters, type PaginationParams } from '@/lib/marketplace'
import { query } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Extract query parameters for filtering
    const { searchParams } = new URL(req.url)
    
    // Build filters object
    const filters: CargoFilters = {}
    
    if (searchParams.get('search')) {
      filters.search = searchParams.get('search')!
    }
    
    if (searchParams.get('status')) {
      filters.status = searchParams.get('status')!.split(',')
    }
    
    if (searchParams.get('from_country')) {
      filters.from_country = searchParams.get('from_country')!
    }
    
    if (searchParams.get('to_country')) {
      filters.to_country = searchParams.get('to_country')!
    }
    
    if (searchParams.get('min_weight')) {
      filters.min_weight = parseFloat(searchParams.get('min_weight')!)
    }
    
    if (searchParams.get('max_weight')) {
      filters.max_weight = parseFloat(searchParams.get('max_weight')!)
    }
    
    if (searchParams.get('min_price')) {
      filters.min_price = parseFloat(searchParams.get('min_price')!)
    }
    
    if (searchParams.get('max_price')) {
      filters.max_price = parseFloat(searchParams.get('max_price')!)
    }
    
    if (searchParams.get('urgency')) {
      filters.urgency = searchParams.get('urgency')!.split(',')
    }
    
    if (searchParams.get('type')) {
      filters.type = searchParams.get('type')!.split(',')
    }
    
    if (searchParams.get('from_date')) {
      filters.from_date = searchParams.get('from_date')!
    }
    
    if (searchParams.get('to_date')) {
      filters.to_date = searchParams.get('to_date')!
    }
    
    // Build pagination object
    const pagination: PaginationParams = {
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20'),
      sortBy: searchParams.get('sortBy') || 'created_ts',
      sortOrder: (searchParams.get('sortOrder') as 'ASC' | 'DESC') || 'DESC'
    }

    // Get cargo data using marketplace service
    const result = await listCargo(filters, pagination)
    
    // Get sender info for each cargo to populate sender field
    const cargoIds = result.cargo.map(c => c.id)
    let senderInfo: Record<string, any> = {}
    
    if (cargoIds.length > 0) {
      try {
        // Try with sender_id first (if column exists)
        const senderResult = await query(`
          SELECT c.id as cargo_id, u.clerk_id, u.name, u.email, u.avatar, u.company, u.verified, u.rating
          FROM cargo c
          LEFT JOIN users u ON c.sender_id = u.clerk_id OR u.name = c.provider_name
          WHERE c.id = ANY($1)
        `, [cargoIds])
        
        senderInfo = senderResult.rows.reduce((acc: Record<string, any>, row: any) => {
          acc[row.cargo_id] = {
            id: row.clerk_id,
            name: row.name,
            email: row.email,
            avatar: row.avatar,
            company: row.company,
            verified: row.verified || false,
            rating: row.rating || 0
          }
          return acc
        }, {})
      } catch (error: any) {
        // Fallback for when sender_id column doesn't exist yet
        if (error.code === '42703') {
          console.log('⚠️ sender_id column not found, using fallback')
          const senderResult = await query(`
            SELECT c.id as cargo_id, u.clerk_id, u.name, u.email, u.avatar, u.company, u.verified, u.rating
            FROM cargo c
            LEFT JOIN users u ON u.name = c.provider_name
            WHERE c.id = ANY($1)
          `, [cargoIds])
          
          senderInfo = senderResult.rows.reduce((acc: Record<string, any>, row: any) => {
            acc[row.cargo_id] = {
              id: row.clerk_id,
              name: row.name,
              email: row.email,
              avatar: row.avatar,
              company: row.company,
              verified: row.verified || false,
              rating: row.rating || 0
            }
            return acc
          }, {})
        } else {
          throw error
        }
      }
    }

    // Transform to maintain backward compatibility
    const transformedCargo = result.cargo.map(cargo => ({
      id: cargo.id,
      title: cargo.title,
      weight: cargo.weight,
      volume: cargo.volume,
      cargoType: cargo.type,
      urgency: cargo.urgency,
      fromAddress: cargo.from_addr,
      fromCity: cargo.from_city || '',
      fromPostal: cargo.from_postal || '',
      fromCountry: cargo.from_country,
      toAddress: cargo.to_addr,
      toCity: cargo.to_city || '',
      toPostal: cargo.to_postal || '',
      toCountry: cargo.to_country,
      fromLat: cargo.from_lat,
      fromLng: cargo.from_lng,
      toLat: cargo.to_lat,
      toLng: cargo.to_lng,
      loadingDate: cargo.load_date,
      deliveryDate: cargo.delivery_date,
      price: cargo.price,
      pricePerKg: cargo.price_per_kg,
      provider: cargo.provider_name,
      providerStatus: cargo.provider_status,
      status: cargo.status,
      postingDate: cargo.posting_date,
      createdAt: cargo.created_ts,
      updatedAt: cargo.updated_ts,
      sender: senderInfo[cargo.id] || null
    }))

    return NextResponse.json({
      cargo: transformedCargo,
      pagination: {
        total: result.pagination.total,
        limit: result.pagination.limit,
        page: result.pagination.page,
        totalPages: result.pagination.totalPages,
        hasMore: result.pagination.hasMore
      },
      filters: result.filters,
      _meta: {
        timestamp: new Date().toISOString(),
        source: 'live_database',
        userId: userId,
        count: transformedCargo.length
      }
    })
  } catch (error) {
    console.error('❌ API: GET /api/cargo error:', error)
    return NextResponse.json({ error: 'Failed to fetch cargo' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId, sessionClaims } = await auth()
    
    // Check authentication
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Check role authorization - allow both provider and carrier to create cargo
    const role = (sessionClaims?.publicMetadata as any)?.role
    if (role && role !== 'provider' && role !== 'carrier') {
      return NextResponse.json({ error: 'Forbidden - Only providers and carriers can create cargo' }, { status: 403 })
    }
    
    // If no role is set, allow cargo creation (for new users)
    if (!role) {
      console.log('ℹ️ User has no role set, allowing cargo creation for onboarding')
    }
    
    // Check trial cargo limit (5 cargo max for trial users)
    const publicMetadata = sessionClaims?.publicMetadata as any || {}
    const { status, trialStartedAt } = publicMetadata
    
    if (status === 'TRIAL') {
      // Get user info to count cargo
      const userResult = await query('SELECT name, trial_started_at FROM users WHERE clerk_id = $1', [userId])
      if (userResult.rows.length > 0) {
        const userInfo = userResult.rows[0]
        const trialStartTime = userInfo.trial_started_at
        
        if (trialStartTime) {
          // Count cargo posted during trial period
          const cargoCountResult = await query(`
            SELECT COUNT(*) as count
            FROM cargo 
            WHERE provider_name = $1 
            AND created_ts >= EXTRACT(EPOCH FROM $2) * 1000
          `, [userInfo.name, trialStartTime])
          
          const cargoCount = parseInt(cargoCountResult.rows[0].count)
          
          if (cargoCount >= 5) {
            return NextResponse.json({ 
              error: 'Trial cargo limit exceeded', 
              message: 'Trial users can post maximum 5 cargo listings. Please upgrade to continue.',
              currentCount: cargoCount,
              maxAllowed: 5,
              redirectTo: '/billing'
            }, { status: 403 })
          }
        }
      }
    }
    
    const body = await req.json()
    
    // Get user details for provider info
    const userResult = await query('SELECT name, company FROM users WHERE clerk_id = $1', [userId])
    const userInfo = userResult.rows[0] || {}
    
    // Build cargo data for marketplace service
    const cargoData = {
      title: body.title,
      type: body.type || body.cargoType || 'General',
      urgency: (body.urgency || 'MEDIUM').toUpperCase(),
      weight: parseFloat(body.weight || '0'),
      volume: body.volume ? parseFloat(body.volume) : undefined,
      from_addr: body.fromAddress || '',
      from_country: body.fromCountry || '',
      from_postal: body.fromPostal || undefined,
      from_city: body.fromCity || undefined,
      to_addr: body.toAddress || '',
      to_country: body.toCountry || '',
      to_postal: body.toPostal || undefined,
      to_city: body.toCity || undefined,
      from_lat: body.fromLat || undefined,
      from_lng: body.fromLng || undefined,
      to_lat: body.toLat || undefined,
      to_lng: body.toLng || undefined,
      load_date: body.loadingDate || body.loadDate || '',
      delivery_date: body.deliveryDate || '',
      price: body.price ? parseFloat(body.price) : undefined,
      price_per_kg: body.pricePerKg ? parseFloat(body.pricePerKg) : undefined,
      provider_name: userInfo.name || userInfo.company || body.provider || 'Unknown Provider',
      provider_status: 'ACTIVE',
      posting_date: new Date().toISOString().split('T')[0],
      sender_id: userId // Store Clerk user ID as sender
    }
    
    // Create cargo using marketplace service
    const createdCargo = await createCargo(cargoData)
    
    console.log('✅ API: Cargo created successfully:', createdCargo.id)
    
    // Transform response to maintain backward compatibility
    const responseData = {
      id: createdCargo.id,
      title: createdCargo.title,
      cargoType: createdCargo.type,
      urgency: createdCargo.urgency,
      weight: createdCargo.weight,
      volume: createdCargo.volume,
      fromAddress: createdCargo.from_addr,
      fromCity: createdCargo.from_city,
      fromPostal: createdCargo.from_postal,
      fromCountry: createdCargo.from_country,
      toAddress: createdCargo.to_addr,
      toCity: createdCargo.to_city,
      toPostal: createdCargo.to_postal,
      toCountry: createdCargo.to_country,
      fromLat: createdCargo.from_lat,
      fromLng: createdCargo.from_lng,
      toLat: createdCargo.to_lat,
      toLng: createdCargo.to_lng,
      loadingDate: createdCargo.load_date,
      deliveryDate: createdCargo.delivery_date,
      price: createdCargo.price,
      pricePerKg: createdCargo.price_per_kg,
      provider: createdCargo.provider_name,
      providerStatus: createdCargo.provider_status,
      status: createdCargo.status,
      postingDate: createdCargo.posting_date,
      createdAt: createdCargo.created_ts,
      updatedAt: createdCargo.updated_ts,
      providerId: userId
    }
    
    return NextResponse.json(responseData, { status: 201 })
    
  } catch (error) {
    console.error('❌ API: POST /api/cargo error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}