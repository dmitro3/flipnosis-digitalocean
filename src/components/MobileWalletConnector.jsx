import React, { useState, useEffect } from 'react'
import { useWallet } from '../contexts/WalletContext'
import { useToast } from '../contexts/ToastContext'
import styled from '@emotion/styled'

const ConnectorContainer = styled.div`
  background: rgba(0, 0, 0, 0.9);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(0, 255, 255, 0.2);
  border-radius: 1rem;
  padding: 1rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
`

const Title = styled.h3`
  color: #00ffff;
  margin: 0 0 0.5rem 0;
  font-size: 1rem;
  text-align: center;
`

const Description = styled.p`
  color: rgba(255, 255, 255, 0.8);
  margin: 0 0 1rem 0;
  font-size: 0.9rem;
  text-align: center;
`

const Button = styled.button`
  width: 100%;
  padding: 0.75rem;
  border-radius: 0.5rem;
  border: none;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-bottom: 0.5rem;
  background: ${props => props.primary ? 'linear-gradient(135deg, #00ffff, #0080ff)' : 'rgba(255, 255, 255, 0.1)'};
  color: ${props => props.primary ? '#000' : '#fff'};
  border: ${props => props.primary ? 'none' : '1px solid rgba(255, 255, 255, 0.2)'};

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 255, 255, 0.2);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`

const CloseButton = styled.button`
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.5);
  font-size: 1.2rem;
  cursor: pointer;
  padding: 0.25rem;
  line-height: 1;
  
  &:hover {
    color: #fff;
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
  const [isVisible, setIsVisible] = useState(true)

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

  if (!isVisible) return null

  return (
    <ConnectorContainer>
      <CloseButton onClick={() => setIsVisible(false)}>×</CloseButton>
      <Title>Connect Wallet</Title>
      
      <Description>
        {isMetaMaskBrowser 
          ? "Connect your wallet to start playing"
          : window.ethereum 
            ? "Connect here or open in MetaMask for best experience"
            : "Install MetaMask to play"
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
          🦊 Open in MetaMask
        </Button>
      )}

      {!window.ethereum && (
        <Button onClick={downloadMetaMask}>
          📱 Install MetaMask
        </Button>
      )}
    </ConnectorContainer>
  )
}

export default MobileWalletConnector 