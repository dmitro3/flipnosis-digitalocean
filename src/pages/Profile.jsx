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

  @media (max-width: 768px) {
    padding: 1rem;
    max-width: 100vw;
    overflow-x: hidden;
  }
`;

const ProfileHeader = styled.div`
  background: linear-gradient(135deg, rgba(10, 15, 35, 0.95), rgba(16, 33, 62, 0.95));
  border: 3px solid #9d00ff;
  border-radius: 20px;
  padding: 2rem;
  margin-bottom: 2rem;
  position: relative;
  overflow: hidden;
  backdrop-filter: blur(15px);
  box-shadow: 0 0 40px rgba(157, 0, 255, 0.4);
  transition: all 0.3s ease;

  &:hover {
    border-color: #00ffff;
    box-shadow: 0 0 50px rgba(0, 255, 255, 0.5);
  }

  @media (max-width: 768px) {
    padding: 1rem;
    border-radius: 15px;
    margin-bottom: 1rem;
  }

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(45deg, transparent 30%, rgba(157, 0, 255, 0.1) 50%, transparent 70%);
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
  border: 3px solid #00ffff;
  object-fit: cover;
  transition: all 0.3s ease;
  box-shadow: 0 0 20px rgba(0, 255, 255, 0.3);

  &:hover {
    border-color: #9d00ff;
    box-shadow: 0 0 30px rgba(157, 0, 255, 0.6);
    transform: scale(1.05);
  }

  @media (max-width: 768px) {
    width: 6rem;
    height: 6rem;
    border-width: 2px;
  }
`;

const AvatarPlaceholder = styled.div`
  width: 8rem;
  height: 8rem;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  border: 3px solid #00ffff;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  box-shadow: 0 0 20px rgba(0, 255, 255, 0.3);

  &:hover {
    border-color: #9d00ff;
    box-shadow: 0 0 30px rgba(157, 0, 255, 0.6);
    background: rgba(255, 255, 255, 0.2);
    transform: scale(1.05);
  }

  @media (max-width: 768px) {
    width: 6rem;
    height: 6rem;
    border-width: 2px;
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
  background: linear-gradient(135deg, rgba(0, 255, 255, 0.2), rgba(157, 0, 255, 0.2));
  border: 2px solid #00ffff;
  border-radius: 12px;
  padding: 0.5rem 1rem;
  color: #fff;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-left: 0.5rem;
  backdrop-filter: blur(5px);
  box-shadow: 0 0 15px rgba(0, 255, 255, 0.3);

  &:hover {
    background: linear-gradient(135deg, rgba(157, 0, 255, 0.3), rgba(0, 255, 255, 0.3));
    border-color: #9d00ff;
    box-shadow: 0 0 25px rgba(157, 0, 255, 0.5);
    transform: translateY(-2px);
  }

  &:disabled {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.3);
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

  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
    margin-bottom: 1rem;
  }
`;

const StatCard = styled.div`
  background: linear-gradient(135deg, rgba(10, 15, 35, 0.95), rgba(16, 33, 62, 0.95));
  border: 2px solid #9d00ff;
  border-radius: 15px;
  padding: 1.5rem;
  transition: all 0.3s ease;
  text-align: center;
  backdrop-filter: blur(10px);
  box-shadow: 0 0 20px rgba(157, 0, 255, 0.3);

  &:hover {
    border-color: #00ffff;
    box-shadow: 0 0 30px rgba(0, 255, 255, 0.5);
    transform: translateY(-3px);
  }

  @media (max-width: 768px) {
    padding: 1rem;
    border-radius: 12px;
  }
`;

const StatIcon = styled.div`
  color: #00ffff;
  margin-bottom: 0.5rem;
  filter: drop-shadow(0 0 10px rgba(0, 255, 255, 0.5));
`;

const StatValue = styled.div`
  color: #fff;
  font-size: 2rem;
  font-weight: bold;
  margin-bottom: 0.25rem;
  text-shadow: 0 0 10px rgba(0, 255, 255, 0.3);
`;

const StatLabel = styled.div`
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.9rem;
`;

const TabContainer = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  border-bottom: 2px solid rgba(157, 0, 255, 0.3);
  overflow-x: auto;
  background: linear-gradient(135deg, rgba(10, 15, 35, 0.8), rgba(16, 33, 62, 0.8));
  border-radius: 15px 15px 0 0;
  padding: 1rem 1rem 0 1rem;
  backdrop-filter: blur(10px);

  @media (max-width: 768px) {
    gap: 0.5rem;
    margin-bottom: 1rem;
    padding: 0.5rem 0.5rem 0 0.5rem;
    flex-wrap: wrap;
  }
`;

