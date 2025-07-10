import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getCargoDetails, getCargoOffers, updateCargoStatus } from '@/lib/marketplace'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const cargoId = params.id
    
    // Get cargo details using marketplace service
    const cargo = await getCargoDetails(cargoId)

    if (!cargo) {
      return NextResponse.json({ error: 'Cargo not found' }, { status: 404 })
    }

    // Get offers for this cargo
    const offers = await getCargoOffers(cargoId)

    // Transform to maintain backward compatibility
    const transformedCargo = {
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
      offers: offers.map(offer => ({
        id: offer.id,
        transporterId: offer.transporter_id,
        transporterName: offer.transporter_name,
        transporterCompany: offer.transporter_company,
        proposedPrice: offer.proposed_price,
        message: offer.message,
        status: offer.status,
        createdAt: offer.created_ts
      }))
    }

    return NextResponse.json({
      cargo: transformedCargo,
      _meta: {
        timestamp: new Date().toISOString(),
        source: process.env.USE_MOCK_MARKETPLACE === 'true' ? 'mock_data' : 'live_database',
        userId: userId
      }
    })

  } catch (error) {
    console.error('❌ API: GET /api/cargo/[id] error:', error)
    return NextResponse.json({ error: 'Failed to fetch cargo' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { userId, sessionClaims } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const cargoId = params.id
    const body = await req.json()

    // Check if cargo exists
    const cargo = await getCargoDetails(cargoId)
    if (!cargo) {
      return NextResponse.json({ error: 'Cargo not found' }, { status: 404 })
    }

    // Only allow status updates for now
    if (body.status) {
      const validStatuses = ['NEW', 'OPEN', 'TAKEN', 'IN_PROGRESS', 'COMPLETED']
      if (!validStatuses.includes(body.status)) {
        return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
      }
      
      const success = await updateCargoStatus(cargoId, body.status)
      if (!success) {
        return NextResponse.json({ error: 'Failed to update cargo status' }, { status: 500 })
      }
      
      // Get updated cargo details
      const updatedCargo = await getCargoDetails(cargoId)
      
      return NextResponse.json({
        cargo: {
          id: updatedCargo!.id,
          title: updatedCargo!.title,
          weight: updatedCargo!.weight,
          volume: updatedCargo!.volume,
          cargoType: updatedCargo!.type,
          urgency: updatedCargo!.urgency,
          fromAddress: updatedCargo!.from_addr,
          fromCity: updatedCargo!.from_city || '',
          fromPostal: updatedCargo!.from_postal || '',
          fromCountry: updatedCargo!.from_country,
          toAddress: updatedCargo!.to_addr,
          toCity: updatedCargo!.to_city || '',
          toPostal: updatedCargo!.to_postal || '',
          toCountry: updatedCargo!.to_country,
          fromLat: updatedCargo!.from_lat,
          fromLng: updatedCargo!.from_lng,
          toLat: updatedCargo!.to_lat,
          toLng: updatedCargo!.to_lng,
          loadingDate: updatedCargo!.load_date,
          deliveryDate: updatedCargo!.delivery_date,
          price: updatedCargo!.price,
          pricePerKg: updatedCargo!.price_per_kg,
          provider: updatedCargo!.provider_name,
          providerStatus: updatedCargo!.provider_status,
          status: updatedCargo!.status,
          postingDate: updatedCargo!.posting_date,
          createdAt: updatedCargo!.created_ts,
          updatedAt: updatedCargo!.updated_ts
        },
        _meta: {
          timestamp: new Date().toISOString(),
          source: process.env.USE_MOCK_MARKETPLACE === 'true' ? 'mock_data' : 'live_database',
          userId: userId,
          action: 'status_update'
        }
      })
    }

    return NextResponse.json({ error: 'No valid updates provided' }, { status: 400 })

  } catch (error) {
    console.error('❌ API: PATCH /api/cargo/[id] error:', error)
    return NextResponse.json({ error: 'Failed to update cargo' }, { status: 500 })
  }
}