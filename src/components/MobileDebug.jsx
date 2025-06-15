import React from 'react'
import { useWallet } from '../contexts/WalletContext'
import { useAccount } from 'wagmi'

const MobileDebug = () => {
  const { isMobile } = useWallet()
  const { isConnected, address } = useAccount()
  
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
      <div>🔗 Wagmi Connected: {isConnected ? 'YES' : 'NO'}</div>
      <div>👤 Address: {address ? `${address.slice(0, 6)}...` : 'None'}</div>
      <div>🌐 Window.ethereum: {window.ethereum ? 'YES' : 'NO'}</div>
      <div>🎯 UserAgent: {navigator.userAgent.includes('Mobile') ? 'Mobile' : 'Desktop'}</div>
    </div>
  )
}

export default MobileDebug 