const TabButton = styled.button`
  background: ${props => props.active 
    ? 'linear-gradient(135deg, rgba(0, 255, 255, 0.2), rgba(157, 0, 255, 0.2))' 
    : 'transparent'};
  border: ${props => props.active ? '2px solid #00ffff' : '2px solid transparent'};
  color: ${props => props.active ? '#fff' : 'rgba(255, 255, 255, 0.7)'};
  font-size: 1rem;
  font-weight: ${props => props.active ? 'bold' : 'normal'};
  cursor: pointer;
  padding: 1rem 1.5rem;
  transition: all 0.3s ease;
  border-radius: 12px;
  white-space: nowrap;
  backdrop-filter: blur(5px);
  box-shadow: ${props => props.active ? '0 0 20px rgba(0, 255, 255, 0.3)' : 'none'};
  text-shadow: ${props => props.active ? '0 0 10px rgba(0, 255, 255, 0.5)' : 'none'};

  &:hover {
    background: linear-gradient(135deg, rgba(157, 0, 255, 0.2), rgba(0, 255, 255, 0.2));
    border-color: #9d00ff;
    box-shadow: 0 0 25px rgba(157, 0, 255, 0.4);
    color: #fff;
  }

  @media (max-width: 768px) {
    font-size: 0.8rem;
    padding: 0.5rem 1rem;
    border-radius: 8px;
    flex: 1;
    min-width: 0;
  }
`;

