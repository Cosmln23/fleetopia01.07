import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { query } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const cargoId = searchParams.get('cargoId')
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    let whereClause = 'WHERE 1=1'
    const params: any[] = []
    let paramIndex = 1

    if (cargoId) {
      whereClause += ` AND o.cargo_id = $${paramIndex}`
      params.push(cargoId)
      paramIndex++
    }

    if (status) {
      whereClause += ` AND o.status = $${paramIndex}`
      params.push(status)
      paramIndex++
    }

    // Get quotes with cargo and user info
    const result = await query(`
      SELECT 
        o.*,
        c.title as cargo_title,
        c.from_addr as cargo_from,
        c.to_addr as cargo_to,
        c.price as cargo_price,
        c.weight as cargo_weight,
        u.name as transporter_name,
        u.email as transporter_email,
        u.avatar as transporter_avatar
      FROM offer_requests o
      LEFT JOIN cargo c ON o.cargo_id = c.id
      LEFT JOIN users u ON o.transporter_id = u.id
      ${whereClause}
      ORDER BY o.created_ts DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `, [...params, limit, offset])

    const quotes = result.rows.map(row => ({
      id: row.id,
      cargoId: row.cargo_id,
      transporterId: row.transporter_id,
      proposedPrice: row.proposed_price,
      message: row.message,
      status: row.status,
      createdAt: row.created_ts,
      updatedAt: row.updated_ts,
      source: row.source || 'manual',
      // Cargo info
      cargo: {
        id: row.cargo_id,
        title: row.cargo_title,
        from: row.cargo_from,
        to: row.cargo_to,
        price: row.cargo_price,
        weight: row.cargo_weight
      },
      // Transporter info
      transporter: {
        id: row.transporter_id,
        name: row.transporter_name,
        email: row.transporter_email,
        avatar: row.transporter_avatar
      }
    }))

    return NextResponse.json({
      quotes,
      pagination: {
        limit,
        offset,
        total: quotes.length
      },
      _meta: {
        timestamp: new Date().toISOString(),
        source: 'live_database',
        userId: userId
      }
    })

  } catch (error) {
    console.error('Error fetching quotes:', error)
    return NextResponse.json({ error: 'Failed to fetch quotes' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { cargoId, proposedPrice, message, source = 'manual' } = body

    if (!cargoId || !proposedPrice) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Check if cargo exists
    const cargoResult = await query('SELECT id FROM cargo WHERE id = $1', [cargoId])
    if (cargoResult.rows.length === 0) {
      return NextResponse.json({ error: 'Cargo not found' }, { status: 404 })
    }

    // Create quote
    const quoteId = `quote_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const timestamp = Date.now()

    const result = await query(`
      INSERT INTO offer_requests (
        id, cargo_id, transporter_id, proposed_price, message, 
        status, source, created_ts, updated_ts
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `, [
      quoteId, cargoId, userId, proposedPrice, message,
      'pending', source, timestamp, timestamp
    ])

    const newQuote = result.rows[0]

    // Create notification for cargo owner
    const notificationId = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    await query(`
      INSERT INTO notifications (
        id, user_id, type, title, message, 
        related_id, created_ts, read_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `, [
      notificationId,
      cargoResult.rows[0].sender_id,
      'quote_received',
      'New Quote Received',
      `You received a quote of €${proposedPrice} for your cargo`,
      quoteId,
      timestamp,
      null
    ])

    return NextResponse.json({
      quote: {
        id: newQuote.id,
        cargoId: newQuote.cargo_id,
        transporterId: newQuote.transporter_id,
        proposedPrice: newQuote.proposed_price,
        message: newQuote.message,
        status: newQuote.status,
        source: newQuote.source,
        createdAt: newQuote.created_ts,
        updatedAt: newQuote.updated_ts
      },
      _meta: {
        timestamp: new Date().toISOString(),
        source: 'live_database',
        userId: userId,
        action: 'quote_created'
      }
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating quote:', error)
    return NextResponse.json({ error: 'Failed to create quote' }, { status: 500 })
  }
}