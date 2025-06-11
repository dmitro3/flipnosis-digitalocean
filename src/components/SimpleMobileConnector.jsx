import React, { useState } from 'react'
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

const SimpleMobileConnector = () => {
  const { connectWallet, loading, isMobile, isMetaMaskBrowser } = useWallet()
  const { showError, showInfo } = useToast()
  const [connecting, setConnecting] = useState(false)

  console.log('🔍 Mobile Connector Debug:', { 
    isMobile, 
    isMetaMaskBrowser, 
    hasEthereum: !!window.ethereum,
    userAgent: navigator.userAgent
  })

  const handleConnect = async () => {
    console.log('🔗 Attempting to connect...')
    setConnecting(true)
    try {
      const success = await connectWallet()
      if (!success) {
        showError('Failed to connect wallet')
      }
    } catch (error) {
      console.error('❌ Connection error:', error)
      showError(error.message)
    } finally {
      setConnecting(false)
    }
  }

  const openInMetaMask = () => {
    const currentUrl = window.location.href
    const metamaskUrl = `https://metamask.app.link/dapp/${window.location.host}${window.location.pathname}`
    
    console.log('🔗 Redirecting to MetaMask:', metamaskUrl)
    showInfo('Opening in MetaMask...')
    window.location.href = metamaskUrl
  }

  const downloadMetaMask = () => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    const storeUrl = isIOS 
      ? 'https://apps.apple.com/us/app/metamask/id1438144202'
      : 'https://play.google.com/store/apps/details?id=io.metamask'
    
    console.log('📱 Opening app store:', storeUrl)
    window.open(storeUrl, '_blank')
  }

  return (
    <ConnectorContainer>
      <ConnectorCard>
        <MetaMaskLogo>🦊</MetaMaskLogo>
        
        <Title>Connect MetaMask</Title>
        
        <DeviceInfo>
          📱 Mobile: {isMobile ? 'YES' : 'NO'}<br/>
          🦊 MetaMask Browser: {isMetaMaskBrowser ? 'YES' : 'NO'}<br/>
          🌐 Ethereum: {window.ethereum ? 'YES' : 'NO'}
        </DeviceInfo>

        {/* Always show connect button if ethereum is available */}
        {window.ethereum ? (
          <>
            <Description>
              {isMetaMaskBrowser 
                ? "You're in MetaMask's browser. Perfect!"
                : isMobile 
                  ? "MetaMask detected! Connect or use MetaMask browser."
                  : "MetaMask detected! Click to connect."
              }
            </Description>
            
            <ConnectButton 
              onClick={handleConnect} 
              disabled={connecting || loading}
            >
              {connecting ? '🔄 Connecting...' : '🔗 Connect MetaMask'}
            </ConnectButton>

            {/* Show "Open in MetaMask" option for mobile external browsers */}
            {isMobile && !isMetaMaskBrowser && (
              <SecondaryButton onClick={openInMetaMask}>
                🦊 Open in MetaMask Browser
              </SecondaryButton>
            )}
          </>
        ) : (
          <>
            <Description>
              MetaMask not found. Please install MetaMask to continue.
            </Description>
            
            <ConnectButton onClick={downloadMetaMask}>
              📥 Install MetaMask
            </ConnectButton>
          </>
        )}

        {/* Loading State */}
        {(loading || connecting) && (
          <DeviceInfo style={{marginTop: '1rem'}}>
            🔄 {connecting ? 'Connecting...' : 'Loading...'}
          </DeviceInfo>
        )}
      </ConnectorCard>
    </ConnectorContainer>
  )
}

export default SimpleMobileConnector 