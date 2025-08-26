import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ThemeProvider } from '@emotion/react'
import styled from '@emotion/styled'

// Context imports
import { useWallet } from '../../contexts/WalletContext'
import { useToast } from '../../contexts/ToastContext'
import { useProfile } from '../../contexts/ProfileContext'

// Component imports
import GameBackground from '../GameOrchestrator/GameBackground'
import OptimizedCoinWrapper from './OptimizedCoinWrapper'
import ChatContainer from '../Lobby/ChatContainer'
import OffersContainer from '../Lobby/OffersContainer'
import PlayerCard from './PlayerCard'
import GameCountdown from '../GameOrchestrator/GameCountdown'
import ResultPopup from '../GameResultPopup'
import PowerBar from '../EnhancedPowerBar'

// Hook imports
import { useUnifiedGameState } from './hooks/useUnifiedGameState'
import webSocketService from '../../services/WebSocketService'

// Styles
import { theme } from '../../styles/theme'

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

const MainLayout = styled.div`
  display: grid;
  grid-template-columns: ${props => props.phase === 'waiting' ? '1fr 2fr 1fr' : '1fr 2fr 1fr'};
  gap: 2rem;
  
  @media (max-width: 1200px) {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
`

const CenterSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rem;
`

const CoinSection = styled.div`
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
  width: 100%;
`

const GameStatus = styled.div`
  background: rgba(0, 0, 0, 0.8);
  border: 2px solid ${props => {
    switch(props.phase) {
      case 'waiting': return '#FFD700'
      case 'locked': return '#00FF41'
      case 'playing': return '#00BFFF'
      case 'completed': return '#FF1493'
      default: return '#FFD700'
    }
  }};
  border-radius: 1rem;
  padding: 1rem;
  text-align: center;
  animation: statusPulse 2s ease-in-out infinite;
  
  @keyframes statusPulse {
    0%, 100% { opacity: 0.8; }
    50% { opacity: 1; }
  }
`

const StatusText = styled.h3`
  color: ${props => props.color || '#FFFFFF'};
  margin: 0;
  font-size: 1.2rem;
`

const ChoiceButtons = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
`

const ChoiceButton = styled.button`
  background: ${props => props.selected ? 
    'linear-gradient(135deg, #00FF41, #00BFFF)' : 
    'rgba(255, 255, 255, 0.1)'
  };
  border: 2px solid ${props => props.selected ? '#00FF41' : 'rgba(255, 255, 255, 0.3)'};
  color: white;
  padding: 1rem 2rem;
  border-radius: 0.5rem;
  font-size: 1.1rem;
  cursor: pointer;
  transition: all 0.3s;
  
  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 5px 20px rgba(0, 255, 65, 0.3);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`

const SpectatorBadge = styled.div`
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: rgba(255, 20, 147, 0.2);
  border: 1px solid #FF1493;
  padding: 0.5rem 1rem;
  border-radius: 2rem;
  color: #FF1493;
  font-weight: bold;
  animation: pulse 2s infinite;
`

const LockAnimation = styled.div`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 1000;
  display: ${props => props.show ? 'block' : 'none'};
  
  .lock-icon {
    font-size: 5rem;
    animation: lockIn 1s ease-out;
  }
  
  @keyframes lockIn {
    0% {
      transform: scale(0) rotate(-180deg);
      opacity: 0;
    }
    50% {
      transform: scale(1.2) rotate(10deg);
      opacity: 1;
    }
    100% {
      transform: scale(1) rotate(0deg);
      opacity: 1;
    }
  }
`

const RoundIndicator = styled.div`
  background: rgba(0, 0, 0, 0.9);
  border: 2px solid #FFD700;
  border-radius: 1rem;
  padding: 1rem;
  display: flex;
  justify-content: space-around;
  align-items: center;
  margin: 1rem 0;
`

const RoundDot = styled.div`
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: ${props => props.won === 'creator' ? '#00FF41' : 
                props.won === 'joiner' ? '#FF1493' : 
                'rgba(255, 255, 255, 0.2)'};
  transition: all 0.3s;
`

