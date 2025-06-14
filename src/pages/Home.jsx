import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useWallet } from '../contexts/WalletContext'
import { ThemeProvider } from '@emotion/react'
import { theme } from '../styles/theme'
import styled from '@emotion/styled'
import hazeVideo from '../../Images/Video/haze.webm'
import { contractService } from '../services/ContractService'
import { ethers } from 'ethers'
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

const Home = () => {
  const { chains, isConnected, connectWallet } = useWallet()
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
        spectators: game.total_spectators || 0,
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
    if (activeFilter === 'all') return true
    if (activeFilter === 'nft-vs-crypto' || activeFilter === 'nft-vs-nft') {
      return flip.gameType === activeFilter
    }
    return flip.chain === activeFilter
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
                    border: `2px solid ${selectedFlip.gameType === 'nft-vs-nft' ? theme.colors.neonGreen : theme.colors.neonPink}`,
                    maxWidth: '240px'
                  }}>
                    <div style={{ position: 'relative', aspectRatio: '1', borderRadius: '0.75rem', overflow: 'hidden', marginBottom: '1rem' }}>
                      <GameImage 
                        src={selectedFlip.nft.image} 
                        alt={selectedFlip.nft.name}
                      />
                      <div style={{
                        position: 'absolute',
                        top: '0.5rem',
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
                    
                    <GameInfo>
                      <GameTitle>{selectedFlip.nft.name}</GameTitle>
                      <GameCollection>{selectedFlip.nft.collection}</GameCollection>
                      
                      <GameStats>
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
                        <GameStat>
                          <span>Rounds</span>
                          <div>{selectedFlip.rounds}</div>
                        </GameStat>
                      </GameStats>
                      
                      <GameFlipButton 
                        as={Link} 
                        to={`/game/${selectedFlip.id}`}
                        style={{
                          background: selectedFlip.gameType === 'nft-vs-nft' ? 
                            'linear-gradient(45deg, #00FF41, #39FF14)' : 
                            'linear-gradient(45deg, #FF1493, #FF69B4)',
                          color: selectedFlip.gameType === 'nft-vs-nft' ? '#000' : '#fff',
                          fontWeight: 'bold'
                        }}
                      >
                        {selectedFlip.gameType === 'nft-vs-nft' ? '⚔️ Join Battle' : '💎 View Flip'}
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
                        border: `1px solid ${flip.gameType === 'nft-vs-nft' ? theme.colors.neonGreen : theme.colors.neonBlue}`,
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
                          flexShrink: 0,
                          position: 'relative'
                        }}>
                          <GameImage 
                            src={flip.nft.image} 
                            alt={flip.nft.name}
                          />
                          <div style={{
                            position: 'absolute',
                            top: '2px',
                            right: '2px',
                            background: flip.gameType === 'nft-vs-nft' ? 
                              'linear-gradient(45deg, #00FF41, #39FF14)' : 
                              'linear-gradient(45deg, #FF1493, #FF69B4)',
                            color: flip.gameType === 'nft-vs-nft' ? '#000' : '#fff',
                            fontSize: '8px',
                            padding: '1px 3px',
                            borderRadius: '2px',
                            fontWeight: 'bold'
                          }}>
                            {flip.gameType === 'nft-vs-nft' ? '⚔️' : '💰'}
                          </div>
                          {flip.status === 'completed' && (
                            <div style={{
                              position: 'absolute',
                              bottom: '2px',
                              left: '2px',
                              right: '2px',
                              background: 'rgba(255, 0, 0, 0.9)',
                              color: '#fff',
                              fontSize: '8px',
                              padding: '2px 4px',
                              borderRadius: '2px',
                              fontWeight: 'bold',
                              textAlign: 'center',
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px',
                              boxShadow: '0 0 5px rgba(255, 0, 0, 0.5)'
                            }}>
                              Ended
                            </div>
                          )}
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
                            color: theme.colors.textSecondary,
                            alignItems: 'center'
                          }}>
                            <span>{flip.rounds} Rounds</span>
                            <span>{flip.chain}</span>
                            <span>
                              {flip.gameType === 'nft-vs-nft' ? (
                                <span style={{ 
                                  color: theme.colors.neonGreen,
                                  fontWeight: 'bold'
                                }}>
                                  ⚔️ NFT Battle
                                </span>
                              ) : (
                                <span style={{ 
                                  color: theme.colors.neonPink,
                                  fontWeight: 'bold'
                                }}>
                                  ${flip.priceUSD.toFixed(2)}
                                </span>
                              )}
                            </span>
                            {flip.gameType === 'nft-vs-nft' && flip.challengerNFT && (
                              <span style={{
                                color: theme.colors.neonYellow,
                                fontSize: '0.7rem'
                              }}>
                                vs {flip.challengerNFT.name}
                              </span>
                            )}
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
                            color: '#fff',
                            fontWeight: 'bold',
                            background: flip.gameType === 'nft-vs-nft' ? 
                              'linear-gradient(45deg, #00FF41, #39FF14)' : 
                              'linear-gradient(45deg, #FF1493, #FF69B4)',
                            alignSelf: 'center',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            lineHeight: 1,
                            marginLeft: 'auto',
                            '&:hover': {
                              background: flip.gameType === 'nft-vs-nft' ? 
                                'linear-gradient(45deg, #00FF41, #39FF14)' : 
                                'linear-gradient(45deg, #FF1493, #FF69B4)',
                              color: flip.gameType === 'nft-vs-nft' ? '#000' : '#fff'
                            }
                          }}
                        >
                          {flip.gameType === 'nft-vs-nft' ? 'BATTLE' : 'VIEW FLIP'}
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