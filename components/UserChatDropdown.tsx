'use client'

import { useState } from 'react'
import { mockChatConversations, mockChatMessages, getMessagesByConversation, getUnreadMessagesCount } from '@/lib/communication-data'
import { ChatConversation, UserChatMessage } from '@/lib/types'

interface UserChatDropdownProps {
  isOpen: boolean
  onClose: () => void
}

export default function UserChatDropdown({ isOpen, onClose }: UserChatDropdownProps) {
  const [selectedConversation, setSelectedConversation] = useState<ChatConversation | null>(null)
  const [conversations, setConversations] = useState(mockChatConversations)
  const [newMessage, setNewMessage] = useState('')

  if (!isOpen) return null

  const currentUserId = 'user_001' // Current user ID

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !selectedConversation) return

    // This would send to backend in real app
    console.log('Sending message:', newMessage)
    setNewMessage('')
  }

  const handleConversationSelect = (conversation: ChatConversation) => {
    setSelectedConversation(conversation)
  }

  const getOtherParticipant = (conversation: ChatConversation) => {
    return conversation.participants.find(p => p.id !== currentUserId)
  }

  return (
    <div className="fixed bottom-24 right-6 z-50">
      <div className="w-80 h-96 bg-[#1a1a1a] border border-[#363636] rounded-xl shadow-2xl flex flex-col">
        {!selectedConversation ? (
          // Conversations List View
          <>
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-[#363636]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-[#363636] rounded-full flex items-center justify-center">
                  <span className="text-sm">💬</span>
                </div>
                <div>
                  <h3 className="text-white font-bold text-sm">Messages</h3>
                  <p className="text-[#adadad] text-xs">{conversations.length} conversations</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-[#adadad] hover:text-white transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 256 256">
                  <path d="M205.66,194.34a8,8,0,0,1-11.32,11.32L128,139.31,61.66,205.66a8,8,0,0,1-11.32-11.32L116.69,128,50.34,61.66A8,8,0,0,1,61.66,50.34L128,116.69l66.34-66.35a8,8,0,0,1,11.32,11.32L139.31,128Z"></path>
                </svg>
              </button>
            </div>

            {/* Conversations List */}
            <div className="flex-1 overflow-y-auto">
              {conversations.map((conversation) => {
                const otherUser = getOtherParticipant(conversation)
                if (!otherUser) return null

                return (
                  <div
                    key={conversation.id}
                    onClick={() => handleConversationSelect(conversation)}
                    className="p-3 border-b border-[#2d2d2d] hover:bg-[#2d2d2d] cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-10 h-10 bg-[#363636] rounded-full flex items-center justify-center">
                          <span className="text-lg">{otherUser.avatar}</span>
                        </div>
                        {otherUser.isOnline && (
                          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-[#1a1a1a]"></div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="text-white text-sm font-medium truncate">{otherUser.name}</h4>
                          {conversation.unreadCount > 0 && (
                            <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                              <span className="text-white text-xs font-bold">{conversation.unreadCount}</span>
                            </div>
                          )}
                        </div>
                        <p className="text-[#adadad] text-xs truncate">
                          {conversation.lastMessage?.content || 'No messages yet'}
                        </p>
                        <p className="text-[#adadad] text-xs">
                          {new Date(conversation.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        ) : (
          // Individual Conversation View
          <>
            {/* Conversation Header */}
            <div className="flex items-center justify-between p-4 border-b border-[#363636]">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSelectedConversation(null)}
                  className="text-[#adadad] hover:text-white transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 256 256">
                    <path d="M224,128a8,8,0,0,1-8,8H59.31l58.35,58.34a8,8,0,0,1-11.32,11.32l-72-72a8,8,0,0,1,0-11.32l72-72a8,8,0,0,1,11.32,11.32L59.31,120H216A8,8,0,0,1,224,128Z"></path>
                  </svg>
                </button>
                <div className="w-8 h-8 bg-[#363636] rounded-full flex items-center justify-center">
                  <span className="text-sm">{getOtherParticipant(selectedConversation)?.avatar}</span>
                </div>
                <div>
                  <h3 className="text-white font-bold text-sm">{getOtherParticipant(selectedConversation)?.name}</h3>
                  <p className="text-[#adadad] text-xs">
                    {getOtherParticipant(selectedConversation)?.isOnline ? 'Online' : 'Last seen recently'}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-[#adadad] hover:text-white transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 256 256">
                  <path d="M205.66,194.34a8,8,0,0,1-11.32,11.32L128,139.31,61.66,205.66a8,8,0,0,1-11.32-11.32L116.69,128,50.34,61.66A8,8,0,0,1,61.66,50.34L128,116.69l66.34-66.35a8,8,0,0,1,11.32,11.32L139.31,128Z"></path>
                </svg>
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 p-4 overflow-y-auto">
              <div className="space-y-3">
                {getMessagesByConversation(selectedConversation.id).map((message) => {
                  const isCurrentUser = message.sender.id === currentUserId
                  return (
                    <div key={message.id} className={`flex gap-3 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                      {!isCurrentUser && (
                        <div className="w-6 h-6 bg-[#363636] rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                          <span className="text-xs">{message.sender.avatar}</span>
                        </div>
                      )}
                      <div className={`max-w-[75%] rounded-lg px-3 py-2 ${
                        isCurrentUser 
                          ? 'bg-white text-black' 
                          : 'bg-[#2d2d2d] text-white'
                      }`}>
                        <p className="text-sm">{message.content}</p>
                        <p className={`text-xs mt-1 ${isCurrentUser ? 'text-gray-600' : 'text-[#adadad]'}`}>
                          {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      {isCurrentUser && (
                        <div className="w-6 h-6 bg-[#363636] rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                          <span className="text-xs">{message.sender.avatar}</span>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-[#363636]">
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 px-3 py-2 bg-[#363636] border border-[#4d4d4d] rounded-lg text-white placeholder-[#adadad] focus:outline-none focus:border-white text-sm"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="px-3 py-2 bg-white hover:bg-gray-100 disabled:bg-[#4d4d4d] disabled:text-[#adadad] text-black rounded-lg transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 256 256">
                    <path d="M231.4,44.34a8,8,0,0,0-8.08-1.46L35.33,101.74a8,8,0,0,0-1,15L72,132.28V184a8,8,0,0,0,13.85,5.15l25-25,34.82,20.31a8,8,0,0,0,11.15-3.39l80-152A8,8,0,0,0,231.4,44.34ZM175.14,62.25,90.62,119.8l-29.47-14.73ZM88,152.15l14.89-14.89,7.49,4.37ZM126.08,173.75l-24.84-14.5L175,63.14Z"></path>
                  </svg>
                </button>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  )
} 