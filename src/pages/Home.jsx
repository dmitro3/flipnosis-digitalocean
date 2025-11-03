// 1. React imports first
import React, { useState, useEffect } from 'react'

// 2. Third-party imports
import { Link, useNavigate } from 'react-router-dom'
import { ThemeProvider } from '@emotion/react'
import styled from '@emotion/styled'
import { ConnectButton } from '@rainbow-me/rainbowkit'

// 3. Context imports
import { useWallet } from '../contexts/WalletContext'
import { useToast } from '../contexts/ToastContext'

// 4. Service imports
import contractService from '../services/ContractService'

// 5. Component imports
import ClaimRewards from '../components/ClaimRewards'
import NFTOfferComponent from '../components/NFTOfferComponent'
import NFTDepositBadge from '../components/NFTDepositBadge'

// 6. Style imports
import { theme } from '../styles/theme'
import { API_CONFIG, getApiUrl } from '../config/api'
import {
  Container,
  ContentWrapper,
  GlassCard,
  NeonText,
  Button,
  Grid,
  GameCard,
  GameImage,
  LoadingSpinner,
  TwoBoxLayout,
  ActiveGamesBox,
  ActiveGamesTitle,
  LiveDot,
  ActiveGameItem,
  GameItemInfo,
  GameItemTitle,
  GameItemDetails,
  GameInfo,
  GameTitle,
  GameCollection,
  GameStats,
  GameStat,
  GamePrice,
  GameFlipButton,
  TransparentCard,
  ChainBadge,
  StatusBadge,
  PriceBadge
} from '../styles/components'

// 7. Asset imports last
import hazeVideo from '../../Images/Video/haze.webm'


  // Helper functions for chain URLs
  const getExplorerUrl = (chain) => {
    if (!chain) return 'https://etherscan.io' // Default to Ethereum explorer
    
    const explorers = {
      ethereum: 'https://etherscan.io',
      polygon: 'https://polygonscan.com',
      base: 'https://basescan.org',
      arbitrum: 'https://arbiscan.io',
      optimism: 'https://optimistic.etherscan.io',
      // Add more chains as needed
    }
    return explorers[chain.toLowerCase()] || 'https://etherscan.io'
  }

  const getMarketplaceUrl = (chain) => {
    if (!chain) return 'https://opensea.io/assets/ethereum' // Default to Ethereum marketplace
    
    const marketplaces = {
      ethereum: 'https://opensea.io/assets/ethereum',
      polygon: 'https://opensea.io/assets/matic',
      base: 'https://opensea.io/assets/base',
      arbitrum: 'https://opensea.io/assets/arbitrum',
      optimism: 'https://opensea.io/assets/optimism',
      // Add more chains as needed
    }
    return marketplaces[chain.toLowerCase()] || 'https://opensea.io/assets/ethereum'
  }

  // Helper function to get chain icon
  const getChainIcon = (chain) => {
    if (!chain) return '🌐'
    
    const icons = {
      ethereum: '💎',
      polygon: '🟣',
      base: '🔵',
      arbitrum: '🔷',
      optimism: '🔶',
      bsc: '🟡',
      avalanche: '🔴'
    }
    return icons[chain.toLowerCase()] || '🌐'
  }

  // Helper function to get chain name
  const getChainName = (chain) => {
    if (!chain) return 'Unknown'
    
    const names = {
      ethereum: 'ETH',
      polygon: 'POLY',
      base: 'BASE',
      arbitrum: 'ARB',
      optimism: 'OPT',
      bsc: 'BNB',
      avalanche: 'AVAX'
    }
    return names[chain.toLowerCase()] || chain.toUpperCase()
  }

const BackgroundVideo = styled.video`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  z-index: -1;
  opacity: 0.7;
`

const FilterContainer = styled.div`
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  align-items: center;
  width: 100%;

  @media (max-width: 768px) {
    flex-wrap: nowrap;
    gap: 0.25rem;
  }
`

const DesktopFilters = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  gap: 0.75rem;
  width: 100%;

  @media (max-width: 1400px) {
    grid-template-columns: repeat(auto-fit, minmax(90px, 1fr));
  }

  @media (max-width: 1200px) {
    grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
  }

  @media (max-width: 768px) {
    display: none;
  }
`

const FilterButton = styled(Button)`
  background: ${props => props.active ? props.theme.colors.neonGreen : 'transparent'};
  border: 1px solid ${props => props.theme.colors.neonGreen};
  padding: 0.5rem 0.75rem;
  color: ${props => props.active ? '#000B1A' : props.theme.colors.textPrimary};
  white-space: nowrap;
  width: 100%;
  text-align: center;
  font-size: 1.7rem;

  @media (max-width: 768px) {
    padding: 0.5rem;
    font-size: 1.8rem;
  }
`

const FilterSelect = styled.select`
  display: none;
  background: transparent;
  border: 1px solid ${props => props.theme.colors.neonGreen};
  color: ${props => props.theme.colors.textPrimary};
  padding: 0.5rem;
  border-radius: 0.5rem;
  cursor: pointer;
  font-size: 0.9rem;
  width: 100%;
  max-width: 200px;

  @media (max-width: 768px) {
    display: block;
  }

  option {
    background: ${props => props.theme.colors.bgDark};
    color: ${props => props.theme.colors.textPrimary};
  }
`

const SearchInput = styled.input`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid ${props => props.theme.colors.neonBlue};
  color: ${props => props.theme.colors.textPrimary};
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  font-size: 0.9rem;
  width: 100%;
  max-width: 300px;
  transition: all 0.3s ease;

  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.neonPink};
    box-shadow: 0 0 10px ${props => props.theme.colors.neonPink};
  }

  &::placeholder {
    color: ${props => props.theme.colors.textSecondary};
  }

  @media (max-width: 768px) {
    max-width: 100%;
    margin-bottom: 0.5rem;
  }
`

const ViewToggleContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;

  @media (max-width: 768px) {
    display: none; /* Hide on mobile - use list view only */
  }
`

const ViewToggleButton = styled.button`
  background: ${props => props.active ? props.theme.colors.neonGreen : 'transparent'};
  border: 1px solid ${props => props.theme.colors.neonGreen};
  color: ${props => props.active ? '#000B1A' : props.theme.colors.textPrimary};
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  font-weight: bold;

  &:hover {
    background: ${props => props.active ? props.theme.colors.neonGreen : 'rgba(0, 255, 65, 0.1)'};
    transform: scale(1.05);
  }
`

const ListViewContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  width: 100%;

  @media (max-width: 768px) {
    gap: 0.5rem;
  }
`

const ListViewItem = styled.div`
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 0.75rem;
  padding: 1rem;
  cursor: ${props => props.isJoinable ? 'pointer' : 'default'};
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 1rem;
  opacity: ${props => props.isJoinable ? 1 : 0.85};

  &:hover {
    ${props => props.isJoinable && `
      transform: scale(1.02);
      background: rgba(255, 255, 255, 0.15);
      box-shadow: 0 0 15px rgba(255, 255, 255, 0.2);
    `}
  }

  /* Desktop improvements - larger spacing and padding */
  @media (min-width: 769px) {
    padding: 1.5rem;
    gap: 1.5rem;
  }

  @media (max-width: 768px) {
    flex-direction: row;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem;
    min-height: 80px;
    width: 100%;
    justify-content: space-between;
  }
`

const ListViewImage = styled.div`
  position: relative;
  width: 80px;
  height: 80px;
  border-radius: 0.5rem;
  overflow: hidden;
  flex-shrink: 0;

  @media (max-width: 768px) {
    width: 70px;
    height: 70px;
    border-radius: 0.4rem;
  }
