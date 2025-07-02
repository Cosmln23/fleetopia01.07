// app/api/stats/route.ts
import { NextRequest } from 'next/server'
import { fleetMockApi } from '@/lib/__mocks__/fleet-mock-data'

export async function GET(req: NextRequest) {
  try {
    // Pentru moment folosim mock data până implementăm database-ul complet
    // În viitor aceste valori vor veni din queries SQL reale
    
    // Simulare metrici agent bazate pe activitate mock
    const mockStats = {
      // Total suggestions generate de agent (L0-L4)
      suggestions: Math.floor(Math.random() * 50) + 20, // 20-70
      
      // Cursele acceptate (din marketplace)
      accepted: Math.floor(Math.random() * 15) + 5, // 5-20
      
      // Profitul mediu % - simulat între 10-25%
      avgProfit: Number((Math.random() * 15 + 10).toFixed(1)), // 10.0-25.0%
      
      // Vehicule active din fleet
      activeVehicles: fleetMockApi.getVehicles().filter(v => v.status === 'ACTIVE').length
    }

    // Pentru demo - să păstrăm consistența între request-uri pentru o sesiune
    const sessionKey = req.headers.get('user-agent') || 'default'
    const seed = sessionKey.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    
    // Folosim seed pentru a genera valori consistente pentru aceeași sesiune
    const suggestions = 25 + (seed % 30)
    const accepted = 8 + (seed % 12) 
    const avgProfit = Number((15 + (seed % 100) / 10).toFixed(1))
    const activeVehicles = fleetMockApi.getVehicles().filter(v => v.status === 'ACTIVE').length

    return Response.json({
      suggestions,
      accepted, 
      avgProfit,
      activeVehicles,
      // Meta info pentru debug
      _meta: {
        timestamp: new Date().toISOString(),
        source: 'mock_data',
        note: 'Real database integration coming soon'
      }
    })

  } catch (error) {
    console.error('Error fetching stats:', error)
    return Response.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    )
  }
}