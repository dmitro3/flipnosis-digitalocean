import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useWallet } from '../contexts/WalletContext'
import { useToast } from '../contexts/ToastContext'
import { useWalletConnection } from '../utils/useWalletConnection'
import contractService from '../services/ContractService'
import OptimizedGoldCoin from './OptimizedGoldCoin'
import MobileOptimizedCoin from './MobileOptimizedCoin'
import PowerDisplay from '../components/PowerDisplay'
import GameResultPopup from './GameResultPopup'
import ProfilePicture from './ProfilePicture'
import { ThemeProvider } from '@emotion/react'
import { theme } from '../styles/theme'
import styled from '@emotion/styled'
import { API_CONFIG, getApiUrl, getWsUrl } from '../config/api'
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
  object-fit: cover;
  border: 2px solid ${props => props.theme.colors.neonBlue};
`

const NFTInfo = styled.div`
  text-align: left;
  flex: 1;
`

const PriceDisplay = styled.div`
  font-size: 3rem;
  font-weight: bold;
  color: ${props => props.theme.colors.neonGreen};
  margin: 1rem 0;
  text-shadow: 0 0 20px rgba(0, 255, 65, 0.5);
`

const PayButton = styled.button`
  background: linear-gradient(45deg, #00FF41, #39FF14);
  color: #000;
  border: none;
  padding: 1rem 3rem;
  font-size: 1.2rem;
  font-weight: bold;
  border-radius: 0.75rem;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 30px rgba(0, 255, 65, 0.4);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`

const GameSection = styled.div`
  background: rgba(0, 0, 20, 0.95);
  border: 2px solid ${props => props.theme.colors.neonBlue};
  border-radius: 1.5rem;
  padding: 2rem;
  box-shadow: 0 0 30px rgba(0, 191, 255, 0.3);
`

const PlayerSection = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  margin-bottom: 2rem;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
`

const PlayerBox = styled.div`
  background: ${props => props.isActive ? 'rgba(0, 255, 65, 0.1)' : 'rgba(255, 255, 255, 0.05)'};
  border: 2px solid ${props => props.isActive ? props.theme.colors.neonGreen : 'rgba(255, 255, 255, 0.1)'};
  border-radius: 1rem;
  padding: 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  transition: all 0.3s ease;
`

const RoundIndicators = styled.div`
  display: flex;
  gap: 0.5rem;
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

const CoinSection = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 2rem 0;
  min-height: 400px;
`

const ChatSection = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 1rem;
  padding: 1rem;
  margin-top: 2rem;
  height: 300px;
  display: flex;
  flex-direction: column;
`

const MessagesContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  margin-bottom: 1rem;
`

const ChatInput = styled.div`
  display: flex;
  gap: 0.5rem;
`

const Input = styled.input`
  flex: 1;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: white;
  padding: 0.5rem;
  border-radius: 0.5rem;
  
  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.neonGreen};
  }
`

const UnifiedGamePage = () => {
  const { gameId } = useParams()
  const navigate = useNavigate()
  const { address, walletClient } = useWallet()
  const { isFullyConnected } = useWalletConnection()
  const { showSuccess, showError, showInfo } = useToast()
  
  // State
  const [game, setGame] = useState(null)
  const [loading, setLoading] = useState(true)
  const [paymentLoading, setPaymentLoading] = useState(false)
  const [socket, setSocket] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)
  const [showResultPopup, setShowResultPopup] = useState(false)
  const [resultData, setResultData] = useState(null)
  
  // Game state from server
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
  
  // Coin state
  const [flipAnimation, setFlipAnimation] = useState(null)
  const [customHeadsImage, setCustomHeadsImage] = useState(null)
  const [customTailsImage, setCustomTailsImage] = useState(null)
  
  // Derived state
  const isCreator = game?.creator === address
  const isJoiner = game?.joiner === address
  const isPlayer = isCreator || isJoiner
  const needsPayment = game?.status === 'waiting_payment' && isJoiner
  const gameActive = game?.status === 'active'
  const isMyTurn = gameActive && isPlayer && gameState.phase === 'choosing'
  
  // Initialize contract service
  useEffect(() => {
    if (!isFullyConnected || !walletClient) return
    
    contractService.initializeClients(8453, walletClient)
      .catch(error => {
        console.error('Failed to initialize contract:', error)
        showError('Failed to connect to smart contract')
      })
  }, [isFullyConnected, walletClient])
  
  // Load game data
  useEffect(() => {
    loadGame()
  }, [gameId])
  
  // Setup WebSocket
  useEffect(() => {
    if (!gameId) return
    
    const ws = new WebSocket(getWsUrl())
    
    ws.onopen = () => {
      console.log('WebSocket connected')
      setSocket(ws)
      
      // Subscribe to game
      ws.send(JSON.stringify({
        type: 'subscribe_game',
        gameId
      }))
      
      // Register user if authenticated
      if (address) {
        ws.send(JSON.stringify({
          type: 'register_user',
          address
        }))
      }
    }
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        handleWebSocketMessage(data)
      } catch (error) {
        console.error('WebSocket message error:', error)
      }
    }
    
    ws.onclose = () => {
      console.log('WebSocket disconnected')
      setSocket(null)
    }
    
    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close()
      }
    }
  }, [gameId, address])
  
  // Handle window resize
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])
  
  // Set coin images when game loads
  useEffect(() => {
    if (game?.coin) {
      setCustomHeadsImage(game.coin.headsImage || '/coins/plainh.png')
      setCustomTailsImage(game.coin.tailsImage || '/coins/plaint.png')
    }
  }, [game?.coin])
  
  const loadGame = async () => {
    try {
      const response = await fetch(getApiUrl(`/games/${gameId}`))
      if (!response.ok) throw new Error('Game not found')
      
      const gameData = await response.json()
      setGame(gameData)
      
      // Set initial game state if provided
      if (gameData.gameState) {
        setGameState(gameData.gameState)
      }
    } catch (error) {
      console.error('Error loading game:', error)
      showError('Failed to load game')
    } finally {
      setLoading(false)
    }
  }
  
  const handleWebSocketMessage = (data) => {
    switch (data.type) {
      case 'offer_accepted':
      case 'game_joined':
        loadGame() // Refresh game data
        break
        
      case 'game_started':
        setGame(prev => ({ ...prev, status: 'active' }))
        setGameState(prev => ({ ...prev, phase: 'choosing' }))
        showSuccess('Game started!')
        break
        
      case 'game_action':
        handleGameAction(data)
        break
        
      case 'game_state_update':
        setGameState(data.gameState)
        break
        
      case 'chat_message':
        setMessages(prev => [...prev, {
          from: data.from,
          message: data.message,
          timestamp: data.timestamp
        }])
        break
        
      case 'game_completed':
        handleGameCompleted(data)
        break
    }
  }
  
  const handleGameAction = (data) => {
    const { action, payload, from } = data
    
    switch (action) {
      case 'choice':
        if (from === game?.creator) {
          setGameState(prev => ({ ...prev, creatorChoice: payload.choice }))
        } else {
          setGameState(prev => ({ ...prev, joinerChoice: payload.choice }))
        }
        
        // Check if both players have chosen
        const updatedState = { ...gameState }
        if (from === game?.creator) {
          updatedState.creatorChoice = payload.choice
        } else {
          updatedState.joinerChoice = payload.choice
        }
        
        if (updatedState.creatorChoice && updatedState.joinerChoice) {
          setGameState(prev => ({ ...prev, phase: 'charging' }))
        }
        break
        
      case 'start_charging':
        setGameState(prev => ({ ...prev, chargingPlayer: from }))
        break
        
      case 'stop_charging':
        setGameState(prev => ({ ...prev, chargingPlayer: null }))
        if (data.result) {
          handleFlipResult(data.result)
        }
        break
    }
  }
  
  const handleFlipResult = (result) => {
    setFlipAnimation({ result: result.outcome })
    
    // Determine winner
    const roundWinner = result.winner
    const isWinner = roundWinner === address
    
    // Update scores
    setGameState(prev => ({
      ...prev,
      creatorWins: result.creatorWins,
      joinerWins: result.joinerWins,
      currentRound: result.currentRound,
      phase: result.isComplete ? 'completed' : 'choosing',
      creatorChoice: null,
      joinerChoice: null,
      chargingPlayer: null
    }))
    
    // Show result popup for this round
    setResultData({
      isWinner,
      flipResult: result.outcome,
      gameData: game,
      isRoundResult: true,
      round: result.currentRound - 1
    })
    setShowResultPopup(true)
    
    setTimeout(() => {
      setFlipAnimation(null)
      setShowResultPopup(false)
    }, 3000)
  }
  
  const handleGameCompleted = (data) => {
    const isWinner = data.winner === address
    
    setResultData({
      isWinner,
      gameData: game,
      finalScore: {
        creatorWins: gameState.creatorWins,
        joinerWins: gameState.joinerWins
      }
    })
    setShowResultPopup(true)
  }
  
  const handlePayment = async () => {
    if (!isFullyConnected) {
      showError('Please connect your wallet')
      return
    }
    
    try {
      setPaymentLoading(true)
      showInfo('Processing payment...')
      
      const result = await contractService.joinExistingGameWithPrice(
        game.blockchain_id,
        game.final_price
      )
      
      if (!result.success) {
        throw new Error(result.error)
      }
      
      // Notify server
      const response = await fetch(getApiUrl(`/games/${gameId}/payment-confirmed`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          joiner_address: address,
          transaction_hash: result.transactionHash
        })
      })
      
      if (!response.ok) {
        throw new Error('Failed to confirm payment')
      }
      
      showSuccess('Payment successful! Game starting...')
      loadGame()
      
    } catch (error) {
      console.error('Payment error:', error)
      showError(error.message || 'Payment failed')
    } finally {
      setPaymentLoading(false)
    }
  }
  
  const handlePlayerChoice = (choice) => {
    if (!gameActive || !isPlayer || gameState.phase !== 'choosing') return
    
    socket?.send(JSON.stringify({
      type: 'game_action',
      gameId,
      action: 'choice',
      payload: { choice }
    }))
    
    // Update local state
    if (isCreator) {
      setGameState(prev => ({ ...prev, creatorChoice: choice }))
    } else {
      setGameState(prev => ({ ...prev, joinerChoice: choice }))
    }
  }
  
  const handlePowerChargeStart = () => {
    if (!gameActive || !isPlayer || gameState.phase !== 'charging') return
    
    socket?.send(JSON.stringify({
      type: 'game_action',
      gameId,
      action: 'start_charging',
      payload: {}
    }))
  }
  
  const handlePowerChargeStop = async () => {
    if (!gameActive || !isPlayer || gameState.phase !== 'charging') return
    
    // For blockchain game, execute flip on-chain
    if (game.blockchain_id && contractService.isInitialized()) {
      try {
        const result = await contractService.playRound(game.blockchain_id)
        if (!result.success) throw new Error(result.error)
        
        // Server will detect blockchain event and update game
      } catch (error) {
        showError('Failed to flip: ' + error.message)
      }
    }
    
    socket?.send(JSON.stringify({
      type: 'game_action',
      gameId,
      action: 'stop_charging',
      payload: {}
    }))
  }
  
  const sendMessage = () => {
    if (!newMessage.trim() || !socket) return
    
    socket.send(JSON.stringify({
      type: 'chat_message',
      gameId,
      message: newMessage.trim()
    }))
    
    setNewMessage('')
  }
  
  const handleClaimWinnings = async () => {
    try {
      showInfo('Claiming winnings...')
      
      const result = await contractService.withdrawRewards()
      if (!result.success) throw new Error(result.error)
      
      showSuccess('Winnings claimed successfully!')
      navigate('/')
    } catch (error) {
      showError('Failed to claim: ' + error.message)
    }
  }
  
  if (loading) {
    return (
      <ThemeProvider theme={theme}>
        <Container>
          <GameContainer>
            <div style={{ textAlign: 'center', padding: '3rem' }}>
              Loading game...
            </div>
          </GameContainer>
        </Container>
      </ThemeProvider>
    )
  }
  
  if (!game) {
    return (
      <ThemeProvider theme={theme}>
        <Container>
          <GameContainer>
            <div style={{ textAlign: 'center', padding: '3rem' }}>
              <h2>Game not found</h2>
              <button onClick={() => navigate('/')}>Go Home</button>
            </div>
          </GameContainer>
        </Container>
      </ThemeProvider>
    )
  }
  
  return (
    <ThemeProvider theme={theme}>
      <BackgroundVideo autoPlay loop muted playsInline>
        <source src={isMobile ? mobileVideo : hazeVideo} type="video/webm" />
      </BackgroundVideo>
      
      <Container>
        <GameContainer>
          {/* Payment Section - Only show when payment needed */}
          {needsPayment && (
            <PaymentSection>
              <h2 style={{ color: theme.colors.neonYellow, marginBottom: '1rem' }}>
                Complete Payment to Start Game
              </h2>
              
              <NFTPreview>
                <NFTImage src={game.nft_image} alt={game.nft_name} />
                <NFTInfo>
                  <h3>{game.nft_name}</h3>
                  <p>{game.nft_collection}</p>
                  <p style={{ color: theme.colors.textSecondary }}>
                    Playing against: {game.creator.slice(0, 6)}...{game.creator.slice(-4)}
                  </p>
                </NFTInfo>
              </NFTPreview>
              
              <PriceDisplay>${game.final_price} ETH</PriceDisplay>
              
              <PayButton onClick={handlePayment} disabled={paymentLoading}>
                {paymentLoading ? 'Processing...' : 'Pay & Start Game'}
              </PayButton>
            </PaymentSection>
          )}
          
          {/* Game Section - Always visible but disabled when payment pending */}
          <GameSection style={{ opacity: needsPayment ? 0.5 : 1 }}>
            {/* Players */}
            <PlayerSection>
              <PlayerBox isActive={gameState.phase === 'choosing' && isCreator}>
                <ProfilePicture address={game.creator} size={40} />
                <RoundIndicators>
                  {[1, 2, 3, 4, 5].map(round => (
                    <RoundDot
                      key={round}
                      isCurrent={round === gameState.currentRound}
                      isWon={round <= gameState.creatorWins}
                    >
                      {round}
                    </RoundDot>
                  ))}
                </RoundIndicators>
              </PlayerBox>
              
              <PlayerBox isActive={gameState.phase === 'choosing' && isJoiner}>
                <ProfilePicture address={game.joiner || '0x0'} size={40} />
                <RoundIndicators>
                  {[1, 2, 3, 4, 5].map(round => (
                    <RoundDot
                      key={round}
                      isCurrent={round === gameState.currentRound}
                      isWon={round <= gameState.joinerWins}
                    >
                      {round}
                    </RoundDot>
                  ))}
                </RoundIndicators>
              </PlayerBox>
            </PlayerSection>
            
            {/* Status Message */}
            {gameState.phase === 'choosing' && isMyTurn && (
              <div style={{
                textAlign: 'center',
                marginBottom: '1rem',
                padding: '1rem',
                background: 'rgba(255, 215, 0, 0.1)',
                border: '1px solid rgba(255, 215, 0, 0.3)',
                borderRadius: '0.75rem'
              }}>
                <p style={{ color: theme.colors.neonYellow, margin: 0 }}>
                  Choose heads or tails below!
                </p>
              </div>
            )}
            
            {gameState.phase === 'charging' && (
              <div style={{
                textAlign: 'center',
                marginBottom: '1rem',
                padding: '1rem',
                background: 'rgba(0, 255, 65, 0.1)',
                border: '1px solid rgba(0, 255, 65, 0.3)',
                borderRadius: '0.75rem'
              }}>
                <p style={{ color: theme.colors.neonGreen, margin: 0 }}>
                  Both players ready! Hold the coin to charge power!
                </p>
              </div>
            )}
            
            {/* Coin */}
            <CoinSection>
              {isMobile ? (
                <MobileOptimizedCoin
                  isFlipping={!!flipAnimation}
                  flipResult={flipAnimation?.result}
                  onPowerCharge={handlePowerChargeStart}
                  onPowerRelease={handlePowerChargeStop}
                  isPlayerTurn={gameActive && isPlayer && gameState.phase === 'charging'}
                  isCharging={gameState.chargingPlayer === address}
                  chargingPlayer={gameState.chargingPlayer}
                  creatorPower={gameState.creatorPower}
                  joinerPower={gameState.joinerPower}
                  creatorChoice={gameState.creatorChoice}
                  joinerChoice={gameState.joinerChoice}
                  isCreator={isCreator}
                  customHeadsImage={customHeadsImage}
                  customTailsImage={customTailsImage}
                  size={250}
                />
              ) : (
                <OptimizedGoldCoin
                  isFlipping={!!flipAnimation}
                  flipResult={flipAnimation?.result}
                  onPowerCharge={handlePowerChargeStart}
                  onPowerRelease={handlePowerChargeStop}
                  isPlayerTurn={gameActive && isPlayer && gameState.phase === 'charging'}
                  isCharging={gameState.chargingPlayer === address}
                  chargingPlayer={gameState.chargingPlayer}
                  creatorPower={gameState.creatorPower}
                  joinerPower={gameState.joinerPower}
                  creatorChoice={gameState.creatorChoice}
                  joinerChoice={gameState.joinerChoice}
                  isCreator={isCreator}
                  customHeadsImage={customHeadsImage}
                  customTailsImage={customTailsImage}
                  gamePhase={gameState.phase}
                  size={400}
                />
              )}
            </CoinSection>
            
            {/* Power Display */}
            <PowerDisplay
              creatorPower={gameState.creatorPower}
              joinerPower={gameState.joinerPower}
              currentPlayer={address}
              creator={game.creator}
              joiner={game.joiner}
              chargingPlayer={gameState.chargingPlayer}
              gamePhase={gameState.phase}
              isMyTurn={isMyTurn}
              playerChoice={isCreator ? gameState.creatorChoice : gameState.joinerChoice}
              onChoiceSelect={handlePlayerChoice}
            />
            
            {/* Chat */}
            <ChatSection>
              <h4 style={{ margin: '0 0 1rem 0', color: theme.colors.neonBlue }}>Game Chat</h4>
              <MessagesContainer>
                {messages.map((msg, i) => (
                  <div key={i} style={{ marginBottom: '0.5rem' }}>
                    <strong style={{ color: theme.colors.neonPink }}>
                      {msg.from.slice(0, 6)}...{msg.from.slice(-4)}:
                    </strong>{' '}
                    <span style={{ color: theme.colors.textPrimary }}>{msg.message}</span>
                  </div>
                ))}
              </MessagesContainer>
              <ChatInput>
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Type a message..."
                  disabled={!gameActive}
                />
                <button 
                  onClick={sendMessage} 
                  disabled={!gameActive}
                  style={{
                    background: theme.colors.neonGreen,
                    color: '#000',
                    border: 'none',
                    padding: '0.5rem 1rem',
                    borderRadius: '0.5rem',
                    cursor: gameActive ? 'pointer' : 'not-allowed',
                    opacity: gameActive ? 1 : 0.5
                  }}
                >
                  Send
                </button>
              </ChatInput>
            </ChatSection>
          </GameSection>
        </GameContainer>
      </Container>
      
      {/* Result Popup */}
      {showResultPopup && resultData && (
        <GameResultPopup
          isVisible={showResultPopup}
          isWinner={resultData.isWinner}
          flipResult={resultData.flipResult}
          playerChoice={isCreator ? gameState.creatorChoice : gameState.joinerChoice}
          gameData={resultData.gameData}
          onClose={() => setShowResultPopup(false)}
          onClaimWinnings={handleClaimWinnings}
          finalScore={resultData.finalScore}
        />
      )}
    </ThemeProvider>
  )
}

export default UnifiedGamePage 