import React, { useState, useEffect } from 'react'
import styled from '@emotion/styled'
import GameRoom from '../../GameRoom/GameRoom'
import GameCoin from '../../GameOrchestrator/GameCoin'

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
        return '#00FF41'
      case 'waiting_challenger':
      case 'waiting_for_challenger':
        return '#FF9500'
      case 'waiting_challenger_deposit':
        return '#FFD700'
      case 'completed':
        return '#808080'
      default:
        return '#fff'
    }
  }};
  padding: 0.5rem 1rem;
  border-radius: 1rem;
  font-size: 0.9rem;
  font-weight: bold;
`

const GameInfo = styled.div`
  display: flex;
  gap: 2rem;
  align-items: center;
  flex-wrap: wrap;
  
  @media (max-width: 768px) {
    gap: 1rem;
  }
`

const InfoItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
`

const InfoLabel = styled.span`
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.8rem;
`

const InfoValue = styled.span`
  color: #00BFFF;
  font-weight: bold;
  font-size: 1rem;
`

const GameContent = styled.div`
  flex: 1;
  overflow: hidden;
  position: relative;
`

const WaitingState = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  padding: 2rem;
  background: rgba(0, 0, 40, 0.95);
`

const WaitingIcon = styled.div`
  font-size: 4rem;
  margin-bottom: 1rem;
  animation: pulse 2s infinite;
  
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
`

const WaitingTitle = styled.h2`
  color: #FFD700;
  margin: 0 0 1rem 0;
  font-size: 1.5rem;
`

const WaitingDescription = styled.p`
  color: rgba(255, 255, 255, 0.8);
  margin: 0 0 2rem 0;
  font-size: 1.1rem;
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
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`

const CoinPreview = styled.div`
  display: flex;
  justify-content: center;
  margin: 2rem 0;
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

  // Check if game is ready to play
  useEffect(() => {
    if (gameData) {
      const gameReady = gameData.status === 'active' || 
                       gameData.status === 'in_progress' ||
                       gameData.status === 'playing'
      setIsGameReady(gameReady)
    }
  }, [gameData])

  // Mock game state for testing (replace with real WebSocket data)
  useEffect(() => {
    if (isGameReady) {
      setGameState({
        phase: 'waiting',
        currentRound: 1,
        totalRounds: 5,
        creatorScore: 0,
        challengerScore: 0,
        currentTurn: gameData?.creator,
        timeLeft: 30
      })
    }
  }, [isGameReady, gameData])

  const getGameStatus = () => {
    switch (gameData?.status) {
      case 'waiting_challenger':
      case 'awaiting_challenger':
      case 'waiting_for_challenger':
        return 'Waiting for challenger'
      case 'waiting_challenger_deposit':
        return 'Waiting for deposit'
      case 'active':
      case 'in_progress':
      case 'playing':
        return 'Game active'
      case 'completed':
        return 'Game completed'
      default:
        return gameData?.status || 'Unknown'
    }
  }

  const getGamePrice = () => {
    return gameData?.payment_amount || 
           gameData?.price_usd || 
           gameData?.final_price || 
           gameData?.price || 
           gameData?.asking_price || 
           gameData?.priceUSD || 
           0
  }

  const handleExitRoom = () => {
    console.log('Exiting game room')
    // Add logic to handle exiting the game
  }

  const renderWaitingState = () => {
    const status = gameData?.status
    
    if (status === 'waiting_challenger' || status === 'awaiting_challenger' || status === 'waiting_for_challenger') {
      return (
        <WaitingState>
          <WaitingIcon>⏳</WaitingIcon>
          <WaitingTitle>Waiting for Challenger</WaitingTitle>
          <WaitingDescription>
            The game is waiting for someone to accept an offer and join as a challenger. 
            Once a challenger joins and deposits their crypto, the game will begin!
          </WaitingDescription>
          
          <CoinPreview>
            <GameCoin
              gameId={gameId}
              gameState={{ phase: 'waiting' }}
              gameData={gameData}
              flipAnimation={null}
              customHeadsImage={coinConfig?.headsImage}
              customTailsImage={coinConfig?.tailsImage}
              gameCoin={coinConfig}
              isMobile={window.innerWidth <= 768}
              onPowerChargeStart={() => {}}
              onPowerChargeStop={() => {}}
              isMyTurn={() => false}
              address={address}
              isCreator={() => isCreator}
            />
          </CoinPreview>
          
          <div style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.9rem' }}>
            Game ID: {gameId}
          </div>
        </WaitingState>
      )
    }
    
    if (status === 'waiting_challenger_deposit') {
      return (
        <WaitingState>
          <WaitingIcon>💰</WaitingIcon>
          <WaitingTitle>Waiting for Deposit</WaitingTitle>
          <WaitingDescription>
            A challenger has accepted an offer! Waiting for them to deposit their crypto stake. 
            The game will start automatically once the deposit is confirmed.
          </WaitingDescription>
          
          <CoinPreview>
            <GameCoin
              gameId={gameId}
              gameState={{ phase: 'waiting' }}
              gameData={gameData}
              flipAnimation={null}
              customHeadsImage={coinConfig?.headsImage}
              customTailsImage={coinConfig?.tailsImage}
              gameCoin={coinConfig}
              isMobile={window.innerWidth <= 768}
              onPowerChargeStart={() => {}}
              onPowerChargeStop={() => {}}
              isMyTurn={() => false}
              address={address}
              isCreator={() => isCreator}
            />
          </CoinPreview>
        </WaitingState>
      )
    }
    
    if (status === 'completed') {
      return (
        <WaitingState>
          <WaitingIcon>🏆</WaitingIcon>
          <WaitingTitle>Game Completed</WaitingTitle>
          <WaitingDescription>
            This game has finished. Check the final results and coin flip history.
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
        <WaitingTitle>Game Room Not Ready</WaitingTitle>
        <WaitingDescription>
          The game room is not yet available. Please check the other tabs for more information.
        </WaitingDescription>
      </WaitingState>
    )
  }

  const renderActiveGame = () => {
    return (
      <GameRoom
        gameId={gameId}
        gameData={gameData}
        onExitRoom={handleExitRoom}
        coinConfig={coinConfig}
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
          onPowerChargeStart={() => {}}
          onPowerChargeStop={() => {}}
          isMyTurn={() => gameState?.currentTurn === address}
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
