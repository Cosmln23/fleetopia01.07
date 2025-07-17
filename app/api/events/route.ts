import { NextRequest } from 'next/server'
import { auth } from '@clerk/nextjs/server'

// Server-Sent Events endpoint for real-time notifications
// Replaces WebSocket functionality for Netlify compatibility
export async function GET(req: NextRequest) {
  const { userId } = await auth()
  
  if (!userId) {
    return new Response('Unauthorized', { status: 401 })
  }

  // Create a readable stream for SSE
  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection event
      const data = `data: ${JSON.stringify({
        type: 'connected',
        userId,
        timestamp: new Date().toISOString()
      })}\n\n`
      
      controller.enqueue(new TextEncoder().encode(data))

      // Set up periodic heartbeat to keep connection alive
      const heartbeat = setInterval(() => {
        try {
          const heartbeatData = `data: ${JSON.stringify({
            type: 'heartbeat',
            timestamp: new Date().toISOString()
          })}\n\n`
          
          controller.enqueue(new TextEncoder().encode(heartbeatData))
        } catch (error) {
          console.error('SSE heartbeat error:', error)
          clearInterval(heartbeat)
          controller.close()
        }
      }, 30000) // 30 seconds heartbeat

      // Cleanup function
      req.signal.addEventListener('abort', () => {
        clearInterval(heartbeat)
        controller.close()
      })
    }
  })

  // Return SSE response
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    }
  })
} 