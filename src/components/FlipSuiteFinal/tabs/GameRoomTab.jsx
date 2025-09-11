import React, { useState, useEffect } from 'react'
import styled from '@emotion/styled'
import OptimizedGoldCoin from '../../OptimizedGoldCoin'
import ProfilePicture from '../../ProfilePicture'

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

// Active Game Styles
const GameBoard = styled.div`
  display: grid;
  grid-template-columns: 300px 1fr 300px;
  gap: 2rem;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  align-items: start;
  
  @media (max-width: 1200px) {
    grid-template-columns: 1fr;
    gap: 1rem;
    padding: 1rem;
  }
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

const GameRoomTab = ({ 
  gameData, 
  gameId, 
  socket, 
  connected, 
  coinConfig, 
  address, 
  isCreator,
  isGameReady
}) => {
  const [gameState, setGameState] = useState(null)
  
  // Check if game is ready to play
  useEffect(() => {
    if (!gameData) {
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
    }
    
    const handleGameStarted = (data) => {
      console.log('🎮 Game started event in GameRoomTab:', data)
      
      // Initialize game state from the event data
      setGameState({
        currentRound: data.currentRound || 1,
        totalRounds: data.totalRounds || 5,
        creatorScore: data.creatorScore || 0,
        challengerScore: data.challengerScore || 0,
        currentTurn: data.currentTurn || data.creator,
        flipSeed: null,
        phase: data.phase || 'choosing',
        roundPhase: 'player1_choice'
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
  }, [socket, gameId])
  
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
    if (!gameState) {
      return (
        <WaitingState>
          <WaitingIcon>🎮</WaitingIcon>
          <WaitingTitle>Loading Game...</WaitingTitle>
          <WaitingDescription>
            Preparing the game room...
          </WaitingDescription>
        </WaitingState>
      )
    }

    return (
      <GameBoard>
        {/* Creator Card */}
        <PlayerCard 
          isCreator={true} 
          isActive={gameState.currentTurn === gameData.creator}
        >
          <PlayerHeader>
            <ProfilePicture address={gameData.creator} size={40} />
            <PlayerLabel isCreator={true}>👑 Creator</PlayerLabel>
          </PlayerHeader>
          <PlayerStats>
            <StatRow>
              <StatLabel>Name:</StatLabel>
              <StatValue isCreator={true}>
                {gameData.creator?.slice(0, 6)}...{gameData.creator?.slice(-4)}
              </StatValue>
            </StatRow>
            <StatRow>
              <StatLabel>Score:</StatLabel>
              <StatValue isCreator={true}>{gameState.creatorScore}</StatValue>
            </StatRow>
            <StatRow>
              <StatLabel>Choice:</StatLabel>
              <StatValue isCreator={true}>
                {gameState.creatorChoice || 'Waiting...'}
              </StatValue>
            </StatRow>
          </PlayerStats>
        </PlayerCard>

        {/* Coin Area */}
        <CoinArea>
          <GameStatus>
            <StatusText>Round {gameState.currentRound}/{gameState.totalRounds}</StatusText>
          </GameStatus>

          <OptimizedGoldCoin
            isFlipping={gameState.coinState?.isFlipping}
            flipResult={gameState.coinState?.flipResult}
            flipDuration={gameState.coinState?.flipDuration || 3000}
            onFlipComplete={() => console.log('Flip animation complete')}
            customHeadsImage={coinConfig?.headsImage}
            customTailsImage={coinConfig?.tailsImage}
            size={240}
            material={coinConfig?.material || 'gold'}
          />

          {/* Choice Buttons */}
          {gameState.phase === 'choosing' && gameState.currentTurn === address && (
            <ChoiceButtons>
              <ChoiceButton 
                choice="heads" 
                onClick={() => socket.emit('make_choice', { gameId, choice: 'heads' })}
              >
                👑 Heads
              </ChoiceButton>
              <ChoiceButton 
                choice="tails" 
                onClick={() => socket.emit('make_choice', { gameId, choice: 'tails' })}
              >
                💎 Tails
              </ChoiceButton>
            </ChoiceButtons>
          )}
        </CoinArea>

        {/* Challenger Card */}
        <PlayerCard 
          isCreator={false} 
          isActive={gameState.currentTurn === gameData.challenger}
        >
          <PlayerHeader>
            <ProfilePicture address={gameData.challenger} size={40} />
            <PlayerLabel isCreator={false}>⚔️ Challenger</PlayerLabel>
          </PlayerHeader>
          <PlayerStats>
            <StatRow>
              <StatLabel>Name:</StatLabel>
              <StatValue isCreator={false}>
                {gameData.challenger?.slice(0, 6)}...{gameData.challenger?.slice(-4)}
              </StatValue>
            </StatRow>
            <StatRow>
              <StatLabel>Score:</StatLabel>
              <StatValue isCreator={false}>{gameState.challengerScore}</StatValue>
            </StatRow>
            <StatRow>
              <StatLabel>Choice:</StatLabel>
              <StatValue isCreator={false}>
                {gameState.challengerChoice || 'Waiting...'}
              </StatValue>
            </StatRow>
          </PlayerStats>
        </PlayerCard>
      </GameBoard>
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
