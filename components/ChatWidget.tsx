'use client'

import { useState } from 'react'

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [message, setMessage] = useState('')

  const toggleChat = () => {
    setIsOpen(!isOpen)
  }

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim()) return
    
    // Here you would integrate with actual AI service
    console.log('Sending to AI Agent:', message)
    setMessage('')
  }

  return (
    <div className="fixed bottom-24 left-6 z-50">
      {/* Chat Modal */}
      {isOpen && (
        <div className="mb-4 w-80 h-96 bg-[#1a1a1a] border border-[#363636] rounded-xl shadow-2xl flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-[#363636]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[#363636] rounded-full flex items-center justify-center">
                <span className="text-sm">🤖</span>
              </div>
              <div>
                <h3 className="text-white font-bold text-sm">AI Agent</h3>
                <p className="text-[#adadad] text-xs">Online</p>
              </div>
            </div>
            <button
              onClick={toggleChat}
              className="text-[#adadad] hover:text-white transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 256 256">
                <path d="M205.66,194.34a8,8,0,0,1-11.32,11.32L128,139.31,61.66,205.66a8,8,0,0,1-11.32-11.32L116.69,128,50.34,61.66A8,8,0,0,1,61.66,50.34L128,116.69l66.34-66.35a8,8,0,0,1,11.32,11.32L139.31,128Z"></path>
              </svg>
            </button>
          </div>

          {/* Chat Area */}
          <div className="flex-1 p-4 overflow-y-auto">
            <div className="space-y-3">
              {/* AI Welcome Message */}
              <div className="flex gap-3">
                <div className="w-6 h-6 bg-[#363636] rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-xs">🤖</span>
                </div>
                <div className="bg-[#2d2d2d] rounded-lg px-3 py-2 max-w-[85%]">
                  <p className="text-white text-sm">Hello! I'm your AI assistant for Fleetopia. How can I help you with transport and logistics today?</p>
                </div>
              </div>
            </div>
          </div>

          {/* Input Area */}
          <div className="p-4 border-t border-[#363636]">
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Ask me anything..."
                className="flex-1 px-3 py-2 bg-[#363636] border border-[#4d4d4d] rounded-lg text-white placeholder-[#adadad] focus:outline-none focus:border-white text-sm"
              />
              <button
                type="submit"
                disabled={!message.trim()}
                className="px-3 py-2 bg-white hover:bg-gray-100 disabled:bg-[#4d4d4d] disabled:text-[#adadad] text-black rounded-lg transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 256 256">
                  <path d="M231.4,44.34a8,8,0,0,0-8.08-1.46L35.33,101.74a8,8,0,0,0-1,15L72,132.28V184a8,8,0,0,0,13.85,5.15l25-25,34.82,20.31a8,8,0,0,0,11.15-3.39l80-152A8,8,0,0,0,231.4,44.34ZM175.14,62.25,90.62,119.8l-29.47-14.73ZM88,152.15l14.89-14.89,7.49,4.37ZM126.08,173.75l-24.84-14.5L175,63.14Z"></path>
                </svg>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Chat Icon Button */}
      <button
        onClick={toggleChat}
        className="w-14 h-14 bg-[#363636] hover:bg-[#4d4d4d] border border-[#4d4d4d] rounded-full flex items-center justify-center shadow-lg transition-colors group"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 256 256" className="text-white group-hover:text-[#adadad]">
          <path d="M216,48H40A16,16,0,0,0,24,64V192a15.85,15.85,0,0,0,9.24,14.5A16.13,16.13,0,0,0,40,208a15.89,15.89,0,0,0,10.25-3.78L69.75,192H216a16,16,0,0,0,16-16V64A16,16,0,0,0,216,48ZM40,192l-.2-.2L40,64H216V176H72a8,8,0,0,0-5.15,1.86Z"></path>
        </svg>
        
        {/* Notification dot when closed */}
        {!isOpen && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full"></div>
        )}
      </button>
    </div>
  )
} 