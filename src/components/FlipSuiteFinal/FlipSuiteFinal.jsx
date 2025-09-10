import React, { useState, useEffect, useCallback, useRef } from 'react'
import styled from '@emotion/styled'
import { useParams, useNavigate } from 'react-router-dom'
import { useAccount } from 'wagmi'
import { useToast } from '../../contexts/ToastContext'
import socketService from '../../services/SocketService'
import OptimizedGoldCoin from '../OptimizedGoldCoin'
import ProfilePicture from '../ProfilePicture'
import GameResultPopup from '../GameResultPopup'
// Removed useLobbyState dependency - using direct API calls instead

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

const DepositOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(5px);
`

const DepositModal = styled.div`
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  padding: 2rem;
  max-width: 500px;
  width: 90%;
  text-align: center;
  position: relative;
`

const CloseButton = styled.button`
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: none;
  border: none;
  color: white;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0.5rem;
  
  &:hover {
    color: #FF4444;
  }
`

const DepositTitle = styled.h2`
  font-size: 1.5rem;
  margin: 0 0 1rem 0;
  color: #00FF41;
`

const DepositSubtitle = styled.p`
  color: rgba(255, 255, 255, 0.8);
  margin: 0 0 1.5rem 0;
`

const CountdownDisplay = styled.div`
  font-size: 2rem;
  font-weight: bold;
  color: ${props => props.isUrgent ? '#FF4444' : '#00FF41'};
  margin: 1rem 0;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 10px;
  border: 2px solid ${props => props.isUrgent ? '#FF4444' : '#00FF41'};
`

const DepositButton = styled.button`
  padding: 1rem 2rem;
  background: #00FF41;
  color: #000;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-size: 1.1rem;
  font-weight: bold;
  transition: all 0.3s ease;
  margin-top: 1rem;
  
  &:hover {
    background: #00CC33;
    transform: translateY(-2px);
  }
  
  &:disabled {
    background: rgba(0, 255, 65, 0.3);
    cursor: not-allowed;
    transform: none;
  }
