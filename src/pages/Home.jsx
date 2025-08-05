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

  @media (max-width: 768px) {
    flex-wrap: nowrap;
    gap: 0.25rem;
  }
`

const DesktopFilters = styled.div`
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;

  @media (max-width: 768px) {
    display: none;
  }
`

const FilterButton = styled(Button)`
  background: ${props => props.active ? props.theme.colors.neonGreen : 'transparent'};
  border: 1px solid ${props => props.theme.colors.neonGreen};
  padding: 0.5rem 1rem;
  color: ${props => props.active ? '#000B1A' : props.theme.colors.textPrimary};
  white-space: nowrap;

  @media (max-width: 768px) {
    padding: 0.5rem;
    font-size: 0.9rem;
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

const Home = () => {
  const navigate = useNavigate()
  const { showSuccess, showError, showInfo } = useToast()
  const { isConnected, address } = useWallet()
  
  const [games, setGames] = useState([])
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(false)
  const [activeFilter, setActiveFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [error, setError] = useState(null)
  const [selectedFlip, setSelectedFlip] = useState(null)

  // Fetch data from database
  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)
      // Fetch listings
      const listingsResponse = await fetch(getApiUrl('/listings'))
      let listings
      try {
        listings = await listingsResponse.json()
      } catch (e) {
        const raw = await listingsResponse.text()
        console.error('Listings response not JSON:', raw)
        throw new Error('Listings API did not return JSON. See console for details.')
      }
      // Fetch games
      const gamesResponse = await fetch(getApiUrl('/games'))
      let games
      try {
        games = await gamesResponse.json()
      } catch (e) {
        const raw = await gamesResponse.text()
        console.error('Games response not JSON:', raw)
        throw new Error('Games API did not return JSON. See console for details.')
      }
      setListings(listings)
      setGames(games)
    } catch (error) {
      console.error('Error fetching data:', error)
      setError('Failed to load games and listings: ' + error.message)
      showError('Failed to load games and listings: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 10000) // Refresh every 10 seconds
    return () => clearInterval(interval)
  }, [])

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
          chain: l.nft_chain || 'base'
        },
        gameType: 'nft-vs-crypto',
        priceUSD: l.asking_price || 0
      })
    }
  })
  
  // Process games
  games.filter(g => 
    g.status !== 'cancelled' && 
    g.status !== 'waiting_deposits' && 
    g.status !== 'waiting_challenger_deposit'
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
        chain: 'base'
      },
      gameType: 'nft-vs-nft',
      priceUSD: g.final_price || 0
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
  })
}

  const handleItemClick = (item) => {
    // Set the selected flip to show details instead of going directly to game page
    handleSelectFlip(item)
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
    setSelectedFlip(flip)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'waiting': return '🟢'
      case 'joined': return '🟠'
      case 'active': return '🟠'
      case 'pending': return '🟡'
      case 'completed': return '🔴'
      default: return '❓'
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'active': return 'LIVE'
      case 'in_progress': return 'IN PROGRESS'
      case 'completed': return 'COMPLETE'
      case 'cancelled': return 'CANCELLED'
      default: return 'UNKNOWN'
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return '#00FF41' // Green
      case 'in_progress': return '#FFA500' // Orange
      case 'completed': return '#FF4444' // Red
      case 'cancelled': return '#808080' // Gray
      default: return '#808080' // Gray
    }
  }

  const isGameJoinable = (status) => {
    return status === 'waiting' || status === 'pending'
  }

  const handleMakeOffer = async (flip) => {
    if (!isConnected) {
      showError('Please connect your wallet first')
      return
    }

    if (flip.creator === address) {
      showError('You cannot make an offer on your own listing')
      return
    }

    try {
      setLoading(true)
      showInfo('Making offer...')

      // Use production API URL
      const baseUrl = getApiUrl('')

      const offerData = {
        listing_id: flip.listingId,
        offerer_address: address,
        offer_price: flip.priceUSD,
        message: `I want to play with ${flip.nft.name}!`
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
      navigate(`/game/${result.gameId}`)
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
      <Container>
        <ContentWrapper>
          {/* Add ClaimRewards component */}
          <ClaimRewards />
          
          {/* Chain Filters */}
          <TransparentCard style={{ background: theme.colors.bgDark }}>
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

          {filteredItems.length === 0 ? (
            <GlassCard style={{ textAlign: 'center', padding: '3rem', border: `2px solid ${theme.colors.neonPink}` }}>
              <NeonText style={{ fontSize: '2rem', marginBottom: '1rem' }}>No Games Available</NeonText>
              <p style={{ color: theme.colors.textSecondary, marginBottom: '2rem' }}>
                Be the first to create a flip game!
              </p>
              <Button as={Link} to="/create" style={{ background: theme.colors.neonPink }}>
                Create Flip
              </Button>
            </GlassCard>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: window.innerWidth <= 768 ? '1fr' : '240px 1fr',
              gap: '1.5rem',
              marginTop: '2rem'
            }}>
              {/* Left Box - Selected Game */}
              <div style={{
                order: window.innerWidth <= 768 ? 1 : 0,
                width: window.innerWidth <= 768 ? '100%' : '240px'
              }}>
                {selectedFlip && (
                  <div style={{
                    background: 'rgba(0, 0, 0, 0.8)',
                    borderRadius: '1rem',
                    padding: window.innerWidth <= 768 ? '1.25rem' : '1.5rem',
                    border: `2px solid ${selectedFlip.gameType === 'nft-vs-nft' ? theme.colors.neonGreen : theme.colors.neonPink}`,
                    maxWidth: window.innerWidth <= 768 ? '100%' : '240px'
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
                        <div style={{
                          position: 'absolute',
                          bottom: '0.5rem',
                          right: '0.5rem',
                          background: selectedFlip.gameType === 'nft-vs-nft' ? 
                            'linear-gradient(45deg, #00FF41, #39FF14)' : 
                            'linear-gradient(45deg, #FF1493, #FF69B4)',
                          color: selectedFlip.gameType === 'nft-vs-nft' ? '#000' : '#fff',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '0.25rem',
                          fontSize: '0.7rem',
                          fontWeight: 'bold'
                        }}>
                          {selectedFlip.gameType === 'nft-vs-nft' ? '⚔️ NFT BATTLE' : '💰 CRYPTO'}
                        </div>
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
                            <div style={{ fontSize: '1rem', fontWeight: 'bold' }}>${(selectedFlip.priceUSD || 0).toFixed(2)}</div>
                          </div>
                          <div style={{
                            background: 'rgba(255, 255, 255, 0.1)',
                            padding: '0.5rem',
                            borderRadius: '0.5rem',
                            border: '1px solid rgba(255, 255, 255, 0.2)'
                          }}>
                            <div style={{ fontSize: '0.7rem', color: theme.colors.textSecondary }}>Type</div>
                            <div style={{ 
                              fontSize: '0.9rem', 
                              fontWeight: 'bold',
                              color: selectedFlip.gameType === 'nft-vs-nft' ? theme.colors.neonGreen : theme.colors.neonPink
                            }}>
                              {selectedFlip.gameType === 'nft-vs-nft' ? 'NFT Battle' : 'NFT vs Crypto'}
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
                          marginBottom: '0.5rem'
                        }}>
                          <GameTitle style={{
                            fontSize: '1.2rem'
                          }}>{selectedFlip.nft.name}</GameTitle>
                          <div style={{
                            background: 'rgba(255, 255, 255, 0.1)',
                            padding: '0.2rem 0.5rem',
                            borderRadius: '0.25rem',
                            fontSize: '0.7rem',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.2rem'
                          }}>
                            <span>{getChainIcon(selectedFlip.nft.chain)}</span>
                            <span>{getChainName(selectedFlip.nft.chain)}</span>
                          </div>
                        </div>
                        <GameCollection style={{
                          fontSize: '0.9rem'
                        }}>{selectedFlip.nft.collection}</GameCollection>
                        
                        {/* Game Status Display */}
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          marginTop: '0.5rem',
                          padding: '0.5rem',
                          background: `rgba(${getStatusColor(selectedFlip.status).replace('#', '')}, 0.1)`,
                          border: `1px solid rgba(${getStatusColor(selectedFlip.status).replace('#', '')}, 0.3)`,
                          borderRadius: '0.5rem'
                        }}>
                          <span style={{
                            fontSize: '1.2rem'
                          }}>{getStatusIcon(selectedFlip.status)}</span>
                          <div>
                            <div style={{
                              fontSize: '0.9rem',
                              fontWeight: 'bold',
                              color: getStatusColor(selectedFlip.status)
                            }}>
                              {getStatusText(selectedFlip.status)}
                            </div>
                            <div style={{
                              fontSize: '0.7rem',
                              color: theme.colors.textSecondary
                            }}>
                              {selectedFlip.status === 'active' ? 'Accepting offers' :
                               selectedFlip.status === 'in_progress' ? 'Game will start automatically in a few seconds' :
                               selectedFlip.status === 'completed' ? `Winner: ${selectedFlip.winner ? selectedFlip.winner.slice(0, 6) + '...' + selectedFlip.winner.slice(-4) : 'Unknown'}` :
                               'Status unknown'}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {window.innerWidth > 768 && (
                        <GameStats style={{
                          display: 'grid',
                          gridTemplateColumns: '1fr',
                          gap: '0.75rem'
                        }}>
                          {selectedFlip.gameType === 'nft-vs-nft' ? (
                            <>
                              <GameStat>
                                <span>Type</span>
                                <div style={{ color: theme.colors.neonGreen }}>NFT Battle</div>
                              </GameStat>
                              <GameStat>
                                <span>Stakes</span>
                                <div>Winner Takes All</div>
                              </GameStat>
                              {selectedFlip.challengerNFT && (
                                <GameStat>
                                  <span>VS</span>
                                  <div style={{ color: theme.colors.neonYellow }}>
                                    {selectedFlip.challengerNFT.name}
                                  </div>
                                </GameStat>
                              )}
                            </>
                          ) : (
                            <>
                              <GameStat>
                                <span>Price</span>
                                <div>${(selectedFlip.priceUSD || 0).toFixed(2)}</div>
                              </GameStat>
                              <GameStat>
                                <span>Type</span>
                                <div style={{ color: theme.colors.neonPink }}>NFT vs Crypto</div>
                              </GameStat>
                            </>
                          )}
                        </GameStats>
                      )}
                      
                      {/* Links */}
                      <div style={{ 
                        display: 'flex', 
                        gap: '0.5rem', 
                        marginBottom: '1rem'
                      }}>
                        <a
                          href={`${getExplorerUrl(selectedFlip.nft.chain)}/token/${selectedFlip.nft.contractAddress}?a=${selectedFlip.nft.tokenId}`}
                          target="_blank"
                          rel="noopener noreferrer"
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
                          href={`${getMarketplaceUrl(selectedFlip.nft.chain)}/${selectedFlip.nft.contractAddress}/${selectedFlip.nft.tokenId}`}
                          target="_blank"
                          rel="noopener noreferrer"
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
                            // Safety check for valid ID
                            if (!selectedFlip.id || selectedFlip.id === 'null') {
                              console.error('⚠️ Cannot navigate: Invalid flip ID:', selectedFlip.id)
                              showError('Invalid game ID. Please refresh the page.')
                              return
                            }
                            
                            if (selectedFlip.type === 'listing') {
                              navigate(`/game/${selectedFlip.id}`)
                            } else if (selectedFlip.status === 'completed') {
                              // Handle completed game view
                              navigate(`/game/${selectedFlip.id}`)
                            } else if (selectedFlip.status === 'active') {
                              // Handle active game view
                              navigate(`/game/${selectedFlip.id}`)
                            } else if (selectedFlip.status === 'joined') {
                              // Handle joined game view
                              navigate(`/game/${selectedFlip.id}`)
                            } else if (selectedFlip.status === 'waiting') {
                              // Handle waiting games - go to unified game page
                              navigate(`/game/${selectedFlip.id}`)
                            } else {
                              // Handle other statuses
                              navigate(`/game/${selectedFlip.id}`)
                            }
                          }}
                          style={{
                            flex: 2,
                            background: selectedFlip.type === 'listing' ? 
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
              </div>

              {/* Middle Box - Available Flips or NFTs */}
              <div style={{
                background: 'rgba(0, 0, 20, 0.95)',
                borderRadius: '1rem',
                padding: window.innerWidth <= 768 ? '0.75rem' : '1rem',
                border: `1px solid ${theme.colors.neonBlue}`,
                maxHeight: window.innerWidth <= 768 ? 'none' : '600px',
                overflowY: 'auto',
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

                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: window.innerWidth <= 768 ? 'repeat(2, 1fr)' : 'repeat(auto-fill, minmax(180px, 1fr))',
                  gap: window.innerWidth <= 768 ? '0.25rem' : '0.75rem',
                  margin: '1rem 0',
                  width: '100%',
                  overflowX: 'hidden',
                  padding: window.innerWidth <= 768 ? '0 0.25rem' : '0',
                  gridAutoRows: 'minmax(auto, auto)',
                  gridAutoFlow: 'row'
                }}>
                  {filteredItems.length > 0 ? (
                    filteredItems.map(item => (
                    <div
                      key={item.id}
                      onClick={() => {
                        handleItemClick(item)
                      }}
                      style={{
                        background: 'rgba(255, 255, 255, 0.08)',
                        borderRadius: window.innerWidth <= 768 ? '0.5rem' : '0.75rem',
                        padding: window.innerWidth <= 768 ? '0.25rem' : '0.5rem',
                        cursor: isGameJoinable(item.status) ? 'pointer' : 'default',
                        transition: 'all 0.2s ease',
                        border: `1px solid ${isGameJoinable(item.status) ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.08)'}`,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: window.innerWidth <= 768 ? '0.15rem' : '0.25rem',
                        height: window.innerWidth <= 768 ? 'auto' : '210px',
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
                            'linear-gradient(45deg, #FF1493, #FF69B4)',
                          color: item.gameType === 'nft-vs-nft' ? '#000' : '#fff',
                          padding: window.innerWidth <= 768 ? '0.1rem 0.25rem' : '0.15rem 0.35rem',
                          borderRadius: window.innerWidth <= 768 ? '0.15rem' : '0.25rem',
                          fontSize: window.innerWidth <= 768 ? '0.5rem' : '0.6rem',
                          fontWeight: 'bold'
                        }}>
                          {item.gameType === 'nft-vs-nft' ? '⚔️ NFT BATTLE' : '💰 CRYPTO'}
                        </div>
                        
                        {/* Status indicator */}
                        <div style={{
                          position: 'absolute',
                          top: '0.25rem',
                          left: '0.25rem',
                          background: `rgba(${getStatusColor(item.status).replace('#', '')}, 0.9)`,
                          color: '#fff',
                          padding: window.innerWidth <= 768 ? '0.1rem 0.2rem' : '0.15rem 0.3rem',
                          borderRadius: window.innerWidth <= 768 ? '0.15rem' : '0.25rem',
                          fontSize: window.innerWidth <= 768 ? '0.4rem' : '0.5rem',
                          fontWeight: 'bold',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.1rem'
                        }}>
                          <span>{getStatusIcon(item.status)}</span>
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
                      </div>
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: window.innerWidth <= 768 ? '0.1rem' : '0.25rem',
                        padding: window.innerWidth <= 768 ? '0.1rem' : '0.25rem',
                        height: window.innerWidth <= 768 ? 'auto' : '60px',
                        justifyContent: 'space-between'
                      }}>
                        <div style={{ 
                          fontSize: window.innerWidth <= 768 ? '0.6rem' : '0.7rem',
                          fontWeight: 'bold',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>
                          {item.nft?.name || 'Unknown NFT'}
                        </div>
                        <div style={{ 
                          fontSize: window.innerWidth <= 768 ? '0.5rem' : '0.6rem',
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
                          fontSize: window.innerWidth <= 768 ? '0.6rem' : '0.7rem'
                        }}>
                          <div style={{ 
                            fontWeight: 'bold',
                            color: theme.colors.neonBlue
                          }}>
                            ${(item.priceUSD || 0).toFixed(2)}
                          </div>
                          <div style={{
                            background: 'rgba(255, 255, 255, 0.1)',
                            padding: '0.1rem 0.3rem',
                            borderRadius: '0.2rem',
                            fontSize: window.innerWidth <= 768 ? '0.4rem' : '0.5rem',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.1rem'
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
              </div>
            </div>
          )}
        </ContentWrapper>
      </Container>
    </ThemeProvider>
  )
}

export default Home 