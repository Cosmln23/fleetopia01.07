import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { query } from '@/lib/db'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const conversationId = params.id

    // Get conversation details and verify user has access
    const conversationResult = await query(`
      SELECT 
        c.*,
        cargo.title as cargo_title
      FROM conversations c
      LEFT JOIN cargo ON c.cargo_id = cargo.id
      WHERE c.id = $1 
      AND (c.participant1_id = $2 OR c.participant2_id = $2)
    `, [conversationId, userId])

    if (conversationResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Conversation not found or access denied' },
        { status: 404 }
      )
    }

    const row = conversationResult.rows[0]
    const isParticipant1 = row.participant1_id === userId

    const conversation = {
      id: row.id,
      participants: [
        {
          id: row.participant1_id,
          name: row.participant1_name,
          avatar: row.participant1_avatar,
          isOnline: true
        },
        {
          id: row.participant2_id,
          name: row.participant2_name,
          avatar: row.participant2_avatar,
          isOnline: true
        }
      ],
      cargoId: row.cargo_id,
      cargoTitle: row.cargo_title,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }

    return NextResponse.json(conversation)

  } catch (error) {
    console.error('Error fetching conversation:', error)
    return NextResponse.json(
      { error: 'Failed to fetch conversation' },
      { status: 500 }
    )
  }
}

export const dynamic = 'force-dynamic'