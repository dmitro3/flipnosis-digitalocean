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
import { TabbedGameInterface } from '../TabbedGame'

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
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
  
  @media (max-width: 768px) {
    padding: 1rem;
  }
`

const GameLayout = styled.div`
  display: flex;
  flex-direction: column;
  gap: 3rem;
  align-items: center;
`

// New unified background container
const LobbyBackgroundContainer = styled.div`
  background: rgba(0, 0, 20, 0.95);
  border: 2px solid #FFD700;
  border-radius: 1rem;
  padding: 2.5rem;
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
  grid-template-columns: 2fr 1fr 1fr;
  gap: 3rem;
  width: 100%;
  position: relative;
  z-index: 2;
  transition: grid-template-columns 0.5s ease-in-out;
  
  @media (max-width: 1200px) {
    grid-template-columns: 1fr;
    gap: 2rem;
  }
`

const NFTAndCoinSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 3rem;
  align-items: center;
`

const NFTDetailsWrapper = styled.div`
  width: 100%;
  max-width: 600px;
`

const CoinSection = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
  width: 100%;
  opacity: ${props => props.show ? 1 : 0};
  transform: ${props => props.show ? 'scale(1)' : 'scale(0.8)'};
  transition: opacity 0.5s ease-in-out, transform 0.5s ease-in-out;
`

const OffersSection = styled.div`
  height: 750px;
  opacity: ${props => props.show ? 1 : 0};
  transform: ${props => props.show ? 'translateX(0)' : 'translateX(20px)'};
  transition: opacity 0.5s ease-in-out, transform 0.5s ease-in-out;
  pointer-events: ${props => props.show ? 'auto' : 'none'};
