'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'

interface OnboardingData {
  fullName: string
  phone: string
  company: string
  vatNumber: string
  role: 'provider' | 'carrier'
  industry: string
  address: string
  city: string
  country: string
  vehicleCount?: number
}

export default function OnboardingPage() {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const [formData, setFormData] = useState<OnboardingData>({
    fullName: user?.fullName || '',
    phone: '',
    company: '',
    vatNumber: '',
    role: 'provider',
    industry: '',
    address: '',
    city: '',
    country: 'Romania',
    vehicleCount: undefined
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Validate required fields
      if (!formData.fullName || !formData.phone || !formData.company || !formData.vatNumber) {
        setError('Toate câmpurile obligatorii trebuie completate')
        setLoading(false)
        return
      }

      // Save profile to database
      const profileResponse = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!profileResponse.ok) {
        const errorData = await profileResponse.json()
        throw new Error(errorData.error || 'Eroare la salvarea profilului')
      }

      // Update Clerk metadata
      await user?.update({
        publicMetadata: {
          ...user.publicMetadata,
          profileCompleted: true,
          role: formData.role,
          company: formData.company,
          completedAt: Date.now()
        }
      })

      console.log('✅ Onboarding completed successfully')
      
      // Redirect based on role
      if (formData.role === 'carrier') {
        router.push('/dispatcher')
      } else {
        router.push('/marketplace')
      }

    } catch (error) {
      console.error('❌ Onboarding error:', error)
      setError(error instanceof Error ? error.message : 'Eroare la finalizarea profilului')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center p-4">
      <div className="bg-[#2d2d2d] rounded-lg p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-white mb-2">Finalizează-ți profilul</h1>
          <p className="text-[#adadad] text-sm">
            Completează datele de business pentru a continua accesul complet la platformă
          </p>
        </div>

        {error && (
          <div className="bg-red-600/20 border border-red-600/30 rounded-lg p-3 mb-4">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name */}
          <div>
            <label className="block text-white text-sm font-medium mb-2">
              Nume complet *
            </label>
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              required
              className="w-full bg-[#363636] border border-[#4d4d4d] rounded-lg px-3 py-2 text-white placeholder-[#adadad] focus:outline-none focus:border-blue-500"
              placeholder="Ion Popescu"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-white text-sm font-medium mb-2">
              Telefon *
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              required
              className="w-full bg-[#363636] border border-[#4d4d4d] rounded-lg px-3 py-2 text-white placeholder-[#adadad] focus:outline-none focus:border-blue-500"
              placeholder="+40 720 123 456"
            />
          </div>

          {/* Company */}
          <div>
            <label className="block text-white text-sm font-medium mb-2">
              Companie / Persoană juridică *
            </label>
            <input
              type="text"
              name="company"
              value={formData.company}
              onChange={handleChange}
              required
              className="w-full bg-[#363636] border border-[#4d4d4d] rounded-lg px-3 py-2 text-white placeholder-[#adadad] focus:outline-none focus:border-blue-500"
              placeholder="SC Transport SRL"
            />
          </div>

          {/* VAT Number */}
          <div>
            <label className="block text-white text-sm font-medium mb-2">
              CUI / VAT Number *
            </label>
            <input
              type="text"
              name="vatNumber"
              value={formData.vatNumber}
              onChange={handleChange}
              required
              className="w-full bg-[#363636] border border-[#4d4d4d] rounded-lg px-3 py-2 text-white placeholder-[#adadad] focus:outline-none focus:border-blue-500"
              placeholder="RO12345678"
            />
          </div>

          {/* Role */}
          <div>
            <label className="block text-white text-sm font-medium mb-2">
              Tip activitate *
            </label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              required
              className="w-full bg-[#363636] border border-[#4d4d4d] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
            >
              <option value="provider">Expeditor (postez marfă)</option>
              <option value="carrier">Transportator (preiau marfă)</option>
            </select>
          </div>

          {/* Industry */}
          <div>
            <label className="block text-white text-sm font-medium mb-2">
              Industrie
            </label>
            <select
              name="industry"
              value={formData.industry}
              onChange={handleChange}
              className="w-full bg-[#363636] border border-[#4d4d4d] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
            >
              <option value="">Selectează industria</option>
              <option value="Transport">Transport</option>
              <option value="Logistică">Logistică</option>
              <option value="Expediere">Expediere</option>
              <option value="Agricultură">Agricultură</option>
              <option value="Construcții">Construcții</option>
              <option value="Comerț">Comerț</option>
              <option value="Altele">Altele</option>
            </select>
          </div>

          {/* Address */}
          <div>
            <label className="block text-white text-sm font-medium mb-2">
              Adresă sediu
            </label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              className="w-full bg-[#363636] border border-[#4d4d4d] rounded-lg px-3 py-2 text-white placeholder-[#adadad] focus:outline-none focus:border-blue-500"
              placeholder="Str. Victoriei 123"
            />
          </div>

          {/* City */}
          <div>
            <label className="block text-white text-sm font-medium mb-2">
              Oraș
            </label>
            <input
              type="text"
              name="city"
              value={formData.city}
              onChange={handleChange}
              className="w-full bg-[#363636] border border-[#4d4d4d] rounded-lg px-3 py-2 text-white placeholder-[#adadad] focus:outline-none focus:border-blue-500"
              placeholder="București"
            />
          </div>

          {/* Vehicle Count - only for carriers */}
          {formData.role === 'carrier' && (
            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Număr vehicule estimate
              </label>
              <input
                type="number"
                name="vehicleCount"
                value={formData.vehicleCount || ''}
                onChange={handleChange}
                min="0"
                className="w-full bg-[#363636] border border-[#4d4d4d] rounded-lg px-3 py-2 text-white placeholder-[#adadad] focus:outline-none focus:border-blue-500"
                placeholder="5"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white font-medium py-3 px-4 rounded-lg transition-colors"
          >
            {loading ? 'Se procesează...' : 'Finalizează profilul'}
          </button>
        </form>

        <div className="mt-4 text-center">
          <p className="text-[#adadad] text-xs">
            Prin completarea profilului, confirmi că informațiile furnizate sunt corecte și complete.
          </p>
        </div>
      </div>
    </div>
  )
}