import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { auth } from '@clerk/nextjs/server'
import { getCargoDetails, getCargoOffers, updateCargoStatus } from '@/lib/marketplace'

// GET single cargo
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const result = await query(
      'SELECT * FROM cargo WHERE id = $1',
      [params.id]
    )

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Cargo not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      cargo: result.rows[0]
    })
  } catch (error) {
    console.error('Error fetching cargo:', error)
    return NextResponse.json(
      { error: 'Failed to fetch cargo' },
      { status: 500 }
    )
  }
}

// DELETE cargo (only by owner)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // First check if cargo exists and user is the owner
    const cargoResult = await query(
      'SELECT * FROM cargo WHERE id = $1',
      [params.id]
    )

    if (cargoResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Cargo not found' },
        { status: 404 }
      )
    }

    const cargo = cargoResult.rows[0]
    
    // Check if user is the owner (assuming we have a user_id or sender_id field)
    // You might need to adjust this based on your actual schema
    const userResult = await query(
      'SELECT clerk_id FROM users WHERE name = $1 OR clerk_id = $2',
      [cargo.provider_name, userId]
    )

    const isOwner = userResult.rows.some(user => user.clerk_id === userId) || 
                   cargo.provider_name === userId // fallback check

    if (!isOwner) {
      return NextResponse.json(
        { error: 'Not authorized to delete this cargo' },
        { status: 403 }
      )
    }

    // Delete related records first (cascade should handle this, but being explicit)
    await query('DELETE FROM offer_requests WHERE cargo_id = $1', [params.id])
    await query('DELETE FROM chat_messages WHERE cargo_id = $1', [params.id])

    // Delete the cargo
    await query('DELETE FROM cargo WHERE id = $1', [params.id])

    return NextResponse.json({
      success: true,
      message: 'Cargo deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting cargo:', error)
    return NextResponse.json(
      { error: 'Failed to delete cargo' },
      { status: 500 }
    )
  }
}

export const dynamic = 'force-dynamic'