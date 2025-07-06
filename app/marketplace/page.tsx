'use client'

// Mock data removed - using empty array until API integration
import { formatPrice } from '@/lib/formatters'
import { useState, useMemo } from 'react'
import AddCargoModal from '@/components/AddCargoModal'
import CargoDetailsModal from '@/components/CargoDetailsModal'
import { CargoOffer, CargoType, UrgencyLevel } from '@/lib/types'
import { useStickyNavigation } from '@/contexts/StickyNavigationContext'
import { getCargoDistance, formatDistance } from '@/lib/distanceCalculator'

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
  const [isCargoDetailsOpen, setIsCargoDetailsOpen] = useState(false)
  const [selectedCargo, setSelectedCargo] = useState<CargoOffer | null>(null)
  const [cargoOffers, setCargoOffers] = useState<CargoOffer[]>([])
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

  const handleAddCargo = (cargoData: Omit<CargoOffer, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newCargo: CargoOffer = {
      ...cargoData,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    setCargoOffers(prev => [newCargo, ...prev])
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

  // Filter and search logic
  const filteredOffers = useMemo(() => {
    let filtered = cargoOffers

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(offer => 
        offer.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        offer.fromAddress.toLowerCase().includes(searchQuery.toLowerCase()) ||
        offer.toAddress.toLowerCase().includes(searchQuery.toLowerCase()) ||
        offer.provider.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Country filter
    if (filters.country) {
      filtered = filtered.filter(offer => 
        offer.fromCountry.toLowerCase().includes(filters.country.toLowerCase()) ||
        offer.toCountry.toLowerCase().includes(filters.country.toLowerCase())
      )
    }

    // Cargo type filter
    if (filters.cargoType) {
      filtered = filtered.filter(offer => offer.cargoType === filters.cargoType)
    }

    // Urgency filter
    if (filters.urgency) {
      filtered = filtered.filter(offer => offer.urgency === filters.urgency)
    }

    // Price filters
    if (filters.minPrice) {
      filtered = filtered.filter(offer => offer.price >= parseFloat(filters.minPrice))
    }
    if (filters.maxPrice) {
      filtered = filtered.filter(offer => offer.price <= parseFloat(filters.maxPrice))
    }

    // Sort
    switch (filters.sortBy) {
      case 'price-low':
        filtered.sort((a, b) => a.price - b.price)
        break
      case 'price-high':
        filtered.sort((a, b) => b.price - a.price)
        break
      case 'weight':
        filtered.sort((a, b) => b.weight - a.weight)
        break
      case 'urgency':
        const urgencyOrder = { 'Urgent': 4, 'High': 3, 'Medium': 2, 'Low': 1 }
        filtered.sort((a, b) => (urgencyOrder[b.urgency as keyof typeof urgencyOrder] || 0) - (urgencyOrder[a.urgency as keyof typeof urgencyOrder] || 0))
        break
      case 'oldest':
        filtered.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
        break
      default: // newest
        filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    }

    return filtered
  }, [cargoOffers, searchQuery, filters])

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
        {filteredOffers.map((offer) => {
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

              {/* Distance display */}
              <p className="text-[#adadad] text-xs mb-2">{formatDistance(distance)}</p>

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
        })}
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