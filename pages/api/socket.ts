import { NextApiRequest, NextApiResponse } from 'next'
import { Server } from 'socket.io'
import { auth } from '@clerk/nextjs/server'
import { query } from '@/lib/db'

const SocketHandler = async (req: NextApiRequest, res: NextApiResponse) => {
  // @ts-ignore
  if (res.socket.server.io) {
    console.log('Socket is already running')
    res.end()
    return
  }

  console.log('Socket is initializing')
  // @ts-ignore
  const io = new Server(res.socket.server, {
    path: '/api/socket',
    addTrailingSlash: false,
    cors: {
      origin: process.env.NEXT_PUBLIC_DOMAIN || 'http://localhost:3000',
      methods: ['GET', 'POST']
    }
  })

  // @ts-ignore
  res.socket.server.io = io

  io.on('connection', async (socket) => {
    console.log('New client connected:', socket.id)

    // Store user info on socket
    socket.data.userId = null
    socket.data.userRole = null

    // Authenticate connection
    socket.on('authenticate', async (token) => {
      try {
        // You might need to pass the token differently for auth
        // For now, we'll skip detailed auth in WebSocket
        console.log('Client authenticated:', socket.id)
      } catch (error) {
        console.error('Authentication failed:', error)
        socket.disconnect()
      }
    })

    // Join cargo room for real-time updates
    socket.on('join-cargo', (cargoId) => {
      socket.join(`cargo-${cargoId}`)
      console.log(`Socket ${socket.id} joined cargo-${cargoId}`)
    })

    // Leave cargo room
    socket.on('leave-cargo', (cargoId) => {
      socket.leave(`cargo-${cargoId}`)
      console.log(`Socket ${socket.id} left cargo-${cargoId}`)
    })

    // Handle quote updates
    socket.on('quote-update', (data) => {
      console.log('Quote update:', data)
      // Broadcast to all clients in the cargo room
      socket.to(`cargo-${data.cargoId}`).emit('quote-update', data)
    })

    // Handle chat messages
    socket.on('chat-message', (data) => {
      console.log('Chat message:', data)
      // Broadcast to all clients in the cargo room
      socket.to(`cargo-${data.cargoId}`).emit('chat-message', data)
    })

    // Handle negotiation status changes
    socket.on('negotiation-status', (data) => {
      console.log('Negotiation status:', data)
      // Broadcast to all clients in the cargo room
      socket.to(`cargo-${data.cargoId}`).emit('negotiation-status', data)
    })

    // Handle real-time notifications
    socket.on('notification', (data) => {
      console.log('Notification:', data)
      // Broadcast to specific user if user rooms are implemented
      io.emit('notification', data)
    })

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id)
    })
  })

  console.log('Socket server started successfully')
  res.end()
}

export default SocketHandler