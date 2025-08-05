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
import UnifiedGameChat from '../UnifiedGameChat'

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
    grid-template-rows: auto auto;
  }
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
`

const GameStatusContainer = styled.div`
  background: rgba(0, 0, 40, 0.95);
  padding: 1.5rem;
  border-radius: 1rem;
  border: 2px solid #00FF41;
  backdrop-filter: blur(10px);
  box-shadow: 0 0 30px rgba(0, 255, 65, 0.3), inset 0 0 20px rgba(0, 255, 65, 0.1);
  min-height: 400px;
  display: flex;
  flex-direction: column;
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

const NFTDetailsContainer = styled.div`
  background: rgba(0, 0, 40, 0.95);
  padding: 1.5rem;
  border-radius: 1rem;
  border: 2px solid #FFD700;
  backdrop-filter: blur(10px);
  box-shadow: 0 0 30px rgba(255, 215, 0, 0.3), inset 0 0 20px rgba(255, 215, 0, 0.1);
  min-height: 400px;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(45deg, transparent 30%, rgba(255, 215, 0, 0.1) 50%, transparent 70%);
    animation: shimmer 3s ease-in-out infinite;
    pointer-events: none;
  }
`

const ChatOffersContainer = styled.div`
  background: rgba(0, 0, 40, 0.95);
  padding: 1.5rem;
  border-radius: 1rem;
  border: 2px solid #00BFFF;
  backdrop-filter: blur(10px);
  box-shadow: 0 0 30px rgba(0, 191, 255, 0.3), inset 0 0 20px rgba(0, 191, 255, 0.1);
  min-height: 400px;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(45deg, transparent 30%, rgba(0, 191, 255, 0.1) 50%, transparent 70%);
    animation: shimmer 3s ease-in-out infinite;
    pointer-events: none;
  }
  
  @media (max-width: 1200px) {
    grid-column: 1 / -1;
  }
`

const StatusSection = styled.div`
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.1) 0%, rgba(255, 215, 0, 0.05) 100%);
  padding: 1rem;
  border-radius: 0.75rem;
  border: 1px solid rgba(255, 215, 0, 0.3);
  margin-bottom: 1rem;
  text-align: center;
`

const PlayerSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  flex: 1;
`

const PlayerInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem;
  background: ${props => props.isActive ? 'rgba(255, 215, 0, 0.1)' : 'rgba(255, 255, 255, 0.05)'};
  border-radius: 0.5rem;
  border: ${props => props.isActive ? '1px solid rgba(255, 215, 0, 0.3)' : '1px solid rgba(255, 255, 255, 0.1)'};
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

                         <ThreeContainerLayout>
               <GameStatusContainer>
                 <h4 style={{ color: '#FFD700', margin: '0 0 1rem 0', fontSize: '1.2rem', textAlign: 'center' }}>
                   Game Status
                 </h4>

                 {/* Game Phase Status */}
                 <StatusSection>
                   <h5 style={{ color: '#FFD700', margin: '0 0 0.5rem 0', fontSize: '1rem' }}>
                     Phase
                   </h5>
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
                 </StatusSection>

                 {/* Players Section */}
                 <PlayerSection>
                   <PlayerInfo isActive={isCreator()}>
                     <div>
                       <ProfilePicture 
                         address={getGameCreator()}
                         size={50}
                         showAddress={true}
                       />
                     </div>
                     <div style={{ flex: '1' }}>
                       <h5 style={{ color: '#FFD700', margin: '0 0 0.25rem 0', fontSize: '1rem' }}>Creator</h5>
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
                   </PlayerInfo>

                   <PlayerInfo isActive={isJoiner()}>
                     <div>
                       <ProfilePicture 
                         address={getGameJoiner()}
                         size={50}
                         showAddress={true}
                       />
                     </div>
                     <div style={{ flex: '1' }}>
                       <h5 style={{ color: '#FFD700', margin: '0 0 0.25rem 0', fontSize: '1rem' }}>Joiner</h5>
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
                   </PlayerInfo>
                 </PlayerSection>
               </GameStatusContainer>

                             <NFTDetailsContainer>
                 <h4 style={{ color: '#FFD700', margin: '0 0 1rem 0', fontSize: '1.2rem', textAlign: 'center' }}>
                   NFT Details
                 </h4>
                 
                 {/* NFT Image and Info */}
                 <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '1.5rem' }}>
                   <img 
                     src={getGameNFTImage()} 
                     alt={getGameNFTName()} 
                     style={{ 
                       width: '100px', 
                       height: '100px', 
                       borderRadius: '0.75rem',
                       border: '3px solid #FFD700'
                     }} 
                   />
                   <div>
                     <h5 style={{ margin: '0 0 0.75rem 0', color: '#FFFFFF', fontSize: '1.3rem', fontWeight: 'bold' }}>
                       {getGameNFTName()}
                     </h5>
                     <p style={{ margin: '0', color: '#CCCCCC', fontSize: '1.1rem' }}>
                       {getGameNFTCollection()}
                     </p>
                   </div>
                 </div>
                 
                 {/* Game Details */}
                 <div style={{ marginBottom: '1.5rem' }}>
                   <p style={{ margin: '0 0 0.75rem 0', color: '#CCCCCC', fontSize: '1.1rem' }}>
                     <strong>Creator:</strong> {getGameCreator().slice(0, 6)}...{getGameCreator().slice(-4)}
                   </p>
                   {getGameJoiner() && (
                     <p style={{ margin: '0 0 0.75rem 0', color: '#CCCCCC', fontSize: '1.1rem' }}>
                       <strong>Player:</strong> {getGameJoiner().slice(0, 6)}...{getGameJoiner().slice(-4)}
                     </p>
                   )}
                   <p style={{ margin: '0 0 0.75rem 0', color: '#FFD700', fontSize: '1.4rem', fontWeight: 'bold' }}>
                     Price: ${(getGamePrice() || 0).toFixed(2)} USD
                   </p>
                   <p style={{ margin: '0', color: '#CCCCCC', fontSize: '1.1rem' }}>
                     <strong>Chain:</strong> Base (ETH)
                   </p>
                 </div>
                 
                 {/* External Links */}
                 {getGameNFTContract() && getGameNFTTokenId() && (
                   <div style={{ marginBottom: '1.5rem' }}>
                     <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem' }}>
                       <a 
                         href={`https://basescan.org/token/${getGameNFTContract()}?a=${getGameNFTTokenId()}`}
                         target="_blank"
                         rel="noopener noreferrer"
                         style={{
                           background: '#00BFFF',
                           color: '#000',
                           padding: '0.5rem 1rem',
                           borderRadius: '0.5rem',
                           textDecoration: 'none',
                           fontSize: '1rem',
                           fontWeight: 'bold'
                         }}
                       >
                         Explorer
                       </a>
                       <a 
                         href={`https://opensea.io/assets/base/${getGameNFTContract()}/${getGameNFTTokenId()}`}
                         target="_blank"
                         rel="noopener noreferrer"
                         style={{
                           background: '#00FF41',
                           color: '#000',
                           padding: '0.5rem 1rem',
                           borderRadius: '0.5rem',
                           textDecoration: 'none',
                           fontSize: '1rem',
                           fontWeight: 'bold'
                         }}
                       >
                         OpenSea
                       </a>
                     </div>
                   </div>
                 )}
                 
                 {/* Coin Display */}
                 <div style={{ marginBottom: '1rem' }}>
                   <p style={{ margin: '0 0 0.5rem 0', color: '#CCCCCC', fontSize: '1rem' }}>
                     <strong>Coin:</strong> Custom Design
                   </p>
                 </div>
                 
                 {/* Game Status - Removed Status and Type display */}
                 <div style={{ marginTop: 'auto' }}>
                   {/* Status and Type information removed as requested */}
                 </div>
               </NFTDetailsContainer>

                             <ChatOffersContainer>
                 <h4 style={{ color: '#00BFFF', margin: '0 0 1rem 0', fontSize: '1.2rem', textAlign: 'center' }}>
                   Chat & Offers
                 </h4>
                 <div style={{ flex: '1', display: 'flex', flexDirection: 'column' }}>
                   <UnifiedGameChat 
                     gameId={gameId}
                     gameData={gameData}
                     isCreator={isCreator}
                     socket={wsRef}
                     connected={wsConnected}
                     offeredNFTs={offers}
                     onOfferSubmitted={(offerData) => {
                       console.log('Offer submitted via unified chat:', offerData)
                       // Handle offer submission if needed
                     }}
                     onOfferAccepted={(offer) => {
                       console.log('Offer accepted via unified chat:', offer)
                       // Handle offer acceptance if needed
                     }}
                   />
                 </div>
               </ChatOffersContainer>
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