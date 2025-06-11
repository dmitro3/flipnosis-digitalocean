import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useWallet } from '../contexts/WalletContext'
import styled from '@emotion/styled'
import { ThemeProvider } from '@emotion/react'
import { theme } from '../styles/theme'
import FlipnosisInfoImg from '../../Images/Info/FLIPNOSIS.webp'
import { keyframes } from '@emotion/react'
import MyFlipsDropdown from './MyFlipsDropdown'
import MobileWalletConnector from './MobileWalletConnector'

const HeaderContainer = styled.header`
  background-color: ${props => props.theme.colors.bgDark};
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  position: relative;
  z-index: 100;
`

const LogoContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`

const Logo = styled(Link)`
  color: #00FF41;
  font-size: 3rem;
  font-weight: 700;
  text-decoration: none;
  letter-spacing: 6px;
  font-family: 'Hyperwave', sans-serif;
  animation: neonPulse 2s infinite;
  ${props => props.theme.animations.neonPulse}
`

const CreateButton = styled(Link)`
  background: linear-gradient(45deg, #00FF41, #39FF14);
  color: #000000;
  padding: 0.5rem 1.5rem;
  border-radius: 0.75rem;
  text-decoration: none;
  font-weight: 600;
  transition: ${props => props.theme.transitions.default};
  position: relative;
  overflow: hidden;
  border: 2px solid #00FF41;
  box-shadow: 0 0 5px #00FF41, 0 0 10px #00FF41, 0 0 20px #00FF41;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.1), transparent);
    transform: translateX(-100%);
    transition: ${props => props.theme.transitions.default};
  }
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 0 10px #00FF41, 0 0 20px #00FF41, 0 0 40px #00FF41;
    
    &::before {
      transform: translateX(100%);
    }
  }
`

const WalletSection = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`

const WalletButton = styled.button`
  background: rgba(255, 255, 255, 0.1);
  color: ${props => props.theme.colors.neonPink};
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  font-weight: 500;
  cursor: pointer;
  transition: ${props => props.theme.transitions.default};
  
  &:hover {
    background: rgba(255, 255, 255, 0.15);
    border-color: ${props => props.theme.colors.neonPink};
    box-shadow: ${props => props.theme.shadows.neon};
  }
`

const WalletInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  background: rgba(255, 255, 255, 0.05);
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
`

const WalletAddress = styled.div`
  color: ${props => props.theme.colors.neonPink};
  font-weight: 500;
  font-family: monospace;
`

const ChainIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: ${props => props.theme.colors.textSecondary};
  font-size: 0.875rem;
`

const ChainDot = styled.div`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: ${props => 
    props.chain === 'ethereum' ? '#627EEA' :
    props.chain === 'polygon' ? '#8247E5' :
    props.chain === 'arbitrum' ? '#28A0F0' :
    props.chain === 'optimism' ? '#FF0420' :
    props.chain === 'bnb' ? '#F3BA2F' :
    props.chain === 'avalanche' ? '#E84142' :
    props.chain === 'base' ? '#0052FF' : '#666'
  };
`

const infoPulse = keyframes`
  0%, 100% {
    box-shadow: 0 0 0px #00FF41, 0 0 0px #00FF41;
    border-color: #00FF41;
  }
  50% {
    box-shadow: 0 0 16px #00FF41, 0 0 32px #00FF41;
    border-color: #baffc9;
  }
`;

const InfoButton = styled.button`
  background: rgba(0,255,65,0.12);
  border: 2px solid #00FF41;
  color: #00FF41;
  border-radius: 50%;
  width: 2.5rem;
  height: 2.5rem;
  font-size: 1.5rem;
  font-weight: bold;
  margin-left: 1.5rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
  animation: ${infoPulse} 1.2s infinite;
  &:hover {
    background: rgba(0,255,65,0.25);
  }
`;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.7);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
`;
const ModalContent = styled.div`
  background: #181c1b;
  border-radius: 1rem;
  padding: 2rem;
  box-shadow: 0 0 32px #00FF41;
  max-width: 95vw;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  align-items: center;
`;
const CloseButton = styled.button`
  background: none;
  border: none;
  color: #00FF41;
  font-size: 2rem;
  position: absolute;
  top: 2rem;
  right: 2rem;
  cursor: pointer;
`;

const Header = () => {
  const { address, connectWallet, disconnectWallet, isConnected, chain, chains, loading, isMobile } = useWallet()
  const [showInfo, setShowInfo] = useState(false)
  const [showWalletModal, setShowWalletModal] = useState(false)

  const handleConnect = async () => {
    try {
      if (isMobile) {
        setShowWalletModal(true)
      } else {
        await connectWallet()
      }
    } catch (error) {
      console.error('Failed to connect wallet:', error)
    }
  }

  return (
    <ThemeProvider theme={theme}>
      <HeaderContainer>
        <LogoContainer>
          <Logo to="/">FLIPNOSIS</Logo>
        </LogoContainer>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <CreateButton to="/create">
            Create Flip
          </CreateButton>
          {isConnected && <MyFlipsDropdown />}
        </div>
        <WalletSection>
          {isConnected && address ? (
            <>
              <WalletInfo>
                <ChainIndicator>
                  <ChainDot chain={chain} />
                  <span>{chains[chain]?.name || 'Unknown'}</span>
                </ChainIndicator>
                <WalletAddress>
                  {address.slice(0, 6)}...{address.slice(-4)}
                </WalletAddress>
              </WalletInfo>
              <WalletButton onClick={disconnectWallet}>
                Disconnect
              </WalletButton>
            </>
          ) : (
            <WalletButton onClick={handleConnect} disabled={loading}>
              {loading ? 'Connecting...' : 'Connect Wallet'}
            </WalletButton>
          )}
        </WalletSection>
        <InfoButton onClick={() => setShowInfo(true)} title="About FLIPNOSIS">i</InfoButton>

        {showInfo && (
          <ModalOverlay onClick={() => setShowInfo(false)}>
            <ModalContent onClick={e => e.stopPropagation()} style={{ position: 'relative' }}>
              <CloseButton onClick={() => setShowInfo(false)} title="Close">×</CloseButton>
              <img src={FlipnosisInfoImg} alt="FLIPNOSIS Info" style={{ maxWidth: '80vw', maxHeight: '70vh', borderRadius: '0.5rem' }} />
            </ModalContent>
          </ModalOverlay>
        )}

        {/* Mobile Wallet Connector Modal */}
        {showWalletModal && (
          <div style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
            padding: '1rem'
          }}>
            <div style={{
              position: 'relative',
              width: '100%',
              maxWidth: '400px'
            }}>
              <button
                onClick={() => setShowWalletModal(false)}
                style={{
                  position: 'absolute',
                  top: '1rem',
                  right: '1rem',
                  background: 'none',
                  border: 'none',
                  color: 'white',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  zIndex: 1
                }}
              >
                ×
              </button>
              <MobileWalletConnector />
            </div>
          </div>
        )}
      </HeaderContainer>
    </ThemeProvider>
  )
}

export default Header 