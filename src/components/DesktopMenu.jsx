import React, { useState } from 'react';
import styled from '@emotion/styled';
import { Link } from 'react-router-dom';
import { useWallet } from '../contexts/WalletContext';
import { 
  User, Gamepad2, Plus, Store, Palette, Settings, 
  ExternalLink, X, Menu, Home, Crown, Trophy, Info
} from 'lucide-react';

const MenuContainer = styled.div`
  position: relative;
  display: inline-block;
`;

const MenuButton = styled.button`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #ffffff;
  padding: 0.75rem;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: #00FF41;
  }

  @media (max-width: 768px) {
    display: none;
  }
`;

const Modal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  display: ${props => props.isOpen ? 'flex' : 'none'};
  align-items: center;
  justify-content: center;
  z-index: 1100;
  backdrop-filter: blur(10px);
`;

const ModalContent = styled.div`
  background: rgba(0, 0, 0, 0.9);
  border: 1px solid rgba(255, 20, 147, 0.3);
  border-radius: 1rem;
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  overflow: hidden;
  position: relative;
  box-shadow: 0 0 30px rgba(255, 20, 147, 0.2);
`;

const ModalHeader = styled.div`
  background: linear-gradient(45deg, #FF1493, #FF69B4);
  padding: 1.5rem;
  border-radius: 1rem 1rem 0 0;
  position: relative;
`;

const CloseButton = styled.button`
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.8);
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0.5rem;
  transition: all 0.3s ease;

  &:hover {
    color: #fff;
    transform: scale(1.1);
  }
`;

const ModalBody = styled.div`
  padding: 2rem;
  overflow-y: auto;
  max-height: calc(80vh - 120px);
`;

const MenuSection = styled.div`
  margin-bottom: 1rem;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const SectionTitle = styled.h3`
  color: #FF1493;
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 1rem;
  text-transform: uppercase;
  letter-spacing: 1px;
`;

const MenuItem = styled(Link)`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  color: #ffffff;
  text-decoration: none;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.5rem;
  margin-bottom: 0.5rem;
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(0, 255, 65, 0.1);
    border-color: rgba(0, 255, 65, 0.3);
    color: #00FF41;
    transform: translateY(-2px);
  }
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const ComingSoonItem = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  color: rgba(255, 255, 255, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.5rem;
  margin-bottom: 0.5rem;
  cursor: not-allowed;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const ComingSoonBadge = styled.span`
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.5);
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 600;
  margin-left: auto;
`;

const MenuButtonItem = styled.button`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  color: #ffffff;
  text-decoration: none;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.5rem;
  margin-bottom: 0.5rem;
  transition: all 0.3s ease;
  background: none;
  cursor: pointer;
  width: 100%;
  text-align: left;
  
  &:hover {
    background: rgba(0, 255, 65, 0.1);
    border-color: rgba(0, 255, 65, 0.3);
    color: #00FF41;
    transform: translateY(-2px);
  }
  
  &:last-child {
    margin-bottom: 0;
  }
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
        <Menu size={20} />
      </MenuButton>
      
      {isOpen && (
        <Modal isOpen={isOpen} onClick={closeMenu}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <h2 style={{ margin: 0, color: '#fff' }}>Menu</h2>
              <CloseButton onClick={closeMenu}>
                <X size={24} />
              </CloseButton>
            </ModalHeader>
            
            <ModalBody>
              <MenuSection>
                <SectionTitle>Navigation</SectionTitle>
                <MenuItem to="/" onClick={closeMenu}>
                  <Home size={20} />
                  Home
                </MenuItem>
                <MenuItem to="/create-battle" onClick={closeMenu}>
                  <Plus size={20} />
                  Create Flip
                </MenuItem>
                {isConnected && (
                  <MenuItem to="/profile" onClick={closeMenu}>
                    <User size={20} />
                    My Profile
                  </MenuItem>
                )}
                <MenuButtonItem onClick={() => {
                  alert('About FLIPNOSIS\n\nFLIPNOSIS is a revolutionary NFT flipping game where players can create and participate in coin flip games with their NFTs and cryptocurrency.');
                  closeMenu();
                }}>
                  <Info size={20} />
                  About FLIPNOSIS
                </MenuButtonItem>
              </MenuSection>

              <MenuSection>
                <SectionTitle>Features</SectionTitle>
                <ComingSoonItem>
                  <Palette size={20} />
                  Coin Minter
                  <ComingSoonBadge>Coming Soon</ComingSoonBadge>
                </ComingSoonItem>
                <ComingSoonItem>
                  <Store size={20} />
                  Marketplace
                  <ComingSoonBadge>Coming Soon</ComingSoonBadge>
                </ComingSoonItem>
                <ComingSoonItem>
                  <Trophy size={20} />
                  Leaderboard
                  <ComingSoonBadge>Coming Soon</ComingSoonBadge>
                </ComingSoonItem>
              </MenuSection>
            </ModalBody>
          </ModalContent>
        </Modal>
      )}
    </MenuContainer>
  );
};

export default DesktopMenu; 