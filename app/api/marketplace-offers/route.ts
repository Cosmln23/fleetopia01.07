import { currentUser } from '@clerk/nextjs/server'
import { query } from '@/lib/db'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic' // Force dynamic rendering

// Rate limiting implementation
const rateLimitMap = new Map()
const RATE_LIMIT_WINDOW_MS = 60 * 1000 // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 30 // 30 requests per minute

function getRateLimitKey(request: any): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || 'unknown'
  return `rate_limit:${ip}`
}

export async function GET(request: any) {
  try {
    // Rate limiting
    const key = getRateLimitKey(request)
    const now = Date.now()
    const windowStart = now - RATE_LIMIT_WINDOW_MS
    
    if (!rateLimitMap.has(key)) {
      rateLimitMap.set(key, [])
    }
    
    const requests = rateLimitMap.get(key)
    const recentRequests = requests.filter((timestamp: number) => timestamp > windowStart)
    
    if (recentRequests.length >= RATE_LIMIT_MAX_REQUESTS) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      )
    }
    
    recentRequests.push(now)
    rateLimitMap.set(key, recentRequests)
    
    const rateLimit = {
      remaining: RATE_LIMIT_MAX_REQUESTS - recentRequests.length,
      resetTime: Math.ceil((windowStart + RATE_LIMIT_WINDOW_MS) / 1000)
    }

    const user = await currentUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Query cargo offers - show all published/approved cargo to everyone
    // Owner can see their own cargo regardless of status
    const result = await query(`
      SELECT 
        c.*,
        u.first_name || ' ' || u.last_name as provider_name,
        CASE 
          WHEN c.sender_id = $1 THEN true 
          ELSE false 
        END as is_owner
      FROM cargo c
      LEFT JOIN users u ON c.sender_id = u.clerk_id
      WHERE 
        (c.status IN ('new', 'published', 'approved') AND c.sender_id != $1)
        OR (c.sender_id = $1)
      ORDER BY c.created_at DESC
      LIMIT 100
    `, [user.id])

    const offers = result.rows.map(row => ({
      id: row.id,
      title: row.title || `${row.cargo_type} - ${row.from_city} to ${row.to_city}`,
      weight: row.weight,
      volume: row.volume,
      price: row.price,
      pricePerKg: row.price_per_kg,
      urgency: row.urgency,
      cargoType: row.cargo_type,
      vehicleType: row.vehicle_type,
      fromAddress: row.from_address,
      toAddress: row.to_address,
      fromCountry: row.from_country,
      toCountry: row.to_country,
      fromPostal: row.from_postal,
      fromCity: row.from_city,
      toPostal: row.to_postal,
      toCity: row.to_city,
      pickupLat: row.pickup_lat,
      pickupLng: row.pickup_lng,
      deliveryLat: row.delivery_lat,
      deliveryLng: row.delivery_lng,
      loadingDate: row.loading_date,
      deliveryDate: row.delivery_date,
      postingDate: row.posting_date,
      provider: row.provider_name || 'Fleet-Platform',
      providerStatus: 'Verified',
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      isOwner: row.is_owner,
      senderId: row.sender_id
    }))

    return NextResponse.json({ 
      offers,
      total: offers.length 
    })

  } catch (error) {
    console.error('Database error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch cargo offers' },
      { status: 500 }
    )
  }
}