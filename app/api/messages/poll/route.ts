import { NextRequest, NextResponse } from 'next/server'

// HTTP polling endpoint for WebSocket fallback on Vercel
export async function GET(request: NextRequest) {
  try {
    // For now, return empty messages
    // In production, this would poll actual message queue/database
    const messages: any[] = []
    
    return NextResponse.json({
      success: true,
      messages,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('❌ Polling error:', error)
    return NextResponse.json(
      { error: 'Failed to poll messages' },
      { status: 500 }
    )
  }
}

export const dynamic = 'force-dynamic' 