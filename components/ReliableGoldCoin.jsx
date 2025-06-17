import React from 'react'
import { isMobileDevice } from '../utils/deviceDetection'
import MobileOptimizedGoldCoin from './MobileOptimizedGoldCoin'
import DesktopGoldCoin from './DesktopGoldCoin' // Your existing component renamed

const ReliableGoldCoin = (props) => {
  const isMobile = isMobileDevice()
  
  // Use mobile-optimized component for mobile devices
  if (isMobile) {
    return <MobileOptimizedGoldCoin {...props} />
  }
  
  // Use your existing desktop component for desktop
  return <DesktopGoldCoin {...props} />
}

export default ReliableGoldCoin 