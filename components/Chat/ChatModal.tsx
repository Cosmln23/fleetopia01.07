'use client'

import { useState, useEffect, useRef } from 'react'
import { ChatConversation, ChatMessage, getMessagesForConversation, sendMessage, formatMessageTime, mockCurrentUser } from '@/lib/chat-system'

interface ChatModalProps {
  conversation: ChatConversation
  onClose: () => void
}

export default function ChatModal({ conversation, onClose }: ChatModalProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const otherParticipant = conversation.participants.find(p => p.id !== mockCurrentUser.id)

  useEffect(() => {
    // Load messages for this conversation
    const conversationMessages = getMessagesForConversation(conversation.id)
    setMessages(conversationMessages)
  }, [conversation.id])

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return

    setIsLoading(true)
    
    try {
      // Send message
      const message = sendMessage(conversation.id, newMessage)
      setMessages(prev => [...prev, message])
      setNewMessage('')
      
      // Simulate response after 2 seconds
      setTimeout(() => {
        const responseMessage: ChatMessage = {
          id: `msg_${Date.now()}`,
          senderId: otherParticipant!.id,
          senderName: otherParticipant!.name,
          senderAvatar: otherParticipant!.avatar,
          receiverId: mockCurrentUser.id,
          content: 'Thanks for your message! I\'ll review this and get back to you soon.',
          timestamp: new Date().toISOString(),
          read: false,
          type: 'text'
        }
        setMessages(prev => [...prev, responseMessage])
      }, 2000)
      
    } catch (error) {
      console.error('Failed to send message:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-[#1a1a1a] rounded-xl w-full max-w-md h-[600px] flex flex-col border border-[#363636]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#363636]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#363636] flex items-center justify-center overflow-hidden">
              {otherParticipant?.avatar ? (
                <img
                  src={otherParticipant.avatar}
                  alt={otherParticipant.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-[#adadad] text-sm font-medium">
                  {otherParticipant?.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div>
              <h3 className="text-white font-medium">{otherParticipant?.name}</h3>
              <p className="text-[#adadad] text-xs">
                {otherParticipant?.isOnline ? 'Online' : 'Offline'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#adadad] hover:text-white transition-colors p-1"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center text-[#adadad] py-8">
              <p>Start a conversation with {otherParticipant?.name}</p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.senderId === mockCurrentUser.id ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] p-3 rounded-lg ${
                    message.senderId === mockCurrentUser.id
                      ? 'bg-green-500 text-white'
                      : 'bg-[#2d2d2d] text-white border border-[#363636]'
                  }`}
                >
                  <p className="text-sm">{message.content}</p>
                  <p className={`text-xs mt-1 ${
                    message.senderId === mockCurrentUser.id ? 'text-green-100' : 'text-[#adadad]'
                  }`}>
                    {formatMessageTime(message.timestamp)}
                  </p>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="p-4 border-t border-[#363636]">
          <div className="flex gap-2">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className="flex-1 bg-[#2d2d2d] border border-[#363636] rounded-lg px-3 py-2 text-white text-sm resize-none focus:outline-none focus:border-green-500"
              rows={1}
              disabled={isLoading}
            />
            <button
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || isLoading}
              className="bg-green-500 hover:bg-green-600 disabled:bg-[#363636] disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition-colors"
            >
              {isLoading ? (
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}