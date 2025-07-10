// app/api/stats/route.ts
import { NextRequest } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { query } from '@/lib/db'
import { withApiMonitoring, trackMetric } from '@/lib/monitoring'
import logger from '@/lib/logger'

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

export const GET = withApiMonitoring('stats', async (req: NextRequest) => {
  try {
    const { userId } = await auth()
    if (!userId) {
      logger.warn('Unauthorized access attempt to stats API')
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    logger.info(`Stats API accessed by user: ${userId}`)

    // Real database queries for dashboard stats
    const statsQuery = `
      SELECT 
        -- Count of quotes/suggestions made in last 30 days
        COUNT(CASE WHEN o.created_ts > (EXTRACT(EPOCH FROM NOW() - INTERVAL '30 days') * 1000) THEN 1 END) as suggestions,
        
        -- Count of accepted quotes
        COUNT(CASE WHEN o.status = 'accepted' THEN 1 END) as accepted,
        
        -- Average profit margin from accepted quotes
        COALESCE(AVG(CASE WHEN o.status = 'accepted' AND o.proposed_price > 0 THEN 
          ((o.proposed_price - c.price) / c.price * 100) END), 0) as avg_profit,
        
        -- Count of active vehicles
        (SELECT COUNT(*) FROM vehicles WHERE status = 'active') as active_vehicles,
        
        -- Additional useful stats
        COUNT(CASE WHEN o.status = 'pending' THEN 1 END) as pending_offers,
        COUNT(CASE WHEN o.status = 'rejected' THEN 1 END) as rejected_offers,
        
        -- Total cargo available
        (SELECT COUNT(*) FROM cargo WHERE status = 'active') as available_cargo,
        
        -- Revenue from accepted quotes this month
        COALESCE(SUM(CASE WHEN o.status = 'accepted' AND o.created_ts > (EXTRACT(EPOCH FROM NOW() - INTERVAL '30 days') * 1000) 
          THEN o.proposed_price END), 0) as monthly_revenue
        
      FROM offer_requests o
      LEFT JOIN cargo c ON o.cargo_id = c.id
      WHERE o.transporter_id = $1
    `

    const result = await query(statsQuery, [userId])
    const stats = result.rows[0]

    // Calculate success rate
    const totalOffers = parseInt(stats.suggestions) || 1
    const acceptedOffers = parseInt(stats.accepted) || 0
    const successRate = Math.round((acceptedOffers / totalOffers) * 100)

    // Get recent activity count
    const activityQuery = `
      SELECT 
        COUNT(*) as recent_activity
      FROM offer_requests 
      WHERE transporter_id = $1 
        AND created_ts > (EXTRACT(EPOCH FROM NOW() - INTERVAL '7 days') * 1000)
    `
    const activityResult = await query(activityQuery, [userId])
    const recentActivity = activityResult.rows[0]?.recent_activity || 0

    const responseData = {
      suggestions: parseInt(stats.suggestions) || 0,
      accepted: parseInt(stats.accepted) || 0,
      avgProfit: Math.round(parseFloat(stats.avg_profit) || 0),
      activeVehicles: parseInt(stats.active_vehicles) || 0,
      pendingOffers: parseInt(stats.pending_offers) || 0,
      rejectedOffers: parseInt(stats.rejected_offers) || 0,
      availableCargo: parseInt(stats.available_cargo) || 0,
      monthlyRevenue: parseFloat(stats.monthly_revenue) || 0,
      successRate: successRate,
      recentActivity: parseInt(recentActivity),
      // Meta info
      _meta: {
        timestamp: new Date().toISOString(),
        source: 'live_database',
        userId: userId,
        note: 'Real-time stats from PostgreSQL database'
      }
    }
    
    // Track metrics
    trackMetric('stats.suggestions', responseData.suggestions, { userId })
    trackMetric('stats.accepted', responseData.accepted, { userId })
    trackMetric('stats.success_rate', responseData.successRate, { userId })
    trackMetric('stats.monthly_revenue', responseData.monthlyRevenue, { userId })
    
    logger.info(`Stats API response generated for user: ${userId}`, {
      suggestions: responseData.suggestions,
      accepted: responseData.accepted,
      successRate: responseData.successRate
    })
    
    return Response.json(responseData)

  } catch (error) {
    logger.error('Error fetching stats:', error)
    return Response.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    )
  }
})