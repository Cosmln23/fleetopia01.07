// Number formatting utilities for consistent server-side and client-side rendering

export function formatPrice(price: number): string {
  // Use consistent formatting to avoid hydration errors
  // Properly handle decimal places and thousands separators
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(parseFloat(price.toFixed(2)))
}

export function formatWeight(weight: number): string {
  return new Intl.NumberFormat('en-US').format(parseFloat(weight.toFixed(0)))
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(parseFloat(num.toFixed(2)))
}

// Alternative function for production with locale support
export function formatPriceWithLocale(price: number, locale: string = 'de-DE'): string {
  // For production, use consistent locale
  return new Intl.NumberFormat(locale).format(price)
}

// Safe formatting that works on both server and client
export function safeFormatPrice(price: number): string {
  if (typeof window === 'undefined') {
    // Server-side: use dot separator
    return formatPrice(price)
  } else {
    // Client-side: use same format to match server
    return formatPrice(price)
  }
}