import { mockCargoOffers, getStatusColor, getUrgencyColor } from '@/lib/mock-data'
import { notFound } from 'next/navigation'

interface CargoDetailsPageProps {
  params: {
    id: string
  }
}

export default function CargoDetailsPage({ params }: CargoDetailsPageProps) {
  const cargo = mockCargoOffers.find(offer => offer.id === params.id)
  
  if (!cargo) {
    notFound()
  }

  return (
    <>
      {/* CARGO DETAILS CONTENT */}
      <div className="px-4 py-3">
        <div className="flex items-center gap-3 mb-6">
          <a href="/marketplace" className="text-[#adadad] hover:text-white">
            <div className="text-white" data-icon="ArrowLeft" data-size="24px" data-weight="regular">
              <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" fill="currentColor" viewBox="0 0 256 256">
                <path d="M224,128a8,8,0,0,1-8,8H59.31l58.35,58.34a8,8,0,0,1-11.32,11.32l-72-72a8,8,0,0,1,0-11.32l72-72a8,8,0,0,1,11.32,11.32L59.31,120H216A8,8,0,0,1,224,128Z"></path>
              </svg>
            </div>
          </a>
          <h1 className="text-white text-xl font-bold">Cargo Details</h1>
        </div>

        {/* Cargo Header */}
        <div className="bg-[#2d2d2d] rounded-xl p-4 mb-4">
          <div className="flex justify-between items-start mb-3">
            <h2 className="text-white text-lg font-bold">{cargo.title}</h2>
            <span className={`text-xs px-3 py-1 rounded-full bg-opacity-20 ${getStatusColor(cargo.status)} bg-current`}>
              {cargo.status}
            </span>
          </div>
          <p className="text-[#adadad] text-sm mb-2">ID: {cargo.id}</p>
          <p className="text-[#adadad] text-sm">Posted: {cargo.postingDate}</p>
        </div>

        {/* Route Information */}
        <div className="bg-[#2d2d2d] rounded-xl p-4 mb-4">
          <h3 className="text-white text-md font-bold mb-3">Route Information</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-green-400 rounded-full"></div>
              <div>
                <p className="text-white text-sm font-medium">From: {cargo.fromAddress}</p>
                <p className="text-[#adadad] text-xs">{cargo.fromCountry}</p>
              </div>
            </div>
            <div className="border-l-2 border-[#4d4d4d] ml-[5px] h-8"></div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-red-400 rounded-full"></div>
              <div>
                <p className="text-white text-sm font-medium">To: {cargo.toAddress}</p>
                <p className="text-[#adadad] text-xs">{cargo.toCountry}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Cargo Details Grid */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-[#2d2d2d] rounded-xl p-4">
            <p className="text-[#adadad] text-xs uppercase tracking-wide mb-1">Weight</p>
            <p className="text-white text-lg font-bold">{cargo.weight} kg</p>
          </div>
          <div className="bg-[#2d2d2d] rounded-xl p-4">
            <p className="text-[#adadad] text-xs uppercase tracking-wide mb-1">Type</p>
            <p className="text-white text-lg font-bold">{cargo.cargoType}</p>
          </div>
          <div className="bg-[#2d2d2d] rounded-xl p-4">
            <p className="text-[#adadad] text-xs uppercase tracking-wide mb-1">Loading Date</p>
            <p className="text-white text-lg font-bold">{cargo.loadingDate}</p>
          </div>
          <div className="bg-[#2d2d2d] rounded-xl p-4">
            <p className="text-[#adadad] text-xs uppercase tracking-wide mb-1">Delivery Date</p>
            <p className="text-white text-lg font-bold">{cargo.deliveryDate}</p>
          </div>
          {cargo.volume && (
            <div className="bg-[#2d2d2d] rounded-xl p-4">
              <p className="text-[#adadad] text-xs uppercase tracking-wide mb-1">Volume</p>
              <p className="text-white text-lg font-bold">{cargo.volume} m³</p>
            </div>
          )}
          <div className="bg-[#2d2d2d] rounded-xl p-4">
            <p className="text-[#adadad] text-xs uppercase tracking-wide mb-1">Urgency</p>
            <p className={`text-lg font-bold ${getUrgencyColor(cargo.urgency)}`}>{cargo.urgency}</p>
          </div>
        </div>

        {/* Price Information */}
        <div className="bg-[#2d2d2d] rounded-xl p-4 mb-4">
          <h3 className="text-white text-md font-bold mb-3">Price Information</h3>
          <div className="flex justify-between items-center">
            <div>
              <p className="text-white text-2xl font-bold">€{cargo.price.toLocaleString()}</p>
              <p className="text-[#adadad] text-sm">Total Price</p>
            </div>
            <div className="text-right">
              <p className="text-white text-lg font-bold">€{cargo.pricePerKg}</p>
              <p className="text-[#adadad] text-sm">Per kg</p>
            </div>
          </div>
        </div>

        {/* Provider Information */}
        <div className="bg-[#2d2d2d] rounded-xl p-4 mb-4">
          <h3 className="text-white text-md font-bold mb-3">Provider Information</h3>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-[#363636] rounded-full flex items-center justify-center">
              <span className="text-white text-lg">🏢</span>
            </div>
            <div>
              <p className="text-white font-medium">{cargo.provider}</p>
              <p className="text-[#adadad] text-sm">{cargo.providerStatus}</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mt-6">
          <button className="flex-1 bg-[#363636] hover:bg-[#4d4d4d] text-white py-3 px-4 rounded-xl font-medium transition-colors">
            Contact Provider
          </button>
          <button className="flex-1 bg-white hover:bg-gray-100 text-black py-3 px-4 rounded-xl font-medium transition-colors">
            Send Offer
          </button>
        </div>
      </div>
    </>
  )
}