import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { query } from '@/lib/db'

// Fix user endpoint - adds current user to users table
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    console.log('🔧 Adding current user to users table...', { userId })

    // Check if user already exists
    const existingUser = await query(
      'SELECT * FROM users WHERE clerk_id = $1',
      [userId]
    )
    
    if (existingUser.rows.length > 0) {
      console.log('✅ User already exists:', existingUser.rows[0])
      return NextResponse.json({
        success: true,
        message: 'User already exists',
        user: existingUser.rows[0]
      })
    }
    
    // Create new user
    const result = await query(`
      INSERT INTO users (
        clerk_id, name, email, role, rating, verified, 
        avatar, company, location, last_seen, is_online, created_ts
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
      ) RETURNING *
    `, [
      userId,
      'Current User', // Default name
      'user@fleetopia.co', // Default email  
      'CARGO_OWNER',
      5.0,
      true,
      'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
      'Your Company',
      'Your Location',
      Date.now(),
      true,
      Date.now()
    ])
    
    console.log('✅ User created successfully:', result.rows[0])
    
    // Update existing cargo to have proper sender_id
    const updateResult = await query(`
      UPDATE cargo 
      SET sender_id = $1 
      WHERE provider_name LIKE '%Test%' 
         OR provider_name = 'Unknown Provider'
         OR provider_name = 'Your Company'
         OR sender_id IS NULL
      RETURNING id, title, provider_name, sender_id
    `, [userId])
    
    console.log('✅ Updated cargo records:', updateResult.rows.length)
    
    return NextResponse.json({
      success: true,
      message: 'User added successfully!',
      user: result.rows[0],
      updatedCargo: updateResult.rows.length,
      cargoUpdated: updateResult.rows,
      nextSteps: [
        'Now refresh marketplace page',
        'Click on your cargo - should show Delete button',
        'Ownership logic should work correctly'
      ]
    })
    
  } catch (error: any) {
    console.error('❌ Error adding user:', error)
    return NextResponse.json({ 
      error: 'Failed to add user', 
      details: error?.message || 'Unknown error' 
    }, { status: 500 })
  }
}

export const dynamic = 'force-dynamic' 