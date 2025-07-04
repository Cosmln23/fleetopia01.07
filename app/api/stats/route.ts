// app/api/stats/route.ts
import { NextRequest } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    // TODO: Replace with real database queries
    // Returning zero values until real data integration
    
    return Response.json({
      suggestions: 0,
      accepted: 0, 
      avgProfit: 0,
      activeVehicles: 0,
      // Meta info pentru debug
      _meta: {
        timestamp: new Date().toISOString(),
        source: 'clean_slate',
        note: 'All mock data removed - awaiting real data integration'
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