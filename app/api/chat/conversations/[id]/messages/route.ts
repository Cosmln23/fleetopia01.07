import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { query } from '@/lib/db'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const conversationId = params.id

    // Verify user has access to this conversation
    const accessCheck = await query(`
      SELECT id FROM conversations
      WHERE id = $1 AND (participant1_id = $2 OR participant2_id = $2)
    `, [conversationId, userId])

    if (accessCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'Conversation not found or access denied' },
        { status: 404 }
      )
    }

    // Get messages for this conversation
    const messagesResult = await query(`
      SELECT 
        cm.id,
        cm.sender_id,
        cm.sender_name,
        cm.content,
        cm.message_type,
        cm.price_amount,
        cm.created_ts,
        cm.read,
        u.avatar as sender_avatar
      FROM chat_messages cm
      LEFT JOIN users u ON cm.sender_id = u.clerk_id
      WHERE cm.conversation_id = $1
      ORDER BY cm.created_ts ASC
    `, [conversationId])

    const messages = messagesResult.rows.map(row => ({
      id: row.id,
      senderId: row.sender_id,
      senderName: row.sender_name,
      senderAvatar: row.sender_avatar,
      content: row.content,
      timestamp: new Date(Number(row.created_ts)).toISOString(),
      read: row.read,
      type: row.message_type || 'text',
      priceAmount: row.price_amount
    }))

    return NextResponse.json(messages)

  } catch (error) {
    console.error('Error fetching messages:', error)
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const conversationId = params.id
    const { content, type = 'text', priceAmount } = await request.json()

    if (!content || !content.trim()) {
      return NextResponse.json(
        { error: 'Message content is required' },
        { status: 400 }
      )
    }

    // Verify user has access to this conversation
    const accessCheck = await query(`
      SELECT id FROM conversations
      WHERE id = $1 AND (participant1_id = $2 OR participant2_id = $2)
    `, [conversationId, userId])

    if (accessCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'Conversation not found or access denied' },
        { status: 404 }
      )
    }

    // Get user info
    const userResult = await query(`
      SELECT name FROM users WHERE clerk_id = $1 LIMIT 1
    `, [userId])

    const senderName = userResult.rows[0]?.name || 'Unknown User'

    // Create message
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const timestamp = Date.now()

    await query(`
      INSERT INTO chat_messages (
        id,
        conversation_id,
        sender_id,
        sender_name,
        content,
        message_type,
        price_amount,
        created_ts,
        read
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, false)
    `, [messageId, conversationId, userId, senderName, content.trim(), type, priceAmount, timestamp])

    // Update conversation timestamp
    await query(`
      UPDATE conversations 
      SET updated_at = NOW() 
      WHERE id = $1
    `, [conversationId])

    const newMessage = {
      id: messageId,
      senderId: userId,
      senderName: senderName,
      content: content.trim(),
      timestamp: new Date(timestamp).toISOString(),
      read: false,
      type: type,
      priceAmount: priceAmount
    }

    return NextResponse.json(newMessage)

  } catch (error) {
    console.error('Error sending message:', error)
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    )
  }
}