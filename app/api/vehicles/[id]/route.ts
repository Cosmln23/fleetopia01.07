import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { vehicleDb } from '@/lib/db'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const vehicle = await vehicleDb.getById(params.id)
    
    if (!vehicle) {
      return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 })
    }

    return NextResponse.json(vehicle)
  } catch (error) {
    console.error('Error fetching vehicle:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    
    // Check if vehicle exists
    const existingVehicle = await vehicleDb.getById(params.id)
    if (!existingVehicle) {
      return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 })
    }

    const updatedVehicle = await vehicleDb.update(params.id, body)
    
    return NextResponse.json(updatedVehicle)
  } catch (error) {
    console.error('Error updating vehicle:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const vehicle = await vehicleDb.delete(params.id)
    
    if (!vehicle) {
      return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 })
    }

    return NextResponse.json({ message: 'Vehicle deleted successfully' })
  } catch (error) {
    console.error('Error deleting vehicle:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    
    // Handle manual location updates
    if (body.last_manual_lat && body.last_manual_lng) {
      const vehicle = await vehicleDb.updateManualLocation(
        params.id,
        body.last_manual_lat,
        body.last_manual_lng,
        body.last_manual_location || 'Manual location'
      )
      
      if (!vehicle) {
        return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 })
      }
      
      return NextResponse.json(vehicle)
    }

    return NextResponse.json({ error: 'Invalid update data' }, { status: 400 })
  } catch (error) {
    console.error('Error updating vehicle location:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}