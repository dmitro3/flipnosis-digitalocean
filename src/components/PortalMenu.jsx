import React from 'react';
import ReactDOM from 'react-dom';
import styled from '@emotion/styled';
import { Link } from 'react-router-dom';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useWallet } from '../contexts/WalletContext';
import ProfileWithNotifications from './ProfileWithNotifications';
import { 
  User, Gamepad2, Plus, Store, Palette, Settings, 
  ExternalLink, Home, Crown, ChevronRight, Info, Trophy
} from 'lucide-react';

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
  z-index: 999999;
`;

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
  z-index: 1000000;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  overflow-y: auto;
  border-left: 1px solid rgba(0, 255, 65, 0.2);
  box-shadow: -5px 0 20px rgba(0, 255, 65, 0.1);

  @media (min-width: 769px) {
    display: none;
  }
`;

const MenuItem = styled(Link)`
  color: ${props => props.theme.colors.textPrimary};
  text-decoration: none;
  padding: 1rem;
  border-radius: 0.5rem;
  transition: all 0.3s ease;
  background: rgba(0, 255, 65, 0.05);
  border: 2px solid rgba(0, 255, 65, 0.6);
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  
  &:hover {
    background: rgba(0, 255, 65, 0.1);
    color: #00FF41;
    transform: translateY(-2px);
    box-shadow: 0 0 15px rgba(0, 255, 65, 0.2);
    border-color: rgba(0, 255, 65, 0.8);
  }
`;

const MenuButtonItem = styled.button`
  color: ${props => props.theme.colors.textPrimary};
  text-decoration: none;
  padding: 1rem;
  border-radius: 0.5rem;
  transition: all 0.3s ease;
  background: rgba(0, 255, 65, 0.05);
  border: 2px solid rgba(0, 255, 65, 0.6);
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  text-align: left;
  cursor: pointer;
  
  &:hover {
    background: rgba(0, 255, 65, 0.1);
    color: #00FF41;
    transform: translateY(-2px);
    box-shadow: 0 0 15px rgba(0, 255, 65, 0.2);
    border-color: rgba(0, 255, 65, 0.8);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    
    &:hover {
      background: rgba(0, 255, 65, 0.05);
      color: ${props => props.theme.colors.textPrimary};
      transform: none;
      box-shadow: none;
      border-color: rgba(0, 255, 65, 0.6);
    }
  }
`;

const ComingSoonBadge = styled.span`
  background: linear-gradient(45deg, #FFD700, #FFA500);
  color: #000;
  font-size: 0.7rem;
  font-weight: bold;
  padding: 0.25rem 0.5rem;
  border-radius: 0.5rem;
  margin-left: auto;
`;

const MenuSection = styled.div`
  margin-bottom: 1.5rem;
`;

const MenuSectionTitle = styled.div`
  color: rgba(0, 255, 65, 0.7);
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 0.75rem;
  padding: 0 0.5rem;
`;

const Divider = styled.div`
  height: 1px;
  background: rgba(0, 255, 65, 0.2);
  margin: 1rem 0;
`;

const MenuHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid rgba(0, 255, 65, 0.2);
`;

const MenuTitle = styled.h2`
  color: #00FF41;
  margin: 0;
  font-size: 2rem;
  text-shadow: 0 0 10px rgba(0, 255, 65, 0.5);
  font-family: 'Hyperwave', sans-serif;
  letter-spacing: 2px;
`;

const StyledConnectButton = styled.div`
  margin: 1rem 0;
  
  /* Override Rainbow Kit button styles */
  button {
    width: 100% !important;
    background: transparent !important;
    color: #00FF41 !important;
    border: 1px solid rgba(0, 255, 65, 0.3) !important;
    border-radius: 0.75rem !important;
    padding: 0.75rem 1rem !important;
    font-weight: 600 !important;
    transition: all 0.3s ease !important;
    
    /* Remove the chain icon */
    div[data-testid="rk-chain-button"] {
      display: none !important;
    }
    
    &:hover {
      transform: translateY(-2px) !important;
      border-color: rgba(0, 255, 65, 0.5) !important;
      box-shadow: 0 0 20px rgba(0, 255, 65, 0.2) !important;
    }
  }
`;

const UserSection = styled.div`
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(0, 255, 65, 0.2);
`;

const PortalMenu = ({ isOpen, onClose }) => {
  const { isConnected, address, chain } = useWallet();

  // Admin wallet address
  const ADMIN_WALLET = '0xDd6377919ef1Ad4baBBEAd667eFE3F6607558628'
  const isAdmin = isConnected && address && address.toLowerCase() === ADMIN_WALLET.toLowerCase()

  const handleInfoClick = () => {
    // For mobile, we'll show a simple alert for now
    // In a full implementation, you might want to show a modal
    alert('About FLIPNOSIS\n\nFLIPNOSIS is a revolutionary NFT flipping game where players can create and participate in coin flip games with their NFTs and cryptocurrency.');
  };

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <>
      <MenuOverlay isOpen={isOpen} onClick={onClose} />
      <MobileMenu isOpen={isOpen}>
        <MenuHeader>
          <MenuTitle>Menu</MenuTitle>
        </MenuHeader>
        
        <MenuSection>
          <MenuSectionTitle>Navigation</MenuSectionTitle>
          <MenuItem to="/" onClick={onClose}>
            <Home size={16} />
            Home
          </MenuItem>
          <MenuItem to="/create-battle" onClick={onClose}>
            <Plus size={16} />
            Create Flip
          </MenuItem>
          {isConnected && (
            <MenuItem to="/profile" onClick={onClose}>
              <User size={16} />
              My Profile
            </MenuItem>
          )}
          <MenuButtonItem onClick={handleInfoClick}>
            <Info size={16} />
            About FLIPNOSIS
          </MenuButtonItem>
        </MenuSection>

        <Divider />

        <MenuSection>
          <MenuSectionTitle>Features</MenuSectionTitle>
          <MenuButtonItem disabled>
            <Palette size={16} />
            Coin Factory
            <ComingSoonBadge>Coming Soon</ComingSoonBadge>
          </MenuButtonItem>
          <MenuButtonItem disabled>
            <Store size={16} />
            Marketplace
            <ComingSoonBadge>Coming Soon</ComingSoonBadge>
          </MenuButtonItem>
          <MenuButtonItem disabled>
            <Trophy size={16} />
            Leaderboard
            <ComingSoonBadge>Coming Soon</ComingSoonBadge>
          </MenuButtonItem>
        </MenuSection>

        <Divider />

        <MenuSection>
          <MenuSectionTitle>Account</MenuSectionTitle>
          {isConnected ? (
            <>
              <MenuItem to="/profile" onClick={onClose}>
                <User size={16} />
                Profile Settings
              </MenuItem>
              <MenuItem to="/profile" onClick={onClose}>
                <Gamepad2 size={16} />
                My Games
              </MenuItem>
            </>
          ) : (
            <MenuButtonItem disabled>
              <User size={16} />
              Connect Wallet to Access
            </MenuButtonItem>
          )}
          {isAdmin && <MenuItem to="/admin" onClick={onClose}>Admin Panel</MenuItem>}
        </MenuSection>

        
        <StyledConnectButton>
          <ConnectButton 
            showBalance={{
              smallScreen: false,
              largeScreen: true,
            }}
          />
        </StyledConnectButton>

        {isConnected && (
          <UserSection>
            <ProfileWithNotifications address={address} isConnected={isConnected} currentChain={chain?.name?.toLowerCase() || 'base'} />
          </UserSection>
        )}
      </MobileMenu>
    </>,
    document.body
  );
};

export default PortalMenu; 