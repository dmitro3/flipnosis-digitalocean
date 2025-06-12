import React, { useState, useEffect } from 'react';
import { useWallet } from '../contexts/WalletContext';
import { useProfile } from '../contexts/ProfileContext';
import { useToast } from '../contexts/ToastContext';
import styled from '@emotion/styled';
import ProfilePicture from './ProfilePicture';

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

const UserAddress = styled.div`
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.8rem;
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
  max-width: 400px;
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
  const { getPlayerName, setPlayerName, getProfilePicture, setProfilePicture } = useProfile();
  const { showSuccess, showError } = useToast();
  const [showModal, setShowModal] = useState(false);
  const [playerName, setPlayerNameState] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadUserData = async () => {
      if (!address) return;
      
      try {
        setIsLoading(true);
        const name = await getPlayerName(address);
        setPlayerNameState(name || '');
      } catch (error) {
        console.error('Error loading user data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserData();
  }, [address, getPlayerName]);

  const handleSave = async () => {
    if (!address) return;

    try {
      await setPlayerName(address, playerName);
      showSuccess('Profile updated successfully!');
      setShowModal(false);
    } catch (error) {
      console.error('Error saving profile:', error);
      showError('Failed to update profile');
    }
  };

  if (!address) return null;

  const Container = isInHeader ? HeaderContainer : FloatingHeaderContainer;

  return (
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
              {isLoading ? '...' : (playerName || `${address.slice(0, 6)}...${address.slice(-4)}`)}
            </UserName>
            <UserAddress>
              {address.slice(0, 6)}...{address.slice(-4)}
            </UserAddress>
          </UserInfo>
        </ProfileSection>
      </Container>

      {showModal && (
        <Modal>
          <ModalContent>
            <CloseButton onClick={() => setShowModal(false)}>×</CloseButton>
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
          </ModalContent>
        </Modal>
      )}
    </>
  );
};

export default UserProfileHeader; 