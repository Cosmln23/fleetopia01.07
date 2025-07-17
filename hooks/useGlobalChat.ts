'use client'

import { useState, useCallback } from 'react'
import { useUser } from '@clerk/nextjs'

export interface ChatParticipant {
  id: string
  name: string
  avatar?: string
}

export function useGlobalChat() {
  const { user } = useUser()
  const [isCreatingConversation, setIsCreatingConversation] = useState(false)

  const createOrFindConversation = useCallback(async (
    participant: ChatParticipant,
    cargoId?: string
  ): Promise<string | null> => {
    if (!user || isCreatingConversation) {
      return null
    }

    setIsCreatingConversation(true)
    
    try {
      const response = await fetch('/api/chat/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          participantId: participant.id,
          participantName: participant.name,
          cargoId: cargoId
        })
      })

      if (response.ok) {
        const data = await response.json()
        return data.id
      } else {
        console.error('Failed to create conversation:', response.statusText)
        return null
      }
    } catch (error) {
      console.error('Error creating conversation:', error)
      return null
    } finally {
      setIsCreatingConversation(false)
    }
  }, [user, isCreatingConversation])

  const startChatWithCargoOwner = useCallback(async (
    cargoId: string,
    ownerName: string,
    ownerId: string
  ): Promise<string | null> => {
    return createOrFindConversation(
      { id: ownerId, name: ownerName },
      cargoId
    )
  }, [createOrFindConversation])

  const startDirectChat = useCallback(async (
    participant: ChatParticipant
  ): Promise<string | null> => {
    return createOrFindConversation(participant)
  }, [createOrFindConversation])

  return {
    createOrFindConversation,
    startChatWithCargoOwner,
    startDirectChat,
    isCreatingConversation
  }
}