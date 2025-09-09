import React, { useState, useEffect } from 'react'
import styled from '@emotion/styled'
import FlipSuiteFinal from '../../FlipSuiteFinal/FlipSuiteFinal'
import { useToast } from '../../../contexts/ToastContext'

const TabContainer = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`

const GameStatusHeader = styled.div`
  background: rgba(0, 0, 0, 0.8);
  padding: 1rem;
  border-bottom: 2px solid rgba(0, 191, 255, 0.3);
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
`

const StatusBadge = styled.div`
  background: ${props => {
    switch (props.status) {
      case 'active':
      case 'in_progress':
      case 'playing':
        return 'rgba(0, 255, 65, 0.2)'
      case 'waiting_challenger':
      case 'waiting_for_challenger':
        return 'rgba(255, 149, 0, 0.2)'
      case 'waiting_challenger_deposit':
        return 'rgba(255, 215, 0, 0.2)'
      case 'completed':
        return 'rgba(128, 128, 128, 0.2)'
      default:
        return 'rgba(255, 255, 255, 0.1)'
    }
  }};
  border: 1px solid ${props => {
    switch (props.status) {
      case 'active':
      case 'in_progress':
      case 'playing':
        return 'rgba(0, 255, 65, 0.4)'
      case 'waiting_challenger':
      case 'waiting_for_challenger':
        return 'rgba(255, 149, 0, 0.4)'
      case 'waiting_challenger_deposit':
        return 'rgba(255, 215, 0, 0.4)'
      case 'completed':
        return 'rgba(128, 128, 128, 0.4)'
      default:
        return 'rgba(255, 255, 255, 0.2)'
    }
  }};
  color: ${props => {
    switch (props.status) {
      case 'active':
      case 'in_progress':
      case 'playing':
        return '#00FF41'
      case 'waiting_challenger':
      case 'waiting_for_challenger':
        return '#FF9500'
      case 'waiting_challenger_deposit':
        return '#FFD700'
      case 'completed':
        return '#808080'
      default:
        return '#FFFFFF'
    }
  }};
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  font-weight: bold;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`

const GameInfo = styled.div`
  display: flex;
  gap: 2rem;
  align-items: center;
  flex-wrap: wrap;
`

const InfoItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`

const InfoLabel = styled.span`
  color: #888;
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 1px;
`

const InfoValue = styled.span`
  color: white;
  font-weight: bold;
  font-size: 1rem;
`

const GameContent = styled.div`
  flex: 1;
  overflow: auto;
  position: relative;
`

const WaitingState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  gap: 2rem;
  padding: 2rem;
`

const WaitingIcon = styled.div`
  font-size: 4rem;
  animation: pulse 2s ease-in-out infinite;
  
  @keyframes pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.6; transform: scale(1.1); }
  }
`

const WaitingTitle = styled.h2`
  color: #FFD700;
  font-size: 2rem;
  margin: 0;
  text-align: center;
`

const WaitingDescription = styled.p`
  color: #CCC;
  font-size: 1.1rem;
  text-align: center;
  max-width: 500px;
  line-height: 1.5;
