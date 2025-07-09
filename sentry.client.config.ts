import * as Sentry from '@sentry/nextjs'
import { replayIntegration } from '@sentry/react'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Set tracesSampleRate to 1.0 to capture 100% of transactions for performance monitoring
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Capture 100% of the transactions, reduce in production
  profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Capture 10% of all sessions,
  // plus 100% of sessions with an error
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  
  // Debug mode in development
  debug: process.env.NODE_ENV === 'development',
  
  // Environment
  environment: process.env.NODE_ENV,
  
  // Release version
  release: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
  
  // Integrations
  integrations: [
    replayIntegration(),
  ],
  
  // Performance monitoring
  beforeSend(event, hint) {
    // Filter out common noise
    if (event.exception && hint.originalException instanceof Error) {
      if (hint.originalException.name === 'ChunkLoadError') {
        return null
      }
    }
    
    // Add user context
    if (typeof window !== 'undefined' && window.localStorage) {
      const userId = window.localStorage.getItem('userId')
      if (userId) {
        event.user = { id: userId }
      }
    }
    
    return event
  },
  
  // Custom tags
  initialScope: {
    tags: {
      component: 'client',
      feature: 'fleetopia'
    }
  }
})