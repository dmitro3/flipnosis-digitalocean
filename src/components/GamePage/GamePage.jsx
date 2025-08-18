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
import GameCountdown from './GameCountdown' // NEW
import GameRoom from './GameRoom' // NEW

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
  console.log('🚀 GAMEPAGE COMPONENT LOADED - DEPLOYMENT TEST SUCCESSFUL!')
  
  const { gameId } = useParams()
  const navigate = useNavigate()
  const { address, isMobile, chain } = useWallet()
  const { showSuccess, showError, showInfo } = useToast()
  
  // Add new state for game phases
  const [showCountdown, setShowCountdown] = useState(false)
  const [inGameRoom, setInGameRoom] = useState(false)
  const [countdownTriggered, setCountdownTriggered] = useState(false)

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
    playerChoices,
    startRoundCountdown
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
        ethAmount,
        creator_deposited: gameData.creator_deposited,
        challenger_deposited: gameData.challenger_deposited,
        joiner: gameData.joiner
      })
    }
  }, [gameData, address, depositTimeLeft, ethAmount])
  
  // NEW: Watch for game starting (both players deposited)
  useEffect(() => {
    console.log('🔍 Countdown useEffect running...')
    console.log('🔍 gameData exists:', !!gameData)
    console.log('🔍 gameData keys:', gameData ? Object.keys(gameData) : 'no gameData')
    
    // Debug logging to see what's happening
    console.log('🔍 Countdown Debug:', {
      gameData: gameData,
      status: gameData?.status,
      creator_deposited: gameData?.creator_deposited,
      challenger_deposited: gameData?.challenger_deposited,
      countdownTriggered: countdownTriggered,
      isCreator: isCreator(),
      isJoiner: isJoiner(),
      address: address
    })
    
    // Check if game is active and both players have deposited
    if (gameData?.status === 'active' && 
        gameData?.creator_deposited && 
        gameData?.challenger_deposited &&
        !countdownTriggered) {
      
      // Only show countdown for the two players
      const isPlayer = isCreator() || isJoiner() || 
                      (gameData?.challenger && address && 
                       gameData.challenger.toLowerCase() === address.toLowerCase())
      
      console.log('🎯 Countdown conditions met:', {
        isPlayer: isPlayer,
        isCreator: isCreator(),
        isJoiner: isJoiner(),
        challengerMatch: gameData?.challenger && address && 
                        gameData.challenger.toLowerCase() === address.toLowerCase()
      })
      
      if (isPlayer) {
        console.log('🚀 Game starting! Showing countdown...')
        setCountdownTriggered(true)
        setShowCountdown(true)
      }
    }
  }, [gameData, address, isCreator, isJoiner, countdownTriggered])
  
  // NEW: Handle countdown completion
  const handleCountdownComplete = () => {
    console.log('⚔️ Countdown complete! Entering game room...')
    setShowCountdown(false)
    setInGameRoom(true)
    showInfo('Game started! Choose heads or tails!')
    
    // Start the first round countdown
    if (gameData?.status === 'active') {
      startRoundCountdown()
    }
  }

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
  
  // Check if current user is a player
  const isPlayer = isCreator() || isJoiner() || 
                  (gameData?.challenger && address && 
                   gameData.challenger.toLowerCase() === address.toLowerCase())
  
  // NEW: Render countdown overlay
  if (showCountdown) {
    return (
      <>
        <Container>
          <GameBackground />
        </Container>
        <GameCountdown
          isVisible={showCountdown}
          onComplete={handleCountdownComplete}
          creatorAddress={getGameCreator()}
          challengerAddress={getGameJoiner()}
          currentUserAddress={address}
        />
      </>
    )
  }
  
  // NEW: Render Game Room for active players
  if (inGameRoom && isPlayer && gameData?.status === 'active') {
    return (
      <ThemeProvider theme={theme}>
        <GameRoom
          gameData={gameData}
          gameState={gameState}
          playerChoices={playerChoices}
          isCreator={isCreator}
          isJoiner={isJoiner}
          getGameCreator={getGameCreator}
          getGameJoiner={getGameJoiner}
          isMyTurn={isMyTurn}
          handlePlayerChoice={handlePlayerChoice}
          handlePowerChargeStart={handlePowerChargeStart}
          handlePowerChargeStop={handlePowerChargeStop}
          roundCountdown={roundCountdown}
        >
          {/* Pass the coin as a child */}
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
        </GameRoom>
        
        {/* Game Result Popup */}
        {showResultPopup && resultData && (
          <GameResultPopup
            resultData={resultData}
            onClose={resetForNextRound}
            onClaimWinnings={resetForNextRound}
          />
        )}
      </ThemeProvider>
    )
  }

  // Regular lobby view for non-players or pre-game
  return (
    <ThemeProvider theme={theme}>
      <Container>
        <GameBackground />
        <GameContainer>
          <GameLayout>

            
            {/* Payment Section - Only show during payment phase */}
            {(gameData?.status === 'waiting_challenger_deposit' || 
              gameData?.status === 'pending') && (
              <GamePayment
                gameData={gameData}
                gameId={gameId}
                address={address}
                isCreator={isCreator}
                isJoiner={isJoiner}
                depositTimeLeft={depositTimeLeft}
                formatTimeLeft={formatTimeLeft}
                ethAmount={ethAmount}
                getGamePrice={getGamePrice}
                getGameNFTImage={getGameNFTImage}
                getGameNFTName={getGameNFTName}
                getGameNFTCollection={getGameNFTCollection}
                contractInitialized={contractInitialized}
                loadGameData={loadGameData}
              />
            )}
            
            {/* Show coin in lobby (spinning slowly) */}
            {gameData?.status !== 'completed' && (
              <div style={{ 
                opacity: 0.7, 
                transform: 'scale(0.8)',
                animation: 'float 4s ease-in-out infinite'
              }}>
                <GameCoin
                  gameId={gameId}
                  gameState={{ ...gameState, phase: 'waiting' }}
                  streamedCoinState={streamedCoinState}
                  flipAnimation={null}
                  customHeadsImage={customHeadsImage}
                  customTailsImage={customTailsImage}
                  gameCoin={gameCoin}
                  isMobile={isMobile}
                  onPowerChargeStart={() => {}}
                  onPowerChargeStop={() => {}}
                  isMyTurn={() => false}
                  address={address}
                  isCreator={isCreator}
                />
              </div>
            )}
            
            {/* Two Column Layout for NFT Details and Player 2 Info */}
            <ThreeContainerLayout>
              {/* NFT Details Container (Player 1 side) */}
              <div style={{
                background: 'rgba(0, 0, 20, 0.95)',
                border: '2px solid #FFD700',
                borderRadius: '1rem',
                padding: '1rem',
                height: '500px',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 0 30px rgba(255, 215, 0, 0.3)',
                overflow: 'hidden',
                gridColumn: '1',
                gridRow: '1'
              }}>
                <GameStatusAndNFTContainer
                  gameData={gameData}
                  isCreator={isCreator()}
                  currentTurn={gameState?.currentPlayer}
                  nftData={{
                    image: getGameNFTImage(),
                    name: getGameNFTName(),
                    collection: getGameNFTCollection()
                  }}
                  currentChain={chain}
                />
              </div>
              
              {/* Offers Container (Player 2 side) - Show for games that accept offers */}
              <div style={{ gridColumn: '2', gridRow: '1' }}>
                {(gameData?.status === 'listing' || 
                  gameData?.status === 'waiting_challenger' || 
                  gameData?.status === 'awaiting_challenger' || 
                  gameData?.status === 'waiting_for_challenger' || 
                  gameData?.status === 'open') ? (
                  <OffersContainer
                    gameId={gameId}
                    gameData={gameData}
                    socket={wsRef}
                    connected={wsConnected}
                  />
                ) : (
                  <div style={{
                  background: 'rgba(0, 0, 20, 0.95)',
                  border: '2px solid #FFD700',
                  borderRadius: '1rem',
                  padding: '1rem',
                  height: '500px',
                  display: 'flex',
                  flexDirection: 'column',
                  boxShadow: '0 0 30px rgba(255, 215, 0, 0.3)'
                }}>
                  <h4 style={{ margin: '0 0 1rem 0', color: '#FFD700' }}>Game Info</h4>
                  <div style={{ flex: 1, color: '#CCCCCC' }}>
                    <p style={{ margin: '0 0 0.5rem 0' }}>
                      <strong>Creator:</strong> {getGameCreator().slice(0, 6)}...{getGameCreator().slice(-4)}
                    </p>
                    {getGameJoiner() && (
                      <p style={{ margin: '0 0 0.5rem 0' }}>
                        <strong>Player:</strong> {getGameJoiner().slice(0, 6)}...{getGameJoiner().slice(-4)}
                      </p>
                    )}
                    <p style={{ margin: '0 0 0.5rem 0', color: '#FFD700', fontSize: '1.2rem', fontWeight: 'bold' }}>
                      Price: ${(getGamePrice() || 0).toFixed(2)} USD
                    </p>
                    <p style={{ margin: '0', fontSize: '0.9rem' }}>
                      <strong>Chain:</strong> Base (ETH)
                    </p>
                    <p style={{ margin: '1rem 0 0 0', fontSize: '0.9rem' }}>
                      <strong>Status:</strong> {gameData?.status || 'Unknown'}
                    </p>
                  </div>
                </div>
              )}
              </div>
              
              {/* Chat Container - Below Player 2 */}
              <ChatBelowPlayer2>
                <ChatContainer
                  gameId={gameId}
                  address={address}
                  messages={chatMessages}
                />
              </ChatBelowPlayer2>
            </ThreeContainerLayout>
          </GameLayout>
        </GameContainer>
      </Container>
    </ThemeProvider>
  )
}

export default GamePage 