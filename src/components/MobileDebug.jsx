import React from 'react'
import { useWallet } from '../contexts/WalletContext'

const MobileDebug = () => {
  const { isMobile, isMetaMaskBrowser } = useWallet()
  
  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      right: '10px',
      background: 'rgba(0, 0, 0, 0.8)',
      color: 'white',
      padding: '10px',
      borderRadius: '5px',
      fontSize: '12px',
      zIndex: 9999
    }}>
      <div>📱 Mobile: {isMobile ? 'YES' : 'NO'}</div>
      <div>🦊 MetaMask Browser: {isMetaMaskBrowser ? 'YES' : 'NO'}</div>
      <div>🌐 Window.ethereum: {window.ethereum ? 'YES' : 'NO'}</div>
      <div>🎯 UserAgent: {navigator.userAgent.includes('Mobile') ? 'Mobile' : 'Desktop'}</div>
    </div>
  )
}

export default MobileDebug 