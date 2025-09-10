import React, { useState, useEffect, useCallback, useRef } from 'react'
import styled from '@emotion/styled'
import { useParams, useNavigate } from 'react-router-dom'
import { useAccount } from 'wagmi'
import { useToast } from '../../contexts/ToastContext'
import socketService from '../../services/SocketService'
import OptimizedGoldCoin from '../OptimizedGoldCoin'
import ProfilePicture from '../ProfilePicture'
import GameResultPopup from '../GameResultPopup'

// ===== PURE CLIENT RENDERER =====
// This component ONLY renders server state
// No game logic, no local state management
// All actions go to server, all state comes from server

// === STYLED COMPONENTS (unchanged) ===
const GameContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem;
  color: white;
`

const GameHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  max-width: 1200px;
  margin-bottom: 2rem;
`

const GameTitle = styled.h1`
  font-size: 2rem;
  font-weight: bold;
  background: linear-gradient(45deg, #FFD700, #FFA500);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin: 0;
`

const ConnectionStatus = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: ${props => props.connected ? 'rgba(0, 255, 0, 0.2)' : 'rgba(255, 0, 0, 0.2)'};
  border: 1px solid ${props => props.connected ? '#00FF00' : '#FF0000'};
  border-radius: 0.5rem;
  font-size: 0.9rem;
`

const GameBoard = styled.div`
  display: grid;
  grid-template-columns: 300px 1fr 300px;
  gap: 2rem;
  width: 100%;
  max-width: 1200px;
  align-items: start;
`

const PlayerCard = styled.div`
  background: linear-gradient(135deg, 
    ${props => props.isCreator ? 'rgba(255, 215, 0, 0.1)' : 'rgba(0, 123, 255, 0.1)'} 0%, 
    ${props => props.isCreator ? 'rgba(255, 165, 0, 0.2)' : 'rgba(0, 86, 179, 0.2)'} 100%);
  border: 2px solid ${props => props.isCreator ? '#FFD700' : '#007BFF'};
  border-radius: 1rem;
  padding: 1.5rem;
  text-align: center;
  position: relative;
  
  ${props => props.isActive && `
    box-shadow: 0 0 20px ${props.isCreator ? 'rgba(255, 215, 0, 0.5)' : 'rgba(0, 123, 255, 0.5)'};
    transform: scale(1.05);
  `}
  
  transition: all 0.3s ease;
`

const PlayerHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
`

const PlayerLabel = styled.div`
  font-size: 1.2rem;
  font-weight: bold;
  color: ${props => props.isCreator ? '#FFD700' : '#007BFF'};
`

const PlayerStats = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
`

const StatRow = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 0.9rem;
`

const StatLabel = styled.span`
  color: #aaa;
`

const StatValue = styled.span`
  font-weight: bold;
  color: ${props => props.isCreator ? '#FFD700' : '#007BFF'};
`

const CoinArea = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 1rem;
  padding: 2rem;
  border: 2px solid rgba(255, 255, 255, 0.1);
`

const GameStatus = styled.div`
  text-align: center;
  margin-bottom: 2rem;
`

const StatusText = styled.h2`
  margin: 0;
  font-size: 1.5rem;
  color: #00ff88;
`

const ChoiceButtons = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
`

const ChoiceButton = styled.button`
  padding: 1rem 2rem;
  font-size: 1.1rem;
  font-weight: bold;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
  
  background: ${props => props.choice === 'heads' 
    ? 'linear-gradient(135deg, #ffd700, #ffed4e)' 
    : 'linear-gradient(135deg, #c0392b, #e74c3c)'};
  color: ${props => props.choice === 'heads' ? '#000' : '#fff'};
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 15px rgba(0, 255, 136, 0.3);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`

const PowerBar = styled.div`
  width: 200px;
  height: 20px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  overflow: hidden;
  margin: 1rem 0;
`

const PowerFill = styled.div`
  height: 100%;
  background: linear-gradient(90deg, #00ff88, #00cc6a);
  width: ${props => props.power}%;
  transition: width 0.1s ease;
`

const LoadingSpinner = styled.div`
  border: 4px solid #f3f3f3;
  border-top: 4px solid #00ff88;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin: 2rem auto;
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`

const SpectatorCount = styled.div`
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: rgba(0, 0, 0, 0.5);
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  font-size: 0.9rem;
  color: #00ff88;
`

