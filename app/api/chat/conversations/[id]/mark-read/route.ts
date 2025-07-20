import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { query } from '@/lib/db'

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth()
    
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

    // Mark all messages from other participants as read
    await query(`
      UPDATE chat_messages 
      SET read = true 
      WHERE conversation_id = $1 
      AND sender_id != $2 
      AND read = false
    `, [conversationId, userId])

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error marking messages as read:', error)
    return NextResponse.json(
      { error: 'Failed to mark messages as read' },
      { status: 500 }
    )
  }
}

export const dynamic = 'force-dynamic'