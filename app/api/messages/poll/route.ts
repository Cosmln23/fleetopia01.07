import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { auth } from '@clerk/nextjs/server'

// HTTP polling endpoint for WebSocket fallback on Vercel
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(request.url)
    const cargoId = url.searchParams.get('cargoId')
    const lastMessageId = url.searchParams.get('lastMessageId') || '0'

    if (!cargoId) {
      return NextResponse.json({ error: 'cargoId required' }, { status: 400 })
    }

    // Get new messages since lastMessageId from database
    const result = await query(`
      SELECT 
        id, content, sender_id as "senderId", sender_name as "senderName",
        message_type as "messageType", price_amount as "priceAmount",
        created_ts as timestamp, cargo_id as "cargoId"
      FROM chat_messages 
      WHERE cargo_id = $1 
        AND id > $2
        AND sender_id != $3
      ORDER BY created_ts ASC
      LIMIT 10
    `, [cargoId, lastMessageId, userId])

    const messages = result.rows.map(row => ({
      ...row,
      timestamp: new Date(Number(row.timestamp)).toISOString(),
      senderType: row.senderId === userId ? 'user' : 'shipper'
    }))

    // Also check for quote updates
    const quoteResult = await query(`
      SELECT 
        id as "quoteId", cargo_id as "cargoId", status,
        proposed_price as price, message, updated_ts as timestamp
      FROM offer_requests 
      WHERE cargo_id = $1 
        AND updated_ts > $2
      ORDER BY updated_ts DESC
      LIMIT 5
    `, [cargoId, Date.now() - 30000]) // Last 30 seconds

    const quoteUpdates = quoteResult.rows.map(row => ({
      ...row,
      timestamp: new Date(Number(row.timestamp)).toISOString()
    }))

    return NextResponse.json({
      success: true,
      messages,
      quoteUpdates,
      timestamp: new Date().toISOString(),
      lastPolled: Date.now()
    })
  } catch (error) {
    console.error('❌ Polling error:', error)
    return NextResponse.json(
      { error: 'Failed to poll messages' },
      { status: 500 }
    )
  }
}

export const dynamic = 'force-dynamic' 