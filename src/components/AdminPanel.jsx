import React, { useState, useEffect } from 'react'
import { Calendar, Activity, DollarSign, Users, Shield, Settings, Search, ChevronDown, ChevronUp, Wallet, TrendingUp, AlertCircle, CheckCircle, XCircle, RefreshCw, Send, Eye, User, Coins, Image, BarChart3, Gamepad2, Crown, Zap } from 'lucide-react'
import styled from '@emotion/styled'
import { useWalletConnection } from '../utils/useWalletConnection'
import { useWallet } from '../contexts/WalletContext'
import contractService from '../services/ContractService'
import { ConnectButton as RainbowConnectButton } from '@rainbow-me/rainbowkit'

// Contract ABI (simplified - you'll need to add the full ABI)
const CONTRACT_ABI = [
  "function setPlatformFeePercent(uint256 _newPercent)",
  "function setListingFee(uint256 _newFeeUSD)",
  "function emergencyWithdrawNFT(address nftContract, uint256 tokenId, address to)",
  "function emergencyWithdrawETH(address to, uint256 amount)",
  "function emergencyWithdrawToken(address token, address to, uint256 amount)",
  "function platformFeePercent() view returns (uint256)",
  "function listingFeeUSD() view returns (uint256)",
  "function getGameDetails(uint256 gameId) view returns (tuple(uint256 gameId, address creator, address joiner, address nftContract, uint256 tokenId, uint8 state, uint8 gameType, uint8 creatorRole, uint8 joinerRole, uint8 joinerChoice), tuple(uint256 priceUSD, uint8 acceptedToken, uint256 totalPaid, uint8 paymentTokenUsed, uint256 listingFeePaid, uint256 platformFeeCollected), tuple(uint256 createdAt, uint256 expiresAt, uint8 maxRounds, uint8 currentRound, uint8 creatorWins, uint8 joinerWins, address winner, uint256 lastActionTime, uint256 countdownEndTime))",
  "function unclaimedETH(address) view returns (uint256)",
  "function unclaimedUSDC(address) view returns (uint256)",
  "function getUserUnclaimedNFTs(address user, address nftContract) view returns (uint256[])"
]

// Contract addresses for different chains
const CONTRACT_ADDRESSES = {
  'base': '0xBFD8912ded5830e43E008CCCEA822A6B0174C480', // Base contract address
  'ethereum': '0x...',
  'bnb': '0x...',
  'avalanche': '0x...',
  'polygon': '0x...'
}

// Chain configurations
const CHAIN_CONFIGS = {
  'base': { id: 8453, name: 'Base', rpc: 'https://mainnet.base.org', symbol: 'ETH', color: '#0052FF' },
  'ethereum': { id: 1, name: 'Ethereum', rpc: 'https://eth.llamarpc.com', symbol: 'ETH', color: '#627EEA' },
  'bnb': { id: 56, name: 'BNB Chain', rpc: 'https://bsc-dataseed.binance.org/', symbol: 'BNB', color: '#F3BA2F' },
  'avalanche': { id: 43114, name: 'Avalanche', rpc: 'https://api.avax.network/ext/bc/C/rpc', symbol: 'AVAX', color: '#E84142' },
  'polygon': { id: 137, name: 'Polygon', rpc: 'https://polygon-rpc.com/', symbol: 'MATIC', color: '#8247E5' }
}