`

const ActionButton = styled.button`
  padding: 1rem 2rem;
  background: linear-gradient(45deg, #00BFFF, #0080FF);
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background: linear-gradient(45deg, #0080FF, #0060FF);
    transform: translateY(-2px);
  }
`

const GameRoomTab = ({ 
  gameData, 
  gameId, 
  socket, 
  connected, 
  coinConfig, 
  address, 
  isCreator 
}) => {
  const [gameState, setGameState] = useState(null)
  const [isGameReady, setIsGameReady] = useState(false)
  const { showInfo } = useToast()
  
  // Check if game is ready to play
  useEffect(() => {
    if (!gameData) {
      setIsGameReady(false)
      return
    }
    
    // Check various status fields for game readiness
    const readyStatuses = ['active', 'in_progress', 'playing']
    const readyPhases = ['active', 'game_active', 'playing']
    
    const statusReady = readyStatuses.includes(gameData.status)
    const phaseReady = readyPhases.includes(gameData.phase)
    
    // Also check if both players have deposited
    const bothDeposited = gameData.creatorDeposited && gameData.challengerDeposited
    
    const gameReady = statusReady || phaseReady || bothDeposited
    
    setIsGameReady(gameReady)
    
    console.log('🎮 GameRoomTab: Game readiness check:', {
      status: gameData.status,
      phase: gameData.phase,
      bothDeposited,
      gameReady
    })
  }, [gameData])
  
  // Listen for socket events to update game state
  useEffect(() => {
    if (!socket) return
    
    const handleGameStateUpdate = (data) => {
      console.log('📊 Game state update received:', data)
      setGameState(data)
    }
    
    const handleGameReady = (data) => {
      console.log('🎮 Game ready event in GameRoomTab')
      setIsGameReady(true)
      showInfo('Game is starting!')
    }
    
    const handleGameStarted = (data) => {
      console.log('🎮 Game started event in GameRoomTab:', data)
      setIsGameReady(true)
      showInfo('🎮 Game is starting! Get ready to flip!')
      
      // Initialize game state from the event data
      setGameState({
        currentRound: data.currentRound || 1,
        totalRounds: 3,
        creatorScore: 0,
        challengerScore: 0,
        currentTurn: data.currentTurn || data.creator,
        flipSeed: null,
        phase: 'choosing', // Start in choosing phase
        roundPhase: 'player1_choice' // Player 1 goes first
      })
    }
    
    const handleRoundResult = (data) => {
      console.log('🎲 Round result:', data)
      setGameState(prev => ({
        ...prev,
        currentRound: data.currentRound,
        creatorScore: data.creatorScore,
        challengerScore: data.challengerScore,
        lastResult: data.result
      }))
    }
    
    socket.on('game_state_update', handleGameStateUpdate)
    socket.on('game_ready', handleGameReady)
    socket.on('game_started', handleGameStarted)
    socket.on('round_result', handleRoundResult)
    
    // Request current game state when mounting
    socket.emit('request_game_state', { gameId })
    
    return () => {
      socket.off('game_state_update', handleGameStateUpdate)
      socket.off('game_ready', handleGameReady)
      socket.off('game_started', handleGameStarted)
      socket.off('round_result', handleRoundResult)
    }
  }, [socket, gameId, showInfo])
  
  // Initialize game state from gameData if available
  useEffect(() => {
    if (isGameReady && gameData && !gameState) {
      setGameState({
        currentRound: gameData.currentRound || 1,
        totalRounds: gameData.totalRounds || 3,
        creatorScore: gameData.creatorScore || 0,
        challengerScore: gameData.challengerScore || 0,
        currentTurn: gameData.currentTurn || gameData.creator,
        flipSeed: gameData.flipSeed || null
      })
    }
  }, [isGameReady, gameData, gameState])
  
  const getGameStatus = () => {
    if (!gameData) return 'Loading...'
    
    switch (gameData.status) {
      case 'active':
      case 'in_progress':
      case 'playing':
        return 'Game Active'
      case 'waiting_challenger':
      case 'waiting_for_challenger':
        return 'Waiting for Player 2'
      case 'waiting_challenger_deposit':
        return 'Waiting for Deposit'
      case 'completed':
        return 'Game Complete'
      default:
        return gameData.status || 'Unknown'
    }
  }
  
  const getGamePrice = () => {
    if (!gameData) return 0
    return parseFloat(gameData.ethAmount || gameData.amount || 0)
  }
  
  const handleExitRoom = () => {
    console.log('🚪 Exiting game room')
    // Dispatch event to switch to lounge tab
    window.dispatchEvent(new CustomEvent('switchToLoungeTab'))
  }
  
  const renderWaitingState = () => {
    const status = gameData?.status
    
    if (status === 'waiting_challenger' || status === 'waiting_for_challenger') {
      return (
        <WaitingState>
          <WaitingIcon>⏳</WaitingIcon>
          <WaitingTitle>Waiting for Player 2</WaitingTitle>
          <WaitingDescription>
            The game room will activate once another player joins and deposits.
            Check the Flip Lounge tab to see incoming offers!
          </WaitingDescription>
          <ActionButton onClick={() => window.dispatchEvent(new CustomEvent('switchToLoungeTab'))}>
            Go to Flip Lounge
          </ActionButton>
        </WaitingState>
      )
    }
    
    if (status === 'waiting_challenger_deposit') {
      return (
        <WaitingState>
          <WaitingIcon>💰</WaitingIcon>
          <WaitingTitle>Waiting for Deposit</WaitingTitle>
          <WaitingDescription>
            Player 2 has joined! Waiting for their deposit to be confirmed.
            The game will start automatically once the deposit is received.
          </WaitingDescription>
        </WaitingState>
      )
    }
    
    if (status === 'completed') {
      return (
        <WaitingState>
          <WaitingIcon>🏆</WaitingIcon>
          <WaitingTitle>Game Complete</WaitingTitle>
          <WaitingDescription>
            This game has ended. Check the results in the game history.
          </WaitingDescription>
          <ActionButton onClick={() => window.location.href = '/'}>
            Return to Games
          </ActionButton>
        </WaitingState>
      )
    }
    
    return (
      <WaitingState>
        <WaitingIcon>🎮</WaitingIcon>
        <WaitingTitle>Preparing Game Room...</WaitingTitle>
        <WaitingDescription>
          The game room is loading. This should only take a moment.
        </WaitingDescription>
      </WaitingState>
    )
  }
  
  const renderActiveGame = () => {
    // Use new FlipSuiteFinal component - clean, working game room
    console.log('🆕 Using NEW FlipSuiteFinal component')
    return <FlipSuiteFinal />
  }
  
  const renderActiveGameLegacy = () => {
    // Legacy fallback - keep for now in case of issues
    return (
      <GameRoom
        gameId={gameId}
        gameData={gameData}
        gameState={gameState}
        socket={socket}
        connected={connected}
        onExitRoom={handleExitRoom}
        coinConfig={coinConfig}
        address={address}
        isCreator={isCreator}
      >
        <GameCoin
          gameId={gameId}
          gameState={gameState || { phase: 'waiting' }}
          gameData={gameData}
          flipAnimation={null}
          customHeadsImage={coinConfig?.headsImage}
          customTailsImage={coinConfig?.tailsImage}
          gameCoin={coinConfig}
          isMobile={window.innerWidth <= 768}
          onPowerChargeStart={() => {
            console.log('🔋 Power charge started!')
          }}
          onPowerChargeStop={() => {
            console.log('🔋 Power charge stopped!')
          }}
          isMyTurn={() => {
            // Player 1 (creator) goes first in round 1, 3, 5
            // Player 2 (joiner) goes first in round 2, 4
            const currentRound = gameState?.currentRound || 1
            const firstPlayer = currentRound % 2 === 1 ? gameData?.creator : gameData?.joiner
            return firstPlayer === address
          }}
          address={address}
          isCreator={() => isCreator}
          flipSeed={gameState?.flipSeed}
        />
      </GameRoom>
    )
  }
  
  return (
    <TabContainer>
      {/* Game Status Header */}
      <GameStatusHeader>
        <StatusBadge status={gameData?.status}>
          🎮 {getGameStatus()}
        </StatusBadge>
        
        <GameInfo>
          <InfoItem>
            <InfoLabel>Price</InfoLabel>
            <InfoValue>${getGamePrice().toFixed(2)}</InfoValue>
          </InfoItem>
          
          {gameState && (
            <>
              <InfoItem>
                <InfoLabel>Round</InfoLabel>
                <InfoValue>{gameState.currentRound}/{gameState.totalRounds}</InfoValue>
              </InfoItem>
              
              <InfoItem>
                <InfoLabel>Score</InfoLabel>
                <InfoValue>{gameState.creatorScore} - {gameState.challengerScore}</InfoValue>
              </InfoItem>
            </>
          )}
          
          <InfoItem>
            <InfoLabel>Connection</InfoLabel>
            <InfoValue style={{ color: connected ? '#00FF41' : '#FF1493' }}>
              {connected ? '🟢 Online' : '🔴 Offline'}
            </InfoValue>
          </InfoItem>
        </GameInfo>
      </GameStatusHeader>
      
      {/* Game Content */}
      <GameContent>
        {isGameReady ? renderActiveGame() : renderWaitingState()}
      </GameContent>
    </TabContainer>
  )
}

export default GameRoomTab