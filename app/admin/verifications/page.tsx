'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@clerk/nextjs'
import VerificationBadge from '@/components/VerificationBadge'

interface VerificationRequest {
  id: number
  userId: string
  userName: string
  userEmail: string
  userCompany: string
  userPhone: string
  documents: {
    companyDocument: {
      name: string
      type: string
      url: string
    }
    idDocument: {
      name: string
      type: string
      url: string
    }
    additionalNotes?: string
  }
  status: 'pending' | 'approved' | 'rejected'
  submittedAt: string
  processedAt?: string
  processedBy?: string
  rejectionReason?: string
}

export default function AdminVerificationsPage() {
  const { orgRole } = useAuth()
  const [requests, setRequests] = useState<VerificationRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<'pending' | 'approved' | 'rejected'>('pending')
  const [processingId, setProcessingId] = useState<number | null>(null)

  // Check if user is admin
  if (orgRole !== 'admin') {
    return (
      <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Access Denied</h1>
          <p className="text-gray-400">You need admin privileges to access this page.</p>
        </div>
      </div>
    )
  }

  useEffect(() => {
    fetchRequests()
  }, [selectedStatus])

  const fetchRequests = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/verification?status=${selectedStatus}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch verification requests')
      }

      const data = await response.json()
      setRequests(data.requests)
    } catch (error) {
      console.error('Error fetching requests:', error)
      setError(error instanceof Error ? error.message : 'Failed to fetch requests')
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (requestId: number) => {
    if (!confirm('Are you sure you want to approve this verification request?')) {
      return
    }

    try {
      setProcessingId(requestId)
      const response = await fetch('/api/admin/verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requestId,
          action: 'approve'
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to approve request')
      }

      // Refresh the list
      await fetchRequests()
      alert('Verification request approved successfully!')
    } catch (error) {
      console.error('Error approving request:', error)
      alert('Failed to approve request: ' + (error instanceof Error ? error.message : 'Unknown error'))
    } finally {
      setProcessingId(null)
    }
  }

  const handleReject = async (requestId: number) => {
    const rejectionReason = prompt('Please provide a reason for rejection:')
    if (!rejectionReason) {
      return
    }

    try {
      setProcessingId(requestId)
      const response = await fetch('/api/admin/verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requestId,
          action: 'reject',
          rejectionReason
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to reject request')
      }

      // Refresh the list
      await fetchRequests()
      alert('Verification request rejected successfully!')
    } catch (error) {
      console.error('Error rejecting request:', error)
      alert('Failed to reject request: ' + (error instanceof Error ? error.message : 'Unknown error'))
    } finally {
      setProcessingId(null)
    }
  }

  const openDocument = (url: string, name: string) => {
    // In a real implementation, this would open the document in a new tab
    // For now, we'll just show an alert since we're using base64 URLs
    alert(`Opening document: ${name}`)
  }

  return (
    <div className="min-h-screen bg-[#1a1a1a] p-6">
      <div className="max-w-6xl mx-auto">
        <div className="bg-[#2d2d2d] rounded-lg p-6">
          <h1 className="text-2xl font-bold text-white mb-6">Verification Management</h1>

          {/* Status Filter */}
          <div className="mb-6">
            <div className="flex space-x-2">
              {(['pending', 'approved', 'rejected'] as const).map(status => (
                <button
                  key={status}
                  onClick={() => setSelectedStatus(status)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedStatus === status
                      ? 'bg-blue-600 text-white'
                      : 'bg-[#363636] text-gray-300 hover:bg-[#4d4d4d]'
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-600/20 border border-red-600/30 rounded-lg p-4 mb-6">
              <p className="text-red-400">{error}</p>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-400 mt-2">Loading verification requests...</p>
            </div>
          )}

          {/* Requests List */}
          {!loading && requests.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-400">No {selectedStatus} verification requests found.</p>
            </div>
          )}

          {!loading && requests.length > 0 && (
            <div className="space-y-4">
              {requests.map(request => (
                <div key={request.id} className="bg-[#363636] rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-white">{request.userName}</h3>
                        <VerificationBadge status={request.status as any} />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-300">
                            <span className="font-medium">Company:</span> {request.userCompany}
                          </p>
                          <p className="text-gray-300">
                            <span className="font-medium">Email:</span> {request.userEmail}
                          </p>
                          <p className="text-gray-300">
                            <span className="font-medium">Phone:</span> {request.userPhone}
                          </p>
                        </div>
                        
                        <div>
                          <p className="text-gray-300">
                            <span className="font-medium">Submitted:</span> {new Date(request.submittedAt).toLocaleDateString()}
                          </p>
                          {request.processedAt && (
                            <p className="text-gray-300">
                              <span className="font-medium">Processed:</span> {new Date(request.processedAt).toLocaleDateString()}
                            </p>
                          )}
                          {request.rejectionReason && (
                            <p className="text-red-400 mt-2">
                              <span className="font-medium">Rejection Reason:</span> {request.rejectionReason}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Documents */}
                      <div className="mt-4">
                        <h4 className="font-medium text-white mb-2">Documents:</h4>
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => openDocument(request.documents.companyDocument.url, request.documents.companyDocument.name)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition-colors"
                          >
                            📄 {request.documents.companyDocument.name}
                          </button>
                          <button
                            onClick={() => openDocument(request.documents.idDocument.url, request.documents.idDocument.name)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition-colors"
                          >
                            🆔 {request.documents.idDocument.name}
                          </button>
                        </div>
                        
                        {request.documents.additionalNotes && (
                          <div className="mt-3 p-3 bg-[#2d2d2d] rounded">
                            <p className="text-sm text-gray-300">
                              <span className="font-medium">Notes:</span> {request.documents.additionalNotes}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    {request.status === 'pending' && (
                      <div className="flex space-x-2 ml-4">
                        <button
                          onClick={() => handleApprove(request.id)}
                          disabled={processingId === request.id}
                          className="bg-green-600 hover:bg-green-700 disabled:bg-green-800 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
                        >
                          {processingId === request.id ? 'Processing...' : 'Approve'}
                        </button>
                        <button
                          onClick={() => handleReject(request.id)}
                          disabled={processingId === request.id}
                          className="bg-red-600 hover:bg-red-700 disabled:bg-red-800 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
                        >
                          {processingId === request.id ? 'Processing...' : 'Reject'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}