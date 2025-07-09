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

// Routes that should be accessible during onboarding
const isOnboardingRoute = createRouteMatcher([
  '/onboarding(.*)',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks(.*)',
  '/api/users/profile(.*)'
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
      const publicMetadata = sessionClaims?.publicMetadata || {}
      const { createdAt, profileCompleted, trialStarted } = publicMetadata
      
      // If user has metadata and trial is active
      if (trialStarted && createdAt && !profileCompleted) {
        const now = Date.now()
        const sevenDaysMs = 7 * 24 * 60 * 60 * 1000
        const trialExpired = (now - Number(createdAt)) > sevenDaysMs
        
        // If trial expired and profile not completed, force onboarding
        if (trialExpired && !req.nextUrl.pathname.startsWith('/onboarding')) {
          console.log('🔄 Trial expired, redirecting to onboarding:', userId)
          return NextResponse.redirect(new URL('/onboarding', req.url))
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