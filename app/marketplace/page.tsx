'use client'

// Mock data removed - using API integration
import { formatPrice } from '@/lib/formatters'
import { useState, useMemo, useEffect } from 'react'
import AddCargoModal from '@/components/AddCargoModal'
import DeleteCargoModal from '@/components/DeleteCargoModal'
import CargoDetailsModal from '@/components/CargoDetailsModal'
import { CargoOffer, CargoType, UrgencyLevel } from '@/lib/types'
import { useStickyNavigation } from '@/contexts/StickyNavigationContext'
import { getCargoDistance, formatDistance } from '@/lib/distanceCalculator'
import { getGoogleMapsDirURL, buildCompleteAddress } from '@/lib/googleMaps'
import { useUserRole } from '@/lib/useUserRole'
import useSWR, { mutate } from 'swr'

// Helper functions moved from mock-data
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

const getUrgencyColor = (urgency: string) => {
  switch (urgency) {
    case 'LOW': return '#0bda0b'
    case 'MEDIUM': return '#ffaa00'
    case 'HIGH': return '#ff6600'
    case 'URGENT': return '#ff0000'
    default: return '#adadad'
  }
}

const getStatusBadgeStyles = (status: string) => {
  const color = getStatusColor(status)
  return {
    backgroundColor: `${color}20`,
    color: color,
    border: `1px solid ${color}40`
  }
}

const getUrgencyBadgeStyles = (urgency: string) => {
  const color = getUrgencyColor(urgency)
  return {
    backgroundColor: `${color}20`,
    color: color,
    border: `1px solid ${color}40`
  }
}

