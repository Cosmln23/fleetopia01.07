'use client'

import { useUserRole } from '@/lib/useUserRole'
import { UserButton } from '@clerk/nextjs'

export default function RoleAwareNavBar() {
  const { role, isLoaded, userId } = useUserRole()

  if (!isLoaded) {
    return (
      <div className="flex border-b border-[#4d4d4d] px-4 gap-8 justify-center">
        <div className="animate-pulse flex space-x-8">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 w-16 bg-[#363636] rounded"></div>
          ))}
        </div>
      </div>
    )
  }

  if (!userId) {
    return (
      <div className="flex border-b border-[#4d4d4d] px-4 gap-8 justify-center">
        <a className="flex flex-col items-center justify-center border-b-[3px] border-b-black text-white gap-1 pb-[7px] pt-2.5" href="/sign-in">
          <div className="text-white text-lg">🔐</div>
          <p className="text-white text-sm font-bold leading-normal tracking-[0.015em]">Sign In</p>
        </a>
      </div>
    )
  }

  return (
    <div className="flex border-b border-[#4d4d4d] px-4 gap-8 justify-center items-end">
      {/* Home - always visible */}
      <a className="flex flex-col items-center justify-center border-b-[3px] border-b-black text-white gap-1 pb-[7px] pt-2.5" href="/">
        <div className="text-white" data-icon="House" data-size="24px" data-weight="fill">
          <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" fill="currentColor" viewBox="0 0 256 256">
            <path d="M224,115.55V208a16,16,0,0,1-16,16H168a16,16,0,0,1-16-16V168a8,8,0,0,0-8-8H112a8,8,0,0,0-8,8v40a16,16,0,0,1-16,16H48a16,16,0,0,1-16-16V115.55a16,16,0,0,1,5.17-11.78l80-75.48.11-.11a16,16,0,0,1,21.53,0,1.14,1.14,0,0,0,.11.11l80,75.48A16,16,0,0,1,224,115.55Z" />
          </svg>
        </div>
        <p className="text-white text-sm font-bold leading-normal tracking-[0.015em]">Home</p>
      </a>

      {/* Marketplace - always visible */}
      <a className="flex flex-col items-center justify-center border-b-[3px] border-b-transparent text-[#adadad] gap-1 pb-[7px] pt-2.5" href="/marketplace">
        <div className="text-[#adadad]" data-icon="ShoppingBag" data-size="24px" data-weight="regular">
          <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" fill="currentColor" viewBox="0 0 256 256">
            <path d="M216,40H40A16,16,0,0,0,24,56V200a16,16,0,0,0,16,16H216a16,16,0,0,0,16-16V56A16,16,0,0,0,216,40Zm0,160H40V56H216V200ZM176,88a48,48,0,0,1-96,0,8,8,0,0,1,16,0,32,32,0,0,0,64,0,8,8,0,0,1,16,0Z" />
          </svg>
        </div>
        <p className="text-[#adadad] text-sm font-bold leading-normal tracking-[0.015em]">Marketplace</p>
      </a>

      {/* Add Cargo - only providers */}
      {role === 'provider' && (
        <a className="flex flex-col items-center justify-center border-b-[3px] border-b-transparent text-[#adadad] gap-1 pb-[7px] pt-2.5" href="/marketplace/add">
          <div className="text-[#adadad]" data-icon="Plus" data-size="24px" data-weight="regular">
            <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" fill="currentColor" viewBox="0 0 256 256">
              <path d="M224,128a8,8,0,0,1-8,8H136v80a8,8,0,0,1-16,0V136H40a8,8,0,0,1,0-16h80V40a8,8,0,0,1,16,0v80h80A8,8,0,0,1,224,128Z" />
            </svg>
          </div>
          <p className="text-[#adadad] text-sm font-bold leading-normal tracking-[0.015em]">Add Cargo</p>
        </a>
      )}

      {/* Fleet - only carriers */}
      {role === 'carrier' && (
        <a className="flex flex-col items-center justify-center border-b-[3px] border-b-transparent text-[#adadad] gap-1 pb-[7px] pt-2.5" href="/fleet">
          <div className="text-[#adadad]" data-icon="Truck" data-size="24px" data-weight="regular">
            <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" fill="currentColor" viewBox="0 0 256 256">
              <path d="M247.42,117l-14-35A15.93,15.93,0,0,0,218.58,72H184V64a8,8,0,0,0-8-8H24A16,16,0,0,0,8,72V184a16,16,0,0,0,16,16H41a32,32,0,0,0,62,0h50a32,32,0,0,0,62,0h17a16,16,0,0,0,16-16V120A7.94,7.94,0,0,0,247.42,117ZM184,88h34.58l9.6,24H184ZM24,72H168v64H24ZM72,208a16,16,0,1,1,16-16A16,16,0,0,1,72,208Zm81-24H103a32,32,0,0,0-62,0H24V152H168v12.31A32.11,32.11,0,0,0,153,184Zm31,24a16,16,0,1,1,16-16A16,16,0,0,1,184,208Zm48-24H215a32.06,32.06,0,0,0-31-24V128h48Z" />
            </svg>
          </div>
          <p className="text-[#adadad] text-sm font-bold leading-normal tracking-[0.015em]">Fleet</p>
        </a>
      )}

      {/* Dispatcher AI - only carriers */}
      {role === 'carrier' && (
        <a className="flex flex-col items-center justify-center border-b-[3px] border-b-transparent text-[#adadad] gap-1 pb-[7px] pt-2.5" href="/dispatcher">
          <div className="text-[#adadad]" data-icon="Robot" data-size="24px" data-weight="regular">
            <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" fill="currentColor" viewBox="0 0 256 256">
              <path d="M200,48H136V16a8,8,0,0,0-16,0V48H56A32,32,0,0,0,24,80V192a32,32,0,0,0,32,32H200a32,32,0,0,0,32-32V80A32,32,0,0,0,200,48Zm16,144a16,16,0,0,1-16,16H56a16,16,0,0,1-16-16V80A16,16,0,0,1,56,64H200a16,16,0,0,1,16,16Zm-52-56H92a28,28,0,0,0,0,56h72a28,28,0,0,0,0-56Zm-28,16v24H120V152ZM80,164a12,12,0,0,1,12-12h12v24H92A12,12,0,0,1,80,164Zm84,12H152V152h12a12,12,0,0,1,0,24ZM72,108a12,12,0,1,1,12,12A12,12,0,0,1,72,108Zm88,0a12,12,0,1,1,12,12A12,12,0,0,1,160,108Z" />
            </svg>
          </div>
          <p className="text-[#adadad] text-sm font-bold leading-normal tracking-[0.015em]">Dispatcher AI</p>
        </a>
      )}

      {/* User Button - replace settings */}
      <div className="flex flex-col items-center justify-center gap-1 pb-[7px] pt-2.5">
        <UserButton 
          appearance={{
            elements: {
              avatarBox: "w-6 h-6",
              userButtonPopoverCard: "bg-[#1a1a1a] border border-[#363636]",
              userButtonPopoverText: "text-white"
            }
          }}
        />
        <p className="text-[#adadad] text-xs font-bold leading-normal tracking-[0.015em]">
          {role || 'User'}
        </p>
      </div>
    </div>
  )
}