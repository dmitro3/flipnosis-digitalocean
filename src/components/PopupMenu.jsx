import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import styled from '@emotion/styled';
import { useWallet } from '../contexts/WalletContext';
import { 
  Home, 
  Plus, 
  User, 
  Info, 
  Coins, 
  ShoppingCart, 
  X,
  Menu,
  Trophy
} from 'lucide-react';
import FlipnosisInfoImg from '../../Images/Info/FLIPNOSIS.webp';
import MobileInfoImg from '../../Images/mobile.webp';

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
  display: flex;
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
  margin-bottom: 2rem;
  
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

const InfoModal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1200;
  backdrop-filter: blur(10px);
`;

const InfoModalContent = styled.div`
  background: rgba(0, 0, 0, 0.9);
  border: 1px solid rgba(255, 20, 147, 0.3);
  border-radius: 1rem;
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  overflow: hidden;
  position: relative;
  box-shadow: 0 0 30px rgba(255, 20, 147, 0.2);
`;

const InfoModalHeader = styled.div`
  background: linear-gradient(45deg, #FF1493, #FF69B4);
  padding: 1.5rem;
  border-radius: 1rem 1rem 0 0;
  position: relative;
`;

const InfoModalBody = styled.div`
  padding: 2rem;
  overflow-y: auto;
  max-height: calc(80vh - 120px);
  display: flex;
  justify-content: center;
  align-items: center;
`;

const PopupMenu = () => {
  const { isConnected, address } = useWallet();
  const [isOpen, setIsOpen] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleInfoClick = () => {
    setShowInfo(true);
    setIsOpen(false);
  };

  const handleInfoClose = () => {
    setShowInfo(false);
  };

  return (
    <>
      <MenuButton onClick={() => setIsOpen(true)}>
        <Menu size={20} />
      </MenuButton>
      
      {isOpen && (
        <Modal onClick={handleClose}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <h2 style={{ margin: 0, color: '#fff' }}>Menu</h2>
              <CloseButton onClick={handleClose}>
                <X size={24} />
              </CloseButton>
            </ModalHeader>
            
            <ModalBody>
              <MenuSection>
                <SectionTitle>Navigation</SectionTitle>
                <MenuItem to="/" onClick={handleClose}>
                  <Home size={20} />
                  Home
                </MenuItem>
                <MenuItem to="/create" onClick={handleClose}>
                  <Plus size={20} />
                  Create Flip
                </MenuItem>
                <MenuItem to="/leaderboard" onClick={handleClose}>
                  <Trophy size={20} />
                  Leaderboard
                </MenuItem>
                {isConnected && (
                  <MenuItem to={`/profile/${address}`} onClick={handleClose}>
                    <User size={20} />
                    Profile
                  </MenuItem>
                )}
                <MenuItem as="button" onClick={handleInfoClick} style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left' }}>
                  <Info size={20} />
                  About FLIPNOSIS
                </MenuItem>
              </MenuSection>

              <MenuSection>
                <SectionTitle>Features</SectionTitle>
                <ComingSoonItem>
                  <Coins size={20} />
                  Coin Creator
                  <ComingSoonBadge>Coming Soon</ComingSoonBadge>
                </ComingSoonItem>
                <ComingSoonItem>
                  <ShoppingCart size={20} />
                  Marketplace
                  <ComingSoonBadge>Coming Soon</ComingSoonBadge>
                </ComingSoonItem>
              </MenuSection>
            </ModalBody>
          </ModalContent>
        </Modal>
      )}

      {showInfo && (
        <InfoModal onClick={handleInfoClose}>
          <InfoModalContent onClick={(e) => e.stopPropagation()}>
            <InfoModalHeader>
              <h2 style={{ margin: 0, color: '#fff' }}>About FLIPNOSIS</h2>
              <CloseButton onClick={handleInfoClose}>
                <X size={24} />
              </CloseButton>
            </InfoModalHeader>
            <InfoModalBody>
              <img 
                src={window.innerWidth <= 768 ? MobileInfoImg : FlipnosisInfoImg} 
                alt="FLIPNOSIS Info" 
                style={{ 
                  maxWidth: '100%', 
                  height: 'auto',
                  borderRadius: '1rem',
                  objectFit: 'contain'
                }} 
              />
            </InfoModalBody>
          </InfoModalContent>
        </InfoModal>
      )}
    </>
  );
};

export default PopupMenu; 