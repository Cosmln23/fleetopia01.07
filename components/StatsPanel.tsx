'use client'

import { useQuery } from '@tanstack/react-query'

type Stats = {
  suggestions: number
  accepted: number
  avgProfit: number
  activeVehicles: number
  _meta?: {
    timestamp: string
    source: string
    note: string
  }
}

export default function StatsPanel() {
  const { data, isLoading, error } = useQuery<Stats>({
    queryKey: ['agent-stats'],
    queryFn: () => fetch('/api/stats').then(r => r.json()),
    refetchInterval: 30_000, // Auto-refresh la 30 secunde
    staleTime: 25_000, // Consider data fresh pentru 25 secunde
  })

  if (isLoading) {
    return (
      <div className="grid grid-cols-3 gap-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-[#2d2d2d] rounded-xl p-4 text-center animate-pulse">
            <div className="h-6 bg-[#363636] rounded mb-2"></div>
            <div className="h-4 bg-[#363636] rounded"></div>
          </div>
        ))}
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="bg-[#2d2d2d] rounded-xl p-4 text-center">
        <div className="text-red-400 text-sm">Failed to load stats</div>
        <div className="text-[#adadad] text-xs mt-1">Check console for details</div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-4">
        <StatCard 
          label="Suggestions" 
          value={data.suggestions} 
          color="text-blue-400"
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" width="20px" height="20px" fill="currentColor" viewBox="0 0 256 256">
              <path d="M232,208a8,8,0,0,1-8,8H32a8,8,0,0,1-8-8V48a8,8,0,0,1,16,0V156.69l50.34-50.35a8,8,0,0,1,11.32,0L128,132.69,180.69,80H160a8,8,0,0,1,0-16h40a8,8,0,0,1,8,8v40a8,8,0,0,1-16,0V91.31l-58.34,58.35a8,8,0,0,1-11.32,0L96,123.31,48,171.31V200H224A8,8,0,0,1,232,208Z"></path>
            </svg>
          }
        />
        <StatCard
          label="Avg Profit"
          value={`${data.avgProfit}%`}
          color={data.avgProfit >= 15 ? "text-green-400" : data.avgProfit >= 10 ? "text-yellow-400" : "text-red-400"}
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" width="20px" height="20px" fill="currentColor" viewBox="0 0 256 256">
              <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216ZM173.66,90.34a8,8,0,0,1,0,11.32l-56,56a8,8,0,0,1-11.32-11.32L148.69,104H88a8,8,0,0,1,0-16h72A8,8,0,0,1,173.66,90.34Z"></path>
            </svg>
          }
        />
        <StatCard 
          label="Active Vehicles" 
          value={data.activeVehicles} 
          color="text-yellow-400"
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" width="20px" height="20px" fill="currentColor" viewBox="0 0 256 256">
              <path d="M247.42,117l-14-35A15.93,15.93,0,0,0,218.58,72H184V64a8,8,0,0,0-8-8H24A16,16,0,0,0,8,72V184a16,16,0,0,0,16,16H41a32,32,0,0,0,62,0h50a32,32,0,0,0,62,0h17a16,16,0,0,0,16-16V120A7.94,7.94,0,0,0,247.42,117ZM184,88h34.58l9.6,24H184ZM24,72H168v64H24ZM72,208a16,16,0,1,1,16-16A16,16,0,0,1,72,208Zm81-24H103a32,32,0,0,0-62,0H24V152H168v12.31A32.11,32.11,0,0,0,153,184Zm31,24a16,16,0,1,1,16-16A16,16,0,0,1,184,208Zm48-24H215a32.06,32.06,0,0,0-31-24V128h48Z"></path>
            </svg>
          }
        />
      </div>
      
      {/* Meta info pentru dezvoltare */}
      {data._meta && (
        <div className="text-xs text-[#666] text-center">
          Last updated: {new Date(data._meta.timestamp).toLocaleTimeString()} • {data._meta.source}
        </div>
      )}
    </div>
  )
}

function StatCard({
  label,
  value,
  color = 'text-white',
  icon
}: {
  label: string
  value: string | number
  color?: string
  icon?: React.ReactNode
}) {
  return (
    <div className="bg-[#2d2d2d] rounded-xl p-4 text-center hover:bg-[#363636] transition-colors">
      <div className="text-[#adadad] mb-1 flex justify-center">{icon}</div>
      <div className={`${color} text-2xl font-bold mb-1`}>{value}</div>
      <div className="text-xs text-[#adadad]">{label}</div>
    </div>
  )
}