import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { query } from '@/lib/db'

// GET single cargo by ID
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

    // Get cargo details with sender info
    const result = await query(`
      SELECT 
        c.*,
        u.clerk_id as sender_clerk_id, u.name as sender_name, u.email as sender_email, 
        u.avatar as sender_avatar, u.company as sender_company, u.verified as sender_verified, 
        u.rating as sender_rating
      FROM cargo c
      LEFT JOIN users u ON c.sender_id = u.clerk_id
      WHERE c.id = $1
    `, [cargoId])

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Cargo not found' }, { status: 404 })
    }

    const cargo = result.rows[0]

    // Transform to match UI expectations
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
      sender: cargo.sender_clerk_id ? {
        id: cargo.sender_clerk_id,
        name: cargo.sender_name,
        email: cargo.sender_email,
        avatar: cargo.sender_avatar,
        company: cargo.sender_company,
        verified: cargo.sender_verified || false,
        rating: cargo.sender_rating || 0
      } : null
    }

    return NextResponse.json({
      success: true,
      cargo: transformedCargo
    })

  } catch (error: any) {
    console.error('❌ API: GET /api/cargo/[id] error:', error)
    return NextResponse.json({ error: 'Failed to fetch cargo' }, { status: 500 })
  }
}

// DELETE cargo by ID
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const cargoId = params.id

    // Check if cargo exists and user is the owner
    const cargoResult = await query(
      'SELECT * FROM cargo WHERE id = $1',
      [cargoId]
    )

    if (cargoResult.rows.length === 0) {
      return NextResponse.json({ error: 'Cargo not found' }, { status: 404 })
    }

    const cargo = cargoResult.rows[0]

    // Check ownership - user must be the sender
    if (cargo.sender_id !== userId) {
      return NextResponse.json({ 
        error: 'Forbidden - you can only delete your own cargo',
        debug: {
          cargoSenderId: cargo.sender_id,
          currentUserId: userId,
          match: cargo.sender_id === userId
        }
      }, { status: 403 })
    }

    // Delete the cargo
    await query('DELETE FROM cargo WHERE id = $1', [cargoId])

    console.log('✅ Cargo deleted successfully:', { cargoId, userId })

    return NextResponse.json({
      success: true,
      message: 'Cargo deleted successfully',
      deletedId: cargoId
    })

  } catch (error: any) {
    console.error('❌ API: DELETE /api/cargo/[id] error:', error)
    return NextResponse.json({ 
      error: 'Failed to delete cargo',
      details: error?.message || 'Unknown error'
    }, { status: 500 })
  }
}

export const dynamic = 'force-dynamic'