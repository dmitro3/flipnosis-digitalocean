// API Configuration
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://flipnosis.fun'

export const getApiUrl = (path) => {
  // Ensure path starts with /api if it doesn't already
  const apiPath = path.startsWith('/api') ? path : `/api${path}`
  return `${API_BASE_URL}${apiPath}`
}

export const getWsUrl = () => {
  // Socket.io URL - no /ws suffix needed
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  const host = window.location.host
  
  // For production (Hetzner server), always use the same host
  if (process.env.NODE_ENV === 'production' || host === 'flipnosis.fun') {
    return `${protocol}//${host}`
  } else {
    // Development - backend might be on different port
    const backendPort = process.env.REACT_APP_BACKEND_PORT || '3000'
    return `${protocol}//${window.location.hostname}:${backendPort}`
  }
} 