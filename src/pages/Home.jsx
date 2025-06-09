import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useWallet } from '../contexts/WalletContext'
import { ThemeProvider } from '@emotion/react'
import { theme } from '../styles/theme'
import styled from '@emotion/styled'
import hazeVideo from '../../Images/Video/haze.webm'
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

const Home = () => {
  const { chains, isConnected } = useWallet()
  const [activeFilter, setActiveFilter] = useState('all')
  const [flips, setFlips] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedFlip, setSelectedFlip] = useState(null)
  const [error, setError] = useState(null)

  // API URL - will be Railway URL in production
  const API_URL = import.meta.env.VITE_API_URL || 'https://cryptoflipz2-production.up.railway.app'

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
          image: game.nft_image || 'https://picsum.photos/300/300?random=' + game.id,
          collection: game.nft_collection || 'Unknown Collection',
          contractAddress: game.nft_contract,
          tokenId: game.nft_token_id,
          chain: game.nft_chain || 'base'
        },
        price: game.price_usd,
        priceUSD: game.price_usd,
        currency: 'USD',
        chain: game.nft_chain || 'base',
        creator: game.creator,
        joiner: game.joiner,
        rounds: game.rounds,
        status: game.status,
        createdAt: game.created_at,
        winner: game.winner,
        creatorWins: game.creator_wins || 0,
        joinerWins: game.joiner_wins || 0,
        spectators: game.total_spectators || 0,
        description: `${game.nft_name} from ${game.nft_collection} - Ready for battle!`
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

  const filteredFlips = flips.filter(flip => 
    activeFilter === 'all' || flip.chain === activeFilter
  )

  const chainFilters = [
    { key: 'all', name: 'All', icon: '🌐' },
    { key: 'base', name: 'Base', icon: '🔵' },
    { key: 'ethereum', name: 'Ethereum', icon: '🔵' },
    { key: 'polygon', name: 'Polygon', icon: '🟣' },
    { key: 'arbitrum', name: 'Arbitrum', icon: '🔷' },
    { key: 'bnb', name: 'BNB', icon: '🟡' },
    { key: 'avalanche', name: 'Avalanche', icon: '🔴' }
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
          {/* Chain Filters */}
          <TransparentCard style={{ background: theme.colors.bgDark }}>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {chainFilters.map(filter => (
                <Button
                  key={filter.key}
                  onClick={() => setActiveFilter(filter.key)}
                  style={{
                    background: activeFilter === filter.key ? theme.colors.neonGreen : 'transparent',
                    border: `1px solid ${theme.colors.neonGreen}`,
                    padding: '0.5rem 1rem'
                  }}
                >
                  {filter.icon} {filter.name}
                </Button>
              ))}
            </div>
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
              gridTemplateColumns: '240px 1fr 300px',
              gap: '1.5rem',
              marginTop: '2rem'
            }}>
              {/* Left Box - Selected Game */}
              <div>
                {selectedFlip && (
                  <div style={{
                    background: 'rgba(0, 0, 0, 0.8)',
                    borderRadius: '1rem',
                    padding: '1.5rem',
                    border: `2px solid ${theme.colors.neonPink}`,
                    maxWidth: '240px'
                  }}>
                    <div style={{ position: 'relative', aspectRatio: '1', borderRadius: '0.75rem', overflow: 'hidden', marginBottom: '1rem' }}>
                      <GameImage 
                        src={selectedFlip.nft.image} 
                        alt={selectedFlip.nft.name}
                      />
                    </div>
                    
                    <GameInfo>
                      <GameTitle>{selectedFlip.nft.name}</GameTitle>
                      <GameCollection>{selectedFlip.nft.collection}</GameCollection>
                      <GameStats>
                        <GameStat>
                          <span>Price</span>
                          <div>${selectedFlip.priceUSD}</div>
                        </GameStat>
                        <GameStat>
                          <span>Rounds</span>
                          <div>{selectedFlip.rounds}</div>
                        </GameStat>
                      </GameStats>
                      <GameFlipButton as={Link} to={`/game/${selectedFlip.id}`}>
                        Join Flip
                      </GameFlipButton>
                    </GameInfo>
                  </div>
                )}
              </div>

              {/* Middle Box - Available Flips */}
              <div style={{
                background: 'rgba(0, 0, 20, 0.95)',
                borderRadius: '1rem',
                padding: '1rem',
                border: `1px solid ${theme.colors.neonBlue}`,
                maxHeight: '600px',
                overflowY: 'auto'
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
                <div style={{ 
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                  padding: '0.5rem'
                }}>
                  {filteredFlips.map(flip => (
                    <div
                      key={flip.id}
                      onClick={() => handleSelectFlip(flip)}
                      style={{
                        background: 'rgba(0, 0, 0, 0.6)',
                        borderRadius: '0.75rem',
                        padding: '0.75rem',
                        border: `1px solid ${theme.colors.neonBlue}`,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)'
                        }
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ 
                          width: '60px', 
                          height: '60px', 
                          borderRadius: '0.5rem',
                          overflow: 'hidden',
                          flexShrink: 0
                        }}>
                          <GameImage 
                            src={flip.nft.image} 
                            alt={flip.nft.name}
                          />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ 
                            fontSize: '0.9rem', 
                            fontWeight: 'bold',
                            marginBottom: '0.25rem',
                            color: theme.colors.textPrimary
                          }}>
                            {flip.nft.name}
                          </div>
                          <div style={{ 
                            fontSize: '0.8rem',
                            color: theme.colors.textSecondary,
                            marginBottom: '0.5rem'
                          }}>
                            {flip.nft.collection}
                          </div>
                          <div style={{ 
                            display: 'flex', 
                            gap: '0.75rem',
                            fontSize: '0.8rem',
                            color: theme.colors.textSecondary
                          }}>
                            <span>{flip.rounds} Rounds</span>
                            <span>{flip.chain}</span>
                            <span>🔵</span>
                            <span>${flip.priceUSD}</span>
                          </div>
                        </div>
                        <GameFlipButton 
                          as={Link} 
                          to={`/game/${flip.id}`}
                          style={{
                            padding: '0.2rem 0.6rem',
                            fontSize: '0.7rem',
                            height: '28px',
                            minWidth: 'unset',
                            width: 'auto',
                            textAlign: 'center',
                            color: '#000',
                            fontWeight: 'bold',
                            background: theme.colors.neonBlue,
                            alignSelf: 'center',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            lineHeight: 1,
                            marginLeft: 'auto',
                            '&:hover': {
                              background: theme.colors.neonPink,
                              color: '#000'
                            }
                          }}
                        >
                          JOIN FLIP
                        </GameFlipButton>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Box - Live Games */}
              <div style={{
                background: 'rgba(0, 0, 20, 0.95)',
                borderRadius: '1rem',
                padding: '1rem',
                border: `1px solid ${theme.colors.neonPink}`,
                maxHeight: '600px',
                overflowY: 'auto'
              }}>
                <div style={{
                  fontSize: '1.2rem',
                  fontWeight: 'bold',
                  color: theme.colors.neonPink,
                  marginBottom: '1rem',
                  padding: '0.5rem',
                  borderBottom: `1px solid ${theme.colors.neonPink}`,
                  textShadow: '0 0 10px rgba(255, 105, 180, 0.5)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <LiveDot />
                  Live Games ({flips.filter(f => f.status === 'active').length})
                </div>
                
                <div style={{ 
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem'
                }}>
                  {flips
                    .filter(flip => flip.status === 'active' || flip.status === 'joined')
                    .map(flip => (
                      <div
                        key={flip.id}
                        onClick={() => handleSelectFlip(flip)}
                        style={{
                          background: 'rgba(0, 0, 0, 0.6)',
                          borderRadius: '0.75rem',
                          padding: '0.75rem',
                          border: `1px solid ${theme.colors.neonPink}`,
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            transform: 'translateY(-2px)',
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)'
                          }
                        }}
                      >
                        <div style={{ 
                          fontSize: '0.9rem', 
                          fontWeight: 'bold',
                          marginBottom: '0.25rem',
                          color: theme.colors.textPrimary
                        }}>
                          {flip.nft.name}
                        </div>
                        <div style={{ 
                          display: 'flex', 
                          gap: '0.75rem',
                          fontSize: '0.8rem',
                          color: theme.colors.textSecondary
                        }}>
                          <span>${(flip?.priceUSD || 0).toFixed(2)}</span>
                          <span>•</span>
                          <span>{flip.creatorWins || 0}-{flip.joinerWins || 0}</span>
                          <span>•</span>
                          <span>{getStatusIcon(flip.status)} {flip.status}</span>
                          <span>•</span>
                          <span>{flip.chain}</span>
                        </div>
                      </div>
                    ))}
                  
                  {flips.filter(flip => flip.status === 'active' || flip.status === 'joined').length === 0 && (
                    <p style={{ color: 'rgba(255, 255, 255, 0.5)', textAlign: 'center', padding: '1rem' }}>
                      No active games at the moment
                    </p>
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