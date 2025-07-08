import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Set tracesSampleRate to 1.0 to capture 100% of transactions for performance monitoring
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Capture 100% of the transactions, reduce in production
  profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Debug mode in development
  debug: process.env.NODE_ENV === 'development',
  
  // Environment
  environment: process.env.NODE_ENV,
  
  // Release version
  release: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
  
  // Integrations
  integrations: [
    new Sentry.BrowserTracing({
      // Set sampling rate for navigation and interactions
      tracingOrigins: ['localhost', process.env.NEXT_PUBLIC_DOMAIN || 'fleetopia.co'],
    }),
    new Sentry.Replay({
      // Capture 10% of all sessions,
      // plus 100% of sessions with an error
      sessionSampleRate: 0.1,
      errorSampleRate: 1.0,
    }),
  ],
  
  // Performance monitoring
  beforeSend(event, hint) {
    // Filter out common noise
    if (event.exception) {
      const error = hint.originalException
      if (error && error.name === 'ChunkLoadError') {
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