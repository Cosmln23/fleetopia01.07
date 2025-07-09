'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { useUserRole } from '@/lib/useUserRole'
import VerificationBadge from '@/components/VerificationBadge'

interface VerificationStatus {
  status: 'unverified' | 'pending' | 'verified'
  submittedAt?: string
  processedAt?: string
  latestRequest?: {
    id: number
    status: string
    submittedAt: string
    processedAt?: string
    rejectionReason?: string
  }
}

export default function VerificationPage() {
  const { user } = useUser()
  const { isVerified, isPending, verificationStatus } = useUserRole()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [verificationData, setVerificationData] = useState<VerificationStatus | null>(null)

  const [formData, setFormData] = useState({
    companyDocument: null as File | null,
    idDocument: null as File | null,
    additionalNotes: ''
  })

  // Fetch verification status on load
  useEffect(() => {
    fetchVerificationStatus()
  }, [])

  const fetchVerificationStatus = async () => {
    try {
      const response = await fetch('/api/verification')
      if (response.ok) {
        const data = await response.json()
        setVerificationData(data)
      }
    } catch (error) {
      console.error('Error fetching verification status:', error)
    }
  }

  const handleFileChange = (field: 'companyDocument' | 'idDocument', file: File | null) => {
    setFormData(prev => ({
      ...prev,
      [field]: file
    }))
  }

  const uploadFile = async (file: File): Promise<string> => {
    // In a real implementation, this would upload to S3, Cloudinary, etc.
    // For now, we'll simulate with a base64 data URL
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.readAsDataURL(file)
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      if (!formData.companyDocument || !formData.idDocument) {
        setError('Both company document and ID document are required')
        return
      }

      // Upload files (in real implementation, upload to cloud storage)
      const companyDocumentUrl = await uploadFile(formData.companyDocument)
      const idDocumentUrl = await uploadFile(formData.idDocument)

      const verificationData = {
        companyDocument: {
          name: formData.companyDocument.name,
          type: formData.companyDocument.type,
          size: formData.companyDocument.size,
          url: companyDocumentUrl
        },
        idDocument: {
          name: formData.idDocument.name,
          type: formData.idDocument.type,
          size: formData.idDocument.size,
          url: idDocumentUrl
        },
        additionalNotes: formData.additionalNotes
      }

      const response = await fetch('/api/verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(verificationData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to submit verification')
      }

      const result = await response.json()
      setSuccess('Verification documents submitted successfully! We will review them within 2-3 business days.')
      
      // Reset form
      setFormData({
        companyDocument: null,
        idDocument: null,
        additionalNotes: ''
      })

      // Refresh verification status
      await fetchVerificationStatus()
      
      // Refresh user data
      await user?.reload()

    } catch (error) {
      console.error('Error submitting verification:', error)
      setError(error instanceof Error ? error.message : 'Failed to submit verification')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#1a1a1a] p-6">
      <div className="max-w-2xl mx-auto">
        <div className="bg-[#2d2d2d] rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-white">Account Verification</h1>
            <VerificationBadge status={verificationStatus} />
          </div>

          {/* Current Status */}
          <div className="mb-6 p-4 bg-[#363636] rounded-lg">
            <h3 className="text-lg font-semibold text-white mb-2">Current Status</h3>
            
            {isVerified && (
              <div className="text-green-400">
                <p>✅ Your account is verified</p>
                <p className="text-sm text-gray-400 mt-1">
                  You have full access to all platform features including unlimited Agent AI usage.
                </p>
              </div>
            )}

            {isPending && (
              <div className="text-orange-400">
                <p>⏳ Your verification is being processed</p>
                <p className="text-sm text-gray-400 mt-1">
                  We will review your documents within 2-3 business days. You maintain extended access during this period.
                </p>
              </div>
            )}

            {verificationStatus === 'unverified' && (
              <div className="text-yellow-400">
                <p>⚠️ Your account is not verified</p>
                <p className="text-sm text-gray-400 mt-1">
                  Upload verification documents to access all features and gain user trust.
                </p>
              </div>
            )}

            {verificationData?.latestRequest?.rejectionReason && (
              <div className="mt-3 p-3 bg-red-600/20 border border-red-600/30 rounded">
                <p className="text-red-400 font-medium">Previous submission was rejected:</p>
                <p className="text-red-300 text-sm mt-1">{verificationData.latestRequest.rejectionReason}</p>
              </div>
            )}
          </div>

          {/* Benefits of Verification */}
          <div className="mb-6 p-4 bg-[#363636] rounded-lg">
            <h3 className="text-lg font-semibold text-white mb-3">Benefits of Verification</h3>
            <ul className="space-y-2 text-gray-300">
              <li className="flex items-center">
                <span className="text-green-400 mr-2">✓</span>
                Full access to Agent AI (unlimited queries)
              </li>
              <li className="flex items-center">
                <span className="text-green-400 mr-2">✓</span>
                Ability to send quotes and offers
              </li>
              <li className="flex items-center">
                <span className="text-green-400 mr-2">✓</span>
                Green "Verified" badge increases trust
              </li>
              <li className="flex items-center">
                <span className="text-green-400 mr-2">✓</span>
                Priority display in marketplace
              </li>
              <li className="flex items-center">
                <span className="text-green-400 mr-2">✓</span>
                Access to premium features
              </li>
            </ul>
          </div>

          {/* Upload Form */}
          {!isVerified && (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  Company Registration Document *
                </label>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => handleFileChange('companyDocument', e.target.files?.[0] || null)}
                  className="w-full bg-[#363636] border border-[#4d4d4d] rounded-lg px-3 py-2 text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
                  required
                />
                <p className="text-xs text-gray-400 mt-1">
                  Upload your Certificate of Incorporation, Business License, or similar official document
                </p>
              </div>

              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  Legal Representative ID *
                </label>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => handleFileChange('idDocument', e.target.files?.[0] || null)}
                  className="w-full bg-[#363636] border border-[#4d4d4d] rounded-lg px-3 py-2 text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
                  required
                />
                <p className="text-xs text-gray-400 mt-1">
                  Upload ID card, passport, or driver's license of the legal representative
                </p>
              </div>

              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  Additional Notes (Optional)
                </label>
                <textarea
                  value={formData.additionalNotes}
                  onChange={(e) => setFormData(prev => ({ ...prev, additionalNotes: e.target.value }))}
                  rows={3}
                  className="w-full bg-[#363636] border border-[#4d4d4d] rounded-lg px-3 py-2 text-white placeholder-[#adadad] focus:outline-none focus:border-blue-500"
                  placeholder="Any additional information about your business..."
                />
              </div>

              {error && (
                <div className="bg-red-600/20 border border-red-600/30 rounded-lg p-3">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              {success && (
                <div className="bg-green-600/20 border border-green-600/30 rounded-lg p-3">
                  <p className="text-green-400 text-sm">{success}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || isPending}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white font-medium py-3 px-4 rounded-lg transition-colors"
              >
                {loading ? 'Submitting...' : 'Submit Verification Documents'}
              </button>
            </form>
          )}

          {/* Processing Times */}
          <div className="mt-6 p-4 bg-[#363636] rounded-lg">
            <h3 className="text-lg font-semibold text-white mb-2">Processing Information</h3>
            <ul className="text-sm text-gray-300 space-y-1">
              <li>• Review time: 2-3 business days</li>
              <li>• Supported formats: PDF, JPG, PNG</li>
              <li>• Maximum file size: 10MB per document</li>
              <li>• You will receive an email notification when processed</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}