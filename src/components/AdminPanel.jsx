import React, { useState, useEffect } from 'react'
import { Calendar, Activity, DollarSign, Users, Shield, Settings, Search, ChevronDown, ChevronUp, Wallet, TrendingUp, AlertCircle, CheckCircle, XCircle, RefreshCw, Send, Eye, User, Coins, Image, BarChart3, Gamepad2, Crown, Zap, Download, Package } from 'lucide-react'
import styled from '@emotion/styled'
import { useWalletConnection } from '../utils/useWalletConnection'
import { useWallet } from '../contexts/WalletContext'
import contractService from '../services/ContractService'
import { ConnectButton as RainbowConnectButton } from '@rainbow-me/rainbowkit'
import EmergencyRecovery from './EmergencyRecovery'

// Contract ABI - Full ABI matching the NFTFlipGame contract
const CONTRACT_ABI = [
  // Events
  {
    name: 'GameCreated',
    type: 'event',
    anonymous: false,
    inputs: [
      { indexed: true, name: 'gameId', type: 'uint256' },
      { indexed: true, name: 'creator', type: 'address' },
      { indexed: true, name: 'gameType', type: 'uint8' }
    ]
  },
  {
    name: 'GameJoined',
    type: 'event',
    anonymous: false,
    inputs: [
      { indexed: true, name: 'gameId', type: 'uint256' },
      { indexed: true, name: 'joiner', type: 'address' }
    ]
  },
  {
    name: 'GameCompleted',
    type: 'event',
    anonymous: false,
    inputs: [
      { indexed: true, name: 'gameId', type: 'uint256' },
      { indexed: true, name: 'winner', type: 'address' }
    ]
  },
  {
    name: 'GameCancelled',
    type: 'event',
    anonymous: false,
    inputs: [
      { indexed: true, name: 'gameId', type: 'uint256' }
    ]
  },
  {
    name: 'RewardsWithdrawn',
    type: 'event',
    anonymous: false,
    inputs: [
      { indexed: true, name: 'player', type: 'address' },
      { indexed: false, name: 'ethAmount', type: 'uint256' },
      { indexed: false, name: 'usdcAmount', type: 'uint256' }
    ]
  },
  {
    name: 'NFTWithdrawn',
    type: 'event',
    anonymous: false,
    inputs: [
      { indexed: true, name: 'player', type: 'address' },
      { indexed: true, name: 'nftContract', type: 'address' },
      { indexed: false, name: 'tokenId', type: 'uint256' }
    ]
  },
  // Functions
  {
    name: 'nextGameId',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }]
  },
  {
    name: 'games',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'gameId', type: 'uint256' }],
    outputs: [
      { name: 'gameId', type: 'uint256' },
      { name: 'creator', type: 'address' },
      { name: 'joiner', type: 'address' },
      { name: 'nftContract', type: 'address' },
      { name: 'tokenId', type: 'uint256' },
      { name: 'state', type: 'uint8' },
      { name: 'gameType', type: 'uint8' },
      { name: 'priceUSD', type: 'uint256' },
      { name: 'paymentToken', type: 'uint8' },
      { name: 'totalPaid', type: 'uint256' },
      { name: 'winner', type: 'address' },
      { name: 'createdAt', type: 'uint256' },
      { name: 'expiresAt', type: 'uint256' }
    ]
  },
  {
    name: 'getGameDetails',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'gameId', type: 'uint256' }],
    outputs: [
      {
        name: '',
        type: 'tuple',
        components: [
          { name: 'gameId', type: 'uint256' },
          { name: 'creator', type: 'address' },
          { name: 'joiner', type: 'address' },
          { name: 'nftContract', type: 'address' },
          { name: 'tokenId', type: 'uint256' },
          { name: 'state', type: 'uint8' },
          { name: 'gameType', type: 'uint8' },
          { name: 'priceUSD', type: 'uint256' },
          { name: 'paymentToken', type: 'uint8' },
          { name: 'totalPaid', type: 'uint256' },
          { name: 'winner', type: 'address' },
          { name: 'createdAt', type: 'uint256' },
          { name: 'expiresAt', type: 'uint256' }
        ]
      },
      {
        name: '',
        type: 'tuple',
        components: [
          { name: 'challengerNFTContract', type: 'address' },
          { name: 'challengerTokenId', type: 'uint256' }
        ]
      }
    ]
  },
  {
    name: 'emergencyWithdrawNFT',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'nftContract', type: 'address' },
      { name: 'tokenId', type: 'uint256' },
      { name: 'to', type: 'address' }
    ],
    outputs: []
  },
  {
    name: 'adminBatchWithdrawNFTs',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'nftContracts', type: 'address[]' },
      { name: 'tokenIds', type: 'uint256[]' },
      { name: 'recipients', type: 'address[]' }
    ],
    outputs: []
  },
  {
    name: 'getExpiredGames',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'startIndex', type: 'uint256' },
      { name: 'count', type: 'uint256' }
    ],
    outputs: [{ name: '', type: 'uint256[]' }]
  },
  {
    name: 'listingFeeUSD',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }]
  },
  {
    name: 'platformFeePercent',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }]
  },
  {
    name: 'setListingFee',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'newFee', type: 'uint256' }],
    outputs: []
  },
  {
    name: 'setPlatformFee',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'newPercent', type: 'uint256' }],
    outputs: []
  }
]

// Contract addresses for different chains
const CONTRACT_ADDRESSES = {
              'base': '0x6cB1E31F2A3df57A7265ED2eE26dcF8D02CE1B69', // Base contract address
  'ethereum': '0x...',
  'bnb': '0x...',
  'avalanche': '0x...',
  'polygon': '0x...'
}

// Chain configurations
const CHAIN_CONFIGS = {
  'base': { id: 8453, name: 'Base', rpc: 'https://base.blockpi.network/v1/rpc/public', symbol: 'ETH', color: '#0052FF' },
  'ethereum': { id: 1, name: 'Ethereum', rpc: 'https://eth.llamarpc.com', symbol: 'ETH', color: '#627EEA' },
  'bnb': { id: 56, name: 'BNB Chain', rpc: 'https://bsc-dataseed.binance.org/', symbol: 'BNB', color: '#F3BA2F' },
  'avalanche': { id: 43114, name: 'Avalanche', rpc: 'https://api.avax.network/ext/bc/C/rpc', symbol: 'AVAX', color: '#E84142' },
  'polygon': { id: 137, name: 'Polygon', rpc: 'https://polygon-rpc.com/', symbol: 'MATIC', color: '#8247E5' }
}

// Admin wallet address (update this)
const ADMIN_WALLET = '0x47d80671Bcb7Ec368ef4d3ca6E1C20173CCc9a28' // Admin wallet address

// Styled Components
const AdminContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0d0d0d 100%);
  color: #ffffff;
  padding: 2rem;
  font-family: 'Inter', sans-serif;
`

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding: 2rem;
  background: linear-gradient(135deg, rgba(0, 255, 65, 0.1) 0%, rgba(255, 107, 53, 0.1) 100%);
  border-radius: 20px;
  border: 1px solid rgba(0, 255, 65, 0.2);
  backdrop-filter: blur(10px);
`

const Title = styled.h1`
  font-size: 2.5rem;
  font-weight: 700;
  background: linear-gradient(135deg, #00FF41 0%, #FF6B35 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin: 0;
`

