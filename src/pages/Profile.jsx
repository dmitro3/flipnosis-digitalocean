import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useWallet } from '../contexts/WalletContext';
import { useToast } from '../contexts/ToastContext';
import styled from '@emotion/styled';
import {
  User, Gamepad2, Trophy, TrendingUp, Image, Coins, Clock, AlertCircle,
  ExternalLink, Copy, CheckCircle, X, Bell, BellOff, Settings, Zap,
  Edit, Save, Upload, LogOut, Twitter, MessageCircle, Wallet,
  Award, Target, Users, Calendar, DollarSign, Shield, Star
} from 'lucide-react';
import contractService from '../services/ContractService';

// Styled Components
const ProfileContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  min-height: calc(100vh - 120px);
`;

const ProfileHeader = styled.div`
  background: linear-gradient(135deg, rgba(0, 191, 255, 0.1), rgba(30, 144, 255, 0.1));
  border: 1px solid rgba(0, 191, 255, 0.3);
  border-radius: 1.5rem;
  padding: 2rem;
  margin-bottom: 2rem;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(45deg, transparent 30%, rgba(0, 191, 255, 0.05) 50%, transparent 70%);
    animation: shimmer 3s infinite;
  }

  @keyframes shimmer {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
  }
`;

const ProfileInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 2rem;
  position: relative;
  z-index: 1;

  @media (max-width: 768px) {
    flex-direction: column;
    text-align: center;
  }
`;

const AvatarSection = styled.div`
  position: relative;
  cursor: pointer;
`;

const Avatar = styled.img`
  width: 8rem;
  height: 8rem;
  border-radius: 50%;
  border: 4px solid rgba(0, 191, 255, 0.5);
  object-fit: cover;
  transition: all 0.3s ease;

  &:hover {
    border-color: rgba(0, 191, 255, 0.8);
    transform: scale(1.05);
  }
`;

const AvatarPlaceholder = styled.div`
  width: 8rem;
  height: 8rem;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  border: 4px solid rgba(0, 191, 255, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;

  &:hover {
    border-color: rgba(0, 191, 255, 0.8);
    background: rgba(255, 255, 255, 0.2);
  }
`;

const UserDetails = styled.div`
  flex: 1;
`;

const NameInput = styled.input`
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(0, 191, 255, 0.5);
  border-radius: 0.5rem;
  padding: 0.75rem 1rem;
  color: #fff;
  font-size: 1.5rem;
  font-weight: bold;
  width: 100%;
  max-width: 300px;
  margin-bottom: 0.5rem;

  &:focus {
    outline: none;
    border-color: rgba(0, 191, 255, 0.8);
    box-shadow: 0 0 15px rgba(0, 191, 255, 0.3);
  }
`;

const SaveButton = styled.button`
  background: linear-gradient(45deg, #00FF41, #39FF14);
  border: none;
  border-radius: 0.5rem;
  padding: 0.5rem 1rem;
  color: #000;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-left: 0.5rem;

  &:hover {
    transform: scale(1.05);
    box-shadow: 0 0 15px rgba(0, 255, 65, 0.4);
  }

  &:disabled {
    background: rgba(255, 255, 255, 0.2);
    color: rgba(255, 255, 255, 0.5);
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;

const AddressDisplay = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
`;

const AddressCode = styled.code`
  color: rgba(255, 255, 255, 0.7);
  background: rgba(255, 255, 255, 0.1);
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  font-family: monospace;
  font-size: 0.9rem;
`;

const CopyButton = styled.button`
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  padding: 0.5rem;
  transition: all 0.3s ease;

  &:hover {
    color: #fff;
    transform: scale(1.1);
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`;

const StatCard = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(0, 191, 255, 0.2);
  border-radius: 1rem;
  padding: 1.5rem;
  transition: all 0.3s ease;
  text-align: center;

  &:hover {
    border-color: rgba(0, 191, 255, 0.4);
    box-shadow: 0 0 20px rgba(0, 191, 255, 0.2);
    transform: translateY(-2px);
  }
`;

const StatIcon = styled.div`
  color: #00BFFF;
  margin-bottom: 0.5rem;
`;

const StatValue = styled.div`
  color: #fff;
  font-size: 2rem;
  font-weight: bold;
  margin-bottom: 0.25rem;
`;

const StatLabel = styled.div`
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.9rem;
`;

const TabContainer = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  border-bottom: 2px solid rgba(255, 255, 255, 0.1);
  overflow-x: auto;
`;

const TabButton = styled.button`
  background: ${props => props.active ? 'rgba(0, 191, 255, 0.2)' : 'transparent'};
  border: none;
  color: ${props => props.active ? '#fff' : 'rgba(255, 255, 255, 0.7)'};
  font-size: 1rem;
  font-weight: ${props => props.active ? 'bold' : 'normal'};
  cursor: pointer;
  padding: 1rem 1.5rem;
  transition: all 0.3s ease;
  border-bottom: ${props => props.active ? '2px solid #00BFFF' : 'none'};
  white-space: nowrap;

  &:hover {
    background: rgba(0, 191, 255, 0.1);
  }
`;

const TabContent = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(0, 191, 255, 0.2);
  border-radius: 1rem;
  padding: 2rem;
  min-height: 400px;