`

const ListViewContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  flex: 1;
  min-width: 0;

  /* Desktop improvements - larger spacing between content sections */
  @media (min-width: 769px) {
    gap: 0.75rem;
  }

  @media (max-width: 768px) {
    gap: 0.25rem;
    flex: 1;
    justify-content: space-between;
  }
`

const ListViewHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;

  /* Desktop improvements - larger spacing in header */
  @media (min-width: 769px) {
    gap: 1.5rem;
  }

  @media (max-width: 768px) {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    gap: 0.5rem;
  }
`

const ListViewTitle = styled.div`
  font-size: 1.1rem;
  font-weight: bold;
  color: ${props => props.theme.colors.textPrimary};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 200px;

  /* Desktop improvements - larger text size */
  @media (min-width: 769px) {
    font-size: 1.3rem;
    max-width: 300px;
  }

  @media (max-width: 768px) {
    font-size: 0.9rem;
    max-width: 120px;
    flex: 1;
  }
`

const ListViewCollection = styled.div`
  font-size: 0.9rem;
  color: ${props => props.theme.colors.textSecondary};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 200px;

  /* Desktop improvements - larger text size */
  @media (min-width: 769px) {
    font-size: 1.1rem;
    max-width: 300px;
  }

  @media (max-width: 768px) {
    font-size: 0.8rem;
    max-width: 120px;
  }
`

const ListViewStats = styled.div`
  display: flex;
  gap: 1rem;
  align-items: center;
  flex-wrap: wrap;

  /* Desktop improvements - evenly distribute stats using grid */
  @media (min-width: 769px) {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 4rem;
    width: 100%;
    align-items: start;
  }

  @media (max-width: 768px) {
    gap: 0.5rem;
    flex-direction: row;
    justify-content: space-between;
    width: 100%;
  }
`

const ListViewStat = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  color: ${props => props.theme.colors.textSecondary};

  /* Desktop improvements - larger text size and spacing, stack vertically */
  @media (min-width: 769px) {
    font-size: 1rem;
    gap: 0.5rem;
    flex-direction: column;
    align-items: flex-start;
    width: 100%;
  }

  @media (max-width: 768px) {
    font-size: 0.75rem;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.2rem;
  }
`

const ListViewPrice = styled.div`
  font-size: 1.2rem;
  font-weight: bold;
  color: ${props => props.theme.colors.neonBlue};
  margin-left: auto;

  /* Desktop improvements - larger price text */
  @media (min-width: 769px) {
    font-size: 1.4rem;
  }

  @media (max-width: 768px) {
    font-size: 1rem;
    margin-left: 0;
    text-align: right;
    flex-shrink: 0;
  }
`

