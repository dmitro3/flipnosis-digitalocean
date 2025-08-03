import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ThemeProvider } from '@emotion/react'
import styled from '@emotion/styled'

// Context imports
import { useWallet } from '../../contexts/WalletContext'
import { useToast } from '../../contexts/ToastContext'

// Component imports
import GameBackground from './GameBackground'
import GamePlayers from './GamePlayers'
import GameCoin from './GameCoin'
import GameControls from './GameControls'
import GamePayment from './GamePayment'
import GameBottom from './GameBottom'
import GameResultPopup from '../GameResultPopup'
import ProfilePicture from '../ProfilePicture'

// Hooks and services
import { useGameState } from './hooks/useGameState'
import { useWebSocket } from './hooks/useWebSocket'
import { useGameData } from './hooks/useGameData'

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

const PlayersRow = styled.div`
  display: flex;
  gap: 2rem;
  width: 100%;
  max-width: 800px;
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 1rem;
  }
`

const PlayerContainer = styled.div`
  flex: 1;
  background: linear-gradient(135deg, rgba(0, 255, 65, 0.1) 0%, rgba(0, 255, 65, 0.05) 100%);
  padding: 1.5rem;
  border-radius: 1rem;
  border: 2px solid #00FF41;
  backdrop-filter: blur(10px);
  box-shadow: 0 0 30px rgba(0, 255, 65, 0.3), inset 0 0 20px rgba(0, 255, 65, 0.1);
  min-height: 200px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(45deg, transparent 30%, rgba(0, 255, 65, 0.1) 50%, transparent 70%);
    animation: shimmer 3s ease-in-out infinite;
    pointer-events: none;
  }
  
  @keyframes shimmer {
    0%, 100% { transform: translateX(-100%); }
    50% { transform: translateX(100%); }
  }
`

const GameStatusContainer = styled.div`
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.1) 0%, rgba(255, 215, 0, 0.05) 100%);
  padding: 1rem;
  border-radius: 0.75rem;
  border: 1px solid rgba(255, 215, 0, 0.3);
  margin-bottom: 1rem;
  text-align: center;
`

const RoundIndicator = styled.div`
  display: flex;
  gap: 0.5rem;
  justify-content: center;
  margin-top: 0.5rem;
`

const RoundDot = styled.div`
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: ${props => {
    if (props.isCurrent) return '#FFFF00';
    if (props.isWon) return '#00FF41';
    if (props.isLost) return '#FF1493';
    return 'rgba(255, 255, 255, 0.1)';
  }};
  border: 1px solid rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: bold;
  color: ${props => props.isCurrent || props.isWon || props.isLost ? '#000' : '#666'};
`

