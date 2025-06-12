import React, { useState, useEffect } from 'react'
import { useWallet } from '../contexts/WalletContext'
import styled from '@emotion/styled'

const DebugContainer = styled.div`
  position: fixed;
  bottom: 20px;
  right: 20px;
  background: rgba(0, 0, 0, 0.9);
  border: 1px solid #00ffff;
  border-radius: 8px;
  padding: 15px;
  max-width: 90vw;
  max-height: 80vh;
  overflow-y: auto;
  z-index: 9999;
  font-family: monospace;
  font-size: 12px;
  color: #00ff00;
`

const DebugHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  padding-bottom: 5px;
  border-bottom: 1px solid #00ffff;
`

const DebugTitle = styled.h3`
  margin: 0;
  color: #00ffff;
  font-size: 14px;
`

const ToggleButton = styled.button`
  background: none;
  border: 1px solid #00ffff;
  color: #00ffff;
  padding: 5px 10px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  
  &:hover {
    background: rgba(0, 255, 255, 0.1);
  }
`

const DebugContent = styled.div`
  white-space: pre-wrap;
  word-break: break-all;
`

const CopyButton = styled.button`
  background: none;
  border: 1px solid #00ff00;
  color: #00ff00;
  padding: 5px 10px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  margin-top: 10px;
  
  &:hover {
    background: rgba(0, 255, 0, 0.1);
  }
`

const DebugPanel = () => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [debugInfo, setDebugInfo] = useState({})
  const { 
    isConnected, 
    address, 
    chain, 
    isMobile, 
    isMetaMaskBrowser,
    loading 
  } = useWallet()

  useEffect(() => {
    const updateDebugInfo = () => {
      const info = {
        timestamp: new Date().toISOString(),
        environment: {
          userAgent: navigator.userAgent,
          platform: navigator.platform,
          vendor: navigator.vendor,
          language: navigator.language,
          screenSize: `${window.innerWidth}x${window.innerHeight}`,
          devicePixelRatio: window.devicePixelRatio,
          isMobile: isMobile,
          isMetaMaskBrowser: isMetaMaskBrowser,
          hasEthereum: !!window.ethereum,
          ethereumProvider: window.ethereum ? {
            isMetaMask: window.ethereum.isMetaMask,
            isBraveWallet: window.ethereum.isBraveWallet,
            isCoinbaseWallet: window.ethereum.isCoinbaseWallet,
            selectedAddress: window.ethereum.selectedAddress,
            networkVersion: window.ethereum.networkVersion,
            chainId: window.ethereum.chainId,
          } : null
        },
        wallet: {
          isConnected,
          address,
          chain,
          loading
        },
        location: {
          href: window.location.href,
          host: window.location.host,
          pathname: window.location.pathname,
          search: window.location.search
        },
        localStorage: {
          connectedWallet: localStorage.getItem('connectedWallet')
        }
      }
      setDebugInfo(info)
    }

    updateDebugInfo()
    const interval = setInterval(updateDebugInfo, 1000)
    return () => clearInterval(interval)
  }, [isConnected, address, chain, isMobile, isMetaMaskBrowser, loading])

  const copyDebugInfo = () => {
    navigator.clipboard.writeText(JSON.stringify(debugInfo, null, 2))
  }

  if (!isExpanded) {
    return (
      <DebugContainer style={{ width: 'auto', height: 'auto' }}>
        <DebugHeader>
          <DebugTitle>Debug Panel</DebugTitle>
          <ToggleButton onClick={() => setIsExpanded(true)}>Expand</ToggleButton>
        </DebugHeader>
        <div>🟢 {isConnected ? 'Connected' : 'Disconnected'}</div>
        <div>📱 {isMobile ? 'Mobile' : 'Desktop'}</div>
        <div>🦊 {isMetaMaskBrowser ? 'MetaMask Browser' : 'External Browser'}</div>
      </DebugContainer>
    )
  }

  return (
    <DebugContainer>
      <DebugHeader>
        <DebugTitle>Debug Panel</DebugTitle>
        <ToggleButton onClick={() => setIsExpanded(false)}>Collapse</ToggleButton>
      </DebugHeader>
      <DebugContent>
        {JSON.stringify(debugInfo, null, 2)}
      </DebugContent>
      <CopyButton onClick={copyDebugInfo}>Copy Debug Info</CopyButton>
    </DebugContainer>
  )
}

export default DebugPanel 