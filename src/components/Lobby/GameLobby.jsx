import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ThemeProvider } from '@emotion/react'
import styled from '@emotion/styled'

// Context imports
import { useWallet } from '../../contexts/WalletContext'
import { useToast } from '../../contexts/ToastContext'

// Component imports  
import GameBackground from '../GameOrchestrator/GameBackground'
import GameCoin from '../GameOrchestrator/GameCoin'
import GamePayment from '../GameOrchestrator/GamePayment'
import ProfilePicture from '../ProfilePicture'
import NFTDetailsContainer from './NFTDetailsContainer'
import ChatContainer from './ChatContainer'
import OffersContainer from './OffersContainer'
import CoinContainer from '../GameOrchestrator/CoinContainer'
import GameCountdown from '../GameOrchestrator/GameCountdown'
import OfferAcceptanceOverlay from './OfferAcceptanceOverlay'

// Lobby-specific hooks
import { useLobbyState } from './hooks/useLobbyState'
import webSocketService from '../../services/WebSocketService'

// Styles
import { theme } from '../../styles/theme'
import { LoadingSpinner } from '../../styles/components'

const Container = styled.div`
  min-height: 100vh;
  position: relative;
  z-index: 1;
`

const GameContainer = styled.div`
  width: 100%;
  max-width: 100%;
  margin: 0 auto;
  padding: 2rem;
  
  @media (max-width: 768px) {
    padding: 1rem;
  }
`

const GameLayout = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2rem;
  align-items: center;
`

// New unified background container
const LobbyBackgroundContainer = styled.div`
  background: rgba(0, 0, 20, 0.95);
  border: 2px solid #FFD700;
  border-radius: 1rem;
  padding: 2rem;
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  box-shadow: 0 0 30px rgba(255, 215, 0, 0.3);
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(45deg, transparent 30%, rgba(255, 215, 0, 0.05) 50%, transparent 70%);
    animation: shimmer 3s ease-in-out infinite;
    pointer-events: none;
  }
  
  @keyframes shimmer {
    0%, 100% { transform: translateX(-100%); }
    50% { transform: translateX(100%); }
  }
