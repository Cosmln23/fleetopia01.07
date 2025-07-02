'use client'

import { useState } from 'react'

export default function TestAutoAssignPage() {
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const testAcceptOffer = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/offers/offer_001/accept', {
        method: 'PATCH'
      })
      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({ error: error instanceof Error ? error.message : 'Unknown error' })
    }
    setLoading(false)
  }

  const checkSettings = async () => {
    try {
      const response = await fetch('/api/settings')
      const data = await response.json()
      setResult({ settings: data })
    } catch (error) {
      setResult({ error: error instanceof Error ? error.message : 'Unknown error' })
    }
  }

  return (
    <div className="p-6 space-y-4 bg-[#1a1a1a] text-white min-h-screen">
      <h1 className="text-2xl font-bold">Test Auto-Assign Functionality</h1>
      
      <div className="space-y-2">
        <button
          onClick={checkSettings}
          className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded"
        >
          Check Current Settings
        </button>
        
        <button
          onClick={testAcceptOffer}
          disabled={loading}
          className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded disabled:opacity-50"
        >
          {loading ? 'Processing...' : 'Test Accept Offer (offer_001)'}
        </button>
      </div>

      {result && (
        <div className="bg-[#2d2d2d] p-4 rounded">
          <h3 className="font-bold mb-2">Result:</h3>
          <pre className="text-sm overflow-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}

      <div className="bg-[#2d2d2d] p-4 rounded">
        <h3 className="font-bold mb-2">Instructions:</h3>
        <ol className="list-decimal list-inside space-y-1 text-sm">
          <li>Go to Dispatcher page and turn ON the Agent</li>
          <li>Turn ON the "Auto-Assign Vehicle" toggle</li>
          <li>Come back here and click "Check Current Settings" to verify</li>
          <li>Click "Test Accept Offer" to simulate accepting an offer</li>
          <li>If auto-assign is ON, you should see a vehicle assigned</li>
        </ol>
      </div>
    </div>
  )
}