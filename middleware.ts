import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

// Define protected routes that require authentication
const isProtectedRoute = createRouteMatcher([
  '/dispatcher(.*)',
  '/marketplace(.*)',
  '/fleet(.*)',
  '/profile(.*)',
  '/settings(.*)',
  '/api/cargo(.*)',
  '/api/quotes(.*)',
  '/api/vehicles(.*)',
  '/api/messages(.*)',
  '/api/notifications(.*)',
  '/api/stats(.*)'
])

// Routes that should be accessible during onboarding and billing
const isOnboardingRoute = createRouteMatcher([
  '/onboarding(.*)',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/billing(.*)',
  '/api/webhooks(.*)',
  '/api/users/profile(.*)',
  '/api/verification(.*)'
])

export default clerkMiddleware(async (auth, req) => {
  const { userId, sessionClaims } = await auth()
  
  // Security headers
  const requestHeaders = new Headers(req.headers)
  requestHeaders.set('x-pathname', req.nextUrl.pathname)
  
  // Rate limiting for API routes
  if (req.nextUrl.pathname.startsWith('/api/')) {
    const userAgent = req.headers.get('user-agent') || ''
    const ip = req.headers.get('x-forwarded-for') || 
               req.headers.get('x-real-ip') ||
               '127.0.0.1'
    
    // Basic bot protection
    if (userAgent.includes('bot') || userAgent.includes('crawler')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    
    // Add request ID for tracing
    requestHeaders.set('x-request-id', crypto.randomUUID())
  }
  
  // Protect routes that require authentication
  if (isProtectedRoute(req)) {
    if (!userId) {
      // Only redirect if it's not an API route
      if (req.nextUrl.pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      return NextResponse.redirect(new URL('/sign-in', req.url))
    }
  }

  // Check trial status for authenticated users
  if (userId && !isOnboardingRoute(req)) {
    try {
      const { sessionClaims } = await auth()
      const publicMetadata = sessionClaims?.publicMetadata as any || {}
      const { status, trialExpiresAt, profileCompleted, verification_status } = publicMetadata
      
      // Check if user has an expired trial
      const now = Date.now()
      const isTrialExpired = trialExpiresAt && now > Number(trialExpiresAt)
      const isTrialUser = status === 'TRIAL'
      const isVerified = verification_status === 'verified'
      
      // If trial expired and not verified, redirect based on route type
      if (isTrialUser && isTrialExpired && !isVerified) {
        console.log('🔄 Trial expired, user needs upgrade:', { userId, status, isTrialExpired })
        
        // For API routes, return 402 Payment Required
        if (req.nextUrl.pathname.startsWith('/api/')) {
          return NextResponse.json(
            { 
              error: 'Trial expired', 
              message: 'Your 7-day trial has expired. Please upgrade to continue.',
              redirectTo: '/billing'
            }, 
            { status: 402 }
          )
        }
        
        // For web routes, redirect to billing page
        if (!req.nextUrl.pathname.startsWith('/billing')) {
          return NextResponse.redirect(new URL('/billing', req.url))
        }
      }
      
      // Legacy check for old trial system (can be removed after migration)
      if (!status && !profileCompleted) {
        const { createdAt, trialStarted } = publicMetadata as any
        if (trialStarted && createdAt) {
          const sevenDaysMs = 7 * 24 * 60 * 60 * 1000
          const trialExpired = (now - Number(createdAt)) > sevenDaysMs
          
          if (trialExpired && !req.nextUrl.pathname.startsWith('/onboarding')) {
            console.log('🔄 Legacy trial expired, redirecting to onboarding:', userId)
            return NextResponse.redirect(new URL('/onboarding', req.url))
          }
        }
      }
    } catch (error) {
      console.error('❌ Error checking trial status:', error)
      // Don't block the request on error - just log it
    }
  }
  
  // Add security headers
  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })
  
  // Add security headers to response
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  
  // Add HSTS only in production
  if (process.env.NODE_ENV === 'production') {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload')
  }
  
  return response
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}