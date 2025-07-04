import './globals.css'
import type { Metadata } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import { StickyNavigationProvider } from '@/contexts/StickyNavigationContext'
import ClientLayout from './ClientLayout'

export const metadata: Metadata = {
  title: 'Fleetopia - Transport & Logistics Marketplace',
  description: 'Transport Paradise with AI-powered logistics solutions',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.gstatic.com/" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?display=swap&family=Noto+Sans:wght@400;500;700;900&family=Space+Grotesk:wght@400;500;700"
        />
      </head>
      <body>
        <ClerkProvider>
          <StickyNavigationProvider>
            <ClientLayout>{children}</ClientLayout>
          </StickyNavigationProvider>
        </ClerkProvider>
      </body>
    </html>
  )
}