// Admin wallet address (update this)
const ADMIN_WALLET = '0x93277281Fd256D0601Ce86Cdb1D5c00a97b59839' // Admin wallet address

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
    totalVolume: 0,
    platformFees: 0,
    monthlyFees: 0,
    totalNFTsInContract: 0,
    totalETHInContract: 0,
    totalUSDCInContract: 0
  })
  
  const [games, setGames] = useState([])
  const [filteredGames, setFilteredGames] = useState([])
  const [players, setPlayers] = useState([])
  const [settings, setSettings] = useState({
    platformFeePercent: 3.5,
    listingFeeUSD: 0.20
  })
  
  const [expandedGame, setExpandedGame] = useState(null)
  const [notifications, setNotifications] = useState([])
  
  // API URL
  const API_URL = 'https://cryptoflipz2-production.up.railway.app'
  
  // Admin wallet connection effect
  useEffect(() => {
    if (isFullyConnected && address) {
      if (address.toLowerCase() === ADMIN_WALLET.toLowerCase()) {
        setIsAdmin(true)
        setIsConnected(true)
        setWalletAddress(address)
        
        // Initialize contract service
        const chainName = chain?.name?.toLowerCase() || 'base'
        contractService.init(chainName, walletClient, publicClient)
          .then(() => {
            console.log('✅ Admin contract service initialized')
            loadData()
          })
          .catch(error => {
            console.error('❌ Failed to initialize contract service:', error)
          })
      } else {
        alert('Unauthorized wallet. Admin access only.')
      }
    }
  }, [isFullyConnected, address, walletClient, publicClient, chain])
  
  // Load data from database and blockchain
  const loadData = async () => {
    setLoading(true)
    try {
      // Load games from database
      const gamesResponse = await fetch(`${API_URL}/api/admin/games`)
      if (!gamesResponse.ok) throw new Error('Failed to load games')
      
      const data = await gamesResponse.json()
      setGames(data.games || [])
      
      // Update stats
      setStats(prev => ({
        ...prev,
        totalGames: data.stats?.totalGames || 0,
        activeGames: data.stats?.activeGames || 0,
        totalVolume: data.stats?.totalVolume || 0
      }))
      
      // Load blockchain data if contract service is initialized
      if (contractService.currentChain) {
        try {
          // Get contract balance (if method exists)
          console.log('Contract service is initialized for:', contractService.currentChain)
          
          // You can add more blockchain queries here
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
  const loadPlayerData = async (gamesData) => {
    const playerMap = new Map()
    
    gamesData.forEach(game => {
      // Process creator
      if (!playerMap.has(game.creator)) {
        playerMap.set(game.creator, {
          address: game.creator,
          gamesCreated: 0,
          gamesWon: 0,
          totalVolume: 0
        })
      }
      const creator = playerMap.get(game.creator)
      creator.gamesCreated++
      creator.totalVolume += game.price_usd || 0
      
      // Process joiner
      if (game.joiner && !playerMap.has(game.joiner)) {
        playerMap.set(game.joiner, {
          address: game.joiner,
          gamesCreated: 0,
          gamesWon: 0,
          totalVolume: 0
        })
      }
      if (game.joiner) {
        const joiner = playerMap.get(game.joiner)
        joiner.totalVolume += game.price_usd || 0
      }
    })
    
    setPlayers(Array.from(playerMap.values()))
  }
  
  // Update platform fee
  const updatePlatformFee = async () => {
    if (!contractService.currentChain) {
      addNotification('error', 'Contract not initialized')
      return
    }
    
    try {
      addNotification('info', 'Platform fee update not implemented yet - use contract directly')
      // TODO: Implement platform fee update through contract service
    } catch (error) {
      console.error('Error updating platform fee:', error)
      addNotification('error', 'Failed to update platform fee')
    }
  }
  
  // Update listing fee
  const updateListingFee = async () => {
    if (!contractService.currentChain) {
      addNotification('error', 'Contract not initialized')
      return
    }
    
    try {
      addNotification('info', 'Listing fee update not implemented yet - use contract directly')
      // TODO: Implement listing fee update through contract service
    } catch (error) {
      console.error('Error updating listing fee:', error)
      addNotification('error', 'Failed to update listing fee')
    }
  }
  
  // Emergency withdraw NFT from contract
  const emergencyWithdrawNFT = async (gameId) => {
    if (!confirm('Emergency withdraw NFT from this game?')) return
    
    try {
      const game = games.find(g => g.id === gameId)
      if (!game) throw new Error('Game not found')
      
      // Use contract service to withdraw NFT
      const result = await contractService.emergencyCancelGame(game.contract_game_id)
      
      if (result.success) {
        addNotification('success', 'NFT withdrawn successfully!')
        
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
      const result = await contractService.withdrawRewards()
      
      if (result.success) {
        addNotification('success', `Withdrew ${result.ethWithdrawn} ETH and ${result.usdcWithdrawn} USDC`)
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      addNotification('error', 'Failed to withdraw fees: ' + error.message)
    }
  }
  
  // Cancel game in database
  const cancelGameInDB = async (gameId) => {
    try {
      const response = await fetch(`${API_URL}/api/admin/games/${gameId}/cancel`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' }
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
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }
  
  // Format date
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString()
  }
  
  // Get status color
  const getStatusColor = (status) => {
    switch(status) {
      case 'active': return '#00FF41'
      case 'completed': return '#FF6B35'
      case 'cancelled': return '#FF4444'
      default: return '#666'
    }
  }
  
  // Filter games
  useEffect(() => {
    const filtered = games.filter(game => 
      game.id.toString().includes(searchQuery) ||
      game.creator.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (game.joiner && game.joiner.toLowerCase().includes(searchQuery.toLowerCase()))
    )
    setFilteredGames(filtered)
  }, [games, searchQuery])
  
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
          </TabContainer>

          <ContentArea>
            {activeTab === 'overview' && (
              <div>
                <StatsGrid>
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
                </StatsGrid>
                
                <div style={{ marginTop: '2rem' }}>
                  <h3>Recent Activity</h3>
                  {games.slice(0, 5).map(game => (
                    <GameCard key={game.id}>
                      <GameHeader>
                        <div>
                          <strong>Game #{game.id}</strong>
                          <div style={{ fontSize: '0.9rem', color: '#ccc' }}>
                            Created by {formatAddress(game.creator)}
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
            )}

            {activeTab === 'games' && (
              <div>
                <SearchBar>
                  <Search size={20} />
                  <input
                    type="text"
                    placeholder="Search by game ID or address..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </SearchBar>
                
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
                          <p><strong>Joiner:</strong> {formatAddress(game.joiner)}</p>
                          <p><strong>Price:</strong> ${game.price_usd} USD</p>
                          <p><strong>Contract Game ID:</strong> {game.contract_game_id || 'N/A'}</p>
                          <p><strong>Created:</strong> {formatDate(game.created_at)}</p>
                          
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
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                      <div>
                        <strong>Games Created:</strong> {player.gamesCreated}
                      </div>
                      <div>
                        <strong>Games Won:</strong> {player.gamesWon}
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