export default function MarketplacePage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isCargoDetailsOpen, setIsCargoDetailsOpen] = useState(false)
  const [selectedCargo, setSelectedCargo] = useState<CargoOffer | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState({
    country: '',
    sortBy: 'newest',
    cargoType: '',
    urgency: '',
    minPrice: '',
    maxPrice: ''
  })
  const { setModalOpen } = useStickyNavigation()
  const { userId, role, isLoaded } = useUserRole()

  // Use SWR for data fetching with revalidation
  const { data: cargoResponse = {}, error, isLoading } = useSWR('/api/cargo', async (url: string) => {
    const response = await fetch(url)
    if (!response.ok) throw new Error('Failed to fetch cargo offers')
    const data = await response.json()
    return data
  }, {
    refreshInterval: 30000, // Refresh every 30 seconds
    revalidateOnFocus: true,
    revalidateOnReconnect: true
  })

  const cargoOffers = cargoResponse.cargo || []

  // Check if user has cargo for delete button visibility
  const { data: userCargoResponse } = useSWR(
    isLoaded && userId ? '/api/cargo/my-cargo' : null,
    async (url: string) => {
      const response = await fetch(url)
      if (!response.ok) return { cargo: [] }
      return response.json()
    }
  )
  const hasUserCargo = userCargoResponse?.cargo?.length > 0
  
  // Debug console pentru buttons
  console.log('🔍 Button Debug:', {
    isLoaded,
    userId, 
    role,
    hasUserCargo,
    userCargoLength: userCargoResponse?.cargo?.length || 0,
    userCargoResponse
  })

  const handleAddCargo = async (cargoData: Omit<CargoOffer, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      // Send to API first
      const response = await fetch('/api/cargo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cargoData)
      })
      
      if (response.ok) {
        // Revalidate SWR cache to fetch fresh data
        mutate('/api/cargo')
        mutate('/api/cargo/my-cargo') // Also refresh user cargo
      }
    } catch (error) {
      console.error('Failed to add cargo:', error)
    }
  }

  const handleDeleteCargo = () => {
    // Refresh both cargo lists after deletion
    mutate('/api/cargo')
    mutate('/api/cargo/my-cargo')
  }

  const handleCargoClick = (cargo: CargoOffer) => {
    setSelectedCargo(cargo)
    setIsCargoDetailsOpen(true)
    setModalOpen(true)
  }

  const handleCloseCargoDetails = () => {
    setIsCargoDetailsOpen(false)
    setSelectedCargo(null)
    setModalOpen(false)
  }

  const handleSendQuote = async (cargoId: string, price: number) => {
    console.log('Sending quote:', { cargoId, price })
  }

  const handleIgnoreCargo = async (cargoId: string) => {
    console.log('Ignoring cargo:', cargoId)
  }

  // Filter and sort cargo offers
  const filteredOffers = cargoOffers.filter((offer: CargoOffer) => {
    const matchesSearch = 
      offer.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      offer.fromAddress.toLowerCase().includes(searchQuery.toLowerCase()) ||
      offer.toAddress.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesCountry = !filters.country || 
      offer.fromCountry === filters.country || 
      offer.toCountry === filters.country
    
    const matchesCargoType = !filters.cargoType || offer.cargoType === filters.cargoType
    const matchesUrgency = !filters.urgency || offer.urgency === filters.urgency
    
    const matchesPrice = (!filters.minPrice || offer.price >= parseFloat(filters.minPrice)) &&
                        (!filters.maxPrice || offer.price <= parseFloat(filters.maxPrice))
    
    return matchesSearch && matchesCountry && matchesCargoType && matchesUrgency && matchesPrice
  }).sort((a: CargoOffer, b: CargoOffer) => {
    switch (filters.sortBy) {
      case 'price_low':
        return a.price - b.price
      case 'price_high':
        return b.price - a.price
      case 'distance':
        return getCargoDistance(a) - getCargoDistance(b)
      case 'newest':
      default:
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    }
  })

  const handleFilterChange = (filterType: string, value: string) => {
    setFilters(prev => ({ ...prev, [filterType]: value }))
  }

  const handleClearFilters = () => {
    setSearchQuery('')
    setFilters({
      country: '',
      sortBy: 'newest',
      cargoType: '',
      urgency: '',
      minPrice: '',
      maxPrice: ''
    })
  }
  return (
    <>
      {/* MARKETPLACE CONTENT */}
      <div className="pb-3">
        <div className="flex border-b border-[#4d4d4d] px-4 justify-between items-center">
          <div className="flex gap-8">
            <a className="flex flex-col items-center justify-center border-b-[3px] border-b-black text-white pb-[13px] pt-4" href="#">
              <p className="text-white text-sm font-bold leading-normal tracking-[0.015em]">All Offers</p>
            </a>
            <a className="flex flex-col items-center justify-center border-b-[3px] border-b-transparent text-[#adadad] pb-[13px] pt-4" href="#">
              <p className="text-[#adadad] text-sm font-bold leading-normal tracking-[0.015em]">My Offers</p>
            </a>
            <a className="flex flex-col items-center justify-center border-b-[3px] border-b-transparent text-[#adadad] pb-[13px] pt-4" href="#">
              <p className="text-[#adadad] text-sm font-bold leading-normal tracking-[0.015em]">Accepted Offers</p>
            </a>
          </div>
          <div className="flex items-center gap-3">
            {/* Delete Cargo Button - Only show if user has cargo and is provider */}
            {isLoaded && hasUserCargo && role === 'provider' && (
              <button 
                onClick={() => {
                  setIsDeleteModalOpen(true)
                  setModalOpen(true)
                }}
                className="flex items-center gap-2 bg-white hover:bg-gray-100 text-black px-4 py-2 rounded-lg font-medium transition-colors"
              >
                <div className="text-black" data-icon="Trash" data-size="16px" data-weight="bold">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16px" height="16px" fill="currentColor" viewBox="0 0 256 256">
                    <path d="M216,48H176V40a24,24,0,0,0-24-24H104A24,24,0,0,0,80,40v8H40a8,8,0,0,0,0,16h8V208a16,16,0,0,0,16,16H192a16,16,0,0,0,16-16V64h8a8,8,0,0,0,0-16ZM96,40a8,8,0,0,1,8-8h48a8,8,0,0,1,8,8v8H96Zm96,168H64V64H192ZM112,104v64a8,8,0,0,1-16,0V104a8,8,0,0,1,16,0Zm48,0v64a8,8,0,0,1-16,0V104a8,8,0,0,1,16,0Z"></path>
                  </svg>
                </div>
                Delete Cargo
              </button>
            )}
            
            {/* Add Cargo Button - Always visible */}
            {isLoaded && (
              <button 
                onClick={() => {
                  setIsModalOpen(true)
                  setModalOpen(true)
                }}
                className="flex items-center gap-2 bg-white hover:bg-gray-100 text-black px-4 py-2 rounded-lg font-medium transition-colors"
              >
                <div className="text-black" data-icon="Plus" data-size="16px" data-weight="bold">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16px" height="16px" fill="currentColor" viewBox="0 0 256 256">
                    <path d="M224,128a8,8,0,0,1-8,8H136v80a8,8,0,0,1-16,0V136H40a8,8,0,0,1,0-16h80V40a8,8,0,0,1,16,0v80h80A8,8,0,0,1,224,128Z"></path>
                  </svg>
                </div>
                Add Cargo
              </button>
            )}
          </div>
        </div>
      </div>
      <div className="px-4 py-3">
        <label className="flex flex-col min-w-40 h-12 w-full">
          <div className="flex w-full flex-1 items-stretch rounded-xl h-full">
            <div
              className="text-[#adadad] flex border-none bg-[#363636] items-center justify-center pl-4 rounded-l-xl border-r-0"
              data-icon="MagnifyingGlass"
              data-size="24px"
              data-weight="regular"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" fill="currentColor" viewBox="0 0 256 256">
                <path
                  d="M229.66,218.34l-50.07-50.06a88.11,88.11,0,1,0-11.31,11.31l50.06,50.07a8,8,0,0,0,11.32-11.32ZM40,112a72,72,0,1,1,72,72A72.08,72.08,0,0,1,40,112Z"
                />
              </svg>
            </div>
            <input
              placeholder="Search for offers"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-xl text-white focus:outline-0 focus:ring-0 border-none bg-[#363636] focus:border-none h-full placeholder:text-[#adadad] px-4 rounded-l-none border-l-0 pl-2 text-base font-normal leading-normal"
            />
          </div>
        </label>
      </div>
      <div className="flex gap-3 p-3 flex-wrap pr-4">
        <select 
          value={filters.country}
          onChange={(e) => handleFilterChange('country', e.target.value)}
          className="h-8 bg-[#363636] text-white text-sm rounded-full px-3 focus:outline-none border-none"
        >
          <option value="">All Countries</option>
          <option value="netherlands">Netherlands</option>
          <option value="germany">Germany</option>
          <option value="romania">Romania</option>
          <option value="italy">Italy</option>
          <option value="poland">Poland</option>
          <option value="austria">Austria</option>
          <option value="switzerland">Switzerland</option>
        </select>
        
        <select 
          value={filters.sortBy}
          onChange={(e) => handleFilterChange('sortBy', e.target.value)}
          className="h-8 bg-[#363636] text-white text-sm rounded-full px-3 focus:outline-none border-none"
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="price-low">Price: Low to High</option>
          <option value="price-high">Price: High to Low</option>
          <option value="weight">Weight: Heavy First</option>
          <option value="urgency">Urgency: High First</option>
        </select>

        <select 
          value={filters.cargoType}
          onChange={(e) => handleFilterChange('cargoType', e.target.value)}
          className="h-8 bg-[#363636] text-white text-sm rounded-full px-3 focus:outline-none border-none"
        >
          <option value="">All Types</option>
          <option value={CargoType.GENERAL}>General</option>
          <option value={CargoType.REFRIGERATED}>Refrigerated</option>
          <option value={CargoType.FRAGILE}>Fragile</option>
          <option value={CargoType.DANGEROUS}>Dangerous</option>
          <option value={CargoType.OVERSIZED}>Oversized</option>
        </select>

        <select 
          value={filters.urgency}
          onChange={(e) => handleFilterChange('urgency', e.target.value)}
          className="h-8 bg-[#363636] text-white text-sm rounded-full px-3 focus:outline-none border-none"
        >
          <option value="">All Urgency</option>
          <option value={UrgencyLevel.LOW}>Low</option>
          <option value={UrgencyLevel.MEDIUM}>Medium</option>
          <option value={UrgencyLevel.HIGH}>High</option>
          <option value={UrgencyLevel.URGENT}>Urgent</option>
        </select>

        <input
          type="number"
          placeholder="Min €"
          value={filters.minPrice}
          onChange={(e) => handleFilterChange('minPrice', e.target.value)}
          className="h-8 w-20 bg-[#363636] text-white text-sm rounded-full px-3 focus:outline-none border-none placeholder:text-[#adadad]"
        />

        <input
          type="number"
          placeholder="Max €"
          value={filters.maxPrice}
          onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
          className="h-8 w-20 bg-[#363636] text-white text-sm rounded-full px-3 focus:outline-none border-none placeholder:text-[#adadad]"
        />
      </div>
      <div className="flex px-4 py-3 justify-end">
        <button
          onClick={handleClearFilters}
          className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-full h-10 px-4 bg-[#363636] hover:bg-[#4d4d4d] text-white text-sm font-bold leading-normal tracking-[0.015em] transition-colors"
        >
          <span className="truncate">Clear</span>
        </button>
      </div>
      <p className="text-[#adadad] text-sm font-normal leading-normal pb-3 pt-1 px-4">
        Showing 1-{filteredOffers.length} of {cargoOffers.length} results
        {searchQuery && ` for "${searchQuery}"`}
        {(filters.country || filters.cargoType || filters.urgency || filters.minPrice || filters.maxPrice) && (
          <span className="text-yellow-400"> (filtered)</span>
        )}
      </p>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(320px,1fr))] gap-3 p-4">
        {isLoading ? (
          // Loading skeleton
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex flex-col bg-[#2d2d2d] rounded-xl border border-[#363636] p-3 animate-pulse">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-[#363636] rounded"></div>
                  <div>
                    <div className="w-32 h-4 bg-[#363636] rounded mb-1"></div>
                    <div className="w-24 h-3 bg-[#363636] rounded"></div>
                  </div>
                </div>
                <div className="w-12 h-5 bg-[#363636] rounded-full"></div>
              </div>
              <div className="grid grid-cols-3 gap-2 mb-2">
                <div className="w-12 h-3 bg-[#363636] rounded"></div>
                <div className="w-16 h-3 bg-[#363636] rounded"></div>
                <div className="w-20 h-3 bg-[#363636] rounded"></div>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-[#363636]">
                <div className="w-16 h-5 bg-[#363636] rounded"></div>
                <div className="w-12 h-5 bg-[#363636] rounded"></div>
              </div>
            </div>
          ))
        ) : filteredOffers.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <div className="text-[#adadad] text-lg mb-2">No cargo offers found</div>
            <div className="text-[#adadad] text-sm">Try adjusting your filters or search query</div>
          </div>
        ) : (
          filteredOffers.map((offer) => {
          const distance = getCargoDistance(offer)
          return (
            <div 
              key={offer.id} 
              className="flex flex-col bg-[#2d2d2d] rounded-xl border border-[#363636] p-3 cursor-pointer hover:bg-[#333333] transition-colors hover:shadow-lg"
              onClick={() => handleCargoClick(offer)}
            >
              {/* Compact header with icon and status */}
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <div className="text-[#adadad] text-xl">📦</div>
                  <div>
                    <p className="text-white text-sm font-medium leading-normal">{offer.title}</p>
                    <p className="text-[#adadad] text-xs">
                      {offer.fromAddress.split(',')[0]} → {offer.toAddress.split(',')[0]}
                    </p>
                  </div>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${getStatusBadgeStyles(offer.status)}`}>
                  {offer.status}
                </span>
              </div>


              {/* Compact info grid */}
              <div className="grid grid-cols-3 gap-2 text-xs text-[#adadad] mb-2">
                <div>
                  <span className="text-white font-medium">{offer.weight}kg</span>
                </div>
                <div>
                  <span className="text-white font-medium">{offer.cargoType}</span>
                </div>
                <div>
                  <span className="text-white font-medium">{offer.loadingDate}</span>
                </div>
              </div>

              {/* Price and urgency footer */}
              <div className="flex justify-between items-center pt-2 border-t border-[#363636]">
                <div>
                  <p className="text-white text-base font-bold">€{formatPrice(offer.price)}</p>
                  <p className="text-[#adadad] text-xs">€{offer.pricePerKg}/kg</p>
                </div>
                <div className="text-right">
                  <span className={`text-xs px-2 py-1 rounded-full ${getUrgencyBadgeStyles(offer.urgency)}`}>
                    {offer.urgency}
                  </span>
                  <p className="text-[#adadad] text-xs mt-1">{offer.provider}</p>
                </div>
              </div>
            </div>
          )
        })
        )}
      </div>
      <div className="flex items-center justify-center p-4">
        <a href="#" className="flex size-10 items-center justify-center">
          <div className="text-white" data-icon="CaretLeft" data-size="18px" data-weight="regular">
            <svg xmlns="http://www.w3.org/2000/svg" width="18px" height="18px" fill="currentColor" viewBox="0 0 256 256">
              <path d="M165.66,202.34a8,8,0,0,1-11.32,11.32l-80-80a8,8,0,0,1,0-11.32l80-80a8,8,0,0,1,11.32,11.32L91.31,128Z"></path>
            </svg>
          </div>
        </a>
        <a className="text-sm font-bold leading-normal tracking-[0.015em] flex size-10 items-center justify-center text-white rounded-full bg-[#363636]" href="#">1</a>
        <a className="text-sm font-normal leading-normal flex size-10 items-center justify-center text-white rounded-full" href="#">2</a>
        <a className="text-sm font-normal leading-normal flex size-10 items-center justify-center text-white rounded-full" href="#">3</a>
        <a className="text-sm font-normal leading-normal flex size-10 items-center justify-center text-white rounded-full" href="#">4</a>
        <a className="text-sm font-normal leading-normal flex size-10 items-center justify-center text-white rounded-full" href="#">5</a>
        <a href="#" className="flex size-10 items-center justify-center">
          <div className="text-white" data-icon="CaretRight" data-size="18px" data-weight="regular">
            <svg xmlns="http://www.w3.org/2000/svg" width="18px" height="18px" fill="currentColor" viewBox="0 0 256 256">
              <path d="M181.66,133.66l-80,80a8,8,0,0,1-11.32-11.32L164.69,128,90.34,53.66a8,8,0,0,1,11.32-11.32l80,80A8,8,0,0,1,181.66,133.66Z"></path>
            </svg>
          </div>
        </a>
      </div>

      {/* Add Cargo Modal */}
      <AddCargoModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setModalOpen(false)
        }}
        onSubmit={handleAddCargo}
      />

      {/* Delete Cargo Modal */}
      <DeleteCargoModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false)
          setModalOpen(false)
        }}
        onDelete={handleDeleteCargo}
      />

      {/* Cargo Details Modal */}
      <CargoDetailsModal
        isOpen={isCargoDetailsOpen}
        onClose={handleCloseCargoDetails}
        cargo={selectedCargo}
        onSendQuote={handleSendQuote}
        onIgnore={handleIgnoreCargo}
      />
    </>
  )
}