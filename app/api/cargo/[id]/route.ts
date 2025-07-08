import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { cargoDb } from '@/lib/db'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const cargoId = params.id
    const cargo = await cargoDb.getById(cargoId)

    if (!cargo) {
      return NextResponse.json({ error: 'Cargo not found' }, { status: 404 })
    }

    // Transform database result to match expected format
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
    }

    return NextResponse.json({
      cargo: transformedCargo,
      _meta: {
        timestamp: new Date().toISOString(),
        source: 'live_database',
        userId: userId
      }
    })

  } catch (error) {
    console.error('Error fetching cargo by ID:', error)
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

    // Check if user owns this cargo or is admin
    const cargo = await cargoDb.getById(cargoId)
    if (!cargo) {
      return NextResponse.json({ error: 'Cargo not found' }, { status: 404 })
    }

    const role = (sessionClaims?.publicMetadata as any)?.role
    if (cargo.sender_id !== userId && role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Can only update own cargo' }, { status: 403 })
    }

    // Update cargo status
    if (body.status) {
      const updatedCargo = await cargoDb.updateStatus(cargoId, body.status)
      return NextResponse.json({
        cargo: updatedCargo,
        _meta: {
          timestamp: new Date().toISOString(),
          source: 'live_database',
          userId: userId,
          action: 'status_update'
        }
      })
    }

    return NextResponse.json({ error: 'No valid updates provided' }, { status: 400 })

  } catch (error) {
    console.error('Error updating cargo:', error)
    return NextResponse.json({ error: 'Failed to update cargo' }, { status: 500 })
  }
}