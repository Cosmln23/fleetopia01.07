import { NextRequest } from 'next/server'
import { healthCheck } from '@/lib/monitoring'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const health = await healthCheck()
    
    const isHealthy = health.database && health.api && health.websocket
    const status = isHealthy ? 200 : 503
    
    return Response.json({
      status: isHealthy ? 'healthy' : 'unhealthy',
      checks: health,
      timestamp: new Date().toISOString(),
      version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0'
    }, { status })
    
  } catch (error) {
    return Response.json({
      status: 'error',
      error: 'Health check failed',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}