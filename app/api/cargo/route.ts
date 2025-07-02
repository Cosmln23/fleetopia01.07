import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { cargoCreateSchema } from '@/lib/zodSchemas'

export async function GET() {
  try {
    // Return mock cargo for now - will be replaced with real DB query
    const mockCargo = [
      {
        id: '1',
        title: 'Electronics Shipment',
        weight: 1500,
        from: 'Amsterdam',
        to: 'Bucharest',
        provider_id: 'mock_provider_1'
      }
    ]
    
    return NextResponse.json(mockCargo)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch cargo' }, { status: 500 })
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
    if (role !== 'provider') {
      return NextResponse.json({ error: 'Forbidden - Only providers can create cargo' }, { status: 403 })
    }
    
    const body = await req.json()
    
    // Validate request body
    const validation = cargoCreateSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json({ 
        error: 'Invalid data', 
        details: validation.error.issues 
      }, { status: 400 })
    }
    
    const cargoData = validation.data
    
    // TODO: Save to real database when ready
    // For now, return mock response with provider_id
    const newCargo = {
      id: `cargo_${Date.now()}`,
      ...cargoData,
      provider_id: userId,
      status: 'NEW',
      created_ts: Date.now()
    }
    
    console.log('✅ Cargo created by provider:', userId)
    
    return NextResponse.json(newCargo, { status: 201 })
    
  } catch (error) {
    console.error('Error creating cargo:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}