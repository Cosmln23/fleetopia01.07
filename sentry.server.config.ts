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
  
  // Integrations
  integrations: [
    new Sentry.HttpIntegration({
      tracing: true,
    }),
    new Sentry.OnUncaughtExceptionIntegration({
      exitEvenIfOtherHandlersAreRegistered: false,
    }),
    new Sentry.OnUnhandledRejectionIntegration({
      mode: 'warn',
    }),
  ],
  
  // Performance monitoring
  beforeSend(event, hint) {\n    // Add server-side context\n    event.contexts = {\n      ...event.contexts,\n      server: {\n        name: 'fleetopia-api',\n        version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0'\n      }\n    }\n    \n    // Filter sensitive data\n    if (event.request) {\n      delete event.request.headers?.authorization\n      delete event.request.headers?.cookie\n    }\n    \n    return event\n  },\n  \n  // Custom tags\n  initialScope: {\n    tags: {\n      component: 'server',\n      feature: 'fleetopia-api'\n    }\n  }\n})