const ConnectButton = styled.button`
  background: linear-gradient(135deg, #00FF41 0%, #39FF14 100%);
  color: #000;
  border: none;
  padding: 1rem 2rem;
  border-radius: 12px;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(0, 255, 65, 0.3);
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 255, 65, 0.4);
  }
  
  &:disabled {
    background: #666;
    cursor: not-allowed;
    transform: none;
  }
`

const TabContainer = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  background: rgba(255, 255, 255, 0.05);
  padding: 0.5rem;
  border-radius: 16px;
  backdrop-filter: blur(10px);
`

const Tab = styled.button`
  background: ${props => props.active ? 'linear-gradient(135deg, #00FF41 0%, #39FF14 100%)' : 'transparent'};
  color: ${props => props.active ? '#000' : '#fff'};
  border: none;
  padding: 1rem 2rem;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  
  &:hover {
    background: ${props => props.active ? 'linear-gradient(135deg, #00FF41 0%, #39FF14 100%)' : 'rgba(0, 255, 65, 0.1)'};
  }
`

const ContentArea = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 20px;
  padding: 2rem;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
`

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`

const StatCard = styled.div`
  background: linear-gradient(135deg, rgba(0, 255, 65, 0.1) 0%, rgba(255, 107, 53, 0.1) 100%);
  border-radius: 16px;
  padding: 1.5rem;
  border: 1px solid rgba(0, 255, 65, 0.2);
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 25px rgba(0, 255, 65, 0.2);
  }
`

const StatHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
`

const StatIcon = styled.div`
  width: 50px;
  height: 50px;
  border-radius: 12px;
  background: linear-gradient(135deg, #00FF41 0%, #39FF14 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #000;
`

const StatValue = styled.div`
  font-size: 2rem;
  font-weight: 700;
  color: #00FF41;
`

const StatLabel = styled.div`
  color: #ccc;
  font-size: 0.9rem;
  margin-top: 0.5rem;
`

const SearchBar = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
`

const SearchInput = styled.input`
  flex: 1;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  padding: 1rem;
  color: #fff;
  font-size: 1rem;
  
  &::placeholder {
    color: #999;
  }
  
  &:focus {
    outline: none;
    border-color: #00FF41;
    box-shadow: 0 0 0 2px rgba(0, 255, 65, 0.2);
  }
`

const GameCard = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  padding: 1.5rem;
  margin-bottom: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.08);
    transform: translateY(-2px);
  }
`

const GameHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
`

const GameStatus = styled.span`
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
  background: ${props => {
    switch(props.status) {
      case 'active': return 'linear-gradient(135deg, #00FF41 0%, #39FF14 100%)';
      case 'completed': return 'linear-gradient(135deg, #FF6B35 0%, #F7931E 100%)';
      case 'cancelled': return 'linear-gradient(135deg, #FF4444 0%, #CC0000 100%)';
      default: return 'rgba(255, 255, 255, 0.2)';
    }
  }};
  color: ${props => props.status === 'active' || props.status === 'completed' ? '#000' : '#fff'};
`

const GameList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`

const GameDetails = styled.div`
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  
  p {
    margin: 0.5rem 0;
    color: #ccc;
  }
`

const SettingsForm = styled.form`
  display: grid;
  gap: 1.5rem;
`

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`

const Label = styled.label`
  font-weight: 600;
  color: #ccc;
`

const Input = styled.input`
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  padding: 0.75rem;
  color: #fff;
  font-size: 1rem;
  
  &:focus {
    outline: none;
    border-color: #00FF41;
  }
`

const Button = styled.button`
  background: linear-gradient(135deg, #00FF41 0%, #39FF14 100%);
  color: #000;
  border: none;
  padding: 1rem 2rem;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 15px rgba(0, 255, 65, 0.3);
  }
  
  &:disabled {
    background: #666;
    cursor: not-allowed;
  }
`

const Notification = styled.div`
  position: fixed;
  top: 2rem;
  right: 2rem;
  padding: 1rem 2rem;
  border-radius: 12px;
  color: #fff;
  font-weight: 600;
  z-index: 1000;
  animation: slideIn 0.3s ease;
  
  ${props => props.type === 'success' && `
    background: linear-gradient(135deg, #00FF41 0%, #39FF14 100%);
    color: #000;
  `}
  
  ${props => props.type === 'error' && `
    background: linear-gradient(135deg, #FF4444 0%, #CC0000 100%);
  `}
  
  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
