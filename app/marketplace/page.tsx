'use client'

import { mockCargoOffers, getStatusColor, getUrgencyColor } from '@/lib/mock-data'
import Link from 'next/link'
import { useState } from 'react'
import AddCargoModal from '@/components/AddCargoModal'
import { CargoOffer } from '@/lib/types'
import { useStickyNavigation } from '@/contexts/StickyNavigationContext'

export default function MarketplacePage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [cargoOffers, setCargoOffers] = useState(mockCargoOffers)
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
              className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-xl text-white focus:outline-0 focus:ring-0 border-none bg-[#363636] focus:border-none h-full placeholder:text-[#adadad] px-4 rounded-l-none border-l-0 pl-2 text-base font-normal leading-normal"
              defaultValue=""
            />
          </div>
        </label>
      </div>
      <div className="flex gap-3 p-3 flex-wrap pr-4">
        <button className="flex h-8 shrink-0 items-center justify-center gap-x-2 rounded-full bg-[#363636] pl-4 pr-2">
          <p className="text-white text-sm font-medium leading-normal">Country</p>
          <div className="text-white" data-icon="CaretDown" data-size="20px" data-weight="regular">
            <svg xmlns="http://www.w3.org/2000/svg" width="20px" height="20px" fill="currentColor" viewBox="0 0 256 256">
              <path d="M213.66,101.66l-80,80a8,8,0,0,1-11.32,0l-80-80A8,8,0,0,1,53.66,90.34L128,164.69l74.34-74.35a8,8,0,0,1,11.32,11.32Z"></path>
            </svg>
          </div>
        </button>
        <button className="flex h-8 shrink-0 items-center justify-center gap-x-2 rounded-full bg-[#363636] pl-4 pr-2">
          <p className="text-white text-sm font-medium leading-normal">Sort by</p>
          <div className="text-white" data-icon="CaretDown" data-size="20px" data-weight="regular">
            <svg xmlns="http://www.w3.org/2000/svg" width="20px" height="20px" fill="currentColor" viewBox="0 0 256 256">
              <path d="M213.66,101.66l-80,80a8,8,0,0,1-11.32,0l-80-80A8,8,0,0,1,53.66,90.34L128,164.69l74.34-74.35a8,8,0,0,1,11.32,11.32Z"></path>
            </svg>
          </div>
        </button>
        <button className="flex h-8 shrink-0 items-center justify-center gap-x-2 rounded-full bg-[#363636] pl-4 pr-2">
          <p className="text-white text-sm font-medium leading-normal">Cargo Type</p>
          <div className="text-white" data-icon="CaretDown" data-size="20px" data-weight="regular">
            <svg xmlns="http://www.w3.org/2000/svg" width="20px" height="20px" fill="currentColor" viewBox="0 0 256 256">
              <path d="M213.66,101.66l-80,80a8,8,0,0,1-11.32,0l-80-80A8,8,0,0,1,53.66,90.34L128,164.69l74.34-74.35a8,8,0,0,1,11.32,11.32Z"></path>
            </svg>
          </div>
        </button>
        <button className="flex h-8 shrink-0 items-center justify-center gap-x-2 rounded-full bg-[#363636] pl-4 pr-2">
          <p className="text-white text-sm font-medium leading-normal">Urgency</p>
          <div className="text-white" data-icon="CaretDown" data-size="20px" data-weight="regular">
            <svg xmlns="http://www.w3.org/2000/svg" width="20px" height="20px" fill="currentColor" viewBox="0 0 256 256">
              <path d="M213.66,101.66l-80,80a8,8,0,0,1-11.32,0l-80-80A8,8,0,0,1,53.66,90.34L128,164.69l74.34-74.35a8,8,0,0,1,11.32,11.32Z"></path>
            </svg>
          </div>
        </button>
        <button className="flex h-8 shrink-0 items-center justify-center gap-x-2 rounded-full bg-[#363636] pl-4 pr-2">
          <p className="text-white text-sm font-medium leading-normal">Min Price</p>
          <div className="text-white" data-icon="CaretDown" data-size="20px" data-weight="regular">
            <svg xmlns="http://www.w3.org/2000/svg" width="20px" height="20px" fill="currentColor" viewBox="0 0 256 256">
              <path d="M213.66,101.66l-80,80a8,8,0,0,1-11.32,0l-80-80A8,8,0,0,1,53.66,90.34L128,164.69l74.34-74.35a8,8,0,0,1,11.32,11.32Z"></path>
            </svg>
          </div>
        </button>
        <button className="flex h-8 shrink-0 items-center justify-center gap-x-2 rounded-full bg-[#363636] pl-4 pr-2">
          <p className="text-white text-sm font-medium leading-normal">Max Price</p>
          <div className="text-white" data-icon="CaretDown" data-size="20px" data-weight="regular">
            <svg xmlns="http://www.w3.org/2000/svg" width="20px" height="20px" fill="currentColor" viewBox="0 0 256 256">
              <path d="M213.66,101.66l-80,80a8,8,0,0,1-11.32,0l-80-80A8,8,0,0,1,53.66,90.34L128,164.69l74.34-74.35a8,8,0,0,1,11.32,11.32Z"></path>
            </svg>
          </div>
        </button>
      </div>
      <div className="flex px-4 py-3 justify-end">
        <button
          className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-full h-10 px-4 bg-[#363636] text-white text-sm font-bold leading-normal tracking-[0.015em]"
        >
          <span className="truncate">Clear</span>
        </button>
      </div>
      <p className="text-[#adadad] text-sm font-normal leading-normal pb-3 pt-1 px-4">Showing 1-{cargoOffers.length} of {cargoOffers.length} results</p>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-3 p-4">
        {cargoOffers.map((offer) => (
          <Link key={offer.id} href={`/marketplace/${offer.id}`} className="flex flex-col gap-3 pb-3 bg-[#2d2d2d] rounded-xl p-4 cursor-pointer hover:bg-[#333333] transition-colors">
            <div className="w-full bg-center bg-no-repeat aspect-video bg-cover rounded-xl bg-[#363636] flex items-center justify-center">
              <div className="text-[#adadad] text-4xl">📦</div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-start">
                <p className="text-white text-base font-medium leading-normal">{offer.title}</p>
                <span className={`text-xs px-2 py-1 rounded-full bg-opacity-20 ${getStatusColor(offer.status)} bg-current`}>
                  {offer.status}
                </span>
              </div>
              <p className="text-[#adadad] text-sm font-normal leading-normal">
                {offer.fromAddress.split(',')[0]} → {offer.toAddress.split(',')[0]}
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs text-[#adadad]">
                <div>
                  <span className="text-white font-medium">Weight:</span> {offer.weight}kg
                </div>
                <div>
                  <span className="text-white font-medium">Type:</span> {offer.cargoType}
                </div>
                <div>
                  <span className="text-white font-medium">Loading:</span> {offer.loadingDate}
                </div>
                <div>
                  <span className="text-white font-medium">Delivery:</span> {offer.deliveryDate}
                </div>
              </div>
              <div className="flex justify-between items-center pt-2">
                <div>
                  <p className="text-white text-lg font-bold">€{offer.price.toLocaleString()}</p>
                  <p className="text-[#adadad] text-xs">€{offer.pricePerKg}/kg</p>
                </div>
                <div className="text-right">
                  <p className={`text-xs font-medium ${getUrgencyColor(offer.urgency)}`}>
                    {offer.urgency} Priority
                  </p>
                  <p className="text-[#adadad] text-xs">{offer.provider}</p>
                </div>
              </div>
            </div>
          </Link>
        ))}
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
    </>
  )
}