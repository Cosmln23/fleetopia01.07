'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import useSWR from 'swr'

interface ChatParticipant {
  id: string
  name: string
  avatar?: string
  isOnline: boolean
}

interface ChatConversation {
  id: string
  participants: ChatParticipant[]
  lastMessage?: {
    id: string
    senderId: string
    content: string
    timestamp: string
    read: boolean
  }
  unreadCount: number
  updatedAt: string
  cargoId?: string
  cargoTitle?: string
}

interface ChatConversationsListProps {
  onConversationSelect: (conversationId: string) => void
  onUnreadCountChange: (count: number) => void
}

const fetcher = (url: string) => fetch(url).then(res => res.json())

export default function ChatConversationsList({ 
  onConversationSelect, 
  onUnreadCountChange 
}: ChatConversationsListProps) {
  const { user } = useUser()
  const [searchQuery, setSearchQuery] = useState('')

  // Fetch conversations with SWR for real-time updates
  const { data: conversations = [], error, mutate } = useSWR<ChatConversation[]>(
    user ? '/api/chat/conversations' : null,
    fetcher,
    {
      refreshInterval: 5000, // Poll every 5 seconds for real-time updates
      revalidateOnFocus: true,
      revalidateOnReconnect: true
    }
  )

  // Calculate total unread count
  useEffect(() => {
    const totalUnread = conversations.reduce((sum, conv) => sum + conv.unreadCount, 0)
    onUnreadCountChange(totalUnread)
  }, [conversations, onUnreadCountChange])

  // Filter conversations based on search
  const filteredConversations = conversations.filter(conversation => {
    if (!searchQuery.trim()) return true
    
    const query = searchQuery.toLowerCase()
    const otherParticipant = conversation.participants.find(p => p.id !== user?.id)
    
    return (
      otherParticipant?.name.toLowerCase().includes(query) ||
      conversation.cargoTitle?.toLowerCase().includes(query) ||
      conversation.lastMessage?.content.toLowerCase().includes(query)
    )
  })

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    
    if (diffInHours < 1) {
      return 'Now'
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h`
    } else if (diffInHours < 48) {
      return 'Yesterday'
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }
  }

  const getOtherParticipant = (conversation: ChatConversation) => {
    return conversation.participants.find(p => p.id !== user?.id)
  }

  if (error) {
    return (
      <div className="p-4 text-center">
        <div className="text-red-400 text-sm">
          ⚠️ Failed to load conversations
        </div>
        <button 
          onClick={() => mutate()}
          className="text-blue-400 hover:text-blue-300 text-sm mt-2 underline"
        >
          Try again
        </button>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Search Bar */}
      <div className="p-3 border-b border-[#363636]">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search conversations..."
            className="w-full bg-[#363636] border border-[#4d4d4d] rounded-lg px-3 py-2 pl-9 text-white placeholder-[#adadad] focus:outline-none focus:border-white text-sm"
          />
          <svg className="absolute left-3 top-2.5 w-4 h-4 text-[#adadad]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length === 0 ? (
          <div className="p-6 text-center">
            {conversations.length === 0 ? (
              <div>
                <svg className="w-12 h-12 text-[#4d4d4d] mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <p className="text-[#adadad] text-sm">No conversations yet</p>
                <p className="text-[#666] text-xs mt-1">Start chatting with cargo owners from the marketplace</p>
              </div>
            ) : (
              <div>
                <p className="text-[#adadad] text-sm">No conversations found</p>
                <p className="text-[#666] text-xs mt-1">Try a different search term</p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-1 p-2">
            {filteredConversations.map((conversation) => {
              const otherParticipant = getOtherParticipant(conversation)
              if (!otherParticipant) return null

              return (
                <button
                  key={conversation.id}
                  onClick={() => onConversationSelect(conversation.id)}
                  className="w-full text-left p-3 rounded-lg hover:bg-[#2d2d2d] transition-colors group"
                >
                  <div className="flex items-start gap-3">
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
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
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-[#1a1a1a] rounded-full"></div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="text-white text-sm font-medium truncate">
                          {otherParticipant.name}
                        </h4>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {conversation.unreadCount > 0 && (
                            <div className="bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
                              {conversation.unreadCount > 9 ? '9+' : conversation.unreadCount}
                            </div>
                          )}
                          {conversation.lastMessage && (
                            <span className="text-[#666] text-xs">
                              {formatTime(conversation.lastMessage.timestamp)}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Cargo Info */}
                      {conversation.cargoTitle && (
                        <div className="text-[#adadad] text-xs mb-1 truncate">
                          📦 {conversation.cargoTitle}
                        </div>
                      )}

                      {/* Last Message */}
                      {conversation.lastMessage && (
                        <p className={`text-sm truncate ${
                          conversation.unreadCount > 0 ? 'text-white font-medium' : 'text-[#adadad]'
                        }`}>
                          {conversation.lastMessage.senderId === user?.id && (
                            <span className="text-[#666]">You: </span>
                          )}
                          {conversation.lastMessage.content}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Refresh Button */}
      <div className="p-3 border-t border-[#363636]">
        <button
          onClick={() => mutate()}
          className="w-full bg-[#363636] hover:bg-[#4d4d4d] text-[#adadad] hover:text-white px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>
    </div>
  )
}