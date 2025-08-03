import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ThemeProvider } from '@emotion/react'
import styled from '@emotion/styled'

// Context imports
import { useWallet } from '../../contexts/WalletContext'
import { useToast } from '../../contexts/ToastContext'

// Component imports
import GameBackground from './GameBackground'
import GameHeader from './GameHeader'
import GamePlayers from './GamePlayers'
import GameCoin from './GameCoin'
import GameControls from './GameControls'
import GamePayment from './GamePayment'
import GameBottom from './GameBottom'
import GameResultPopup from '../GameResultPopup'

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
    setNewOffer,
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

  // WebSocket management
  const { wsConnected, wsRef } = useWebSocket(gameId, address, gameData)

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
          <GameHeader 
            gameData={gameData}
            gameState={gameState}
            getGameCreator={getGameCreator}
            getGameJoiner={getGameJoiner}
            getGamePrice={getGamePrice}
            getGameNFTImage={getGameNFTImage}
            getGameNFTName={getGameNFTName}
            getGameNFTCollection={getGameNFTCollection}
            getGameNFTContract={getGameNFTContract}
            getGameNFTTokenId={getGameNFTTokenId}
          />

          <GamePlayers 
            gameData={gameData}
            gameState={gameState}
            playerChoices={playerChoices}
            roundCountdown={roundCountdown}
            isCreator={isCreator}
            isJoiner={isJoiner}
            getGameCreator={getGameCreator}
            getGameJoiner={getGameJoiner}
            isMyTurn={isMyTurn}
          />

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
            startDepositCountdown={() => {}}
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
            createOffer={createOffer}
            acceptOffer={acceptOffer}
            rejectOffer={rejectOffer}
          />
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