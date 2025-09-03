// API Configuration
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://flipnosis.fun'

export const getApiUrl = (path) => {
  return `${API_BASE_URL}${path}`
}

export const getWsUrl = () => {
  // Determine WebSocket URL based on current location
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  const host = window.location.host
  
  // For production (Hetzner server), always use the same host
  if (process.env.NODE_ENV === 'production' || host === 'flipnosis.fun') {
    return `${protocol}//${host}/ws`
  } else {
    // Development - backend might be on different port
    const backendPort = process.env.REACT_APP_BACKEND_PORT || '3000'
    return `${protocol}//${window.location.hostname}:${backendPort}/ws`
  }
} 