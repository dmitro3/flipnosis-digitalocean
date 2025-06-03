import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useWallet } from '../contexts/WalletContext'
import { ThemeProvider } from '@emotion/react'
import { theme } from '../styles/theme'
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
  TransparentCard
} from '../styles/components'

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
      <Container>
        <ContentWrapper>
          {/* Database Stats */}
          <div style={{ 
            background: 'rgba(0, 255, 65, 0.1)', 
            padding: '1rem', 
            borderRadius: '1rem',
            border: '1px solid rgba(0, 255, 65, 0.3)',
            marginBottom: '1rem',
            textAlign: 'center'
          }}>
            <span style={{ color: theme.colors.neonGreen, fontWeight: 'bold' }}>
              📊 Live from Database: {flips.length} games loaded
            </span>
          </div>

          {/* Chain Filters */}
          <TransparentCard>
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
            <>
              <TwoBoxLayout>
                {/* Left Box - Selected Game */}
                <div>
                  {selectedFlip && (
                    <div style={{
                      background: 'rgba(0, 0, 0, 0.3)',
                      borderRadius: '1rem',
                      padding: '1.5rem',
                      border: `2px solid ${theme.colors.neonPink}`,
                      maxWidth: '300px'
                    }}>
                      <div style={{ position: 'relative', aspectRatio: '1', borderRadius: '0.75rem', overflow: 'hidden', marginBottom: '1rem' }}>
                        <GameImage 
                          src={selectedFlip.nft.image} 
                          alt={selectedFlip.nft.name}
                        />
                      </div>
                      
                      <GameInfo>
                        <div>
                          <GameTitle>{selectedFlip.nft.name}</GameTitle>
                          <GameCollection>{selectedFlip.nft.collection}</GameCollection>
                        </div>
                        
                        <GameStats>
                          <GameStat>{selectedFlip.rounds} Rounds</GameStat>
                          <GameStat>{selectedFlip.chain}</GameStat>
                          <GameStat>{getStatusIcon(selectedFlip.status)} {selectedFlip.status}</GameStat>
                          {selectedFlip.spectators > 0 && (
                            <GameStat>👀 {selectedFlip.spectators}</GameStat>
                          )}
                        </GameStats>
                        
                        <GamePrice>${(selectedFlip?.priceUSD || 0).toFixed(2)}</GamePrice>
                        
                        <p style={{ color: 'rgba(255, 255, 255, 0.7)', marginBottom: '1.5rem' }}>
                          {selectedFlip.description}
                        </p>

                        {/* Game Status Info */}
                        {selectedFlip.status === 'completed' && (
                          <div style={{ 
                            background: 'rgba(0, 255, 0, 0.1)', 
                            padding: '0.5rem', 
                            borderRadius: '0.5rem',
                            marginBottom: '1rem',
                            textAlign: 'center'
                          }}>
                            <div style={{ color: theme.colors.statusSuccess, fontWeight: 'bold' }}>
                              🏆 Game Complete!
                            </div>
                            <div style={{ color: theme.colors.textSecondary, fontSize: '0.875rem' }}>
                              Score: {selectedFlip.creatorWins} - {selectedFlip.joinerWins}
                            </div>
                          </div>
                        )}

                        <GameFlipButton
                          as={Link}
                          to={`/game/${selectedFlip.id}`}
                          style={{ 
                            background: selectedFlip.status === 'completed' ? theme.colors.neonBlue : theme.colors.neonPink 
                          }}
                        >
                          {selectedFlip.status === 'completed' ? 'VIEW RESULTS' : 'JOIN GAME'}
                        </GameFlipButton>
                      </GameInfo>
                    </div>
                  )}
                </div>

                {/* Right Box - Active Games List */}
                <ActiveGamesBox>
                  <ActiveGamesTitle>
                    <LiveDot />
                    Live Games ({flips.filter(f => f.status === 'active').length})
                  </ActiveGamesTitle>
                  
                  {flips
                    .filter(flip => flip.status === 'active' || flip.status === 'joined')
                    .map(flip => (
                      <ActiveGameItem 
                        key={flip.id}
                        onClick={() => handleSelectFlip(flip)}
                      >
                        <GameItemInfo>
                          <GameItemTitle>{flip.nft.name}</GameItemTitle>
                          <GameItemDetails>
                            <span>${(flip?.priceUSD || 0).toFixed(2)}</span>
                            <span>•</span>
                            <span>{flip.creatorWins || 0}-{flip.joinerWins || 0}</span>
                            <span>•</span>
                            <span>{getStatusIcon(flip.status)} {flip.status}</span>
                            <span>•</span>
                            <span>{flip.chain}</span>
                          </GameItemDetails>
                        </GameItemInfo>
                      </ActiveGameItem>
                    ))}
                  
                  {flips.filter(flip => flip.status === 'active' || flip.status === 'joined').length === 0 && (
                    <p style={{ color: 'rgba(255, 255, 255, 0.5)', textAlign: 'center', padding: '1rem' }}>
                      No active games at the moment
                    </p>
                  )}
                </ActiveGamesBox>
              </TwoBoxLayout>

              {/* Available Flips Grid */}
              <div style={{ marginTop: '2rem' }}>
                <NeonText style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>
                  Available Flips ({filteredFlips.filter(flip => flip.status === 'waiting').length})
                </NeonText>
                <Grid>
                  {filteredFlips
                    .filter(flip => flip.status === 'waiting')
                    .map((flip) => (
                      <GameCard
                        key={flip.id}
                        onClick={() => handleSelectFlip(flip)}
                        style={{
                          border: selectedFlip?.id === flip.id ? `2px solid ${theme.colors.neonPink}` : 'none'
                        }}
                      >
                        <GameImage src={flip.nft.image} alt={flip.nft.name} />
                        <GameInfo>
                          <div>
                            <GameTitle>{flip.nft.name}</GameTitle>
                            <GameCollection>{flip.nft.collection}</GameCollection>
                          </div>
                          
                          <GameStats>
                            <GameStat>{flip.rounds} Rounds</GameStat>
                            <GameStat>{flip.chain}</GameStat>
                            <GameStat>{chains[flip.chain]?.icon || '🔗'}</GameStat>
                          </GameStats>
                          
                          <GamePrice>${(flip?.priceUSD || 0).toFixed(2)}</GamePrice>
                          
                          <GameFlipButton
                            as={Link}
                            to={`/game/${flip.id}`}
                            style={{ background: theme.colors.neonPink }}
                          >
                            JOIN FLIP
                          </GameFlipButton>
                        </GameInfo>
                      </GameCard>
                    ))}
                </Grid>
              </div>
            </>
          )}
        </ContentWrapper>
      </Container>
    </ThemeProvider>
  )
}

export default Home 