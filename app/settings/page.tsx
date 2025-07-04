'use client'

import Link from 'next/link'

export default function SettingsPage() {
  return (
    <div className="p-4">
      <h1 className="text-white text-[28px] font-bold leading-tight mb-6">Settings</h1>
      
      <div className="grid gap-4">
        {/* GPS Devices Settings */}
        <Link href="/settings/gps" className="group">
          <div className="bg-[#363636] hover:bg-[#4d4d4d] rounded-xl p-6 border border-[#4d4d4d] transition-colors">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="white" viewBox="0 0 256 256">
                  <path d="M128,16a88.1,88.1,0,0,0-88,88c0,75.3,80,132.17,83.41,134.55a8,8,0,0,0,9.18,0C136,236.17,216,179.3,216,104A88.1,88.1,0,0,0,128,16Zm0,56a32,32,0,1,1-32,32A32,32,0,0,1,128,72Z"/>
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-white text-lg font-semibold mb-1">GPS Devices</h3>
                <p className="text-[#adadad] text-sm">Manage GPS trackers and vehicle assignments</p>
              </div>
              <div className="text-[#adadad] group-hover:text-white transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 256 256">
                  <path d="M181.66,133.66l-80,80a8,8,0,0,1-11.32-11.32L164.69,128,90.34,53.66a8,8,0,0,1,11.32-11.32l80,80A8,8,0,0,1,181.66,133.66Z"/>
                </svg>
              </div>
            </div>
          </div>
        </Link>

        {/* Future settings sections */}
        <div className="bg-[#2a2a2a] rounded-xl p-6 border border-[#363636] opacity-50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#4d4d4d] rounded-xl flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="white" viewBox="0 0 256 256">
                <path d="M247.42,117l-14-35A15.93,15.93,0,0,0,218.58,72H184V64a8,8,0,0,0-8-8H24A16,16,0,0,0,8,72V184a16,16,0,0,0,16,16H41a32,32,0,0,0,62,0h50a32,32,0,0,0,62,0h17a16,16,0,0,0,16-16V120A7.94,7.94,0,0,0,247.42,117Z"/>
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-[#666] text-lg font-semibold mb-1">Fleet Settings</h3>
              <p className="text-[#666] text-sm">Vehicle types, fuel settings, driver management</p>
              <p className="text-[#666] text-xs mt-1">Coming soon...</p>
            </div>
          </div>
        </div>

        <div className="bg-[#2a2a2a] rounded-xl p-6 border border-[#363636] opacity-50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#4d4d4d] rounded-xl flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="white" viewBox="0 0 256 256">
                <path d="M230.92,212c-15.23-26.33-38.7-45.21-66.09-54.16a72,72,0,1,0-73.66,0C63.78,166.78,40.31,185.66,25.08,212a8,8,0,1,0,13.85,8c18.84-32.56,52.14-52,89.07-52s70.23,19.44,89.07,52a8,8,0,1,0,13.85-8ZM72,96a56,56,0,1,1,56,56A56.06,56.06,0,0,1,72,96Z"/>
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-[#666] text-lg font-semibold mb-1">Account Settings</h3>
              <p className="text-[#666] text-sm">Profile, notifications, preferences</p>
              <p className="text-[#666] text-xs mt-1">Coming soon...</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 