`

const LobbyContent = styled.div`
  display: grid;
  grid-template-columns: 1.2fr 1fr 0.8fr;
  gap: 2rem;
  width: 100%;
  position: relative;
  z-index: 2;
  
  @media (max-width: 1200px) {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
`

const NFTAndCoinSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  height: 800px;
`

const NFTDetailsWrapper = styled.div`
  background: rgba(0, 0, 40, 0.95);
  border: 2px solid #FF1493;
  border-radius: 1rem;
  padding: 1.5rem;
  flex: 1;
  display: flex;
  flex-direction: column;
  box-shadow: 0 0 30px rgba(255, 20, 147, 0.3), inset 0 0 20px rgba(255, 20, 147, 0.1);
  overflow: hidden;
`

const CoinSection = styled.div`
  background: rgba(0, 0, 40, 0.95);
  border: 2px solid #FFD700;
  border-radius: 1rem;
  padding: 1rem;
  height: 300px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 30px rgba(255, 215, 0, 0.3);
`

const GameLobby = () => {
  console.log('🏠 GAMELOBBY COMPONENT LOADED!')
  
  const { gameId } = useParams()
  const navigate = useNavigate()
  const { address, isMobile, chain } = useWallet()
  const { showSuccess, showError, showInfo } = useToast()
  
  // Add new state for game phases
  const [showCountdown, setShowCountdown] = useState(false)
  const [countdownTriggered, setCountdownTriggered] = useState(false)
  
  // Offer acceptance overlay state
  const [showOfferOverlay, setShowOfferOverlay] = useState(false)
  const [acceptedOffer, setAcceptedOffer] = useState(null)

  // Lobby state management
  const {
    gameData,
    loading,
    error,
    offers,
    chatMessages,
    ethAmount,
    depositTimeLeft,
    newOffer,
    creatingOffer,
    createOffer,
    acceptOffer,
    rejectOffer,
    formatTimeLeft,
    loadGameData,
    loadOffers,
    setNewOffer,
    setCreatingOffer,
    setChatMessages,
    isCreator,
    isJoiner,
    getGameCreator,
    getGameJoiner,
    getGamePrice,
    getGameNFTImage,
    getGameNFTName,
    getGameNFTCollection
  } = useLobbyState(gameId, address)

  // Lobby WebSocket management
  const [wsConnected, setWsConnected] = useState(false)
  const [wsRef, setWsRef] = useState(null)

  // Connect to lobby when component mounts
  useEffect(() => {
    const initLobby = async () => {
      if (!gameId || !address) return
      
      const lobbyRoomId = `game_${gameId}`
      // Make sure to properly await connection
      await webSocketService.connect(lobbyRoomId, address)
      setWsConnected(true)
      
      // Register message handlers
      webSocketService.on('chat_message', handleChatMessage)
      webSocketService.on('offer_made', handleOfferMessage)
      webSocketService.on('offer_accepted', handleOfferAccepted)
    }
    
    initLobby()
    
    return () => {
      webSocketService.off('chat_message')
      webSocketService.off('offer_made')
      webSocketService.off('offer_accepted')
    }
  }, [gameId, address])

  // Message handlers
  const handleChatMessage = (data) => {
    console.log('Chat message received:', data)
    // Handle chat message
  }

  const handleOfferMessage = (data) => {
    console.log('Offer message received:', data)
    // Handle offer message
  }

  const handleOfferAccepted = (data) => {
    console.log('Offer accepted:', data)
    // Handle offer accepted
  }

  const sendOfferMessage = (message) => {
    webSocketService.send({
      type: 'chat_message',
      gameId,
      message,
      from: address
    })
  }

  const sendChatMessage = (message) => {
    webSocketService.send({
      type: 'chat_message',
      gameId,
      message,
      from: address
    })
  }

  // Placeholder for coin display (since we don't need the complex game logic in lobby)
  const [customHeadsImage, setCustomHeadsImage] = useState('/coins/plainh.png')
  const [customTailsImage, setCustomTailsImage] = useState('/coins/plaint.png')
  const [gameCoin, setGameCoin] = useState({
    id: 'plain',
    type: 'default',
    name: 'Classic',
    headsImage: '/coins/plainh.png',
    tailsImage: '/coins/plaint.png'
  })

  // Update coin images when game data changes
  useEffect(() => {
    let coinData = null

    if (gameData?.coinData && typeof gameData.coinData === 'object') {
      coinData = gameData.coinData
    } else if (gameData?.coin_data) {
      try {
        coinData = typeof gameData.coin_data === 'string' ? 
          JSON.parse(gameData.coin_data) : gameData.coin_data
      } catch (error) {
        console.error('❌ Error parsing coin data:', error)
      }
    }

    if (coinData && coinData.headsImage && coinData.tailsImage) {
      setCustomHeadsImage(coinData.headsImage)
      setCustomTailsImage(coinData.tailsImage)
      setGameCoin(coinData)
    }
  }, [gameData])

  // Listen for lobby refresh events from WebSocket
  useEffect(() => {
    const handleLobbyRefresh = (event) => {
      console.log('🔄 Lobby refresh triggered:', event.detail)
      loadGameData() // Refresh game data to check for countdown
    }

    window.addEventListener('lobbyRefresh', handleLobbyRefresh)
    return () => window.removeEventListener('lobbyRefresh', handleLobbyRefresh)
  }, [loadGameData])

  // Watch for game starting (both players deposited)
  useEffect(() => {
    console.log('🔍 Countdown useEffect running...')
    console.log('🔍 gameData exists:', !!gameData)
    console.log('🔍 gameData keys:', gameData ? Object.keys(gameData) : 'no gameData')
    
    // Debug logging to see what's happening
    console.log('🔍 Countdown Debug:', {
      gameData: gameData,
      status: gameData?.status,
      creator_deposited: gameData?.creator_deposited,
      challenger_deposited: gameData?.challenger_deposited,
      countdownTriggered: countdownTriggered,
      isCreator: isCreator(),
      isJoiner: isJoiner(),
      address: address
    })
    
    // Check if both players have deposited - only trigger once when status becomes 'active'
    if (gameData?.status === 'active' && 
        gameData?.creator_deposited && 
        gameData?.challenger_deposited &&
        !countdownTriggered) {
      
      // Only show countdown for the two players
      const isPlayer = isCreator() || isJoiner() || 
                      (gameData?.challenger && address && 
                       gameData.challenger.toLowerCase() === address.toLowerCase())
      
      console.log('🎯 Countdown conditions met:', {
        isPlayer: isPlayer,
        isCreator: isCreator(),
        isJoiner: isJoiner(),
        challengerMatch: gameData?.challenger && address && 
                        gameData.challenger.toLowerCase() === address.toLowerCase(),
        gameStatus: gameData?.status,
        creatorDeposited: gameData?.creator_deposited,
        challengerDeposited: gameData?.challenger_deposited
      })
      
      if (isPlayer) {
        console.log('🚀 Game starting! Showing countdown...')
        setCountdownTriggered(true)
        setShowCountdown(true)
      }
    }
  }, [gameData, address, isCreator, isJoiner, countdownTriggered])
  
  // Handle countdown completion - transport to game room
  const handleCountdownComplete = () => {
    console.log('⚔️ Countdown complete! Transporting to game room...')
    setShowCountdown(false)
    
    // Transport to game room - this will be handled by the parent component
    // or we can navigate to a game room route
    showInfo('Entering Battle Arena!')
    
    // For now, we'll trigger a custom event that the parent can listen to
    window.dispatchEvent(new CustomEvent('enterGameRoom', {
      detail: { gameId, gameData }
    }))
  }

  // Loading state
  if (loading) {
    return (
      <ThemeProvider theme={theme}>
        <Container>
          <GameContainer>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              minHeight: '50vh' 
            }}>
              <LoadingSpinner />
              <span style={{ marginLeft: '1rem', color: 'white' }}>Loading game lobby...</span>
            </div>
          </GameContainer>
        </Container>
      </ThemeProvider>
    )
  }

  // Error state
  if (error) {
    return (
      <ThemeProvider theme={theme}>
        <Container>
          <GameContainer>
            <div style={{ 
              textAlign: 'center', 
              color: 'white', 
              padding: '2rem' 
            }}>
              <h2>Error Loading Game Lobby</h2>
              <p>{error}</p>
              <button 
                onClick={() => navigate('/')}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: '#00FF41',
                  color: '#000',
                  border: 'none',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  marginTop: '1rem'
                }}
              >
                Back to Home
              </button>
            </div>
          </GameContainer>
        </Container>
      </ThemeProvider>
    )
  }

  // No game data state
  if (!gameData) {
    return (
      <ThemeProvider theme={theme}>
        <Container>
          <GameContainer>
            <div style={{ 
              textAlign: 'center', 
              color: 'white', 
              padding: '2rem' 
            }}>
              <h2>Game Not Found</h2>
              <p>The game you're looking for doesn't exist or has been removed.</p>
              <button 
                onClick={() => navigate('/')}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: '#00FF41',
                  color: '#000',
                  border: 'none',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  marginTop: '1rem'
                }}
              >
                Back to Home
              </button>
            </div>
          </GameContainer>
        </Container>
      </ThemeProvider>
    )
  }
  
  // Check if current user is a player
  const isPlayer = isCreator() || isJoiner() || 
                  (gameData?.challenger && address && 
                   gameData.challenger.toLowerCase() === address.toLowerCase())
  
  // Render countdown overlay
  if (showCountdown) {
    return (
      <>
        <Container>
          <GameBackground />
        </Container>
        <GameCountdown
          isVisible={showCountdown}
          onComplete={handleCountdownComplete}
          creatorAddress={getGameCreator()}
          challengerAddress={getGameJoiner()}
          currentUserAddress={address}
        />
      </>
    )
  }

  // Regular lobby view
  return (
    <ThemeProvider theme={theme}>
      <Container>
        <GameBackground />
        <GameContainer>
          <GameLayout>
            
            {/* Payment Section - Only show during payment phase */}
            {(gameData?.status === 'waiting_challenger_deposit' || 
              gameData?.status === 'pending') && (
              <GamePayment
                gameData={gameData}
                gameId={gameId}
                address={address}
                isCreator={isCreator}
                isJoiner={isJoiner}
                depositTimeLeft={depositTimeLeft}
                formatTimeLeft={formatTimeLeft}
                ethAmount={ethAmount}
                getGamePrice={getGamePrice}
                getGameNFTImage={getGameNFTImage}
                getGameNFTName={getGameNFTName}
                getGameNFTCollection={getGameNFTCollection}
                contractInitialized={true}
                loadGameData={loadGameData}
              />
            )}
            
            {/* Unified Lobby Background Container */}
            <LobbyBackgroundContainer>
              <LobbyContent>
                {/* NFT Details and Coin Section */}
                <NFTAndCoinSection>
                  {/* NFT Details Container */}
                  <NFTDetailsWrapper style={{ position: 'relative' }}>
                    <NFTDetailsContainer
                      gameData={gameData}
                      isCreator={isCreator()}
                      currentTurn={null}
                      nftData={{
                        image: getGameNFTImage(),
                        name: getGameNFTName(),
                        collection: getGameNFTCollection()
                      }}
                      currentChain={chain}
                    />
                    
                    {/* Offer Acceptance Overlay */}
                    <OfferAcceptanceOverlay
                      isVisible={showOfferOverlay}
                      acceptedOffer={acceptedOffer}
                      gameData={gameData}
                      gameId={gameId}
                      address={address}
                      onClose={() => {
                        setShowOfferOverlay(false)
                        setAcceptedOffer(null)
                      }}
                      onDepositComplete={(offer) => {
                        setShowOfferOverlay(false)
                        setAcceptedOffer(null)
                        // Reload game data to update status
                        loadGameData()
                        showInfo('Game starting!')
                      }}
                    />
                  </NFTDetailsWrapper>
                  
                  {/* Coin Container */}
                  {gameData?.status !== 'completed' && (
                    <CoinSection>
                      <CoinContainer
                        gameId={gameId}
                        gameData={gameData}
                        customHeadsImage={customHeadsImage}
                        customTailsImage={customTailsImage}
                        gameCoin={gameCoin}
                        isMobile={isMobile}
                        address={address}
                        isCreator={isCreator}
                      />
                    </CoinSection>
                  )}
                </NFTAndCoinSection>
                
                {/* Chat Container */}
                <div style={{ height: '800px' }}>
                  <ChatContainer
                    gameId={gameId}
                    gameData={gameData}
                    socket={webSocketService}
                    connected={wsConnected}
                  />
                </div>
                
                {/* Offers Container */}
                <div style={{ height: '800px' }}>
                  <OffersContainer
                    gameId={gameId}
                    gameData={gameData}
                    socket={webSocketService}
                    connected={wsConnected}
                    offers={offers}
                    isCreator={isCreator}
                    onOfferSubmitted={(offerData) => {
                      console.log('Offer submitted via offers container:', offerData)
                    }}
                    onOfferAccepted={(offer) => {
                      console.log('Offer accepted via offers container:', offer)
                      setAcceptedOffer(offer)
                      setShowOfferOverlay(true)
                    }}
                  />
                </div>
              </LobbyContent>
            </LobbyBackgroundContainer>
          </GameLayout>
        </GameContainer>
      </Container>
    </ThemeProvider>
  )
}

export default GameLobby
