import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { offerRequestSchema } from '@/lib/zodSchemas'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const cargoId = searchParams.get('cargoId')
    
    // Return mock quotes for now - will be replaced with real DB query
    const mockQuotes = [
      {
        id: 'quote_1',
        cargo_id: cargoId || '1',
        carrier_id: 'mock_carrier_1',
        proposed_price: 850,
        status: 'PENDING'
      }
    ]
    
    return NextResponse.json(mockQuotes)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch quotes' }, { status: 500 })
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
    if (role !== 'carrier') {
      return NextResponse.json({ error: 'Forbidden - Only carriers can send quotes' }, { status: 403 })
    }
    
    const body = await req.json()
    
    // Validate request body
    const validation = offerRequestSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json({ 
        error: 'Invalid data', 
        details: validation.error.issues 
      }, { status: 400 })
    }
    
    const quoteData = validation.data
    
    // TODO: Save to real database when ready
    // For now, return mock response with carrier_id
    const newQuote = {
      id: `quote_${Date.now()}`,
      ...quoteData,
      carrier_id: userId,
      status: 'PENDING',
      created_ts: Date.now()
    }
    
    console.log('✅ Quote sent by carrier:', userId)
    
    return NextResponse.json(newQuote, { status: 201 })
    
  } catch (error) {
    console.error('Error creating quote:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}