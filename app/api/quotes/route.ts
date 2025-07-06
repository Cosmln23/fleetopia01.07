import { NextRequest, NextResponse } from 'next/server'
import { offerDb } from '@/lib/db'
import { z } from 'zod'

// Rate limiting store (in production, use Redis)
const quoteLimitStore = new Map<string, number>()
const QUOTE_RATE_LIMIT_WINDOW = 30 * 1000 // 30 seconds

// Validation schema
const quoteRequestSchema = z.object({
  cargoId: z.string().min(1, 'Cargo ID is required'),
  price: z.number().min(1, 'Price must be greater than 0').max(1000000, 'Price too high'),
  message: z.string().optional(),
  source: z.enum(['manual', 'agent']).default('manual')
})

function getQuoteRateLimitKey(cargoId: string, userId: string): string {
  return `quote:${cargoId}:${userId}`
}

function getUserId(request: NextRequest): string {
  // In production, extract from JWT or session
  const authHeader = request.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.split(' ')[1] || 'anonymous'
  }
  
  // Fallback to IP-based identification
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || 'unknown'
  return `user-${ip}`
}

function checkQuoteRateLimit(cargoId: string, userId: string): { allowed: boolean; retryAfter?: number } {
  const key = getQuoteRateLimitKey(cargoId, userId)
  const now = Date.now()
  const lastQuoteTime = quoteLimitStore.get(key)
  
  if (!lastQuoteTime) {
    quoteLimitStore.set(key, now)
    return { allowed: true }
  }
  
  const timeSinceLastQuote = now - lastQuoteTime
  if (timeSinceLastQuote < QUOTE_RATE_LIMIT_WINDOW) {
    const retryAfter = Math.ceil((QUOTE_RATE_LIMIT_WINDOW - timeSinceLastQuote) / 1000)
    return { allowed: false, retryAfter }
  }
  
  quoteLimitStore.set(key, now)
  return { allowed: true }
}

export async function POST(request: NextRequest) {
  try {
    const userId = getUserId(request)
    const body = await request.json()
    
    // Validate request body
    const validationResult = quoteRequestSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          details: validationResult.error.issues.map(issue => ({
            field: issue.path.join('.'),
            message: issue.message
          }))
        },
        { status: 400 }
      )
    }
    
    const { cargoId, price, message, source } = validationResult.data
    
    // Check rate limit
    const rateLimit = checkQuoteRateLimit(cargoId, userId)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded',
          message: `You can only send one quote per cargo every ${QUOTE_RATE_LIMIT_WINDOW / 1000} seconds`,
          retryAfter: rateLimit.retryAfter
        },
        { 
          status: 429,
          headers: {
            'Retry-After': rateLimit.retryAfter?.toString() || '30'
          }
        }
      )
    }

    // Create quote record
    const quoteData = {
      id: `quote-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      cargo_id: cargoId,
      transporter_id: userId,
      proposed_price: price,
      message: message || '',
      status: 'PENDING',
      created_ts: Date.now()
    }
    
    // Save to database
    const savedQuote = await offerDb.create(quoteData)
    
    // Log the quote for monitoring
    console.log(`Quote submitted: ${source} quote for cargo ${cargoId} by user ${userId} at €${price}`)
    
    // Return response
    const response = {
      id: savedQuote.id,
      cargoId,
      price,
      message,
      source,
      status: 'PENDING',
      createdAt: new Date(savedQuote.created_ts).toISOString(),
      estimatedResponseTime: '10-60 seconds'
    }
    
    return NextResponse.json(response, { status: 201 })
    
  } catch (error) {
    console.error('Error creating quote:', error)
    
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Failed to submit quote',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const cargoId = searchParams.get('cargoId')
    const userId = getUserId(request)
    
    if (!cargoId) {
      return NextResponse.json(
        { error: 'cargoId parameter is required' },
        { status: 400 }
      )
    }
    
    // Get quotes for the cargo
    const quotes = await offerDb.getByCargoId(cargoId)
    
    // Filter quotes for current user (privacy)
    const userQuotes = quotes.filter((quote: any) => quote.transporter_id === userId)
    
    // Transform data
    const transformedQuotes = userQuotes.map((quote: any) => ({
      id: quote.id,
      cargoId: quote.cargo_id,
      price: quote.proposed_price,
      message: quote.message,
      status: quote.status,
      createdAt: new Date(quote.created_ts).toISOString(),
      updatedAt: new Date(quote.created_ts).toISOString()
    }))
    
    return NextResponse.json({
      quotes: transformedQuotes,
      total: transformedQuotes.length,
      cargoId
    })
    
  } catch (error) {
    console.error('Error fetching quotes:', error)
    
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'Failed to fetch quotes',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}