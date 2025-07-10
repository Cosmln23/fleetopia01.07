import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { query } from '@/lib/db'

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Count unread messages for this user
    const result = await query(`
      SELECT COUNT(*) as count
      FROM chat_messages cm
      JOIN chat_conversations cc ON cm.conversation_id = cc.id
      WHERE (cc.user1_id = $1 OR cc.user2_id = $1)
        AND cm.sender_id != $1
        AND cm.read_at IS NULL
    `, [userId])

    const count = parseInt(result.rows[0]?.count || '0')

    return NextResponse.json({
      count,
      _meta: {
        timestamp: new Date().toISOString(),
        source: 'live_database',
        userId: userId
      }
    })

  } catch (error) {
    console.error('Error fetching unread messages count:', error)
    return NextResponse.json({ error: 'Failed to fetch unread messages count' }, { status: 500 })
  }
}