const Home = () => {
  const navigate = useNavigate()
  const { showSuccess, showError, showInfo } = useToast()
  const { isConnected, address } = useWallet()
  
  const [games, setGames] = useState([])
  const [listings, setListings] = useState([])
  const [battleRoyaleGames, setBattleRoyaleGames] = useState([])
  const [loading, setLoading] = useState(false)
  const [activeFilter, setActiveFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [error, setError] = useState(null)
  const [selectedFlip, setSelectedFlip] = useState(null)
  const [viewMode, setViewMode] = useState('grid') // Default to grid view, mobile will use list
  const [ethPriceUSD, setEthPriceUSD] = useState(0)

  // Fetch data from database
  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('🔍 Fetching data from:', getApiUrl('/listings'))
      
      // Fetch listings
      const listingsResponse = await fetch(getApiUrl('/listings'))
      console.log('📊 Listings response status:', listingsResponse.status, listingsResponse.statusText)
      
      let listings
      if (!listingsResponse.ok) {
        const errorText = await listingsResponse.text()
        console.error('❌ Listings API error response:', errorText)
        throw new Error(`Listings API error: ${listingsResponse.status} ${listingsResponse.statusText}`)
      }
      
      try {
        listings = await listingsResponse.json()
        console.log('✅ Listings loaded:', listings?.length || 0, 'items')
      } catch (e) {
        console.error('❌ Listings response not JSON:', e)
        throw new Error('Listings API did not return valid JSON')
      }
      
      console.log('🔍 Fetching data from:', getApiUrl('/games'))
      
      // Fetch games
      const gamesResponse = await fetch(getApiUrl('/games'))
      console.log('📊 Games response status:', gamesResponse.status, gamesResponse.statusText)
      
      let games
      if (!gamesResponse.ok) {
        const errorText = await gamesResponse.text()
        console.error('❌ Games API error response:', errorText)
        throw new Error(`Games API error: ${gamesResponse.status} ${gamesResponse.statusText}`)
      }
      
      try {
        games = await gamesResponse.json()
        console.log('✅ Games loaded:', games?.length || 0, 'items')
      } catch (e) {
        console.error('❌ Games response not JSON:', e)
        throw new Error('Games API did not return valid JSON')
      }
      
      console.log('🔍 Fetching data from:', getApiUrl('/battle-royale'))
      
      // Fetch battle royale games
      const battleRoyaleResponse = await fetch(getApiUrl('/battle-royale'))
      console.log('📊 Battle Royale response status:', battleRoyaleResponse.status, battleRoyaleResponse.statusText)
      
      let battleRoyaleGames
      if (!battleRoyaleResponse.ok) {
        const errorText = await battleRoyaleResponse.text()
        console.error('❌ Battle Royale API error response:', errorText)
        throw new Error(`Battle Royale API error: ${battleRoyaleResponse.status} ${battleRoyaleResponse.statusText}`)
      }
      
      try {
        const battleRoyaleData = await battleRoyaleResponse.json()
        battleRoyaleGames = battleRoyaleData.games || []
        console.log('✅ Battle Royale games loaded:', battleRoyaleGames?.length || 0, 'items')
      } catch (e) {
        console.error('❌ Battle Royale response not JSON:', e)
        throw new Error('Battle Royale API did not return valid JSON')
      }
      
      setListings(listings || [])
      setGames(games || [])
      setBattleRoyaleGames(battleRoyaleGames || [])
    } catch (error) {
      console.error('❌ Error fetching data:', error)
      setError('Failed to load games and listings: ' + error.message)
      showError('Failed to load games and listings: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    // Note: Removed auto-refresh interval since WebSocket provides real-time updates
  }, [])

  // Fetch ETH price for USD display (uses cached service, won't spam CoinGecko)
  useEffect(() => {
    const fetchPrice = async () => {
      try {
        const price = await contractService.getETHPriceUSD()
        setEthPriceUSD(price)
      } catch (error) {
        console.warn('Failed to fetch ETH price for display:', error)
      }
    }
    fetchPrice()
    // Refresh price every 90 seconds to stay current
    const interval = setInterval(fetchPrice, 90000)
    return () => clearInterval(interval)
  }, [])

  // Auto-select only when nothing is user-selected, and don't override a manual selection
  useEffect(() => {
    const filteredItems = getAllItems()
    
    if (!selectedFlip && filteredItems.length > 0) {
      const mostRecentFlip = filteredItems[0]
      setSelectedFlip(mostRecentFlip)
      return
    }
    
    if (selectedFlip && filteredItems.length > 0) {
      const isSelectedFlipStillAvailable = filteredItems.some(item => item.id === selectedFlip.id)
      if (!isSelectedFlipStillAvailable) {
        // Keep user's selection if possible; otherwise fallback to most recent
        const mostRecentFlip = filteredItems[0]
        setSelectedFlip(mostRecentFlip)
      }
    }
    
    if (filteredItems.length === 0 && selectedFlip) {
      setSelectedFlip(null)
    }
  }, [listings, games, battleRoyaleGames, selectedFlip, activeFilter, searchQuery])

  // Listen for global WebSocket messages for real-time updates
  useEffect(() => {
    const handleWebSocketMessage = (event) => {
      const data = event.detail
      
      // Add null check to prevent the error
      if (!data || !data.type) {
        console.warn('⚠️ Received invalid WebSocket message in Home:', data)
        return
      }
      
      console.log('🏠 Home page received WebSocket message:', data.type, data)
      
      switch (data.type) {
        case 'new_offer':
          console.log('🔔 New offer detected, refreshing listings')
          // Refresh data to show updated offer counts
          fetchData()
          break
        case 'offer_accepted':
          console.log('✅ Offer accepted, refreshing listings')
          fetchData()
          break
        case 'listing_converted_to_game':
          console.log('🎮 Listing converted to game, refreshing')
          fetchData()
          break
      }
    }

    window.addEventListener('websocketMessage', handleWebSocketMessage)
    
    return () => {
      window.removeEventListener('websocketMessage', handleWebSocketMessage)
    }
  }, [])

  const getAllItems = () => {
    // Create a map to track unique games by their core ID
    const uniqueItems = new Map()
    
    // Process listings
    listings.forEach(l => {
      // Skip if this listing has been converted to a game
      const hasActiveGame = games.some(g => g.listing_id === l.id && g.status !== 'cancelled')
      if (!hasActiveGame) {
        uniqueItems.set(l.id, {
          ...l,
          isListing: true,
          displayId: l.id,
          nft: {
            name: l.nft_name || 'Unknown NFT',
            image: l.nft_image || '/placeholder-nft.svg',
            collection: l.nft_collection || 'Unknown Collection',
            chain: l.nft_chain || 'base',
            contractAddress: l.nft_contract,
            tokenId: l.nft_token_id
          },
          gameType: 'nft-vs-crypto',
          priceUSD: l.asking_price || 0
        })
      }
    })
  
    // Process games - only show games with NFTs deposited
    games.filter(g => 
      g.status !== 'cancelled' && 
      g.status !== 'waiting_deposits' && 
      g.status !== 'waiting_challenger_deposit' &&
      g.nft_deposited === 1  // Only show games with NFTs actually deposited
      // Note: 'awaiting_challenger' games should be shown - they are open for challengers
    ).forEach(g => {
      // Use the game ID as the key, removing any listing entry
      if (g.listing_id) {
        uniqueItems.delete(g.listing_id)
      }
      uniqueItems.set(g.id, {
        ...g,
        isListing: false,
        displayId: g.id,
        nft: {
          name: g.nft_name || 'Unknown NFT',
          image: g.nft_image || '/placeholder-nft.svg',
          collection: g.nft_collection || 'Unknown Collection',
          chain: g.nft_chain || 'base',
          contractAddress: g.nft_contract,
          tokenId: g.nft_token_id
        },
        gameType: 'nft-vs-nft',
        priceUSD: g.price_usd || 0,
        // Include NFT deposit tracking fields
        nft_deposited: g.nft_deposited,
        nft_deposit_verified: g.nft_deposit_verified,
        nft_deposit_time: g.nft_deposit_time,
        nft_deposit_hash: g.nft_deposit_hash
      })
    })
  
    // Process battle royale games
    console.log('🔍 Processing battle royale games:', battleRoyaleGames.length, 'total')
    battleRoyaleGames.filter(br => {
      const shouldInclude = br.status !== 'cancelled' && br.status !== 'complete'
      console.log('🔍 Battle royale game:', br.id, 'status:', br.status, 'include:', shouldInclude)
      return shouldInclude
    }).forEach(br => {
      uniqueItems.set(br.id, {
        ...br,
        isListing: false,
        isBattleRoyale: true,
        displayId: br.id,
        nft: {
          name: br.nft_name || 'Unknown NFT',
          image: br.nft_image || '/placeholder-nft.svg',
          collection: br.nft_collection || 'Unknown Collection',
          chain: 'base', // Battle royale games are on base
          contractAddress: br.nft_contract,
          tokenId: br.nft_token_id
        },
        gameType: 'battle-royale',
        priceUSD: br.entry_fee || 0,
        // Include battle royale specific fields
        entry_fee: br.entry_fee,
        service_fee: br.service_fee,
        max_players: br.max_players,
        current_players: br.current_players,
        participants: br.participants || []
      })
    })
  
    // Convert map to array and filter
    return Array.from(uniqueItems.values()).filter(item => {
      const matchesFilter = activeFilter === 'all' || 
        (activeFilter === item.nft?.chain)
      const matchesSearch = !searchQuery || 
        (item.nft?.name?.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.nft?.collection?.toLowerCase().includes(searchQuery.toLowerCase()))
      return matchesFilter && matchesSearch
    }).sort((a, b) => {
      // Sort by created_at timestamp, most recent first
      const aTime = new Date(a.created_at || a.createdAt || 0).getTime()
      const bTime = new Date(b.created_at || b.createdAt || 0).getTime()
      return bTime - aTime
    })
  }

  const handleItemClick = (item) => {
    // Always populate Current Flip immediately; gatekeeping (like NFT deposit)
    // should happen when entering the game from the Current Flip panel
    handleSelectFlip(item)
  }

  const checkNFTDeposit = async (item) => {
    try {
      // First check database status if available
      if (item.nft_deposited !== undefined) {
        if (!item.nft_deposited) {
          showError('This game is not ready - NFT not deposited')
          return false
        }
        return true
      }
      
      // Fallback to contract check
      const gameState = await contractService.getGameState(item.id)
      if (!gameState.success || !gameState.gameState.nftDeposit.hasDeposit) {
        showError('This game is not ready - NFT not deposited')
        return false
      }
      
      return true
    } catch (error) {
      console.error('Error checking NFT deposit:', error)
      showError('Unable to verify game status')
      return false
    }
  }

  const filteredItems = getAllItems()

  const chainFilters = [
    { key: 'all', name: 'ALL', icon: '🌐' },
    { key: 'ethereum', name: 'ETH', icon: '💎' },
    { key: 'base', name: 'BASE', icon: '🔵' },
    { key: 'bnb', name: 'BNB', icon: '🟡' },
    { key: 'avalanche', name: 'AVAX', icon: '🔴' },
    { key: 'polygon', name: 'POLY', icon: '🟣' },
    { key: 'arbitrum', name: 'ARB', icon: '🔷' }
  ]

  const handleSelectFlip = (flip) => {
    // Safety check for valid flip
    if (!flip || !flip.id || flip.id === 'null') {
      console.error('⚠️ Cannot select flip: Invalid flip data:', flip)
      return
    }
    
    // Debug logging to see the NFT data structure
    console.log('🔍 Selected flip NFT data:', {
      name: flip.nft?.name,
      contractAddress: flip.nft?.contractAddress,
      tokenId: flip.nft?.tokenId,
      chain: flip.nft?.chain,
      collection: flip.nft?.collection
    })
    
    setSelectedFlip(flip)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'waiting': return '🟢'
      case 'joined': return '🟠'
      case 'active': return '' // No icon for LIVE
      case 'pending': return '🟡'
      case 'completed': return '🔴'
      default: return '' // No icon for default/LIVE
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'active': return 'LIVE'
      case 'in_progress': return 'IN PROGRESS'
      case 'completed': return 'COMPLETE'
      case 'cancelled': return 'CANCELLED'
      default: return 'LIVE'
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return '#00FF00' // Bright Green
      case 'in_progress': return '#FFA500' // Orange
      case 'completed': return '#FF4444' // Red
      case 'cancelled': return '#808080' // Gray
      default: return '#00FF00' // Bright Green (for LIVE)
    }
  }

  // Helper function to convert hex color to rgba string
  const hexToRgba = (hex, alpha = 0.9) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    if (!result) return `rgba(128, 128, 128, ${alpha})` // fallback to gray
    const r = parseInt(result[1], 16)
    const g = parseInt(result[2], 16)
    const b = parseInt(result[3], 16)
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  }

  const isGameJoinable = (status) => {
    return status === 'waiting' || status === 'pending'
  }

  const handleMakeOffer = async (flip) => {
    if (!isConnected) {
      showError('Please connect your wallet first')
      return
    }

    if (flip.creator?.toLowerCase() === address?.toLowerCase()) {
      showError('You cannot make an offer on your own listing')
      return
    }

    try {
      setLoading(true)
      showInfo('Making offer...')

      // Use production API URL
      const baseUrl = getApiUrl('')

      // Get current user's profile data
      const profileResponse = await fetch(`${baseUrl}/api/profile/${address}`)
      let challengerName = address.slice(0, 6) + '...' + address.slice(-4)
      let challengerImage = null
      
      if (profileResponse.ok) {
        const profile = await profileResponse.json()
        challengerName = profile.name || profile.username || challengerName
        challengerImage = profile.avatar || profile.profile_picture || null
      }

      const offerData = {
        listing_id: flip.listingId,
        offerer_address: address,
        offerer_name: challengerName,
        offer_price: flip.priceUSD,
        message: `I want to play with ${flip.nft.name}!`,
        challenger_name: challengerName,
        challenger_image: challengerImage
      }

      console.log('🔍 Making offer with data:', {
        address,
        isConnected,
        offerData,
        flip
      })

      // Connect to WebSocket and join listing room before making offer
      if (window.socket && window.socket.readyState === WebSocket.OPEN) {
        console.log('📡 Joining listing room for real-time updates:', flip.listingId)
        window.socket.send(JSON.stringify({
          type: 'join_room',
          roomId: flip.listingId
        }))
      }

      const response = await fetch(`${baseUrl}/api/listings/${flip.listingId}/offers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(offerData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to make offer')
      }

      const result = await response.json()
      showSuccess('Offer made successfully! The creator will be notified.')
      
      // Refresh the listings and games
      await fetchData()
    } catch (error) {
      console.error('❌ Error making offer:', error)
      showError(error.message || 'Failed to make offer')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateGame = async () => {
    if (!isConnected) {
      showError('Please connect your wallet first')
      return
    }

    try {
      setLoading(true)
      showInfo('Creating new game...')

      // Create game data
      const gameData = {
        creator: address,
        joiner: null,
        status: 'waiting',
        createdAt: new Date().toISOString()
      }

      // Create game in database
      const response = await fetch('/api/games', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(gameData)
      })

      if (!response.ok) {
        throw new Error('Failed to create game')
      }

      const result = await response.json()
      showSuccess('Game created successfully!')
      window.location.href = `/test-tubes.html?gameId=${result.gameId}`
    } catch (error) {
      console.error('Error creating game:', error)
      showError(error.message || 'Failed to create game')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <ThemeProvider theme={theme}>
        <BackgroundVideo autoPlay loop muted playsInline>
          <source src={hazeVideo} type="video/webm" />
        </BackgroundVideo>
        <Container>
          <ContentWrapper>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
              <LoadingSpinner />
              <span style={{ marginLeft: '1rem', color: theme.colors.textSecondary }}>
                Loading games from database...
              </span>
            </div>
          </ContentWrapper>
        </Container>
      </ThemeProvider>
    )
  }

  if (error) {
    return (
      <ThemeProvider theme={theme}>
        <BackgroundVideo autoPlay loop muted playsInline>
          <source src={hazeVideo} type="video/webm" />
        </BackgroundVideo>
        <Container>
          <ContentWrapper>
            <GlassCard style={{ textAlign: 'center', padding: '3rem' }}>
              <NeonText style={{ fontSize: '2rem', marginBottom: '1rem', color: theme.colors.statusError }}>
                Error Loading Games
              </NeonText>
              <p style={{ color: theme.colors.textSecondary, marginBottom: '2rem' }}>{error}</p>
              <Button onClick={fetchData} style={{ background: theme.colors.neonPink }}>
                Retry
              </Button>
            </GlassCard>
          </ContentWrapper>
        </Container>
      </ThemeProvider>
    )
  }

  return (
    <ThemeProvider theme={theme}>
      <BackgroundVideo autoPlay loop muted playsInline>
        <source src={hazeVideo} type="video/webm" />
      </BackgroundVideo>
      <Container style={{ paddingTop: '0.5rem' }}>
        <ContentWrapper style={{ paddingTop: '0.5rem' }}>
          {/* Add ClaimRewards component */}
          <ClaimRewards />
          
          
          {/* Chain Filters */}
          <TransparentCard style={{ background: theme.colors.bgDark, marginTop: '0' }}>
            <FilterContainer>
              {/* Desktop Filters */}
              <DesktopFilters>
                {chainFilters.map(filter => (
                  <FilterButton
                    key={filter.key}
                    onClick={() => setActiveFilter(filter.key)}
                    active={activeFilter === filter.key}
                  >
                    {filter.icon} {filter.name}
                  </FilterButton>
                ))}
              </DesktopFilters>

              {/* Mobile Filter Dropdown */}
              <FilterSelect
                value={activeFilter}
                onChange={(e) => setActiveFilter(e.target.value)}
              >
                {chainFilters.map(filter => (
                  <option key={filter.key} value={filter.key}>
                    {filter.icon} {filter.name}
                  </option>
                ))}
              </FilterSelect>
            </FilterContainer>
          </TransparentCard>

          {/* View Toggle - Desktop only, mobile uses list view */}
          <ViewToggleContainer>
            <ViewToggleButton
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              active={viewMode === 'list'}
            >
              {viewMode === 'grid' ? (
                <>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M4 6h16M4 10h16M4 14h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Switch to List View
                </>
              ) : (
                <>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M8 6H6a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2zM18 6h-2a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2zM8 16H6a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2v-2a2 2 0 0 0-2-2zM18 16h-2a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2v-2a2 2 0 0 0-2-2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Switch to Grid View
                </>
              )}
            </ViewToggleButton>
          </ViewToggleContainer>

          {filteredItems.length === 0 ? (
            <GlassCard style={{ textAlign: 'center', padding: '3rem', border: `2px solid ${theme.colors.neonPink}` }}>
              <NeonText style={{ fontSize: '2rem', marginBottom: '1rem' }}>No Games Available</NeonText>
              <p style={{ color: theme.colors.textSecondary, marginBottom: '2rem' }}>
                Be the first to create a battle royale game!
              </p>
              <Button as={Link} to="/create" style={{ background: theme.colors.neonGreen }}>
                Create Flip
              </Button>
            </GlassCard>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: window.innerWidth <= 768 ? '1fr' : 
                                 window.innerWidth <= 1200 ? '300px 1fr' : 
                                 window.innerWidth <= 1600 ? '350px 1fr' :
                                 '400px 1fr',
              gap: window.innerWidth <= 768 ? '1.5rem' : 
                   window.innerWidth <= 1200 ? '2rem' : '2.5rem',
              marginTop: '2rem'
            }}>
              {/* Left Box - Selected Game and Offers */}
              <div style={{
                order: window.innerWidth <= 768 ? 1 : 0,
                width: window.innerWidth <= 768 ? '100%' : 
                       window.innerWidth <= 1200 ? '300px' : 
                       window.innerWidth <= 1600 ? '350px' : '400px'
              }}>
                {selectedFlip && (
                  <div style={{
                    background: 'rgba(0, 0, 0, 0.8)',
                    borderRadius: '1rem',
                    padding: window.innerWidth <= 768 ? '1.25rem' : '1.5rem',
                    border: `2px solid ${
                      selectedFlip.gameType === 'nft-vs-nft' ? theme.colors.neonGreen : 
                      selectedFlip.gameType === 'battle-royale' ? theme.colors.neonBlue : 
                      theme.colors.neonPink
                    }`,
                    maxWidth: window.innerWidth <= 768 ? '100%' : 
                              window.innerWidth <= 1200 ? '300px' : 
                              window.innerWidth <= 1600 ? '350px' : '400px'
                  }}>
                    <div style={{ 
                      fontSize: '1.2rem', 
                      fontWeight: 'bold', 
                      color: theme.colors.neonBlue,
                      borderBottom: `2px solid ${theme.colors.neonBlue}`,
                      paddingBottom: '0.5rem',
                      marginBottom: '1rem',
                      textShadow: `0 0 10px ${theme.colors.neonBlue}`
                    }}>
                      Current Flip
                    </div>
                    <div style={{ 
                      display: 'flex',
                      flexDirection: window.innerWidth <= 768 ? 'row' : 'column',
                      gap: window.innerWidth <= 768 ? '1rem' : '1rem',
                      alignItems: window.innerWidth <= 768 ? 'flex-start' : 'stretch'
                    }}>
                      <div style={{ 
                        position: 'relative', 
                        aspectRatio: '1', 
                        borderRadius: '0.75rem', 
                        overflow: 'hidden',
                        width: window.innerWidth <= 768 ? '60%' : '100%',
                        flexShrink: 0
                      }}>
                        <GameImage 
                          src={selectedFlip.nft.image} 
                          alt={selectedFlip.nft.name}
                          onError={(e) => {
                            e.target.src = '/placeholder-nft.svg'
                          }}
                        />
                        {window.innerWidth > 768 && (
                          <div style={{
                            position: 'absolute',
                            bottom: '0.5rem',
                            right: '0.5rem',
                            background: selectedFlip.gameType === 'nft-vs-nft' ? 
                              'linear-gradient(45deg, #00FF41, #39FF14)' : 
                              selectedFlip.gameType === 'battle-royale' ?
                              'linear-gradient(45deg, #00BFFF, #0080FF)' :
                              'linear-gradient(45deg, #FF1493, #FF69B4)',
                            color: selectedFlip.gameType === 'nft-vs-nft' ? '#000' : '#fff',
                            padding: '0.25rem 0.5rem',
                            borderRadius: '0.25rem',
                            fontSize: '0.7rem',
                            fontWeight: 'bold'
                          }}>
                            {selectedFlip.gameType === 'nft-vs-nft' ? '⚔️ NFT BATTLE' : 
                             selectedFlip.gameType === 'battle-royale' ? '🏆 BATTLE ROYALE' : 
                             '💰 CRYPTO'}
                          </div>
                        )}
                      </div>

                      {window.innerWidth <= 768 && (
                        <div style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.5rem',
                          flex: 1
                        }}>
                          <div style={{
                            background: 'rgba(255, 255, 255, 0.1)',
                            padding: '0.5rem',
                            borderRadius: '0.5rem',
                            border: '1px solid rgba(255, 255, 255, 0.2)'
                          }}>
                            <div style={{ fontSize: '0.7rem', color: theme.colors.textSecondary }}>Price</div>
                            <div style={{ 
                              fontSize: '1rem', 
                              fontWeight: 'bold',
                              color: theme.colors.neonPink
                            }}>
                              {(() => {
                                if (selectedFlip.gameType === 'battle-royale') {
                                  const fee = selectedFlip.entry_fee || 0
                                  const ethAmount = parseFloat(fee).toFixed(6)
                                  return (
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                                      <span>{ethAmount} ETH</span>
                                      {ethPriceUSD > 0 && (
                                        <span style={{ fontSize: '0.85rem', color: theme.colors.textSecondary, marginTop: '0.1rem' }}>
                                          ≈ ${(parseFloat(fee) * ethPriceUSD).toFixed(2)} USD
                                        </span>
                                      )}
                                    </div>
                                  )
                                } else {
                                  return (selectedFlip.priceUSD || 0).toFixed(2) + ' USD'
                                }
                              })()}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <GameInfo style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '1rem'
                    }}>
                      <div>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          marginBottom: '0.5rem',
                          flexWrap: 'wrap'
                        }}>
                          <GameTitle style={{
                            fontSize: '1.2rem'
                          }}>{selectedFlip.nft.name}</GameTitle>
                          <div style={{
                            background: hexToRgba(getStatusColor(selectedFlip.status), 0.9),
                            color: selectedFlip.status === 'active' ? '#000033' : '#fff',
                            padding: '0.4rem 0.8rem',
                            borderRadius: '0.25rem',
                            fontSize: '1.1rem',
                            fontWeight: 'bold',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.5)'
                          }}>
                            {getStatusIcon(selectedFlip.status) && <span>{getStatusIcon(selectedFlip.status)}</span>}
                            <span>{getStatusText(selectedFlip.status)}</span>
                          </div>
                          <div style={{
                            background: 'rgba(255, 255, 255, 0.1)',
                            padding: '0.3rem 0.6rem',
                            borderRadius: '0.25rem',
                            fontSize: window.innerWidth <= 768 ? '0.8rem' : '1.6rem',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.3rem'
                          }}>
                            <span>{getChainIcon(selectedFlip.nft.chain)}</span>
                            <span>{getChainName(selectedFlip.nft.chain)}</span>
                          </div>
                        </div>
                        <GameCollection style={{
                          fontSize: '0.9rem'
                        }}>{selectedFlip.nft.collection}</GameCollection>
                        
                      </div>
                      
                      {/* Price Display for Desktop */}
                      {window.innerWidth > 768 && (
                        <div style={{
                          background: 'rgba(255, 255, 255, 0.1)',
                          padding: '0.75rem',
                          borderRadius: '0.5rem',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          marginBottom: '1rem'
                        }}>
                          <div style={{ 
                            fontSize: '0.8rem', 
                            color: theme.colors.textSecondary,
                            marginBottom: '0.5rem'
                          }}>
                            Price
                          </div>
                          <div style={{ 
                            fontSize: '1.2rem', 
                            fontWeight: 'bold',
                            color: theme.colors.neonPink
                          }}>
                            {(() => {
                              if (selectedFlip.gameType === 'battle-royale') {
                                const fee = selectedFlip.entry_fee || 0
                                const ethAmount = parseFloat(fee).toFixed(6)
                                return (
                                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                                    <span>{ethAmount} ETH</span>
                                      {ethPriceUSD > 0 && (
                                        <span style={{ fontSize: '0.95rem', color: theme.colors.textSecondary, marginTop: '0.15rem' }}>
                                          ≈ ${(parseFloat(fee) * ethPriceUSD).toFixed(2)} USD
                                        </span>
                                      )}
                                  </div>
                                )
                              } else {
                                return (selectedFlip.priceUSD || 0).toFixed(2) + ' USD'
                              }
                            })()}
                          </div>
                        </div>
                      )}
                      
                      {/* Links */}
                      <div style={{ 
                        display: 'flex', 
                        gap: '0.5rem', 
                        marginBottom: '1rem'
                      }}>
                        <a
                          href={selectedFlip.nft?.contractAddress && selectedFlip.nft?.tokenId ? 
                            `${getExplorerUrl(selectedFlip.nft.chain)}/token/${selectedFlip.nft.contractAddress}?a=${selectedFlip.nft.tokenId}` :
                            '#'
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => {
                            if (!selectedFlip.nft?.contractAddress || !selectedFlip.nft?.tokenId) {
                              e.preventDefault()
                              showError('NFT contract details not available')
                            }
                          }}
                          style={{
                            background: 'rgba(255, 255, 255, 0.1)',
                            padding: '0.4rem 0.8rem',
                            borderRadius: '0.5rem',
                            fontSize: '0.8rem',
                            textDecoration: 'none',
                            color: '#fff',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            transition: 'all 0.3s ease',
                            flex: 1,
                            justifyContent: 'center'
                          }}
                        >
                          🔍 Explorer
                        </a>
                        <a
                          href={selectedFlip.nft?.contractAddress && selectedFlip.nft?.tokenId ? 
                            `${getMarketplaceUrl(selectedFlip.nft.chain)}/${selectedFlip.nft.contractAddress}/${selectedFlip.nft.tokenId}` :
                            '#'
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => {
                            if (!selectedFlip.nft?.contractAddress || !selectedFlip.nft?.tokenId) {
                              e.preventDefault()
                              showError('NFT contract details not available')
                            }
                          }}
                          style={{
                            background: 'rgba(255, 255, 255, 0.1)',
                            padding: '0.4rem 0.8rem',
                            borderRadius: '0.5rem',
                            fontSize: '0.8rem',
                            textDecoration: 'none',
                            color: '#fff',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            transition: 'all 0.3s ease',
                            flex: 1,
                            justifyContent: 'center'
                          }}
                        >
                          <img 
                            src="/images/opensea.png" 
                            alt="OpenSea" 
                            style={{ 
                              width: '16px', 
                              height: '16px',
                              objectFit: 'contain'
                            }} 
                          />
                          OpenSea
                        </a>
                      </div>
                      
                      <div style={{
                        display: 'flex',
                        gap: '1rem',
                        marginTop: '1rem'
                      }}>
                        <Button 
                          onClick={() => {
                            if (!selectedFlip.id || selectedFlip.id === 'null') {
                              console.error('⚠️ Cannot navigate: Invalid flip ID:', selectedFlip?.id)
                              showError('Invalid game ID. Please refresh the page.')
                              return
                            }
                            // Battle Royale flow: go to lobby unless game is started
                            if (selectedFlip.isBattleRoyale) {
                              const status = (selectedFlip.status || '').toLowerCase()
                              const isLobby = status === 'filling' || status === 'waiting' || status === 'pending' || status === 'joined'
                              if (isLobby) {
                                navigate(`/battle-royale/${selectedFlip.id}`)
                              } else {
                                const roomType = selectedFlip?.room_type || 'potion'
                                window.location.href = `/test-tubes.html?gameId=${selectedFlip.id}&room=${roomType}`
                              }
                              return
                            }
                            // Non-BR: keep current behavior (send to HTML game)
                            const roomType = selectedFlip?.room_type || 'potion'
                            window.location.href = `/test-tubes.html?gameId=${selectedFlip.id}&room=${roomType}`
                          }}
                          style={{
                            flex: 2,
                            background: selectedFlip.isBattleRoyale ? 
                              'linear-gradient(45deg, #00BFFF, #0080FF)' :
                              selectedFlip.type === 'listing' ? 
                              'linear-gradient(45deg, #FF1493, #FF69B4)' :
                              selectedFlip.status === 'completed' ? 
                              'linear-gradient(45deg, #FF4444, #CC0000)' :
                              selectedFlip.status === 'active' || selectedFlip.status === 'joined' ?
                              'linear-gradient(45deg, #FFA500, #FF8C00)' :
                              'linear-gradient(45deg, #00FF41, #39FF14)',
                            color: '#fff',
                            border: 'none',
                            padding: '0.75rem 1.5rem',
                            borderRadius: '0.5rem',
                            fontSize: '1rem',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            textShadow: '0 0 10px rgba(255, 20, 147, 0.5)',
                            boxShadow: '0 0 20px rgba(255, 20, 147, 0.3)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'scale(1.05)';
                            e.currentTarget.style.boxShadow = '0 0 30px rgba(255, 20, 147, 0.5)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'scale(1)';
                            e.currentTarget.style.boxShadow = '0 0 20px rgba(255, 20, 147, 0.3)';
                          }}
                        >
                          Enter Flip
                        </Button>

                      </div>
                    </GameInfo>
                  </div>
                )}
                
                {/* NFT Offers Section - Show for listing games */}
                {selectedFlip && selectedFlip.type === 'listing' && (
                  <div style={{ marginTop: '1rem' }}>
                    <NFTOfferComponent
                      gameId={selectedFlip.id}
                      gameData={selectedFlip}
                      isCreator={selectedFlip.creator?.toLowerCase() === address?.toLowerCase()}
                      socket={null}
                      connected={false}
                      offeredNFTs={[]}
                      onOfferSubmitted={() => {}}
                      onOfferAccepted={() => {}}
                    />
                  </div>
                )}
              </div>

              {/* Middle Box - Available Flips or NFTs */}
              <div style={{
                background: 'rgba(0, 0, 20, 0.95)',
                borderRadius: '1rem',
                padding: window.innerWidth <= 768 ? '0.75rem' : '1rem',
                border: `1px solid ${theme.colors.neonBlue}`,
                order: window.innerWidth <= 768 ? 2 : 0
              }}>
                <div style={{
                  fontSize: '1.2rem',
                  fontWeight: 'bold',
                  color: theme.colors.neonBlue,
                  marginBottom: '1rem',
                  padding: '0.5rem',
                  borderBottom: `1px solid ${theme.colors.neonBlue}`,
                  textShadow: '0 0 10px rgba(0, 150, 255, 0.5)'
                }}>
                  {filteredItems.length > 0 ?
                    `All Flips (${filteredItems.length})` :
                    'No Games Available'
                  }
                </div>

                {/* Search Input */}
                <div style={{ marginBottom: '1rem' }}>
                  <SearchInput
                    type="text"
                    placeholder="Search NFTs or collections..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                {/* Desktop: Grid/List toggle, Mobile: Always List view */}
                {viewMode === 'grid' && window.innerWidth > 768 ? (
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: window.innerWidth <= 768 ? 'repeat(2, 1fr)' : 
                                       window.innerWidth <= 1200 ? 'repeat(auto-fill, minmax(220px, 1fr))' :
                                       window.innerWidth <= 1600 ? 'repeat(auto-fill, minmax(240px, 1fr))' :
                                       window.innerWidth <= 2000 ? 'repeat(auto-fill, minmax(260px, 1fr))' :
                                       'repeat(auto-fill, minmax(280px, 1fr))',
                    gap: window.innerWidth <= 768 ? '0.5rem' : 
                         window.innerWidth <= 1200 ? '1rem' : 
                         window.innerWidth <= 1600 ? '1.25rem' : '1.5rem',
                    margin: '1rem 0',
                    width: '100%',
                    overflowX: 'hidden',
                    padding: window.innerWidth <= 768 ? '0 0.5rem' : '0',
                    gridAutoRows: 'minmax(auto, auto)',
                    gridAutoFlow: 'row'
                  }}>
                    {filteredItems.length > 0 ? (
                      filteredItems.map(item => (
                      <div
                        key={item.id}
                        className="flip-card-animated-border"
                        onClick={() => {
                          handleItemClick(item)
                        }}
                        style={{
                          background: 'rgba(255, 255, 255, 0.08)',
                          borderRadius: window.innerWidth <= 768 ? '0.75rem' : '1rem',
                          padding: window.innerWidth <= 768 ? '0.5rem' : '0.75rem',
                          cursor: isGameJoinable(item.status) ? 'pointer' : 'default',
                          transition: 'all 0.2s ease',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: window.innerWidth <= 768 ? '0.25rem' : '0.5rem',
                          height: window.innerWidth <= 768 ? 'auto' : 
                                  window.innerWidth <= 1200 ? '240px' : '250px',
                          width: '100%',
                          opacity: isGameJoinable(item.status) ? 1 : 0.85
                        }}
                        onMouseEnter={(e) => {
                          if (isGameJoinable(item.status)) {
                            e.currentTarget.style.transform = 'scale(1.02)';
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
                            e.currentTarget.style.boxShadow = '0 0 15px rgba(255, 255, 255, 0.2)';
                            // Enhance image on hover
                            const image = e.currentTarget.querySelector('img');
                            if (image) {
                              image.style.filter = 'brightness(1.3) contrast(1.2) saturate(1.4)';
                            }
                          }
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'scale(1)';
                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                          e.currentTarget.style.boxShadow = 'none';
                          // Reset image filter
                          const image = e.currentTarget.querySelector('img');
                          if (image) {
                            image.style.filter = 'brightness(1.1) contrast(1.1) saturate(1.2)';
                          }
                        }}
                      >
                        <div style={{ 
                          position: 'relative',
                          aspectRatio: '1',
                          borderRadius: window.innerWidth <= 768 ? '0.25rem' : '0.5rem',
                          overflow: 'hidden',
                          width: '100%',
                          height: window.innerWidth <= 768 ? 'auto' : '135px',
                          minHeight: window.innerWidth <= 768 ? '80px' : '135px'
                        }}>
                          <GameImage 
                            src={item.nft?.image || '/placeholder-nft.svg'} 
                            alt={item.nft?.name || 'NFT'}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                              objectPosition: 'center',
                              filter: 'brightness(1.1) contrast(1.1) saturate(1.2)',
                              transition: 'all 0.3s ease'
                            }}
                            onError={(e) => {
                              e.target.src = '/placeholder-nft.svg'
                            }}
                          />
                          <div style={{
                            position: 'absolute',
                            bottom: '0.25rem',
                            right: '0.25rem',
                            background: item.gameType === 'nft-vs-nft' ? 
                              'linear-gradient(45deg, #00FF41, #39FF14)' : 
                              item.gameType === 'battle-royale' ?
                              'linear-gradient(45deg, #00BFFF, #0080FF)' :
                              'linear-gradient(45deg, #FF1493, #FF69B4)',
                            color: item.gameType === 'nft-vs-nft' ? '#000' : '#fff',
                            padding: window.innerWidth <= 768 ? '0.1rem 0.25rem' : '0.15rem 0.35rem',
                            borderRadius: window.innerWidth <= 768 ? '0.15rem' : '0.25rem',
                            fontSize: window.innerWidth <= 768 ? '0.5rem' : '0.6rem',
                            fontWeight: 'bold'
                          }}>
                            {item.gameType === 'nft-vs-nft' ? '⚔️ NFT BATTLE' : 
                             item.gameType === 'battle-royale' ? '🏆 BATTLE ROYALE' : 
                             '💰 CRYPTO'}
                          </div>
                          
                          {/* Status indicator */}
                          <div style={{
                            position: 'absolute',
                            top: '0.25rem',
                            left: '0.25rem',
                            background: hexToRgba(getStatusColor(item.status), 0.9),
                            color: item.status === 'active' ? '#000033' : '#fff',
                            padding: window.innerWidth <= 768 ? '0.2rem 0.4rem' : '0.3rem 0.6rem',
                            borderRadius: window.innerWidth <= 768 ? '0.15rem' : '0.25rem',
                            fontSize: window.innerWidth <= 768 ? '0.8rem' : '1rem',
                            fontWeight: 'bold',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.1rem',
                            zIndex: 10,
                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.5)'
                          }}>
                            {getStatusIcon(item.status) && <span>{getStatusIcon(item.status)}</span>}
                            <span>{getStatusText(item.status)}</span>
                          </div>
                          {item.nft?.needsMetadataUpdate && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                updateNFTMetadata(item.id);
                              }}
                              style={{
                                position: 'absolute',
                                top: '0.25rem',
                                right: '0.25rem',
                                background: 'rgba(255, 193, 7, 0.9)',
                                color: '#000',
                                border: 'none',
                                padding: window.innerWidth <= 768 ? '0.1rem 0.2rem' : '0.15rem 0.3rem',
                                borderRadius: window.innerWidth <= 768 ? '0.15rem' : '0.25rem',
                                fontSize: window.innerWidth <= 768 ? '0.4rem' : '0.5rem',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'rgba(255, 193, 7, 1)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'rgba(255, 193, 7, 0.9)';
                              }}
                            >
                              🔄 Update
                            </button>
                          )}
                          
                          {/* NFT Deposit Badge */}
                          <div style={{
                            position: 'absolute',
                            bottom: '0.25rem',
                            left: '0.25rem'
                          }}>
                            <NFTDepositBadge 
                              gameId={item.id}
                              isListing={item.isListing}
                              nftDeposited={item.nft_deposited}
                              nftDepositVerified={item.nft_deposit_verified}
                            />
                          </div>
                        </div>
                        <div style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: window.innerWidth <= 768 ? '0.25rem' : '0.5rem',
                          padding: window.innerWidth <= 768 ? '0.25rem' : '0.5rem',
                          height: window.innerWidth <= 768 ? 'auto' : 
                                  window.innerWidth <= 1200 ? '75px' : '80px',
                          justifyContent: 'space-between'
                        }}>
                          <div style={{ 
                            fontSize: window.innerWidth <= 768 ? '0.7rem' : '0.8rem',
                            fontWeight: 'bold',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}>
                            {item.nft?.name || 'Unknown NFT'}
                          </div>
                          <div style={{ 
                            fontSize: window.innerWidth <= 768 ? '0.6rem' : '0.7rem',
                            color: theme.colors.textSecondary,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}>
                            {item.nft?.collection || 'Unknown Collection'}
                          </div>
                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            fontSize: window.innerWidth <= 768 ? '0.7rem' : '0.8rem'
                          }}>
                            <div style={{ 
                              fontWeight: 'bold',
                              color: theme.colors.neonPink,
                              fontSize: '1.2rem'
                            }}>
                              {(() => {
                                if (item.gameType === 'battle-royale') {
                                  const fee = item.entry_fee || 0
                                  const ethAmount = parseFloat(fee).toFixed(6)
                                  return (
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                                      <span>{ethAmount} ETH</span>
                                      {ethPriceUSD > 0 && (
                                        <span style={{ fontSize: '0.85rem', color: theme.colors.textSecondary, marginTop: '0.1rem' }}>
                                          ≈ ${(parseFloat(fee) * ethPriceUSD).toFixed(2)} USD
                                        </span>
                                      )}
                                    </div>
                                  )
                                } else {
                                  return (item.priceUSD || 0).toFixed(2) + ' USD'
                                }
                              })()}
                            </div>
                            <div style={{
                              background: 'rgba(255, 255, 255, 0.1)',
                              padding: '0.2rem 0.4rem',
                              borderRadius: '0.2rem',
                              fontSize: window.innerWidth <= 768 ? '0.6rem' : '1.2rem',
                              border: '1px solid rgba(255, 255, 255, 0.2)',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.2rem'
                            }}>
                              <span>{getChainIcon(item.nft?.chain || 'base')}</span>
                              <span>{getChainName(item.nft?.chain || 'base')}</span>
                            </div>
                          </div>

                        </div>
                      </div>
                    ))) : (
                      <div style={{
                        gridColumn: '1 / -1',
                        textAlign: 'center',
                        padding: '2rem',
                        color: theme.colors.textSecondary
                      }}>
                        No games or listings available
                      </div>
                    )}
                  </div>
                ) : (
                  <ListViewContainer>
                    {filteredItems.length > 0 ? (
                      filteredItems.map(item => (
                        <ListViewItem
                          key={item.id}
                          className="flip-card-animated-border"
                          onClick={() => {
                            handleItemClick(item)
                          }}
                          isJoinable={isGameJoinable(item.status)}
                        >
                          <ListViewImage>
                            <GameImage 
                              src={item.nft?.image || '/placeholder-nft.svg'} 
                              alt={item.nft?.name || 'NFT'}
                              style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                objectPosition: 'center'
                              }}
                              onError={(e) => {
                                e.target.src = '/placeholder-nft.svg'
                              }}
                            />
                            <div style={{
                              position: 'absolute',
                              bottom: '0.25rem',
                              right: '0.25rem',
                              background: item.gameType === 'nft-vs-nft' ? 
                                'linear-gradient(45deg, #00FF41, #39FF14)' : 
                                item.gameType === 'battle-royale' ?
                                'linear-gradient(45deg, #00BFFF, #0080FF)' :
                                'linear-gradient(45deg, #FF1493, #FF69B4)',
                              color: item.gameType === 'nft-vs-nft' ? '#000' : '#fff',
                              padding: '0.1rem 0.25rem',
                              borderRadius: '0.15rem',
                              fontSize: '0.5rem',
                              fontWeight: 'bold'
                            }}>
                              {item.gameType === 'nft-vs-nft' ? '⚔️ NFT BATTLE' : 
                             item.gameType === 'battle-royale' ? '🏆 BATTLE ROYALE' : 
                             '💰 CRYPTO'}
                            </div>
                            {/* Status indicator */}
                            <div style={{
                              position: 'absolute',
                              top: '0.25rem',
                              left: '0.25rem',
                              background: hexToRgba(getStatusColor(item.status), 0.9),
                              color: item.status === 'active' ? '#000033' : '#fff',
                              padding: '0.2rem 0.4rem',
                              borderRadius: '0.15rem',
                              fontSize: '0.8rem',
                              fontWeight: 'bold',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.1rem',
                              zIndex: 10,
                              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.5)'
                            }}>
                              {getStatusIcon(item.status) && <span>{getStatusIcon(item.status)}</span>}
                              <span>{getStatusText(item.status)}</span>
                            </div>
                            {item.nft?.needsMetadataUpdate && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateNFTMetadata(item.id);
                                }}
                                style={{
                                  position: 'absolute',
                                  top: '0.25rem',
                                  right: '0.25rem',
                                  background: 'rgba(255, 193, 7, 0.9)',
                                  color: '#000',
                                  border: 'none',
                                  padding: '0.1rem 0.2rem',
                                  borderRadius: '0.15rem',
                                  fontSize: '0.4rem',
                                  fontWeight: 'bold',
                                  cursor: 'pointer',
                                  transition: 'all 0.2s ease'
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background = 'rgba(255, 193, 7, 1)';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background = 'rgba(255, 193, 7, 0.9)';
                                }}
                              >
                                🔄 Update
                              </button>
                            )}
                            
                            {/* NFT Deposit Badge */}
                            <div style={{
                              position: 'absolute',
                              bottom: '0.25rem',
                              left: '0.25rem'
                            }}>
                              <NFTDepositBadge 
                                gameId={item.id}
                                isListing={item.isListing}
                                nftDeposited={item.nft_deposited}
                                nftDepositVerified={item.nft_deposit_verified}
                              />
                            </div>
                          </ListViewImage>
                          <ListViewContent>
                            {window.innerWidth <= 768 ? (
                              // Mobile layout - keep existing structure
                              <>
                                <ListViewHeader>
                                  <ListViewTitle>{item.nft?.name || 'Unknown NFT'}</ListViewTitle>
                                  <div style={{
                                    background: 'rgba(255, 255, 255, 0.1)',
                                    padding: '0.3rem 0.6rem',
                                    borderRadius: '0.25rem',
                                    fontSize: '0.8rem',
                                    border: '1px solid rgba(255, 255, 255, 0.2)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.3rem'
                                  }}>
                                    <span>{getChainIcon(item.nft?.chain || 'base')}</span>
                                    <span>{getChainName(item.nft?.chain || 'base')}</span>
                                  </div>
                                </ListViewHeader>
                                <ListViewCollection>{item.nft?.collection || 'Unknown Collection'}</ListViewCollection>
                                <ListViewStats>
                                  <ListViewStat>
                                    <div style={{ color: theme.colors.neonPink, fontWeight: 'bold', fontSize: '1.1rem' }}>
                                      {(() => {
                                        if (item.gameType === 'battle-royale') {
                                          const fee = item.entry_fee || 0
                                          const ethAmount = parseFloat(fee).toFixed(6)
                                          return (
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                                              <span>{ethAmount} ETH</span>
                                              {ethPriceUSD > 0 && (
                                                <span style={{ fontSize: '0.9rem', color: theme.colors.textSecondary, marginTop: '0.1rem' }}>
                                                  ≈ ${(parseFloat(fee) * ethPriceUSD).toFixed(2)} USD
                                                </span>
                                              )}
                                            </div>
                                          )
                                        } else {
                                          return (item.priceUSD || 0).toFixed(2) + ' USD'
                                        }
                                      })()}
                                    </div>
                                  </ListViewStat>
                                  <ListViewStat>
                                    <div style={{ color: getStatusColor(item.status), fontWeight: 'bold' }}>
                                      {getStatusText(item.status)}
                                    </div>
                                  </ListViewStat>
                                </ListViewStats>
                              </>
                            ) : (
                              // Desktop layout - horizontal: Name+Collection | Chain | Price
                              <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                width: '100%',
                                gap: '2rem'
                              }}>
                                {/* Name and Collection */}
                                <div style={{ flex: '1 1 30%', minWidth: 0 }}>
                                  <ListViewTitle style={{ marginBottom: '0.5rem' }}>{item.nft?.name || 'Unknown NFT'}</ListViewTitle>
                                  <ListViewCollection>{item.nft?.collection || 'Unknown Collection'}</ListViewCollection>
                                </div>
                                
                                {/* Chain Badge - Middle */}
                                <div style={{
                                  background: 'rgba(255, 255, 255, 0.1)',
                                  padding: '0.3rem 0.6rem',
                                  borderRadius: '0.25rem',
                                  fontSize: '1.6rem',
                                  border: '1px solid rgba(255, 255, 255, 0.2)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.3rem',
                                  flex: '0 0 auto'
                                }}>
                                  <span>{getChainIcon(item.nft?.chain || 'base')}</span>
                                  <span>{getChainName(item.nft?.chain || 'base')}</span>
                                </div>
                                
                                {/* Price - Right */}
                                <div style={{ 
                                  flex: '0 0 auto',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  alignItems: 'flex-end',
                                  minWidth: '150px'
                                }}>
                                  <div style={{ color: theme.colors.neonPink, fontWeight: 'bold', fontSize: '1.1rem' }}>
                                    {(() => {
                                      if (item.gameType === 'battle-royale') {
                                        const fee = item.entry_fee || 0
                                        const ethAmount = parseFloat(fee).toFixed(6)
                                        return (
                                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                                            <span>{ethAmount} ETH</span>
                                            {ethPriceUSD > 0 && (
                                              <span style={{ fontSize: '0.9rem', color: theme.colors.textSecondary, marginTop: '0.1rem' }}>
                                                ≈ ${(parseFloat(fee) * ethPriceUSD).toFixed(2)} USD
                                              </span>
                                            )}
                                          </div>
                                        )
                                      } else {
                                        return (
                                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                                            <span>{(item.priceUSD || 0).toFixed(2)} USD</span>
                                          </div>
                                        )
                                      }
                                    })()}
                                  </div>
                                </div>
                              </div>
                            )}
                          </ListViewContent>
                        </ListViewItem>
                      ))
                    ) : (
                      <div style={{
                        gridColumn: '1 / -1',
                        textAlign: 'center',
                        padding: '2rem',
                        color: theme.colors.textSecondary
                      }}>
                        No games or listings available
                      </div>
                    )}
                  </ListViewContainer>
                )}
              </div>
            </div>
          )}
        </ContentWrapper>
      </Container>
    </ThemeProvider>
  )
}

export default Home 