// === MAIN COMPONENT - PURE RENDERER ===
const FlipSuiteFinal = ({ gameData, coinConfig }) => {
  const { gameId } = useParams()
  const { address } = useAccount()
  const { showSuccess, showError, showInfo } = useToast()
  const navigate = useNavigate()
  
  // ===== SERVER STATE ONLY =====
  const [serverState, setServerState] = useState(null)
  const [connected, setConnected] = useState(false)
  const [loading, setLoading] = useState(true)
  const [role, setRole] = useState('spectator') // creator, challenger, spectator
  const [showResultPopup, setShowResultPopup] = useState(false)
  const [resultData, setResultData] = useState(null)
  
  // No local game state - everything comes from server

  // ===== HELPER FUNCTIONS =====
  const isCreator = useCallback(() => {
    return role === 'creator'
  }, [role])

  const isChallenger = useCallback(() => {
    return role === 'challenger'
  }, [role])

  const isMyTurn = useCallback(() => {
    return serverState && address && 
           serverState.currentTurn?.toLowerCase() === address.toLowerCase()
  }, [serverState, address])

  const canMakeChoice = useCallback(() => {
    if (!serverState || !isMyTurn()) return false
    
    const myChoice = isCreator() ? serverState.creatorChoice : serverState.challengerChoice
    return serverState.gamePhase === 'waiting_choice' && !myChoice
  }, [serverState, isMyTurn, isCreator])

  const canChargePower = useCallback(() => {
    if (!serverState || !isMyTurn()) return false
    
    const myChoice = isCreator() ? serverState.creatorChoice : serverState.challengerChoice
    const isCharging = isCreator() ? serverState.creatorCharging : serverState.challengerCharging
    
    return serverState.gamePhase === 'charging_power' && myChoice && !isCharging
  }, [serverState, isMyTurn, isCreator])

  // ===== SOCKET EVENT HANDLERS =====
  const handleGameStateUpdate = useCallback((data) => {
    console.log('📊 Game state update received:', data)
    setServerState(data)
    setLoading(false)
    
    // Check for round results
    if (data.gamePhase === 'showing_result' && data.roundWinner) {
      setResultData({
        isWinner: data.roundWinner === address,
        flipResult: data.flipResult,
        playerChoice: isCreator() ? data.creatorChoice : data.challengerChoice,
        roundWinner: data.roundWinner,
        round: data.currentRound
      })
      setShowResultPopup(true)
    }
    
    // Check for game completion
    if (data.phase === 'game_complete' && data.gameWinner) {
      setResultData({
        isWinner: data.gameWinner === address,
        isGameComplete: true,
        finalScore: `${data.creatorScore}-${data.challengerScore}`,
        gameWinner: data.gameWinner
      })
      setShowResultPopup(true)
    }
  }, [address, isCreator])

  const handleRoomJoined = useCallback((data) => {
    console.log('🏠 Room joined:', data)
    setRole(data.role)
  }, [])

  const handleGameStarted = useCallback((data) => {
    console.log('🎮 Game started:', data)
    showSuccess('Game started!')
  }, [showSuccess])

  const handleFlipExecuting = useCallback((data) => {
    console.log('🎲 Flip executing:', data)
    showInfo('Coin is flipping...')
  }, [showInfo])

  // ===== SOCKET CONNECTION =====
  useEffect(() => {
    if (!gameId || !address) return

    console.log('🔌 Connecting to game server...')

    const connectToGame = async () => {
      try {
        // Connect to socket
        await socketService.connect()
        setConnected(true)
        
        // Register event listeners
        socketService.on('room_joined', handleRoomJoined)
        socketService.on('game_state_update', handleGameStateUpdate)
        socketService.on('game_started', handleGameStarted)
        socketService.on('flip_executing', handleFlipExecuting)
        
        // Join room
        socketService.emit('join_room', { 
          roomId: `game_${gameId}`, 
          address 
        })
        
        // Request current game state
        setTimeout(() => {
          socketService.emit('request_game_state', { gameId })
        }, 100)
        
      } catch (error) {
        console.error('❌ Failed to connect to game server:', error)
        showError('Failed to connect to game server')
      }
    }

    connectToGame()

    return () => {
      // Cleanup listeners
      socketService.off('room_joined', handleRoomJoined)
      socketService.off('game_state_update', handleGameStateUpdate)
      socketService.off('game_started', handleGameStarted)
      socketService.off('flip_executing', handleFlipExecuting)
    }
  }, [gameId, address]) // Removed callback dependencies for simplicity

  // ===== USER ACTIONS - ALL GO TO SERVER =====
  const handleChoice = useCallback((choice) => {
    if (!canMakeChoice()) return
    
    console.log('🎯 Sending choice to server:', choice)
    socketService.emit('player_choice', {
      gameId,
      address,
      choice
    })
    
    showInfo(`You chose ${choice}!`)
  }, [canMakeChoice, gameId, address, showInfo])

  const handlePowerChargeStart = useCallback(() => {
    if (!canChargePower()) return
    
    console.log('⚡ Starting power charge')
    socketService.emit('start_power_charge', {
      gameId,
      address
    })
  }, [canChargePower, gameId, address])

  const handlePowerChargeStop = useCallback(() => {
    if (!serverState) return
    
    const isCharging = isCreator() ? serverState.creatorCharging : serverState.challengerCharging
    if (!isCharging) return
    
    console.log('⚡ Stopping power charge')
    socketService.emit('stop_power_charge', {
      gameId,
      address
    })
  }, [serverState, isCreator, gameId, address])

  // ===== RENDER HELPERS =====
  const getStatusText = () => {
    if (loading) return 'Loading game...'
    if (!connected) return 'Connecting...'
    if (!serverState) return 'Waiting for game state...'
    
    const { gamePhase, currentTurn } = serverState
    const isYourTurn = isMyTurn()
    
    switch (gamePhase) {
      case 'waiting_choice':
        if (isYourTurn) return 'Choose heads or tails!'
        return `Waiting for ${currentTurn === serverState.creator ? 'creator' : 'challenger'} to choose...`
      
      case 'charging_power':
        if (isYourTurn) return 'Hold the coin to charge power!'
        return `${currentTurn === serverState.creator ? 'Creator' : 'Challenger'} is charging power...`
      
      case 'executing_flip':
        return 'Coin is flipping...'
      
      case 'showing_result':
        return `Round ${serverState.currentRound} complete!`
      
      case 'round_transition':
        return 'Starting next round...'
      
      default:
        return 'Game active'
    }
  }

  const getPlayerName = (playerAddress) => {
    if (!playerAddress) return 'Waiting...'
    return `${playerAddress.slice(0, 6)}...${playerAddress.slice(-4)}`
  }

  // ===== RENDER =====
  if (loading) {
    return (
      <GameContainer>
        <LoadingSpinner />
        <StatusText>Loading game...</StatusText>
      </GameContainer>
    )
  }

  if (!connected) {
    return (
      <GameContainer>
        <StatusText>Connecting to game server...</StatusText>
      </GameContainer>
    )
  }

  if (!serverState) {
    return (
      <GameContainer>
        <StatusText>Waiting for game state...</StatusText>
      </GameContainer>
    )
  }

  // Get power values for display
  const myPower = isCreator() ? serverState.creatorPowerProgress : serverState.challengerPowerProgress
  const myFinalPower = isCreator() ? serverState.creatorFinalPower : serverState.challengerFinalPower
  const myCharging = isCreator() ? serverState.creatorCharging : serverState.challengerCharging

  return (
    <GameContainer>
      {/* Game Header */}
      <GameHeader>
        <GameTitle>🎮 NFT Flip Battle</GameTitle>
        <ConnectionStatus connected={connected}>
          {connected ? '🟢 Connected' : '🔴 Disconnected'}
        </ConnectionStatus>
      </GameHeader>

      {/* Spectator Count */}
      {serverState.spectators && serverState.spectators.length > 0 && (
        <SpectatorCount>
          👁️ {serverState.spectators.length} watching
        </SpectatorCount>
      )}

      {/* Game Board */}
      <GameBoard>
        {/* Creator Card */}
        <PlayerCard 
          isCreator={true} 
          isActive={serverState.currentTurn === serverState.creator}
        >
          <PlayerHeader>
            <ProfilePicture address={serverState.creator} size={40} />
            <PlayerLabel isCreator={true}>👑 Creator</PlayerLabel>
          </PlayerHeader>
          <PlayerStats>
            <StatRow>
              <StatLabel>Name:</StatLabel>
              <StatValue isCreator={true}>{getPlayerName(serverState.creator)}</StatValue>
            </StatRow>
            <StatRow>
              <StatLabel>Score:</StatLabel>
              <StatValue isCreator={true}>{serverState.creatorScore}</StatValue>
            </StatRow>
            <StatRow>
              <StatLabel>Choice:</StatLabel>
              <StatValue isCreator={true}>
                {serverState.creatorChoice || 'Waiting...'}
              </StatValue>
            </StatRow>
            <StatRow>
              <StatLabel>Power:</StatLabel>
              <StatValue isCreator={true}>
                {Math.round(serverState.creatorFinalPower)}
              </StatValue>
            </StatRow>
          </PlayerStats>
          {serverState.creatorCharging && (
            <PowerBar>
              <PowerFill power={serverState.creatorPowerProgress} />
            </PowerBar>
          )}
        </PlayerCard>

        {/* Coin Area */}
        <CoinArea>
          <GameStatus>
            <StatusText>{getStatusText()}</StatusText>
            {serverState && (
              <div style={{ fontSize: '1.2rem', marginTop: '1rem' }}>
                Round {serverState.currentRound}/{serverState.totalRounds}
              </div>
            )}
          </GameStatus>

          <OptimizedGoldCoin
            isFlipping={serverState.coinState?.isFlipping}
            flipResult={serverState.coinState?.flipResult}
            flipDuration={serverState.coinState?.flipDuration || 3000}
            onFlipComplete={() => console.log('Flip animation complete')}
            onPowerCharge={handlePowerChargeStart}
            onPowerRelease={handlePowerChargeStop}
            isPlayerTurn={isMyTurn() && serverState.gamePhase === 'charging_power'}
            isCharging={myCharging}
            creatorPower={serverState.creatorFinalPower}
            joinerPower={serverState.challengerFinalPower}
            customHeadsImage={serverState.coinData?.headsImage || coinConfig?.headsImage}
            customTailsImage={serverState.coinData?.tailsImage || coinConfig?.tailsImage}
            size={240}
            material={serverState.coinData?.material || coinConfig?.material || 'gold'}
          />

          {/* Power Display */}
          {isMyTurn() && myCharging && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ marginBottom: '0.5rem', fontSize: '1.1rem', fontWeight: 'bold' }}>
                ⚡ Hold to Charge Power ⚡
              </div>
              <div style={{ marginBottom: '0.5rem', fontSize: '1.5rem', color: '#00ff88' }}>
                {Math.round(myFinalPower)} / 10
              </div>
              <PowerBar>
                <PowerFill power={myPower} />
              </PowerBar>
              <div style={{ fontSize: '0.9rem', color: '#aaa', marginTop: '0.5rem' }}>
                Release to lock in power!
              </div>
            </div>
          )}

          {/* Choice Buttons */}
          {canMakeChoice() && (
            <ChoiceButtons>
              <ChoiceButton 
                choice="heads" 
                onClick={() => handleChoice('heads')}
              >
                👑 Heads
              </ChoiceButton>
              <ChoiceButton 
                choice="tails" 
                onClick={() => handleChoice('tails')}
              >
                💎 Tails
              </ChoiceButton>
            </ChoiceButtons>
          )}
        </CoinArea>

        {/* Challenger Card */}
        <PlayerCard 
          isCreator={false} 
          isActive={serverState.currentTurn === serverState.challenger}
        >
          <PlayerHeader>
            <ProfilePicture address={serverState.challenger} size={40} />
            <PlayerLabel isCreator={false}>⚔️ Challenger</PlayerLabel>
          </PlayerHeader>
          <PlayerStats>
            <StatRow>
              <StatLabel>Name:</StatLabel>
              <StatValue isCreator={false}>
                {getPlayerName(serverState.challenger)}
              </StatValue>
            </StatRow>
            <StatRow>
              <StatLabel>Score:</StatLabel>
              <StatValue isCreator={false}>{serverState.challengerScore}</StatValue>
            </StatRow>
            <StatRow>
              <StatLabel>Choice:</StatLabel>
              <StatValue isCreator={false}>
                {serverState.challengerChoice || 'Waiting...'}
              </StatValue>
            </StatRow>
            <StatRow>
              <StatLabel>Power:</StatLabel>
              <StatValue isCreator={false}>
                {Math.round(serverState.challengerFinalPower)}
              </StatValue>
            </StatRow>
          </PlayerStats>
          {serverState.challengerCharging && (
            <PowerBar>
              <PowerFill power={serverState.challengerPowerProgress} />
            </PowerBar>
          )}
        </PlayerCard>
      </GameBoard>

      {/* Result Popup */}
      {showResultPopup && resultData && (
        <GameResultPopup
          isOpen={showResultPopup}
          onClose={() => setShowResultPopup(false)}
          resultData={resultData}
        />
      )}
    </GameContainer>
  )
}

export default FlipSuiteFinal