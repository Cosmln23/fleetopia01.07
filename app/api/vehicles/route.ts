import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { vehicleDb } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const vehicles = await vehicleDb.getAll(userId)
    return NextResponse.json(vehicles)
  } catch (error) {
    console.error('Error fetching vehicles:', error)
    return NextResponse.json({ error: 'Failed to fetch vehicles' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    
    // Validation
    if (!body.name || !body.license_plate || !body.type) {
      return NextResponse.json({ 
        error: 'Name, license plate, and type are required' 
      }, { status: 400 })
    }

    const newVehicle = {
      id: `vehicle_${Date.now()}`,
      name: body.name,
      license_plate: body.license_plate,
      type: body.type,
      capacity: body.capacity || null,
      status: body.status || 'active',
      driver_name: body.driver_name || null,
      driver_phone: body.driver_phone || null,
      fuel_type: body.fuel_type || 'diesel',
      gps_device_id: body.gps_device_id || null,
      last_manual_lat: body.last_manual_lat || null,
      last_manual_lng: body.last_manual_lng || null,
      last_manual_location: body.last_manual_location || null,
      created_ts: Date.now(),
      updated_ts: Date.now()
    }

    const vehicle = await vehicleDb.create(newVehicle)
    
    return NextResponse.json(vehicle, { status: 201 })
  } catch (error) {
    console.error('Error creating vehicle:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}