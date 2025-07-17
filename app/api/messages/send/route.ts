import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { auth } from '@clerk/nextjs/server'

// HTTP send endpoint for WebSocket fallback on Vercel
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { event, data } = await request.json()
    
    console.log(`📤 HTTP fallback - Event: ${event}`, data)
    
    if (event === 'send-chat-message') {
      const { cargoId, content, messageType, priceAmount } = data
      
      if (!cargoId || !content) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
      }

      // Get user name for the message
      const userResult = await query('SELECT name FROM users WHERE clerk_id = $1', [userId])
      const userName = userResult.rows[0]?.name || 'Unknown User'

      // Store message in database
      const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      const timestamp = Date.now()

      await query(`
        INSERT INTO chat_messages (
          id, cargo_id, sender_id, sender_name, content, 
          message_type, price_amount, created_ts
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [
        messageId, cargoId, userId, userName, content,
        messageType || 'text', priceAmount || null, timestamp
      ])

      return NextResponse.json({
        success: true,
        messageId,
        timestamp: new Date().toISOString(),
        message: 'Message sent successfully'
      })
    }
    
    if (event === 'send-quote') {
      const { cargoId, price, message } = data
      
      if (!cargoId || !price) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
      }

      // Create quote in database
      const quoteId = `quote_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      const timestamp = Date.now()

      await query(`
        INSERT INTO offer_requests (
          id, cargo_id, transporter_id, proposed_price, message, 
          status, source, created_ts, updated_ts
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [
        quoteId, cargoId, userId, price, message || '',
        'pending', 'manual', timestamp, timestamp
      ])

      // Also create a chat message for the quote
      const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      const userResult = await query('SELECT name FROM users WHERE clerk_id = $1', [userId])
      const userName = userResult.rows[0]?.name || 'Unknown User'

      await query(`
        INSERT INTO chat_messages (
          id, cargo_id, sender_id, sender_name, content, 
          message_type, price_amount, created_ts
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [
        messageId, cargoId, userId, userName, `Quote: €${price}`,
        'quote', price, timestamp
      ])

      return NextResponse.json({
        success: true,
        quoteId,
        messageId,
        timestamp: new Date().toISOString(),
        message: 'Quote sent successfully'
      })
    }

    // Handle other events
    return NextResponse.json({
      success: true,
      messageId: `msg_${Date.now()}`,
      timestamp: new Date().toISOString(),
      message: `Event ${event} processed`
    })
  } catch (error) {
    console.error('❌ Send message error:', error)
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    )
  }
}

export const dynamic = 'force-dynamic' 