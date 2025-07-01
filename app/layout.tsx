import './globals.css'
import type { Metadata } from 'next'
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
    <StickyNavigationProvider>
      <ClientLayout>{children}</ClientLayout>
    </StickyNavigationProvider>
  )
}