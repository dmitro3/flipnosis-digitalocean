import React from 'react'
import { isMobileDevice } from '../utils/deviceDetection'
import CSSGoldCoin from './CSSGoldCoin'
import ReliableGoldCoin from './ReliableGoldCoin' // Your existing Three.js version

const SmartGoldCoin = (props) => {
  const isMobile = isMobileDevice()
  
  // Use lightweight CSS version for mobile, Three.js for desktop
  if (isMobile) {
    return <CSSGoldCoin {...props} />
  }
  
  return <ReliableGoldCoin {...props} />
}

export default SmartGoldCoin 