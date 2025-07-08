import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { cargoCreateSchema } from '@/lib/zodSchemas'
import { cargoDb } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Extract query parameters for filtering
    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search') || undefined
    const country = searchParams.get('country') || undefined
    const cargoType = searchParams.get('cargoType') || undefined
    const urgency = searchParams.get('urgency') || undefined
    const minPrice = searchParams.get('minPrice') ? parseInt(searchParams.get('minPrice')!) : undefined
    const maxPrice = searchParams.get('maxPrice') ? parseInt(searchParams.get('maxPrice')!) : undefined
    const sortBy = searchParams.get('sortBy') || 'newest'
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0
    const mode = searchParams.get('mode') || 'manual' // manual or agent

    // Get live cargo data from database
    const cargoList = await cargoDb.getAll({
      search,
      country,
      cargoType,
      urgency,
      minPrice,
      maxPrice,
      sortBy,
      limit,
      offset
    })

    // Transform database results to match expected format
    const transformedCargo = cargoList.map(cargo => ({
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
      // Sender information
      sender: {
        id: cargo.sender_id,
        name: cargo.sender_name,
        email: cargo.sender_email,
        rating: cargo.sender_rating,
        verified: cargo.sender_verified,
        avatar: cargo.sender_avatar,
        company: cargo.sender_company,
        location: cargo.sender_location,
        lastSeen: cargo.sender_last_seen,
        isOnline: cargo.sender_is_online
      }
    }))

    // Get total count for pagination
    const totalCount = await cargoDb.getCount({
      search,
      country,
      cargoType,
      urgency,
      minPrice,
      maxPrice
    })

    return NextResponse.json({
      cargo: transformedCargo,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount
      },
      filters: {
        search,
        country,
        cargoType,
        urgency,
        minPrice,
        maxPrice,
        sortBy,
        mode
      },
      _meta: {
        timestamp: new Date().toISOString(),
        source: 'live_database',
        userId: userId,
        count: transformedCargo.length
      }
    })
  } catch (error) {
    console.error('Error fetching cargo:', error)
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
    
    // Check role authorization
    const role = (sessionClaims?.publicMetadata as any)?.role
    if (role !== 'provider') {
      return NextResponse.json({ error: 'Forbidden - Only providers can create cargo' }, { status: 403 })
    }
    
    const body = await req.json()
    
    // Validate request body
    const validation = cargoCreateSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json({ 
        error: 'Invalid data', 
        details: validation.error.issues 
      }, { status: 400 })
    }
    
    const cargoData = validation.data
    
    // Create cargo in database
    const newCargoId = `cargo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const timestamp = Date.now()
    
    const cargoToCreate = {
      id: newCargoId,
      title: cargoData.title,
      type: cargoData.cargoType,
      urgency: cargoData.urgency,
      weight: cargoData.weight,
      volume: cargoData.volume,
      from_addr: cargoData.fromAddress,
      from_city: cargoData.fromCity,
      from_postal: cargoData.fromPostal,
      from_country: cargoData.fromCountry,
      to_addr: cargoData.toAddress,
      to_city: cargoData.toCity,
      to_postal: cargoData.toPostal,
      to_country: cargoData.toCountry,
      from_lat: cargoData.fromLat,
      from_lng: cargoData.fromLng,
      to_lat: cargoData.toLat,
      to_lng: cargoData.toLng,
      load_date: cargoData.loadingDate,
      delivery_date: cargoData.deliveryDate,
      price: cargoData.price,
      price_per_kg: cargoData.pricePerKg,
      provider_name: cargoData.provider,
      provider_status: cargoData.providerStatus || 'active',
      status: 'active',
      created_ts: timestamp,
      updated_ts: timestamp,
      posting_date: new Date().toISOString(),
      sender_id: userId
    }
    
    const createdCargo = await cargoDb.create(cargoToCreate)
    
    console.log('✅ Cargo created in database:', createdCargo.id)
    
    // Transform back to expected format
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
    console.error('Error creating cargo:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}