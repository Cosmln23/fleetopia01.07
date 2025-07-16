import { NextRequest, NextResponse } from 'next/server'

// HTTP send endpoint for WebSocket fallback on Vercel
export async function POST(request: NextRequest) {
  try {
    const { event, data } = await request.json()
    
    console.log(`📤 HTTP fallback - Event: ${event}`, data)
    
    // In production, this would:
    // 1. Store message in database
    // 2. Queue for processing
    // 3. Trigger notifications
    
    return NextResponse.json({
      success: true,
      messageId: `msg_${Date.now()}`,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('❌ Send message error:', error)
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    )
  }
}

export const dynamic = 'force-dynamic' 