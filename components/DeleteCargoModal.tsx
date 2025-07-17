'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'

interface UserCargo {
  id: string
  title: string
  weight: number
  price: number
  status: string
  fromAddress: string
  toAddress: string
  fromCountry: string
  toCountry: string
  urgency: string
  cargoType: string
  createdAt: string
}

interface DeleteCargoModalProps {
  isOpen: boolean
  onClose: () => void
  onDelete: () => void // Callback to refresh marketplace
}

export default function DeleteCargoModal({ isOpen, onClose, onDelete }: DeleteCargoModalProps) {
  const { user } = useUser()
  const [userCargo, setUserCargo] = useState<UserCargo[]>([])
  const [selectedCargo, setSelectedCargo] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showConfirmation, setShowConfirmation] = useState(false)

  // Fetch user's cargo when modal opens
  useEffect(() => {
    if (isOpen && user) {
      fetchUserCargo()
    }
  }, [isOpen, user])

  const fetchUserCargo = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/cargo/my-cargo')
      const data = await response.json()
      
      if (response.ok) {
        setUserCargo(data.cargo || [])
      } else {
        setError(data.error || 'Failed to fetch your cargo')
      }
    } catch (error) {
      setError('Network error. Please try again.')
      console.error('Error fetching user cargo:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCargoSelect = (cargoId: string) => {
    const newSelected = new Set(selectedCargo)
    if (newSelected.has(cargoId)) {
      newSelected.delete(cargoId)
    } else {
      newSelected.add(cargoId)
    }
    setSelectedCargo(newSelected)
  }

  const handleSelectAll = () => {
    if (selectedCargo.size === userCargo.length) {
      setSelectedCargo(new Set())
    } else {
      setSelectedCargo(new Set(userCargo.map(cargo => cargo.id)))
    }
  }

  const handleDeleteSelected = () => {
    if (selectedCargo.size === 0) return
    setShowConfirmation(true)
  }

  const confirmDelete = async () => {
    if (selectedCargo.size === 0) return
    
    setIsDeleting(true)
    setError(null)
    let successCount = 0
    let errorCount = 0

    try {
      // Delete each selected cargo
      for (const cargoId of selectedCargo) {
        try {
          const response = await fetch(`/api/cargo/${cargoId}`, {
            method: 'DELETE'
          })
          
          if (response.ok) {
            successCount++
          } else {
            errorCount++
            console.error(`Failed to delete cargo ${cargoId}`)
          }
        } catch (error) {
          errorCount++
          console.error(`Error deleting cargo ${cargoId}:`, error)
        }
      }

      // Update UI based on results
      if (successCount > 0) {
        // Refresh cargo list
        await fetchUserCargo()
        setSelectedCargo(new Set())
        
        // Notify parent to refresh marketplace
        onDelete()
        
        if (errorCount === 0) {
          // All successful - close modal
          setTimeout(() => {
            onClose()
          }, 1000)
        }
      }

      if (errorCount > 0) {
        setError(`${errorCount} cargo(s) could not be deleted. Please try again.`)
      }

    } catch (error) {
      setError('Failed to delete cargo. Please try again.')
      console.error('Delete operation error:', error)
    } finally {
      setIsDeleting(false)
      setShowConfirmation(false)
    }
  }

  const handleClose = () => {
    if (!isDeleting) {
      setSelectedCargo(new Set())
      setError(null)
      setShowConfirmation(false)
      onClose()
    }
  }

  if (!isOpen) return null

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'NEW': return '#0bda0b'
      case 'OPEN': return '#ffaa00'
      case 'TAKEN': return '#0099ff'
      case 'IN_PROGRESS': return '#ff6600'
      case 'COMPLETED': return '#888888'
      default: return '#adadad'
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-[#1a1a1a] rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">Delete Your Cargo</h2>
          <button
            onClick={handleClose}
            disabled={isDeleting}
            className="text-[#adadad] hover:text-white text-2xl disabled:opacity-50"
          >
            ×
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-600 bg-opacity-20 border border-red-600 rounded-lg p-3 mb-4">
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-8">
            <p className="text-[#adadad]">Loading your cargo...</p>
          </div>
        )}

        {/* No Cargo State */}
        {!isLoading && userCargo.length === 0 && (
          <div className="text-center py-8">
            <p className="text-[#adadad]">You haven't posted any cargo yet.</p>
          </div>
        )}

        {/* Cargo List */}
        {!isLoading && userCargo.length > 0 && (
          <>
            {/* Controls */}
            <div className="flex justify-between items-center mb-4">
              <button
                onClick={handleSelectAll}
                disabled={isDeleting}
                className="text-blue-400 hover:text-blue-300 text-sm disabled:opacity-50"
              >
                {selectedCargo.size === userCargo.length ? 'Deselect All' : 'Select All'}
              </button>
              <p className="text-[#adadad] text-sm">
                {selectedCargo.size} of {userCargo.length} selected
              </p>
            </div>

            {/* Cargo Items */}
            <div className="space-y-3 mb-6">
              {userCargo.map((cargo) => (
                <div
                  key={cargo.id}
                  className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                    selectedCargo.has(cargo.id)
                      ? 'border-red-500 bg-red-500 bg-opacity-10'
                      : 'border-[#363636] hover:border-[#4d4d4d]'
                  }`}
                  onClick={() => !isDeleting && handleCargoSelect(cargo.id)}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={selectedCargo.has(cargo.id)}
                      onChange={() => handleCargoSelect(cargo.id)}
                      disabled={isDeleting}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-white font-medium">{cargo.title}</h3>
                        <div className="flex gap-2">
                          <span
                            className="px-2 py-1 rounded text-xs font-medium"
                            style={{
                              backgroundColor: `${getStatusColor(cargo.status)}20`,
                              color: getStatusColor(cargo.status),
                              border: `1px solid ${getStatusColor(cargo.status)}40`
                            }}
                          >
                            {cargo.status}
                          </span>
                        </div>
                      </div>
                      <div className="text-[#adadad] text-sm space-y-1">
                        <p>{cargo.fromAddress} → {cargo.toAddress}</p>
                        <p>{cargo.weight}kg • €{cargo.price} • {cargo.urgency}</p>
                        <p>Posted: {new Date(cargo.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3">
              <button
                onClick={handleClose}
                disabled={isDeleting}
                className="px-4 py-2 bg-[#363636] text-white rounded-lg hover:bg-[#4d4d4d] disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteSelected}
                disabled={selectedCargo.size === 0 || isDeleting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Deleting...
                  </>
                ) : (
                  `Delete Selected (${selectedCargo.size})`
                )}
              </button>
            </div>
          </>
        )}

        {/* Confirmation Dialog */}
        {showConfirmation && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-60">
            <div className="bg-[#1a1a1a] rounded-xl p-6 w-full max-w-md">
              <h3 className="text-lg font-bold text-white mb-4">Confirm Deletion</h3>
              <p className="text-[#adadad] mb-6">
                Are you sure you want to delete {selectedCargo.size} cargo item(s)? 
                This action cannot be undone.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowConfirmation(false)}
                  className="px-4 py-2 bg-[#363636] text-white rounded-lg hover:bg-[#4d4d4d]"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Delete Permanently
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}