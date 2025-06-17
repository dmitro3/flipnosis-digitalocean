import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useWallet } from '../contexts/WalletContext'
import { useToast } from '../contexts/ToastContext'
import styled from '@emotion/styled'
import { ThemeProvider } from '@emotion/react'
import { theme } from '../styles/theme'
import FlipnosisInfoImg from '../../Images/Info/FLIPNOSIS.webp'
import MobileInfoImg from '../../Images/mobile.webp'
import { keyframes } from '@emotion/react'
import MyFlipsDropdown from './MyFlipsDropdown'
import UserProfileHeader from './UserProfileHeader'
import PortalMenu from './PortalMenu'

const HeaderContainer = styled.header`
  background-color: ${props => props.theme.colors.bgDark};
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  position: relative;
  z-index: 100;
  width: 100%;
  box-sizing: border-box;
  overflow-x: hidden;

  @media (max-width: 768px) {
    padding: 0.75rem 1rem;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    background: rgba(0, 0, 0, 0.95);
    backdrop-filter: blur(10px);
    z-index: 9998;
  }
`

const LogoContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;

  @media (max-width: 768px) {
    gap: 0.5rem;
  }
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
  
  @media (max-width: 768px) {
    font-size: 2.5rem;
    letter-spacing: 4px;
  }
`

const DesktopNav = styled.div`
  display: flex;
  gap: 1rem;
  align-items: center;

  @media (max-width: 768px) {
    display: none;
  }
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

  @media (max-width: 768px) {
    display: none;
  }
`

const MenuButton = styled.button`
  display: none;
  background: none;
  border: none;
  color: #00FF41;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0.5rem;
  z-index: 100000;

  @media (max-width: 768px) {
    display: block;
  }
`

const MobileMenu = styled.div`
  position: fixed;
  top: 0;
  right: 0;
  width: 70%;
  max-width: 250px;
  height: 100vh;
  background: rgba(0, 0, 0, 0.95);
  backdrop-filter: blur(10px);
  padding: 1.5rem;
  transform: translateX(${props => props.isOpen ? '0' : '100%'});
  transition: transform 0.3s ease;
  z-index: 99999;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  overflow-y: auto;

  @media (min-width: 769px) {
    display: none;
  }
`

const MenuOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(5px);
  opacity: ${props => props.isOpen ? 1 : 0};
  visibility: ${props => props.isOpen ? 'visible' : 'hidden'};
  transition: all 0.3s ease;
  z-index: 99998;
`

const MenuItem = styled(Link)`
  color: ${props => props.theme.colors.textPrimary};
  text-decoration: none;
  padding: 1rem;
  border-radius: 0.5rem;
  transition: ${props => props.theme.transitions.default};
  
  &:hover {
    background: rgba(0, 255, 65, 0.1);
    color: #00FF41;
  }
`

const WalletButton = styled.button`
  background: rgba(255, 255, 255, 0.1);
  color: ${props => props.theme.colors.neonPink};
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
  font-weight: 500;
  cursor: pointer;
  transition: ${props => props.theme.transitions.default};
  
  @media (max-width: 768px) {
    width: 100%;
    margin-top: auto;
  }
  
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

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 0.5rem;
    padding: 1rem;
    margin-bottom: 1rem;
  }
`

const WalletAddress = styled.div`
  color: ${props => props.theme.colors.neonPink};
  font-weight: 500;
  font-family: monospace;

  @media (max-width: 768px) {
    text-align: center;
  }
`

const ChainIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: ${props => props.theme.colors.textSecondary};
  font-size: 0.875rem;

  @media (max-width: 768px) {
    justify-content: center;
  }
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
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
  animation: ${infoPulse} 1.2s infinite;
  &:hover {
    background: rgba(0,255,65,0.25);
  }

  @media (max-width: 768px) {
    display: none;
  }
`

const MobileInfoButton = styled(InfoButton)`
  display: none;

  @media (max-width: 768px) {
    display: flex;
    margin: 0;
    width: 100%;
    border-radius: 0.5rem;
    height: auto;
    padding: 0.75rem;
    font-size: 1rem;
  }
`

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

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  margin-bottom: 1rem;
`;

const ModalBody = styled.div`
  max-width: 600px;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const Header = () => {
  const { isConnected } = useWallet()
  const { showInfo } = useToast()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [showInfoModal, setShowInfoModal] = useState(false)

  const handleResize = () => {
    if (window.innerWidth > 768) {
      setIsMenuOpen(false)
    }
  }

  React.useEffect(() => {
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <ThemeProvider theme={theme}>
      <HeaderContainer>
        <LogoContainer>
          <Logo to="/">FLIPNOSIS</Logo>
        </LogoContainer>

        <DesktopNav>
          <CreateButton to="/create">Create Flip</CreateButton>
          <ConnectButton 
            showBalance={{
              smallScreen: false,
              largeScreen: true,
            }}
          />
          {isConnected && <UserProfileHeader isInHeader={true} />}
        </DesktopNav>

        <MenuButton onClick={() => setIsMenuOpen(!isMenuOpen)}>
          {isMenuOpen ? '✕' : '☰'}
        </MenuButton>

        <PortalMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />

        <InfoButton 
          onClick={() => setShowInfoModal(true)} 
          title="About FLIPNOSIS"
        >
          i
        </InfoButton>

        {showInfoModal && (
          <ModalOverlay onClick={() => setShowInfoModal(false)}>
            <ModalContent onClick={e => e.stopPropagation()}>
              <CloseButton onClick={() => setShowInfoModal(false)}>×</CloseButton>
              <ModalHeader>
                <h2 style={{ color: '#00FF41', margin: 0 }}>About FLIPNOSIS</h2>
              </ModalHeader>
              <ModalBody>
                <img 
                  src={window.innerWidth <= 768 ? MobileInfoImg : FlipnosisInfoImg} 
                  alt="FLIPNOSIS Info" 
                  style={{ 
                    maxWidth: '100%', 
                    height: 'auto',
                    borderRadius: '1rem'
                  }} 
                />
              </ModalBody>
            </ModalContent>
          </ModalOverlay>
        )}
      </HeaderContainer>
    </ThemeProvider>
  )
}

export default Header 