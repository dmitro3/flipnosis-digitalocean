import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useWallet } from '../contexts/WalletContext'
import { useToast } from '../contexts/ToastContext'
import { ThemeProvider } from '@emotion/react'
import { theme } from '../styles/theme'
import styled from '@emotion/styled'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import hazeVideo from '../../Images/Video/haze.webm'
import { PaymentService } from '../services/PaymentService'
import ClaimRewards from '../components/ClaimRewards'
import contractService from '../services/ContractService'
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
  const { 
    isConnected, 
    address, 
    chain,
    walletClient,
    publicClient
  } = useWallet()
  const [activeFilter, setActiveFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [flips, setFlips] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedFlip, setSelectedFlip] = useState(null)
  const [error, setError] = useState('')


  // API URL - will be Railway URL in production
  const API_URL = import.meta.env.VITE_API_URL || 'https://cryptoflipz2-production.up.railway.app'

  // Debug logging
  useEffect(() => {
    console.log('🔍 Home Debug:', {
      isConnected,
      address,
      chain,
      hasWalletClient: !!walletClient,
      hasPublicClient: !!publicClient
    })
  }, [isConnected, address, chain, walletClient, publicClient])

  // Fetch games from database
  const fetchGames = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`${API_URL}/api/games`)
      if (!response.ok) {
        throw new Error('Failed to fetch games')
      }

      const gamesData = await response.json()
      console.log('📊 Fetched games from database:', gamesData)

      // Transform database games to frontend format
      const processedFlips = gamesData.map(game => ({
        id: game.id,
        nft: {
          name: game.nft_name || 'Unknown NFT',
          image: game.nft_image || '/placeholder-nft.png', // Use a real placeholder image
          collection: game.nft_collection || 'Unknown Collection',
          contractAddress: game.nft_contract,
          tokenId: game.nft_token_id,
          chain: game.nft_chain || 'base'
        },
        gameType: game.game_type || 'nft-vs-crypto',
        price: game.price_usd,
        priceUSD: game.price_usd,
        currency: game.game_type === 'nft-vs-nft' ? 'NFT' : 'USD',
        chain: game.nft_chain || 'base',
        creator: game.creator,
        joiner: game.joiner,
        rounds: game.rounds,
        status: game.status,
        createdAt: game.created_at,
        winner: game.winner,
        creatorWins: game.creator_wins || 0,
        joinerWins: game.joiner_wins || 0,
        // REMOVED: spectators count (no longer tracking spectators)
        challengerNFT: game.challenger_nft_name ? {
          name: game.challenger_nft_name,
          image: game.challenger_nft_image,
          collection: game.challenger_nft_collection,
          contractAddress: game.challenger_nft_contract,
          tokenId: game.challenger_nft_token_id
        } : null,
        description: game.game_type === 'nft-vs-nft' ? 
          `NFT Battle: ${game.nft_name} vs ${game.challenger_nft_name || 'Waiting for challenger'}` :
          `${game.nft_name} from ${game.nft_collection} - Ready for battle!`
      }))

      console.log('✅ Processed flips:', processedFlips)
      setFlips(processedFlips)
      
      if (processedFlips.length > 0) {
        setSelectedFlip(processedFlips[0])
      }
    } catch (error) {
      console.error('❌ Error fetching games:', error)
      setError('Failed to load games. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Load games on component mount
  useEffect(() => {
    fetchGames()
    
    // Refresh every 10 seconds
    const interval = setInterval(fetchGames, 10000)
    return () => clearInterval(interval)
  }, [])

  const filteredFlips = flips.filter(flip => {
    // First apply the chain/game type filter
    const matchesFilter = activeFilter === 'all' || 
      (activeFilter === 'nft-vs-crypto' || activeFilter === 'nft-vs-nft' ? 
        flip.gameType === activeFilter : 
        flip.chain === activeFilter);

    // Then apply the search filter
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = !searchQuery || 
      flip.nft.name.toLowerCase().includes(searchLower) ||
      flip.nft.collection.toLowerCase().includes(searchLower) ||
      flip.description.toLowerCase().includes(searchLower);

    return matchesFilter && matchesSearch;
  })

  const chainFilters = [
    { key: 'all', name: 'ALL', icon: '🌐' },
    { key: 'nft-vs-crypto', name: 'NFT VS CRYPTO', icon: '💎💰' },
    { key: 'nft-vs-nft', name: 'NFT VS NFT', icon: '⚔️' },
    { key: 'ethereum', name: 'ETH', icon: '💎' },
    { key: 'base', name: 'BASE', icon: '🔵' },
    { key: 'bnb', name: 'BNB', icon: '🟡' },
    { key: 'avalanche', name: 'AVAX', icon: '🔴' },
    { key: 'polygon', name: 'POLY', icon: '🟣' },
    { key: 'arbitrum', name: 'ARB', icon: '🔷' },
    { key: 'optimism', name: 'OPT', icon: '🔶' }
  ]

  const handleSelectFlip = (flip) => {
    setSelectedFlip(flip)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'waiting': return '⏳'
      case 'joined': return '🔄'
      case 'active': return '🎮'
      case 'completed': return '🏆'
      default: return '❓'
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
              <Button onClick={fetchGames} style={{ background: theme.colors.neonPink }}>
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

          {filteredFlips.length === 0 ? (
            <GlassCard style={{ textAlign: 'center', padding: '3rem', border: `2px solid ${theme.colors.neonPink}` }}>
              <NeonText style={{ fontSize: '2rem', marginBottom: '1rem' }}>No Active Flips</NeonText>
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
                            <div style={{ fontSize: '1rem', fontWeight: 'bold' }}>${selectedFlip.priceUSD.toFixed(2)}</div>
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
                        <GameTitle style={{
                          fontSize: '1.2rem',
                          marginBottom: '0.5rem'
                        }}>{selectedFlip.nft.name}</GameTitle>
                        <GameCollection style={{
                          fontSize: '0.9rem'
                        }}>{selectedFlip.nft.collection}</GameCollection>
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
                                <div>${selectedFlip.priceUSD.toFixed(2)}</div>
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
                            src="images/opensea.png" 
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
                          onClick={() => navigate(`/game/${selectedFlip.id}`)}
                          style={{
                            flex: 2,
                            background: 'linear-gradient(45deg, #FF1493, #FF69B4)',
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
                          View Flip
                        </Button>
                        {selectedFlip.gameType === 'nft-vs-nft' && !selectedFlip.challengerNFT && (
                          <Button 
                            onClick={() => navigate(`/flip/${selectedFlip.id}/join`)}
                            style={{
                              flex: 1,
                              background: 'linear-gradient(45deg, #FF1493, #FF69B4)',
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
                            <span>⚔️</span> Join Battle
                          </Button>
                        )}
                      </div>
                    </GameInfo>
                  </div>
                )}
              </div>

              {/* Middle Box - Available Flips */}
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
                  Available Flips ({filteredFlips.filter(flip => flip.status === 'waiting').length})
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
                  gridTemplateColumns: window.innerWidth <= 768 ? 'repeat(2, 1fr)' : 'repeat(5, 1fr)',
                  gap: window.innerWidth <= 768 ? '0.25rem' : '0.75rem',
                  margin: '1rem 0',
                  width: '100%',
                  overflowX: 'hidden',
                  padding: window.innerWidth <= 768 ? '0 0.25rem' : '0',
                  gridAutoRows: 'minmax(auto, auto)',
                  gridAutoFlow: 'row'
                }}>
                  {filteredFlips.map(flip => (
                    <div
                      key={flip.id}
                      onClick={() => setSelectedFlip(flip)}
                      style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        borderRadius: window.innerWidth <= 768 ? '0.5rem' : '0.75rem',
                        padding: window.innerWidth <= 768 ? '0.25rem' : '0.5rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: window.innerWidth <= 768 ? '0.15rem' : '0.25rem',
                        height: window.innerWidth <= 768 ? 'auto' : '210px',
                        width: '100%'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'scale(1.02)';
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
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
                          src={flip.nft.image} 
                          alt={flip.nft.name}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            objectPosition: 'center'
                          }}
                        />
                        <div style={{
                          position: 'absolute',
                          bottom: '0.25rem',
                          right: '0.25rem',
                          background: flip.gameType === 'nft-vs-nft' ? 
                            'linear-gradient(45deg, #00FF41, #39FF14)' : 
                            'linear-gradient(45deg, #FF1493, #FF69B4)',
                          color: flip.gameType === 'nft-vs-nft' ? '#000' : '#fff',
                          padding: window.innerWidth <= 768 ? '0.1rem 0.25rem' : '0.15rem 0.35rem',
                          borderRadius: window.innerWidth <= 768 ? '0.15rem' : '0.25rem',
                          fontSize: window.innerWidth <= 768 ? '0.5rem' : '0.6rem',
                          fontWeight: 'bold'
                        }}>
                          {flip.gameType === 'nft-vs-nft' ? '⚔️ NFT BATTLE' : '💰 CRYPTO'}
                        </div>
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
                          {flip.nft.name}
                        </div>
                        <div style={{ 
                          fontSize: window.innerWidth <= 768 ? '0.5rem' : '0.6rem',
                          color: theme.colors.textSecondary,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>
                          {flip.nft.collection}
                        </div>
                        <div style={{ 
                          fontSize: window.innerWidth <= 768 ? '0.6rem' : '0.7rem',
                          fontWeight: 'bold',
                          color: theme.colors.neonBlue
                        }}>
                          ${flip.priceUSD.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  ))}
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