`;

const CoinImagesGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  margin-bottom: 2rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const CoinImageCard = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(0, 191, 255, 0.2);
  border-radius: 1rem;
  padding: 1.5rem;
  transition: all 0.3s ease;

  &:hover {
    border-color: rgba(0, 191, 255, 0.4);
    box-shadow: 0 0 20px rgba(0, 191, 255, 0.2);
  }
`;

const CoinImage = styled.img`
  width: 100%;
  height: 12rem;
  object-fit: cover;
  border-radius: 0.5rem;
  border: 2px solid rgba(0, 191, 255, 0.3);
  aspect-ratio: 1;
  transition: all 0.3s ease;

  &:hover {
    border-color: rgba(0, 191, 255, 0.8);
    transform: scale(1.02);
  }
`;

const CoinImagePlaceholder = styled.div`
  width: 100%;
  height: 12rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid rgba(0, 191, 255, 0.3);
  color: rgba(255, 255, 255, 0.5);
  aspect-ratio: 1;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.2);
    border-color: rgba(0, 191, 255, 0.8);
  }
`;

const GameCard = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(0, 191, 255, 0.2);
  border-radius: 1rem;
  padding: 1.5rem;
  margin-bottom: 1rem;
  transition: all 0.3s ease;

  &:hover {
    border-color: rgba(0, 191, 255, 0.4);
    box-shadow: 0 0 20px rgba(0, 191, 255, 0.2);
    transform: translateY(-2px);
  }
`;

const GameHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
`;

const GameInfo = styled.div`
  flex: 1;
`;

const GameActions = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const ActionButton = styled.button`
  background: ${props => props.variant === 'danger' ? 'linear-gradient(45deg, #FF4444, #CC0000)' : 'linear-gradient(45deg, #00BFFF, #1E90FF)'};
  border: none;
  border-radius: 0.5rem;
  padding: 0.5rem 1rem;
  color: #fff;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  &:hover {
    transform: scale(1.05);
    box-shadow: 0 0 15px ${props => props.variant === 'danger' ? 'rgba(255, 68, 68, 0.4)' : 'rgba(0, 191, 255, 0.4)'};
  }
`;

const StatusBadge = styled.span`
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.8rem;
  font-weight: bold;
  background: ${props => {
    switch (props.status) {
      case 0: return 'rgba(255, 193, 7, 0.2)'
      case 1: return 'rgba(33, 150, 243, 0.2)'
      case 2: return 'rgba(76, 175, 80, 0.2)'
      case 3: return 'rgba(156, 39, 176, 0.2)'
      case 4: return 'rgba(158, 158, 158, 0.2)'
      case 5: return 'rgba(244, 67, 54, 0.2)'
      default: return 'rgba(158, 158, 158, 0.2)'
    }
  }};
  color: ${props => {
    switch (props.status) {
      case 0: return '#FFC107'
      case 1: return '#2196F3'
      case 2: return '#4CAF50'
      case 3: return '#9C27B0'
      case 4: return '#9E9E9E'
      case 5: return '#F44336'
      default: return '#9E9E9E'
    }
  }};
  border: 1px solid ${props => {
    switch (props.status) {
      case 0: return 'rgba(255, 193, 7, 0.3)'
      case 1: return 'rgba(33, 150, 243, 0.3)'
      case 2: return 'rgba(76, 175, 80, 0.3)'
      case 3: return 'rgba(156, 39, 176, 0.3)'
      case 4: return 'rgba(158, 158, 158, 0.3)'
      case 5: return 'rgba(244, 67, 54, 0.3)'
      default: return 'rgba(158, 158, 158, 0.3)'
    }
  }};
`;

const SocialLinksSection = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
`;

const SocialInput = styled.input`
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(0, 191, 255, 0.3);
  border-radius: 0.5rem;
  padding: 0.75rem 1rem;
  color: #fff;
  font-size: 0.9rem;
  width: 100%;

  &:focus {
    outline: none;
    border-color: rgba(0, 191, 255, 0.8);
    box-shadow: 0 0 15px rgba(0, 191, 255, 0.3);
  }
`;

const SocialInputContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const WalletSection = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(0, 191, 255, 0.2);
  border-radius: 1rem;
  padding: 1.5rem;
  margin-bottom: 2rem;
`;

const DisconnectButton = styled.button`
  background: linear-gradient(45deg, #FF4444, #CC0000);
  border: none;
  border-radius: 0.5rem;
  padding: 0.75rem 1.5rem;
  color: #fff;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  &:hover {
    transform: scale(1.05);
    box-shadow: 0 0 15px rgba(255, 68, 68, 0.4);
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 3rem;
  color: rgba(255, 255, 255, 0.7);
`;

