import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { gpsDb } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(req.url)
    const freeOnly = url.searchParams.get('free') === '1'
    
    const devices = await gpsDb.getAll(freeOnly)
    
    return NextResponse.json(devices)
  } catch (error) {
    console.error('Error fetching GPS devices:', error)
    return NextResponse.json({ error: 'Failed to fetch GPS devices' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    
    // Basic validation
    if (!body.label || !body.imei) {
      return NextResponse.json({ error: 'Label and IMEI are required' }, { status: 400 })
    }
    
    const newDevice = {
      id: `gps_${Date.now()}`,
      label: body.label,
      imei: body.imei,
      api_key: body.api_key || null,
      created_ts: Date.now(),
      updated_ts: Date.now()
    }
    
    const device = await gpsDb.create(newDevice)
    
    return NextResponse.json(device, { status: 201 })
  } catch (error) {
    console.error('Error creating GPS device:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}