const TabContent = styled.div`
  background: linear-gradient(135deg, rgba(10, 15, 35, 0.95), rgba(16, 33, 62, 0.95));
  border: 3px solid #9d00ff;
  border-radius: 0 0 20px 20px;
  padding: 2rem;
  min-height: 400px;
  backdrop-filter: blur(15px);
  box-shadow: 0 0 40px rgba(157, 0, 255, 0.3);
  transition: all 0.3s ease;

  &:hover {
    border-color: #00ffff;
    box-shadow: 0 0 50px rgba(0, 255, 255, 0.5);
  }

  @media (max-width: 768px) {
    padding: 1rem;
    border-radius: 0 0 15px 15px;
    min-height: 300px;
  }
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
  background: linear-gradient(135deg, rgba(10, 15, 35, 0.8), rgba(16, 33, 62, 0.8));
  border: 2px solid #9d00ff;
  border-radius: 12px;
  padding: 0.75rem 1rem;
  color: #fff;
  font-size: 0.9rem;
  width: 100%;
  backdrop-filter: blur(10px);
  box-shadow: 0 0 15px rgba(157, 0, 255, 0.2);
  transition: all 0.3s ease;

  &:focus {
    outline: none;
    border-color: #00ffff;
    box-shadow: 0 0 25px rgba(0, 255, 255, 0.4);
  }

  &:hover {
    border-color: #00ffff;
    box-shadow: 0 0 20px rgba(0, 255, 255, 0.3);
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
  const [hasBlockchain, setHasBlockchain] = useState(false);
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
  
  // Battle Royale state
  const [createdBattleRoyales, setCreatedBattleRoyales] = useState([]);
  const [participatedBattleRoyales, setParticipatedBattleRoyales] = useState([]);
  const [loadingBattleRoyales, setLoadingBattleRoyales] = useState(false);

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
      if (!targetAddress || activeTab !== 'claims') return;
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
    
    // Check if we have a claimGame parameter in URL (from game end screen)
    const urlParams = new URLSearchParams(window.location.search)
    const claimGameId = urlParams.get('claimGame')
    if (claimGameId && activeTab === 'claims') {
      // Auto-switch to claims tab if not already there
      setActiveTab('claims')
    }
  }, [targetAddress, activeTab])

  useEffect(() => {
    // Fetch blockchain availability to enable/disable on-chain claim buttons
    const loadHealth = async () => {
      try {
        const resp = await fetch('/api/health')
        if (resp.ok) {
          const data = await resp.json()
          setHasBlockchain(!!data.hasContractOwner)
        }
      } catch (e) {
        console.error('Failed to load health:', e)
        setHasBlockchain(false)
      }
    }
    loadHealth()
  }, [])

  useEffect(() => {
    const loadBattleRoyaleGames = async () => {
      if (!targetAddress || (activeTab !== 'listings' && activeTab !== 'games' && activeTab !== 'claims')) return;
      setLoadingBattleRoyales(true);
      try {
        // Load created games
        const createdResp = await fetch(`/api/users/${targetAddress}/created-games`);
        if (createdResp.ok) {
          const createdData = await createdResp.json();
          setCreatedBattleRoyales(createdData.games || []);
        }
        
        // Load participated games
        const participatedResp = await fetch(`/api/users/${targetAddress}/participated-games`);
        if (participatedResp.ok) {
          const participatedData = await participatedResp.json();
          setParticipatedBattleRoyales(participatedData.games || []);
        }
      } catch (e) {
        console.error('Failed to load Battle Royale games:', e);
      } finally {
        setLoadingBattleRoyales(false);
      }
    };
    loadBattleRoyaleGames();
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
          <StatValue>{profileData.flip_balance || profileData.xp || 0}</StatValue>
          <StatLabel>FLIP Tokens</StatLabel>
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
          active={activeTab === 'listings'} 
          onClick={() => setActiveTab('listings')}
        >
          Listings
        </TabButton>
        <TabButton 
          active={activeTab === 'games'} 
          onClick={() => setActiveTab('games')}
        >
          Games
        </TabButton>
        <TabButton 
          active={activeTab === 'claims'} 
          onClick={() => setActiveTab('claims')}
        >
          Claims
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

        {activeTab === 'claims' && (
          <div>
            <h3 style={{ color: '#fff', fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>
              Claims
            </h3>
            <p style={{ color: '#ccc', marginBottom: '1.5rem', fontSize: '1rem' }}>
              Withdraw your winnings and creator funds. Items disappear once claimed.
            </p>

            {loadingBattleRoyales ? (
              <EmptyState>
                <LoadingSpinner />
                <div style={{ marginTop: '1rem' }}>Loading claimables...</div>
              </EmptyState>
            ) : (
              <>
                {/* Winner NFT Claims */}
                <h4 style={{ color: '#FFD700', marginTop: '0.5rem', marginBottom: '1rem', fontSize: '1.2rem' }}>
                  🏆 Winner NFT Claims
                </h4>
                {(() => {
                  const winnerClaims = claimables.winner || [];
                  return winnerClaims.length === 0 ? (
                    <EmptyState style={{ marginBottom: '2rem' }}>
                      <div>No NFT claims pending</div>
                    </EmptyState>
                  ) : (
                    <div style={{ marginBottom: '2rem' }}>
                      {winnerClaims.map(game => (
                        <GameCard key={`claim-winner-${game.gameId}`} style={{ marginBottom: '1rem' }}>
                          <GameHeader>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', width: '100%' }}>
                              <img 
                                src={game.nft_image} 
                                alt={game.nft_name}
                                style={{ width: '80px', height: '80px', borderRadius: '8px', objectFit: 'cover', border: '2px solid rgba(255, 255, 255, 0.1)' }}
                              />
                              <GameInfo style={{ flex: 1, minWidth: '200px' }}>
                                <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#fff', marginBottom: '0.25rem' }}>
                                  {game.nft_name}
                                </div>
                                <div style={{ fontSize: '0.9rem', color: '#ccc', marginBottom: '0.5rem' }}>
                                  Collection: {game.nft_collection}
                                </div>
                                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', fontSize: '0.85rem' }}>
                                  <div style={{ color: '#00ff00' }}>✅ Complete</div>
                                  <div style={{ color: '#FFD700' }}>🏆 You are the winner</div>
                                </div>
                              </GameInfo>
                              <GameActions style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', minWidth: '160px' }}>
                                <ActionButton
                                  disabled={!hasBlockchain}
                                  title={hasBlockchain ? '' : 'Blockchain service unavailable'}
                                  onClick={async () => {
                                    try {
                                      showInfo('Checking game state and claiming NFT...');
                                      
                                      // Get game data to find winner address
                                      const gameData = await fetch(`/api/battle-royale/${game.gameId}`).then(r => r.json()).catch(() => null);
                                      const winnerAddress = gameData?.winner_address || gameData?.winner || address;
                                      
                                      // Complete on-chain and claim (auto-completes if needed)
                                      const result = await contractService.completeAndClaimBattleRoyaleNFT(
                                        game.gameId, 
                                        winnerAddress,
                                        gameData?.current_players || gameData?.max_players || 8
                                      );
                                      
                                      if (result.success) {
                                        // Update database to mark NFT as claimed
                                        try {
                                          await fetch(`/api/battle-royale/${game.gameId}/mark-nft-claimed`, {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({
                                              winner: address,
                                              transactionHash: result.transactionHash
                                            })
                                          });
                                        } catch (dbError) {
                                          console.warn('DB update failed:', dbError);
                                        }
                                        showSuccess('NFT claimed successfully! 🎉');
                                        // Refresh claimables data
                                        const claimablesResp = await fetch(`/api/users/${targetAddress}/claimables`);
                                        if (claimablesResp.ok) {
                                          const claimablesData = await claimablesResp.json();
                                          setClaimables({ creator: claimablesData.creator || [], winner: claimablesData.winner || [] });
                                        }
                                      } else {
                                        // Check specific error types
                                        if (result.cannotClaim) {
                                          showError(result.error || 'This game cannot have an NFT claim because it was never created on-chain.');
                                        } else if (result.needsCompletion) {
                                          showError(result.error || 'Game needs to be completed on-chain first. Please try again in a moment.');
                                        } else {
                                          showError(result.error || 'Failed to claim NFT');
                                        }
                                      }
                                    } catch (err) {
                                      console.error('Claim NFT error:', err);
                                      showError(err.message || 'Failed to claim NFT');
                                    }
                                  }}
                                  style={{ background: 'linear-gradient(135deg, #FFD700, #FFA500)' }}
                                >
                                  🏆 Claim NFT
                                </ActionButton>
                              </GameActions>
                            </div>
                          </GameHeader>
                        </GameCard>
                      ))}
                    </div>
                  );
                })()}

                {/* Creator Fund Withdrawals */}
                <h4 style={{ color: '#00ffff', marginTop: '0.5rem', marginBottom: '1rem', fontSize: '1.2rem' }}>
💰 Creator Fund Withdrawals
                </h4>
                {(() => {
                  const creatorClaims = claimables.creator || [];
                  return creatorClaims.length === 0 ? (
                    <EmptyState>
                      <div>No creator withdrawals pending</div>
                    </EmptyState>
                  ) : (
                    <div>
                      {creatorClaims.map(game => (
                        <GameCard key={`claim-creator-${game.gameId}`} style={{ marginBottom: '1rem' }}>
                          <GameHeader>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', width: '100%' }}>
                              <img 
                                src={game.nft_image} 
                                alt={game.nft_name}
                                style={{ width: '80px', height: '80px', borderRadius: '8px', objectFit: 'cover', border: '2px solid rgba(255, 255, 255, 0.1)' }}
                              />
                              <GameInfo style={{ flex: 1, minWidth: '200px' }}>
                                <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#fff', marginBottom: '0.25rem' }}>
                                  {game.nft_name}
                                </div>
                                <div style={{ fontSize: '0.9rem', color: '#ccc', marginBottom: '0.5rem' }}>
                                  Collection: {game.nft_collection}
                                </div>
                                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', fontSize: '0.85rem' }}>
                                  <div style={{ color: '#00ff00' }}>✅ Complete</div>
                                  <div style={{ color: '#00ffff' }}>💰 Creator earnings: ${(game.entry_fee * game.max_players - game.service_fee).toFixed(2)}</div>
                                </div>
                              </GameInfo>
                              <GameActions style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', minWidth: '160px' }}>
                                <ActionButton
                                  disabled={!hasBlockchain}
                                  title={hasBlockchain ? '' : 'Blockchain service unavailable'}
                                  onClick={async () => {
                                    try {
                                      showInfo('Withdrawing creator funds...');
                                      const result = await contractService.withdrawBattleRoyaleCreatorFunds(game.gameId);
                                      if (result.success) {
                                        // Update database to mark creator as paid
                                        try {
                                          await fetch(`/api/battle-royale/${game.gameId}/mark-creator-paid`, {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({
                                              creator: address,
                                              transactionHash: result.transactionHash
                                            })
                                          });
                                        } catch (dbError) {
                                          console.warn('DB update failed:', dbError);
                                        }
                                        showSuccess('Creator funds withdrawn successfully! 💰');
                                        // Refresh claimables data
                                        const claimablesResp = await fetch(`/api/users/${targetAddress}/claimables`);
                                        if (claimablesResp.ok) {
                                          const claimablesData = await claimablesResp.json();
                                          setClaimables({ creator: claimablesData.creator || [], winner: claimablesData.winner || [] });
                                        }
                                      } else {
                                        showError(result.error || 'Failed to withdraw funds');
                                      }
                                    } catch (err) {
                                      console.error('Withdraw funds error:', err);
                                      showError(err.message || 'Failed to withdraw funds');
                                    }
                                  }}
                                  style={{ background: 'linear-gradient(135deg, #00c853, #00e676)' }}
                                >
                                  💰 Withdraw Funds
                                </ActionButton>
                              </GameActions>
                            </div>
                          </GameHeader>
                        </GameCard>
                      ))}
                    </div>
                  );
                })()}
              </>
            )}
          </div>
        )}




        {activeTab === 'listings' && (
          <div>
            <h3 style={{ color: '#fff', fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>
              My Listings
            </h3>
            <p style={{ color: '#ccc', marginBottom: '1.5rem', fontSize: '1rem' }}>
              Manage your NFT listings and withdraw your earnings
            </p>
            
            {loadingBattleRoyales ? (
              <EmptyState>
                <LoadingSpinner />
                <div style={{ marginTop: '1rem' }}>Loading listings...</div>
              </EmptyState>
            ) : (
              <>
                {/* Created Games Section */}
                <h4 style={{ color: '#FFD700', marginTop: '1.5rem', marginBottom: '1rem', fontSize: '1.2rem' }}>
                  👑 My NFT Listings ({createdBattleRoyales.length})
                </h4>
                
                {createdBattleRoyales.length === 0 ? (
                  <EmptyState style={{ marginBottom: '2rem' }}>
                    <Trophy style={{ width: '3rem', height: '3rem', color: 'rgba(255, 255, 255, 0.3)', marginBottom: '0.5rem' }} />
                    <div>No listings created yet</div>
                    <div style={{ fontSize: '0.9rem', color: '#888', marginTop: '0.5rem' }}>
                      Create your first NFT listing to start earning!
                    </div>
                  </EmptyState>
                ) : (
                  <div style={{ marginBottom: '2rem' }}>
                    {createdBattleRoyales.map((game) => (
                      <GameCard key={game.id} style={{ marginBottom: '1rem' }}>
                        <GameHeader>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', width: '100%' }}>
                            {/* NFT Image */}
                            <img 
                              src={game.nft_image} 
                              alt={game.nft_name}
                              style={{
                                width: '80px',
                                height: '80px',
                                borderRadius: '8px',
                                objectFit: 'cover',
                                border: '2px solid rgba(255, 255, 255, 0.1)'
                              }}
                            />

                            {/* Game Info */}
                            <GameInfo style={{ flex: 1, minWidth: '200px' }}>
                              <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#fff', marginBottom: '0.25rem' }}>
                                {game.nft_name}
                              </div>
                              <div style={{ fontSize: '0.9rem', color: '#ccc', marginBottom: '0.5rem' }}>
                                Collection: {game.nft_collection}
                              </div>
                              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', fontSize: '0.85rem' }}>
                                <div style={{ color: '#FFD700' }}>
                                  💰 Price: {game.price} ETH
                                </div>
                                <div style={{ color: game.status === 'complete' || game.status === 'completed' || game.status === 'completed' ? '#00ff00' : game.status === 'active' ? '#00ffff' : game.status === 'filling' ? '#FFD700' : '#ff6b6b' }}>
                                  📊 Status: {game.status === 'complete' || game.status === 'completed' || game.status === 'completed' ? '✅ Complete' : game.status === 'active' ? '🔄 Active' : game.status === 'filling' ? '⏳ Waiting for Players' : '❌ Cancelled'}
                                </div>
                                <div style={{ color: '#ccc' }}>
                                  👥 Players: {game.current_players}/{game.max_players}
                                </div>
                                {game.winner_address && (
                                  <div style={{ color: '#FFD700' }}>
                                    🏆 Winner: {game.winner_address.slice(0, 6)}...{game.winner_address.slice(-4)}
                                  </div>
                                )}
                              </div>
                            </GameInfo>

                            {/* Actions */}
                            <GameActions style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', minWidth: '140px' }}>
                              {/* View Game Button */}
                              <ActionButton 
                                onClick={() => window.location.href = `/battle-royale/${game.id}`}
                                style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)' }}
                              >
                                👁️ View Game
                              </ActionButton>

                              {/* Withdraw Creator Funds */}
                              {game.status === 'complete' || game.status === 'completed' && game.completion_tx && !game.creator_funds_withdrawn && (
                                <ActionButton
                                  onClick={async () => {
                                    try {
                                      showInfo('Withdrawing creator funds...');
                                      const result = await contractService.withdrawBattleRoyaleCreatorFunds(game.id);
                                      if (result.success) {
                                        showSuccess('Creator funds withdrawn successfully!');
                                        // Reload games
                                        const createdResp = await fetch(`/api/users/${targetAddress}/created-games`);
                                        if (createdResp.ok) {
                                          const createdData = await createdResp.json();
                                          setCreatedBattleRoyales(createdData.games || []);
                                        }
                                      } else {
                                        showError(result.error || 'Failed to withdraw funds');
                                      }
                                    } catch (error) {
                                      console.error('Withdraw funds error:', error);
                                      showError(error.message || 'Failed to withdraw funds');
                                    }
                                  }}
                                  style={{ background: 'linear-gradient(135deg, #00c853, #00e676)' }}
                                >
                                  💰 Withdraw Funds
                                </ActionButton>
                              )}

                              {/* Reclaim NFT (for cancelled games) */}
                              {game.status === 'cancelled' && !game.nft_withdrawn && (
                                <ActionButton
                                  onClick={async () => {
                                    try {
                                      showInfo('Reclaiming NFT...');
                                      const result = await contractService.reclaimBattleRoyaleNFT(game.id);
                                      if (result.success) {
                                        showSuccess('NFT reclaimed successfully!');
                                        // Reload games
                                        const createdResp = await fetch(`/api/users/${targetAddress}/created-games`);
                                        if (createdResp.ok) {
                                          const createdData = await createdResp.json();
                                          setCreatedBattleRoyales(createdData.games || []);
                                        }
                                      } else {
                                        showError(result.error || 'Failed to reclaim NFT');
                                      }
                                    } catch (error) {
                                      console.error('Reclaim NFT error:', error);
                                      showError(error.message || 'Failed to reclaim NFT');
                                    }
                                  }}
                                  style={{ background: 'linear-gradient(135deg, #ff6b6b, #ff8e8e)' }}
                                >
                                  🔄 Reclaim NFT
                                </ActionButton>
                              )}

                              {/* Show withdrawn status */}
                              {game.creator_funds_withdrawn && (
                                <div style={{ fontSize: '0.75rem', color: '#00ff00', textAlign: 'center' }}>
                                  ✅ Funds Withdrawn
                                </div>
                              )}
                              {game.nft_withdrawn && (
                                <div style={{ fontSize: '0.75rem', color: '#00ff00', textAlign: 'center' }}>
                                  ✅ NFT Reclaimed
                                </div>
                              )}
                            </GameActions>
                          </div>
                        </GameHeader>
                      </GameCard>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {activeTab === 'games' && (
          <div>
            <h3 style={{ color: '#fff', fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>
              My Games
            </h3>
            <p style={{ color: '#ccc', marginBottom: '1.5rem', fontSize: '1rem' }}>
              Games you've participated in and your winnings
            </p>

            {loadingBattleRoyales ? (
              <EmptyState>
                <LoadingSpinner />
                <div style={{ marginTop: '1rem' }}>Loading Battle Royale games...</div>
              </EmptyState>
            ) : (
              <>
                {/* Created Games Section */}
                <h4 style={{ color: '#FFD700', marginTop: '1.5rem', marginBottom: '1rem', fontSize: '1.2rem' }}>
                  👑 Games I Created ({createdBattleRoyales.length})
                </h4>
                
                {createdBattleRoyales.length === 0 ? (
                  <EmptyState style={{ marginBottom: '2rem' }}>
                    <Trophy style={{ width: '3rem', height: '3rem', color: 'rgba(255, 255, 255, 0.3)', marginBottom: '0.5rem' }} />
                    <div>No games created yet</div>
                  </EmptyState>
                ) : (
                  <div style={{ marginBottom: '2rem' }}>
                    {createdBattleRoyales.map((game) => (
                      <GameCard key={game.id} style={{ marginBottom: '1rem' }}>
                        <GameHeader>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', width: '100%' }}>
                            {/* NFT Image */}
                            <img 
                              src={game.nft_image} 
                              alt={game.nft_name}
                              style={{
                                width: '80px',
                                height: '80px',
                                borderRadius: '8px',
                                objectFit: 'cover',
                                border: '2px solid rgba(255, 215, 0, 0.5)'
                              }}
                            />
                            
                            {/* Game Info */}
                            <GameInfo style={{ flex: 1, minWidth: '200px' }}>
                              <div style={{ fontSize: '1rem', fontWeight: 'bold', color: '#FFD700', marginBottom: '0.3rem' }}>
                                {game.nft_name || 'Unnamed NFT'}
                              </div>
                              <div style={{ fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.7)', marginBottom: '0.3rem' }}>
                                {game.nft_collection || 'Unknown Collection'}
                              </div>
                              <div style={{ fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.6)' }}>
                                Entry Fee: {game.entry_fee ? `${game.entry_fee} ETH` : 'Free'}
                              </div>
                              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                                <StatusBadge status={game.status}>
                                  {game.status === 'filling' ? '⏳ Waiting for Players' : 
                                   game.status === 'active' ? '🎮 In Progress' :
                                   game.status === 'complete' || game.status === 'completed' ? '✅ Completed' :
                                   game.status === 'cancelled' ? '❌ Cancelled' : game.status}
                                </StatusBadge>
                                <span style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.5)' }}>
                                  Players: {game.current_players || 0}/{game.max_players || 6}
                                </span>
                              </div>
                            </GameInfo>

                            {/* Actions */}
                            <GameActions style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', minWidth: '140px' }}>
                              {/* View Game Button */}
                              <ActionButton 
                                onClick={() => window.location.href = `/battle-royale/${game.id}`}
                                style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)' }}
                              >
                                👁️ View Game
                              </ActionButton>

                              {/* Withdraw Creator Funds */}
                              {game.status === 'complete' || game.status === 'completed' && game.completion_tx && !game.creator_funds_withdrawn && (
                                <ActionButton
                                  onClick={async () => {
                                    try {
                                      showInfo('Withdrawing creator funds...');
                                      const result = await contractService.withdrawBattleRoyaleCreatorFunds(game.id);
                                      if (result.success) {
                                        showSuccess('Creator funds withdrawn successfully!');
                                        // Reload games
                                        const createdResp = await fetch(`/api/users/${targetAddress}/created-games`);
                                        if (createdResp.ok) {
                                          const createdData = await createdResp.json();
                                          setCreatedBattleRoyales(createdData.games || []);
                                        }
                                      } else {
                                        showError(result.error || 'Failed to withdraw funds');
                                      }
                                    } catch (error) {
                                      console.error('Withdraw funds error:', error);
                                      showError(error.message || 'Failed to withdraw funds');
                                    }
                                  }}
                                  style={{ background: 'linear-gradient(135deg, #00c853, #00e676)' }}
                                >
                                  💰 Withdraw Funds
                                </ActionButton>
                              )}

                              {/* Reclaim NFT (for cancelled games) */}
                              {game.status === 'cancelled' && !game.nft_withdrawn && (
                                <ActionButton
                                  onClick={async () => {
                                    try {
                                      showInfo('Reclaiming NFT...');
                                      const result = await contractService.reclaimBattleRoyaleNFT(game.id);
                                      if (result.success) {
                                        showSuccess('NFT reclaimed successfully!');
                                        // Reload games
                                        const createdResp = await fetch(`/api/users/${targetAddress}/created-games`);
                                        if (createdResp.ok) {
                                          const createdData = await createdResp.json();
                                          setCreatedBattleRoyales(createdData.games || []);
                                        }
                                      } else {
                                        showError(result.error || 'Failed to reclaim NFT');
                                      }
                                    } catch (error) {
                                      console.error('Reclaim NFT error:', error);
                                      showError(error.message || 'Failed to reclaim NFT');
                                    }
                                  }}
                                  style={{ background: 'linear-gradient(135deg, #ff9800, #ff5722)' }}
                                >
                                  🎨 Reclaim NFT
                                </ActionButton>
                              )}

                              {game.creator_funds_withdrawn && (
                                <div style={{ fontSize: '0.75rem', color: '#00FF41', textAlign: 'center' }}>
                                  ✅ Funds Withdrawn
                                </div>
                              )}
                              {game.nft_withdrawn && (
                                <div style={{ fontSize: '0.75rem', color: '#00FF41', textAlign: 'center' }}>
                                  ✅ NFT Reclaimed
                                </div>
                              )}
                            </GameActions>
                          </div>
                        </GameHeader>
                      </GameCard>
                    ))}
                  </div>
                )}

                {/* Participated Games Section */}
                <h4 style={{ color: '#00ffff', marginTop: '1.5rem', marginBottom: '1rem', fontSize: '1.2rem' }}>
                  🎮 Games I Joined ({participatedBattleRoyales.length})
                </h4>
                
                {participatedBattleRoyales.length === 0 ? (
                  <EmptyState>
                    <Gamepad2 style={{ width: '3rem', height: '3rem', color: 'rgba(255, 255, 255, 0.3)', marginBottom: '0.5rem' }} />
                    <div>No games joined yet</div>
                  </EmptyState>
                ) : (
                  <div>
                    {participatedBattleRoyales.map((game) => {
                      const isWinner = game.winner_address?.toLowerCase() === targetAddress?.toLowerCase();
                      const playerStatus = game.player_status;
                      
                      return (
                        <GameCard key={game.id} style={{ marginBottom: '1rem' }}>
                          <GameHeader>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', width: '100%' }}>
                              {/* NFT Image */}
                              <img 
                                src={game.nft_image} 
                                alt={game.nft_name}
                                style={{
                                  width: '80px',
                                  height: '80px',
                                  borderRadius: '8px',
                                  objectFit: 'cover',
                                  border: `2px solid ${isWinner ? '#FFD700' : 'rgba(0, 255, 255, 0.5)'}`
                                }}
                              />
                              
                              {/* Game Info */}
                              <GameInfo style={{ flex: 1, minWidth: '200px' }}>
                                <div style={{ fontSize: '1rem', fontWeight: 'bold', color: '#00ffff', marginBottom: '0.3rem' }}>
                                  {game.nft_name || 'Unnamed NFT'}
                                </div>
                                <div style={{ fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.7)', marginBottom: '0.3rem' }}>
                                  {game.nft_collection || 'Unknown Collection'}
                                </div>
                                <div style={{ fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.6)' }}>
                                  Entry Paid: {game.entry_fee ? `${game.entry_fee} ETH` : 'Free'}
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                                  <StatusBadge status={game.status}>
                                    {game.status === 'filling' ? '⏳ Waiting' : 
                                     game.status === 'active' ? '🎮 Playing' :
                                     game.status === 'complete' || game.status === 'completed' ? '✅ Complete' :
                                     game.status === 'cancelled' ? '❌ Cancelled' : game.status}
                                  </StatusBadge>
                                  {isWinner && (
                                    <StatusBadge status="complete" style={{ background: 'linear-gradient(135deg, #FFD700, #FFA500)' }}>
                                      🏆 WINNER
                                    </StatusBadge>
                                  )}
                                  {playerStatus === 'eliminated' && (
                                    <StatusBadge status="cancelled">
                                      💀 Eliminated R{game.eliminated_round}
                                    </StatusBadge>
                                  )}
                                </div>
                              </GameInfo>

                              {/* Actions */}
                              <GameActions style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', minWidth: '140px' }}>
                                {/* View Game Button */}
                                <ActionButton 
                                  onClick={() => window.location.href = `/battle-royale/${game.id}`}
                                  style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)' }}
                                >
                                  👁️ View Game
                                </ActionButton>

                                {/* Withdraw NFT (for winners) */}
                                {isWinner && game.status === 'complete' || game.status === 'completed' && game.completion_tx && !game.nft_withdrawn && (
                                  <ActionButton
                                    onClick={async () => {
                                      try {
                                        showInfo('Claiming NFT prize...');
                                        const result = await contractService.withdrawBattleRoyaleWinnerNFT(game.id);
                                        if (result.success) {
                                          // Update database to mark NFT as claimed
                                          try {
                                            await fetch(`/api/battle-royale/${game.id}/mark-nft-claimed`, {
                                              method: 'POST',
                                              headers: { 'Content-Type': 'application/json' },
                                              body: JSON.stringify({
                                                winner: address,
                                                transactionHash: result.transactionHash
                                              })
                                            });
                                          } catch (dbError) {
                                            console.warn('DB update failed:', dbError);
                                          }
                                          showSuccess('NFT claimed successfully! 🎉');
                                          // Reload games
                                          const participatedResp = await fetch(`/api/users/${targetAddress}/participated-games`);
                                          if (participatedResp.ok) {
                                            const participatedData = await participatedResp.json();
                                            setParticipatedBattleRoyales(participatedData.games || []);
                                          }
                                        } else {
                                          showError(result.error || 'Failed to claim NFT');
                                        }
                                      } catch (error) {
                                        console.error('Claim NFT error:', error);
                                        showError(error.message || 'Failed to claim NFT');
                                      }
                                    }}
                                    style={{ background: 'linear-gradient(135deg, #FFD700, #FFA500)' }}
                                  >
                                    🏆 Claim NFT
                                  </ActionButton>
                                )}

                                {isWinner && game.nft_withdrawn && (
                                  <div style={{ fontSize: '0.75rem', color: '#FFD700', textAlign: 'center' }}>
                                    ✅ NFT Claimed
                                  </div>
                                )}
                              </GameActions>
                            </div>
                          </GameHeader>
                        </GameCard>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </TabContent>
    </ProfileContainer>
  );
};

export default Profile; 