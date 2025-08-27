export const isMobileDevice = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
         window.innerWidth <= 768 ||
         ('ontouchstart' in window) ||
         (navigator.maxTouchPoints > 0)
}

export const getDevicePerformanceTier = () => {
  const userAgent = navigator.userAgent.toLowerCase()
  const memory = navigator.deviceMemory || 4 // Default to 4GB if not available
  const cores = navigator.hardwareConcurrency || 4
  
  // Low-end mobile devices
  if (memory <= 2 || cores <= 4) {
    return 'low'
  }
  
  // Mid-tier devices
  if (memory <= 4 || cores <= 6) {
    return 'medium'
  }
  
  // High-end devices
  return 'high'
}

export const detectDevice = () => {
  const isMobile = isMobileDevice()
  const performanceTier = getDevicePerformanceTier()
  const isLowPerformance = performanceTier === 'low'
  
  return {
    isMobile,
    isLowPerformance,
    performanceTier
  }
}
