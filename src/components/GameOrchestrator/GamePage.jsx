import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ThemeProvider } from '@emotion/react'
import styled from '@emotion/styled'

// Context imports
import { useWallet } from '../../contexts/WalletContext'
import { useToast } from '../../contexts/ToastContext'

// Component imports  
import GameBackground from './GameBackground'
import GameCoin from './GameCoin'
import GameCountdown from './GameCountdown'
import GameLobby from '../Lobby/GameLobby'
import GameRoom from '../GameRoom/GameRoom'

// Simple orchestrator state - no complex game logic needed here

// Styles
import { theme } from '../../styles/theme'
import { LoadingSpinner } from '../../styles/components'

const Container = styled.div`
  min-height: 100vh;
  position: relative;
  z-index: 1;
`

const GameContainer = styled.div`
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
  gap: 2rem;
  align-items: center;
`

const ThreeContainerLayout = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: auto auto;
  gap: 2rem;
  width: 100%;
  max-width: 1400px;
  
  @media (max-width: 1200px) {
    grid-template-columns: 1fr;
    grid-template-rows: auto auto auto;
    gap: 1.5rem;
  }
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
`

const ChatBelowPlayer2 = styled.div`
  grid-column: 2;
  grid-row: 2;
  
  @media (max-width: 1200px) {
    grid-column: 1;
    grid-row: 3;
  }
`







const GamePage = () => {
  console.log('🚀 GAMEPAGE ORCHESTRATOR LOADED - NEW ARCHITECTURE!')
  
  const { gameId } = useParams()
  const navigate = useNavigate()
  const { address, isMobile } = useWallet()
  const { showInfo } = useToast()
  
  // Simplified unified state management
  const [gameSession, setGameSession] = useState({
    phase: 'lobby', // 'lobby' | 'countdown' | 'game_room'
    players: {
      creator: null,
      joiner: null,
    },
    locked: false,
    deposited: false
  })
  const [gameData, setGameData] = useState(null)
  const [customHeadsImage, setCustomHeadsImage] = useState('/coins/plainh.png')
  const [customTailsImage, setCustomTailsImage] = useState('/coins/plaint.png')
  const [gameCoin, setGameCoin] = useState({
    id: 'plain',
    type: 'default',
    name: 'Classic',
    headsImage: '/coins/plainh.png',
    tailsImage: '/coins/plaint.png'
  })

  // Listen for game room entry event from lobby
  useEffect(() => {
    const handleEnterGameRoom = (event) => {
      console.log('🎯 Received enterGameRoom event:', event.detail)
      const { gameData: eventGameData } = event.detail
      setGameData(eventGameData)
      
      // Cleaner state transition
      setGameSession(prev => ({
        ...prev,
        phase: 'countdown',
        players: {
          creator: eventGameData?.creator,
          joiner: eventGameData?.joiner || eventGameData?.challenger
        },
        locked: true
      }))
    }

    window.addEventListener('enterGameRoom', handleEnterGameRoom)
    return () => window.removeEventListener('enterGameRoom', handleEnterGameRoom)
  }, [])

  // Update coin images when game data changes
  useEffect(() => {
    if (!gameData) return

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

  // Handle countdown completion
  const handleCountdownComplete = () => {
    console.log('⚔️ Countdown complete! Entering game room...')
    setGameSession(prev => ({
      ...prev,
      phase: 'game_room',
      deposited: true
    }))
    showInfo('Game started! Choose heads or tails!')
  }

  // Handle exiting game room
  const handleExitGameRoom = () => {
    console.log('🏠 Exiting game room back to lobby')
    setGameSession(prev => ({
      ...prev,
      phase: 'lobby',
      locked: false,
      deposited: false
    }))
  }

  // Create a persistent coin config
  const coinConfig = React.useMemo(() => ({
    headsImage: customHeadsImage || gameData?.coinData?.headsImage || '/coins/plainh.png',
    tailsImage: customTailsImage || gameData?.coinData?.tailsImage || '/coins/plaint.png',
    material: gameData?.coinData?.material || 'gold'
  }), [customHeadsImage, customTailsImage, gameData])

  // Orchestrator rendering based on phase
  const renderCurrentPhase = () => {
    switch (gameSession.phase) {
      case 'countdown':
        return (
          <>
            <Container>
              <GameBackground />
            </Container>
            <GameCountdown
              isVisible={true}
              onComplete={handleCountdownComplete}
              creatorAddress={gameData?.creator}
              challengerAddress={gameData?.challenger || gameData?.joiner}
              currentUserAddress={address}
            />
          </>
        )
      
      case 'game_room':
        return (
          <GameRoom
            gameId={gameId}
            gameData={gameData}
            onExitRoom={handleExitGameRoom}
            coinConfig={coinConfig}
          >
            {/* Pass the coin as a child */}
            <GameCoin
              gameId={gameId}
              gameState={{ phase: 'waiting' }}
              gameData={gameData}
              flipAnimation={null}
              customHeadsImage={coinConfig.headsImage}
              customTailsImage={coinConfig.tailsImage}
              gameCoin={gameCoin}
              isMobile={isMobile}
              onPowerChargeStart={() => {}}
              onPowerChargeStop={() => {}}
              isMyTurn={() => true}
              address={address}
              isCreator={() => address === gameData?.creator}
            />
          </GameRoom>
        )
      
      case 'lobby':
      default:
        return <GameLobby coinConfig={coinConfig} />
    }
  }

  return (
    <ThemeProvider theme={theme}>
      {renderCurrentPhase()}
    </ThemeProvider>
  )
}

export default GamePage 