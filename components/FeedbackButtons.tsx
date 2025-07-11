/**
 * FEEDBACK BUTTONS COMPONENT
 * 
 * Thumbs up/down feedback system for AI agent suggestions
 * Features:
 * - Visual feedback buttons with icons
 * - Real-time feedback submission
 * - Loading states and success animations
 * - Feedback statistics display
 */

'use client'

import { useState } from 'react'

interface FeedbackButtonsProps {
  suggestionId: string
  initialFeedback?: 'UP' | 'DOWN' | null
  onFeedbackSubmitted?: (feedback: 'UP' | 'DOWN', stats: any) => void
  size?: 'sm' | 'md' | 'lg'
  showStats?: boolean
  className?: string
}

interface FeedbackStats {
  totalFeedback: number
  positiveFeedback: number
  negativeFeedback: number
  positivePercentage: number
}

export default function FeedbackButtons({
  suggestionId,
  initialFeedback = null,
  onFeedbackSubmitted,
  size = 'md',
  showStats = false,
  className = ''
}: FeedbackButtonsProps) {
  const [currentFeedback, setCurrentFeedback] = useState<'UP' | 'DOWN' | null>(initialFeedback)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [stats, setStats] = useState<FeedbackStats | null>(null)
  const [showSuccess, setShowSuccess] = useState(false)

  // Size configurations
  const sizeConfig = {
    sm: {
      button: 'w-6 h-6 text-sm',
      icon: 'w-3 h-3',
      text: 'text-xs'
    },
    md: {
      button: 'w-8 h-8 text-base',
      icon: 'w-4 h-4',
      text: 'text-sm'
    },
    lg: {
      button: 'w-10 h-10 text-lg',
      icon: 'w-5 h-5',
      text: 'text-base'
    }
  }

  const config = sizeConfig[size]

  const submitFeedback = async (feedbackType: 'UP' | 'DOWN') => {
    if (isSubmitting) return

    setIsSubmitting(true)
    
    try {
      const response = await fetch('/api/agent/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          suggestionId,
          feedbackType,
          notes: null
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to submit feedback')
      }

      const data = await response.json()
      
      setCurrentFeedback(feedbackType)
      setStats(data.stats)
      setShowSuccess(true)
      
      // Call callback if provided
      if (onFeedbackSubmitted) {
        onFeedbackSubmitted(feedbackType, data.stats)
      }
      
      // Hide success animation after 2 seconds
      setTimeout(() => setShowSuccess(false), 2000)
      
      console.log('✅ Feedback submitted successfully:', feedbackType)
      
    } catch (error) {
      console.error('❌ Error submitting feedback:', error)
      // TODO: Show error toast/notification
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleThumbsUp = () => {
    const newFeedback = currentFeedback === 'UP' ? null : 'UP'
    if (newFeedback === null) {
      // Remove feedback (not implemented in this version)
      return
    }
    submitFeedback('UP')
  }

  const handleThumbsDown = () => {
    const newFeedback = currentFeedback === 'DOWN' ? null : 'DOWN'
    if (newFeedback === null) {
      // Remove feedback (not implemented in this version)
      return
    }
    submitFeedback('DOWN')
  }

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {/* Thumbs Up Button */}
      <button
        onClick={handleThumbsUp}
        disabled={isSubmitting}
        className={`
          ${config.button}
          flex items-center justify-center rounded-full border transition-all duration-200
          ${currentFeedback === 'UP' 
            ? 'bg-green-500 text-white border-green-500 shadow-lg scale-110' 
            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-green-100 hover:border-green-300 hover:text-green-600'
          }
          ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          ${showSuccess && currentFeedback === 'UP' ? 'animate-pulse' : ''}
        `}
        title="Thumbs up - Good suggestion"
      >
        {isSubmitting && currentFeedback === 'UP' ? (
          <div className={`${config.icon} animate-spin rounded-full border-2 border-white border-t-transparent`} />
        ) : (
          <svg className={config.icon} fill="currentColor" viewBox="0 0 24 24">
            <path d="M7.493 18.75c-.425 0-.82-.236-.975-.632A7.48 7.48 0 016 15.375c0-1.75.599-3.358 1.602-4.634.151-.192.373-.309.6-.397.473-.183.89-.514 1.212-.924a9.042 9.042 0 012.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 00.322-1.672V3a.75.75 0 01.75-.75 2.25 2.25 0 012.25 2.25c0 1.152-.26 2.243-.723 3.218-.266.558-.107 1.282.725 1.282h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 01-2.649 7.521c-.388.482-.987.729-1.605.729H14.23c-.483 0-.964-.078-1.423-.230l-3.114-1.04a4.501 4.501 0 00-1.423-.23h-.777zM2.331 10.977a11.969 11.969 0 00-.831 4.398 12 12 0 00.52 3.507c.26.85 1.084 1.368 1.973 1.368H4.9c.445 0 .72-.498.523-.898a8.963 8.963 0 01-.924-3.977c0-1.708.476-3.305 1.302-4.666.245-.403-.028-.959-.5-.959H4.25c-.832 0-1.612.453-1.918 1.227z" />
          </svg>
        )}
      </button>

      {/* Thumbs Down Button */}
      <button
        onClick={handleThumbsDown}
        disabled={isSubmitting}
        className={`
          ${config.button}
          flex items-center justify-center rounded-full border transition-all duration-200
          ${currentFeedback === 'DOWN' 
            ? 'bg-red-500 text-white border-red-500 shadow-lg scale-110' 
            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-red-100 hover:border-red-300 hover:text-red-600'
          }
          ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          ${showSuccess && currentFeedback === 'DOWN' ? 'animate-pulse' : ''}
        `}
        title="Thumbs down - Poor suggestion"
      >
        {isSubmitting && currentFeedback === 'DOWN' ? (
          <div className={`${config.icon} animate-spin rounded-full border-2 border-white border-t-transparent`} />
        ) : (
          <svg className={config.icon} fill="currentColor" viewBox="0 0 24 24">
            <path d="M15.73 5.25h1.035A7.465 7.465 0 0118 9.375a7.465 7.465 0 01-1.235 4.125h-.148c-.806 0-1.534.446-2.031 1.08a9.04 9.04 0 01-2.861 2.4c-.723.384-1.35.956-1.653 1.715a4.498 4.498 0 00-.322 1.672V21a.75.75 0 01-.75.75 2.25 2.25 0 01-2.25-2.25c0-1.152.26-2.243.723-3.218C7.74 15.724 7.366 15 6.748 15H3.622c-1.026 0-1.945-.694-2.054-1.715A12.134 12.134 0 011.5 12c0-2.848.992-5.464 2.649-7.521C4.537 3.997 5.136 3.75 5.754 3.75h4.093c.483 0 .964.078 1.423.23l3.114 1.04a4.501 4.501 0 001.423.23zM21.669 13.023c.536-1.362.831-2.845.831-4.398 0-1.22-.182-2.398-.52-3.507-.26-.85-1.084-1.368-1.973-1.368H19.1c-.445 0-.72.498-.523.898.591 1.2.924 2.55.924 3.977a8.959 8.959 0 01-1.302 4.666c-.245.403.028.959.5.959h1.053c.832 0 1.612-.453 1.918-1.227z" />
          </svg>
        )}
      </button>

      {/* Feedback Stats (Optional) */}
      {showStats && stats && (
        <div className={`flex items-center space-x-1 ${config.text} text-gray-500 dark:text-gray-400`}>
          <span className="text-green-600">{stats.positiveFeedback}</span>
          <span>/</span>
          <span className="text-red-600">{stats.negativeFeedback}</span>
          {stats.totalFeedback > 0 && (
            <span className="ml-1">
              ({stats.positivePercentage.toFixed(0)}% positive)
            </span>
          )}
        </div>
      )}

      {/* Success Animation */}
      {showSuccess && (
        <div className={`${config.text} text-green-600 animate-fade-in`}>
          ✓ Feedback recorded
        </div>
      )}
    </div>
  )
}

// Hook for using feedback functionality
export function useFeedback() {
  const [feedbackHistory, setFeedbackHistory] = useState([])
  const [isLoading, setIsLoading] = useState(false)

  const loadFeedbackHistory = async (limit = 50) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/agent/feedback?limit=${limit}`)
      if (response.ok) {
        const data = await response.json()
        setFeedbackHistory(data.feedback)
      }
    } catch (error) {
      console.error('Error loading feedback history:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getFeedbackStats = async (suggestionId?: string) => {
    try {
      const url = suggestionId 
        ? `/api/agent/feedback?suggestionId=${suggestionId}`
        : '/api/agent/feedback'
      
      const response = await fetch(url, { method: 'PATCH' })
      if (response.ok) {
        const data = await response.json()
        return data
      }
    } catch (error) {
      console.error('Error fetching feedback stats:', error)
    }
    return null
  }

  return {
    feedbackHistory,
    isLoading,
    loadFeedbackHistory,
    getFeedbackStats
  }
}