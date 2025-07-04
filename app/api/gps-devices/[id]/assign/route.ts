import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { gpsDb } from '@/lib/db'

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
    const { vehicle_id } = body
    
    if (!vehicle_id) {
      return NextResponse.json({ error: 'vehicle_id is required' }, { status: 400 })
    }
    
    // Check if GPS device exists and is free
    const gpsDevice = await gpsDb.getById(params.id)
    if (!gpsDevice) {
      return NextResponse.json({ error: 'GPS device not found' }, { status: 404 })
    }
    
    if (gpsDevice.assigned) {
      return NextResponse.json({ error: 'GPS device is already assigned' }, { status: 400 })
    }
    
    const updatedDevice = await gpsDb.assign(params.id, vehicle_id)
    
    return NextResponse.json({ 
      success: true,
      gps_device: updatedDevice,
      vehicle_id: vehicle_id
    })
  } catch (error) {
    console.error('Error assigning GPS device:', error)
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
    
    const updatedDevice = await gpsDb.unassign(params.id)
    
    return NextResponse.json({ 
      success: true,
      gps_device: updatedDevice
    })
  } catch (error) {
    console.error('Error unassigning GPS device:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}