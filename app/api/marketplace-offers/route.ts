import { NextRequest, NextResponse } from 'next/server'
import { cargoDb } from '@/lib/db'

// Rate limiting store (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 30 // 30 requests per minute

function getRateLimitKey(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || 'unknown'
  return `marketplace-offers:${ip}`
}

function checkRateLimit(key: string): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now()
  const windowStart = Math.floor(now / RATE_LIMIT_WINDOW) * RATE_LIMIT_WINDOW
  const resetTime = windowStart + RATE_LIMIT_WINDOW

  const current = rateLimitStore.get(key)
  
  if (!current || current.resetTime <= now) {
    // New window or expired window
    rateLimitStore.set(key, { count: 1, resetTime })
    return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - 1, resetTime }
  }

  if (current.count >= RATE_LIMIT_MAX_REQUESTS) {
    return { allowed: false, remaining: 0, resetTime: current.resetTime }
  }

  // Increment counter
  current.count++
  rateLimitStore.set(key, current)
  
  return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - current.count, resetTime: current.resetTime }
}

export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitKey = getRateLimitKey(request)
    const rateLimit = checkRateLimit(rateLimitKey)
    
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded', retryAfter: Math.ceil((rateLimit.resetTime - Date.now()) / 1000) },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': RATE_LIMIT_MAX_REQUESTS.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateLimit.resetTime.toString(),
            'Retry-After': Math.ceil((rateLimit.resetTime - Date.now()) / 1000).toString()
          }
        }
      )
    }

    const { searchParams } = new URL(request.url)
    
    // Parse query parameters
    const isAgentRequest = searchParams.get('agent') === 'true'
    const since = searchParams.get('since')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100) // Max 100 items
    const offset = Math.max(parseInt(searchParams.get('offset') || '0'), 0)
    
    // Build filters
    const filters: any = {
      limit,
      offset,
      sortBy: 'newest'
    }

    // If agent request, add agent-specific filters
    if (isAgentRequest) {
      // Filter for active offers only
      filters.status = 'NEW,OPEN'
      
      // Add minimum weight/value filters for agent
      filters.minWeight = 100 // Minimum 100kg
      filters.maxWeight = 40000 // Maximum 40 tons
    }

    // Time-based filtering for polling
    if (since) {
      const sinceTimestamp = parseInt(since)
      if (!isNaN(sinceTimestamp)) {
        filters.minCreatedTs = sinceTimestamp
      }
    }

    // Get offers from database
    const offers = await cargoDb.getAll(filters)
    const totalCount = await cargoDb.getCount(filters)

    // Transform data for response
    const transformedOffers = offers.map((offer: any) => ({
      id: offer.id,
      title: offer.title,
      weight: offer.weight,
      volume: offer.volume,
      price: offer.price,
      pricePerKg: offer.price_per_kg,
      urgency: offer.urgency,
      cargoType: offer.type,
      fromAddress: offer.from_addr,
      toAddress: offer.to_addr,
      fromCountry: offer.from_country,
      toCountry: offer.to_country,
      fromPostal: offer.from_postal,
      fromCity: offer.from_city,
      toPostal: offer.to_postal,
      toCity: offer.to_city,
      pickupLat: offer.from_lat,
      pickupLng: offer.from_lng,
      deliveryLat: offer.to_lat,
      deliveryLng: offer.to_lng,
      loadingDate: offer.load_date,
      deliveryDate: offer.delivery_date,
      postingDate: offer.posting_date,
      provider: offer.provider_name,
      providerStatus: offer.provider_status,
      status: offer.status,
      createdAt: new Date(offer.created_ts).toISOString(),
      updatedAt: new Date(offer.updated_ts).toISOString()
    }))

    // If no new offers since timestamp, return 204
    if (since && transformedOffers.length === 0) {
      return new NextResponse(null, { 
        status: 204,
        headers: {
          'X-RateLimit-Limit': RATE_LIMIT_MAX_REQUESTS.toString(),
          'X-RateLimit-Remaining': rateLimit.remaining.toString(),
          'X-RateLimit-Reset': rateLimit.resetTime.toString()
        }
      })
    }

    const response = {
      offers: transformedOffers,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + offers.length < totalCount
      },
      metadata: {
        isAgentRequest,
        timestamp: Date.now(),
        requestId: `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      }
    }

    return NextResponse.json(response, {
      headers: {
        'X-RateLimit-Limit': RATE_LIMIT_MAX_REQUESTS.toString(),
        'X-RateLimit-Remaining': rateLimit.remaining.toString(),
        'X-RateLimit-Reset': rateLimit.resetTime.toString(),
        'Cache-Control': isAgentRequest ? 'no-cache' : 'public, max-age=30', // 30s cache for non-agent requests
      }
    })

  } catch (error) {
    console.error('Error fetching marketplace offers:', error)
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

// Clean up old rate limit entries periodically
setInterval(() => {
  const now = Date.now()
  const keysToDelete: string[] = []
  
  rateLimitStore.forEach((value, key) => {
    if (value.resetTime <= now) {
      keysToDelete.push(key)
    }
  })
  
  keysToDelete.forEach(key => rateLimitStore.delete(key))
}, RATE_LIMIT_WINDOW)