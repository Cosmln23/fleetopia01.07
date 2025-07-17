'use client'

import { useState, useEffect, useRef } from 'react'
import { useUser } from '@clerk/nextjs'
import useSWR from 'swr'

interface ChatMessage {
  id: string
  senderId: string
  senderName: string
  senderAvatar?: string
  content: string
  timestamp: string
  read: boolean
  type: 'text' | 'system' | 'quote' | 'file'
  priceAmount?: number
  fileUrl?: string
  fileName?: string
}

interface ChatParticipant {
  id: string
  name: string
  avatar?: string
  isOnline: boolean
}

interface ChatConversation {
  id: string
  participants: ChatParticipant[]
  cargoId?: string
  cargoTitle?: string
}

interface ChatWindowProps {
  conversationId: string
  onClose?: () => void
}

const fetcher = (url: string) => fetch(url).then(res => res.json())

export default function ChatWindow({ conversationId, onClose }: ChatWindowProps) {
  const { user } = useUser()
  const [newMessage, setNewMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Fetch conversation details
  const { data: conversation } = useSWR<ChatConversation>(
    conversationId ? `/api/chat/conversations/${conversationId}` : null,
    fetcher,
    { revalidateOnFocus: true }
  )

  // Fetch messages with real-time polling
  const { data: messages = [], mutate: mutateMessages } = useSWR<ChatMessage[]>(
    conversationId ? `/api/chat/conversations/${conversationId}/messages` : null,
    fetcher,
    {
      refreshInterval: 3000, // Poll every 3 seconds for real-time updates
      revalidateOnFocus: true,
      revalidateOnReconnect: true
    }
  )

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 100) + 'px'
    }
  }, [newMessage])

  // Mark messages as read when window is visible
  useEffect(() => {
    if (messages.length > 0 && user) {
      const unreadMessages = messages.filter(msg => !msg.read && msg.senderId !== user.id)
      if (unreadMessages.length > 0) {
        // Mark messages as read
        fetch(`/api/chat/conversations/${conversationId}/mark-read`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        }).then(() => {
          mutateMessages()
        })
      }
    }
  }, [messages, conversationId, user, mutateMessages])

  const sendMessage = async () => {
    if (!newMessage.trim() || isSending || !user) return

    const messageContent = newMessage.trim()
    setNewMessage('')
    setIsSending(true)

    try {
      const response = await fetch(`/api/chat/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: messageContent,
          type: 'text'
        })
      })

      if (response.ok) {
        // Refresh messages to show new message
        mutateMessages()
      } else {
        throw new Error('Failed to send message')
      }
    } catch (error) {
      console.error('Failed to send message:', error)
      // Restore message content on error
      setNewMessage(messageContent)
    } finally {
      setIsSending(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false
    })
  }

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) {
      return 'Today'
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday'
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
      })
    }
  }

  const getOtherParticipant = () => {
    if (!conversation || !user) return null
    return conversation.participants.find(p => p.id !== user.id)
  }

  const groupMessagesByDate = (messages: ChatMessage[]) => {
    const groups: { [date: string]: ChatMessage[] } = {}
    
    messages.forEach(message => {
      const date = new Date(message.timestamp).toDateString()
      if (!groups[date]) {
        groups[date] = []
      }
      groups[date].push(message)
    })
    
    return groups
  }

  const otherParticipant = getOtherParticipant()
  const messageGroups = groupMessagesByDate(messages)

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      {conversation && otherParticipant && (
        <div className="p-4 border-b border-[#363636] bg-[#2d2d2d]">
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div className="relative">
              {otherParticipant.avatar ? (
                <img
                  src={otherParticipant.avatar}
                  alt={otherParticipant.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-[#4d4d4d] flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {otherParticipant.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              
              {/* Online Status */}
              {otherParticipant.isOnline && (
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-[#2d2d2d] rounded-full"></div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h3 className="text-white font-medium text-sm">{otherParticipant.name}</h3>
              {conversation.cargoTitle && (
                <p className="text-[#adadad] text-xs truncate">📦 {conversation.cargoTitle}</p>
              )}
              <p className="text-[#666] text-xs">
                {otherParticipant.isOnline ? 'Online' : 'Offline'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {Object.entries(messageGroups).map(([date, dayMessages]) => (
          <div key={date}>
            {/* Date Separator */}
            <div className="text-center my-4">
              <span className="bg-[#363636] text-[#adadad] text-xs px-3 py-1 rounded-full">
                {formatDate(dayMessages[0].timestamp)}
              </span>
            </div>

            {/* Messages for this date */}
            <div className="space-y-2">
              {dayMessages.map((message) => {
                const isOwnMessage = message.senderId === user?.id
                
                return (
                  <div key={message.id} className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-xs lg:max-w-md px-3 py-2 rounded-lg ${
                      isOwnMessage 
                        ? 'bg-blue-600 text-white' 
                        : message.type === 'system'
                        ? 'bg-[#363636] text-[#adadad] mx-auto text-center'
                        : 'bg-[#363636] text-white'
                    }`}>
                      {/* Quote message special styling */}
                      {message.type === 'quote' && message.priceAmount && (
                        <div className="font-medium text-green-200 text-sm mb-1">
                          💰 Quote: €{message.priceAmount}
                        </div>
                      )}
                      
                      {/* Message content */}
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      
                      {/* Timestamp */}
                      <p className={`text-xs mt-1 ${
                        isOwnMessage ? 'text-blue-200' : 'text-[#adadad]'
                      }`}>
                        {formatTime(message.timestamp)}
                        {isOwnMessage && (
                          <span className="ml-1">
                            {message.read ? '✓✓' : '✓'}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-[#363636] text-white px-3 py-2 rounded-lg max-w-xs">
              <div className="flex items-center space-x-1">
                <span className="text-sm text-[#adadad]">Typing</span>
                <div className="flex space-x-1">
                  <div className="w-1 h-1 bg-[#adadad] rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                  <div className="w-1 h-1 bg-[#adadad] rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                  <div className="w-1 h-1 bg-[#adadad] rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-[#363636] bg-[#2d2d2d]">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className="w-full bg-[#363636] border border-[#4d4d4d] rounded-lg px-3 py-2 text-white placeholder-[#adadad] focus:outline-none focus:border-white resize-none min-h-[40px] max-h-[100px]"
              rows={1}
              disabled={isSending}
            />
          </div>
          <button
            onClick={sendMessage}
            disabled={!newMessage.trim() || isSending}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white px-4 py-2 rounded-lg transition-colors flex-shrink-0 self-end"
          >
            {isSending ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}