import React, { useState, useEffect } from 'react';
import { useWallet } from '../contexts/WalletContext';
import { useProfile } from '../contexts/ProfileContext';
import { useToast } from '../contexts/ToastContext';
import styled from '@emotion/styled';
import { ThemeProvider } from '@emotion/react';
import ProfilePicture from './ProfilePicture';
import CoinImageCustomizer from './CoinImageCustomizer';
import { theme } from '../styles/theme';
import { createSafeTheme } from '../utils/styledComponentsHelper';

const HeaderContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  z-index: 100;
`;

const FloatingHeaderContainer = styled.div`
  position: fixed;
  top: 1rem;
  right: 1rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  z-index: 1000;
`;

const ProfileSection = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: rgba(0, 0, 0, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 1rem;
  padding: 0.5rem 1rem;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(0, 0, 0, 0.8);
    border-color: rgba(255, 20, 147, 0.3);
    box-shadow: 0 0 15px rgba(255, 20, 147, 0.2);
  }
`;

const UserInfo = styled.div`
  display: flex;
  flex-direction: column;
`;

const UserName = styled.div`
  color: #fff;
  font-weight: bold;
  font-size: 0.9rem;
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
`;

const ModalContent = styled.div`
  background: rgba(0, 0, 0, 0.9);
  border: 1px solid rgba(255, 20, 147, 0.3);
  border-radius: 1rem;
  padding: 2rem;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
`;

const CloseButton = styled.button`
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.6);
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0.5rem;

  &:hover {
    color: #fff;
  }
`;

const TabContainer = styled.div`
  display: flex;
  margin-bottom: 2rem;
  border-bottom: 2px solid rgba(255, 20, 147, 0.3);
`;

const TabButton = styled.button`
  flex: 1;
  padding: 1rem;
  background: ${props => props.active ? 'rgba(255, 20, 147, 0.2)' : 'transparent'};
  border: none;
  color: ${props => props.active ? '#FF1493' : '#fff'};
  font-size: 1.1rem;
  font-weight: ${props => props.active ? 'bold' : 'normal'};
  cursor: pointer;
  transition: all 0.3s ease;
  border-bottom: ${props => props.active ? '2px solid #FF1493' : 'none'};
  margin-bottom: -2px;

  &:hover {
    background: rgba(255, 20, 147, 0.1);
  }
`;

const Input = styled.input`
  width: 100%;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 0.5rem;
  padding: 0.75rem;
  color: #fff;
  font-size: 1rem;
  margin-bottom: 1rem;

  &:focus {
    outline: none;
    border-color: rgba(255, 20, 147, 0.5);
    box-shadow: 0 0 10px rgba(255, 20, 147, 0.2);
  }
`;

const SaveButton = styled.button`
  width: 100%;
  background: linear-gradient(45deg, #FF1493, #FF69B4);
  border: none;
  border-radius: 0.5rem;
  padding: 0.75rem;
  color: #fff;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    transform: scale(1.02);
    box-shadow: 0 0 15px rgba(255, 20, 147, 0.4);
  }
`;

const UserProfileHeader = ({ isInHeader = false }) => {
  const { address } = useWallet();
  const { 
    getPlayerName, 
    setPlayerName, 
    getProfilePicture, 
    setProfilePicture,
    getCoinHeadsImage,
    setCoinHeadsImage,
    getCoinTailsImage,
    setCoinTailsImage
  } = useProfile();
  const { showSuccess, showError } = useToast();
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [playerName, setPlayerNameState] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [currentHeadsImage, setCurrentHeadsImage] = useState(null);
  const [currentTailsImage, setCurrentTailsImage] = useState(null);

  useEffect(() => {
    const loadUserData = async () => {
      if (!address) return;
      
      try {
        setIsLoading(true);
        const name = await getPlayerName(address);
        const headsImage = await getCoinHeadsImage(address);
        const tailsImage = await getCoinTailsImage(address);
        
        setPlayerNameState(name || '');
        setCurrentHeadsImage(headsImage);
        setCurrentTailsImage(tailsImage);
      } catch (error) {
        console.error('Error loading user data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserData();
  }, [address, getPlayerName, getCoinHeadsImage, getCoinTailsImage]);

  const handleSave = async () => {
    if (!address) return;

    try {
      await setPlayerName(address, playerName);
      showSuccess('Profile updated successfully!');
    } catch (error) {
      console.error('Error saving profile:', error);
      showError('Failed to update profile');
    }
  };

  const handleHeadsImageChange = async (imageUrl) => {
    if (!address) return;
    
    try {
      await setCoinHeadsImage(address, imageUrl);
      setCurrentHeadsImage(imageUrl);
      showSuccess('Heads image updated!');
    } catch (error) {
      console.error('Error saving heads image:', error);
      showError('Failed to save heads image');
    }
  };

  const handleTailsImageChange = async (imageUrl) => {
    if (!address) return;
    
    try {
      await setCoinTailsImage(address, imageUrl);
      setCurrentTailsImage(imageUrl);
      showSuccess('Tails image updated!');
    } catch (error) {
      console.error('Error saving tails image:', error);
      showError('Failed to save tails image');
    }
  };

  if (!address) return null;

  const Container = isInHeader ? HeaderContainer : FloatingHeaderContainer;

  return (
    <ThemeProvider theme={createSafeTheme(theme)}>
      <>
        <Container>
          <ProfileSection onClick={() => setShowModal(true)}>
            <ProfilePicture 
              address={address}
              size={40}
              isClickable={false}
              style={{
                borderRadius: '12px',
                border: '2px solid rgba(255, 20, 147, 0.5)'
              }}
            />
            <UserInfo>
              <UserName>
                {isLoading ? '...' : (playerName || 'Anonymous')}
              </UserName>
            </UserInfo>
          </ProfileSection>
        </Container>

        {showModal && (
          <Modal>
            <ModalContent>
              <CloseButton onClick={() => setShowModal(false)}>×</CloseButton>
              
              <TabContainer>
                <TabButton 
                  active={activeTab === 'profile'} 
                  onClick={() => setActiveTab('profile')}
                >
                  Profile
                </TabButton>
                <TabButton 
                  active={activeTab === 'coin'} 
                  onClick={() => setActiveTab('coin')}
                >
                  Customize Coin
                </TabButton>
              </TabContainer>

              {activeTab === 'profile' ? (
                <div>
                  <h2 style={{ color: '#fff', marginBottom: '1.5rem' }}>Edit Profile</h2>
                  
                  <div style={{ marginBottom: '1.5rem' }}>
                    <ProfilePicture 
                      address={address}
                      size={100}
                      isClickable={true}
                      showUploadIcon={true}
                      style={{
                        borderRadius: '12px',
                        border: '2px solid rgba(255, 20, 147, 0.5)'
                      }}
                    />
                  </div>

                  <Input
                    type="text"
                    placeholder="Enter your name"
                    value={playerName}
                    onChange={(e) => setPlayerNameState(e.target.value)}
                  />

                  <SaveButton onClick={handleSave}>
                    Save Profile
                  </SaveButton>
                </div>
              ) : (
                <div>
                  <CoinImageCustomizer
                    onHeadsImageChange={handleHeadsImageChange}
                    onTailsImageChange={handleTailsImageChange}
                    currentHeadsImage={currentHeadsImage}
                    currentTailsImage={currentTailsImage}
                  />
                </div>
              )}
            </ModalContent>
          </Modal>
        )}
      </>
    </ThemeProvider>
  );
};

export default UserProfileHeader; 