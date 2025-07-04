import React from 'react';
import ReactDOM from 'react-dom';
import styled from '@emotion/styled';
import { Link } from 'react-router-dom';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useWallet } from '../contexts/WalletContext';
import UserProfileHeader from './UserProfileHeader';

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
  
  &:hover {
    background: rgba(0, 255, 65, 0.1);
    color: #00FF41;
    transform: translateY(-2px);
    box-shadow: 0 0 15px rgba(0, 255, 65, 0.2);
    border-color: rgba(0, 255, 65, 0.8);
  }
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
  const { isConnected, address } = useWallet();

  // Admin wallet address
  const ADMIN_WALLET = '0x47d80671Bcb7Ec368ef4d3ca6E1C20173CCc9a28'
  const isAdmin = isConnected && address && address.toLowerCase() === ADMIN_WALLET.toLowerCase()

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <>
      <MenuOverlay isOpen={isOpen} onClick={onClose} />
      <MobileMenu isOpen={isOpen}>
        <MenuHeader>
          <MenuTitle>Menu</MenuTitle>
        </MenuHeader>
        
        <MenuItem to="/" onClick={onClose}>Home</MenuItem>
        <MenuItem to="/create" onClick={onClose}>Create Flip</MenuItem>
        {isAdmin && <MenuItem to="/admin" onClick={onClose}>Admin Panel</MenuItem>}

        
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
            <UserProfileHeader isInHeader={true} />
          </UserSection>
        )}
      </MobileMenu>
    </>,
    document.body
  );
};

export default PortalMenu; 