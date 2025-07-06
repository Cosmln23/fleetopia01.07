'use client'

import { useState, useEffect } from 'react'

interface Quote {
  id: string
  cargoId: string
  price: number
  status: 'pending' | 'accepted' | 'refused' | 'countered'
  message?: string
  counterPrice?: number
  createdAt: string
  updatedAt: string
}

interface QuoteStatusProps {
  cargoId: string
}

export default function QuoteStatus({ cargoId }: QuoteStatusProps) {
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [loading, setLoading] = useState(true)
  const [retryingQuote, setRetryingQuote] = useState<string | null>(null)

  // Simulate fetching quotes for this cargo
  useEffect(() => {
    const fetchQuotes = async () => {
      setLoading(true)
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 500))
        
        // Mock data - in production this would be a real API call
        const mockQuotes: Quote[] = []
        setQuotes(mockQuotes)
      } catch (error) {
        console.error('Failed to fetch quotes:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchQuotes()
  }, [cargoId])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
            <span className="text-yellow-400 text-sm">Pending</span>
          </div>
        )
      case 'accepted':
        return (
          <div className="flex items-center space-x-1">
            <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            <span className="text-green-400 text-sm">Accepted</span>
          </div>
        )
      case 'refused':
        return (
          <div className="flex items-center space-x-1">
            <svg className="w-4 h-4 text-red-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            <span className="text-red-400 text-sm">Refused</span>
          </div>
        )
      case 'countered':
        return (
          <div className="flex items-center space-x-1">
            <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
            <span className="text-blue-400 text-sm">Counter-offer</span>
          </div>
        )
      default:
        return null
    }
  }

  const retryFailedQuote = async (quoteId: string) => {
    setRetryingQuote(quoteId)
    try {
      // Simulate retry API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Update quote status
      setQuotes(prev => 
        prev.map(quote => 
          quote.id === quoteId 
            ? { ...quote, status: 'pending' as const, updatedAt: new Date().toISOString() }
            : quote
        )
      )
    } catch (error) {
      console.error('Retry failed:', error)
    } finally {
      setRetryingQuote(null)
    }
  }

  const acceptCounterOffer = async (quoteId: string, counterPrice: number) => {
    try {
      // Simulate API call to accept counter offer
      await new Promise(resolve => setTimeout(resolve, 500))
      
      setQuotes(prev => 
        prev.map(quote => 
          quote.id === quoteId 
            ? { ...quote, status: 'accepted' as const, price: counterPrice, updatedAt: new Date().toISOString() }
            : quote
        )
      )
    } catch (error) {
      console.error('Failed to accept counter offer:', error)
    }
  }

  if (loading) {
    return (
      <div className="bg-[#2d2d2d] rounded-lg p-4">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 border-2 border-[#adadad] border-t-transparent rounded-full animate-spin" />
          <span className="text-[#adadad] text-sm">Loading quote status...</span>
        </div>
      </div>
    )
  }

  if (quotes.length === 0) {
    return (
      <div className="bg-[#2d2d2d] rounded-lg p-4">
        <h3 className="text-white text-lg font-bold mb-2">Quote Status</h3>
        <p className="text-[#adadad] text-sm">No quotes sent yet for this cargo.</p>
      </div>
    )
  }

  return (
    <div className="bg-[#2d2d2d] rounded-lg p-4">
      <h3 className="text-white text-lg font-bold mb-4">Quote Status</h3>
      
      <div className="space-y-3">
        {quotes.map((quote) => (
          <div key={quote.id} className="bg-[#363636] rounded-lg p-3">
            <div className="flex justify-between items-start mb-2">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-white font-medium">€{quote.price.toLocaleString()}</span>
                  {getStatusIcon(quote.status)}
                </div>
                
                <p className="text-[#adadad] text-xs">
                  Sent: {new Date(quote.createdAt).toLocaleString()}
                </p>
                
                {quote.updatedAt !== quote.createdAt && (
                  <p className="text-[#adadad] text-xs">
                    Updated: {new Date(quote.updatedAt).toLocaleString()}
                  </p>
                )}
              </div>
            </div>

            {/* Quote message */}
            {quote.message && (
              <div className="mt-2 p-2 bg-[#2d2d2d] rounded text-sm">
                <p className="text-[#adadad]">{quote.message}</p>
              </div>
            )}

            {/* Counter offer section */}
            {quote.status === 'countered' && quote.counterPrice && (
              <div className="mt-3 p-3 bg-blue-600 bg-opacity-20 border border-blue-600 rounded">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-white font-medium">Counter-offer: €{quote.counterPrice.toLocaleString()}</span>
                  <button
                    onClick={() => acceptCounterOffer(quote.id, quote.counterPrice!)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition-colors"
                  >
                    Accept
                  </button>
                </div>
                <p className="text-blue-200 text-xs">
                  The shipper has made a counter-offer. You can accept or continue negotiating in chat.
                </p>
              </div>
            )}

            {/* Retry button for failed quotes */}
            {quote.status === 'refused' && (
              <div className="mt-3 flex justify-end">
                <button
                  onClick={() => retryFailedQuote(quote.id)}
                  disabled={retryingQuote === quote.id}
                  className="bg-[#4d4d4d] hover:bg-[#5d5d5d] disabled:bg-[#3d3d3d] text-white px-3 py-1 rounded text-sm transition-colors"
                >
                  {retryingQuote === quote.id ? 'Retrying...' : 'Send New Quote'}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="mt-4 pt-3 border-t border-[#4d4d4d]">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
          <div className="text-center">
            <div className="text-yellow-400 font-medium">
              {quotes.filter(q => q.status === 'pending').length}
            </div>
            <div className="text-[#adadad]">Pending</div>
          </div>
          
          <div className="text-center">
            <div className="text-green-400 font-medium">
              {quotes.filter(q => q.status === 'accepted').length}
            </div>
            <div className="text-[#adadad]">Accepted</div>
          </div>
          
          <div className="text-center">
            <div className="text-red-400 font-medium">
              {quotes.filter(q => q.status === 'refused').length}
            </div>
            <div className="text-[#adadad]">Refused</div>
          </div>
          
          <div className="text-center">
            <div className="text-blue-400 font-medium">
              {quotes.filter(q => q.status === 'countered').length}
            </div>
            <div className="text-[#adadad]">Counters</div>
          </div>
        </div>
      </div>
    </div>
  )
}