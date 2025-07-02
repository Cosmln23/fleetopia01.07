import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

export async function GET() {
  try {
    const { userId, sessionClaims } = await auth()
    const role = (sessionClaims?.publicMetadata as any)?.role
    
    // For carriers, return only their vehicles
    // For providers, return all available vehicles (for booking)
    const mockVehicles = [
      {
        id: 'vehicle_1',
        name: 'Fleet Alpha',
        licensePlate: 'ABC123',
        capacity: 25,
        status: 'ACTIVE',
        owner_id: userId || 'mock_carrier_1'
      }
    ]
    
    return NextResponse.json(mockVehicles)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch vehicles' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId, sessionClaims } = await auth()
    
    // Check authentication
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Check role authorization
    const role = (sessionClaims?.publicMetadata as any)?.role
    if (role !== 'carrier') {
      return NextResponse.json({ error: 'Forbidden - Only carriers can add vehicles' }, { status: 403 })
    }
    
    const body = await req.json()
    
    // TODO: Add proper validation schema for vehicles
    // For now, basic validation
    if (!body.name || !body.licensePlate || !body.capacity) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    
    // TODO: Save to real database when ready
    const newVehicle = {
      id: `vehicle_${Date.now()}`,
      ...body,
      owner_id: userId,
      status: 'ACTIVE',
      created_ts: Date.now()
    }
    
    console.log('✅ Vehicle added by carrier:', userId)
    
    return NextResponse.json(newVehicle, { status: 201 })
    
  } catch (error) {
    console.error('Error creating vehicle:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}