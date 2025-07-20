import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { query } from '@/lib/db'

export async function GET() {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all conversations for the current user
    const conversationsResult = await query(`
      SELECT DISTINCT
        c.id,
        c.cargo_id,
        c.participant1_id,
        c.participant1_name,
        c.participant1_avatar,
        c.participant2_id,
        c.participant2_name,
        c.participant2_avatar,
        c.created_at,
        c.updated_at,
        cargo.title as cargo_title,
        (
          SELECT COUNT(*)
          FROM chat_messages cm
          WHERE cm.conversation_id = c.id
          AND cm.sender_id != $1
          AND cm.read = false
        ) as unread_count,
        (
          SELECT json_build_object(
            'id', cm.id,
            'senderId', cm.sender_id,
            'content', cm.content,
            'timestamp', cm.created_ts,
            'read', cm.read
          )
          FROM chat_messages cm
          WHERE cm.conversation_id = c.id
          ORDER BY cm.created_ts DESC
          LIMIT 1
        ) as last_message
      FROM conversations c
      LEFT JOIN cargo ON c.cargo_id = cargo.id
      WHERE c.participant1_id = $1 OR c.participant2_id = $1
      ORDER BY c.updated_at DESC
    `, [userId])

    const conversations = conversationsResult.rows.map(row => {
      // Determine the other participant
      const isParticipant1 = row.participant1_id === userId
      const otherParticipant = {
        id: isParticipant1 ? row.participant2_id : row.participant1_id,
        name: isParticipant1 ? row.participant2_name : row.participant1_name,
        avatar: isParticipant1 ? row.participant2_avatar : row.participant1_avatar,
        isOnline: true // Default to online for now, can be enhanced later
      }

      return {
        id: row.id,
        participants: [
          {
            id: userId,
            name: isParticipant1 ? row.participant1_name : row.participant2_name,
            avatar: isParticipant1 ? row.participant1_avatar : row.participant2_avatar,
            isOnline: true
          },
          otherParticipant
        ],
        lastMessage: row.last_message,
        unreadCount: parseInt(row.unread_count) || 0,
        updatedAt: row.updated_at,
        cargoId: row.cargo_id,
        cargoTitle: row.cargo_title
      }
    })

    return NextResponse.json(conversations)

  } catch (error) {
    console.error('Error fetching conversations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch conversations' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { participantId, participantName, cargoId } = await request.json()

    if (!participantId || !participantName) {
      return NextResponse.json(
        { error: 'Participant ID and name are required' },
        { status: 400 }
      )
    }

    // Check if conversation already exists
    const existingConversation = await query(`
      SELECT id FROM conversations
      WHERE (participant1_id = $1 AND participant2_id = $2)
         OR (participant1_id = $2 AND participant2_id = $1)
      ${cargoId ? 'AND cargo_id = $3' : ''}
      LIMIT 1
    `, cargoId ? [userId, participantId, cargoId] : [userId, participantId])

    if (existingConversation.rows.length > 0) {
      return NextResponse.json({
        id: existingConversation.rows[0].id,
        existed: true
      })
    }

    // Get current user info from Clerk
    const currentUserResult = await query(`
      SELECT name FROM users WHERE clerk_id = $1 LIMIT 1
    `, [userId])

    const currentUserName = currentUserResult.rows[0]?.name || 'Unknown User'

    // Create new conversation
    const conversationId = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    await query(`
      INSERT INTO conversations (
        id, 
        participant1_id, 
        participant1_name,
        participant2_id, 
        participant2_name,
        cargo_id,
        created_at,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
    `, [conversationId, userId, currentUserName, participantId, participantName, cargoId])

    return NextResponse.json({
      id: conversationId,
      existed: false
    })

  } catch (error) {
    console.error('Error creating conversation:', error)
    return NextResponse.json(
      { error: 'Failed to create conversation' },
      { status: 500 }
    )
  }
}

export const dynamic = 'force-dynamic'