const GameSession = () => {
  const { gameId } = useParams()
  const navigate = useNavigate()
  const { address, isMobile } = useWallet()
  const { showSuccess, showError, showInfo } = useToast()
  const { getPlayerName } = useProfile()

  // Unified game state management
  const {
    gamePhase, // 'waiting' | 'locked' | 'countdown' | 'choosing' | 'flipping' | 'result' | 'completed'
    gameData,
    players,
    spectators,
    currentRound,
    scores,
    offers,
    chatMessages,
    isCreator,
    isJoiner,
    isSpectator,
    isMyTurn,
    canMakeChoice,
    playerChoice,
    opponentChoice,
    powerLevel,
    flipResult,
    roundWinner,
    gameWinner,
    showLockAnimation,
    countdownTime,
    depositTimeLeft,
    // Actions
    handleAcceptOffer,
    handleMakeChoice,
    handleSetPower,
    handleSendChat,
    handleMakeOffer,
    handleClaimWinnings,
    handleExitGame
  } = useUnifiedGameState(gameId, address)

  // WebSocket connection
  useEffect(() => {
    if (!gameId || !address) return

    const connectToGame = async () => {
      await webSocketService.connect(`game_${gameId}`, address)
      showInfo('Connected to game room')
    }

    connectToGame()

    return () => {
      webSocketService.disconnect()
    }
  }, [gameId, address])

  // Handle phase-specific rendering
  const renderGamePhase = () => {
    switch (gamePhase) {
      case 'waiting':
        return (
          <GameStatus phase="waiting">
            <StatusText color="#FFD700">⏳ Waiting for Player 2</StatusText>
            <StatusText color="#FFFFFF" style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>
              Players can make offers below
            </StatusText>
          </GameStatus>
        )

      case 'locked':
        return (
          <GameStatus phase="locked">
            <StatusText color="#00FF41">🔒 Game Locked - Players Matched!</StatusText>
            <StatusText color="#FFFFFF" style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>
              {players.joiner.name} has {Math.floor(depositTimeLeft / 60)}:{(depositTimeLeft % 60).toString().padStart(2, '0')} to deposit
            </StatusText>
          </GameStatus>
        )

      case 'countdown':
        return <GameCountdown onComplete={() => {}} duration={3} />

      case 'choosing':
        if (isSpectator()) {
          return (
            <GameStatus phase="playing">
              <StatusText color="#00BFFF">👁️ Watching the game</StatusText>
              <StatusText color="#FFFFFF" style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>
                {isMyTurn() ? `${getPlayerName(players.current)} is choosing...` : 'Players are making choices'}
              </StatusText>
            </GameStatus>
          )
        }

        return (
          <GameStatus phase="playing">
            <StatusText color="#00BFFF">
              {canMakeChoice() ? '🎯 Your turn! Choose heads or tails' : '⏳ Waiting for opponent\'s choice'}
            </StatusText>
            {canMakeChoice() && (
              <ChoiceButtons>
                <ChoiceButton 
                  selected={playerChoice === 'heads'}
                  onClick={() => handleMakeChoice('heads')}
                  disabled={!canMakeChoice()}
                >
                  HEADS
                </ChoiceButton>
                <ChoiceButton 
                  selected={playerChoice === 'tails'}
                  onClick={() => handleMakeChoice('tails')}
                  disabled={!canMakeChoice()}
                >
                  TAILS
                </ChoiceButton>
              </ChoiceButtons>
            )}
          </GameStatus>
        )

      case 'flipping':
        return (
          <GameStatus phase="playing">
            <StatusText color="#FFD700">🪙 Flipping...</StatusText>
          </GameStatus>
        )

      case 'result':
        return (
          <GameStatus phase="playing">
            <StatusText color={roundWinner === address ? '#00FF41' : '#FF1493'}>
              {roundWinner === address ? '🎉 You won this round!' : '💔 You lost this round'}
            </StatusText>
            <RoundIndicator>
              {[1, 2, 3, 4, 5].map(round => (
                <RoundDot 
                  key={round}
                  won={scores[`round${round}`]}
                  title={`Round ${round}`}
                />
              ))}
            </RoundIndicator>
          </GameStatus>
        )

      case 'completed':
        return (
          <GameStatus phase="completed">
            <StatusText color={gameWinner === address ? '#00FF41' : '#FF1493'}>
              {gameWinner === address ? '🏆 YOU WON THE GAME!' : '😢 Game Over'}
            </StatusText>
            {gameWinner === address && (
              <ChoiceButton 
                style={{ marginTop: '1rem' }}
                onClick={handleClaimWinnings}
              >
                CLAIM WINNINGS
              </ChoiceButton>
            )}
          </GameStatus>
        )

      default:
        return null
    }
  }

  return (
    <ThemeProvider theme={theme}>
      <Container>
        {/* Background - disabled on mobile for performance */}
        {!isMobile && <GameBackground isMobile={false} />}
        
        {/* Lock animation overlay */}
        <LockAnimation show={showLockAnimation}>
          <div className="lock-icon">🔒</div>
        </LockAnimation>

        {/* Spectator badge */}
        {isSpectator() && <SpectatorBadge>SPECTATOR MODE</SpectatorBadge>}

        <GameContainer>
          <MainLayout phase={gamePhase}>
            {/* Left Section - Player 1 / Offers */}
            <div>
              {gamePhase === 'waiting' ? (
                <OffersContainer 
                  offers={offers}
                  onAcceptOffer={handleAcceptOffer}
                  onMakeOffer={handleMakeOffer}
                  isCreator={isCreator()}
                  gameData={gameData}
                  disabled={gamePhase !== 'waiting'}
                />
              ) : (
                <PlayerCard 
                  player={players.creator}
                  isActive={players.current === players.creator.address}
                  score={scores.creator}
                  choice={players.creator.address === address ? playerChoice : opponentChoice}
                  power={players.creator.power}
                />
              )}
            </div>

            {/* Center Section - Coin & Game Status */}
            <CenterSection>
              {renderGamePhase()}
              
              <CoinSection>
                <OptimizedCoinWrapper
                  gamePhase={gamePhase}
                  isFlipping={gamePhase === 'flipping'}
                  flipResult={flipResult}
                  onPowerCharge={(power) => handleSetPower(power)}
                  onPowerRelease={() => handleSetPower(0)}
                  isPlayerTurn={isMyTurn() && canMakeChoice()}
                  isCharging={gamePhase === 'choosing' && isMyTurn()}
                  chargingPlayer={players.current}
                  creatorPower={players.creator.power}
                  joinerPower={players.joiner.power}
                  creatorChoice={players.creator.choice}
                  joinerChoice={players.joiner.choice}
                  isCreator={isCreator()}
                  customHeadsImage={gameData?.coinData?.headsImage}
                  customTailsImage={gameData?.coinData?.tailsImage}
                  size={isMobile ? 150 : 200}
                  isMobile={isMobile}
                />
              </CoinSection>

              {/* Power bar during choosing phase */}
              {gamePhase === 'choosing' && !isSpectator() && isMyTurn() && (
                <PowerBar 
                  power={powerLevel}
                  maxPower={100}
                  onPowerChange={handleSetPower}
                />
              )}
            </CenterSection>

            {/* Right Section - Player 2 / Chat */}
            <div>
              {gamePhase === 'waiting' || isSpectator() ? (
                <ChatContainer 
                  messages={chatMessages}
                  onSendMessage={handleSendChat}
                  currentUser={address}
                />
              ) : (
                <PlayerCard 
                  player={players.joiner}
                  isActive={players.current === players.joiner.address}
                  score={scores.joiner}
                  choice={players.joiner.address === address ? playerChoice : opponentChoice}
                  power={players.joiner.power}
                />
              )}
            </div>
          </MainLayout>
        </GameContainer>

        {/* Result popup for round/game results */}
        {(gamePhase === 'result' || gamePhase === 'completed') && (
          <ResultPopup
            isWinner={gamePhase === 'result' ? roundWinner === address : gameWinner === address}
            type={gamePhase === 'completed' ? 'game' : 'round'}
            onClose={() => {}}
          />
        )}
      </Container>
    </ThemeProvider>
  )
}

export default GameSession
