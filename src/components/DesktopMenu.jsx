import React, { useState } from 'react';
import styled from '@emotion/styled';
import { Link } from 'react-router-dom';
import { useWallet } from '../contexts/WalletContext';
import { 
  User, Gamepad2, Plus, Store, Palette, Settings, 
  ExternalLink, ChevronDown, ChevronUp, Home, Crown, Trophy
} from 'lucide-react';

const MenuContainer = styled.div`
  position: relative;
  display: inline-block;
`;

const MenuButton = styled.button`
  background: linear-gradient(45deg, #FF1493, #FF69B4);
  border: none;
  border-radius: 0.75rem;
  padding: 0.75rem 1.5rem;
  color: #fff;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 0 20px rgba(255, 20, 147, 0.4);
  }
`;

const MenuDropdown = styled.div`
  position: absolute;
  top: 100%;
  right: 0;
  width: 280px;
  background: rgba(0, 0, 0, 0.95);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 20, 147, 0.3);
  border-radius: 1rem;
  padding: 1rem;
  margin-top: 0.5rem;
  z-index: 1000;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
  opacity: ${props => props.isOpen ? 1 : 0};
  visibility: ${props => props.isOpen ? 'visible' : 'hidden'};
  transform: translateY(${props => props.isOpen ? '0' : '-10px'});
  transition: all 0.3s ease;
`;

const MenuSection = styled.div`
  margin-bottom: 1rem;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const MenuSectionTitle = styled.div`
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 0.5rem;
  padding: 0 0.5rem;
`;

const MenuItem = styled(Link)`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  color: #fff;
  text-decoration: none;
  border-radius: 0.5rem;
  transition: all 0.3s ease;
  font-size: 0.9rem;

  &:hover {
    background: rgba(255, 20, 147, 0.1);
    color: #FF1493;
    transform: translateX(5px);
  }
`;

const MenuButtonItem = styled.button`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  color: #fff;
  background: none;
  border: none;
  border-radius: 0.5rem;
  transition: all 0.3s ease;
  font-size: 0.9rem;
  width: 100%;
  text-align: left;
  cursor: pointer;

  &:hover {
    background: rgba(255, 20, 147, 0.1);
    color: #FF1493;
    transform: translateX(5px);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    
    &:hover {
      background: none;
      color: #fff;
      transform: none;
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

const Divider = styled.div`
  height: 1px;
  background: rgba(255, 255, 255, 0.1);
  margin: 0.5rem 0;
`;

const DesktopMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { address, isConnected } = useWallet();

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const closeMenu = () => {
    setIsOpen(false);
  };

  return (
    <MenuContainer>
      <MenuButton onClick={toggleMenu}>
        Menu
        {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </MenuButton>

      <MenuDropdown isOpen={isOpen}>
        <MenuSection>
          <MenuSectionTitle>Navigation</MenuSectionTitle>
          <MenuItem to="/" onClick={closeMenu}>
            <Home size={16} />
            Home
          </MenuItem>
          <MenuItem to="/create" onClick={closeMenu}>
            <Plus size={16} />
            Create Flip
          </MenuItem>
          <MenuItem to="/leaderboard" onClick={closeMenu}>
            <Trophy size={16} />
            Leaderboard
          </MenuItem>
          {isConnected && (
            <MenuItem to="/profile" onClick={closeMenu}>
              <User size={16} />
              My Profile
            </MenuItem>
          )}
        </MenuSection>

        <Divider />

        <MenuSection>
          <MenuSectionTitle>Features</MenuSectionTitle>
          <MenuButtonItem disabled>
            <Palette size={16} />
            Coin Creator
            <ComingSoonBadge>Coming Soon</ComingSoonBadge>
          </MenuButtonItem>
          <MenuButtonItem disabled>
            <Store size={16} />
            Marketplace
            <ComingSoonBadge>Coming Soon</ComingSoonBadge>
          </MenuButtonItem>
        </MenuSection>

        <Divider />

        <MenuSection>
          <MenuSectionTitle>Account</MenuSectionTitle>
          {isConnected ? (
            <>
              <MenuItem to="/profile" onClick={closeMenu}>
                <User size={16} />
                Profile Settings
              </MenuItem>
              <MenuItem to="/profile" onClick={closeMenu}>
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
        </MenuSection>
      </MenuDropdown>
    </MenuContainer>
  );
};

export default DesktopMenu; 