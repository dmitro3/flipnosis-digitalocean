import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { User, Gamepad2, Trophy, TrendingUp, Image, Coins, Clock, AlertCircle, ExternalLink, Copy, CheckCircle, X, Bell, BellOff, Settings, Zap, Edit, Save, Upload } from 'lucide-react'
import styled from '@emotion/styled'
import contractService from '../services/ContractService'

// Styled Components
const ProfileButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: rgba(0, 0, 0, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 1rem;
  padding: 0.5rem 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  color: #fff;

  &:hover {
    background: rgba(0, 0, 0, 0.8);
    border-color: rgba(0, 191, 255, 0.3);
    box-shadow: 0 0 15px rgba(0, 191, 255, 0.2);
  }
`

const Badge = styled.div`
  position: absolute;
  top: -0.5rem;
  right: -0.5rem;
  background: linear-gradient(45deg, #00BFFF, #1E90FF);
  color: white;
  font-size: 0.75rem;
  font-weight: bold;
  border-radius: 50%;
  width: 1.25rem;
  height: 1.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 10px rgba(0, 191, 255, 0.4);
`

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
`

const ModalContent = styled.div`
  background: rgba(0, 0, 0, 0.9);
  border: 1px solid rgba(0, 191, 255, 0.3);
  border-radius: 1rem;
  width: 90%;
  max-width: 800px;
  max-height: 90vh;
  overflow: hidden;
  position: relative;
  box-shadow: 0 0 30px rgba(0, 191, 255, 0.2);
`

const ModalHeader = styled.div`
  background: linear-gradient(45deg, #00BFFF, #1E90FF);
  padding: 1.5rem;
  border-radius: 1rem 1rem 0 0;
  position: relative;
`

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
`

const TabContainer = styled.div`
  display: flex;
  margin-top: 1rem;
  border-bottom: 2px solid rgba(255, 255, 255, 0.2);
`

const TabButton = styled.button`
  flex: 1;
  padding: 1rem;
  background: ${props => props.active ? 'rgba(255, 255, 255, 0.2)' : 'transparent'};
  border: none;
  color: ${props => props.active ? '#fff' : 'rgba(255, 255, 255, 0.7)'};
  font-size: 1.1rem;
  font-weight: ${props => props.active ? 'bold' : 'normal'};
  cursor: pointer;
  transition: all 0.3s ease;
  border-bottom: ${props => props.active ? '2px solid #fff' : 'none'};
  margin-bottom: -2px;
  position: relative;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }
`

const TabBadge = styled.div`
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  background: linear-gradient(45deg, #00BFFF, #1E90FF);
  color: white;
  font-size: 0.75rem;
  font-weight: bold;
  border-radius: 50%;
  width: 1.25rem;
  height: 1.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 10px rgba(0, 191, 255, 0.4);
`

const ModalBody = styled.div`
  padding: 2rem;
  overflow-y: auto;
  max-height: calc(90vh - 200px);
`

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
`

const StatCard = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(0, 191, 255, 0.2);
  border-radius: 1rem;
  padding: 1.5rem;
  transition: all 0.3s ease;

  &:hover {
    border-color: rgba(0, 191, 255, 0.4);
    box-shadow: 0 0 15px rgba(0, 191, 255, 0.2);
    transform: translateY(-2px);
  }
`

const StatLabel = styled.div`
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`

const StatValue = styled.div`
  color: #fff;
  font-size: 2rem;
  font-weight: bold;
  ${props => props.color && `color: ${props.color};`}
`

const CoinImagesGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 2rem;
`

const CoinImageCard = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(0, 191, 255, 0.2);
  border-radius: 1rem;
  padding: 1rem;
  transition: all 0.3s ease;

  &:hover {
    border-color: rgba(0, 191, 255, 0.4);
    box-shadow: 0 0 15px rgba(0, 191, 255, 0.2);
  }
`

const CoinImage = styled.img`
  width: 100%;
  height: 8rem;
  object-fit: cover;
  border-radius: 0.5rem;
  border: 2px solid rgba(0, 191, 255, 0.3);
  aspect-ratio: 1;
`

const CoinImagePlaceholder = styled.div`
  width: 100%;
  height: 8rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid rgba(0, 191, 255, 0.3);
  color: rgba(255, 255, 255, 0.5);
  aspect-ratio: 1;
`

const GameCard = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(0, 191, 255, 0.2);
  border-radius: 1rem;
  padding: 1.5rem;
  margin-bottom: 1rem;
  transition: all 0.3s ease;

  &:hover {
    border-color: rgba(0, 191, 255, 0.4);
    box-shadow: 0 0 15px rgba(0, 191, 255, 0.2);
    transform: translateY(-2px);
  }
`

const GameHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
`

const GameInfo = styled.div`
  flex: 1;
`

const GameActions = styled.div`
  display: flex;
  gap: 0.5rem;
`

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
`

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
`

const TimeBadge = styled.span`
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.8rem;
  font-weight: bold;
  background: rgba(255, 152, 0, 0.2);
  color: #FF9800;
  border: 1px solid rgba(255, 152, 0, 0.3);
`

const WarningCard = styled.div`
  background: rgba(244, 67, 54, 0.1);
  border: 1px solid rgba(244, 67, 54, 0.3);
  border-radius: 1rem;
  padding: 1rem;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #F44336;
`

const BadgeContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1rem;
`

const InfoBadge = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 1rem;
  font-size: 0.9rem;
  font-weight: bold;
  background: rgba(0, 191, 255, 0.1);
  color: #00BFFF;
  border: 1px solid rgba(0, 191, 255, 0.3);
`

const ControlButton = styled.button`
  background: ${props => props.active ? 'linear-gradient(45deg, #4CAF50, #45a049)' : 'rgba(255, 255, 255, 0.1)'};
  border: 1px solid ${props => props.active ? 'rgba(76, 175, 80, 0.3)' : 'rgba(255, 255, 255, 0.2)'};
  border-radius: 0.5rem;
  padding: 0.75rem;
  color: ${props => props.active ? '#fff' : 'rgba(255, 255, 255, 0.7)'};
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    transform: scale(1.05);
    box-shadow: 0 0 15px ${props => props.active ? 'rgba(76, 175, 80, 0.4)' : 'rgba(255, 255, 255, 0.2)'};
  }
`

const EmptyState = styled.div`
  text-align: center;
  padding: 3rem;
  color: rgba(255, 255, 255, 0.7);
`

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
`

const ProfileWithNotifications = ({ address, isConnected, currentChain }) => {
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState({
    name: '',
    avatar: '',
    headsImage: '',
    tailsImage: '',
    stats: {
      totalGames: 0,
      gamesWon: 0,
      gamesLost: 0,
      winRate: 0,
      totalVolume: 0,
    }
  })
  const [activeGames, setActiveGames] = useState([])
  const [showProfile, setShowProfile] = useState(false)
  const [activeTab, setActiveTab] = useState('profile')
  const [notificationsEnabled, setNotificationsEnabled] = useState(false)
  const [autoCancelEnabled, setAutoCancelEnabled] = useState(true)
  const [gameBadges, setGameBadges] = useState([])
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [tempName, setTempName] = useState('')
  const [tempAvatar, setTempAvatar] = useState('')
  const [tempHeads, setTempHeads] = useState('')
  const [tempTails, setTempTails] = useState('')
  const [countdownTimer, setCountdownTimer] = useState(0)
  const [gameJoinNotifications, setGameJoinNotifications] = useState(0)

  const MAX_ACTIVE_GAMES = 5
  const AUTO_CANCEL_HOURS = 3

  const API_URL = 'https://cryptoflipz2-production.up.railway.app'

  // Request notification permission
  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission()
      setNotificationsEnabled(permission === 'granted')
      return permission === 'granted'
    }
    return false
  }

  // Send browser notification
  const sendNotification = (title, options = {}) => {
    if (notificationsEnabled && 'Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        icon: '/logo.png',
        badge: '/logo.png',
        ...options
      })
    }
  }

  // Check and update game badges
  const updateGameBadges = (games) => {
    const badges = []
    
    if (games.length >= MAX_ACTIVE_GAMES) {
      badges.push({
        type: 'limit',
        title: 'Game Limit Reached',
        description: `Maximum ${MAX_ACTIVE_GAMES} active games`,
        color: 'text-red-500',
        icon: AlertCircle
      })
    }
    
    if (games.length > 0) {
      badges.push({
        type: 'active',
        title: `${games.length} Active Games`,
        description: 'You have ongoing games',
        color: 'text-blue-500',
        icon: Gamepad2
      })
    }
    
    const expiringGames = games.filter(game => {
      const createdAt = new Date(game.createdAt || Date.now())
      const hoursSinceCreation = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60)
      return hoursSinceCreation >= AUTO_CANCEL_HOURS - 0.5 // 30 min warning
    })
    
    if (expiringGames.length > 0) {
      badges.push({
        type: 'expiring',
        title: `${expiringGames.length} Games Expiring Soon`,
        description: 'Games will auto-cancel in 30 minutes',
        color: 'text-orange-500',
        icon: Clock
      })
    }
    
    setGameBadges(badges)
  }

  // Auto-cancel expired games
  const checkAndCancelExpiredGames = async () => {
    const now = Math.floor(Date.now() / 1000) // Current time in seconds
    const expiredGames = activeGames.filter(game => 
      game.core.state === 0 && Number(game.core.expiresAt) <= now
    )

    for (const game of expiredGames) {
      try {
        console.log(`Auto-cancelling expired game ${game.id}`)
        await contractService.cancelGame(game.id)
        sendNotification('Game Auto-Cancelled', {
          body: `Game #${game.id} has been automatically cancelled due to expiration`,
          tag: `game-${game.id}`
        })
      } catch (error) {
        console.error(`Failed to auto-cancel game ${game.id}:`, error)
      }
    }

    // Reload games if any were cancelled
    if (expiredGames.length > 0) {
      loadProfileData()
    }
  }

  // Load profile data
  const loadProfileData = async () => {
    if (!address || !isConnected) return

    setLoading(true)
    try {
      // Load profile data from database
      const response = await fetch(`/api/profile/${address}`)
      if (response.ok) {
        const data = await response.json()
        setProfileData(prev => ({
          ...prev,
          ...data,
          name: data.name || '',
          avatar: data.avatar || '',
          headsImage: data.headsImage || '',
          tailsImage: data.tailsImage || ''
        }))
        setTempName(data.name || '')
        setTempAvatar(data.avatar || '')
        setTempHeads(data.headsImage || '')
        setTempTails(data.tailsImage || '')
      }
    } catch (error) {
      console.error('Failed to load profile data:', error)
    }

    try {
      // Load user's created games from contract
      const response = await fetch(`${API_URL}/api/users/${address}/games`);
      const games = await response.json();
      const gamesData = games.map(game => ({
        id: game.id,
        creator: game.creator,
        joiner: game.joiner,
        core: {
          gameId: game.gameId,
          state: game.state,
          gameType: game.gameType,
          priceUSD: game.priceUSD,
          paymentToken: game.paymentToken,
          totalPaid: game.totalPaid,
          winner: game.winner,
          createdAt: game.createdAt,
          expiresAt: game.expiresAt
        },
        nftChallenge: game.nftChallenge,
        progress: {
          currentRound: 1, // Default values for now
          maxRounds: 1
        },
        createdAt: game.createdAt && !isNaN(Number(game.createdAt)) && Number(game.createdAt) > 0 ? new Date(Number(game.createdAt) * 1000).toISOString() : new Date().toISOString(),
        stake: {
          nftContract: game.nftContract,
          tokenId: game.tokenId.toString(),
          amount: game.priceUSD ? (Number(game.priceUSD) / 1e18).toFixed(4) : '0',
          token: game.gameType === 0 ? 'ETH' : 'NFT'
        }
      }));
      
      setActiveGames(gamesData)
      updateGameBadges(gamesData)
      
      // Check for game join notifications
      checkGameJoinNotifications()
    } catch (error) {
      console.error('Failed to load user games:', error)
      // Fallback to demo data for testing
      const demoGames = [
        {
          id: 1,
          creator: address,
          joiner: '0x0000000000000000000000000000000000000000',
          core: { 
            gameId: '1',
            state: 0, 
            gameType: 0,
            priceUSD: '1000000000000000000',
            paymentToken: 0,
            totalPaid: '0',
            winner: '0x0000000000000000000000000000000000000000',
            createdAt: Math.floor((Date.now() - 2 * 60 * 60 * 1000) / 1000),
            expiresAt: Math.floor((Date.now() + 60 * 60 * 1000) / 1000)
          },
          nftChallenge: {
            challengerNFTContract: '0x0000000000000000000000000000000000000000',
            challengerTokenId: '0'
          },
          progress: { currentRound: 1, maxRounds: 3 },
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
          stake: { 
            nftContract: '0x0000000000000000000000000000000000000000',
            tokenId: '1',
            amount: '0.1', 
            token: 'ETH' 
          }
        },
        {
          id: 2,
          creator: address,
          joiner: '0x0000000000000000000000000000000000000000',
          core: { 
            gameId: '2',
            state: 0, 
            gameType: 1,
            priceUSD: '0',
            paymentToken: 0,
            totalPaid: '0',
            winner: '0x0000000000000000000000000000000000000000',
            createdAt: Math.floor((Date.now() - 1 * 60 * 60 * 1000) / 1000),
            expiresAt: Math.floor((Date.now() + 2 * 60 * 60 * 1000) / 1000)
          },
          nftChallenge: {
            challengerNFTContract: '0x0000000000000000000000000000000000000000',
            challengerTokenId: '0'
          },
          progress: { currentRound: 1, maxRounds: 1 },
          createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // 1 hour ago
          stake: { 
            nftContract: '0x1234567890123456789012345678901234567890',
            tokenId: '123',
            amount: '0', 
            token: 'NFT' 
          }
        }
      ]
      setActiveGames(demoGames)
      updateGameBadges(demoGames)
    }

    setLoading(false)
  }

  useEffect(() => {
    loadProfileData()
    
    // Check for expired games every 5 minutes
    const interval = setInterval(checkAndCancelExpiredGames, 5 * 60 * 1000)
    
    return () => clearInterval(interval)
  }, [address, isConnected])

  // Initialize notifications on mount
  useEffect(() => {
    if ('Notification' in window) {
      setNotificationsEnabled(Notification.permission === 'granted')
    }
  }, [])

  // Copy address
  const copyAddress = () => {
    navigator.clipboard.writeText(address)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Format address
  const formatAddress = (addr) => {
    if (!addr) return ''
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  // Get game status text
  const getGameStatusText = (state) => {
    switch (state) {
      case 0: return 'Waiting for Player'
      case 1: return 'Player Joined'
      case 2: return 'In Progress'
      case 3: return 'Completed'
      case 4: return 'Expired'
      case 5: return 'Cancelled'
      default: return 'Unknown'
    }
  }

  // Get time until auto-cancel
  const getTimeUntilCancel = (createdAt) => {
    // createdAt is now a timestamp from the contract (in seconds)
    const expiresAt = new Date(Number(createdAt) * 1000) // Convert to milliseconds
    const now = new Date()
    const timeLeft = expiresAt.getTime() - now.getTime()
    
    if (timeLeft <= 0) {
      return 'Expired'
    }
    
    const hours = Math.floor(timeLeft / (1000 * 60 * 60))
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60))
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    } else {
      return `${minutes}m`
    }
  }

  const handleImageUpload = async (type, file) => {
    const reader = new FileReader()
    reader.onload = async (e) => {
      const imageData = e.target.result
      
      // Immediately update the UI for instant feedback
      setProfileData(prev => ({
        ...prev,
        [type === 'avatar' ? 'avatar' : type === 'heads' ? 'headsImage' : 'tailsImage']: imageData
      }))
      
      // Update temp state
      switch (type) {
        case 'avatar':
          setTempAvatar(imageData)
          break
        case 'heads':
          setTempHeads(imageData)
          break
        case 'tails':
          setTempTails(imageData)
          break
      }
      
      // Save to database
      try {
        const response = await fetch(`/api/profile/${address}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: profileData.name,
            avatar: type === 'avatar' ? imageData : profileData.avatar,
            headsImage: type === 'heads' ? imageData : profileData.headsImage,
            tailsImage: type === 'tails' ? imageData : profileData.tailsImage
          })
        })

        if (response.ok) {
          console.log(`${type} image uploaded successfully`)
        } else {
          console.error('Failed to save image to database')
        }
      } catch (error) {
        console.error('Error saving image:', error)
      }
    }
    reader.readAsDataURL(file)
  }

  const saveProfileData = async (name) => {
    try {
      const response = await fetch(`/api/profile/${address}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name,
          avatar: profileData.avatar,
          headsImage: profileData.headsImage,
          tailsImage: profileData.tailsImage
        })
      })

      if (response.ok) {
        setProfileData(prev => ({
          ...prev,
          name: name
        }))
      }
    } catch (error) {
      console.error('Failed to save profile data:', error)
    }
  }

  const cancelGame = async (gameId) => {
    try {
      await contractService.cancelGame(gameId)
      sendNotification('Game Cancelled', {
        body: `Game #${gameId} has been cancelled`,
        tag: `game-${gameId}`
      })
      loadProfileData()
    } catch (error) {
      console.error('Failed to cancel game:', error)
    }
  }

  // Check for game join notifications with caching
  const checkGameJoinNotifications = async () => {
    if (!address || !isConnected) return

    // Use cached active games if available to reduce API calls
    if (activeGames.length > 0) {
      let joinCount = 0
      for (const game of activeGames) {
        // Check if user is creator and game has been joined (state 1 or higher)
        if (game.creator.toLowerCase() === address.toLowerCase() && 
            game.core.state >= 1 && 
            game.joiner !== '0x0000000000000000000000000000000000000000') {
          joinCount++
        }
      }
      setGameJoinNotifications(joinCount)
      return
    }

    // Fallback to API call if no cached data
    try {
      const response = await fetch(`${API_URL}/api/users/${address}/games`);
      const games = await response.json();
      let joinCount = 0;
      
      for (const game of games) {
        // Check if user is creator and game has been joined (state 1 or higher)
        if (game.creator.toLowerCase() === address.toLowerCase() && 
            game.state >= 1 && 
            game.joiner !== '0x0000000000000000000000000000000000000000') {
          joinCount++;
        }
      }
      
      setGameJoinNotifications(joinCount)
    } catch (error) {
      console.error('Error checking game join notifications:', error)
    }
  }

  // Check for game join notifications periodically
  useEffect(() => {
    checkGameJoinNotifications()
    
    // Check every 60 seconds for new joins (reduced frequency to avoid rate limits)
    const interval = setInterval(checkGameJoinNotifications, 60000)
    
    return () => clearInterval(interval)
  }, [address, isConnected])

  // Update countdown timer every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCountdownTimer(prev => prev + 1)
      // Check for expired games
      checkAndCancelExpiredGames()
    }, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [activeGames])

  const clearGameJoinNotifications = () => {
    setGameJoinNotifications(0)
  }

  return (
    <>
      {/* Profile Button */}
      <ProfileButton onClick={() => {
        navigate('/profile')
        clearGameJoinNotifications()
      }}>
        {profileData.avatar ? (
          <img 
            src={profileData.avatar} 
            alt="Profile" 
            style={{
              width: '2rem',
              height: '2rem',
              borderRadius: '12px',
              border: '2px solid rgba(0, 191, 255, 0.5)',
              objectFit: 'cover'
            }}
          />
        ) : (
          <User style={{ width: '1.5rem', height: '1.5rem', color: '#00BFFF' }} />
        )}
        <span style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>
          {profileData.name || 'Anonymous Player'}
        </span>
        
        {/* Badge for game join notifications */}
        {gameJoinNotifications > 0 && (
          <Badge>
            {gameJoinNotifications > 9 ? '9+' : gameJoinNotifications}
          </Badge>
        )}
      </ProfileButton>


    </>
  )
}

export default ProfileWithNotifications 