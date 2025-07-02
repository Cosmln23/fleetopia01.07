// Number formatting utilities for consistent server-side and client-side rendering

export function formatPrice(price: number): string {
  // Use consistent formatting to avoid hydration errors
  // Always use dot as thousands separator to match server rendering
  return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

export function formatWeight(weight: number): string {
  return weight.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

export function formatNumber(num: number): string {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')
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