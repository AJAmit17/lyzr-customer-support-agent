/**
 * Get the application URL dynamically
 * Uses environment variable in production, window.location.origin in browser
 */
export function getAppUrl(): string {
  // Server-side: use environment variable
  if (typeof window === 'undefined') {
    return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  }
  
  // Client-side: use window.location.origin
  return window.location.origin
}

/**
 * Get the API base URL
 */
export function getApiUrl(): string {
  return getAppUrl()
}

/**
 * Get the widget script URL
 */
export function getWidgetUrl(): string {
  return `${getAppUrl()}/widget/chat.js`
}
