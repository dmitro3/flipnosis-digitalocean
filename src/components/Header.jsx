import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useWallet } from '../contexts/WalletContext'
import { useToast } from '../contexts/ToastContext'
import styled from '@emotion/styled'
import { ThemeProvider } from '@emotion/react'
import { theme } from '../styles/theme'
import { keyframes } from '@emotion/react'
import ProfileWithNotifications from './ProfileWithNotifications'
import PortalMenu from './PortalMenu'
import PopupMenu from './PopupMenu'

const HeaderContainer = styled.header`
  background-color: ${props => props.theme.colors.bgDark};
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
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

const RightSection = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`

const CreateButton = styled(Link)`
  background: linear-gradient(45deg, #FF1493, #FF69B4);
  color: #000000;
  padding: 0.5rem 1.5rem;
  border-radius: 0.75rem;
  text-decoration: none;
  font-weight: 600;
  transition: ${props => props.theme.transitions.default};
  position: relative;
  overflow: hidden;
  border: 2px solid #FF1493;
  
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
    
    &::before {
      transform: translateX(100%);
    }
  }
`

const AdminButton = styled(Link)`
  background: linear-gradient(45deg, #FF6B35, #F7931E);
  color: #000000;
  padding: 0.5rem 1.5rem;
  border-radius: 0.75rem;
  text-decoration: none;
  font-weight: 600;
  transition: ${props => props.theme.transitions.default};
  position: relative;
  overflow: hidden;
  border: 2px solid #FF6B35;
  
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
  background: none;
  border: none;
  color: #00BFFF;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0.5rem;
  z-index: 100000;
  transition: all 0.2s ease;
  
  &:hover {
    color: #0099CC;
    transform: scale(1.1);
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



const Header = () => {
  const { isConnected, address, chainId, chain } = useWallet()
  const { showInfo } = useToast()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  // Admin wallet address
  const ADMIN_WALLET = '0x47d80671Bcb7Ec368ef4d3ca6E1C20173CCc9a28'
  const isAdmin = isConnected && address && address.toLowerCase() === ADMIN_WALLET.toLowerCase()

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
          <PopupMenu />
          {isAdmin && <AdminButton to="/admin">Admin</AdminButton>}
  
          <ConnectButton 
            showBalance={{
              smallScreen: false,
              largeScreen: true,
            }}
          />
          {isConnected && <ProfileWithNotifications address={address} isConnected={isConnected} currentChain={chain?.name?.toLowerCase() || 'base'} />}
        </DesktopNav>

        <MenuButton onClick={() => setIsMenuOpen(!isMenuOpen)}>
          {isMenuOpen ? '✕' : '☰'}
        </MenuButton>

        <PortalMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
      </HeaderContainer>
    </ThemeProvider>
  )
}

export default Header 