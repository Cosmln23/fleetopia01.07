'use client'

import { useState } from 'react'
import { mockUserProfiles } from '@/lib/user-profiles'

export default function AccountSettingsPage() {
  // Use first mock profile as current user for demo
  const currentUser = mockUserProfiles[0]
  const [formData, setFormData] = useState({
    name: currentUser.name,
    email: currentUser.contact.email,
    phone: currentUser.contact.phone,
    company: currentUser.company,
    website: currentUser.contact.website || '',
    bio: currentUser.bio,
    paymentTerms: currentUser.paymentTerms,
    languages: currentUser.languages.join(', '),
    notifications: {
      email: true,
      sms: false,
      push: true,
      marketing: false
    }
  })

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleNotificationChange = (field: string, value: boolean) => {
    setFormData(prev => ({
      ...prev,
      notifications: { ...prev.notifications, [field]: value }
    }))
  }

  const handleSave = () => {
    // In real app, this would save to backend
    console.log('Saving account settings:', formData)
    alert('Settings saved successfully!')
  }

  return (
    <div className="p-4">
      <div className="flex items-center gap-4 mb-6">
        <button 
          onClick={() => window.history.back()}
          className="text-[#adadad] hover:text-white transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 256 256">
            <path d="M224,128a8,8,0,0,1-8,8H59.31l58.35,58.34a8,8,0,0,1-11.32,11.32l-72-72a8,8,0,0,1,0-11.32l72-72a8,8,0,0,1,11.32,11.32L59.31,120H216A8,8,0,0,1,224,128Z"/>
          </svg>
        </button>
        <h1 className="text-white text-[28px] font-bold leading-tight">Account Settings</h1>
      </div>

      <div className="max-w-2xl space-y-6">
        {/* Profile Information */}
        <div className="bg-[#2d2d2d] border border-[#363636] rounded-xl p-6">
          <h2 className="text-white text-xl font-bold mb-4">Profile Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[#adadad] text-sm font-medium mb-2">
                Full Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full px-3 py-2 bg-[#363636] border border-[#4d4d4d] rounded-lg text-white placeholder-[#adadad] focus:outline-none focus:border-green-500"
              />
            </div>

            <div>
              <label className="block text-[#adadad] text-sm font-medium mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="w-full px-3 py-2 bg-[#363636] border border-[#4d4d4d] rounded-lg text-white placeholder-[#adadad] focus:outline-none focus:border-green-500"
              />
            </div>

            <div>
              <label className="block text-[#adadad] text-sm font-medium mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                className="w-full px-3 py-2 bg-[#363636] border border-[#4d4d4d] rounded-lg text-white placeholder-[#adadad] focus:outline-none focus:border-green-500"
              />
            </div>

            <div>
              <label className="block text-[#adadad] text-sm font-medium mb-2">
                Company Name
              </label>
              <input
                type="text"
                value={formData.company}
                onChange={(e) => handleInputChange('company', e.target.value)}
                className="w-full px-3 py-2 bg-[#363636] border border-[#4d4d4d] rounded-lg text-white placeholder-[#adadad] focus:outline-none focus:border-green-500"
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-[#adadad] text-sm font-medium mb-2">
              Website (Optional)
            </label>
            <input
              type="url"
              value={formData.website}
              onChange={(e) => handleInputChange('website', e.target.value)}
              placeholder="https://your-website.com"
              className="w-full px-3 py-2 bg-[#363636] border border-[#4d4d4d] rounded-lg text-white placeholder-[#adadad] focus:outline-none focus:border-green-500"
            />
          </div>

          <div className="mt-4">
            <label className="block text-[#adadad] text-sm font-medium mb-2">
              Bio
            </label>
            <textarea
              value={formData.bio}
              onChange={(e) => handleInputChange('bio', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 bg-[#363636] border border-[#4d4d4d] rounded-lg text-white placeholder-[#adadad] focus:outline-none focus:border-green-500 resize-none"
              placeholder="Tell others about your business..."
            />
          </div>
        </div>

        {/* Business Settings */}
        <div className="bg-[#2d2d2d] border border-[#363636] rounded-xl p-6">
          <h2 className="text-white text-xl font-bold mb-4">Business Settings</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[#adadad] text-sm font-medium mb-2">
                Payment Terms
              </label>
              <input
                type="text"
                value={formData.paymentTerms}
                onChange={(e) => handleInputChange('paymentTerms', e.target.value)}
                placeholder="e.g., 30 days, 20% advance"
                className="w-full px-3 py-2 bg-[#363636] border border-[#4d4d4d] rounded-lg text-white placeholder-[#adadad] focus:outline-none focus:border-green-500"
              />
            </div>

            <div>
              <label className="block text-[#adadad] text-sm font-medium mb-2">
                Languages (comma-separated)
              </label>
              <input
                type="text"
                value={formData.languages}
                onChange={(e) => handleInputChange('languages', e.target.value)}
                placeholder="e.g., English, German, French"
                className="w-full px-3 py-2 bg-[#363636] border border-[#4d4d4d] rounded-lg text-white placeholder-[#adadad] focus:outline-none focus:border-green-500"
              />
            </div>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="bg-[#2d2d2d] border border-[#363636] rounded-xl p-6">
          <h2 className="text-white text-xl font-bold mb-4">Notification Preferences</h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium">Email Notifications</p>
                <p className="text-[#adadad] text-sm">Get notified about new offers and updates</p>
              </div>
              <button
                onClick={() => handleNotificationChange('email', !formData.notifications.email)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  formData.notifications.email ? 'bg-green-500' : 'bg-[#363636]'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    formData.notifications.email ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium">SMS Notifications</p>
                <p className="text-[#adadad] text-sm">Get text messages for urgent updates</p>
              </div>
              <button
                onClick={() => handleNotificationChange('sms', !formData.notifications.sms)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  formData.notifications.sms ? 'bg-green-500' : 'bg-[#363636]'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    formData.notifications.sms ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium">Push Notifications</p>
                <p className="text-[#adadad] text-sm">Get browser notifications for real-time updates</p>
              </div>
              <button
                onClick={() => handleNotificationChange('push', !formData.notifications.push)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  formData.notifications.push ? 'bg-green-500' : 'bg-[#363636]'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    formData.notifications.push ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium">Marketing Communications</p>
                <p className="text-[#adadad] text-sm">Receive news, tips, and product updates</p>
              </div>
              <button
                onClick={() => handleNotificationChange('marketing', !formData.notifications.marketing)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  formData.notifications.marketing ? 'bg-green-500' : 'bg-[#363636]'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    formData.notifications.marketing ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-medium rounded-lg transition-colors"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  )
}