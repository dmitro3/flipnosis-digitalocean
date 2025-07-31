// 1. React imports first
import React, { useState, useEffect, useRef } from 'react'

// 2. Third-party imports
import { useParams, useNavigate } from 'react-router-dom'
import { ThemeProvider } from '@emotion/react'
import styled from '@emotion/styled'

// 3. Context imports
import { useWallet } from '../contexts/WalletContext'
import { useToast } from '../contexts/ToastContext'

// 4. Service imports
import contractService from '../services/ContractService'
import { useContractService } from '../utils/useContractService'

// 5. Component imports
import OptimizedGoldCoin from './OptimizedGoldCoin'
import PowerDisplay from '../components/PowerDisplay'
import GameResultPopup from './GameResultPopup'
import ProfilePicture from './ProfilePicture'
import GameChatBox from './GameChatBox'
import NFTOfferComponent from './NFTOfferComponent'

// 6. Style imports
import { theme } from '../styles/theme'
import { API_CONFIG, getApiUrl, getWsUrl } from '../config/api'
import { LoadingSpinner } from '../styles/components'

// 7. Asset imports last
import hazeVideo from '../../Images/Video/haze.webm'
import mobileVideo from '../../Images/Video/Mobile/mobile.webm'

// Styled Components
const Container = styled.div`
  min-height: 100vh;
  position: relative;
  z-index: 1;
`

const BackgroundVideo = styled.video`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  object-fit: cover;
  z-index: -1;
  opacity: 0.7;
  pointer-events: none;
`

const GameContainer = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
  
  @media (max-width: 768px) {
    padding: 1rem;
  }
`

const PaymentSection = styled.div`
  background: rgba(0, 0, 20, 0.95);
  border: 2px solid ${props => props.theme.colors.neonPink};
  border-radius: 1.5rem;
  padding: 2rem;
  margin-bottom: 2rem;
  text-align: center;
  box-shadow: 0 0 30px rgba(255, 20, 147, 0.3);
  
  @media (max-width: 768px) {
    padding: 1rem;
  }
`

const NFTPreview = styled.div`
  display: flex;
  align-items: center;
  gap: 2rem;
  margin-bottom: 2rem;
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 1rem;
  }
`

const NFTImage = styled.img`
  width: 120px;
  height: 120px;
  border-radius: 1rem;
  border: 2px solid #FFD700;
  box-shadow: 0 0 20px rgba(255, 215, 0, 0.3);
`

const GameSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rem;
  margin-top: 2rem;
`

const PlayerSection = styled.div`
  display: flex;
  justify-content: space-between;
  width: 100%;
  max-width: 800px;
  gap: 2rem;
  
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: center;
  }
`

const PlayerCard = styled.div`
  background: rgba(0, 0, 0, 0.6);
  padding: 1rem;
  border-radius: 1rem;
  border: 2px solid #FFD700;
  text-align: center;
  flex: 1;
`

const ChatSection = styled.div`
  width: 100%;
  max-width: 400px;
  margin-top: 2rem;
`

const OfferSection = styled.div`
  width: 100%;
  max-width: 500px;
  margin-top: 2rem;
`

