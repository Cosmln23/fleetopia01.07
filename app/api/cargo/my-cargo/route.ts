import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { query } from '@/lib/db'

// GET user's cargo
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user info to match with cargo provider
    const userResult = await query(
      'SELECT name, company FROM users WHERE clerk_id = $1',
      [userId]
    )
    
    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    
    const userInfo = userResult.rows[0]
    
    // Get cargo where user is the provider
    const cargoResult = await query(`
      SELECT 
        id, title, weight, price, status, created_ts, 
        from_addr, to_addr, from_country, to_country,
        provider_name, urgency, type as cargo_type
      FROM cargo 
      WHERE provider_name = $1 OR provider_name = $2
      ORDER BY created_ts DESC
    `, [userInfo.name, userInfo.company || userInfo.name])

    // Transform to match UI expectations
    const transformedCargo = cargoResult.rows.map(cargo => ({
      id: cargo.id,
      title: cargo.title,
      weight: cargo.weight,
      price: cargo.price,
      status: cargo.status,
      fromAddress: cargo.from_addr,
      toAddress: cargo.to_addr,
      fromCountry: cargo.from_country,
      toCountry: cargo.to_country,
      provider: cargo.provider_name,
      urgency: cargo.urgency,
      cargoType: cargo.cargo_type,
      createdAt: new Date(cargo.created_ts).toISOString()
    }))

    return NextResponse.json({
      success: true,
      cargo: transformedCargo,
      _meta: {
        timestamp: new Date().toISOString(),
        userId: userId,
        count: transformedCargo.length
      }
    })

  } catch (error) {
    console.error('❌ API: GET /api/cargo/my-cargo error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user cargo' },
      { status: 500 }
    )
  }
}

export const dynamic = 'force-dynamic'