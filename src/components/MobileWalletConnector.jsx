import React, { useState, useEffect } from 'react'
import { useWallet } from '../contexts/WalletContext'
import { useToast } from '../contexts/ToastContext'
import styled from '@emotion/styled'

const ConnectorContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 1rem;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
`

const ConnectorCard = styled.div`
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 1.5rem;
  padding: 2rem;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
`

const Title = styled.h1`
  color: #fff;
  font-size: 1.8rem;
  margin-bottom: 1rem;
  text-align: center;
  background: linear-gradient(135deg, #00ffff, #0080ff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
`

const Description = styled.p`
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 2rem;
  line-height: 1.6;
  text-align: center;
  font-size: 1rem;
`

const Button = styled.button`
  width: 100%;
  padding: 1rem;
  border-radius: 1rem;
  border: none;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-bottom: 1rem;
  background: ${props => props.primary ? 'linear-gradient(135deg, #00ffff, #0080ff)' : 'rgba(255, 255, 255, 0.1)'};
  color: ${props => props.primary ? '#000' : '#fff'};
  border: ${props => props.primary ? 'none' : '1px solid rgba(255, 255, 255, 0.2)'};

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(0, 255, 255, 0.2);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`

const MetaMaskLogo = styled.div`
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #f6851b, #e2761b);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 2rem;
  font-size: 2.5rem;
  box-shadow: 0 8px 32px rgba(246, 133, 27, 0.3);
`

const StatusIndicator = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  font-size: 0.9rem;
  color: ${props => props.connected ? '#00ff00' : '#ff6b6b'};
`

const Instructions = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border-left: 3px solid #00ffff;
  padding: 1rem;
  margin-top: 1.5rem;
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
    margin-bottom: 0.5rem;
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
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    const storeUrl = isIOS 
      ? 'https://apps.apple.com/us/app/metamask/id1438144202'
      : 'https://play.google.com/store/apps/details?id=io.metamask'
    
    window.open(storeUrl, '_blank')
  }

  return (
    <ConnectorContainer>
      <ConnectorCard>
        <MetaMaskLogo>🦊</MetaMaskLogo>
        <Title>Connect Your Wallet</Title>
        
        <StatusIndicator connected={isConnected}>
          {isConnected ? '✅ Connected' : '❌ Not Connected'}
        </StatusIndicator>

        <Description>
          {isMetaMaskBrowser 
            ? "You're using MetaMask's built-in browser. Connect your wallet to continue."
            : window.ethereum 
              ? "MetaMask detected! You can connect here or open in MetaMask's browser for the best experience."
              : "MetaMask not found. Please install MetaMask mobile app."
          }
        </Description>

        {window.ethereum && (
          <Button 
            primary 
            onClick={handleConnect} 
            disabled={connecting || loading}
          >
            {connecting ? '🔄 Connecting...' : '🔗 Connect MetaMask'}
          </Button>
        )}

        {!isMetaMaskBrowser && window.ethereum && (
          <Button onClick={openInMetaMask}>
            🦊 Open in MetaMask Browser
          </Button>
        )}

        {!window.ethereum && (
          <Button onClick={downloadMetaMask}>
            📱 Install MetaMask
          </Button>
        )}

        <Instructions>
          <h4>How to Connect:</h4>
          <ol>
            <li>Install MetaMask mobile app if you haven't already</li>
            <li>Open this site in MetaMask's built-in browser</li>
            <li>Click "Connect MetaMask" to link your wallet</li>
            <li>Approve the connection request in MetaMask</li>
          </ol>
        </Instructions>
      </ConnectorCard>
    </ConnectorContainer>
  )
}

export default MobileWalletConnector 