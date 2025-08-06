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

  // Tab state for chat/offers
  const [activeTab, setActiveTab] = useState('chat')
  const [cryptoOffer, setCryptoOffer] = useState('')
  const [isSubmittingOffer, setIsSubmittingOffer] = useState(false)

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

  // Handle crypto offer submission
  const handleSubmitCryptoOffer = async () => {
    console.log('🔍 handleSubmitCryptoOffer called with:', { cryptoOffer, wsConnected, isSubmittingOffer })
    
    if (!cryptoOffer.trim() || !wsConnected || isSubmittingOffer) {
      console.log('❌ Early return - conditions not met')
      return
    }

    setIsSubmittingOffer(true)
    try {
      const offerAmount = parseFloat(cryptoOffer)
      if (isNaN(offerAmount) || offerAmount <= 0) {
        showError('Please enter a valid positive number for the crypto offer')
        return
      }

      // Send offer through WebSocket with correct structure
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        const offerMessage = {
          type: 'crypto_offer',
          gameId: gameId,
          offererAddress: address,
          cryptoAmount: offerAmount,
          timestamp: new Date().toISOString()
        }
        
        console.log('📤 Sending crypto offer:', offerMessage)
        console.log('🔌 WebSocket state:', wsRef.current.readyState)
        wsRef.current.send(JSON.stringify(offerMessage))
        console.log('✅ Offer sent successfully')
      } else {
        console.log('❌ WebSocket not ready:', { 
          hasRef: !!wsRef.current, 
          readyState: wsRef.current?.readyState 
        })
      }

      // Clear the input
      setCryptoOffer('')
      showSuccess('Crypto offer submitted successfully!')
    } catch (error) {
      console.error('Error submitting crypto offer:', error)
      showError('Failed to submit crypto offer. Please try again.')
    } finally {
      setIsSubmittingOffer(false)
    }
  }

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
                     <strong>Coin:</strong> {gameCoin?.name || 'Classic'}
                   </p>
                   <p style={{ margin: '0 0 0.5rem 0', color: '#CCCCCC', fontSize: '1rem' }}>
                     <strong>Type:</strong> {gameCoin?.material?.name || 'Poker Chip'}
                   </p>
                 </div>
                 
                 {/* Game Status - Removed Status and Type display */}
                 <div style={{ marginTop: 'auto' }}>
                   {/* Status and Type information removed as requested */}
                 </div>
                 
                 {/* Share Buttons */}
                 <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
                   <p style={{ margin: '0 0 0.75rem 0', color: '#CCCCCC', fontSize: '1rem', textAlign: 'center' }}>
                     <strong>Share this game:</strong>
                   </p>
                   <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                     <button
                       onClick={() => {
                         const gameUrl = `${window.location.origin}/game/${gameId}`
                         const shareText = `🎮 Join my Flip on Flipnosis!!!\n\n💎 ${getGameNFTName()} vs $${(getGamePrice() || 0).toFixed(2)} USD\n\n🔥 Bidding is live! Click to join now!\n\n${gameUrl}\n\n#FLIPNOSIS #NFTGaming #Web3`
                         const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`
                         window.open(url, '_blank', 'width=600,height=400')
                       }}
                       style={{
                         background: 'linear-gradient(45deg, #1DA1F2, #0d8bd9)',
                         color: 'white',
                         border: 'none',
                         borderRadius: '0.5rem',
                         padding: '0.75rem 1rem',
                         cursor: 'pointer',
                         fontSize: '0.9rem',
                         fontWeight: 'bold',
                         display: 'flex',
                         alignItems: 'center',
                         gap: '0.5rem',
                         transition: 'all 0.2s ease',
                         minWidth: '120px',
                         justifyContent: 'center'
                       }}
                       onMouseOver={(e) => e.target.style.transform = 'scale(1.02)'}
                       onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
                     >
                       🐦 Share on X
                     </button>
                     
                     <button
                       onClick={() => {
                         const gameUrl = `${window.location.origin}/game/${gameId}`
                         const shareText = `🎮 Join my Flip on Flipnosis!!!\n\n💎 ${getGameNFTName()} vs $${(getGamePrice() || 0).toFixed(2)} USD\n\n🔥 Bidding is live! Click to join now!\n\n${gameUrl}`
                         const url = `https://t.me/share/url?url=${encodeURIComponent(gameUrl)}&text=${encodeURIComponent(shareText)}`
                         window.open(url, '_blank', 'width=600,height=400')
                       }}
                       style={{
                         background: 'linear-gradient(45deg, #0088cc, #006699)',
                         color: 'white',
                         border: 'none',
                         borderRadius: '0.5rem',
                         padding: '0.75rem 1rem',
                         cursor: 'pointer',
                         fontSize: '0.9rem',
                         fontWeight: 'bold',
                         display: 'flex',
                         alignItems: 'center',
                         gap: '0.5rem',
                         transition: 'all 0.2s ease',
                         minWidth: '120px',
                         justifyContent: 'center'
                       }}
                       onMouseOver={(e) => e.target.style.transform = 'scale(1.02)'}
                       onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
                     >
                       📱 Share on TG
                     </button>
                   </div>
                 </div>
               </NFTDetailsContainer>

                             <ChatOffersContainer>
                 {/* Tab Navigation */}
                 <div style={{ 
                   display: 'flex', 
                   marginBottom: '1rem',
                   borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
                 }}>
                   <button
                     onClick={() => setActiveTab('chat')}
                     style={{
                       flex: 1,
                       background: activeTab === 'chat' ? 'linear-gradient(45deg, #00BFFF, #0080FF)' : 'transparent',
                       color: activeTab === 'chat' ? '#000' : '#00BFFF',
                       border: 'none',
                       padding: '0.75rem 1rem',
                       fontSize: '1rem',
                       fontWeight: 'bold',
                       cursor: 'pointer',
                       borderBottom: activeTab === 'chat' ? '3px solid #00BFFF' : '3px solid transparent',
                       transition: 'all 0.3s ease'
                     }}
                   >
                     💬 Chat
                   </button>
                                       <button
                      onClick={() => setActiveTab('offers')}
                      style={{
                        flex: 1,
                        background: activeTab === 'offers' ? 'linear-gradient(45deg, #00FF41, #00CC33)' : 'transparent',
                        color: activeTab === 'offers' ? '#000' : '#00FF41',
                        border: 'none',
                        padding: '0.75rem 1rem',
                        fontSize: '1rem',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        borderBottom: activeTab === 'offers' ? '3px solid #00FF41' : '3px solid transparent',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      💰 Offers
                    </button>
                 </div>

                 {/* Tab Content */}
                 <div style={{ flex: '1', display: 'flex', flexDirection: 'column' }}>
                   {activeTab === 'chat' ? (
                     <UnifiedGameChat 
                       gameId={gameId}
                       gameData={gameData}
                       isCreator={isCreator}
                       socket={wsRef}
                       connected={wsConnected}
                       offeredNFTs={offers}
                       showChatInput={true}
                       showOffersInput={false}
                       onOfferSubmitted={(offerData) => {
                         console.log('Offer submitted via unified chat:', offerData)
                         // Handle offer submission if needed
                       }}
                       onOfferAccepted={(offer) => {
                         console.log('Offer accepted via unified chat:', offer)
                         // Handle offer acceptance if needed
                       }}
                     />
                   ) : (
                     <div style={{ 
                       flex: '1', 
                       display: 'flex', 
                       flexDirection: 'column',
                       height: '100%'
                     }}>
                       {/* Offers Messages Display */}
                       <div style={{ 
                         flex: '1', 
                         overflowY: 'auto',
                         marginBottom: '1rem',
                         paddingRight: '0.5rem'
                       }}>
                         <UnifiedGameChat 
                           gameId={gameId}
                           gameData={gameData}
                           isCreator={isCreator}
                           socket={wsRef}
                           connected={wsConnected}
                           offeredNFTs={offers}
                           showChatInput={false}
                           showOffersInput={false}
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
                       
                                               {/* Offers Input Section */}
                        <div style={{
                          padding: '1rem',
                          background: 'rgba(0, 0, 0, 0.3)',
                          borderRadius: '0.75rem',
                          border: '1px solid rgba(0, 255, 65, 0.3)'
                        }}>

                         <div style={{ display: 'flex', gap: '0.75rem' }}>
                           <input
                             type="text"
                             value={cryptoOffer}
                             onChange={(e) => {
                               // Only allow digits and decimal point
                               const value = e.target.value.replace(/[^0-9.]/g, '')
                               // Prevent multiple decimal points
                               const parts = value.split('.')
                               if (parts.length <= 2) {
                                 setCryptoOffer(value)
                               }
                             }}
                             placeholder="Enter USD amount..."
                             style={{
                               flex: 1,
                               background: 'rgba(255, 255, 255, 0.1)',
                               border: '1px solid rgba(255, 255, 255, 0.2)',
                               borderRadius: '0.5rem',
                               padding: '0.75rem',
                               color: '#fff',
                               fontSize: '0.9rem'
                             }}
                             onKeyPress={(e) => e.key === 'Enter' && handleSubmitCryptoOffer()}
                           />
                                                       <button
                              onClick={() => {
                                console.log('🔘 Make Offer button clicked!')
                                handleSubmitCryptoOffer()
                              }}
                              disabled={!wsConnected || !cryptoOffer.trim() || isSubmittingOffer}
                              style={{
                                background: 'linear-gradient(45deg, #00FF41, #00CC33)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '0.5rem',
                                padding: '0.75rem 1.5rem',
                                cursor: 'pointer',
                                fontSize: '0.9rem',
                                fontWeight: 'bold',
                                transition: 'all 0.2s ease',
                                opacity: (!wsConnected || !cryptoOffer.trim() || isSubmittingOffer) ? 0.5 : 1
                              }}
                            >
                              {isSubmittingOffer ? 'Submitting...' : 'Make Offer'}
                            </button>
                         </div>
                         
                       </div>
                     </div>
                   )}
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