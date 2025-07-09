import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Set tracesSampleRate to 1.0 to capture 100% of transactions for performance monitoring
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Debug mode in development
  debug: process.env.NODE_ENV === 'development',
  
  // Environment
  environment: process.env.NODE_ENV,
  
  // Release version
  release: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
  
  // Integrations (default integrations are sufficient)
  // integrations: [
  //   new Sentry.HttpIntegration({
  //     tracing: true,
  //   }),
  //   new Sentry.OnUncaughtExceptionIntegration({
  //     exitEvenIfOtherHandlersAreRegistered: false,
  //   }),
  //   new Sentry.OnUnhandledRejectionIntegration({
  //     mode: 'warn',
  //   }),
  // ],
  
  // Performance monitoring
  beforeSend(event, hint) {
    // Add server-side context
    event.contexts = {
      ...event.contexts,
      server: {
        name: 'fleetopia-api',
        version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0'
      }
    }
    
    // Filter sensitive data
    if (event.request) {
      delete event.request.headers?.authorization
      delete event.request.headers?.cookie
    }
    
    return event
  },
  
  // Custom tags
  initialScope: {
    tags: {
      component: 'server',
      feature: 'fleetopia-api'
    }
  }
})