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
          icon="📊"
        />
        <StatCard
          label="Avg Profit"
          value={`${data.avgProfit}%`}
          color={data.avgProfit >= 15 ? "text-green-400" : data.avgProfit >= 10 ? "text-yellow-400" : "text-red-400"}
          icon="💰"
        />
        <StatCard 
          label="Active Vehicles" 
          value={data.activeVehicles} 
          color="text-yellow-400"
          icon="🚛"
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
  icon = '📈'
}: {
  label: string
  value: string | number
  color?: string
  icon?: string
}) {
  return (
    <div className="bg-[#2d2d2d] rounded-xl p-4 text-center hover:bg-[#363636] transition-colors">
      <div className="text-lg mb-1">{icon}</div>
      <div className={`${color} text-2xl font-bold mb-1`}>{value}</div>
      <div className="text-xs text-[#adadad]">{label}</div>
    </div>
  )
}