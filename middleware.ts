import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isProtectedRoute = createRouteMatcher([
  '/fleet(.*)',
  '/marketplace/add(.*)',
  '/dispatcher(.*)'
])

export default clerkMiddleware(async (auth, req) => {
  const { userId, sessionClaims } = await auth()
  const role = (sessionClaims?.publicMetadata as any)?.role as string

  // Protect routes that require authentication
  if (isProtectedRoute(req)) {
    if (!userId) {
      return NextResponse.redirect(new URL('/sign-in', req.url))
    }
  }

  // Role-based route protection
  const pathname = req.nextUrl.pathname

  // Fleet section - only carriers
  if (pathname.startsWith('/fleet') && role !== 'carrier') {
    return NextResponse.redirect(new URL('/', req.url))
  }

  // Add cargo - only providers
  if (pathname.startsWith('/marketplace/add') && role !== 'provider') {
    return NextResponse.redirect(new URL('/', req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}