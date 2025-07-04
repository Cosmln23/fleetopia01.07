'use client'

import { notFound } from 'next/navigation'

interface CargoDetailsPageProps {
  params: {
    id: string
  }
}

export default function CargoDetailsPage({ params }: CargoDetailsPageProps) {
  // TODO: Replace with API call to fetch cargo by ID
  // Mock data removed - showing not found until API integration
  notFound()
}