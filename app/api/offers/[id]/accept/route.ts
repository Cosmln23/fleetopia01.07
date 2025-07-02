// app/api/offers/[id]/accept/route.ts
import { NextRequest } from 'next/server'
import { getSettings } from '@/lib/serverSettings'
import { findFreeVehicle } from '@/lib/assignVehicle'

// Mock data pentru offers (în realitate ar fi din database)
const mockOffers = [
  {
    id: 'offer_001',
    cargoOfferId: '123456',
    transporterId: 'transporter_001',
    proposedPrice: 850,
    message: 'Pot livra în 48 ore',
    status: 'PENDING'
  },
  {
    id: 'offer_002', 
    cargoOfferId: '234567',
    transporterId: 'transporter_002',
    proposedPrice: 1200,
    status: 'PENDING'
  }
]

// Mock data pentru cargo (în realitate ar fi din database)
const mockCargo = [
  {
    id: '123456',
    weight: 566,
    status: 'OPEN',
    vehicleId: null as string | null
  },
  {
    id: '234567',
    weight: 1200,
    status: 'OPEN', 
    vehicleId: null as string | null
  }
]

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const offerId = params.id

  try {
    // 1. Găsește oferta
    const offer = mockOffers.find(o => o.id === offerId)
    if (!offer) {
      return new Response('Offer not found', { status: 404 })
    }

    // 2. Găsește cargo-ul asociat
    const cargo = mockCargo.find(c => c.id === offer.cargoOfferId)
    if (!cargo) {
      return new Response('Cargo not found', { status: 404 })
    }

    // 3. Citește setările de pe server
    const settings = getSettings()
    let vehicleId: string | null = null

    // 4. Dacă auto-assign e activ, încearcă să găsească un vehicul
    if (settings.autoAssign) {
      vehicleId = findFreeVehicle(cargo.weight)
    }

    // 5. Actualizează statusurile (în mock)
    offer.status = 'ACCEPTED'
    cargo.status = 'ACCEPTED'
    cargo.vehicleId = vehicleId

    console.log(`✅ Offer ${offerId} accepted`)
    if (vehicleId) {
      console.log(`🚛 Auto-assigned vehicle: ${vehicleId}`)
    } else if (settings.autoAssign) {
      console.log(`⚠️ Auto-assign enabled but no vehicle available`)
    }

    return Response.json({ 
      ok: true, 
      offer: offer,
      cargo: cargo,
      vehicle: vehicleId,
      autoAssignEnabled: settings.autoAssign
    })

  } catch (error) {
    console.error('Error accepting offer:', error)
    return new Response('Internal server error', { status: 500 })
  }
}