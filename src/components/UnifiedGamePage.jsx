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

const BottomSection = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 2rem;
  margin-top: 2rem;
  
  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
`

const InfoSection = styled.div`
  background: rgba(0, 0, 20, 0.95);
  border: 2px solid ${props => props.theme.colors.neonYellow};
  border-radius: 1rem;
  padding: 1rem;
  height: 400px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 0 30px rgba(255, 215, 0, 0.3);
`

const ChatSection = styled.div`
  background: rgba(0, 0, 20, 0.95);
  border: 2px solid ${props => props.theme.colors.neonBlue};
  border-radius: 1rem;
  padding: 1rem;
  height: 400px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 0 30px rgba(0, 191, 255, 0.3);
`

const OffersSection = styled.div`
  background: rgba(0, 0, 20, 0.95);
  border: 2px solid ${props => props.theme.colors.neonPink};
  border-radius: 1rem;
  padding: 1rem;
  height: 400px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 0 30px rgba(255, 20, 147, 0.3);
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
  
  // Offers state
  const [offers, setOffers] = useState([])
  const [newOffer, setNewOffer] = useState({ price: '', message: '' })
  const [creatingOffer, setCreatingOffer] = useState(false)
  
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
  
  // Helper functions to handle both game and listing data structures
  const getGameCreator = () => game?.creator || game?.creator_address
  const getGameJoiner = () => game?.joiner || game?.joiner_address
  const getGamePrice = () => game?.final_price || game?.asking_price || 0
  const getGameNFTImage = () => game?.nft_image || game?.nftImage || '/placeholder-nft.svg'
  const getGameNFTName = () => game?.nft_name || game?.nftName || 'Unknown NFT'
  const getGameNFTCollection = () => game?.nft_collection || game?.nftCollection || 'Unknown Collection'
  
  // Derived state
  const isCreator = getGameCreator() === address
  const isJoiner = getGameJoiner() === address
  const isPlayer = isCreator || isJoiner
  const needsPayment = game?.status === 'waiting_payment' && isJoiner
  const gameActive = game?.status === 'active'
  const isMyTurn = gameActive && isPlayer && gameState.phase === 'choosing'
  const isListing = game?.id?.startsWith('listing_') || game?.listing_id
  const canMakeOffer = isListing && !isCreator && address
  
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
      
      // Subscribe to game/listing
      ws.send(JSON.stringify({
        type: 'subscribe_game',
        gameId
      }))
      
      // Also subscribe to listing ID if this is a listing
      if (gameId.startsWith('listing_')) {
        ws.send(JSON.stringify({
          type: 'subscribe_game',
          gameId: gameId
        }))
      }
      
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
    if (game?.coin_data) {
      try {
        const coinData = typeof game.coin_data === 'string' ? JSON.parse(game.coin_data) : game.coin_data
        setCustomHeadsImage(coinData.headsImage || '/coins/plainh.png')
        setCustomTailsImage(coinData.tailsImage || '/coins/plaint.png')
      } catch (error) {
        console.error('Error parsing coin data:', error)
        setCustomHeadsImage('/coins/plainh.png')
        setCustomTailsImage('/coins/plaint.png')
      }
    } else if (game?.coin) {
      setCustomHeadsImage(game.coin.headsImage || '/coins/plainh.png')
      setCustomTailsImage(game.coin.tailsImage || '/coins/plaint.png')
    } else {
      // Default coin images
      setCustomHeadsImage('/coins/plainh.png')
      setCustomTailsImage('/coins/plaint.png')
    }
  }, [game?.coin_data, game?.coin])
  
  const loadGame = async () => {
    try {
      // First try to load as a game
      let response = await fetch(getApiUrl(`/games/${gameId}`))
      
      if (response.ok) {
        const gameData = await response.json()
        setGame(gameData)
        
        // Set initial game state if provided
        if (gameData.gameState) {
          setGameState(gameData.gameState)
        }
        return
      }
      
      // If not found as game, try as listing
      response = await fetch(getApiUrl(`/listings/${gameId}`))
      if (!response.ok) throw new Error('Game/Listing not found')
      
      const listingData = await response.json()
      setGame(listingData)
      
      // Load offers for listing
      await loadOffers(listingData.id)
      
      // Set initial game state for listing
      setGameState({
        phase: 'waiting_payment',
        creatorChoice: null,
        joinerChoice: null,
        chargingPlayer: null,
        creatorWins: 0,
        joinerWins: 0,
        currentRound: 1
      })
      
    } catch (error) {
      console.error('Error loading game:', error)
      showError('Failed to load game')
    } finally {
      setLoading(false)
    }
  }
  
  const loadOffers = async (listingId) => {
    try {
      console.log(`💰 Loading offers for listing: ${listingId}`)
      const response = await fetch(getApiUrl(`/listings/${listingId}/offers`))
      
      if (response.ok) {
        const offersData = await response.json()
        console.log(`✅ Offers loaded:`, offersData)
        setOffers(offersData)
      } else {
        console.log(`⚠️ No offers found for listing: ${listingId}`)
        setOffers([])
      }
    } catch (error) {
      console.error('❌ Error loading offers:', error)
      setOffers([])
    }
  }
  
  const handleWebSocketMessage = (data) => {
    switch (data.type) {
      case 'offer_accepted':
      case 'game_joined':
        loadGame() // Refresh game data
        break
        
      case 'offer_created':
      case 'offer_updated':
        // Refresh offers when a new offer is created or updated
        if (game?.id) {
          loadOffers(game.id)
        } else if (gameId.startsWith('listing_')) {
          // For listings, use the gameId as the listing ID
          loadOffers(gameId)
        }
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
        getGamePrice()
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
    
    const messageData = {
      type: 'chat_message',
      gameId: game?.id || game?.blockchain_id || gameId,
      from: address,
      message: newMessage.trim()
    }
    
    socket.send(JSON.stringify(messageData))
    setNewMessage('')
  }
  
  const createOffer = async () => {
    if (!newOffer.price || !game?.id) return
    
    try {
      setCreatingOffer(true)
      const response = await fetch(getApiUrl(`/listings/${game.id}/offers`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          offerer_address: address,
          offerer_name: address.slice(0, 6) + '...' + address.slice(-4),
          offer_price: parseFloat(newOffer.price),
          message: newOffer.message
        })
      })
      
      if (response.ok) {
        const result = await response.json()
        showSuccess('Offer created successfully!')
        setNewOffer({ price: '', message: '' })
        await loadOffers(game.id) // Refresh offers
      } else {
        showError('Failed to create offer')
      }
    } catch (error) {
      console.error('Error creating offer:', error)
      showError('Failed to create offer')
    } finally {
      setCreatingOffer(false)
    }
  }
  
  const acceptOffer = async (offerId, offerPrice) => {
    try {
      const response = await fetch(getApiUrl(`/offers/${offerId}/accept`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ final_price: offerPrice })
      })
      
      if (response.ok) {
        showSuccess('Offer accepted!')
        await loadOffers(game.id) // Refresh offers
        await loadGame() // Refresh game/listing data
      } else {
        showError('Failed to accept offer')
      }
    } catch (error) {
      console.error('Error accepting offer:', error)
      showError('Failed to accept offer')
    }
  }
  
  const rejectOffer = async (offerId) => {
    try {
      const response = await fetch(getApiUrl(`/offers/${offerId}/reject`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      
      if (response.ok) {
        showSuccess('Offer rejected')
        await loadOffers(game.id) // Refresh offers
      } else {
        showError('Failed to reject offer')
      }
    } catch (error) {
      console.error('Error rejecting offer:', error)
      showError('Failed to reject offer')
    }
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
                <NFTImage src={getGameNFTImage()} alt={getGameNFTName()} />
                <NFTInfo>
                  <h3>{getGameNFTName()}</h3>
                  <p>{getGameNFTCollection()}</p>
                  <p style={{ color: theme.colors.textSecondary }}>
                    Playing against: {getGameCreator().slice(0, 6)}...{getGameCreator().slice(-4)}
                  </p>
                </NFTInfo>
              </NFTPreview>
              
              <PriceDisplay>${getGamePrice()} ETH</PriceDisplay>
              
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
                <ProfilePicture address={getGameCreator()} size={40} />
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
                <ProfilePicture address={getGameJoiner() || '0x0'} size={40} />
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
              creator={getGameCreator()}
              joiner={getGameJoiner()}
              chargingPlayer={gameState.chargingPlayer}
              gamePhase={gameState.phase}
              isMyTurn={isMyTurn}
              playerChoice={isCreator ? gameState.creatorChoice : gameState.joinerChoice}
              onChoiceSelect={handlePlayerChoice}
            />
            
            {/* Three Column Layout */}
            <BottomSection>
              {/* NFT Info Section */}
              <InfoSection>
                <h4 style={{ margin: '0 0 1rem 0', color: theme.colors.neonYellow }}>NFT Details</h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                  <img 
                    src={getGameNFTImage()} 
                    alt={getGameNFTName()} 
                    style={{ 
                      width: '80px', 
                      height: '80px', 
                      borderRadius: '0.5rem',
                      border: `2px solid ${theme.colors.neonYellow}`
                    }} 
                  />
                  <div>
                    <h5 style={{ margin: '0 0 0.5rem 0', color: theme.colors.textPrimary }}>
                      {getGameNFTName()}
                    </h5>
                    <p style={{ margin: '0', color: theme.colors.textSecondary, fontSize: '0.9rem' }}>
                      {getGameNFTCollection()}
                    </p>
                  </div>
                </div>
                
                <div style={{ marginBottom: '1rem' }}>
                  <p style={{ margin: '0 0 0.5rem 0', color: theme.colors.textSecondary }}>
                    <strong>Creator:</strong> {getGameCreator().slice(0, 6)}...{getGameCreator().slice(-4)}
                  </p>
                  {getGameJoiner() && (
                    <p style={{ margin: '0 0 0.5rem 0', color: theme.colors.textSecondary }}>
                      <strong>Player:</strong> {getGameJoiner().slice(0, 6)}...{getGameJoiner().slice(-4)}
                    </p>
                  )}
                  <p style={{ margin: '0 0 0.5rem 0', color: theme.colors.neonYellow, fontSize: '1.2rem', fontWeight: 'bold' }}>
                    Price: ${getGamePrice()} USD
                  </p>
                  <p style={{ margin: '0', color: theme.colors.textSecondary, fontSize: '0.9rem' }}>
                    <strong>Chain:</strong> Base (ETH)
                  </p>
                </div>
                
                {/* External Links */}
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <a 
                      href={`https://basescan.org/token/${game?.nft_contract}?a=${game?.nft_token_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        background: theme.colors.neonBlue,
                        color: '#000',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '0.25rem',
                        textDecoration: 'none',
                        fontSize: '0.8rem',
                        fontWeight: 'bold'
                      }}
                    >
                      Explorer
                    </a>
                    <a 
                      href={`https://opensea.io/assets/base/${game?.nft_contract}/${game?.nft_token_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        background: theme.colors.neonGreen,
                        color: '#000',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '0.25rem',
                        textDecoration: 'none',
                        fontSize: '0.8rem',
                        fontWeight: 'bold'
                      }}
                    >
                      OpenSea
                    </a>
                  </div>
                </div>
                
                <div style={{ marginTop: 'auto' }}>
                  <p style={{ margin: '0', color: theme.colors.textSecondary, fontSize: '0.8rem' }}>
                    Status: {game?.status || 'Unknown'}
                  </p>
                </div>
              </InfoSection>
              
              {/* Chat Section */}
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
                  disabled={!gameActive && !isListing}
                />
                <button 
                  onClick={sendMessage} 
                  disabled={!gameActive && !isListing}
                  style={{
                    background: theme.colors.neonGreen,
                    color: '#000',
                    border: 'none',
                    padding: '0.5rem 1rem',
                    borderRadius: '0.5rem',
                    cursor: (gameActive || isListing) ? 'pointer' : 'not-allowed',
                    opacity: (gameActive || isListing) ? 1 : 0.5
                  }}
                >
                  Send
                </button>
                </ChatInput>
              </ChatSection>
              
              {/* Offers Section */}
              <OffersSection>
                <h4 style={{ margin: '0 0 1rem 0', color: theme.colors.neonPink }}>Offers</h4>
                
                {isListing && (
                  <>
                    {/* Create Offer Form */}
                    {canMakeOffer && (
                      <div style={{ marginBottom: '1rem', padding: '1rem', background: 'rgba(255, 20, 147, 0.1)', borderRadius: '0.5rem' }}>
                        <h5 style={{ margin: '0 0 0.5rem 0', color: theme.colors.neonPink }}>Make an Offer</h5>
                        <input
                          type="number"
                          placeholder="Offer price (USD)"
                          value={newOffer.price}
                          onChange={(e) => setNewOffer(prev => ({ ...prev, price: e.target.value }))}
                          style={{
                            width: '100%',
                            marginBottom: '0.5rem',
                            padding: '0.5rem',
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            color: 'white',
                            borderRadius: '0.25rem'
                          }}
                        />
                        <input
                          type="text"
                          placeholder="Message (optional)"
                          value={newOffer.message}
                          onChange={(e) => setNewOffer(prev => ({ ...prev, message: e.target.value }))}
                          style={{
                            width: '100%',
                            marginBottom: '0.5rem',
                            padding: '0.5rem',
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            color: 'white',
                            borderRadius: '0.25rem'
                          }}
                        />
                        <button
                          onClick={createOffer}
                          disabled={creatingOffer || !newOffer.price}
                          style={{
                            width: '100%',
                            background: theme.colors.neonPink,
                            color: '#000',
                            border: 'none',
                            padding: '0.5rem',
                            borderRadius: '0.25rem',
                            cursor: creatingOffer ? 'not-allowed' : 'pointer',
                            opacity: creatingOffer ? 0.5 : 1
                          }}
                        >
                          {creatingOffer ? 'Creating...' : 'Submit Offer'}
                        </button>
                      </div>
                    )}
                    
                    {/* Offers List */}
                    <div style={{ flex: 1, overflowY: 'auto' }}>
                      {offers.length === 0 ? (
                        <p style={{ color: theme.colors.textSecondary, textAlign: 'center', marginTop: '2rem' }}>
                          No offers yet
                        </p>
                      ) : (
                        offers.map((offer) => (
                          <div 
                            key={offer.id} 
                            style={{ 
                              marginBottom: '1rem', 
                              padding: '1rem', 
                              background: 'rgba(255, 255, 255, 0.05)', 
                              borderRadius: '0.5rem',
                              border: `1px solid ${offer.status === 'accepted' ? theme.colors.neonGreen : offer.status === 'rejected' ? theme.colors.neonPink : 'rgba(255, 255, 255, 0.1)'}`
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                              <strong style={{ color: theme.colors.neonPink }}>
                                {offer.offerer_name || offer.offerer_address.slice(0, 6) + '...' + offer.offerer_address.slice(-4)}
                              </strong>
                              <span style={{ 
                                color: offer.status === 'accepted' ? theme.colors.neonGreen : 
                                       offer.status === 'rejected' ? theme.colors.neonPink : 
                                       theme.colors.neonYellow,
                                fontSize: '0.8rem',
                                textTransform: 'uppercase'
                              }}>
                                {offer.status}
                              </span>
                            </div>
                            <p style={{ margin: '0 0 0.5rem 0', color: theme.colors.neonYellow, fontWeight: 'bold' }}>
                              ${offer.offer_price} USD
                            </p>
                            {offer.message && (
                              <p style={{ margin: '0 0 0.5rem 0', color: theme.colors.textSecondary, fontSize: '0.9rem' }}>
                                "{offer.message}"
                              </p>
                            )}
                            {isCreator && offer.status === 'pending' && (
                              <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button
                                  onClick={() => acceptOffer(offer.id, offer.offer_price)}
                                  style={{
                                    flex: 1,
                                    background: theme.colors.neonGreen,
                                    color: '#000',
                                    border: 'none',
                                    padding: '0.25rem',
                                    borderRadius: '0.25rem',
                                    cursor: 'pointer',
                                    fontSize: '0.8rem'
                                  }}
                                >
                                  Accept
                                </button>
                                <button
                                  onClick={() => rejectOffer(offer.id)}
                                  style={{
                                    flex: 1,
                                    background: theme.colors.neonPink,
                                    color: '#000',
                                    border: 'none',
                                    padding: '0.25rem',
                                    borderRadius: '0.25rem',
                                    cursor: 'pointer',
                                    fontSize: '0.8rem'
                                  }}
                                >
                                  Reject
                                </button>
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </>
                )}
                
                {!isListing && (
                  <p style={{ color: theme.colors.textSecondary, textAlign: 'center', marginTop: '2rem' }}>
                    Game in progress - no offers available
                  </p>
                )}
              </OffersSection>
            </BottomSection>
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