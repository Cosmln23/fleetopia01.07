import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { submitOffer, getCargoDetails } from '@/lib/marketplace'
import { query } from '@/lib/db'

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId, sessionClaims } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Check role authorization
    const role = (sessionClaims?.publicMetadata as any)?.role
    if (role !== 'carrier') {
      return NextResponse.json({ error: 'Forbidden - Only carriers can submit offers' }, { status: 403 })
    }
    
    const cargoId = params.id
    const body = await req.json()
    
    // Validate required fields
    if (!body.proposedPrice || typeof body.proposedPrice !== 'number') {
      return NextResponse.json({ error: 'Proposed price is required and must be a number' }, { status: 400 })
    }
    
    if (body.proposedPrice <= 0) {
      return NextResponse.json({ error: 'Proposed price must be greater than 0' }, { status: 400 })
    }
    
    // Check if cargo exists
    const cargo = await getCargoDetails(cargoId)
    if (!cargo) {
      return NextResponse.json({ error: 'Cargo not found' }, { status: 404 })
    }
    
    // Check if cargo is still available for offers
    if (cargo.status !== 'NEW' && cargo.status !== 'OPEN') {
      return NextResponse.json({ error: 'Cargo is no longer available for offers' }, { status: 400 })
    }
    
    // Get user details for offer
    const userResult = await query('SELECT name, company FROM users WHERE clerk_id = $1', [userId])
    const userInfo = userResult.rows[0] || {}
    
    // Build offer data
    const offerData = {
      cargo_id: cargoId,
      transporter_id: userId,
      proposed_price: body.proposedPrice,
      message: body.message || `Offer from ${userInfo.name || 'Professional Carrier'}`
    }
    
    // Submit offer using marketplace service
    const createdOffer = await submitOffer(offerData)
    
    console.log('✅ API: Offer submitted successfully:', createdOffer.id)
    
    // Transform response to maintain backward compatibility
    const responseData = {
      id: createdOffer.id,
      cargoId: createdOffer.cargo_id,
      transporterId: createdOffer.transporter_id,
      proposedPrice: createdOffer.proposed_price,
      message: createdOffer.message,
      status: createdOffer.status,
      createdAt: createdOffer.created_ts,
      transporter: {
        id: userId,
        name: userInfo.name || 'Professional Carrier',
        company: userInfo.company || 'Independent Carrier'
      }
    }
    
    return NextResponse.json(responseData, { status: 201 })
    
  } catch (error) {
    console.error('❌ API: POST /api/cargo/[id]/offer error:', error)
    
    // Handle specific error types
    if (error.message.includes('already exists')) {
      return NextResponse.json({ error: 'You have already submitted an offer for this cargo' }, { status: 409 })
    }
    
    if (error.message.includes('not found')) {
      return NextResponse.json({ error: 'Cargo not found' }, { status: 404 })
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const cargoId = params.id
    
    // Check if cargo exists
    const cargo = await getCargoDetails(cargoId)
    if (!cargo) {
      return NextResponse.json({ error: 'Cargo not found' }, { status: 404 })
    }
    
    // Get offers for this cargo from marketplace service
    const offers = await getCargoOffers(cargoId)
    
    // Transform offers to maintain backward compatibility
    const transformedOffers = offers.map(offer => ({
      id: offer.id,
      cargoId: offer.cargo_id,
      transporterId: offer.transporter_id,
      proposedPrice: offer.proposed_price,
      message: offer.message,
      status: offer.status,
      createdAt: offer.created_ts,
      transporter: {
        id: offer.transporter_id,
        name: offer.transporter_name || 'Professional Carrier',
        company: offer.transporter_company || 'Independent Carrier'
      }
    }))
    
    return NextResponse.json({
      offers: transformedOffers,
      pagination: {
        total: transformedOffers.length,
        count: transformedOffers.length
      },
      _meta: {
        timestamp: new Date().toISOString(),
        source: process.env.USE_MOCK_MARKETPLACE === 'true' ? 'mock_data' : 'live_database',
        userId: userId,
        cargoId: cargoId
      }
    })
    
  } catch (error) {
    console.error('❌ API: GET /api/cargo/[id]/offer error:', error)
    return NextResponse.json({ error: 'Failed to fetch offers' }, { status: 500 })
  }
}