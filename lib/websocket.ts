import { Server } from 'socket.io'
import { NextApiRequest, NextApiResponse } from 'next'
import { auth } from '@clerk/nextjs/server'
import { query } from './db'

export interface ServerToClientEvents {
  'quote-update': (data: {
    cargoId: string
    quoteId: string
    status: string
    price?: number
    message?: string
  }) => void
  'chat-message': (data: {
    cargoId: string
    message: {
      id: string
      content: string
      senderId: string
      senderType: 'user' | 'shipper' | 'agent'
      messageType: 'text' | 'quote' | 'counter' | 'accept' | 'reject'
      timestamp: string
      priceAmount?: number
    }
  }) => void
  'negotiation-status': (data: {
    cargoId: string
    status: 'initial' | 'quote_sent' | 'negotiating' | 'accepted' | 'rejected'
  }) => void
  'notification': (data: {
    id: string
    type: string
    title: string
    message: string
    timestamp: string
  }) => void
}

export interface ClientToServerEvents {
  'join-cargo': (cargoId: string) => void
  'leave-cargo': (cargoId: string) => void
  'send-quote': (data: {
    cargoId: string
    price: number
    message?: string
  }) => void
  'send-chat-message': (data: {
    cargoId: string
    content: string
    messageType: 'text' | 'quote' | 'counter' | 'accept' | 'reject'
    priceAmount?: number
  }) => void
  'negotiation-action': (data: {
    cargoId: string
    action: 'accept' | 'reject' | 'counter'
    quoteId: string
    counterPrice?: number
  }) => void
}

export interface InterServerEvents {
  ping: () => void
}

export interface SocketData {
  userId: string
  userRole: 'provider' | 'carrier'
}

// WebSocket handler for Netlify Functions
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Initialize Socket.IO server
    if (!res.socket.server.io) {
      console.log('Setting up Socket.IO server...')
      
      const io = new Server<
        ClientToServerEvents,
        ServerToClientEvents,
        InterServerEvents,
        SocketData
      >(res.socket.server, {
        path: '/api/socket',
        addTrailingSlash: false,
        cors: {
          origin: process.env.NEXT_PUBLIC_DOMAIN || 'http://localhost:3000',
          methods: ['GET', 'POST']
        }
      })

      // Connection handler
      io.on('connection', async (socket) => {
        console.log('Client connected:', socket.id)

        // Authenticate user
        try {
          const { userId, sessionClaims } = await auth()
          if (!userId) {
            socket.disconnect()
            return
          }

          socket.data.userId = userId
          socket.data.userRole = (sessionClaims?.publicMetadata as any)?.role || 'carrier'

          console.log(`User ${userId} connected as ${socket.data.userRole}`)
        } catch (error) {
          console.error('Authentication failed:', error)
          socket.disconnect()
          return
        }

        // Join cargo room
        socket.on('join-cargo', (cargoId: string) => {
          socket.join(`cargo-${cargoId}`)
          console.log(`User ${socket.data.userId} joined cargo-${cargoId}`)
        })

        // Leave cargo room
        socket.on('leave-cargo', (cargoId: string) => {
          socket.leave(`cargo-${cargoId}`)
          console.log(`User ${socket.data.userId} left cargo-${cargoId}`)
        })

        // Handle quote sending
        socket.on('send-quote', async (data) => {
          try {
            const { cargoId, price, message } = data
            const userId = socket.data.userId

            // Create quote in database
            const quoteId = `quote_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
            const timestamp = Date.now()

            const result = await query(`
              INSERT INTO offer_requests (
                id, cargo_id, transporter_id, proposed_price, message, 
                status, source, created_ts, updated_ts
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
              RETURNING *
            `, [
              quoteId, cargoId, userId, price, message,
              'pending', 'manual', timestamp, timestamp
            ])

            // Broadcast to cargo room
            io.to(`cargo-${cargoId}`).emit('quote-update', {
              cargoId,
              quoteId,
              status: 'pending',
              price,
              message
            })

            // Send chat message
            io.to(`cargo-${cargoId}`).emit('chat-message', {
              cargoId,
              message: {
                id: `msg_${Date.now()}`,
                content: `€${price}`,
                senderId: userId,
                senderType: 'user',
                messageType: 'quote',
                timestamp: new Date().toISOString(),
                priceAmount: price
              }
            })

            console.log(`Quote sent: ${quoteId} for cargo ${cargoId}`)

          } catch (error) {
            console.error('Error sending quote:', error)
            socket.emit('error', { message: 'Failed to send quote' })
          }
        })

        // Handle chat messages
        socket.on('send-chat-message', async (data) => {
          try {
            const { cargoId, content, messageType, priceAmount } = data
            const userId = socket.data.userId

            // Store message in database (if needed)
            const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
            
            // Broadcast to cargo room
            io.to(`cargo-${cargoId}`).emit('chat-message', {
              cargoId,
              message: {
                id: messageId,
                content,
                senderId: userId,
                senderType: socket.data.userRole === 'provider' ? 'shipper' : 'user',
                messageType,
                timestamp: new Date().toISOString(),
                priceAmount
              }
            })

            console.log(`Chat message sent in cargo ${cargoId}`)

          } catch (error) {
            console.error('Error sending chat message:', error)
            socket.emit('error', { message: 'Failed to send message' })
          }
        })

        // Handle negotiation actions
        socket.on('negotiation-action', async (data) => {
          try {
            const { cargoId, action, quoteId, counterPrice } = data
            const userId = socket.data.userId

            // Update quote status in database
            await query(`
              UPDATE offer_requests 
              SET status = $1, updated_ts = $2 
              WHERE id = $3
            `, [action, Date.now(), quoteId])

            // Broadcast status update
            io.to(`cargo-${cargoId}`).emit('negotiation-status', {
              cargoId,
              status: action === 'accept' ? 'accepted' : action === 'reject' ? 'rejected' : 'negotiating'
            })

            // Send appropriate chat message
            let chatContent = ''
            let messageType = 'text'
            
            switch (action) {
              case 'accept':
                chatContent = 'Accepted your offer! 🎉'
                messageType = 'accept'
                break
              case 'reject':
                chatContent = 'Sorry, can\'t accept this offer.'
                messageType = 'reject'
                break
              case 'counter':
                chatContent = `Counter offer: €${counterPrice}`
                messageType = 'counter'
                break
            }

            io.to(`cargo-${cargoId}`).emit('chat-message', {
              cargoId,
              message: {
                id: `msg_${Date.now()}`,
                content: chatContent,
                senderId: userId,
                senderType: 'shipper',
                messageType: messageType as any,
                timestamp: new Date().toISOString(),
                priceAmount: counterPrice
              }
            })

            console.log(`Negotiation action: ${action} for quote ${quoteId}`)

          } catch (error) {
            console.error('Error handling negotiation action:', error)
            socket.emit('error', { message: 'Failed to process action' })
          }
        })

        // Handle disconnection
        socket.on('disconnect', () => {
          console.log('Client disconnected:', socket.id)
        })
      })

      res.socket.server.io = io
    }

    res.status(200).json({ message: 'WebSocket server initialized' })

  } catch (error) {
    console.error('WebSocket setup error:', error)
    res.status(500).json({ error: 'Failed to initialize WebSocket server' })
  }
}