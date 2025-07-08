'use client'

interface RatingDisplayProps {
  rating: {
    avg: number
    count: number
    breakdown: number[] // [5star, 4star, 3star, 2star, 1star]
  }
  showBreakdown?: boolean
}

export default function RatingDisplay({ rating, showBreakdown = false }: RatingDisplayProps) {
  const formatRating = (rating: number): string => {
    return rating.toFixed(1)
  }

  const renderStars = (avgRating: number, size: 'sm' | 'md' | 'lg' = 'md') => {
    const fullStars = Math.floor(avgRating)
    const hasHalfStar = avgRating % 1 >= 0.5
    
    const sizeClasses = {
      sm: 'w-3 h-3',
      md: 'w-4 h-4', 
      lg: 'w-5 h-5'
    }
    
    return (
      <div className="flex items-center gap-1">
        {[...Array(5)].map((_, i) => (
          <svg 
            key={i}
            xmlns="http://www.w3.org/2000/svg" 
            fill="currentColor" 
            viewBox="0 0 256 256"
            className={`${sizeClasses[size]} ${
              i < fullStars 
                ? 'text-yellow-400' 
                : i === fullStars && hasHalfStar 
                  ? 'text-yellow-400' 
                  : 'text-[#363636]'
            }`}
          >
            <path d="M234.5,114.38l-45.1,39.36,13.51,58.6a16,16,0,0,1-23.84,17.34l-51.11-31-51,31a16,16,0,0,1-23.84-17.34L66.61,153.8,21.5,114.38a16,16,0,0,1,9.11-28.06l59.46-5.15,23.21-55.36a15.95,15.95,0,0,1,29.44,0L166,81.17l59.44,5.15a16,16,0,0,1,9.11,28.06Z"></path>
          </svg>
        ))}
      </div>
    )
  }

  const getBarWidth = (count: number): number => {
    const total = rating.breakdown.reduce((sum, val) => sum + val, 0)
    return total > 0 ? (count / total) * 100 : 0
  }

  return (
    <div className="space-y-3">
      {/* Main Rating */}
      <div className="flex items-center gap-3">
        {renderStars(rating.avg, 'lg')}
        <div className="flex items-baseline gap-2">
          <span className="text-white text-2xl font-bold">
            {formatRating(rating.avg)}
          </span>
          <span className="text-[#adadad] text-sm">
            / 5
          </span>
        </div>
      </div>
      
      {/* Review Count */}
      <p className="text-[#adadad] text-sm">
        Based on {rating.count} review{rating.count !== 1 ? 's' : ''}
      </p>

      {/* Breakdown Bars */}
      {showBreakdown && (
        <div className="space-y-2">
          <h4 className="text-white text-sm font-medium">Rating breakdown</h4>
          {rating.breakdown.map((count, index) => {
            const starLevel = 5 - index
            const width = getBarWidth(count)
            
            return (
              <div key={starLevel} className="flex items-center gap-2 text-sm">
                <span className="text-[#adadad] w-2">{starLevel}</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 256 256" className="text-yellow-400">
                  <path d="M234.5,114.38l-45.1,39.36,13.51,58.6a16,16,0,0,1-23.84,17.34l-51.11-31-51,31a16,16,0,0,1-23.84-17.34L66.61,153.8,21.5,114.38a16,16,0,0,1,9.11-28.06l59.46-5.15,23.21-55.36a15.95,15.95,0,0,1,29.44,0L166,81.17l59.44,5.15a16,16,0,0,1,9.11,28.06Z"></path>
                </svg>
                
                <div className="flex-1 bg-[#363636] rounded-full h-2 relative overflow-hidden">
                  <div 
                    className="h-full bg-yellow-400 rounded-full transition-all duration-300"
                    style={{ width: `${width}%` }}
                  />
                </div>
                
                <span className="text-[#adadad] w-6 text-xs">
                  {count}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}