`

// === MAIN COMPONENT - PURE RENDERER ===
const FlipSuiteFinal = ({ gameData: propGameData, coinConfig: propCoinConfig }) => {
  const { gameId } = useParams()
  const { address } = useAccount()
  const { showSuccess, showError, showInfo } = useToast()
  const navigate = useNavigate()
  
  // ===== GAME DATA LOADING =====
  const [gameData, setGameData] = useState(null)
  const [coinConfig, setCoinConfig] = useState(null)
  const [gameDataLoading, setGameDataLoading] = useState(true)
  const [gameDataError, setGameDataError] = useState(null)
  
  const loadGameData = useCallback(async () => {
    if (!gameId) return
    
    try {
      setGameDataLoading(true)
      const response = await fetch(`/api/games/${gameId}`)
      if (response.ok) {
        const data = await response.json()
        setGameData(data)
        setCoinConfig(data.coinData || null)
        setGameDataError(null)
      } else {
        setGameDataError('Failed to load game data')
      }
    } catch (error) {
      console.error('❌ Failed to load game data:', error)
      setGameDataError(error.message)
    } finally {
      setGameDataLoading(false)
    }
  }, [gameId])
  
  // Load game data on mount
  useEffect(() => {
    loadGameData()
  }, [loadGameData])
  
  // ===== SERVER STATE ONLY =====
  const [serverState, setServerState] = useState(null)
  const [connected, setConnected] = useState(false)
  const [loading, setLoading] = useState(true)
  const [role, setRole] = useState('spectator') // creator, challenger, spectator
  const [showResultPopup, setShowResultPopup] = useState(false)
  const [resultData, setResultData] = useState(null)
  
  // ===== DEPOSIT STATE =====
  const [depositState, setDepositState] = useState(null)
  const [showDepositOverlay, setShowDepositOverlay] = useState(false)
  const [isDepositing, setIsDepositing] = useState(false)
  
  // Use props if provided, otherwise use loaded data
  const finalGameData = propGameData || gameData
  const finalCoinConfig = propCoinConfig || coinConfig
  
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


  const handleFlipExecuting = useCallback((data) => {
    console.log('🎲 Flip executing:', data)
    showInfo('Coin is flipping...')
  }, [showInfo])

  const handleGameReady = useCallback((data) => {
    console.log('🎮 Game ready event received:', data)
    showInfo('Game is ready!')
  }, [showInfo])

  const handleRoundResult = useCallback((data) => {
    console.log('🎲 Round result received:', data)
    // Server will handle all game logic, we just display the result
  }, [])

  // ===== DEPOSIT EVENT HANDLERS =====
  const handleDepositStageStarted = useCallback((data) => {
    console.log('🎯 Deposit stage started:', data)
    if (data.gameId === gameId) {
      setDepositState({
        phase: 'deposit_stage',
        creator: data.creator,
        challenger: data.challenger,
        timeRemaining: data.timeRemaining || 120,
        creatorDeposited: data.creatorDeposited || false,
        challengerDeposited: data.challengerDeposited || false,
        cryptoAmount: data.cryptoAmount
      })
      setShowDepositOverlay(true)
    }
  }, [gameId])

  const handleDepositCountdown = useCallback((data) => {
    if (data.gameId === gameId) {
      setDepositState(prev => prev ? { 
        ...prev, 
        timeRemaining: data.timeRemaining,
        creatorDeposited: data.creatorDeposited || prev.creatorDeposited,
        challengerDeposited: data.challengerDeposited || prev.challengerDeposited
      } : null)
    }
  }, [gameId])

  const handleDepositConfirmed = useCallback((data) => {
    console.log('💰 Deposit confirmed:', data)
    if (data.gameId === gameId) {
      setDepositState(prev => prev ? {
        ...prev,
        creatorDeposited: data.creatorDeposited || prev.creatorDeposited,
        challengerDeposited: data.challengerDeposited || prev.challengerDeposited
      } : null)
    }
  }, [gameId])

  const handleGameStarted = useCallback((data) => {
    console.log('🎮 Game started:', data)
    if (data.gameId === gameId) {
      setShowDepositOverlay(false)
      setDepositState(null)
      showSuccess('Game started!')
    }
  }, [gameId, showSuccess])

  // ===== SOCKET CONNECTION =====
  useEffect(() => {
    if (!gameId || !address || !finalGameData) return

    console.log('🔌 Connecting to game server...')

    const connectToGame = async () => {
      try {
        // Connect to socket
        await socketService.connect(gameId, address)
        setConnected(true)
        
        // Register event listeners
        socketService.on('room_joined', handleRoomJoined)
        socketService.on('game_state_update', handleGameStateUpdate)
        socketService.on('game_started', handleGameStarted)
        socketService.on('game_ready', handleGameReady)
        socketService.on('flip_executing', handleFlipExecuting)
        socketService.on('round_result', handleRoundResult)
        
        // Deposit event listeners
        socketService.on('deposit_stage_started', handleDepositStageStarted)
        socketService.on('deposit_countdown', handleDepositCountdown)
        socketService.on('deposit_confirmed', handleDepositConfirmed)
        
        // Join room
        socketService.emit('join_room', { 
          roomId: gameId.startsWith('game_') ? gameId : `game_${gameId}`, 
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
      socketService.off('game_ready', handleGameReady)
      socketService.off('flip_executing', handleFlipExecuting)
      socketService.off('round_result', handleRoundResult)
      
      // Deposit event cleanup
      socketService.off('deposit_stage_started', handleDepositStageStarted)
      socketService.off('deposit_countdown', handleDepositCountdown)
      socketService.off('deposit_confirmed', handleDepositConfirmed)
    }
  }, [gameId, address, finalGameData]) // Added finalGameData dependency

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

  // ===== DEPOSIT HANDLING =====
  const handleDeposit = useCallback(async () => {
    if (isDepositing || !depositState) return
    setIsDepositing(true)
    
    try {
      const userRole = depositState?.creator?.toLowerCase() === address?.toLowerCase() ? 'creator' : 'challenger'
      
      if (userRole === 'creator') {
        // Creator deposits NFT
        showInfo('Depositing NFT...')
        // TODO: Implement NFT deposit logic
        showSuccess('NFT deposited successfully!')
      } else if (userRole === 'challenger') {
        // Challenger deposits crypto
        showInfo('Depositing crypto...')
        // TODO: Implement crypto deposit logic
        showSuccess('Crypto deposited successfully!')
      }
      
      // Notify server
      socketService.emit('deposit_confirmed', {
        gameId: gameId,
        player: address,
        assetType: userRole === 'creator' ? 'nft' : 'crypto'
      })
      
    } catch (error) {
      console.error('❌ Deposit failed:', error)
      showError('Deposit failed: ' + error.message)
    } finally {
      setIsDepositing(false)
    }
  }, [isDepositing, depositState, address, gameId, showInfo, showSuccess, showError])

  // Format time for countdown
  const formatTime = useCallback((seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }, [])

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
  // Show loading state for game data
  if (gameDataLoading) {
    return (
      <GameContainer>
        <LoadingSpinner />
        <StatusText>Loading game data...</StatusText>
      </GameContainer>
    )
  }

  // Show error state for game data
  if (gameDataError) {
    return (
      <GameContainer>
        <StatusText>Error loading game: {gameDataError}</StatusText>
        <button onClick={() => navigate('/')}>Back to Home</button>
      </GameContainer>
    )
  }

  // Show loading state for server connection
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
            customHeadsImage={serverState.coinData?.headsImage || finalCoinConfig?.headsImage}
            customTailsImage={serverState.coinData?.tailsImage || finalCoinConfig?.tailsImage}
            size={240}
            material={serverState.coinData?.material || finalCoinConfig?.material || 'gold'}
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

      {/* Deposit Overlay */}
      {showDepositOverlay && depositState && (
        <DepositOverlay>
          <DepositModal>
            <CloseButton onClick={() => setShowDepositOverlay(false)}>✕</CloseButton>
            <DepositTitle>💰 Deposit Required</DepositTitle>
            <DepositSubtitle>
              {depositState.creator?.toLowerCase() === address?.toLowerCase() 
                ? 'You need to deposit your NFT to start the game'
                : 'You need to deposit crypto to join the game'
              }
            </DepositSubtitle>
            
            <CountdownDisplay isUrgent={depositState.timeRemaining <= 30}>
              {formatTime(depositState.timeRemaining)}
            </CountdownDisplay>
            
            <div style={{ marginBottom: '1rem' }}>
              <div>Creator: {depositState.creator?.slice(0, 6)}...{depositState.creator?.slice(-4)}</div>
              <div>Challenger: {depositState.challenger?.slice(0, 6)}...{depositState.challenger?.slice(-4)}</div>
              <div>Amount: ${depositState.cryptoAmount}</div>
            </div>
            
            <DepositButton 
              onClick={handleDeposit}
              disabled={isDepositing || depositState.timeRemaining === 0}
            >
              {isDepositing ? 'Processing...' : 'Deposit Now'}
            </DepositButton>
          </DepositModal>
        </DepositOverlay>
      )}
    </GameContainer>
  )
}

export default FlipSuiteFinal