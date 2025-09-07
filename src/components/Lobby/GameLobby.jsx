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
import socketService from '../../services/SocketService'

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
  // Component loaded
  
  const { gameId } = useParams()
  const navigate = useNavigate()
  const { address, isMobile, chain } = useWallet()
  const { showSuccess, showError, showInfo } = useToast()
  
  // REMOVED: Transition state variables - not needed anymore
  
  // Offer acceptance is now handled within the Lounge tab
  
  // Transport state to prevent multiple triggers
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
    setGameData,
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
      console.log('🔌 GameLobby: Connecting to Socket.io...', { gameId, address })
      
      if (!gameId || !address) return
      
      try {
        await socketService.connect(gameId, address)
        console.log('✅ GameLobby: Socket.io connected')
        setWsConnected(true)
        
        // Register game state handlers
        socketService.on('deposit_stage_started', handleDepositStageStarted)
        socketService.on('deposit_countdown', handleDepositCountdown)
        socketService.on('deposit_confirmed', handleDepositConfirmed)
        socketService.on('deposit_timeout', handleDepositTimeout)
        socketService.on('game_started', handleGameStarted)
        socketService.on('transport_to_flip_suite', handleTransportToFlipSuite)
        
        console.log('✅ GameLobby: Event handlers registered')
      } catch (error) {
        console.error('❌ GameLobby: Socket.io connection failed:', error)
        setWsConnected(false)
      }
    }
    
    initLobby()
    
    return () => {
      console.log('🔌 GameLobby: Cleaning up Socket.io handlers')
      socketService.off('deposit_stage_started')
      socketService.off('deposit_countdown')
      socketService.off('deposit_confirmed')
      socketService.off('deposit_timeout')
      socketService.off('game_started')
      socketService.off('transport_to_flip_suite')
    }
  }, [gameId, address])

  // Game state message handlers only

  // Handle deposit stage started
  const handleDepositStageStarted = (data) => {
    console.log('🎯 Deposit stage started:', data)
    
    if (data.gameId === gameData?.id) {
      console.log('✅ Deposit stage started for current game')
      
      // Update game data with deposit stage info
      setGameData(prevData => ({
        ...prevData,
        status: 'awaiting_deposits',
        deposit_deadline: new Date(Date.now() + (data.timeRemaining * 1000)).toISOString(),
        phase: 'deposit_stage'
      }))
      
      showInfo('Deposit stage started! Both players have 2 minutes to deposit.')
    }
  }

  // Handle deposit countdown updates
  const handleDepositCountdown = (data) => {
    console.log('⏰ Deposit countdown update:', data)
    
    if (data.gameId === gameData?.id) {
      // Update the deposit deadline based on remaining time
      const newDeadline = new Date(Date.now() + (data.timeRemaining * 1000)).toISOString()
      
      setGameData(prevData => ({
        ...prevData,
        deposit_deadline: newDeadline,
        creatorDeposited: data.creatorDeposited,
        challengerDeposited: data.challengerDeposited
      }))
    }
  }

  // Handle deposit timeout
  const handleDepositTimeout = (data) => {
    console.log('⏰ Deposit timeout:', data)
    
    if (data.gameId === gameData?.id) {
      console.log('❌ Deposit time expired for current game')
      showError('Deposit time expired! Game cancelled.')
      
      // Update game status
      setGameData(prevData => ({
        ...prevData,
        status: 'cancelled',
        phase: 'cancelled'
      }))
    }
  }

  const handleDepositConfirmed = (data) => {
    console.log('Deposit confirmed:', data)
    showSuccess('Deposit confirmed! Game starting...')
    // WebSocket will handle state updates - no manual refresh needed
  }

  const handleGameStarted = (data) => {
    console.log('Game started:', data)
    showSuccess('Game started! Both players deposited.')
    
    // Update gameData with the new status and phase
    setGameData(prevData => ({
      ...prevData,
      status: data.status || 'active',
      phase: data.phase || 'game_active',
      currentRound: data.currentRound || 1,
      currentTurn: data.currentTurn,
      creatorDeposited: data.creatorDeposited,
      challengerDeposited: data.challengerDeposited,
      bothDeposited: data.bothDeposited
    }))
    
    // Transport both players to the flip suite
    console.log('🚀 Both players deposited - transporting to flip suite...')
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('switchToFlipSuite', {
        detail: { gameId: data.gameId, immediate: true }
      }))
    }, 1000)
  }

  const handleTransportToFlipSuite = (data) => {
    console.log('🚀 Transport to flip suite event received:', data)
    
    // Check both gameId formats (with and without game_ prefix)
    const currentGameId = gameId?.replace('game_', '') || gameId
    const eventGameId = data.gameId?.replace('game_', '') || data.gameId
    const eventGameIdFull = data.gameIdFull?.replace('game_', '') || data.gameIdFull
    
    if (eventGameId === currentGameId || eventGameIdFull === currentGameId) {
      console.log('🚀 Transporting to flip suite...', { currentGameId, eventGameId, eventGameIdFull })
      window.dispatchEvent(new CustomEvent('switchToFlipSuite', {
        detail: { 
          gameId: data.gameId || data.gameIdFull, 
          immediate: data.immediate || true, 
          reason: data.reason,
          message: data.message
        }
      }))
    } else {
      console.log('❌ GameId mismatch - not transporting:', { currentGameId, eventGameId, eventGameIdFull })
    }
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
      console.log('✅ Offer accepted for current game - WebSocket will handle state updates')
      showInfo('Offer accepted! Game status updated.')
      
      // No manual refresh needed - WebSocket will handle all state updates
      // The server will send game_status_changed events when needed
    }
  }

  // Handle game status changed event
  const handleGameStatusChanged = (data) => {
    console.log('🔄 Game status changed event received:', data)
    
    if (data.gameId === gameData?.id) {
      console.log(`🔄 Game status changed from ${data.data.previousStatus} to ${data.data.newStatus}`)
      
      // Update game data directly from WebSocket event instead of refreshing
      setGameData(prevData => ({
        ...prevData,
        status: data.data.newStatus,
        deposit_deadline: data.data.deposit_deadline || prevData.deposit_deadline
      }))
      
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
      console.log('✅ Your offer was accepted - OffersContainer will handle the deposit screen')
      showSuccess('Your offer was accepted! Please deposit crypto within 2 minutes.')
    }
  }

  // REMOVED: handleDepositTransition function - not needed anymore

  const sendOfferMessage = (message) => {
    socketService.emit('chat_message', {
      message,
      from: address
    })
  }

  const sendChatMessage = (message) => {
    socketService.emit('chat_message', {
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
  }, [gameData?.coin_data]) // Only depend on coin_data, not entire gameData

  // REMOVED: Transition logic that was hiding offers box
  // Offers box should always be visible until countdown starts

  // Listen for lobby refresh events from WebSocket
  useEffect(() => {
    const handleLobbyRefresh = (event) => {
      console.log('🔄 Lobby refresh triggered:', event.detail)
      // WebSocket will handle state updates - no manual refresh needed
    }

    window.addEventListener('lobbyRefresh', handleLobbyRefresh)
    return () => window.removeEventListener('lobbyRefresh', handleLobbyRefresh)
  }, []) // Remove loadGameData dependency

  // Watch for game starting (both players deposited) - transport directly to flip suite
  useEffect(() => {
    // Only run this effect when game data actually changes
    if (!gameData) return
    
    // Game start check running
    console.log('🔍 gameData exists:', !!gameData)
    
    // Debug logging to see what's happening
    console.log('🔍 Game Start Debug:', {
      status: gameData?.status,
      creator_deposited: gameData?.creator_deposited,
      challenger_deposited: gameData?.challenger_deposited,
      countdownTriggered: countdownTriggered,
      isCreator: isCreator(),
      isJoiner: isJoiner(),
      address: address
    })
    
    // Check if both players have deposited - transport directly to flip suite
    const checkGameStart = () => {
      if (gameData?.status === 'active' && 
          gameData?.creator_deposited && 
          gameData?.challenger_deposited &&
          !countdownTriggered) {
        
        // Only transport for the two players
        const isPlayer = isCreator() || isJoiner() || 
                        (gameData?.challenger && address && 
                         gameData.challenger.toLowerCase() === address.toLowerCase())
        
        console.log('🎯 Game ready conditions met:', {
          isPlayer: isPlayer,
          gameStatus: gameData?.status,
          creatorDeposited: gameData?.creator_deposited,
          challengerDeposited: gameData?.challenger_deposited
        })
        
        if (isPlayer) {
          console.log('🚀 Game ready! Transporting directly to flip suite...')
          setCountdownTriggered(true) // Prevent multiple triggers
          
          // Transport directly to flip suite without countdown
          showSuccess('Both players deposited! Entering Battle Arena...')
          
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('switchToFlipSuite', {
              detail: { gameId, gameData, immediate: true }
            }))
          }, 1500) // Small delay to show the success message
        }
      }
    }
    
    // Small delay to prevent rapid triggers from refreshes
    const timeoutId = setTimeout(checkGameStart, 200)
    
    return () => clearTimeout(timeoutId)
  }, [gameData?.status, gameData?.creator_deposited, gameData?.challenger_deposited, countdownTriggered, address]) // Only depend on specific fields, not functions
  
  // Countdown is no longer used - players transport directly to flip suite



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
  
  // Countdown removed - players transport directly to flip suite

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
                socket={socketService}
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
                  
                  // No refresh needed - WebSocket events will handle state updates
                  console.log('🔄 WebSocket will handle game state updates after offer acceptance')
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
