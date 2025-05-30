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
  ChainBadge,
  StatusBadge,
  PriceBadge,
  SelectedGameContainer,
  GameDetails,
  DetailCard,
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
  const { chains, isConnected, firebaseService, address } = useWallet()
  const [activeFilter, setActiveFilter] = useState('all')
  const [flips, setFlips] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedFlip, setSelectedFlip] = useState(null)
  const [error, setError] = useState(null)

  // Fetch active flips from Firebase
  useEffect(() => {
    const fetchActiveFlips = async () => {
      if (!firebaseService) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)

        const chainFilter = activeFilter === 'all' ? null : activeFilter
        const result = await firebaseService.getActiveGames(chainFilter)

        if (!result.success) {
          throw new Error(result.error)
        }

        const processedFlips = result.games.map(game => ({
          id: game.id,
          nft: {
            name: game.nft?.name || 'Unknown NFT',
            image: game.nft?.image || '',
            collection: game.nft?.collection || 'Unknown Collection'
          },
          price: game.price || 0,
          priceUSD: game.priceUSD || game.price || 0,
          currency: game.currency || 'USD',
          chain: game.nft?.chain || 'base',
          creator: game.creator || '',
          joiner: game.joiner || null,
          rounds: game.rounds || 3,
          status: game.status || 'waiting',
          createdAt: game.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          expiresAt: game.expiresAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          description: game.nft?.description || 'No description available',
          gameData: game
        }))

        console.log('Fetched flips from Firebase:', processedFlips)
        setFlips(processedFlips)
        
        if (processedFlips.length > 0) {
          setSelectedFlip(processedFlips[0])
        }
      } catch (error) {
        console.error('Error fetching active flips:', error)
        setError('Failed to fetch active flips. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    fetchActiveFlips()
  }, [firebaseService, activeFilter])

  // Real-time updates
  useEffect(() => {
    if (!firebaseService) return

    const chainFilter = activeFilter === 'all' ? null : activeFilter
    
    const unsubscribe = firebaseService.subscribeToActiveGames((games) => {
      const processedFlips = games.map(game => ({
        id: game.id,
        nft: {
          name: game.nft?.name || 'Unknown NFT',
          image: game.nft?.image || '',
          collection: game.nft?.collection || 'Unknown Collection'
        },
        price: game.price || 0,
        priceUSD: game.priceUSD || game.price || 0,
        currency: game.currency || 'USD',
        chain: game.nft?.chain || 'base',
        creator: game.creator || '',
        joiner: game.joiner || null,
        rounds: game.rounds || 3,
        status: game.status || 'waiting',
        createdAt: game.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        expiresAt: game.expiresAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        description: game.nft?.description || 'No description available',
        gameData: game
      }))

      setFlips(processedFlips)
      if (processedFlips.length > 0 && !selectedFlip) {
        setSelectedFlip(processedFlips[0])
      }
    }, chainFilter)

    return () => unsubscribe && unsubscribe()
  }, [firebaseService, activeFilter])

  const filteredFlips = flips.filter(flip => 
    activeFilter === 'all' || flip.chain === activeFilter
  )

  const chainFilters = [
    { key: 'all', name: 'All', icon: '🌐' },
    { key: 'base', name: 'Base', icon: '🔵' },
    { key: 'polygon', name: 'Polygon', icon: '🟣' },
    { key: 'arbitrum', name: 'Arbitrum', icon: '🔷' },
    { key: 'bnb', name: 'BNB', icon: '🟡' },
    { key: 'avalanche', name: 'Avalanche', icon: '🔴' }
  ]

  const handleSelectFlip = (flip) => {
    setSelectedFlip(flip)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const getStatusColor = (status) => {
    return status === 'waiting' ? theme.colors.statusWarning : 
           status === 'active' ? theme.colors.statusSuccess : theme.colors.textTertiary
  }

  const getStatusIcon = (status) => {
    return status === 'waiting' ? '⏳' : 
           status === 'active' ? '🔴' : '✅'
  }

  if (loading) {
    return (
      <ThemeProvider theme={theme}>
        <Container>
          <ContentWrapper>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
              <LoadingSpinner />
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
            <GlassCard className="text-center py-20">
              <NeonText className="text-2xl mb-6">Error</NeonText>
              <p className="text-gray-400 mb-8">{error}</p>
              <Button onClick={() => window.location.reload()} style={{ background: theme.colors.neonPink }}>
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

          {flips.length === 0 ? (
            <GlassCard className="text-center py-20" style={{ border: `2px solid ${theme.colors.neonPink}` }}>
              <NeonText className="text-2xl mb-6">No Active Flips</NeonText>
              <p className="text-gray-400 mb-8">There are no active flips at the moment. Be the first to create one!</p>
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
                    <SelectedGameContainer style={{ border: `2px solid ${theme.colors.neonPink}` }}>
                      <div className="relative aspect-square rounded-xl overflow-hidden mb-4">
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
                          <GameStat>{chains[selectedFlip.chain]?.icon || '🔗'}</GameStat>
                          <GameStat>{selectedFlip.status}</GameStat>
                        </GameStats>
                        
                        <GamePrice>${(selectedFlip?.priceUSD || 0).toFixed(2)}</GamePrice>
                        
                        <p className="text-gray-400 mb-6">{selectedFlip.description}</p>

                        <GameFlipButton
                          as={Link}
                          to={`/game/${selectedFlip.id}`}
                          style={{ background: theme.colors.neonPink }}
                        >
                          FLIP
                        </GameFlipButton>
                      </GameInfo>
                    </SelectedGameContainer>
                  )}
                </div>

                {/* Right Box - Active Games List */}
                <ActiveGamesBox>
                  <ActiveGamesTitle>
                    <LiveDot />
                    Active Games
                  </ActiveGamesTitle>
                  
                  {flips
                    .filter(flip => flip.status === 'active' && flip.joiner)
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
                            <span>Round {flip.currentRound || 1}/{flip.rounds}</span>
                            <span>•</span>
                            <span>{flip.chain}</span>
                          </GameItemDetails>
                        </GameItemInfo>
                      </ActiveGameItem>
                    ))}
                  {flips.filter(flip => flip.status === 'active' && flip.joiner).length === 0 && (
                    <p style={{ color: 'rgba(255, 255, 255, 0.5)', textAlign: 'center', padding: '1rem' }}>
                      No active games at the moment
                    </p>
                  )}
                </ActiveGamesBox>
              </TwoBoxLayout>

              {/* Available Flips Grid */}
              <div style={{ marginTop: '2rem' }}>
                <NeonText style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>
                  Available Flips
                </NeonText>
                <Grid>
                  {filteredFlips
                    .filter(flip => !flip.joiner)
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
                            FLIP
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