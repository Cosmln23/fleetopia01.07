'use client'

import { useState } from 'react'
import { mockSystemAlerts, getUnreadNotificationsCount, getAlertTypeColor, getAlertTypeIcon } from '@/lib/communication-data'
import { SystemAlert } from '@/lib/types'

interface NotificationsDropdownProps {
  isOpen: boolean
  onClose: () => void
}

export default function NotificationsDropdown({ isOpen, onClose }: NotificationsDropdownProps) {
  const [alerts, setAlerts] = useState(mockSystemAlerts)

  if (!isOpen) return null

  const handleMarkAsRead = (alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, read: true } : alert
    ))
  }

  const handleMarkAllAsRead = () => {
    setAlerts(prev => prev.map(alert => ({ ...alert, read: true })))
  }

  const unreadCount = alerts.filter(alert => !alert.read).length

  return (
    <div className="fixed bottom-24 right-6 z-50">
      <div className="w-80 h-96 bg-[#1a1a1a] border border-[#363636] rounded-xl shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#363636]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#363636] rounded-full flex items-center justify-center">
              <span className="text-sm">🔔</span>
            </div>
            <div>
              <h3 className="text-white font-bold text-sm">Notifications</h3>
              <p className="text-[#adadad] text-xs">
                {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-[#adadad] hover:text-white text-xs transition-colors"
              >
                Mark all read
              </button>
            )}
            <button
              onClick={onClose}
              className="text-[#adadad] hover:text-white transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 256 256">
                <path d="M205.66,194.34a8,8,0,0,1-11.32,11.32L128,139.31,61.66,205.66a8,8,0,0,1-11.32-11.32L116.69,128,50.34,61.66A8,8,0,0,1,61.66,50.34L128,116.69l66.34-66.35a8,8,0,0,1,11.32,11.32L139.31,128Z"></path>
              </svg>
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto">
          {alerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-4">
              <div className="w-12 h-12 bg-[#363636] rounded-full flex items-center justify-center mb-3">
                <span className="text-2xl">🔔</span>
              </div>
              <p className="text-[#adadad] text-sm">No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y divide-[#2d2d2d]">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-4 hover:bg-[#2d2d2d] transition-colors cursor-pointer ${
                    !alert.read ? 'bg-[#2d2d2d] bg-opacity-50' : ''
                  }`}
                  onClick={() => handleMarkAsRead(alert.id)}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      !alert.read ? 'bg-[#363636]' : 'bg-[#2d2d2d]'
                    }`}>
                      <span className="text-sm">{getAlertTypeIcon(alert.type)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className={`text-sm font-medium ${!alert.read ? 'text-white' : 'text-[#adadad]'}`}>
                            {alert.message}
                          </p>
                          {alert.details && (
                            <p className="text-[#adadad] text-xs mt-1">{alert.details}</p>
                          )}
                          <p className="text-[#adadad] text-xs mt-2">
                            {new Date(alert.createdAt).toLocaleDateString()} at{' '}
                            {new Date(alert.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        {!alert.read && (
                          <div className="w-2 h-2 bg-blue-400 rounded-full flex-shrink-0 mt-1"></div>
                        )}
                      </div>
                      {alert.action && (
                        <button className="mt-2 px-3 py-1 bg-[#363636] hover:bg-[#4d4d4d] text-white text-xs rounded-lg transition-colors">
                          {alert.action.label}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-[#363636] text-center">
          <button className="text-[#adadad] hover:text-white text-xs transition-colors">
            View all notifications
          </button>
        </div>
      </div>
    </div>
  )
} 