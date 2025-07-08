import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { query } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Count unread notifications for this user
    const result = await query(`
      SELECT COUNT(*) as count
      FROM notifications
      WHERE user_id = $1
        AND read_at IS NULL
        AND created_ts > (EXTRACT(EPOCH FROM NOW() - INTERVAL '7 days') * 1000)
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
    console.error('Error fetching unread notifications count:', error)
    return NextResponse.json({ error: 'Failed to fetch unread notifications count' }, { status: 500 })
  }
}