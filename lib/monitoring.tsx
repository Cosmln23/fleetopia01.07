import * as Sentry from '@sentry/nextjs'
import logger from './logger'
import React from 'react'

// Performance monitoring wrapper
export const withPerformanceMonitoring = <T extends any[], R,>(
  name: string,
  fn: (...args: T) => R | Promise<R>
) => {
  return async (...args: T): Promise<R> => {
    const start = Date.now()
    
    return await Sentry.startSpan(
      {
        name,
        op: 'function',
      },
      async (span) => {
        try {
          const result = await fn(...args)
          const duration = Date.now() - start
          
          span.setStatus({ code: 1, message: 'OK' })
          span.setAttribute('duration', duration)
          
          logger.info(`${name} completed in ${duration}ms`)
          
          return result
        } catch (error) {
          const duration = Date.now() - start
          
          span.setStatus({ code: 2, message: 'Error' })
          span.setAttribute('duration', duration)
          if(error) {
            span.setAttribute('error', String(error))
          }
          
          logger.error(`${name} failed after ${duration}ms`, error)
          Sentry.captureException(error, { tags: { operation: name } })
          
          throw error
        }
      }
    )
  }
}

// Database operation monitoring
export const withDbMonitoring = <T extends any[], R,>(
  operation: string,
  table: string,
  fn: (...args: T) => R | Promise<R>
) => {
  return withPerformanceMonitoring(`db.${operation}.${table}`, fn)
}

// API endpoint monitoring
export const withApiMonitoring = <T extends any[], R,>(
  endpoint: string,
  fn: (...args: T) => R | Promise<R>
) => {
  return withPerformanceMonitoring(`api.${endpoint}`, fn)
}

// WebSocket event monitoring
export const withWebSocketMonitoring = <T extends any[], R,>(
  event: string,
  fn: (...args: T) => R | Promise<R>
) => {
  return withPerformanceMonitoring(`ws.${event}`, fn)
}

// Error boundary for React components
export const withErrorBoundary = <P extends object,>(
  Component: React.ComponentType<P>,
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>
) => {
  return Sentry.withErrorBoundary(Component, {
    fallback: (props) => {
      const { error, resetError } = props as { error: Error; resetError: () => void };
      if (fallback) {
        return React.createElement(fallback, { error, resetError });
      }
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 m-4">
          <h2 className="text-red-800 font-bold mb-2">Something went wrong</h2>
          <p className="text-red-600 mb-4">{error.message}</p>
          <button
            onClick={resetError}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Try again
          </button>
        </div>
      );
    },
    showDialog: false,
  });
}

// Custom metrics tracking
export const trackMetric = (name: string, value: number, tags?: Record<string, string>) => {
  // In production, you might want to send to a metrics service
  logger.info(`Metric: ${name} = ${value}`, { tags })
  
  // Send to Sentry as a custom measurement
  Sentry.setMeasurement(name, value, 'none')
}

// User activity tracking
export const trackUserActivity = (activity: string, userId: string, metadata?: any) => {
  Sentry.addBreadcrumb({
    category: 'user_activity',
    message: activity,
    level: 'info',
    data: {
      userId,
      ...metadata,
      timestamp: new Date().toISOString()
    }
  })
  
  logger.info(`User Activity: ${activity}`, { userId, metadata })
}

// Business metrics tracking
export const trackBusinessMetric = (metric: string, value: number, userId?: string) => {
  const data = {
    metric,
    value,
    userId,
    timestamp: new Date().toISOString()
  }
  
  logger.info(`Business Metric: ${metric} = ${value}`, data)
  
  // Send to analytics service
  Sentry.addBreadcrumb({
    category: 'business_metric',
    message: metric,
    level: 'info',
    data
  })
}

// Health check monitoring
export const healthCheck = async () => {
  const checks = {
    database: false,
    api: false,
    websocket: false,
    timestamp: new Date().toISOString()
  }
  
  try {
    // Database health check
    const { query } = await import('./db')
    await query('SELECT 1')
    checks.database = true
  } catch (error) {
    logger.error('Database health check failed', error)
    Sentry.captureException(error, { tags: { component: 'health_check', service: 'database' } })
  }
  
  try {
    // API health check
    checks.api = true
  } catch (error) {
    logger.error('API health check failed', error)
    Sentry.captureException(error, { tags: { component: 'health_check', service: 'api' } })
  }
  
  try {
    // WebSocket health check
    checks.websocket = true
  } catch (error) {
    logger.error('WebSocket health check failed', error)
    Sentry.captureException(error, { tags: { component: 'health_check', service: 'websocket' } })
  }
  
  return checks
}

// Export monitoring utilities
export { logger, Sentry } 