const LoadingSpinner = styled.div`
  display: inline-block;
  width: 2rem;
  height: 2rem;
  border: 3px solid rgba(0, 191, 255, 0.3);
  border-radius: 50%;
  border-top-color: #00BFFF;
  animation: spin 1s ease-in-out infinite;

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

const Profile = () => {
  const { address: profileAddress } = useParams();
  const navigate = useNavigate();
  const { address, isConnected, disconnect } = useWallet();
  const { showSuccess, showError, showInfo } = useToast();
  
  const [profileData, setProfileData] = useState({
    name: '',
    avatar: '',
    headsImage: '',
    tailsImage: '',
    twitter: '',
    telegram: '',
    xp: 0,
    stats: {
      totalGames: 0,
      gamesWon: 0,
      gamesLost: 0,
      winRate: 0,
      totalVolume: 0,
    }
  });
  
  const [activeGames, setActiveGames] = useState([]);
  const [offers, setOffers] = useState([]);
  const [winnings, setWinnings] = useState([]);
  const [claimables, setClaimables] = useState({ creator: [], winner: [] });
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [tempName, setTempName] = useState('');
  const [tempTwitter, setTempTwitter] = useState('');
  const [tempTelegram, setTempTelegram] = useState('');
  const [savingName, setSavingName] = useState(false);
  const [savingTwitter, setSavingTwitter] = useState(false);
  const [savingTelegram, setSavingTelegram] = useState(false);
  const [savingHeads, setSavingHeads] = useState(false);
  const [savingTails, setSavingTails] = useState(false);

  // Use profile address from URL or current user's address
  const targetAddress = profileAddress || address;

  // Load profile data
  const loadProfileData = async () => {
    if (!targetAddress) return;

    setLoading(true);
    try {
      // Load profile data from database
      const response = await fetch(`/api/profile/${targetAddress}`);
      if (response.ok) {
        const data = await response.json();
        setProfileData(prev => ({
          ...prev,
          ...data,
          name: data.name || '',
          avatar: data.avatar || '',
          headsImage: data.headsImage || '',
          tailsImage: data.tailsImage || '',
          twitter: data.twitter || '',
          telegram: data.telegram || '',
          xp: data.xp || 0,
          xp_name_earned: data.xp_name_earned || false,
          xp_avatar_earned: data.xp_avatar_earned || false,
          xp_twitter_earned: data.xp_twitter_earned || false,
          xp_telegram_earned: data.xp_telegram_earned || false,
          xp_heads_earned: data.xp_heads_earned || false,
          xp_tails_earned: data.xp_tails_earned || false
        }));
        setTempName(data.name || '');
        setTempTwitter(data.twitter || '');
        setTempTelegram(data.telegram || '');
      }
    } catch (error) {
      console.error('Failed to load profile data:', error);
    }

    try {
      // Load user's games
      const gamesResponse = await fetch(`/api/users/${targetAddress}/games`);
      if (gamesResponse.ok) {
        const games = await gamesResponse.json();
        setActiveGames(games || []);
      }
    } catch (error) {
      console.error('Failed to load user games:', error);
    }

    try {
      // Load user's offers
      const offersResponse = await fetch(`/api/users/${targetAddress}/offers`);
      if (offersResponse.ok) {
        const offersData = await offersResponse.json();
        setOffers(offersData || []);
      }
    } catch (error) {
      console.error('Failed to load user offers:', error);
    }

    try {
      // Load user's winnings (completed games where user is the winner)
      const winningsResponse = await fetch(`/api/users/${targetAddress}/winnings`);
      if (winningsResponse.ok) {
        const winningsData = await winningsResponse.json();
        setWinnings(winningsData || []);
      } else {
        // Fallback: filter from games where user is winner
        const allGamesResponse = await fetch(`/api/users/${targetAddress}/games`);
        if (allGamesResponse.ok) {
          const allGames = await allGamesResponse.json();
          const userWinnings = allGames.filter(game => 
            game.status === 'completed' && 
            game.winner && 
            game.winner.toLowerCase() === targetAddress.toLowerCase()
          );
          setWinnings(userWinnings);
        }
      }
    } catch (error) {
      console.error('Failed to load user winnings:', error);
    }

    setLoading(false);
  };

  useEffect(() => {
    loadProfileData();
  }, [targetAddress]);

  useEffect(() => {
    const loadClaimables = async () => {
      if (!targetAddress || activeTab !== 'assets') return;
      try {
        const resp = await fetch(`/api/users/${targetAddress}/claimables`)
        if (resp.ok) {
          const data = await resp.json()
          setClaimables({ creator: data.creator || [], winner: data.winner || [] })
        }
      } catch (e) {
        console.error('Failed to load claimables:', e)
      }
    }
    loadClaimables()
  }, [targetAddress, activeTab])

  // Copy address
  const copyAddress = () => {
    navigator.clipboard.writeText(targetAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Format address
  const formatAddress = (addr) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  // Handle image upload
  const handleImageUpload = async (type, file) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const imageData = e.target.result;
      
      // Update UI immediately
      setProfileData(prev => ({
        ...prev,
        [type === 'avatar' ? 'avatar' : type === 'heads' ? 'headsImage' : 'tailsImage']: imageData
      }));
      
      // Save to database using the new save system
      await saveProfileData(type, imageData);
    };
    reader.readAsDataURL(file);
  };

  // Save profile data
  const saveProfileData = async (field, value) => {
    const setSavingState = (state) => {
      switch (field) {
        case 'name': setSavingName(state); break;
        case 'twitter': setSavingTwitter(state); break;
        case 'telegram': setSavingTelegram(state); break;
        case 'heads': setSavingHeads(state); break;
        case 'tails': setSavingTails(state); break;
      }
    };

    setSavingState(true);
    try {
      const response = await fetch(`/api/profile/${targetAddress}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: field === 'name' ? value : profileData.name,
          avatar: profileData.avatar,
          headsImage: field === 'heads' ? value : profileData.headsImage,
          tailsImage: field === 'tails' ? value : profileData.tailsImage,
          twitter: field === 'twitter' ? value : profileData.twitter,
          telegram: field === 'telegram' ? value : profileData.telegram
        })
      });

      if (response.ok) {
        const result = await response.json();
        setProfileData(prev => ({
          ...prev,
          [field === 'name' ? 'name' : field === 'heads' ? 'headsImage' : field === 'tails' ? 'tailsImage' : field]: value,
          xp: result.totalXP || prev.xp,
          [`xp_${field === 'heads' ? 'heads' : field === 'tails' ? 'tails' : field}_earned`]: result.xpGained > 0 ? true : prev[`xp_${field === 'heads' ? 'heads' : field === 'tails' ? 'tails' : field}_earned`]
        }));
        
        if (result.xpGained && result.xpGained > 0) {
          showSuccess(`${field} updated! +${result.xpGained} XP earned!`);
        } else {
          showSuccess(`${field} updated!`);
        }
      } else {
        showError('Failed to save profile');
      }
    } catch (error) {
      console.error('Failed to save profile data:', error);
      showError('Failed to save profile');
    } finally {
      setSavingState(false);
    }
  };

  // Cancel game
  const cancelGame = async (gameId) => {
    try {
      await contractService.cancelGame(gameId);
      showSuccess('Game cancelled!');
      loadProfileData();
    } catch (error) {
      console.error('Failed to cancel game:', error);
      showError('Failed to cancel game');
    }
  };

  // Accept offer
  const acceptOffer = async (offerId) => {
    try {
      const response = await fetch(`/api/offers/${offerId}/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ address: targetAddress })
      });

      if (response.ok) {
        const result = await response.json();
        showSuccess('Offer accepted!');
        if (result.gameId) {
          window.location.href = `/test-tubes.html?gameId=${result.gameId}`
        }
        loadProfileData();
      } else {
        showError('Failed to accept offer');
      }
    } catch (error) {
      console.error('Failed to accept offer:', error);
      showError('Failed to accept offer');
    }
  };

  // Withdraw winnings
  const withdrawWinnings = async (gameId) => {
    try {
      showInfo('Processing withdrawal...');
      const result = await contractService.withdrawWinnings(gameId);
      
      if (result.success) {
        showSuccess(`Withdrawal successful! Transaction: ${result.transactionHash?.slice(0, 10)}...`);
        // Update the winnings list to mark as withdrawn
        setWinnings(prev => prev.map(game => 
          game.id === gameId 
            ? { ...game, withdrawalStatus: 'withdrawn', withdrawalTx: result.transactionHash }
            : game
        ));
      } else {
        throw new Error(result.error || 'Withdrawal failed');
      }
    } catch (error) {
      console.error('Failed to withdraw winnings:', error);
      showError(`Withdrawal failed: ${error.message}`);
    }
  };

  // Get game status text
  const getGameStatusText = (state) => {
    switch (state) {
      case 0: return 'Waiting for Player';
      case 1: return 'Player Joined';
      case 2: return 'In Progress';
      case 3: return 'Completed';
      case 4: return 'Expired';
      case 5: return 'Cancelled';
      default: return 'Unknown';
    }
  };

  if (!targetAddress) {
    return (
      <ProfileContainer>
        <EmptyState>
          <h2>No Profile Found</h2>
          <p>Please connect your wallet to view your profile.</p>
        </EmptyState>
      </ProfileContainer>
    );
  }

  return (
    <ProfileContainer>
      {/* Profile Header */}
      <ProfileHeader>
        <ProfileInfo>
          <AvatarSection
            onClick={() => {
              const input = document.createElement('input');
              input.type = 'file';
              input.accept = 'image/*';
              input.onchange = (e) => {
                if (e.target.files[0]) {
                  handleImageUpload('avatar', e.target.files[0]);
                }
              };
              input.click();
            }}
          >
            {profileData.avatar ? (
              <Avatar src={profileData.avatar} alt="Profile" />
            ) : (
              <AvatarPlaceholder>
                <User style={{ width: '3rem', height: '3rem', color: '#00BFFF' }} />
              </AvatarPlaceholder>
            )}
          </AvatarSection>
          
          <UserDetails>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <NameInput
                value={tempName}
                onChange={(e) => {
                  const newName = e.target.value;
                  setTempName(newName);
                }}
                placeholder="Enter your nickname"
              />
              <SaveButton 
                onClick={() => saveProfileData('name', tempName)}
                disabled={savingName || tempName === profileData.name}
              >
                {savingName ? 'Saving...' : 'Save'}
              </SaveButton>
            </div>
            
            <AddressDisplay>
              <AddressCode>{formatAddress(targetAddress)}</AddressCode>
              <CopyButton onClick={copyAddress}>
                {copied ? <CheckCircle style={{ width: '1rem', height: '1rem', color: '#4CAF50' }} /> : <Copy style={{ width: '1rem', height: '1rem' }} />}
              </CopyButton>
            </AddressDisplay>

            {/* Wallet Connection Status */}
            {targetAddress === address && (
              <WalletSection>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                  <Wallet style={{ width: '1rem', height: '1rem', color: '#4CAF50' }} />
                  <span style={{ color: '#4CAF50', fontWeight: 'bold' }}>Wallet Connected</span>
                </div>
                        <DisconnectButton onClick={disconnect}>
          <LogOut style={{ width: '1rem', height: '1rem' }} />
          Disconnect Wallet
        </DisconnectButton>
              </WalletSection>
            )}
          </UserDetails>
        </ProfileInfo>
      </ProfileHeader>

      {/* Stats Grid */}
      <StatsGrid>
        <StatCard>
          <StatIcon><Trophy style={{ width: '2rem', height: '2rem' }} /></StatIcon>
          <StatValue>{profileData.stats.gamesWon}</StatValue>
          <StatLabel>Games Won</StatLabel>
        </StatCard>
        <StatCard>
          <StatIcon><Target style={{ width: '2rem', height: '2rem' }} /></StatIcon>
          <StatValue>{profileData.stats.gamesLost}</StatValue>
          <StatLabel>Games Lost</StatLabel>
        </StatCard>
        <StatCard>
          <StatIcon><TrendingUp style={{ width: '2rem', height: '2rem' }} /></StatIcon>
          <StatValue>{profileData.stats.winRate}%</StatValue>
          <StatLabel>Win Rate</StatLabel>
        </StatCard>
        <StatCard>
          <StatIcon><Gamepad2 style={{ width: '2rem', height: '2rem' }} /></StatIcon>
          <StatValue>{profileData.stats.totalGames}</StatValue>
          <StatLabel>Total Games</StatLabel>
        </StatCard>
        <StatCard>
          <StatIcon><DollarSign style={{ width: '2rem', height: '2rem' }} /></StatIcon>
          <StatValue>{profileData.stats.totalVolume}</StatValue>
          <StatLabel>Total Volume</StatLabel>
        </StatCard>
        <StatCard>
          <StatIcon><Star style={{ width: '2rem', height: '2rem' }} /></StatIcon>
          <StatValue>{activeGames.length}</StatValue>
          <StatLabel>Active Games</StatLabel>
        </StatCard>
        <StatCard>
          <StatIcon><Zap style={{ width: '2rem', height: '2rem' }} /></StatIcon>
          <StatValue>{profileData.xp}</StatValue>
          <StatLabel>FLIP Tokens (XP)</StatLabel>
        </StatCard>
      </StatsGrid>

      {/* Tabs */}
      <TabContainer>
        <TabButton 
          active={activeTab === 'profile'} 
          onClick={() => setActiveTab('profile')}
        >
          Profile
        </TabButton>
        <TabButton 
          active={activeTab === 'games'} 
          onClick={() => setActiveTab('games')}
        >
          My Games ({activeGames.length})
        </TabButton>
        <TabButton 
          active={activeTab === 'offers'} 
          onClick={() => setActiveTab('offers')}
        >
          My Offers ({offers.length})
        </TabButton>
        <TabButton 
          active={activeTab === 'winnings'} 
          onClick={() => setActiveTab('winnings')}
        >
          💰 My Winnings
        </TabButton>
        <TabButton 
          active={activeTab === 'assets'} 
          onClick={() => setActiveTab('assets')}
        >
          Assets
        </TabButton>
      </TabContainer>

      {/* Tab Content */}
      <TabContent>
        {activeTab === 'profile' && (
          <>
            {/* Social Media Links */}
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ color: '#fff', fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '1rem' }}>
                Social Media Links
              </h3>
                             <SocialLinksSection>
                 <div>
                   <label style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.9rem', marginBottom: '0.5rem', display: 'block' }}>
                     <Twitter style={{ width: '1rem', height: '1rem', display: 'inline', marginRight: '0.5rem' }} />
                     X (Twitter) Username
                   </label>
                   <SocialInputContainer>
                     <SocialInput
                       value={tempTwitter}
                       onChange={(e) => {
                         const newTwitter = e.target.value;
                         setTempTwitter(newTwitter);
                       }}
                       placeholder="@username"
                     />
                     <SaveButton 
                       onClick={() => saveProfileData('twitter', tempTwitter)}
                       disabled={savingTwitter || tempTwitter === profileData.twitter}
                     >
                       {savingTwitter ? 'Saving...' : 'Save'}
                     </SaveButton>
                   </SocialInputContainer>
                 </div>
                 <div>
                   <label style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.9rem', marginBottom: '0.5rem', display: 'block' }}>
                     <MessageCircle style={{ width: '1rem', height: '1rem', display: 'inline', marginRight: '0.5rem' }} />
                     Telegram Username
                   </label>
                   <SocialInputContainer>
                     <SocialInput
                       value={tempTelegram}
                       onChange={(e) => {
                         const newTelegram = e.target.value;
                         setTempTelegram(newTelegram);
                       }}
                       placeholder="@username"
                     />
                     <SaveButton 
                       onClick={() => saveProfileData('telegram', tempTelegram)}
                       disabled={savingTelegram || tempTelegram === profileData.telegram}
                     >
                       {savingTelegram ? 'Saving...' : 'Save'}
                     </SaveButton>
                   </SocialInputContainer>
                 </div>
               </SocialLinksSection>
            </div>

            {/* Custom Coin Designs */}
            <div>
              <h3 style={{ color: '#fff', fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '1rem' }}>
                Custom Coin Designs
              </h3>
              <CoinImagesGrid>
                                 <CoinImageCard>
                   <h4 style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '1rem', marginBottom: '1rem' }}>Heads</h4>
                   <div
                     onClick={() => {
                       const input = document.createElement('input');
                       input.type = 'file';
                       input.accept = 'image/*';
                       input.onchange = (e) => {
                         if (e.target.files[0]) {
                           handleImageUpload('heads', e.target.files[0]);
                         }
                       };
                       input.click();
                     }}
                     style={{ cursor: 'pointer' }}
                   >
                     {profileData.headsImage ? (
                       <CoinImage src={profileData.headsImage} alt="Heads" />
                     ) : (
                       <CoinImagePlaceholder>
                         <Image style={{ width: '3rem', height: '3rem' }} />
                       </CoinImagePlaceholder>
                     )}
                   </div>
                   <SaveButton 
                     onClick={() => saveProfileData('heads', profileData.headsImage)}
                     disabled={savingHeads || !profileData.headsImage}
                     style={{ marginTop: '1rem', width: '100%' }}
                   >
                     {savingHeads ? 'Saving...' : 'Save Heads Design'}
                   </SaveButton>
                 </CoinImageCard>
                
                                 <CoinImageCard>
                   <h4 style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '1rem', marginBottom: '1rem' }}>Tails</h4>
                   <div
                     onClick={() => {
                       const input = document.createElement('input');
                       input.type = 'file';
                       input.accept = 'image/*';
                       input.onchange = (e) => {
                         if (e.target.files[0]) {
                           handleImageUpload('tails', e.target.files[0]);
                         }
                       };
                       input.click();
                     }}
                     style={{ cursor: 'pointer' }}
                   >
                     {profileData.tailsImage ? (
                       <CoinImage src={profileData.tailsImage} alt="Tails" />
                     ) : (
                       <CoinImagePlaceholder>
                         <Image style={{ width: '3rem', height: '3rem' }} />
                       </CoinImagePlaceholder>
                     )}
                   </div>
                   <SaveButton 
                     onClick={() => saveProfileData('tails', profileData.tailsImage)}
                     disabled={savingTails || !profileData.tailsImage}
                     style={{ marginTop: '1rem', width: '100%' }}
                   >
                     {savingTails ? 'Saving...' : 'Save Tails Design'}
                   </SaveButton>
                 </CoinImageCard>
              </CoinImagesGrid>
            </div>
          </>
        )}

        {activeTab === 'games' && (
          <div>
            <h3 style={{ color: '#fff', fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>
              My Active Games
            </h3>
            
            {loading ? (
              <EmptyState>
                <LoadingSpinner />
                <div style={{ marginTop: '1rem' }}>Loading games...</div>
              </EmptyState>
            ) : activeGames.length === 0 ? (
              <EmptyState>
                <Gamepad2 style={{ width: '4rem', height: '4rem', color: 'rgba(255, 255, 255, 0.3)', marginBottom: '1rem' }} />
                <h4 style={{ color: '#fff', fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>No Active Games</h4>
                <div>You don't have any active games yet.</div>
              </EmptyState>
            ) : (
              <div>
                {activeGames.map((game) => (
                  <GameCard key={game.id}>
                    <GameHeader>
                      <GameInfo>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                          <span style={{
                            fontFamily: 'monospace',
                            fontSize: '0.9rem',
                            color: 'rgba(255, 255, 255, 0.7)'
                          }}>
                            Game #{game.id}
                          </span>
                          <StatusBadge status={game.state}>
                            {getGameStatusText(game.state)}
                          </StatusBadge>
                        </div>
                        <div style={{ fontSize: '0.9rem', color: 'rgba(255, 255, 255, 0.7)', marginBottom: '0.5rem' }}>
                          {game.gameType === 0 ? 'NFT vs Crypto' : 'NFT vs NFT'} • 
                          Created {new Date(Number(game.createdAt) * 1000).toLocaleString()}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.5)' }}>
                          Stake: {game.priceUSD ? `${(Number(game.priceUSD) / 1e18).toFixed(4)} ETH` : 'NFT'}
                        </div>
                      </GameInfo>
                      <GameActions>
                        {game.state === 0 && (
                          <ActionButton
                            variant="danger"
                            onClick={() => cancelGame(game.id)}
                          >
                            <X style={{ width: '1rem', height: '1rem' }} />
                            Cancel
                          </ActionButton>
                        )}
                        <ActionButton onClick={() => { window.location.href = `/test-tubes.html?gameId=${game.id}` }}>
                          View Game
                          <ExternalLink style={{ width: '1rem', height: '1rem' }} />
                        </ActionButton>
                      </GameActions>
                    </GameHeader>
                  </GameCard>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'offers' && (
          <div>
            <h3 style={{ color: '#fff', fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>
              My Offers
            </h3>
            
            {loading ? (
              <EmptyState>
                <LoadingSpinner />
                <div style={{ marginTop: '1rem' }}>Loading offers...</div>
              </EmptyState>
            ) : offers.length === 0 ? (
              <EmptyState>
                <MessageCircle style={{ width: '4rem', height: '4rem', color: 'rgba(255, 255, 255, 0.3)', marginBottom: '1rem' }} />
                <h4 style={{ color: '#fff', fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>No Offers</h4>
                <div>You don't have any offers yet.</div>
              </EmptyState>
            ) : (
              <div>
                {offers.map((offer) => (
                  <GameCard key={offer.id}>
                    <GameHeader>
                      <GameInfo>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                          <span style={{
                            fontFamily: 'monospace',
                            fontSize: '0.9rem',
                            color: 'rgba(255, 255, 255, 0.7)'
                          }}>
                            Offer #{offer.id}
                          </span>
                          <StatusBadge status={offer.status}>
                            {offer.status === 'pending' ? 'Pending' : offer.status === 'accepted' ? 'Accepted' : 'Rejected'}
                          </StatusBadge>
                        </div>
                        <div style={{ fontSize: '0.9rem', color: 'rgba(255, 255, 255, 0.7)', marginBottom: '0.5rem' }}>
                          From: {formatAddress(offer.from)}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.5)' }}>
                          Created {new Date(offer.createdAt).toLocaleString()}
                        </div>
                      </GameInfo>
                      <GameActions>
                        {offer.status === 'pending' && (
                          <ActionButton onClick={() => acceptOffer(offer.id)}>
                            Accept
                            <CheckCircle style={{ width: '1rem', height: '1rem' }} />
                          </ActionButton>
                        )}
                        {offer.gameId && (
                          <ActionButton onClick={() => navigate(`/battle-royale/${offer.gameId}`)}>
                            View Game
                            <ExternalLink style={{ width: '1rem', height: '1rem' }} />
                          </ActionButton>
                        )}
                      </GameActions>
                    </GameHeader>
                  </GameCard>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'winnings' && (
          <div>
            <h3 style={{ color: '#fff', fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>
              💰 My Winnings
            </h3>
            
            {loading ? (
              <EmptyState>
                <LoadingSpinner />
                <div style={{ marginTop: '1rem' }}>Loading winnings...</div>
              </EmptyState>
            ) : winnings.length === 0 ? (
              <EmptyState>
                <Trophy style={{ width: '4rem', height: '4rem', color: 'rgba(255, 255, 255, 0.3)', marginBottom: '1rem' }} />
                <h4 style={{ color: '#fff', fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>No Winnings Yet</h4>
                <div>You haven't won any games yet. Keep playing to earn rewards!</div>
              </EmptyState>
            ) : (
              <div>
                <div style={{ 
                  background: 'rgba(0, 255, 65, 0.1)', 
                  border: '1px solid rgba(0, 255, 65, 0.3)', 
                  borderRadius: '1rem', 
                  padding: '1.5rem', 
                  marginBottom: '2rem',
                  textAlign: 'center'
                }}>
                  <h4 style={{ color: '#00FF41', fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                    🎉 Congratulations!
                  </h4>
                  <p style={{ color: 'rgba(255, 255, 255, 0.8)', marginBottom: '1rem' }}>
                    You have {winnings.length} game{winnings.length !== 1 ? 's' : ''} to claim winnings from.
                    Each game contains both the NFT and crypto that you can withdraw to your wallet.
                  </p>
                  <div style={{ 
                    background: 'rgba(255, 193, 7, 0.2)', 
                    border: '1px solid rgba(255, 193, 7, 0.3)', 
                    borderRadius: '0.5rem', 
                    padding: '1rem',
                    fontSize: '0.9rem',
                    color: 'rgba(255, 255, 255, 0.9)'
                  }}>
                    <strong>⚠️ Important:</strong> You pay the gas fees for withdrawals. 
                    On Base network, this is usually less than $0.05 per withdrawal.
                  </div>
                </div>

                {winnings.map((game) => (
                  <GameCard key={game.id} style={{
                    border: game.withdrawalStatus === 'withdrawn' 
                      ? '2px solid rgba(76, 175, 80, 0.4)' 
                      : '2px solid rgba(255, 215, 0, 0.4)',
                    background: game.withdrawalStatus === 'withdrawn'
                      ? 'rgba(76, 175, 80, 0.1)'
                      : 'rgba(255, 215, 0, 0.1)'
                  }}>
                    <GameHeader>
                      <GameInfo>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                          <span style={{
                            fontFamily: 'monospace',
                            fontSize: '0.9rem',
                            color: 'rgba(255, 255, 255, 0.7)'
                          }}>
                            🏆 Game #{game.id}
                          </span>
                          <StatusBadge status={game.withdrawalStatus === 'withdrawn' ? 3 : 2}>
                            {game.withdrawalStatus === 'withdrawn' ? '✅ Withdrawn' : '💰 Ready to Claim'}
                          </StatusBadge>
                        </div>
                        
                        <div style={{ fontSize: '1rem', color: '#fff', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                          🎁 Winnings Available:
                        </div>
                        
                        <div style={{ 
                          display: 'grid', 
                          gridTemplateColumns: '1fr 1fr', 
                          gap: '1rem', 
                          marginBottom: '0.5rem',
                          padding: '1rem',
                          background: 'rgba(255, 255, 255, 0.05)',
                          borderRadius: '0.5rem'
                        }}>
                          <div>
                            <div style={{ fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.6)' }}>NFT:</div>
                            <div style={{ fontSize: '0.9rem', color: '#fff', fontWeight: 'bold' }}>
                              {game.nft_name || `Token #${game.nft_token_id}`}
                            </div>
                            <div style={{ fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.5)' }}>
                              {game.nft_collection || 'Unknown Collection'}
                            </div>
                          </div>
                          <div>
                            <div style={{ fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.6)' }}>Crypto:</div>
                            <div style={{ fontSize: '0.9rem', color: '#fff', fontWeight: 'bold' }}>
                              ${game.final_price || game.price_usd || '0'} USD
                            </div>
                            <div style={{ fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.5)' }}>
                              (minus 3.5% platform fee)
                            </div>
                          </div>
                        </div>
                        
                        <div style={{ fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.5)' }}>
                          Won on {new Date(game.completed_at || game.created_at).toLocaleString()}
                        </div>
                        
                        {game.withdrawalTx && (
                          <div style={{ fontSize: '0.8rem', color: 'rgba(76, 175, 80, 0.8)', marginTop: '0.5rem' }}>
                            ✅ Withdrawn: {game.withdrawalTx.slice(0, 10)}...{game.withdrawalTx.slice(-6)}
                          </div>
                        )}
                      </GameInfo>
                      
                      <GameActions>
                        {game.withdrawalStatus !== 'withdrawn' ? (
                          <ActionButton
                            style={{
                              background: 'linear-gradient(45deg, #FFD700, #FFA500)',
                              color: '#000',
                              fontWeight: 'bold'
                            }}
                            onClick={() => withdrawWinnings(game.id)}
                          >
                            <Coins style={{ width: '1rem', height: '1rem' }} />
                            Withdraw All
                          </ActionButton>
                        ) : (
                          <ActionButton
                            style={{
                              background: 'rgba(76, 175, 80, 0.3)',
                              color: '#4CAF50',
                              cursor: 'not-allowed'
                            }}
                            disabled
                          >
                            <CheckCircle style={{ width: '1rem', height: '1rem' }} />
                            Withdrawn
                          </ActionButton>
                        )}
                        
                          <ActionButton onClick={() => { window.location.href = `/test-tubes.html?gameId=${game.id}` }}>
                          View Game
                          <ExternalLink style={{ width: '1rem', height: '1rem' }} />
                        </ActionButton>
                      </GameActions>
                    </GameHeader>
                  </GameCard>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'assets' && (
          <div>
            <h3 style={{ color: '#fff', fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>
              📦 Assets In Contract
            </h3>

            <div style={{ marginBottom: '1rem', color: 'rgba(255,255,255,0.8)' }}>
              View assets you can withdraw now. Once withdrawn, they disappear from this list.
            </div>

            <h4 style={{ color: '#FFD700', marginTop: '1rem' }}>Creator Funds</h4>
            {(claimables.creator?.length || 0) === 0 ? (
              <EmptyState>No creator funds available.</EmptyState>
            ) : (
              claimables.creator.map(item => (
                <GameCard key={`creator-${item.gameId}`}>
                  <GameHeader>
                    <GameInfo>
                      <div style={{ fontFamily: 'monospace', color: 'rgba(255,255,255,0.7)' }}>
                        Game #{item.gameId}
                      </div>
                      <div style={{ color: '#ccc' }}>
                        Entry fee per player: ${item.entry_fee} • Max: {item.max_players}
                      </div>
                    </GameInfo>
                    <GameActions>
                      <ActionButton
                        onClick={async () => {
                          try {
                            showInfo('Withdrawing creator funds...')
                            const res = await contractService.withdrawBattleRoyaleCreatorFunds(item.gameId)
                            if (res.success) {
                              showSuccess('Creator funds withdrawn!')
                              setClaimables(prev => ({
                                ...prev,
                                creator: prev.creator.filter(c => c.gameId !== item.gameId)
                              }))
                            } else {
                              showError(res.error || 'Withdraw failed')
                            }
                          } catch (e) {
                            showError(e?.message || 'Withdraw failed')
                          }
                        }}
                        style={{ background: 'linear-gradient(45deg, #FFD700, #FFA500)', color: '#000' }}
                      >
                        Withdraw
                      </ActionButton>
                    </GameActions>
                  </GameHeader>
                </GameCard>
              ))
            )}

            <h4 style={{ color: '#00FF41', marginTop: '2rem' }}>Winner NFTs</h4>
            {(claimables.winner?.length || 0) === 0 ? (
              <EmptyState>No winner NFTs available.</EmptyState>
            ) : (
              claimables.winner.map(item => (
                <GameCard key={`winner-${item.gameId}`}>
                  <GameHeader>
                    <GameInfo>
                      <div style={{ fontFamily: 'monospace', color: 'rgba(255,255,255,0.7)' }}>
                        Game #{item.gameId}
                      </div>
                      <div style={{ color: '#ccc' }}>
                        {item.nft_name || `Token #${item.nft_token_id}`}
                      </div>
                    </GameInfo>
                    <GameActions>
                      <ActionButton
                        onClick={async () => {
                          try {
                            showInfo('Claiming NFT...')
                            const res = await contractService.withdrawBattleRoyaleWinnerNFT(item.gameId)
                            if (res.success) {
                              showSuccess('NFT claimed!')
                              setClaimables(prev => ({
                                ...prev,
                                winner: prev.winner.filter(w => w.gameId !== item.gameId)
                              }))
                            } else {
                              showError(res.error || 'Claim failed')
                            }
                          } catch (e) {
                            showError(e?.message || 'Claim failed')
                          }
                        }}
                        style={{ background: 'linear-gradient(45deg, #00FF41, #39FF14)', color: '#000' }}
                      >
                        Claim NFT
                      </ActionButton>
                    </GameActions>
                  </GameHeader>
                </GameCard>
              ))
            )}
          </div>
        )}
      </TabContent>
    </ProfileContainer>
  );
};

export default Profile; 