const GamePage = () => {
  const { gameId } = useParams()
  const navigate = useNavigate()
  const { address, isMobile } = useWallet()
  const { showSuccess, showError, showInfo } = useToast()

  // Game state management
  const {
    gameData,
    loading,
    error,
    gameState,
    playerChoices,
    streamedCoinState,
    flipAnimation,
    resultData,
    showResultPopup,
    ethAmount,
    depositTimeLeft,
    roundCountdown,
    offers,
    chatMessages,
    customHeadsImage,
    customTailsImage,
    gameCoin,
    newOffer,
    creatingOffer,
    wsConnected,
    wsRef,
    resetForNextRound,
    handlePlayerChoice,
    handlePowerChargeStart,
    handlePowerChargeStop,
    handleAutoFlip,
    createOffer,
    acceptOffer,
    rejectOffer,
    startRoundCountdown,
    stopRoundCountdown,
    formatTimeLeft,
    loadGameData,
    loadOffers,
    startDepositCountdown,
    setNewOffer,
    setCreatingOffer,
    setGameState,
    setPlayerChoices,
    setStreamedCoinState,
    handleFlipResult,
    handleGameCompleted,
    isMyTurn,
    isCreator,
    isJoiner,
    getGameCreator,
    getGameJoiner,
    getGamePrice,
    getGameNFTImage,
    getGameNFTName,
    getGameNFTCollection,
    getGameNFTContract,
    getGameNFTTokenId
  } = useGameState(gameId, address)

  // WebSocket management - using wsConnected and wsRef from useGameState

  // Game data loading
  useGameData(
    gameId, 
    gameData, 
    gameState, 
    address,
    wsRef,
    setGameState,
    setPlayerChoices,
    setStreamedCoinState,
    handleFlipResult,
    handleGameCompleted
  )

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
              <span style={{ marginLeft: '1rem', color: 'white' }}>Loading game...</span>
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
              <h2>Error Loading Game</h2>
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

  return (
    <ThemeProvider theme={theme}>
      <Container>
        <GameBackground isMobile={isMobile} />
        
        <GameContainer>
          <GameLayout>
            <GameCoin 
              gameId={gameId}
              gameState={gameState}
              streamedCoinState={streamedCoinState}
              flipAnimation={flipAnimation}
              customHeadsImage={customHeadsImage}
              customTailsImage={customTailsImage}
              gameCoin={gameCoin}
              isMobile={isMobile}
              onPowerChargeStart={handlePowerChargeStart}
              onPowerChargeStop={handlePowerChargeStop}
              isMyTurn={isMyTurn}
              address={address}
              isCreator={isCreator}
            />

            <PlayersRow>
              <PlayerContainer>
                <GameStatusContainer>
                  <h4 style={{ color: '#FFD700', margin: '0 0 0.5rem 0', fontSize: '1.1rem' }}>
                    Round {gameState.currentRound || 1}
                  </h4>
                  {roundCountdown !== null && (
                    <div style={{
                      fontSize: '1.2rem',
                      color: roundCountdown <= 5 ? '#FF4444' : '#00FF41',
                      fontWeight: 'bold',
                      textShadow: roundCountdown <= 5 ? '0 0 10px rgba(255, 68, 68, 0.8)' : '0 0 10px rgba(0, 255, 65, 0.5)',
                      animation: roundCountdown <= 5 ? 'pulse 1s ease-in-out infinite' : 'none'
                    }}>
                      ⏰ {roundCountdown}s
                    </div>
                  )}
                  <RoundIndicator>
                    <RoundDot isCurrent={gameState.currentRound === 1} isWon={gameState.creatorWins > 0} isLost={gameState.joinerWins > 0}>
                      1
                    </RoundDot>
                    <RoundDot isCurrent={gameState.currentRound === 2} isWon={gameState.creatorWins > 1} isLost={gameState.joinerWins > 1}>
                      2
                    </RoundDot>
                    <RoundDot isCurrent={gameState.currentRound === 3} isWon={gameState.creatorWins > 2} isLost={gameState.joinerWins > 2}>
                      3
                    </RoundDot>
                  </RoundIndicator>
                </GameStatusContainer>
                
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  padding: '0.75rem',
                  background: isCreator() ? 'rgba(255, 215, 0, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '0.5rem',
                  border: isCreator() ? '1px solid rgba(255, 215, 0, 0.3)' : '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                  <div>
                    <ProfilePicture 
                      address={getGameCreator()}
                      size={50}
                      showAddress={true}
                    />
                  </div>
                  <div style={{ flex: '1' }}>
                    <h4 style={{ color: '#FFD700', margin: '0 0 0.25rem 0', fontSize: '1rem' }}>Creator</h4>
                    <p style={{ margin: '0.25rem 0', fontSize: '0.9rem', color: 'white' }}>
                      Power: {Number(gameState.creatorPower) || 0}
                    </p>
                    <p style={{ margin: '0.25rem 0', fontSize: '0.8rem', color: '#ccc' }}>
                      Wins: {gameState.creatorWins || 0}
                    </p>
                    {playerChoices.creator && (
                      <div style={{ 
                        marginTop: '0.5rem', 
                        padding: '0.25rem 0.5rem', 
                        background: playerChoices.creator === 'heads' ? 'rgba(0, 255, 65, 0.2)' : 'rgba(255, 20, 147, 0.2)',
                        border: `1px solid ${playerChoices.creator === 'heads' ? '#00FF41' : '#FF1493'}`,
                        borderRadius: '0.25rem',
                        fontSize: '0.8rem',
                        color: 'white',
                        textAlign: 'center',
                        display: 'inline-block'
                      }}>
                        Chose: {playerChoices.creator.toUpperCase()}
                      </div>
                    )}
                  </div>
                </div>
              </PlayerContainer>
              <PlayerContainer>
                <GameStatusContainer>
                  <h4 style={{ color: '#FFD700', margin: '0 0 0.5rem 0', fontSize: '1.1rem' }}>
                    Game Status
                  </h4>
                  <div style={{
                    fontSize: '1rem',
                    color: '#00FF41',
                    fontWeight: 'bold',
                    marginBottom: '0.5rem'
                  }}>
                    {gameState.phase === 'choosing' ? '🎯 Choosing Phase' : 
                     gameState.phase === 'charging' ? '⚡ Charging Phase' :
                     gameState.phase === 'flipping' ? '🪙 Flipping' :
                     gameState.phase === 'completed' ? '🏁 Game Complete' : '⏳ Waiting...'}
                  </div>
                  {gameState.chargingPlayer && (
                    <div style={{
                      color: '#FFD700',
                      fontSize: '0.9rem',
                      fontWeight: 'bold',
                      animation: 'powerPulse 0.4s ease-in-out infinite',
                      textShadow: '0 0 10px rgba(255, 215, 0, 0.8)'
                    }}>
                      ⚡ {gameState.chargingPlayer === getGameCreator() ? 'PLAYER 1' : 'PLAYER 2'} CHARGING ⚡
                    </div>
                  )}
                </GameStatusContainer>
                
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  padding: '0.75rem',
                  background: isJoiner() ? 'rgba(255, 215, 0, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '0.5rem',
                  border: isJoiner() ? '1px solid rgba(255, 215, 0, 0.3)' : '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                  <div>
                    <ProfilePicture 
                      address={getGameJoiner()}
                      size={50}
                      showAddress={true}
                    />
                  </div>
                  <div style={{ flex: '1' }}>
                    <h4 style={{ color: '#FFD700', margin: '0 0 0.25rem 0', fontSize: '1rem' }}>Joiner</h4>
                    <p style={{ margin: '0.25rem 0', fontSize: '0.9rem', color: 'white' }}>
                      Power: {Number(gameState.joinerPower) || 0}
                    </p>
                    <p style={{ margin: '0.25rem 0', fontSize: '0.8rem', color: '#ccc' }}>
                      Wins: {gameState.joinerWins || 0}
                    </p>
                    {playerChoices.joiner && (
                      <div style={{ 
                        marginTop: '0.5rem', 
                        padding: '0.25rem 0.5rem', 
                        background: playerChoices.joiner === 'heads' ? 'rgba(0, 255, 65, 0.2)' : 'rgba(255, 20, 147, 0.2)',
                        border: `1px solid ${playerChoices.joiner === 'heads' ? '#00FF41' : '#FF1493'}`,
                        borderRadius: '0.25rem',
                        fontSize: '0.8rem',
                        color: 'white',
                        textAlign: 'center',
                        display: 'inline-block'
                      }}>
                        Chose: {playerChoices.joiner.toUpperCase()}
                      </div>
                    )}
                  </div>
                </div>
              </PlayerContainer>
            </PlayersRow>

            <GameControls 
              gameData={gameData}
              gameState={gameState}
              playerChoices={playerChoices}
              isMyTurn={isMyTurn}
              isCreator={isCreator}
              isJoiner={isJoiner}
              onPlayerChoice={handlePlayerChoice}
              onAutoFlip={handleAutoFlip}
            />

            <GamePayment 
              gameData={gameData}
              gameId={gameId}
              address={address}
              depositTimeLeft={depositTimeLeft}
              ethAmount={ethAmount}
              contractInitialized={true}
              countdownInterval={null}
              getGameCreator={getGameCreator}
              getGameJoiner={getGameJoiner}
              getGamePrice={getGamePrice}
              getGameNFTImage={getGameNFTImage}
              getGameNFTName={getGameNFTName}
              getGameNFTCollection={getGameNFTCollection}
              isCreator={isCreator}
              isJoiner={isJoiner}
              formatTimeLeft={formatTimeLeft}
              startDepositCountdown={startDepositCountdown}
              loadGameData={loadGameData}
            />

            <GameBottom 
              gameData={gameData}
              gameId={gameId}
              address={address}
              offers={offers}
              depositTimeLeft={depositTimeLeft}
              wsRef={wsRef}
              wsConnected={wsConnected}
              isCreator={isCreator}
              isJoiner={isJoiner}
              getGameCreator={getGameCreator}
              getGameJoiner={getGameJoiner}
              getGamePrice={getGamePrice}
              getGameNFTImage={getGameNFTImage}
              getGameNFTName={getGameNFTName}
              getGameNFTCollection={getGameNFTCollection}
              getGameNFTContract={getGameNFTContract}
              getGameNFTTokenId={getGameNFTTokenId}
              customHeadsImage={customHeadsImage}
              customTailsImage={customTailsImage}
              formatTimeLeft={formatTimeLeft}
              newOffer={newOffer}
              creatingOffer={creatingOffer}
              setNewOffer={setNewOffer}
              setCreatingOffer={setCreatingOffer}
              createOffer={createOffer}
              acceptOffer={acceptOffer}
              rejectOffer={rejectOffer}
              loadOffers={loadOffers}
            />
          </GameLayout>
        </GameContainer>

        {/* Result Popup */}
        {showResultPopup && resultData && (
          <GameResultPopup
            resultData={resultData}
            onClose={resetForNextRound}
            onClaimWinnings={resetForNextRound}
          />
        )}
      </Container>
    </ThemeProvider>
  )
}

export default GamePage 