import React, { useState, useEffect } from 'react'
import { useWallet } from '../contexts/WalletContext'
import { useToast } from '../contexts/ToastContext'
import styled from '@emotion/styled'

const ConnectorContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  padding: 2rem;
  text-align: center;
`

const ConnectorCard = styled.div`
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 1rem;
  padding: 2rem;
  max-width: 400px;
  width: 100%;
`

const Title = styled.h2`
  color: #00ffff;
  margin-bottom: 1rem;
  font-size: 1.5rem;
`

const Description = styled.p`
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 2rem;
  line-height: 1.6;
`

const ConnectButton = styled.button`
  background: linear-gradient(135deg, #00ffff, #0080ff);
  border: none;
  border-radius: 0.5rem;
  color: #000;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 600;
  padding: 1rem 2rem;
  transition: all 0.3s ease;
  width: 100%;
  margin-bottom: 1rem;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 25px rgba(0, 255, 255, 0.3);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`

const SecondaryButton = styled(ConnectButton)`
  background: rgba(255, 255, 255, 0.1);
  color: #00ffff;
  border: 1px solid #00ffff;
  
  &:hover {
    background: rgba(0, 255, 255, 0.1);
    color: #fff;
  }
`

const DeviceInfo = styled.div`
  background: rgba(255, 255, 255, 0.03);
  border-radius: 0.5rem;
  padding: 1rem;
  margin-bottom: 1rem;
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.6);
`

const StatusIndicator = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
  font-size: 0.9rem;
  color: ${props => props.connected ? '#00ff00' : '#ff6b6b'};
`

const MetaMaskLogo = styled.div`
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, #f6851b, #e2761b);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1rem;
  font-size: 2rem;
`

const Instructions = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border-left: 3px solid #00ffff;
  padding: 1rem;
  margin-top: 1rem;
  border-radius: 0 0.5rem 0.5rem 0;
  text-align: left;
  
  h4 {
    color: #00ffff;
    margin: 0 0 0.5rem 0;
    font-size: 1rem;
  }
  
  ol {
    color: rgba(255, 255, 255, 0.8);
    font-size: 0.9rem;
    line-height: 1.5;
    padding-left: 1.2rem;
    margin: 0;
  }
  
  li {
    margin-bottom: 0.3rem;
  }
`

const MobileWalletConnector = () => {
  const { 
    isConnected, 
    isMobile, 
    isMetaMaskBrowser, 
    connectWallet, 
    loading 
  } = useWallet()
  const { showError, showInfo } = useToast()
  const [connecting, setConnecting] = useState(false)

  const handleConnect = async () => {
    setConnecting(true)
    try {
      const success = await connectWallet()
      if (!success) {
        showError('Failed to connect wallet')
      }
    } catch (error) {
      showError(error.message)
    } finally {
      setConnecting(false)
    }
  }

  const openInMetaMask = () => {
    const currentUrl = window.location.href
    const metamaskUrl = `https://metamask.app.link/dapp/${window.location.host}${window.location.pathname}`
    
    showInfo('Opening in MetaMask...')
    window.location.href = metamaskUrl
  }

  const downloadMetaMask = () => {
    if (isMobile) {
      // Detect iOS or Android
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
      const storeUrl = isIOS 
        ? 'https://apps.apple.com/us/app/metamask/id1438144202'
        : 'https://play.google.com/store/apps/details?id=io.metamask'
      
      window.open(storeUrl, '_blank')
    } else {
      window.open('https://metamask.io/download/', '_blank')
    }
  }

  if (isConnected) {
    return null // Don't show connector if already connected
  }

  return (
    <ConnectorContainer>
      <ConnectorCard>
        <MetaMaskLogo>🦊</MetaMaskLogo>
        
        <Title>Connect MetaMask Wallet</Title>
        
        <DeviceInfo>
          📱 Device: {isMobile ? 'Mobile' : 'Desktop'}<br/>
          🌐 Browser: {isMetaMaskBrowser ? 'MetaMask' : 'External'}<br/>
          🔗 MetaMask: {window.ethereum ? 'Detected' : 'Not Found'}
        </DeviceInfo>

        <StatusIndicator connected={isConnected}>
          <span>{isConnected ? '🟢' : '🔴'}</span>
          {isConnected ? 'Connected' : 'Not Connected'}
        </StatusIndicator>

        {/* Desktop Connection */}
        {!isMobile && (
          <>
            <Description>
              Connect your MetaMask wallet to start playing the NFT flipping game!
            </Description>
            
            {window.ethereum ? (
              <ConnectButton 
                onClick={handleConnect} 
                disabled={connecting || loading}
              >
                {connecting ? '🔄 Connecting...' : '🔗 Connect MetaMask'}
              </ConnectButton>
            ) : (
              <>
                <ConnectButton onClick={downloadMetaMask}>
                  📥 Install MetaMask
                </ConnectButton>
                <Description style={{fontSize: '0.9rem', marginTop: '1rem'}}>
                  MetaMask extension not found. Please install it first.
                </Description>
              </>
            )}
          </>
        )}

        {/* Mobile Connection */}
        {isMobile && (
          <>
            <Description>
              {isMetaMaskBrowser 
                ? "Great! You're using MetaMask's built-in browser. Connect your wallet to continue."
                : window.ethereum 
                  ? "MetaMask detected! You can connect here or open in MetaMask's browser for the best experience."
                  : "MetaMask not found. Please install MetaMask mobile app."
              }
            </Description>
            
            {/* Always show connect button if MetaMask is available */}
            {window.ethereum && (
              <ConnectButton 
                onClick={handleConnect} 
                disabled={connecting || loading}
              >
                {connecting ? '🔄 Connecting...' : '🔗 Connect MetaMask'}
              </ConnectButton>
            )}
            
            {/* Show additional options for external browsers */}
            {!isMetaMaskBrowser && window.ethereum && (
              <SecondaryButton onClick={openInMetaMask}>
                🦊 Open in MetaMask Browser
              </SecondaryButton>
            )}
            
            {/* Show install option if no MetaMask */}
            {!window.ethereum && (
              <>
                <ConnectButton onClick={downloadMetaMask}>
                  📥 Install MetaMask
                </ConnectButton>
                
                <Instructions>
                  <h4>📋 Setup Instructions:</h4>
                  <ol>
                    <li>Install MetaMask from your app store</li>
                    <li>Create or import your wallet</li>
                    <li>Copy this page's URL</li>
                    <li>Open MetaMask app</li>
                    <li>Tap the browser tab (🌐)</li>
                    <li>Paste the URL and navigate here</li>
                  </ol>
                </Instructions>
              </>
            )}
          </>
        )}

        {/* Loading State */}
        {(loading || connecting) && (
          <DeviceInfo style={{marginTop: '1rem'}}>
            🔄 {connecting ? 'Connecting wallet...' : 'Loading...'}
          </DeviceInfo>
        )}
      </ConnectorCard>
    </ConnectorContainer>
  )
}

export default MobileWalletConnector 