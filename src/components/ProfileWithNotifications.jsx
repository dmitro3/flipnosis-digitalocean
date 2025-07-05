import React, { useState, useEffect } from 'react'
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
    border-color: rgba(255, 20, 147, 0.3);
    box-shadow: 0 0 15px rgba(255, 20, 147, 0.2);
  }
`

const Badge = styled.div`
  position: absolute;
  top: -0.5rem;
  right: -0.5rem;
  background: linear-gradient(45deg, #FF1493, #FF69B4);
  color: white;
  font-size: 0.75rem;
  font-weight: bold;
  border-radius: 50%;
  width: 1.25rem;
  height: 1.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 10px rgba(255, 20, 147, 0.4);
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
  border: 1px solid rgba(255, 20, 147, 0.3);
  border-radius: 1rem;
  width: 90%;
  max-width: 800px;
  max-height: 90vh;
  overflow: hidden;
  position: relative;
  box-shadow: 0 0 30px rgba(255, 20, 147, 0.2);
`

const ModalHeader = styled.div`
  background: linear-gradient(45deg, #FF1493, #FF69B4);
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
  background: linear-gradient(45deg, #FF1493, #FF69B4);
  color: white;
  font-size: 0.75rem;
  font-weight: bold;
  border-radius: 50%;
  width: 1.25rem;
  height: 1.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 10px rgba(255, 20, 147, 0.4);
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
  border: 1px solid rgba(255, 20, 147, 0.2);
  border-radius: 1rem;
  padding: 1.5rem;
  transition: all 0.3s ease;

  &:hover {
    border-color: rgba(255, 20, 147, 0.4);
    box-shadow: 0 0 15px rgba(255, 20, 147, 0.2);
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
  border: 1px solid rgba(255, 20, 147, 0.2);
  border-radius: 1rem;
  padding: 1rem;
  transition: all 0.3s ease;

  &:hover {
    border-color: rgba(255, 20, 147, 0.4);
    box-shadow: 0 0 15px rgba(255, 20, 147, 0.2);
  }
`

const CoinImage = styled.img`
  width: 100%;
  height: 8rem;
  object-fit: cover;
  border-radius: 0.5rem;
  border: 2px solid rgba(255, 20, 147, 0.3);
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
  border: 2px solid rgba(255, 20, 147, 0.3);
  color: rgba(255, 255, 255, 0.5);
  aspect-ratio: 1;
`

const GameCard = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 20, 147, 0.2);
  border-radius: 1rem;
  padding: 1.5rem;
  margin-bottom: 1rem;
  transition: all 0.3s ease;

  &:hover {
    border-color: rgba(255, 20, 147, 0.4);
    box-shadow: 0 0 15px rgba(255, 20, 147, 0.2);
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
  background: ${props => props.variant === 'danger' ? 'linear-gradient(45deg, #FF4444, #CC0000)' : 'linear-gradient(45deg, #FF1493, #FF69B4)'};
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
    box-shadow: 0 0 15px ${props => props.variant === 'danger' ? 'rgba(255, 68, 68, 0.4)' : 'rgba(255, 20, 147, 0.4)'};
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
  background: rgba(255, 20, 147, 0.1);
  color: #FF1493;
  border: 1px solid rgba(255, 20, 147, 0.3);
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
  border: 3px solid rgba(255, 20, 147, 0.3);
  border-radius: 50%;
  border-top-color: #FF1493;
  animation: spin 1s ease-in-out infinite;

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`

const ProfileWithNotifications = ({ address, isConnected, currentChain }) => {
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
      const gamesResponse = await contractService.getUserActiveGames(address)
      const games = []
      
      // Handle the response properly - it returns { success: true, games: [] }
      const gameIds = gamesResponse.success ? gamesResponse.games : []
      
      for (const gameId of gameIds) {
        try {
          const gameDetails = await contractService.getGameDetails(gameId.toString())
          if (gameDetails.success) {
            const { game, nftChallenge } = gameDetails.data
            // Only include games created by this user
            if (game.creator.toLowerCase() === address.toLowerCase()) {
              games.push({
                id: gameId,
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
                nftChallenge: nftChallenge,
                progress: {
                  currentRound: 1, // Default values for now
                  maxRounds: 1
                },
                createdAt: new Date(Number(game.createdAt) * 1000).toISOString(),
                stake: {
                  nftContract: game.nftContract,
                  tokenId: game.tokenId.toString(),
                  amount: game.priceUSD ? (Number(game.priceUSD) / 1e18).toFixed(4) : '0',
                  token: game.gameType === 0 ? 'ETH' : 'NFT'
                }
              })
            }
          }
        } catch (error) {
          console.warn(`Could not get details for game ${gameId}:`, error)
        }
      }
      
      setActiveGames(games)
      updateGameBadges(games)
      
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
      const gamesResponse = await contractService.getUserActiveGames(address)
      let joinCount = 0
      
      // Handle the response properly - it returns { success: true, games: [] }
      const gameIds = gamesResponse.success ? gamesResponse.games : []
      
      for (const gameId of gameIds) {
        try {
          const gameDetails = await contractService.getGameDetails(gameId.toString())
          if (gameDetails.success) {
            const { game } = gameDetails.data
            // Check if user is creator and game has been joined (state 1 or higher)
            if (game.creator.toLowerCase() === address.toLowerCase() && 
                game.state >= 1 && 
                game.joiner !== '0x0000000000000000000000000000000000000000') {
              joinCount++
            }
          }
        } catch (error) {
          console.warn(`Could not get details for game ${gameId}:`, error)
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
        setShowProfile(true)
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
              border: '2px solid rgba(255, 20, 147, 0.5)',
              objectFit: 'cover'
            }}
          />
        ) : (
          <User style={{ width: '1.5rem', height: '1.5rem', color: '#FF1493' }} />
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

      {/* Profile Modal */}
      {showProfile && (
        <Modal>
          <ModalContent>
            <ModalHeader>
              <h2 style={{ color: '#fff', margin: 0, fontSize: '1.5rem', fontWeight: 'bold' }}>
                Player Profile
              </h2>
              <CloseButton onClick={() => setShowProfile(false)}>×</CloseButton>
              
              {/* Tab Navigation */}
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
                  My Games
                  {activeGames.length > 0 && (
                    <TabBadge>
                      {activeGames.length > 9 ? '9+' : activeGames.length}
                    </TabBadge>
                  )}
                </TabButton>
              </TabContainer>
            </ModalHeader>

            <ModalBody>
              {activeTab === 'profile' ? (
                <>
                  {/* Profile Info */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '2rem' }}>
                    <div style={{ position: 'relative' }}>
                      <div
                        onClick={() => {
                          const input = document.createElement('input')
                          input.type = 'file'
                          input.accept = 'image/*'
                          input.onchange = (e) => {
                            if (e.target.files[0]) {
                              handleImageUpload('avatar', e.target.files[0])
                            }
                          }
                          input.click()
                        }}
                        style={{
                          cursor: 'pointer',
                          position: 'relative',
                          borderRadius: '12px',
                          overflow: 'hidden'
                        }}
                      >
                        {profileData.avatar ? (
                          <img 
                            src={profileData.avatar} 
                            alt="Profile" 
                            style={{
                              width: '6rem',
                              height: '6rem',
                              borderRadius: '12px',
                              border: '4px solid rgba(255, 20, 147, 0.5)',
                              objectFit: 'cover',
                              transition: 'all 0.3s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.target.style.transform = 'scale(1.05)'
                              e.target.style.borderColor = 'rgba(255, 20, 147, 0.8)'
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.transform = 'scale(1)'
                              e.target.style.borderColor = 'rgba(255, 20, 147, 0.5)'
                            }}
                          />
                        ) : (
                          <div style={{
                            width: '6rem',
                            height: '6rem',
                            borderRadius: '12px',
                            background: 'rgba(255, 255, 255, 0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: '4px solid rgba(255, 20, 147, 0.5)',
                            transition: 'all 0.3s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.background = 'rgba(255, 255, 255, 0.2)'
                            e.target.style.borderColor = 'rgba(255, 20, 147, 0.8)'
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.background = 'rgba(255, 255, 255, 0.1)'
                            e.target.style.borderColor = 'rgba(255, 20, 147, 0.5)'
                          }}
                          >
                            <User style={{ width: '3rem', height: '3rem', color: '#FF1493' }} />
                          </div>
                        )}
                        {/* Upload overlay */}
                        <div style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          background: 'rgba(0, 0, 0, 0.5)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: '12px',
                          opacity: 0,
                          transition: 'opacity 0.3s ease',
                          pointerEvents: 'none'
                        }}
                        className="upload-overlay"
                        >
                          <Upload style={{ width: '1.5rem', height: '1.5rem', color: '#fff' }} />
                        </div>
                      </div>
                      <style jsx>{`
                        div[style*="cursor: pointer"]:hover .upload-overlay {
                          opacity: 1 !important;
                        }
                      `}</style>
                    </div>
                    
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <input
                          type="text"
                          value={profileData.name || ''}
                          onChange={(e) => {
                            const newName = e.target.value
                            setProfileData(prev => ({ ...prev, name: newName }))
                            setTempName(newName)
                            // Auto-save after a short delay
                            clearTimeout(window.nameSaveTimeout)
                            window.nameSaveTimeout = setTimeout(() => {
                              saveProfileData(newName)
                            }, 1000)
                          }}
                          style={{
                            background: 'rgba(255, 255, 255, 0.1)',
                            border: '1px solid rgba(255, 20, 147, 0.5)',
                            borderRadius: '0.5rem',
                            padding: '0.5rem',
                            color: '#fff',
                            fontSize: '1.5rem',
                            fontWeight: 'bold',
                            width: '100%',
                            maxWidth: '300px'
                          }}
                          placeholder="Name"
                        />
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <code style={{
                          color: 'rgba(255, 255, 255, 0.7)',
                          background: 'rgba(255, 255, 255, 0.1)',
                          padding: '0.5rem 1rem',
                          borderRadius: '0.5rem',
                          fontFamily: 'monospace',
                          fontSize: '0.9rem'
                        }}>
                          {address}
                        </code>
                        <button
                          onClick={copyAddress}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'rgba(255, 255, 255, 0.7)',
                            cursor: 'pointer',
                            padding: '0.5rem'
                          }}
                        >
                          {copied ? <CheckCircle style={{ width: '1rem', height: '1rem', color: '#4CAF50' }} /> : <Copy style={{ width: '1rem', height: '1rem' }} />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Coin Images */}
                  <div style={{ marginBottom: '2rem' }}>
                    <h4 style={{ color: '#fff', fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '1rem' }}>
                      Custom Coin Designs
                    </h4>
                    <CoinImagesGrid>
                      <CoinImageCard>
                        <h5 style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Heads</h5>
                        <div
                          onClick={() => {
                            const input = document.createElement('input')
                            input.type = 'file'
                            input.accept = 'image/*'
                            input.onchange = (e) => {
                              if (e.target.files[0]) {
                                handleImageUpload('heads', e.target.files[0])
                              }
                            }
                            input.click()
                          }}
                          style={{
                            cursor: 'pointer',
                            position: 'relative',
                            borderRadius: '0.5rem',
                            overflow: 'hidden'
                          }}
                        >
                          {profileData.headsImage ? (
                            <CoinImage 
                              src={profileData.headsImage} 
                              alt="Heads"
                              style={{
                                transition: 'all 0.3s ease'
                              }}
                              onMouseEnter={(e) => {
                                e.target.style.transform = 'scale(1.05)'
                                e.target.style.borderColor = 'rgba(255, 20, 147, 0.8)'
                              }}
                              onMouseLeave={(e) => {
                                e.target.style.transform = 'scale(1)'
                                e.target.style.borderColor = 'rgba(255, 20, 147, 0.3)'
                              }}
                            />
                          ) : (
                            <CoinImagePlaceholder
                              style={{
                                transition: 'all 0.3s ease'
                              }}
                              onMouseEnter={(e) => {
                                e.target.style.background = 'rgba(255, 255, 255, 0.2)'
                                e.target.style.borderColor = 'rgba(255, 20, 147, 0.8)'
                              }}
                              onMouseLeave={(e) => {
                                e.target.style.background = 'rgba(255, 255, 255, 0.1)'
                                e.target.style.borderColor = 'rgba(255, 20, 147, 0.3)'
                              }}
                            >
                              <Image style={{ width: '2rem', height: '2rem' }} />
                            </CoinImagePlaceholder>
                          )}
                          {/* Upload overlay */}
                          <div style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background: 'rgba(0, 0, 0, 0.5)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: '0.5rem',
                            opacity: 0,
                            transition: 'opacity 0.3s ease',
                            pointerEvents: 'none'
                          }}
                          className="upload-overlay"
                          >
                            <Upload style={{ width: '1rem', height: '1rem', color: '#fff' }} />
                          </div>
                        </div>
                      </CoinImageCard>
                      
                      <CoinImageCard>
                        <h5 style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Tails</h5>
                        <div
                          onClick={() => {
                            const input = document.createElement('input')
                            input.type = 'file'
                            input.accept = 'image/*'
                            input.onchange = (e) => {
                              if (e.target.files[0]) {
                                handleImageUpload('tails', e.target.files[0])
                              }
                            }
                            input.click()
                          }}
                          style={{
                            cursor: 'pointer',
                            position: 'relative',
                            borderRadius: '0.5rem',
                            overflow: 'hidden'
                          }}
                        >
                          {profileData.tailsImage ? (
                            <CoinImage 
                              src={profileData.tailsImage} 
                              alt="Tails"
                              style={{
                                transition: 'all 0.3s ease'
                              }}
                              onMouseEnter={(e) => {
                                e.target.style.transform = 'scale(1.05)'
                                e.target.style.borderColor = 'rgba(255, 20, 147, 0.8)'
                              }}
                              onMouseLeave={(e) => {
                                e.target.style.transform = 'scale(1)'
                                e.target.style.borderColor = 'rgba(255, 20, 147, 0.3)'
                              }}
                            />
                          ) : (
                            <CoinImagePlaceholder
                              style={{
                                transition: 'all 0.3s ease'
                              }}
                              onMouseEnter={(e) => {
                                e.target.style.background = 'rgba(255, 255, 255, 0.2)'
                                e.target.style.borderColor = 'rgba(255, 20, 147, 0.8)'
                              }}
                              onMouseLeave={(e) => {
                                e.target.style.background = 'rgba(255, 255, 255, 0.1)'
                                e.target.style.borderColor = 'rgba(255, 20, 147, 0.3)'
                              }}
                            >
                              <Image style={{ width: '2rem', height: '2rem' }} />
                            </CoinImagePlaceholder>
                          )}
                          {/* Upload overlay */}
                          <div style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background: 'rgba(0, 0, 0, 0.5)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: '0.5rem',
                            opacity: 0,
                            transition: 'opacity 0.3s ease',
                            pointerEvents: 'none'
                          }}
                          className="upload-overlay"
                          >
                            <Upload style={{ width: '1rem', height: '1rem', color: '#fff' }} />
                          </div>
                        </div>
                      </CoinImageCard>
                    </CoinImagesGrid>
                  </div>
                </>
              ) : (
                <>
                  {/* My Games Tab */}
                  <div style={{ marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                      <h3 style={{ color: '#fff', fontSize: '1.5rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Gamepad2 style={{ width: '1.5rem', height: '1.5rem', color: '#FF1493' }} />
                        My Games
                      </h3>
                    </div>

                    {/* Game Limit Warning */}
                    {activeGames.length >= MAX_ACTIVE_GAMES && (
                      <WarningCard>
                        <AlertCircle style={{ width: '1.25rem', height: '1.25rem' }} />
                        <div>
                          <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>Game Limit Reached</div>
                          <div style={{ fontSize: '0.9rem' }}>
                            You have reached the maximum of {MAX_ACTIVE_GAMES} active games. 
                            Cancel some games to create new ones.
                          </div>
                        </div>
                      </WarningCard>
                    )}

                    {/* Game Badges */}
                    {gameBadges.length > 0 && (
                      <BadgeContainer>
                        {gameBadges.map((badge, index) => (
                          <InfoBadge key={index}>
                            <badge.icon style={{ width: '1rem', height: '1rem' }} />
                            {badge.title}
                          </InfoBadge>
                        ))}
                      </BadgeContainer>
                    )}

                    {/* Games List */}
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
                                  <StatusBadge status={game.core.state}>
                                    {getGameStatusText(game.core.state)}
                                  </StatusBadge>
                                  {game.core.state === 0 && (
                                    <TimeBadge>
                                      {getTimeUntilCancel(game.core.expiresAt)}
                                    </TimeBadge>
                                  )}
                                </div>
                                <div style={{ fontSize: '0.9rem', color: 'rgba(255, 255, 255, 0.7)', marginBottom: '0.5rem' }}>
                                  {game.core.gameType === 0 ? 'NFT vs Crypto' : 'NFT vs NFT'} • 
                                  Round {game.progress.currentRound}/{game.progress.maxRounds}
                                </div>
                                <div style={{ fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.5)' }}>
                                  Created {new Date(Number(game.core.createdAt) * 1000).toLocaleString()}
                                </div>
                              </GameInfo>
                              <GameActions>
                                {game.core.state === 0 && (
                                  <ActionButton
                                    variant="danger"
                                    onClick={() => cancelGame(game.id)}
                                  >
                                    <X style={{ width: '1rem', height: '1rem' }} />
                                    Cancel
                                  </ActionButton>
                                )}
                                <ActionButton as="a" href={`/game/${game.id}`}>
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
                </>
              )}
            </ModalBody>
          </ModalContent>
        </Modal>
      )}
    </>
  )
}

export default ProfileWithNotifications 