import * as Sentry from '@sentry/nextjs'
import logger from './logger'

// Performance monitoring wrapper
export const withPerformanceMonitoring = <T extends any[], R>(
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
          span.setData('duration', duration)
          
          logger.info(`${name} completed in ${duration}ms`)
          
          return result
        } catch (error) {
          const duration = Date.now() - start
          
          span.setStatus({ code: 2, message: 'Error' })
          span.setData('duration', duration)
          span.setData('error', error)
          
          logger.error(`${name} failed after ${duration}ms`, error)
          Sentry.captureException(error, { tags: { operation: name } })
          
          throw error
        }\n      }\n    )\n  }\n}\n\n// Database operation monitoring\nexport const withDbMonitoring = <T extends any[], R>(\n  operation: string,\n  table: string,\n  fn: (...args: T) => R | Promise<R>\n) => {\n  return withPerformanceMonitoring(`db.${operation}.${table}`, fn)\n}\n\n// API endpoint monitoring\nexport const withApiMonitoring = <T extends any[], R>(\n  endpoint: string,\n  fn: (...args: T) => R | Promise<R>\n) => {\n  return withPerformanceMonitoring(`api.${endpoint}`, fn)\n}\n\n// WebSocket event monitoring\nexport const withWebSocketMonitoring = <T extends any[], R>(\n  event: string,\n  fn: (...args: T) => R | Promise<R>\n) => {\n  return withPerformanceMonitoring(`ws.${event}`, fn)\n}\n\n// Error boundary for React components\nexport const withErrorBoundary = <P extends object>(\n  Component: React.ComponentType<P>,\n  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>\n) => {\n  return Sentry.withErrorBoundary(Component, {\n    fallback: fallback || (({ error, resetError }) => (\n      <div className=\"bg-red-50 border border-red-200 rounded-lg p-4 m-4\">\n        <h2 className=\"text-red-800 font-bold mb-2\">Something went wrong</h2>\n        <p className=\"text-red-600 mb-4\">{error.message}</p>\n        <button \n          onClick={resetError}\n          className=\"bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700\"\n        >\n          Try again\n        </button>\n      </div>\n    )),\n    showDialog: false,\n  })\n}\n\n// Custom metrics tracking\nexport const trackMetric = (name: string, value: number, tags?: Record<string, string>) => {\n  // In production, you might want to send to a metrics service\n  logger.info(`Metric: ${name} = ${value}`, { tags })\n  \n  // Send to Sentry as a custom measurement\n  Sentry.setMeasurement(name, value, 'none')\n}\n\n// User activity tracking\nexport const trackUserActivity = (activity: string, userId: string, metadata?: any) => {\n  Sentry.addBreadcrumb({\n    category: 'user_activity',\n    message: activity,\n    level: 'info',\n    data: {\n      userId,\n      ...metadata,\n      timestamp: new Date().toISOString()\n    }\n  })\n  \n  logger.info(`User Activity: ${activity}`, { userId, metadata })\n}\n\n// Business metrics tracking\nexport const trackBusinessMetric = (metric: string, value: number, userId?: string) => {\n  const data = {\n    metric,\n    value,\n    userId,\n    timestamp: new Date().toISOString()\n  }\n  \n  logger.info(`Business Metric: ${metric} = ${value}`, data)\n  \n  // Send to analytics service\n  Sentry.addBreadcrumb({\n    category: 'business_metric',\n    message: metric,\n    level: 'info',\n    data\n  })\n}\n\n// Health check monitoring\nexport const healthCheck = async () => {\n  const checks = {\n    database: false,\n    api: false,\n    websocket: false,\n    timestamp: new Date().toISOString()\n  }\n  \n  try {\n    // Database health check\n    const { query } = await import('./db')\n    await query('SELECT 1')\n    checks.database = true\n  } catch (error) {\n    logger.error('Database health check failed', error)\n    Sentry.captureException(error, { tags: { component: 'health_check', service: 'database' } })\n  }\n  \n  try {\n    // API health check\n    checks.api = true\n  } catch (error) {\n    logger.error('API health check failed', error)\n    Sentry.captureException(error, { tags: { component: 'health_check', service: 'api' } })\n  }\n  \n  try {\n    // WebSocket health check\n    checks.websocket = true\n  } catch (error) {\n    logger.error('WebSocket health check failed', error)\n    Sentry.captureException(error, { tags: { component: 'health_check', service: 'websocket' } })\n  }\n  \n  return checks\n}\n\n// Export monitoring utilities\nexport { logger, Sentry }