`

export default function AdminPanel() {
  // Wallet connection using RainbowKit/wagmi
  const { isFullyConnected, address, walletClient, publicClient } = useWalletConnection()
  const { chain } = useWallet()
  
  // State
  const [isConnected, setIsConnected] = useState(false)
  const [walletAddress, setWalletAddress] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [selectedChain, setSelectedChain] = useState('base')
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  
  // Data state
  const [stats, setStats] = useState({
    totalGames: 0,
    activeGames: 0,
    totalListings: 0,
    openListings: 0,
    totalVolume: 0,
    platformFees: 0,
    monthlyFees: 0,
    totalNFTsInContract: 0,
    totalETHInContract: 0,
    totalUSDCInContract: 0
  })
  
  const [games, setGames] = useState([])
  const [listings, setListings] = useState([])
  const [filteredGames, setFilteredGames] = useState([])
  const [filteredListings, setFilteredListings] = useState([])
  const [players, setPlayers] = useState([])
  const [settings, setSettings] = useState({
    platformFeePercent: 3.5,
    listingFeeUSD: 0.20
  })
  
  const [expandedGame, setExpandedGame] = useState(null)
  const [notifications, setNotifications] = useState([])

  // NFT Management state
  const [contractNFTs, setContractNFTs] = useState([])
  const [isLoadingNFTs, setIsLoadingNFTs] = useState(false)
  const [selectedNFTsForWithdrawal, setSelectedNFTsForWithdrawal] = useState([])
  const [withdrawalAddress, setWithdrawalAddress] = useState('')
  
  // API URL
  const API_URL = ''
  
  // Admin wallet connection effect
  useEffect(() => {
    if (isFullyConnected && address) {
      if (address.toLowerCase() === ADMIN_WALLET.toLowerCase()) {
        setIsAdmin(true)
        setIsConnected(true)
        setWalletAddress(address)
        
        // Initialize contract service
        const chainName = chain?.name?.toLowerCase() || 'base'
        ;(async () => {
          try {
            await contractService.initialize(walletClient, publicClient)
            console.log('✅ Admin contract service initialized')
            loadData()
          } catch (error) {
            console.error('❌ Failed to initialize contract service:', error)
          }
        })()
      } else {
        alert('Unauthorized wallet. Admin access only.')
      }
    }
  }, [isFullyConnected, address, walletClient, publicClient, chain])
  
  // Load data from database and blockchain
  const loadData = async () => {
    setLoading(true)
    try {
      // Load games and listings from database
      const response = await fetch(`${API_URL}/api/admin/games`)
      if (!response.ok) throw new Error('Failed to load admin data')
      
      const data = await response.json()
      
      // Set games and listings
      setGames(data.games || [])
      setListings(data.listings || [])
      
      // Update stats from server response
      setStats(prev => ({
        ...prev,
        totalGames: data.stats?.totalGames || 0,
        activeGames: data.stats?.activeGames || 0,
        totalListings: data.stats?.totalListings || 0,
        openListings: data.stats?.openListings || 0,
        totalVolume: data.stats?.totalVolume || 0,
        platformFees: (data.stats?.totalVolume || 0) * (settings.platformFeePercent / 100),
        monthlyFees: 0 // Would need date filtering on server
      }))
      
      // Calculate player statistics
      loadPlayerData([...data.games, ...data.listings])
      
      // Load blockchain data if contract service is initialized
      if (contractService.currentChain) {
        try {
          console.log('Contract service is initialized for:', contractService.currentChain)
          await loadContractSettings()
        } catch (error) {
          console.error('Error loading blockchain data:', error)
        }
      }
    } catch (error) {
      console.error('Error loading data:', error)
      addNotification('error', 'Failed to load data: ' + error.message)
    } finally {
      setLoading(false)
    }
  }
  
  // Calculate statistics
  const calculateStats = (gamesData) => {
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    
    let totalVolume = 0
    let monthlyVolume = 0
    let activeCount = 0
    
    gamesData.forEach(game => {
      if (game.status === 'active' || game.status === 'joined') {
        activeCount++
      }
      
      if (game.price_usd) {
        totalVolume += game.price_usd
        
        const gameDate = new Date(game.created_at)
        if (gameDate >= monthStart) {
          monthlyVolume += game.price_usd
        }
      }
    })
    
    setStats({
      totalGames: gamesData.length,
      activeGames: activeCount,
      totalVolume: totalVolume,
      platformFees: totalVolume * (settings.platformFeePercent / 100),
      monthlyFees: monthlyVolume * (settings.platformFeePercent / 100),
      totalNFTsInContract: activeCount, // Approximate
      totalETHInContract: 0, // Would need blockchain query
      totalUSDCInContract: 0 // Would need blockchain query
    })
  }
  
  // Load player data
  const loadPlayerData = async (allData) => {
    const playerMap = new Map()
    
    allData.forEach(item => {
      // Handle both games and listings
      const isGame = item.challenger !== undefined || item.joiner !== undefined
      const price = item.final_price || item.asking_price || item.price_usd || 0
      
      // Process creator
      if (!playerMap.has(item.creator)) {
        playerMap.set(item.creator, {
          address: item.creator,
          gamesCreated: 0,
          listingsCreated: 0,
          gamesWon: 0,
          totalVolume: 0
        })
      }
      const creator = playerMap.get(item.creator)
      
      if (isGame) {
        creator.gamesCreated++
        if (item.winner === item.creator) {
          creator.gamesWon++
        }
      } else {
        creator.listingsCreated++
      }
      creator.totalVolume += price
      
      // Process challenger/joiner for games
      const participant = item.challenger || item.joiner
      if (participant && !playerMap.has(participant)) {
        playerMap.set(participant, {
          address: participant,
          gamesCreated: 0,
          listingsCreated: 0,
          gamesWon: 0,
          totalVolume: 0
        })
      }
      if (participant) {
        const joiner = playerMap.get(participant)
        joiner.totalVolume += price
        if (item.winner === participant) {
          joiner.gamesWon++
        }
      }
    })
    
    setPlayers(Array.from(playerMap.values()))
  }

  // Load contract settings from blockchain
  const loadContractSettings = async () => {
    if (!contractService.currentChain) {
      return
    }
    
    try {
      console.log('📋 Loading contract settings...')
      
      // Get listing fee
      const listingFee = await contractService.getListingFee()
      const listingFeeUSD = Number(listingFee) / 1000000 // Convert from 6 decimals
      
      // Get platform fee
      const platformFee = await contractService.getPlatformFee()
      const platformFeePercent = Number(platformFee) / 100 // Convert from basis points
      
      setSettings(prev => ({
        ...prev,
        listingFeeUSD: listingFeeUSD,
        platformFeePercent: platformFeePercent
      }))
      
      console.log('✅ Contract settings loaded:', { listingFeeUSD, platformFeePercent })
    } catch (error) {
      console.error('❌ Error loading contract settings:', error)
      addNotification('error', 'Failed to load contract settings: ' + error.message)
    }
  }
  
  // Update platform fee
  const updatePlatformFee = async () => {
    if (!contractService.isReady()) {
      addNotification('error', 'Wallet not connected or contract service not initialized.')
      return
    }
    
    try {
      setLoading(true)
      const newFeePercent = settings.platformFeePercent * 100 // Convert to basis points
      const result = await contractService.updatePlatformFee(newFeePercent)
      
      if (result.success) {
        addNotification('success', `Platform fee updated to ${settings.platformFeePercent}%! Transaction: ${result.transactionHash}`)
        // Refresh settings from contract
        await loadContractSettings()
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      console.error('Error updating platform fee:', error)
      addNotification('error', 'Failed to update platform fee: ' + error.message)
    } finally {
      setLoading(false)
    }
  }
  
  // Update listing fee
  const updateListingFee = async () => {
    if (!contractService.isReady()) {
      addNotification('error', 'Wallet not connected or contract service not initialized.')
      return
    }
    
    try {
      setLoading(true)
      const newFeeUSD = settings.listingFeeUSD * 1000000 // Convert to 6 decimals
      const result = await contractService.updateListingFee(newFeeUSD)
      
      if (result.success) {
        addNotification('success', `Listing fee updated to $${settings.listingFeeUSD}! Transaction: ${result.transactionHash}`)
        // Refresh settings from contract
        await loadContractSettings()
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      console.error('Error updating listing fee:', error)
      addNotification('error', 'Failed to update listing fee: ' + error.message)
    } finally {
      setLoading(false)
    }
  }
  
  // Emergency withdraw NFT from contract
  const emergencyWithdrawNFT = async (gameId) => {
    if (!contractService.isReady()) {
      addNotification('error', 'Wallet not connected or contract service not initialized.')
      return
    }
    
    if (!confirm('Emergency withdraw NFT from this game?')) return
    
    try {
      const game = games.find(g => g.id === gameId)
      if (!game) throw new Error('Game not found')
      
      // Withdraw to the original depositor
      const recipient = game.creator || address
      
      // Use contract service to withdraw NFT
      const result = await contractService.emergencyWithdrawNFT(game.contract_game_id, recipient)
      
      if (result.success) {
        addNotification('success', `NFT withdrawn successfully to ${recipient}!`)
        
        // Update database
        await fetch(`${API_URL}/api/admin/games/${gameId}/cancel`, {
          method: 'PUT'
        })
        
        await loadData()
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      console.error('Error withdrawing NFT:', error)
      addNotification('error', 'Failed to withdraw NFT: ' + error.message)
    }
  }

  // Pause all games
  const pauseAllGames = async () => {
    if (!confirm('PAUSE ALL GAMES? This will prevent new games from being created or joined.')) return
    
    try {
      // Update all waiting games to paused
      const response = await fetch(`${API_URL}/api/admin/pause-all`, {
        method: 'POST'
      })
      
      if (response.ok) {
        addNotification('success', 'All games paused!')
        await loadData()
      } else if (response.status === 404) {
        // Fallback: manually update games in database
        addNotification('info', 'Server endpoint not available, using fallback method...')
        
        // Get all waiting games and update them one by one
        const gamesResponse = await fetch(`${API_URL}/api/admin/games`)
        if (gamesResponse.ok) {
          const data = await gamesResponse.json()
          const waitingGames = data.games.filter(g => g.status === 'waiting')
          
          let updatedCount = 0
          for (const game of waitingGames) {
            try {
              await fetch(`${API_URL}/api/admin/games/${game.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'paused' })
              })
              updatedCount++
            } catch (e) {
              console.warn('Failed to update game:', game.id, e)
            }
          }
          
          addNotification('success', `Paused ${updatedCount} games using fallback method!`)
          await loadData()
        } else {
          throw new Error('Failed to load games for fallback update')
        }
      } else {
        throw new Error('Failed to pause games')
      }
    } catch (error) {
      addNotification('error', 'Failed to pause games: ' + error.message)
    }
  }

  // Withdraw platform fees
  const withdrawPlatformFees = async () => {
    if (!contractService.currentChain) {
      addNotification('error', 'Contract not initialized')
      return
    }
    
    try {
      const result = await contractService.withdrawPlatformFees()
      
      if (result.success) {
        addNotification('success', `Platform fees withdrawn successfully! Transaction: ${result.transactionHash}`)
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      addNotification('error', 'Failed to withdraw platform fees: ' + error.message)
    }
  }
  
  // Cancel game in database
  const cancelGameInDB = async (gameId) => {
    try {
      const response = await fetch(`${API_URL}/api/admin/games/${gameId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled' })
      })
      
      if (response.ok) {
        addNotification('success', 'Game cancelled successfully!')
        await loadData()
      } else {
        addNotification('error', 'Failed to cancel game')
      }
    } catch (error) {
      console.error('Error cancelling game:', error)
      addNotification('error', 'Failed to cancel game')
    }
  }

  // Sync cancelled games from contract to database
  const syncCancelledGames = async () => {
    try {
      addNotification('info', 'Syncing cancelled games...')
      
      // Temporary workaround: Use the existing PATCH endpoint to update games
      // Get all games first
      const gamesResponse = await fetch(`${API_URL}/api/admin/games`)
      if (!gamesResponse.ok) {
        throw new Error('Failed to fetch games')
      }
      
      const data = await gamesResponse.json()
      const games = data.games || []
      
      // Find games that should be cancelled (waiting games older than 24 hours)
      const now = new Date()
      const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
      
      const gamesToCancel = games.filter(game => 
        game.status === 'waiting' && 
        new Date(game.created_at) < twentyFourHoursAgo
      )
      
      if (gamesToCancel.length === 0) {
        addNotification('info', 'No games need to be cancelled')
        return
      }
      
      // Cancel each game using the existing PATCH endpoint
      let cancelledCount = 0
      for (const game of gamesToCancel) {
        try {
          const response = await fetch(`${API_URL}/api/admin/games/${game.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'cancelled' })
          })
          
          if (response.ok) {
            cancelledCount++
          }
        } catch (error) {
          console.warn(`Failed to cancel game ${game.id}:`, error)
        }
      }
      
      addNotification('success', `Cancelled ${cancelledCount} expired games!`)
      await loadData()
    } catch (error) {
      console.error('Error syncing cancelled games:', error)
      addNotification('error', 'Failed to sync cancelled games: ' + error.message)
    }
  }

  // Sync individual game status from contract
  const syncGameStatus = async (gameId) => {
    try {
      addNotification('info', `Syncing game ${gameId} status from contract...`)
      
      // Get game status from contract
      const result = await contractService.getGameDetails(gameId)
      if (!result.success) {
        addNotification('error', 'Failed to get game from contract')
        return
      }

      const contractState = result.data.game.state
      
      // Map contract state to database status
      let dbStatus = 'waiting'
      switch (Number(contractState)) {
        case 0: dbStatus = 'waiting'; break
        case 1: dbStatus = 'joined'; break
        case 2: dbStatus = 'active'; break
        case 3: dbStatus = 'completed'; break
        case 4: dbStatus = 'cancelled'; break
        default: dbStatus = 'waiting'
      }
      
      // Use the existing PATCH endpoint
      const response = await fetch(`${API_URL}/api/admin/games/${gameId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: dbStatus })
      })
      
      if (response.ok) {
        addNotification('success', `Game ${gameId} status synced to ${dbStatus}!`)
        await loadData()
      } else {
        addNotification('error', 'Failed to sync game status')
      }
    } catch (error) {
      console.error('Error syncing game status:', error)
      addNotification('error', 'Failed to sync game status: ' + error.message)
    }
  }

  // Clear all games from database
  const clearAllGames = async () => {
    if (!confirm('🗑️ DELETE ALL GAMES? This will permanently remove all games from the database and cannot be undone!')) {
      return
    }

    try {
      addNotification('info', 'Clearing all games from database...')
      
      // First, get all games to see what we're deleting
      const gamesResponse = await fetch(`${API_URL}/api/admin/games`)
      if (!gamesResponse.ok) {
        throw new Error('Failed to fetch games')
      }
      
      const data = await gamesResponse.json()
      const games = data.games || []
      
      if (games.length === 0) {
        addNotification('info', 'Database is already empty')
        return
      }
      
      addNotification('info', `Found ${games.length} games to delete...`)
      
      // Delete all games using the existing DELETE endpoint
      const deleteResponse = await fetch(`${API_URL}/api/admin/games`, {
        method: 'DELETE'
      })
      
      if (deleteResponse.ok) {
        const result = await deleteResponse.json()
        addNotification('success', `✅ Successfully deleted ${result.changes || games.length} games from database!`)
        await loadData() // Refresh the games list
      } else {
        const errorText = await deleteResponse.text()
        throw new Error(`Failed to delete games: ${errorText}`)
      }
    } catch (error) {
      console.error('Error clearing database:', error)
      addNotification('error', 'Failed to clear database: ' + error.message)
    }
  }

  // Update NFT metadata for all games
  const updateAllNFTMetadata = async () => {
    try {
      setIsLoading(true)
      addNotification('info', 'Updating NFT metadata for all games...')
      
      const response = await fetch(`${API_URL}/api/admin/update-all-nft-metadata`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      
      if (!response.ok) {
        throw new Error('Failed to update NFT metadata')
      }
      
      const result = await response.json()
      addNotification('success', `Updated NFT metadata for ${result.updated} games (${result.errors} errors)`)
      
      // Reload data
      await loadData()
      
    } catch (error) {
      console.error('Error updating NFT metadata:', error)
      addNotification('error', 'Failed to update NFT metadata: ' + error.message)
    } finally {
      setIsLoading(false)
    }
  }

  // NFT Management Functions
  const loadContractNFTs = async () => {
    if (!contractService.isReady()) {
      addNotification('error', 'Contract service not initialized')
      return
    }

    try {
      setIsLoadingNFTs(true)
      addNotification('info', 'Loading NFTs from contract using Alchemy...')
      console.log('🔄 Loading NFTs from contract using Alchemy...')

      // Use the new Alchemy integration in ContractService
      const result = await contractService.getContractOwnedNFTs()
      
      if (result.success) {
        console.log('📦 NFTs loaded from Alchemy:', result.nfts.length)
        setContractNFTs(result.nfts)
        addNotification('success', `Loaded ${result.nfts.length} NFTs from contract (Alchemy)`)
      } else {
        // Fallback to old method if Alchemy fails
        console.log('⚠️ Alchemy method failed, trying fallback method...')
        addNotification('info', 'Alchemy failed, trying direct contract query...')
        
        // Fallback: Query contract directly for each game to see what's actually deposited
        const response = await fetch(`${API_URL}/api/admin/games`)
        if (!response.ok) {
          throw new Error('Failed to fetch games from database')
        }
        const data = await response.json()
        const games = data.games || []
        
        console.log('📊 All games in database:', games.length)
        const nftsInContract = []
        
        for (const game of games) {
          try {
            console.log(`🔍 Checking contract for game ${game.id}...`)
            
            // Get game state from contract
            const gameState = await contractService.getGameState(game.id)
            
            if (gameState.success && gameState.gameState.nftDeposit.hasDeposit) {
              const nftDeposit = gameState.gameState.nftDeposit
              console.log(`✅ Found NFT in contract for game ${game.id}:`, nftDeposit)
              
              nftsInContract.push({
                nftContract: nftDeposit.nftContract,
                tokenId: nftDeposit.tokenId,
                name: `Game ${game.id} NFT`,
                metadata: {
                  image: game.nft_image || '',
                  collection: game.nft_collection || ''
                },
                uniqueKey: `${nftDeposit.nftContract}-${nftDeposit.tokenId}`,
                source: 'contract',
                gameId: game.id,
                contractGameId: game.contract_game_id || game.id,
                depositor: nftDeposit.depositor,
                claimed: nftDeposit.claimed,
                depositTime: nftDeposit.depositTime
              })
            } else {
              console.log(`❌ No NFT found in contract for game ${game.id}`)
            }
          } catch (error) {
            console.error(`❌ Error checking game ${game.id}:`, error)
          }
        }
        
        console.log('📦 NFTs found in contract:', nftsInContract.length)
        setContractNFTs(nftsInContract)
        addNotification('success', `Loaded ${nftsInContract.length} NFTs from contract (Direct Query)`)
      }
      
    } catch (error) {
      console.error('❌ Error loading contract NFTs:', error)
      addNotification('error', 'Failed to load NFTs: ' + error.message)
    } finally {
      setIsLoadingNFTs(false)
    }
  }

  const withdrawSelectedNFTs = async () => {
    if (!contractService.isReady()) {
      addNotification('error', 'Contract service not initialized')
      return
    }

    if (selectedNFTsForWithdrawal.length === 0) {
      addNotification('error', 'No NFTs selected for withdrawal')
      return
    }

    const targetAddress = withdrawalAddress || walletAddress
    if (!targetAddress || targetAddress === '') {
      addNotification('error', 'Please enter withdrawal address or connect wallet')
      return
    }

    try {
      addNotification('info', 'Processing NFT withdrawal...')
      
      // For each selected NFT, use its contract address and token ID
      const nftContracts = []
      const tokenIds = []
      const recipients = []
      
      for (const nft of selectedNFTsForWithdrawal) {
        if (nft.nftContract !== '0x0000000000000000000000000000000000000000') {
          nftContracts.push(nft.nftContract)
          tokenIds.push(nft.tokenId)
          recipients.push(targetAddress)
        }
      }
      
      if (nftContracts.length === 0) {
        addNotification('error', 'No valid NFTs selected for withdrawal')
        return
      }
      
      console.log('📝 Attempting batch withdrawal with:', {
        nftContracts,
        tokenIds,
        recipients
      })
      
      // Use the ContractService method for batch withdrawal with NFT contracts and token IDs
      const result = await contractService.adminBatchWithdrawNFTs(nftContracts, tokenIds, recipients)
      
      if (result.success) {
        addNotification('success', result.message || `Successfully withdrew ${nftContracts.length} NFTs!`)
        setSelectedNFTsForWithdrawal([])
        setWithdrawalAddress('')
        
        // Wait a bit before reloading to let blockchain state update
        setTimeout(() => {
          loadContractNFTs() // Reload NFTs
        }, 2000)
      } else {
        throw new Error(result.error)
      }
      
    } catch (error) {
      console.error('❌ Error withdrawing NFTs:', error)
      addNotification('error', 'Failed to withdraw NFTs: ' + error.message)
    }
  }

  const selectAllNFTs = () => {
    setSelectedNFTsForWithdrawal(contractNFTs.filter(nft => nft.nftContract !== '0x0000000000000000000000000000000000000000'))
  }

  const deselectAllNFTs = () => {
    setSelectedNFTsForWithdrawal([])
  }

  const toggleNFTSelection = (nft) => {
    setSelectedNFTsForWithdrawal(prev => {
      const isSelected = prev.some(selected => 
        selected.uniqueKey === nft.uniqueKey
      )
      
      if (isSelected) {
        return prev.filter(selected => selected.uniqueKey !== nft.uniqueKey)
      } else {
        return [...prev, nft]
      }
    })
  }
  
  // Add notification
  const addNotification = (type, message) => {
    const id = Date.now()
    setNotifications(prev => [...prev, { id, type, message }])
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id))
    }, 5000)
  }
  
  // Format address
  const formatAddress = (addr) => {
    if (!addr || addr === '0x0000000000000000000000000000000000000000') {
      return 'N/A'
    }
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }
  
  // Format date
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString()
  }
  
  // Get status color
  const getStatusColor = (status) => {
    switch(status) {
      case 'open': return '#00FF41'
      case 'active': return '#00FF41'
      case 'waiting_challenger_deposit': return '#FFD700'
      case 'waiting_deposits': return '#FFA500'
      case 'completed': return '#FF6B35'
      case 'cancelled': return '#FF4444'
      case 'closed': return '#666'
      case 'paused': return '#800080'
      default: return '#666'
    }
  }
  
  // Filter games and listings
  useEffect(() => {
    const filteredGamesResult = games.filter(game => 
      game.id.toString().includes(searchQuery) ||
      game.creator.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (game.challenger && game.challenger.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (game.joiner && game.joiner.toLowerCase().includes(searchQuery.toLowerCase()))
    )
    setFilteredGames(filteredGamesResult)
    
    const filteredListingsResult = listings.filter(listing => 
      listing.id.toString().includes(searchQuery) ||
      listing.creator.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (listing.nft_name && listing.nft_name.toLowerCase().includes(searchQuery.toLowerCase()))
    )
    setFilteredListings(filteredListingsResult)
  }, [games, listings, searchQuery])
  
  // Chain selector component
  const ChainSelector = () => (
    <select 
      value={selectedChain} 
      onChange={(e) => setSelectedChain(e.target.value)}
      style={{ marginLeft: '1rem' }}
    >
      {Object.keys(CHAIN_CONFIGS).map(chain => (
        <option key={chain} value={chain}>
          {CHAIN_CONFIGS[chain].name}
        </option>
      ))}
    </select>
  )
  
  return (
    <AdminContainer>
      <Header>
        <Title>Admin Dashboard</Title>
        {!isConnected ? (
          <RainbowConnectButton />
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span>Connected: {formatAddress(walletAddress)}</span>
            <span>{chain?.name || 'Unknown Chain'}</span>
          </div>
        )}
      </Header>

      {!isConnected ? (
        <ContentArea>
          <div style={{ textAlign: 'center', padding: '4rem' }}>
            <h2>Connect your admin wallet to access the dashboard</h2>
            <p>Only authorized wallets can access this panel</p>
          </div>
        </ContentArea>
      ) : (
        <>
          <TabContainer>
            <Tab 
              active={activeTab === 'overview'} 
              onClick={() => setActiveTab('overview')}
            >
              <BarChart3 size={20} />
              Overview
            </Tab>
            <Tab 
              active={activeTab === 'listings'} 
              onClick={() => setActiveTab('listings')}
            >
              <Package size={20} />
              Listings
            </Tab>
            <Tab 
              active={activeTab === 'games'} 
              onClick={() => setActiveTab('games')}
            >
              <Gamepad2 size={20} />
              Games
            </Tab>
            <Tab 
              active={activeTab === 'players'} 
              onClick={() => setActiveTab('players')}
            >
              <Users size={20} />
              Players
            </Tab>
            <Tab 
              active={activeTab === 'settings'} 
              onClick={() => setActiveTab('settings')}
            >
              <Settings size={20} />
              Settings
            </Tab>
            <Tab 
              active={activeTab === 'emergency'} 
              onClick={() => setActiveTab('emergency')}
            >
              <Shield size={20} />
              Emergency
            </Tab>
            <Tab 
              active={activeTab === 'nftManagement'} 
              onClick={() => setActiveTab('nftManagement')}
            >
              <Download size={20} />
              NFT Management
            </Tab>
          </TabContainer>

          <ContentArea>
            {activeTab === 'overview' && (
              <div>
                <StatsGrid>
                  <StatCard>
                    <StatHeader>
                      <StatIcon>
                        <Package size={24} />
                      </StatIcon>
                      <div>
                        <StatValue>{stats.totalListings}</StatValue>
                        <StatLabel>Total Listings</StatLabel>
                      </div>
                    </StatHeader>
                  </StatCard>
                  
                  <StatCard>
                    <StatHeader>
                      <StatIcon>
                        <Gamepad2 size={24} />
                      </StatIcon>
                      <div>
                        <StatValue>{stats.totalGames}</StatValue>
                        <StatLabel>Total Games</StatLabel>
                      </div>
                    </StatHeader>
                  </StatCard>
                  
                  <StatCard>
                    <StatHeader>
                      <StatIcon>
                        <Activity size={24} />
                      </StatIcon>
                      <div>
                        <StatValue>{stats.activeGames}</StatValue>
                        <StatLabel>Active Games</StatLabel>
                      </div>
                    </StatHeader>
                  </StatCard>
                  
                  <StatCard>
                    <StatHeader>
                      <StatIcon>
                        <DollarSign size={24} />
                      </StatIcon>
                      <div>
                        <StatValue>${stats.totalVolume.toFixed(2)}</StatValue>
                        <StatLabel>Total Volume</StatLabel>
                      </div>
                    </StatHeader>
                  </StatCard>
                  
                  <StatCard>
                    <StatHeader>
                      <StatIcon>
                        <Crown size={24} />
                      </StatIcon>
                      <div>
                        <StatValue>${stats.platformFees.toFixed(2)}</StatValue>
                        <StatLabel>Platform Fees</StatLabel>
                      </div>
                    </StatHeader>
                  </StatCard>
                  
                  <StatCard>
                    <StatHeader>
                      <StatIcon>
                        <Zap size={24} />
                      </StatIcon>
                      <div>
                        <StatValue>{stats.openListings}</StatValue>
                        <StatLabel>Open Listings</StatLabel>
                      </div>
                    </StatHeader>
                  </StatCard>
                </StatsGrid>
                
                <div style={{ marginTop: '2rem' }}>
                  <h3>Recent Activity</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                    <div>
                      <h4>Recent Listings</h4>
                      {listings.slice(0, 3).map(listing => (
                        <GameCard key={`listing-${listing.id}`}>
                          <GameHeader>
                            <div>
                              <strong>Listing #{listing.id}</strong>
                              <div style={{ fontSize: '0.9rem', color: '#ccc' }}>
                                {listing.nft_name} - ${listing.asking_price}
                              </div>
                              <div style={{ fontSize: '0.8rem', color: '#888' }}>
                                {formatAddress(listing.creator)}
                              </div>
                            </div>
                            <GameStatus status={listing.status}>
                              {listing.status}
                            </GameStatus>
                          </GameHeader>
                        </GameCard>
                      ))}
                    </div>
                    <div>
                      <h4>Recent Games</h4>
                      {games.slice(0, 3).map(game => (
                        <GameCard key={`game-${game.id}`}>
                          <GameHeader>
                            <div>
                              <strong>Game #{game.id}</strong>
                              <div style={{ fontSize: '0.9rem', color: '#ccc' }}>
                                {game.nft_name} - ${game.final_price}
                              </div>
                              <div style={{ fontSize: '0.8rem', color: '#888' }}>
                                {formatAddress(game.creator)} vs {formatAddress(game.challenger)}
                              </div>
                            </div>
                            <GameStatus status={game.status}>
                              {game.status}
                            </GameStatus>
                          </GameHeader>
                        </GameCard>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'listings' && (
              <div>
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                  <SearchBar>
                    <Search size={20} />
                    <input
                      type="text"
                      placeholder="Search by listing ID, NFT name, or address..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </SearchBar>
                  
                  <Button 
                    onClick={async () => {
                      try {
                        const response = await fetch(`${API_URL}/api/admin/listings`, {
                          method: 'DELETE'
                        })
                        if (response.ok) {
                          addNotification('success', 'All listings cleared!')
                          loadData()
                        }
                      } catch (error) {
                        addNotification('error', 'Failed to clear listings')
                      }
                    }}
                    style={{ background: '#ff4444', whiteSpace: 'nowrap' }}
                  >
                    🗑️ Clear All Listings
                  </Button>
                </div>
                
                <GameList>
                  {filteredListings.map(listing => (
                    <GameCard key={listing.id}>
                      <GameHeader onClick={() => setExpandedGame(expandedGame === listing.id ? null : listing.id)}>
                        <div>
                          <h4>Listing #{listing.id}</h4>
                          <p>NFT: {listing.nft_name}</p>
                          <p>Price: ${listing.asking_price}</p>
                          <p>Status: <span style={{ color: getStatusColor(listing.status) }}>{listing.status}</span></p>
                        </div>
                        <ChevronDown style={{ transform: expandedGame === listing.id ? 'rotate(180deg)' : 'none' }} />
                      </GameHeader>
                      
                      {expandedGame === listing.id && (
                        <GameDetails>
                          <p><strong>Creator:</strong> {formatAddress(listing.creator)}</p>
                          <p><strong>NFT Contract:</strong> {formatAddress(listing.nft_contract)}</p>
                          <p><strong>Token ID:</strong> {listing.nft_token_id}</p>
                          <p><strong>Collection:</strong> {listing.nft_collection}</p>
                          <p><strong>Created:</strong> {formatDate(listing.created_at)}</p>
                          
                          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                            <Button 
                              onClick={async () => {
                                try {
                                  const response = await fetch(`${API_URL}/api/admin/listings/${listing.id}`, {
                                    method: 'PATCH',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ status: 'open' })
                                  })
                                  if (response.ok) {
                                    addNotification('success', 'Listing reopened!')
                                    loadData()
                                  }
                                } catch (error) {
                                  addNotification('error', 'Failed to reopen listing')
                                }
                              }}
                              style={{ background: '#00cc00' }}
                            >
                              ↗️ Reopen Listing
                            </Button>
                            
                            <Button 
                              onClick={async () => {
                                if (confirm('Delete this listing?')) {
                                  try {
                                    const response = await fetch(`${API_URL}/api/admin/listings/${listing.id}`, {
                                      method: 'DELETE'
                                    })
                                    if (response.ok) {
                                      addNotification('success', 'Listing deleted!')
                                      loadData()
                                    }
                                  } catch (error) {
                                    addNotification('error', 'Failed to delete listing')
                                  }
                                }
                              }}
                              style={{ background: '#ff4444' }}
                            >
                              🗑️ Delete Listing
                            </Button>
                            
                            <Button 
                              onClick={() => {
                                navigator.clipboard.writeText(`${window.location.origin}/game/${listing.id}`)
                                addNotification('success', 'Listing URL copied!')
                              }}
                              style={{ background: '#0088ff' }}
                            >
                              🔗 Copy URL
                            </Button>
                          </div>
                        </GameDetails>
                      )}
                    </GameCard>
                  ))}
                </GameList>
              </div>
            )}

            {activeTab === 'games' && (
              <div>
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                  <SearchBar>
                    <Search size={20} />
                    <input
                      type="text"
                      placeholder="Search by game ID or address..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </SearchBar>
                  
                  <Button 
                    onClick={syncCancelledGames}
                    style={{ background: '#00cc00', whiteSpace: 'nowrap' }}
                  >
                    🔄 Sync Cancelled Games
                  </Button>
                  <Button 
                    onClick={updateAllNFTMetadata}
                    style={{ background: '#0088ff', whiteSpace: 'nowrap' }}
                  >
                    🖼️ Update NFT Metadata
                  </Button>
                  <Button 
                    onClick={clearAllGames}
                    style={{ background: '#ff4444', whiteSpace: 'nowrap' }}
                  >
                    🗑️ Clear All Games
                  </Button>
                </div>
                
                <GameList>
                  {filteredGames.map(game => (
                    <GameCard key={game.id}>
                      <GameHeader onClick={() => setExpandedGame(expandedGame === game.id ? null : game.id)}>
                        <div>
                          <h4>Game #{game.id}</h4>
                          <p>NFT: {game.nft_name}</p>
                          <p>Status: <span style={{ color: getStatusColor(game.status) }}>{game.status}</span></p>
                        </div>
                        <ChevronDown style={{ transform: expandedGame === game.id ? 'rotate(180deg)' : 'none' }} />
                      </GameHeader>
                      
                      {expandedGame === game.id && (
                        <GameDetails>
                          <p><strong>Creator:</strong> {formatAddress(game.creator)}</p>
                          <p><strong>Challenger:</strong> {formatAddress(game.challenger || game.joiner)}</p>
                          <p><strong>Price:</strong> ${game.final_price || game.price_usd} USD</p>
                          <p><strong>Contract Game ID:</strong> {game.blockchain_game_id || game.contract_game_id || 'N/A'}</p>
                          <p><strong>Creator Deposited:</strong> {game.creator_deposited ? '✅' : '❌'}</p>
                          <p><strong>Challenger Deposited:</strong> {game.challenger_deposited ? '✅' : '❌'}</p>
                          <p><strong>Created:</strong> {formatDate(game.created_at)}</p>
                          {game.deposit_deadline && (
                            <p><strong>Deposit Deadline:</strong> {formatDate(game.deposit_deadline)}</p>
                          )}
                          
                          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                            {game.status === 'waiting' && (
                              <Button 
                                onClick={() => cancelGameInDB(game.id)}
                                style={{ background: '#ff4444' }}
                              >
                                Cancel Game
                              </Button>
                            )}
                            
                            {game.contract_game_id && game.status === 'waiting' && (
                              <Button 
                                onClick={() => emergencyWithdrawNFT(game.id)}
                                style={{ background: '#ff8800' }}
                              >
                                Emergency Withdraw NFT
                              </Button>
                            )}
                            
                            <Button 
                              onClick={() => {
                                navigator.clipboard.writeText(`${window.location.origin}/game/${game.id}`)
                                addNotification('success', 'Game URL copied!')
                              }}
                              style={{ background: '#0088ff' }}
                            >
                              Copy Game URL
                            </Button>
                            
                            {game.contract_game_id && (
                              <Button 
                                onClick={() => syncGameStatus(game.id)}
                                style={{ background: '#00cc00' }}
                              >
                                🔄 Sync Status
                              </Button>
                            )}
                            
                            <Button 
                              onClick={async () => {
                                try {
                                  addNotification('info', `Updating NFT metadata for game ${game.id}...`)
                                  const response = await fetch(`${API_URL}/api/games/${game.id}/update-nft-metadata`, {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' }
                                  })
                                  
                                  if (response.ok) {
                                    const result = await response.json()
                                    addNotification('success', `NFT metadata updated for game ${game.id}!`)
                                    await loadData()
                                  } else {
                                    addNotification('error', 'Failed to update NFT metadata')
                                  }
                                } catch (error) {
                                  console.error('Error updating NFT metadata:', error)
                                  addNotification('error', 'Failed to update NFT metadata')
                                }
                              }}
                              style={{ background: '#0088ff' }}
                            >
                              🖼️ Update NFT
                            </Button>
                          </div>
                        </GameDetails>
                      )}
                    </GameCard>
                  ))}
                </GameList>
              </div>
            )}

            {activeTab === 'players' && (
              <div>
                <h3>Player Statistics</h3>
                {players.map(player => (
                  <GameCard key={player.address}>
                    <GameHeader>
                      <div>
                        <strong>{formatAddress(player.address)}</strong>
                      </div>
                    </GameHeader>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
                      <div>
                        <strong>Listings Created:</strong> {player.listingsCreated || 0}
                      </div>
                      <div>
                        <strong>Games Created:</strong> {player.gamesCreated || 0}
                      </div>
                      <div>
                        <strong>Games Won:</strong> {player.gamesWon || 0}
                      </div>
                      <div>
                        <strong>Total Volume:</strong> ${player.totalVolume.toFixed(2)}
                      </div>
                    </div>
                  </GameCard>
                ))}
              </div>
            )}

            {activeTab === 'settings' && (
              <div>
                <h3>Platform Settings</h3>
                <SettingsForm>
                  <FormGroup>
                    <Label>Platform Fee Percentage</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={settings.platformFeePercent}
                      onChange={(e) => setSettings(prev => ({ ...prev, platformFeePercent: parseFloat(e.target.value) }))}
                    />
                  </FormGroup>
                  
                  <FormGroup>
                    <Label>Listing Fee (USD)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={settings.listingFeeUSD}
                      onChange={(e) => setSettings(prev => ({ ...prev, listingFeeUSD: parseFloat(e.target.value) }))}
                    />
                  </FormGroup>
                  
                  <Button onClick={updatePlatformFee} disabled={!contractService.currentChain}>
                    Update Platform Fee
                  </Button>
                  
                  <Button onClick={updateListingFee} disabled={!contractService.currentChain}>
                    Update Listing Fee
                  </Button>
                </SettingsForm>
              </div>
            )}

            {activeTab === 'emergency' && (
              <div>
                <h3 style={{ color: '#ff4444', marginBottom: '2rem' }}>⚠️ Emergency Controls</h3>
                
                {/* User NFT Recovery Section */}
                <div style={{ 
                  background: 'rgba(255, 68, 68, 0.1)', 
                  border: '2px solid #ff4444',
                  borderRadius: '12px',
                  padding: '2rem',
                  marginBottom: '2rem'
                }}>
                  <h4 style={{ color: '#ff4444', marginBottom: '1rem' }}>🚨 User NFT Recovery</h4>
                  <p style={{ marginBottom: '1rem' }}>Help users recover their NFTs if they're stuck in game contracts.</p>
                  <EmergencyRecovery />
                </div>
                
                <div style={{ 
                  background: 'rgba(255, 0, 0, 0.1)', 
                  border: '2px solid #ff4444',
                  borderRadius: '12px',
                  padding: '2rem',
                  marginBottom: '2rem'
                }}>
                  <h4>Pause All Games</h4>
                  <p>This will prevent any new games from being created or joined.</p>
                  <Button 
                    onClick={pauseAllGames}
                    style={{ background: '#ff4444', marginTop: '1rem' }}
                  >
                    🛑 PAUSE ALL GAMES
                  </Button>
                </div>
                
                <div style={{ 
                  background: 'rgba(255, 215, 0, 0.1)', 
                  border: '2px solid #FFD700',
                  borderRadius: '12px',
                  padding: '2rem',
                  marginBottom: '2rem'
                }}>
                  <h4>Withdraw Platform Fees</h4>
                  <p>Withdraw accumulated platform fees from the contract.</p>
                  <Button 
                    onClick={withdrawPlatformFees}
                    style={{ background: '#FFD700', color: '#000', marginTop: '1rem' }}
                  >
                    💰 Withdraw Fees
                  </Button>
                </div>
                
                <div style={{ 
                  background: 'rgba(0, 0, 0, 0.3)', 
                  borderRadius: '12px',
                  padding: '2rem'
                }}>
                  <h4>Database Admin</h4>
                  <p>Direct database management (use with caution).</p>
                  <Button 
                    onClick={() => window.open('/database-admin', '_blank')}
                    style={{ background: '#666', marginTop: '1rem' }}
                  >
                    🗄️ Open Database Admin
                  </Button>
                </div>
              </div>
            )}

            {activeTab === 'nftManagement' && (
              <div>
                <h3 style={{ color: '#00FF41', marginBottom: '2rem' }}>🪙 Contract NFT Management</h3>
                
                {/* Load NFTs Section */}
                <div style={{ 
                  background: 'rgba(0, 255, 65, 0.1)', 
                  border: '2px solid #00FF41',
                  borderRadius: '12px',
                  padding: '2rem',
                  marginBottom: '2rem'
                }}>
                  <h4 style={{ color: '#00FF41', marginBottom: '1rem' }}>📊 Load Contract NFTs</h4>
                  <p style={{ marginBottom: '1rem' }}>Load all NFTs currently held in the game contract.</p>
                  <Button 
                    onClick={loadContractNFTs}
                    disabled={isLoadingNFTs}
                    style={{ background: '#00FF41', color: '#000', marginTop: '1rem' }}
                  >
                    {isLoadingNFTs ? '🔄 Loading...' : '📥 Load NFTs'}
                  </Button>
                  {contractNFTs.length > 0 && (
                    <div style={{ marginTop: '1rem', color: '#00FF41' }}>
                      Loaded {contractNFTs.length} NFTs from contract
                    </div>
                  )}
                </div>

                {/* Withdrawal Section */}
                {contractNFTs.length > 0 && (
                  <div style={{ 
                    background: 'rgba(255, 215, 0, 0.1)', 
                    border: '2px solid #FFD700',
                    borderRadius: '12px',
                    padding: '2rem',
                    marginBottom: '2rem'
                  }}>
                    <h4 style={{ color: '#FFD700', marginBottom: '1rem' }}>💰 Withdraw NFTs</h4>
                    <p style={{ marginBottom: '1rem' }}>Select NFTs to withdraw to your wallet.</p>
                    
                    <div style={{ marginBottom: '1rem' }}>
                      <input
                        type="text"
                        placeholder={`Enter withdrawal address (default: ${walletAddress})`}
                        value={withdrawalAddress}
                        onChange={(e) => setWithdrawalAddress(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          borderRadius: '8px',
                          border: '1px solid rgba(255, 215, 0, 0.3)',
                          background: 'rgba(0, 0, 0, 0.3)',
                          color: '#fff',
                          marginBottom: '1rem'
                        }}
                      />
                      <div style={{ fontSize: '0.8rem', color: '#888', marginTop: '0.5rem' }}>
                        Leave empty to withdraw to your connected wallet: {formatAddress(walletAddress)}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                      <Button 
                        onClick={selectAllNFTs}
                        style={{ background: '#FFD700', color: '#000' }}
                      >
                        Select All NFTs ({contractNFTs.filter(nft => nft.nftContract !== '0x0000000000000000000000000000000000000000').length})
                      </Button>
                      <Button 
                        onClick={deselectAllNFTs}
                        style={{ background: '#666' }}
                      >
                        Deselect All
                      </Button>
                      <Button 
                        onClick={withdrawSelectedNFTs}
                        disabled={selectedNFTsForWithdrawal.length === 0}
                        style={{ 
                          background: selectedNFTsForWithdrawal.length > 0 ? '#ff4444' : '#666',
                          color: '#fff'
                        }}
                      >
                        Withdraw Selected ({selectedNFTsForWithdrawal.length})
                      </Button>
                    </div>
                  </div>
                )}

                {/* NFT List */}
                {contractNFTs.length > 0 && (
                  <div style={{ 
                    background: 'rgba(255, 255, 255, 0.05)', 
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '12px',
                    padding: '2rem'
                  }}>
                    <h4 style={{ marginBottom: '1rem' }}>📋 Contract NFTs ({contractNFTs.length})</h4>
                    
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
                      gap: '1rem' 
                    }}>
                      {contractNFTs.map((nft, index) => {
                        const isSelected = selectedNFTsForWithdrawal.some(selected => 
                          selected.uniqueKey === nft.uniqueKey
                        )
                        
                        return (
                          <div
                            key={`${nft.nftContract}-${nft.tokenId}-${index}`}
                            style={{
                              background: isSelected ? 'rgba(255, 215, 0, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                              border: isSelected ? '2px solid #FFD700' : '1px solid rgba(255, 255, 255, 0.1)',
                              borderRadius: '12px',
                              padding: '1rem',
                              cursor: 'pointer',
                              transition: 'all 0.3s ease',
                              position: 'relative'
                            }}
                            onClick={() => toggleNFTSelection(nft)}
                          >
                            {/* NFT Image */}
                            {nft.metadata?.image && nft.metadata.image !== '' ? (
                              <div style={{ 
                                width: '100%', 
                                height: '200px', 
                                backgroundImage: `url(${nft.metadata.image})`,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                                borderRadius: '8px',
                                marginBottom: '1rem'
                              }} />
                            ) : (
                              <div style={{ 
                                width: '100%', 
                                height: '200px', 
                                background: 'linear-gradient(45deg, #333, #666)',
                                borderRadius: '8px',
                                marginBottom: '1rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#888',
                                fontSize: '0.9rem'
                              }}>
                                {nft.nftContract === '0x0000000000000000000000000000000000000000' ? 'No NFT' : 'No Image'}
                              </div>
                            )}
                            
                            {/* NFT Info */}
                            <div style={{ marginBottom: '0.5rem' }}>
                              <strong>{nft.name || `NFT #${nft.tokenId}`}</strong>
                            </div>
                            <div style={{ fontSize: '0.9rem', color: '#ccc', marginBottom: '0.5rem' }}>
                              {nft.metadata?.name || `NFT #${nft.tokenId}`}
                            </div>
                            <div style={{ fontSize: '0.8rem', color: '#888', marginBottom: '0.5rem' }}>
                              Contract: {formatAddress(nft.nftContract)}
                            </div>
                            <div style={{ fontSize: '0.8rem', color: '#888', marginBottom: '0.5rem' }}>
                              Token ID: {nft.tokenId || 'N/A'}
                            </div>
                            <div style={{ 
                              fontSize: '0.8rem', 
                              color: '#00FF41',
                              fontWeight: 'bold'
                            }}>
                              ✅ In Contract
                            </div>
                            
                            {/* Selection indicator */}
                            {isSelected && (
                              <div style={{
                                position: 'absolute',
                                top: '0.5rem',
                                right: '0.5rem',
                                background: '#FFD700',
                                color: '#000',
                                borderRadius: '50%',
                                width: '24px',
                                height: '24px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '12px',
                                fontWeight: 'bold'
                              }}>
                                ✓
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </ContentArea>
        </>
      )}

      {/* Notifications */}
      {notifications.map(notification => (
        <Notification key={notification.id} type={notification.type}>
          {notification.message}
        </Notification>
      ))}
    </AdminContainer>
  )
} 