const UnifiedGamePage = () => {
  const { gameId } = useParams()
  const navigate = useNavigate()
  const { address, isConnected, walletClient, publicClient } = useWallet()
  const { showSuccess, showError, showInfo } = useToast()
  const { isInitialized: contractInitialized } = useContractService()
  
  // Game state - moved up to avoid initialization error
  const [gameState, setGameState] = useState({
    phase: 'waiting', // waiting, choosing, charging, completed
    currentRound: 1,
    creatorChoice: null,
    joinerChoice: null,
    creatorPower: 0,
    joinerPower: 0,
    creatorWins: 0,
    joinerWins: 0,
    chargingPlayer: null
  })
  
  const [readyNFTStatus, setReadyNFTStatus] = useState({ ready: false, nft: null })
  
  // Coin state
  const [flipAnimation, setFlipAnimation] = useState(null)
  const [customHeadsImage, setCustomHeadsImage] = useState(null)
  const [customTailsImage, setCustomTailsImage] = useState(null)
  
  // Game data and WebSocket state
  const [gameData, setGameData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [wsConnected, setWsConnected] = useState(false)
  const [wsRef, setWsRef] = useState(null)
  
  // UI state
  const [showResultPopup, setShowResultPopup] = useState(false)
  const [resultData, setResultData] = useState(null)
  const [messages, setMessages] = useState([])
  const [offers, setOffers] = useState([])
  const [showOfferReviewModal, setShowOfferReviewModal] = useState(false)
  const [pendingNFTOffer, setPendingNFTOffer] = useState(null)
  
  // Load game data
  const loadGameData = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${getApiUrl()}/api/games/${gameId}`)
      
      if (!response.ok) {
        throw new Error('Failed to load game data')
      }
      
      const data = await response.json()
      setGameData(data)
      
      // Initialize WebSocket connection
      initializeWebSocket()
      
    } catch (err) {
      console.error('Error loading game data:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }
  
  // Initialize WebSocket connection
  const initializeWebSocket = () => {
    const ws = new WebSocket(getWsUrl())
    
    ws.onopen = () => {
      console.log('🔌 WebSocket connected')
      setWsConnected(true)
      
      // Subscribe to game updates
      ws.send(JSON.stringify({
        type: 'SUBSCRIBE_TO_GAME',
        gameId: gameId
      }))
    }
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        handleWebSocketMessage(data)
      } catch (err) {
        console.error('Error parsing WebSocket message:', err)
      }
    }
    
    ws.onclose = () => {
      console.log('🔌 WebSocket disconnected')
      setWsConnected(false)
      
      // Attempt to reconnect after 3 seconds
      setTimeout(() => {
        if (gameData) {
          initializeWebSocket()
        }
      }, 3000)
    }
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error)
      setWsConnected(false)
    }
    
    setWsRef(ws)
  }
  
  // Handle WebSocket messages
  const handleWebSocketMessage = (data) => {
    console.log('📨 WebSocket message received:', data)
    
    switch (data.type) {
      case 'GAME_UPDATE':
        setGameData(prev => ({ ...prev, ...data.gameData }))
        break
        
      case 'GAME_ACTION':
        handleGameAction(data)
        break
        
      case 'FLIP_RESULT':
        handleFlipResult(data.result)
        break
        
      case 'GAME_COMPLETED':
        handleGameCompleted(data)
        break
        
      case 'CHAT_MESSAGE':
        setMessages(prev => [...prev, data.message])
        break
        
      case 'NFT_OFFER':
        setOffers(prev => [...prev, data.offer])
        break
        
      default:
        console.log('Unknown WebSocket message type:', data.type)
    }
  }
  
  // Handle game actions
  const handleGameAction = (data) => {
    switch (data.action) {
      case 'CHOICE_MADE':
        setGameState(prev => ({
          ...prev,
          phase: 'charging',
          chargingPlayer: data.player
        }))
        break
        
      case 'POWER_CHARGED':
        setGameState(prev => ({
          ...prev,
          phase: 'round_active',
          chargingPlayer: null
        }))
        break
        
      case 'ROUND_COMPLETED':
        setGameState(prev => ({
          ...prev,
          phase: 'waiting',
          currentRound: prev.currentRound + 1,
          creatorChoice: null,
          joinerChoice: null
        }))
        break
        
      default:
        console.log('Unknown game action:', data.action)
    }
  }
  
  // Handle flip result
  const handleFlipResult = (result) => {
    setFlipAnimation(result)
    
    setTimeout(() => {
      setFlipAnimation(null)
      setResultData({
        isWinner: result.winner === address,
        flipResult: result.result,
        playerChoice: result.playerChoice
      })
      setShowResultPopup(true)
    }, 3000)
  }
  
  // Handle game completed
  const handleGameCompleted = (data) => {
    setGameState(prev => ({
      ...prev,
      phase: 'completed'
    }))
    
    setResultData({
      isWinner: data.winner === address,
      flipResult: data.finalResult,
      playerChoice: data.playerChoice,
      isGameComplete: true
    })
    setShowResultPopup(true)
  }
  
  // Game actions
  const handlePlayerChoice = (choice) => {
    if (!wsRef || !wsConnected) {
      showError('Not connected to game server')
      return
    }
    
    setGameState(prev => ({
      ...prev,
      phase: 'charging',
      creatorChoice: address === getGameCreator() ? choice : prev.creatorChoice,
      joinerChoice: address === getGameJoiner() ? choice : prev.joinerChoice
    }))
    
    wsRef.send(JSON.stringify({
      type: 'GAME_ACTION',
      gameId: gameId,
      action: 'MAKE_CHOICE',
      choice: choice,
      player: address
    }))
  }
  
  const handlePowerChargeStart = () => {
    setGameState(prev => ({
      ...prev,
      chargingPlayer: address
    }))
  }
  
  const handlePowerChargeStop = async (powerLevel) => {
    if (!wsRef || !wsConnected) {
      showError('Not connected to game server')
      return
    }
    
    setGameState(prev => ({
      ...prev,
      chargingPlayer: null,
      creatorPower: address === getGameCreator() ? powerLevel : prev.creatorPower,
      joinerPower: address === getGameJoiner() ? powerLevel : prev.joinerPower
    }))
    
    wsRef.send(JSON.stringify({
      type: 'GAME_ACTION',
      gameId: gameId,
      action: 'POWER_CHARGED',
      powerLevel: powerLevel,
      player: address
    }))
  }
  
  // Helper functions to handle both game and listing data structures
  const getGameCreator = () => gameData?.creator || gameData?.creator_address
  const getGameJoiner = () => gameData?.challenger || gameData?.joiner || gameData?.joiner_address || gameData?.challenger_address
  const getGamePrice = () => gameData?.price || gameData?.priceUSD || gameData?.final_price || gameData?.asking_price || 0
  const getGameNFTImage = () => gameData?.nft?.image || gameData?.nft_image || gameData?.nftImage || '/placeholder-nft.svg'
  const getGameNFTName = () => gameData?.nft?.name || gameData?.nft_name || gameData?.nftName || 'Unknown NFT'
  const getGameNFTCollection = () => gameData?.nft?.collection || gameData?.nft_collection || gameData?.nftCollection || 'Unknown Collection'
  const getGameNFTContract = () => gameData?.nft?.contract || gameData?.nft_contract
  const getGameNFTTokenId = () => gameData?.nft?.tokenId || gameData?.nft_token_id
  
  // Check if user is the creator
  const isCreator = () => address === getGameCreator()
  
  // Check if user is the joiner
  const isJoiner = () => address === getGameJoiner()
  
  // Check if it's user's turn
  const isMyTurn = () => {
    if (gameState.phase === 'choosing') {
      return (isCreator() && !gameState.creatorChoice) || (isJoiner() && !gameState.joinerChoice)
    }
    if (gameState.phase === 'charging') {
      return gameState.chargingPlayer === address
    }
    return false
  }
  
  // Load game data on mount
  useEffect(() => {
    if (gameId) {
      loadGameData()
    }
    
    return () => {
      if (wsRef) {
        wsRef.close()
      }
    }
  }, [gameId])
  
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
  
  return (
    <ThemeProvider theme={theme}>
      <Container>
        {/* Background Video */}
        <BackgroundVideo autoPlay muted loop playsInline>
          <source src={window.innerWidth <= 768 ? mobileVideo : hazeVideo} type="video/webm" />
        </BackgroundVideo>
        
        <GameContainer>
          {/* Payment Section (if game is in waiting state) */}
          {gameState.phase === 'waiting' && !isCreator() && (
            <PaymentSection>
              <h2 style={{ color: '#FF1493', marginBottom: '1rem' }}>Join This Game</h2>
              <NFTPreview>
                <NFTImage src={getGameNFTImage()} alt={getGameNFTName()} />
                <div style={{ textAlign: 'left' }}>
                  <h3 style={{ color: 'white', marginBottom: '0.5rem' }}>{getGameNFTName()}</h3>
                  <p style={{ color: '#ccc', marginBottom: '0.5rem' }}>{getGameNFTCollection()}</p>
                  <p style={{ color: '#FFD700', fontWeight: 'bold' }}>
                    Price: ${(getGamePrice() / 1000000).toFixed(2)}
                  </p>
                </div>
              </NFTPreview>
              
              <button 
                onClick={() => {
                  // Handle join game logic
                  showInfo('Join game functionality will be implemented')
                }}
                style={{
                  padding: '1rem 2rem',
                  background: 'linear-gradient(45deg, #00FF41, #39FF14)',
                  color: '#000',
                  border: 'none',
                  borderRadius: '1rem',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '1.1rem'
                }}
              >
                Join Game - ${(getGamePrice() / 1000000).toFixed(2)}
              </button>
            </PaymentSection>
          )}
          
          {/* Player Section */}
          <PlayerSection>
            <PlayerCard>
              <h3 style={{ color: '#FFD700', marginBottom: '1rem' }}>Creator</h3>
              <ProfilePicture 
                address={getGameCreator()}
                size={80}
                showAddress={true}
              />
              <p style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: 'white' }}>
                Power: {gameState.creatorPower}
              </p>
              <p style={{ fontSize: '0.8rem', color: '#ccc' }}>
                Wins: {gameState.creatorWins}
              </p>
            </PlayerCard>
            
            <PlayerCard>
              <h3 style={{ color: '#FFD700', marginBottom: '1rem' }}>Joiner</h3>
              <ProfilePicture 
                address={getGameJoiner()}
                size={80}
                showAddress={true}
              />
              <p style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: 'white' }}>
                Power: {gameState.joinerPower}
              </p>
              <p style={{ fontSize: '0.8rem', color: '#ccc' }}>
                Wins: {gameState.joinerWins}
              </p>
            </PlayerCard>
          </PlayerSection>
          
          {/* Game Components Section */}
          <GameSection>
            <h2 style={{ color: '#FFD700', textAlign: 'center' }}>Round {gameState.currentRound}</h2>
            
            {/* Coin Component */}
            <div style={{ 
              background: 'rgba(0, 0, 0, 0.6)', 
              padding: '1rem', 
              borderRadius: '1rem',
              border: '2px solid #FFD700'
            }}>
              <OptimizedGoldCoin 
                isFlipping={flipAnimation !== null}
                flipResult={flipAnimation?.result}
                size={300}
                isPlayerTurn={isMyTurn()}
                onPowerCharge={handlePowerChargeStart}
                onPowerRelease={handlePowerChargeStop}
                chargingPlayer={gameState.chargingPlayer}
                creatorPower={gameState.creatorPower}
                joinerPower={gameState.joinerPower}
                creatorChoice={gameState.creatorChoice}
                joinerChoice={gameState.joinerChoice}
                isCreator={isCreator()}
                customHeadsImage={customHeadsImage}
                customTailsImage={customTailsImage}
              />
            </div>
            
            {/* Power Display Component */}
            <div style={{ 
              background: 'rgba(0, 0, 0, 0.6)', 
              padding: '1rem', 
              borderRadius: '1rem',
              border: '2px solid #FFD700',
              width: '100%',
              maxWidth: '500px'
            }}>
              <PowerDisplay 
                creatorPower={gameState.creatorPower}
                joinerPower={gameState.joinerPower}
                currentPlayer={gameState.chargingPlayer}
                creator={getGameCreator()}
                joiner={getGameJoiner()}
                chargingPlayer={gameState.chargingPlayer}
                gamePhase={gameState.phase}
                isMyTurn={isMyTurn()}
                playerChoice={isCreator() ? gameState.creatorChoice : gameState.joinerChoice}
                onChoiceSelect={handlePlayerChoice}
                isMobile={window.innerWidth <= 768}
              />
            </div>
          </GameSection>
          
          {/* Chat and Offer Sections */}
          <div style={{ display: 'flex', gap: '2rem', marginTop: '2rem', justifyContent: 'center' }}>
            <ChatSection>
              <h3 style={{ color: '#FFD700', textAlign: 'center', marginBottom: '1rem' }}>Game Chat</h3>
              <GameChatBox 
                messages={messages}
                onSendMessage={(message) => {
                  if (wsRef && wsConnected) {
                    wsRef.send(JSON.stringify({
                      type: 'CHAT_MESSAGE',
                      gameId: gameId,
                      message: {
                        id: Date.now(),
                        sender: address,
                        message: message,
                        timestamp: Date.now()
                      }
                    }))
                  }
                }}
                gameId={gameId}
                isMobile={window.innerWidth <= 768}
              />
            </ChatSection>
            
            <OfferSection>
              <h3 style={{ color: '#FFD700', textAlign: 'center', marginBottom: '1rem' }}>NFT Offers</h3>
              <NFTOfferComponent 
                offers={offers}
                onCreateOffer={(amount) => {
                  if (wsRef && wsConnected) {
                    wsRef.send(JSON.stringify({
                      type: 'NFT_OFFER',
                      gameId: gameId,
                      offer: {
                        id: Date.now(),
                        from: address,
                        amount: amount,
                        timestamp: Date.now()
                      }
                    }))
                  }
                }}
                onAcceptOffer={(offerId) => {
                  showSuccess('Offer accepted!')
                }}
                onRejectOffer={(offerId) => {
                  showSuccess('Offer rejected!')
                }}
                gameId={gameId}
                isMobile={window.innerWidth <= 768}
              />
            </OfferSection>
          </div>
        </GameContainer>
        
        {/* Result Popup */}
        {showResultPopup && resultData && (
          <GameResultPopup
            isVisible={showResultPopup}
            isWinner={resultData.isWinner}
            flipResult={resultData.flipResult}
            playerChoice={resultData.playerChoice}
            onClose={() => setShowResultPopup(false)}
            onClaimWinnings={() => {
              showSuccess('Winnings claimed!')
              setShowResultPopup(false)
            }}
            gameData={gameData}
          />
        )}
      </Container>
    </ThemeProvider>
  )
}

export default UnifiedGamePage