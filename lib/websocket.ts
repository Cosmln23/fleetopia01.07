// WebSocket client wrapper with Vercel fallback
import { io, Socket } from 'socket.io-client'

let socket: Socket | null = null
let isPollingMode = false
let pollingInterval: NodeJS.Timeout | null = null

// Check if WebSocket is available (fails on Vercel)
async function checkWebSocketSupport(): Promise<boolean> {
  try {
    const testSocket = io(getSocketUrl(), {
      timeout: 3000,
      forceNew: true
    })
    
    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        testSocket.disconnect()
        resolve(false)
      }, 3000)
      
      testSocket.on('connect', () => {
        clearTimeout(timer)
        testSocket.disconnect()
        resolve(true)
      })
      
      testSocket.on('connect_error', () => {
        clearTimeout(timer)
        testSocket.disconnect()
        resolve(false)
      })
    })
  } catch {
    return false
  }
}

function getSocketUrl(): string {
  if (typeof window === 'undefined') return ''
  return `${window.location.protocol}//${window.location.host}`
}

// Initialize connection with fallback to HTTP polling
export async function initializeSocket(): Promise<void> {
  if (typeof window === 'undefined') return

  console.log('🔌 Testing WebSocket support...')
  const wsSupported = await checkWebSocketSupport()
  
  if (wsSupported) {
    console.log('✅ WebSocket supported, using real-time connection')
    socket = io(getSocketUrl(), {
      path: '/api/socket',
      addTrailingSlash: false
    })
    isPollingMode = false
  } else {
    console.log('⚠️ WebSocket not supported (Vercel), falling back to HTTP polling')
    isPollingMode = true
    startHttpPolling()
  }
}

// HTTP polling fallback for Vercel
function startHttpPolling() {
  if (pollingInterval) return
  
  pollingInterval = setInterval(async () => {
    try {
      // Poll for new messages
      const response = await fetch('/api/messages/poll', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      })
      
      if (response.ok) {
        const data = await response.json()
        // Emit events like WebSocket would
        if (data.messages?.length > 0) {
          data.messages.forEach((msg: any) => {
            emitEvent('message', msg)
          })
        }
      }
    } catch (error) {
      console.warn('⚠️ Polling error:', error)
    }
  }, 2000) // Poll every 2 seconds
}

// Event listeners storage for polling mode
const eventListeners: { [event: string]: ((...args: any[]) => void)[] } = {}

function emitEvent(event: string, data: any) {
  if (eventListeners[event]) {
    eventListeners[event].forEach(callback => callback(data))
  }
}

// Unified API that works with both WebSocket and polling
export function onSocketEvent(event: string, callback: (...args: any[]) => void) {
  if (isPollingMode) {
    if (!eventListeners[event]) {
      eventListeners[event] = []
    }
    eventListeners[event].push(callback)
  } else if (socket) {
    socket.on(event, callback)
  }
}

export function emitSocketEvent(event: string, data: any) {
  if (isPollingMode) {
    // Send via HTTP for polling mode
    fetch('/api/messages/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event, data })
    }).catch(err => console.warn('⚠️ HTTP emit error:', err))
  } else if (socket) {
    socket.emit(event, data)
  }
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect()
    socket = null
  }
  if (pollingInterval) {
    clearInterval(pollingInterval)
    pollingInterval = null
  }
  isPollingMode = false
}

export { socket }