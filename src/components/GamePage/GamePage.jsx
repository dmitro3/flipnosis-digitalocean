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
import GameResultPopup from '../GameResultPopup'
import ProfilePicture from '../ProfilePicture'
import GameStatusAndNFTContainer from './GameStatusAndNFTContainer'
import ChatContainer from './ChatContainer'
import OffersContainer from './OffersContainer'

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

const ThreeContainerLayout = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 2rem;
  width: 100%;
  max-width: 1400px;
  
  @media (max-width: 1200px) {
    grid-template-columns: 1fr 1fr;
    gap: 1.5rem;
  }
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
`







const GamePage = () => {
  const { gameId } = useParams()
  const navigate = useNavigate()
  const { address, isMobile, chain } = useWallet()
  const { showSuccess, showError, showInfo } = useToast()

  // Tab state for chat/offers


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
    countdownInterval,
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
    getGameNFTTokenId,
    contractInitialized
  } = useGameState(gameId, address)

  // WebSocket management
  const { wsConnected, wsRef, webSocketService } = useWebSocket(gameId, address, gameData)



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
    handleGameCompleted,
    loadGameData,
    playerChoices
  )

  // Debug logging
  useEffect(() => {
    if (gameData) {
      console.log('🎮 Game Data Loaded:', {
        status: gameData.status,
        challenger: gameData.challenger,
        creator: gameData.creator,
        currentUser: address,
        isChallenger: gameData.challenger?.toLowerCase() === address?.toLowerCase(),
        depositTimeLeft,
        ethAmount
      })
    }
  }, [gameData, address, depositTimeLeft, ethAmount])

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

            {/* Payment Section - Show prominently when deposit is needed */}
            {gameData?.status === 'waiting_challenger_deposit' && 
             gameData?.challenger && 
             address && 
             gameData.challenger.toLowerCase() === address.toLowerCase() && (
              <div style={{ 
                marginBottom: '2rem',
                padding: '1.5rem',
                background: 'rgba(255, 20, 147, 0.1)',
                border: '2px solid #FF1493',
                borderRadius: '1rem',
                animation: 'pulse 2s infinite'
              }}>
                <GamePayment 
                  gameData={gameData}
                  gameId={gameId}
                  address={address}
                  depositTimeLeft={depositTimeLeft}
                  ethAmount={ethAmount}
                  contractInitialized={true}
                  countdownInterval={countdownInterval}
                  getGameCreator={getGameCreator}
                  getGameJoiner={getGameJoiner}
                  getGamePrice={getGamePrice}
                  getGameNFTImage={getGameNFTImage}
                  getGameNFTName={getGameNFTName}
                  getGameNFTCollection={getGameNFTCollection}
                  isCreator={isCreator}
                  isJoiner={() => gameData?.challenger && address && 
                    gameData.challenger.toLowerCase() === address.toLowerCase()}
                  formatTimeLeft={formatTimeLeft}
                  startDepositCountdown={startDepositCountdown}
                  loadGameData={loadGameData}
                />
              </div>
            )}

            {/* Show countdown for creator */}
            {gameData?.status === 'waiting_challenger_deposit' && 
             gameData?.creator && 
             address && 
             gameData.creator.toLowerCase() === address.toLowerCase() && 
             depositTimeLeft !== null && (
              <div style={{
                marginBottom: '2rem',
                padding: '1rem',
                background: 'rgba(255, 165, 0, 0.1)',
                border: '2px solid #ffa500',
                borderRadius: '1rem'
              }}>
                <h4 style={{ color: '#ffa500', margin: '0 0 0.5rem 0' }}>
                  ⏰ Waiting for Challenger to Deposit
                </h4>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: depositTimeLeft < 30 ? '#ff0000' : '#ffa500' }}>
                  {formatTimeLeft(depositTimeLeft)}
                </div>
                <p style={{ fontSize: '0.8rem', color: '#CCCCCC', margin: '0.5rem 0 0 0' }}>
                  If challenger doesn't deposit, listing will reopen for new offers
                </p>
              </div>
            )}

            <ThreeContainerLayout>
              {/* Combined Game Status & NFT Details Container */}
              <GameStatusAndNFTContainer 
                gameData={gameData}
                isCreator={isCreator}
                currentTurn={gameState.currentTurn}
                nftData={{
                  name: getGameNFTName(),
                  image: getGameNFTImage(),
                  contract_address: getGameNFTContract(),
                  token_id: getGameNFTTokenId(),
                  verified: gameData?.nft_verified
                }}
                currentChain={chain?.name?.toLowerCase() || 'base'}
              />

              {/* Chat Container */}
              <ChatContainer 
                gameId={gameId}
                gameData={gameData}
                isCreator={isCreator}
                connected={wsConnected}
              />

              {/* Offers Container */}
              <OffersContainer 
                gameId={gameId}
                gameData={gameData}
                socket={wsRef}
                connected={wsConnected}
                onOfferSubmitted={(offerData) => {
                  console.log('Offer submitted via offers container:', offerData)
                }}
                onOfferAccepted={(offer) => {
                  console.log('Offer accepted via offers container:', offer)
                }}
              />
            </ThreeContainerLayout>

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