import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { query } from '@/lib/db'

// Debug endpoint to get current user info
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Check if user exists in our database
    const userResult = await query(
      'SELECT * FROM users WHERE clerk_id = $1',
      [userId]
    )

    return NextResponse.json({
      debug: true,
      clerkUserId: userId,
      existsInDatabase: userResult.rows.length > 0,
      databaseUser: userResult.rows[0] || null,
      message: userResult.rows.length > 0 
        ? 'User exists in database' 
        : 'User NOT FOUND in database - this is why ownership logic fails!',
      solution: userResult.rows.length === 0 
        ? `Run: node temp-fix-user.js with CLERK_USER_ID="${userId}"` 
        : 'User already exists, check other issues'
    })

  } catch (error) {
    console.error('❌ Debug user error:', error)
    return NextResponse.json({ error: 'Failed to get user info', details: error }, { status: 500 })
  }
}

export const dynamic = 'force-dynamic' 