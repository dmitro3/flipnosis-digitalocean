// API Configuration
export const API_BASE_URL = process.env.REACT_APP_API_URL || ''

export const getApiUrl = (path) => {
  return `${API_BASE_URL}${path}`
}

export const getWsUrl = () => {
  // Determine WebSocket URL based on current location
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  const host = window.location.host
  
  // In production, use the same host
  // In development, you might need to adjust the port
  if (process.env.NODE_ENV === 'development') {
    // Development - backend might be on different port
    const backendPort = process.env.REACT_APP_BACKEND_PORT || '3000'
    return `${protocol}//${window.location.hostname}:${backendPort}/ws`
  } else {
    // Production - use same host
    return `${protocol}//${host}/ws`
  }
} 