`

const GameLobby = () => {
  console.log('🏠 GAMELOBBY COMPONENT LOADED!')
  
  const { gameId } = useParams()
  const navigate = useNavigate()
  const { address, isMobile, chain } = useWallet()
  const { showSuccess, showError, showInfo } = useToast()
  
  // REMOVED: Transition state variables - not needed anymore
  
  // Offer acceptance is now handled within the Lounge tab
  
  // Add new state for game phases
  const [showCountdown, setShowCountdown] = useState(false)
  const [countdownTriggered, setCountdownTriggered] = useState(false)

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
      console.log('🔌 GameLobby: Attempting WebSocket connection...', { gameId, address })
      
      if (!gameId || !address) {
        console.log('🔌 GameLobby: Missing gameId or address, skipping connection')
        return
      }
      
      const lobbyRoomId = `game_${gameId}`
      console.log('🔌 GameLobby: Connecting to room:', lobbyRoomId)
      
      try {
        // Make sure to properly await connection
        await webSocketService.connect(lobbyRoomId, address)
        console.log('✅ GameLobby: WebSocket connected successfully')
        setWsConnected(true)
        
        // Register message handlers for game state changes only
        webSocketService.on('game_awaiting_challenger_deposit', handleGameAwaitingDeposit)
        webSocketService.on('deposit_confirmed', handleDepositConfirmed)
        webSocketService.on('game_started', handleGameStarted)
        
        // Add handlers for offer acceptance to trigger tab switching
        webSocketService.on('offer_accepted', handleOfferAccepted)
        webSocketService.on('your_offer_accepted', handleYourOfferAccepted)
        webSocketService.on('accept_crypto_offer', handleOfferAccepted)
        webSocketService.on('game_status_changed', handleGameStatusChanged)
        
        console.log('✅ GameLobby: Game state message handlers registered')
        
        // Debug: Log all incoming messages to see what we're receiving
        webSocketService.on('room_joined', (data) => {
          console.log('✅ GameLobby: Room joined confirmation received:', data)
        })
        
        // Debug: Log any other messages we might be missing
        webSocketService.on('crypto_offer', (data) => {
          console.log('💰 GameLobby: Crypto offer received:', data)
        })
        
        webSocketService.on('system', (data) => {
          console.log('🔧 GameLobby: System message received:', data)
        })
        
        // Debug: Check what room we're connected to
        console.log('🔍 GameLobby: Connected to room:', lobbyRoomId)
        console.log('🔍 GameLobby: WebSocket service state:', {
          connected: webSocketService.connected,
          currentRoom: webSocketService.currentRoom,
          gameId: webSocketService.gameId,
          address: webSocketService.address
        })
      } catch (error) {
        console.error('❌ GameLobby: WebSocket connection failed:', error)
        setWsConnected(false)
      }
    }
    
    initLobby()
    
    return () => {
      console.log('🔌 GameLobby: Cleaning up WebSocket handlers')
      webSocketService.off('game_awaiting_challenger_deposit')
      webSocketService.off('deposit_confirmed')
      webSocketService.off('game_started')
      webSocketService.off('room_joined')
      webSocketService.off('crypto_offer')
      webSocketService.off('system')
      webSocketService.off('offer_accepted')
      webSocketService.off('your_offer_accepted')
      webSocketService.off('accept_crypto_offer')
      webSocketService.off('game_status_changed')
    }
  }, [gameId, address])

  // Game state message handlers only

  const handleDepositConfirmed = (data) => {
    console.log('Deposit confirmed:', data)
    showSuccess('Deposit confirmed! Game starting...')
    loadGameData() // Refresh game data to check for deposit status
  }

  const handleGameStarted = (data) => {
    console.log('Game started:', data)
    showSuccess('Game started! Both players deposited.')
    loadGameData() // Refresh game data to check for deposit status
  }

  const handleGameAwaitingDeposit = (data) => {
    console.log('🎯 Game awaiting challenger deposit:', data)
    console.log('🎯 Current user address:', address)
    console.log('🎯 Challenger address from data:', data.challenger)
    
    // Check if current user is the challenger who needs to deposit
    if (data.challenger && address && 
        data.challenger.toLowerCase() === address.toLowerCase()) {
      console.log('🎯 Current user is the challenger - needs to deposit')
      
      // Show info message - deposit will be handled in the Lounge tab
      showInfo(`Your offer was accepted! Please check the Lounge tab to deposit $${data.cryptoAmount || data.payment_amount} USD worth of ETH.`)
    } else {
      console.log('🎯 Current user is not the challenger - challenger comparison failed:', {
        currentAddress: address,
        challengerAddress: data.challenger,
        match: data.challenger && address && 
               data.challenger.toLowerCase() === address.toLowerCase()
      })
    }
    
    // Always refresh game data
    loadGameData()
  }

  // Handle offer accepted event from event-driven system
  const handleOfferAccepted = (data) => {
    console.log('🎯 Event-driven offer accepted received:', data)
    
    if (data.gameId === gameData?.id) {
      console.log('✅ Offer accepted for current game, refreshing data...')
      showInfo('Offer accepted! Game status updated.')
      
      // Force refresh game data to get updated status
      loadGameData()
      
      // Also trigger a delayed refresh to ensure server has processed
      setTimeout(() => {
        console.log('⏰ Delayed game data refresh after offer acceptance')
        loadGameData()
      }, 1000)
    }
  }

  // Handle game status changed event
  const handleGameStatusChanged = (data) => {
    console.log('🔄 Game status changed event received:', data)
    
    if (data.gameId === gameData?.id) {
      console.log(`🔄 Game status changed from ${data.data.previousStatus} to ${data.data.newStatus}`)
      
      // Refresh game data to get the new status
      loadGameData()
      
      // Show appropriate message based on status change
      if (data.data.newStatus === 'waiting_challenger_deposit') {
        showInfo('Game is now waiting for challenger to deposit crypto.')
      }
    }
  }

  // Handle your offer accepted event (for challenger)
  const handleYourOfferAccepted = (data) => {
    console.log('🎯 Your offer accepted event received:', data)
    
    if (data.gameId === gameData?.id) {
      console.log('✅ Your offer was accepted, showing deposit overlay...')
      showSuccess('Your offer was accepted! Please deposit crypto within 2 minutes.')
      
      // Refresh game data
      loadGameData()
    }
  }

  // REMOVED: handleDepositTransition function - not needed anymore

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

  // REMOVED: Transition logic that was hiding offers box
  // Offers box should always be visible until countdown starts

  // Listen for lobby refresh events from WebSocket
  useEffect(() => {
    const handleLobbyRefresh = (event) => {
      console.log('🔄 Lobby refresh triggered:', event.detail)
      loadGameData() // Refresh game data to check for countdown
    }

    window.addEventListener('lobbyRefresh', handleLobbyRefresh)
    return () => window.removeEventListener('lobbyRefresh', handleLobbyRefresh)
  }, [loadGameData])

  // Watch for game starting (both players deposited) - with debouncing to prevent flash
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
    // Add a small delay to prevent flash from rapid re-renders
    const checkCountdown = () => {
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
    }
    
    // Debounce the countdown check to prevent flash
    const timeoutId = setTimeout(checkCountdown, 100)
    
    return () => clearTimeout(timeoutId)
  }, [gameData, address, isCreator, isJoiner, countdownTriggered])
  
  // Handle countdown completion - transport to flip suite tab
  const handleCountdownComplete = () => {
    console.log('⚔️ Countdown complete! Switching to Flip Suite...')
    setShowCountdown(false)
    
    // Transport directly to flip suite tab instead of old game page
    showInfo('Entering Battle Arena!')
    
    // Switch to flip suite tab
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('switchToFlipSuite', {
        detail: { gameId, gameData }
      }))
    }, 500)
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
            
            {/* Payment Section - Disabled when using tabbed interface, handled within tabs */}
            
            {/* Tabbed Game Interface */}
            <div style={{ width: '100%', maxWidth: '1400px' }}>
              <TabbedGameInterface
                gameData={gameData}
                gameId={gameId}
                socket={webSocketService}
                connected={wsConnected}
                offers={offers}
                isCreator={isCreator}
                coinConfig={{
                  headsImage: getGameNFTImage(),
                  tailsImage: getGameNFTImage(),
                  material: 'gold'
                }}
                onOfferAccepted={(offer) => {
                  console.log('🎯 Offer accepted via tabbed interface:', offer)
                  
                  // Check if current user is the offerer (Player 2) who needs to deposit
                  if (offer.acceptedOffer?.offerer_address && address && 
                      offer.acceptedOffer.offerer_address.toLowerCase() === address.toLowerCase()) {
                    console.log('🎯 Current user is the offerer - deposit will be handled in Lounge tab')
                    
                    // Show info message and auto-switch to Lounge tab
                    showInfo('Your offer was accepted! Switching to Lounge tab to deposit your crypto.')
                    
                    // Auto-switch to Lounge tab
                    setTimeout(() => {
                      window.dispatchEvent(new CustomEvent('switchToLoungeTab'))
                    }, 500)
                  } else {
                    console.log('🎯 Current user is not the offerer - just refreshing data')
                  }
                  
                  // Single refresh with a short delay to ensure server has processed
                  setTimeout(() => {
                    console.log('🔄 Refreshing game data after offer acceptance')
                    loadGameData()
                  }, 1000)
                }}
              />
              
              {/* Removed external OfferAcceptanceOverlay - now handled within the Lounge tab */}
            </div>
          </GameLayout>
        </GameContainer>
      </Container>
    </ThemeProvider>
  )
}

export default GameLobby
