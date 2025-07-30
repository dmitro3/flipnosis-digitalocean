import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useWallet } from '../contexts/WalletContext'
import { useToast } from '../contexts/ToastContext'
import contractService from '../services/ContractService'
import OptimizedGoldCoin from './OptimizedGoldCoin'
import PowerDisplay from '../components/PowerDisplay'
import GameResultPopup from './GameResultPopup'
import ProfilePicture from './ProfilePicture'
import { ThemeProvider } from '@emotion/react'
import { theme } from '../styles/theme'
import styled from '@emotion/styled'
import { API_CONFIG, getApiUrl, getWsUrl } from '../config/api'
import hazeVideo from '../../Images/Video/haze.webm'
import mobileVideo from '../../Images/Video/Mobile/mobile.webm'
import GameChatBox from './GameChatBox'
import NFTOfferComponent from './NFTOfferComponent'
import { LoadingSpinner } from '../styles/components'

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
  
  @keyframes pulse {
    0% { transform: scale(1); box-shadow: 0 0 20px rgba(255, 20, 147, 0.5); }
    50% { transform: scale(1.02); box-shadow: 0 0 30px rgba(255, 20, 147, 0.8); }
    100% { transform: scale(1); box-shadow: 0 0 20px rgba(255, 20, 147, 0.5); }
  }
  
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
  background: transparent;
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
  background: rgba(0, 0, 20, 0.95);
  border-radius: 1rem;
  padding: 2rem;
  
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
  const { address, walletClient, isMobile } = useWallet()
  const { showSuccess, showError, showInfo } = useToast()
  
  const [gameData, setGameData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [socket, setSocket] = useState(null)
  const [offers, setOffers] = useState([])
  const [newOffer, setNewOffer] = useState({ price: '', message: '' })
  const [creatingOffer, setCreatingOffer] = useState(false)
  const [showResultPopup, setShowResultPopup] = useState(false)
  const [resultData, setResultData] = useState(null)
  const [newMessage, setNewMessage] = useState('')
  const [paymentLoading, setPaymentLoading] = useState(false)
  
  // NFT Offer state
  const [offeredNFTs, setOfferedNFTs] = useState([])
  const [pendingNFTOffer, setPendingNFTOffer] = useState(null)
  const [showOfferReviewModal, setShowOfferReviewModal] = useState(false)

  // Load game data
  const loadGameData = async () => {
    try {
      setLoading(true)
      
      // First try to load as a game
      let response = await fetch(getApiUrl(`/games/${gameId}`))
      if (!response.ok) {
        // If not found as game, try as listing
        response = await fetch(getApiUrl(`/listings/${gameId}`))
      }
      
      if (!response.ok) throw new Error('Failed to load game/listing')
      const data = await response.json()
      
      // Normalize the data structure
      const normalizedData = {
        ...data,
        id: data.id,
        type: data.type || (data.listing_id ? 'game' : 'listing'),
        creator: data.creator || data.creator_address,
        creator_address: data.creator || data.creator_address,
        nft_contract: data.nft_contract,
        nft_token_id: data.nft_token_id,
        nft_name: data.nft_name,
        nft_image: data.nft_image,
        nft_collection: data.nft_collection,
        asking_price: data.asking_price || data.final_price,
        coin_data: data.coin_data,
        status: data.status,
        game_type: data.game_type || 'nft-vs-crypto'
      }
      
      setGameData(normalizedData)
      
      // Load offers if it's a listing
      if (normalizedData.type === 'listing' && normalizedData.status === 'open') {
        const offersResponse = await fetch(getApiUrl(`/listings/${gameId}/offers`))
        if (offersResponse.ok) {
          const offersData = await offersResponse.json()
          setOffers(offersData)
        }
      }
    } catch (error) {
      console.error('Error loading game:', error)
      showError('Failed to load game')
    } finally {
      setLoading(false)
    }
  }

  // Auto-start game when both players have deposited
  useEffect(() => {
    if (gameData?.status === 'active' && gameState.phase === 'waiting') {
      // Game just became active, initialize first round
      console.log('🎮 Game active, starting first round')
      setGameState(prev => ({
        ...prev,
        phase: 'choosing',
        currentRound: 1,
        creatorWins: 0,
        joinerWins: 0
      }))
      
      // Show instructions to creator
      if (isCreator) {
        showInfo('Game started! You go first - choose heads or tails!')
      } else if (isJoiner) {
        showInfo('Game started! Waiting for opponent to choose...')
      }
    }
  }, [gameData?.status, isCreator, isJoiner])

  // Setup WebSocket with proper game subscription
  useEffect(() => {
    if (!gameId) return
    
    const ws = new WebSocket(getWsUrl())
    
    ws.onopen = () => {
      console.log('WebSocket connected')
      setSocket(ws)
      
      // Join room with the actual gameId (not the type-prefixed one)
      const roomId = gameId.startsWith('listing_') || gameId.startsWith('game_') ? gameId : gameId
      
      ws.send(JSON.stringify({
        type: 'join_room',
        roomId: roomId
      }))
      
      // Register user if we have an address
      if (address) {
        ws.send(JSON.stringify({
          type: 'register_user',
          address: address
        }))
      }
    }
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        
        // Add null check to prevent the error
        if (!data || !data.type) {
          console.warn('⚠️ Received invalid WebSocket message in UnifiedGamePage:', data)
          return
        }
        
        handleWebSocketMessage(data)
      } catch (error) {
        console.error('WebSocket message error:', error)
      }
    }
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error)
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

  // Debug useEffect to monitor offeredNFTs state changes
  useEffect(() => {
    console.log('🔄 offeredNFTs state changed:', offeredNFTs)
  }, [offeredNFTs])

  const handleWebSocketMessage = (data) => {
    console.log('📩 WebSocket message received:', data.type, data)
    
    switch (data.type) {
      case 'listing_converted_to_game':
        // Reload the game data
        loadGameData()
        break
      case 'offer_created':
      case 'offer_updated':
      case 'new_offer':
        console.log('🔄 Received offer update, reloading offers for gameId:', gameId)
        // Always reload offers when we get these messages, regardless of gameData state
        fetch(getApiUrl(`/listings/${gameId}/offers`)).then(async response => {
          if (response.ok) {
            const offersData = await response.json()
            console.log('✅ Loaded offers from API:', offersData)
            setOffers(offersData)
          } else {
            console.log('⚠️ Failed to load offers, might be a game not listing')
          }
        }).catch(error => {
          console.log('⚠️ Error loading offers (expected if this is a game):', error)
        })
        break
      case 'game_joined':
      case 'game_state_update':
        // Reload game data
        loadGameData()
        break
      case 'nft_offer_received':
        console.log('🎯 NFT offer received:', data.offer)
        console.log('🎯 Current offeredNFTs:', offeredNFTs)
        console.log('🎯 Is creator:', isCreator)
        setOfferedNFTs(prev => {
          const newOffers = [...prev, data.offer]
          console.log('🎯 Updated offeredNFTs:', newOffers)
          return newOffers
        })
        if (!isCreator) {
          showInfo(`New NFT battle offer: ${data.offer.nft.name}`)
        }
        break
      case 'nft_offer_accepted':
        console.log('✅ NFT offer accepted:', data.acceptedOffer)
        showSuccess('NFT offer accepted! Waiting for challenger to join...')
        // Reload game data to reflect the accepted offer
        loadGameData()
        break
case 'offer_accepted':
  console.log('✅ Offer accepted! Details:', data)
  
  // If we're the offerer, show payment UI immediately
  if (data.gameId && address === gameData?.challenger) {
    showSuccess('Your offer was accepted! Please deposit payment.')
  }
  
  // Navigate to game page if we have a gameId and it's different from current
  if (data.gameId && gameId !== data.gameId) {
    // Small delay to let the success message show
    setTimeout(() => {
      navigate(`/game/${data.gameId}`)
    }, 1000)
  } else {
    // We're already on the right page, just reload the data
    loadGameData()
  }
  break
      case 'nft_offer_rejected':
        console.log('❌ NFT offer rejected:', data.offer)
        showInfo('NFT offer was rejected')
        break
      case 'challenger_payment_confirmed':
        console.log('💰 Challenger payment confirmed')
        showSuccess('Payment confirmed! Game starting...')
        // Reload game data to show the game is now active
        loadGameData()
        break
      case 'deposit_confirmed':
        console.log('💰 Deposit confirmed:', data)
        const depositor = data.player === address ? 'You' : 'Opponent'
        showSuccess(`${depositor} deposited ${data.assetType.toUpperCase()}!`)
        // Reload game data to update deposit status
        loadGameData()
        break
      case 'game_started':
        console.log('🎮 Game started!')
        showSuccess('Both players deposited! Game starting...')
        // Reload game data to transition to active game
        loadGameData()
        // Set game phase to choosing for first round
        setGameState(prev => ({
          ...prev,
          phase: 'choosing',
          currentRound: 1
        }))
        break
      case 'game_cancelled':
        console.log('❌ Game cancelled:', data.reason)
        if (data.reason === 'deposit_timeout') {
          if (data.nft_moved_to_ready) {
            showInfo('Game cancelled: Your NFT is ready for the next game!')
          } else {
            showError('Game cancelled: Deposit deadline expired!')
          }
        } else {
          showError('Game was cancelled')
        }
        // Reload game data to show cancelled status
        loadGameData()
        checkReadyNFTStatus()
        break
      case 'nft_moved_to_ready':
        console.log('🎯 NFT moved to ready state:', data)
        showSuccess(data.message)
        checkReadyNFTStatus()
        break
      case 'ready_nft_used':
        console.log('⚡ Ready NFT used:', data)
        showSuccess(`${data.message}`)
        loadGameData()
        checkReadyNFTStatus()
        break
      case 'challenger_timeout':
        console.log('⏰ Challenger timeout:', data)
        showSuccess(data.message)
        loadGameData()
        break
      case 'challenger_deposit_timeout':
        console.log('⏰ Challenger deposit timeout:', data)
        showInfo(data.message)
        loadGameData()
        break
      case 'player_choice':
        console.log('👤 Player made choice:', data)
        if (data.player === getGameCreator()) {
          setGameState(prev => ({ ...prev, creatorChoice: 'made' }))
          if (isJoiner) {
            showInfo('Opponent chose - now make your choice!')
          }
        } else {
          setGameState(prev => ({ ...prev, joinerChoice: 'made' }))
        }
        
        // Check if both players have chosen
        if (gameState.creatorChoice && gameState.joinerChoice) {
          showInfo('Both players ready! Starting power charge phase...')
          setGameState(prev => ({ ...prev, phase: 'charging' }))
        }
        break
      case 'flip_result':
        console.log('🎲 Flip result:', data)
        handleFlipResult({
          outcome: data.result,
          winner: data.roundWinner,
          creatorWins: data.creatorWins,
          challengerWins: data.challengerWins,
          currentRound: data.roundNumber + 1,
          isComplete: data.gameComplete
        })
        
        if (data.gameComplete) {
          handleGameCompleted({
            winner: data.gameWinner,
            gameData: gameData
          })
        }
        break
      case 'chat_message':
        // Chat messages are handled by the GameChatBox component
        console.log('💬 Chat message received:', data)
        break
    }
  }
  
  // Deposit Timer Component
  const DepositTimer = ({ gameData }) => {
    const [timeLeft, setTimeLeft] = useState(0)
    
    useEffect(() => {
      if (!gameData?.deposit_deadline) return
      
      const deadline = new Date(gameData.deposit_deadline)
      
      const timer = setInterval(() => {
        const now = new Date()
        const remaining = deadline - now
        
        if (remaining <= 0) {
          setTimeLeft(0)
          clearInterval(timer)
        } else {
          setTimeLeft(remaining)
        }
      }, 1000)
      
      return () => clearInterval(timer)
    }, [gameData?.deposit_deadline])
    
    const formatTime = (ms) => {
      const totalSeconds = Math.floor(ms / 1000)
      const minutes = Math.floor(totalSeconds / 60)
      const seconds = totalSeconds % 60
      return `${minutes}:${seconds.toString().padStart(2, '0')}`
    }
    
    const isUrgent = timeLeft < 30000 // Less than 30 seconds
    const isExpired = timeLeft <= 0
    
    return (
      <div style={{ 
        textAlign: 'center', 
        marginBottom: '1.5rem',
        padding: '1rem',
        background: isExpired ? 'rgba(255, 0, 0, 0.2)' : isUrgent ? 'rgba(255, 165, 0, 0.2)' : 'rgba(0, 255, 0, 0.1)',
        borderRadius: '0.8rem',
        border: `2px solid ${isExpired ? theme.colors.neonPink : isUrgent ? '#FFA500' : theme.colors.neonGreen}`
      }}>
        <h3 style={{ 
          color: isExpired ? theme.colors.neonPink : isUrgent ? '#FFA500' : theme.colors.neonGreen,
          margin: '0 0 0.5rem 0'
        }}>
          {isExpired ? '⏰ Time Expired!' : '⏱️ Deposit Deadline'}
        </h3>
        <div style={{ 
          fontSize: '1.5rem', 
          fontWeight: 'bold',
          color: isExpired ? theme.colors.neonPink : isUrgent ? '#FFA500' : theme.colors.neonGreen
        }}>
          {isExpired ? 'EXPIRED' : formatTime(timeLeft)}
        </div>
        {isExpired && (
          <p style={{ color: theme.colors.neonPink, margin: '0.5rem 0 0 0' }}>
            Game cancelled. Assets can be reclaimed.
          </p>
        )}
      </div>
    )
  }

  // Round Timer Component
  const RoundTimer = ({ isActive, onTimeout }) => {
    const [timeLeft, setTimeLeft] = useState(20)
    
    useEffect(() => {
      if (!isActive) {
        setTimeLeft(20)
        return
      }
      
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timer)
            onTimeout?.()
            return 0
          }
          return prev - 1
        })
      }, 1000)
      
      return () => clearInterval(timer)
    }, [isActive, onTimeout])
    
    if (!isActive) return null
    
    return (
      <div style={{
        position: 'absolute',
        top: '-50px',
        left: '50%',
        transform: 'translateX(-50%)',
        background: timeLeft <= 5 ? 'rgba(255, 0, 0, 0.2)' : 'rgba(0, 255, 65, 0.1)',
        border: `2px solid ${timeLeft <= 5 ? theme.colors.neonPink : theme.colors.neonGreen}`,
        borderRadius: '0.5rem',
        padding: '0.5rem 1rem',
        fontSize: '1.5rem',
        fontWeight: 'bold',
        color: timeLeft <= 5 ? theme.colors.neonPink : theme.colors.neonGreen
      }}>
        {timeLeft}s
      </div>
    )
  }

  // State
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
  
  // Helper functions to handle both game and listing data structures
  const getGameCreator = () => gameData?.creator || gameData?.creator_address
  const getGameJoiner = () => gameData?.challenger || gameData?.joiner || gameData?.joiner_address || gameData?.challenger_address
  const getGamePrice = () => gameData?.price || gameData?.priceUSD || gameData?.final_price || gameData?.asking_price || 0
  const getGameNFTImage = () => gameData?.nft?.image || gameData?.nft_image || gameData?.nftImage || '/placeholder-nft.svg'
  const getGameNFTName = () => gameData?.nft?.name || gameData?.nft_name || gameData?.nftName || 'Unknown NFT'
  const getGameNFTCollection = () => gameData?.nft?.collection || gameData?.nft_collection || gameData?.nftCollection || 'Unknown Collection'
  const getGameNFTContract = () => gameData?.nft?.contract || gameData?.nft_contract
  const getGameNFTTokenId = () => gameData?.nft?.tokenId || gameData?.nft_token_id
  
  // Derived state
  const isCreator = getGameCreator() === address
  const isJoiner = getGameJoiner() === address
  const isPlayer = isCreator || isJoiner
  const needsPayment = gameData?.status === 'waiting_payment' && isJoiner
  const gameActive = gameData?.status === 'active'
  const isMyTurn = gameActive && isPlayer && gameState.phase === 'choosing'
  
  // Better listing detection logic
  const isListing = (gameData?.type === 'listing' || 
                   gameData?.id?.startsWith('listing_') || 
                   gameData?.listing_id ||
                   (gameData?.status === 'active' && !gameData?.joiner && !gameData?.challenger)) &&
                   gameData?.status !== 'waiting_deposits' &&
                   gameData?.status !== 'active' // active with joiner means it's a game
  
  // Debug logging for listing detection
  console.log('🔍 Listing detection debug:', {
    gameData: gameData,
    isListing: isListing,
    gameType: gameData?.game_type,
    status: gameData?.status,
    offeredNFTs: offeredNFTs,
    isCreator: isCreator
  })
  
  const canMakeOffer = isListing && !isCreator && address && !gameData?.joiner && !gameData?.challenger
  
  // Show offer form for player 2 only if status is 'open', not the creator, and no joiner/challenger
  const canShowOfferForm = gameData?.status === 'open' && !isCreator && address && !gameData?.joiner && !gameData?.challenger;
  
  // Debug logging
  useEffect(() => {
    if (gameData) {
      console.log('🎮 Game data debug:', {
        id: gameData.id,
        type: gameData.type,
        status: gameData.status,
        creator: gameData.creator,
        joiner: gameData.joiner,
        isListing,
        canMakeOffer,
        address
      })
    }
  }, [gameData, isListing, canMakeOffer, address])
  
  // Load game data and check ready NFT status
  useEffect(() => {
    loadGameData()
    checkReadyNFTStatus()
  }, [gameId])
  
  // Check if NFT is ready for instant use
  const checkReadyNFTStatus = async () => {
    if (!gameData || !address || !isCreator) return
    
    try {
      const response = await fetch(getApiUrl(`/nft/ready-status/${address}/${getGameNFTContract()}/${getGameNFTTokenId()}`))
      if (response.ok) {
        const status = await response.json()
        setReadyNFTStatus(status)
        console.log('🎯 Ready NFT status:', status)
      }
    } catch (error) {
      console.error('Error checking ready NFT status:', error)
    }
  }
  
  // Re-check ready status when game data changes
  useEffect(() => {
    if (gameData && address && isCreator) {
      checkReadyNFTStatus()
    }
  }, [gameData, address, isCreator])
  
  // Set coin images when game loads
  useEffect(() => {
    console.log('🪙 Loading coin images for game:', {
      hasGame: !!gameData,
      hasCoinData: !!gameData?.coinData,
      coinData: gameData?.coinData
    })
    
    let coinData = null
    
    // Try to get coin data from normalized structure first
    if (gameData?.coinData) {
      coinData = gameData.coinData
    } else if (gameData?.coin_data) {
      try {
        // Parse coin_data if it's a string
        coinData = typeof gameData.coin_data === 'string' ? 
          JSON.parse(gameData.coin_data) : gameData.coin_data
      } catch (error) {
        console.error('❌ Error parsing coin data:', error)
      }
    } else if (gameData?.coin) {
      coinData = gameData.coin
    }
    
    // Set coin images
    if (coinData && coinData.headsImage && coinData.tailsImage) {
      console.log('✅ Setting custom coin images:', coinData)
      setCustomHeadsImage(coinData.headsImage)
      setCustomTailsImage(coinData.tailsImage)
    } else {
      console.log('🪙 Using default coin images')
      setCustomHeadsImage('/coins/plainh.png')
      setCustomTailsImage('/coins/plaint.png')
    }
  }, [gameData])
  
  const handleGameAction = (data) => {
    const { action, payload, from } = data
    
    switch (action) {
      case 'choice':
        if (from === gameData?.creator) {
          setGameState(prev => ({ ...prev, creatorChoice: payload.choice }))
        } else {
          setGameState(prev => ({ ...prev, joinerChoice: payload.choice }))
        }
        
        // Check if both players have chosen
        const updatedState = { ...gameState }
        if (from === gameData?.creator) {
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
      gameData: gameData,
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
      gameData: gameData,
      finalScore: {
        creatorWins: gameState.creatorWins,
        joinerWins: gameState.joinerWins
      }
    })
    setShowResultPopup(true)
  }
  
  const handleDepositNFT = async () => {
    // Initialize if not ready
    if (!contractService.isReady() && walletClient) {
      const initResult = await contractService.initialize(walletClient)
      if (!initResult.success) {
        showError('Failed to initialize contract service')
        return
      }
    }
    
    if (!contractService.isReady()) {
      showError('Wallet not connected or contract service not initialized.')
      return
    }
    try {
      setLoading(true)
      showInfo('Depositing NFT...')
      const result = await contractService.depositNFT(
        gameData.id,
        gameData.nft_contract,
        gameData.nft_token_id
      )
      if (!result.success) throw new Error(result.error)
      // Notify server
      await fetch(getApiUrl(`/games/${gameData.id}/deposit-confirmed`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          player: address,
          assetType: 'nft'
        })
      })
      showSuccess('NFT deposited!')
      loadGameData()
    } catch (error) {
      showError(error.message || 'Failed to deposit NFT')
    } finally {
      setLoading(false)
    }
  }
  const handleDepositETH = async () => {
    // Initialize if not ready
    if (!contractService.isReady() && walletClient) {
      const initResult = await contractService.initialize(walletClient)
      if (!initResult.success) {
        showError('Failed to initialize contract service')
        return
      }
    }
    
    if (!contractService.isReady()) {
      showError('Wallet not connected or contract service not initialized.')
      return
    }
    try {
      setLoading(true)
      showInfo('Depositing ETH...')
      const result = await contractService.depositETH(
        gameData.id,
        gameData.final_price
      )
      if (!result.success) throw new Error(result.error)
      // Notify server
      await fetch(getApiUrl(`/games/${gameData.id}/deposit-confirmed`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          player: address,
          assetType: 'eth'
        })
      })
      showSuccess('ETH deposited!')
      
      // In new flow, Player 2 deposit starts the game immediately
      if (gameData?.status === 'waiting_challenger_deposit') {
        showSuccess('Game starting! Both assets deposited.')
      }
      
      loadGameData()
    } catch (error) {
      showError(error.message || 'Failed to deposit ETH')
    } finally {
      setLoading(false)
    }
  }
  const handleDepositUSDC = async () => {
    // Initialize if not ready
    if (!contractService.isReady() && walletClient) {
      const initResult = await contractService.initialize(walletClient)
      if (!initResult.success) {
        showError('Failed to initialize contract service')
        return
      }
    }
    
    if (!contractService.isReady()) {
      showError('Wallet not connected or contract service not initialized.')
      return
    }
    try {
      setLoading(true)
      showInfo('Depositing USDC...')
      const usdcAmount = BigInt(Math.floor(gameData.final_price * 1000000))
      const result = await contractService.depositUSDC(
        gameData.id,
        usdcAmount,
        gameData.usdc_token_address // You may need to add this to your backend/gameData
      )
      if (!result.success) throw new Error(result.error)
      // Notify server
      await fetch(getApiUrl(`/games/${gameData.id}/deposit-confirmed`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          player: address,
          assetType: 'usdc'
        })
      })
      showSuccess('USDC deposited!')
      
      // In new flow, Player 2 deposit starts the game immediately
      if (gameData?.status === 'waiting_challenger_deposit') {
        showSuccess('Game starting! Both assets deposited.')
      }
      
      loadGameData()
    } catch (error) {
      showError(error.message || 'Failed to deposit USDC')
    } finally {
      setLoading(false)
    }
  }

  const handleReclaimAssets = async () => {
    if (!contractService.isReady()) {
      showError('Wallet not connected or contract service not initialized.')
      return
    }
    try {
      setLoading(true)
      showInfo('Reclaiming your assets...')
      
      // Call contract to reclaim assets
      const result = await contractService.reclaimAssets(gameData.id)
      if (!result.success) throw new Error(result.error)
      
      showSuccess('Assets reclaimed successfully!')
      // Navigate back to dashboard
      navigate('/')
    } catch (error) {
      showError(error.message || 'Failed to reclaim assets')
    } finally {
      setLoading(false)
    }
  }

  const handleUseReadyNFT = async () => {
    if (!readyNFTStatus.ready || !gameData || !address) return
    
    try {
      setLoading(true)
      showInfo('Using pre-loaded NFT...')
      
      const response = await fetch(getApiUrl(`/games/${gameData.id}/use-ready-nft`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ player: address })
      })
      
      if (response.ok) {
        showSuccess('Ready NFT used! Waiting for challenger...')
        loadGameData()
        checkReadyNFTStatus()
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Failed to use ready NFT')
      }
    } catch (error) {
      showError(error.message || 'Failed to use ready NFT')
    } finally {
      setLoading(false)
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
    if (gameData.blockchain_id && contractService.isInitialized()) {
      try {
        const result = await contractService.playRound(gameData.blockchain_id)
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
    if (!newMessage.trim() || !socket || socket.readyState !== WebSocket.OPEN) return
    
    const messageData = {
      type: 'chat_message',
      roomId: gameId, // Use roomId instead of gameId
      message: newMessage.trim(),
      from: address // Include the from field
    }
    
    console.log('📤 Sending chat message:', messageData)
    socket.send(JSON.stringify(messageData))
    setNewMessage('')
  }
  
  const createOffer = async () => {
    if (!newOffer.price || !gameData?.id) return
    
    try {
      setCreatingOffer(true)
      const response = await fetch(getApiUrl(`/listings/${gameData.id}/offers`), {
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
        await fetch(getApiUrl(`/listings/${gameData.id}/offers`)).then(async response => {
          if (response.ok) {
            const offersData = await response.json()
            setOffers(offersData)
          }
        })
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
      console.log('🎯 Accepting offer:', { offerId, offerPrice })
      showInfo('Accepting offer...')
      
      const response = await fetch(getApiUrl(`/offers/${offerId}/accept`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ final_price: offerPrice })
      })
      
      const result = await response.json()
      console.log('✅ Offer acceptance response:', result)
      
      if (response.ok) {
        showSuccess('Offer accepted! Game created successfully.')
        // Refresh offers and game data
        await Promise.all([
          fetch(getApiUrl(`/listings/${gameData.id}/offers`)).then(async response => {
            if (response.ok) {
              const offersData = await response.json()
              setOffers(offersData)
            }
          }),
          loadGameData() // Refresh game/listing data
        ])
      } else {
        console.error('❌ Offer acceptance failed:', result)
        const errorMessage = result.details 
          ? `${result.error}: ${result.details}` 
          : result.error || 'Failed to accept offer'
        showError(errorMessage)
      }
    } catch (error) {
      console.error('❌ Error accepting offer:', error)
      showError(`Failed to accept offer: ${error.message}`)
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
        await fetch(getApiUrl(`/listings/${gameData.id}/offers`)).then(async response => {
          if (response.ok) {
            const offersData = await response.json()
            setOffers(offersData)
          }
        })
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
  
  if (!gameData) {
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
          {/* Turn-Based Deposit Section */}
          {(gameData?.status === 'waiting_deposits' || gameData?.status === 'waiting_challenger_deposit') && (
            <PaymentSection>
              <h2 style={{ color: theme.colors.neonYellow, marginBottom: '1rem' }}>
                {gameData?.status === 'waiting_challenger_deposit' 
                  ? '💰 Challenger: Deposit Crypto to Start Game' 
                  : 'Turn-Based Asset Deposit'
                }
              </h2>
              
              {/* 3-Minute Countdown Timer */}
              <DepositTimer gameData={gameData} />
              
              {/* Turn-based deposit flow */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
                {/* Player 1 (Creator) - NFT Deposit */}
                <div style={{ 
                  padding: '1.5rem', 
                  border: `3px solid ${gameData.creator_deposited ? theme.colors.neonGreen : theme.colors.textSecondary}`, 
                  borderRadius: '1rem', 
                  textAlign: 'center'
                }}>
                  <h3 style={{ color: gameData.creator_deposited ? theme.colors.neonGreen : 'inherit' }}>
                    Player 1 (NFT) {gameData.creator_deposited && '✅'}
                  </h3>
                  <p>{getGameCreator()?.slice(0, 6)}...{getGameCreator()?.slice(-4)}</p>
                  <NFTImage src={getGameNFTImage()} alt={getGameNFTName()} />
                  <h4>{getGameNFTName()}</h4>
                  
                  {gameData.creator_deposited ? (
                    <div>
                      <p style={{ color: theme.colors.neonGreen, fontWeight: 'bold' }}>✅ NFT Already Deposited!</p>
                      <p style={{ color: theme.colors.textSecondary, fontSize: '0.9rem', marginTop: '0.5rem' }}>
                        Waiting for challenger to deposit crypto...
                      </p>
                    </div>
                  ) : (
                    <p style={{ color: theme.colors.textSecondary }}>
                      Error: NFT should already be deposited
                    </p>
                  )}
                </div>

                {/* Player 2 (Challenger) - Crypto Deposit */}
                <div style={{ 
                  padding: '1.5rem', 
                  border: `3px solid ${gameData.challenger_deposited ? theme.colors.neonGreen : ((gameData.creator_deposited || gameData?.status === 'waiting_challenger_deposit') ? theme.colors.neonPink : theme.colors.textSecondary)}`, 
                  borderRadius: '1rem', 
                  textAlign: 'center',
                  opacity: gameData?.status === 'waiting_challenger_deposit' || gameData.creator_deposited ? 1 : 0.6
                }}>
                  <h3 style={{ color: gameData.challenger_deposited ? theme.colors.neonGreen : ((gameData.creator_deposited || gameData?.status === 'waiting_challenger_deposit') && !gameData.challenger_deposited ? theme.colors.neonPink : 'inherit') }}>
                    Player 2 ({gameData.payment_token === 'USDC' ? 'USDC' : 'ETH'}) {((gameData.creator_deposited || gameData?.status === 'waiting_challenger_deposit') && !gameData.challenger_deposited) && '- YOUR TURN'}
                  </h3>
                  <p>{getGameJoiner()?.slice(0, 6)}...{getGameJoiner()?.slice(-4)}</p>
                  <PriceDisplay>${getGamePrice()}</PriceDisplay>
                  
                  {gameData.challenger_deposited ? (
                    <p style={{ color: theme.colors.neonGreen, fontWeight: 'bold' }}>✅ Crypto Deposited!</p>
                  ) : (
                    <>
                      {isJoiner ? (
                        <PayButton 
                          onClick={gameData.payment_token === 'USDC' ? handleDepositUSDC : handleDepositETH} 
                          disabled={loading || !(gameData.creator_deposited || gameData?.status === 'waiting_challenger_deposit')}
                          style={{ 
                            background: (gameData.creator_deposited || gameData?.status === 'waiting_challenger_deposit') ? theme.colors.neonPink : theme.colors.textSecondary,
                            animation: (gameData.creator_deposited || gameData?.status === 'waiting_challenger_deposit') ? 'pulse 2s infinite' : 'none'
                          }}
                        >
                          {!(gameData.creator_deposited || gameData?.status === 'waiting_challenger_deposit') ? 'Waiting for Player 1' : `Deposit $${getGamePrice()} ${gameData.payment_token === 'USDC' ? 'USDC' : 'ETH'}`}
                        </PayButton>
                      ) : (
                        <p style={{ color: theme.colors.textSecondary }}>
                          {!(gameData.creator_deposited || gameData?.status === 'waiting_challenger_deposit') ? 'Waiting for Player 1...' : 'Waiting for Player 2...'}
                        </p>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Game Status */}
              <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                {gameData.creator_deposited && gameData.challenger_deposited ? (
                  <p style={{ color: theme.colors.neonGreen, fontSize: '1.2rem', fontWeight: 'bold' }}>
                    🎮 Both players deposited! Game starting...
                  </p>
                ) : gameData?.status === 'waiting_challenger_deposit' ? (
                  <p style={{ color: theme.colors.neonBlue, fontSize: '1.1rem' }}>
                    💰 NFT deposited! Waiting for ${getGamePrice()} {gameData.payment_token === 'USDC' ? 'USDC' : 'ETH'} deposit...
                  </p>
                ) : gameData.deposit_deadline && new Date() > new Date(gameData.deposit_deadline) ? (
                  <div>
                    <p style={{ color: theme.colors.neonPink, fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '1rem' }}>
                      ⏰ Deposit deadline expired! Game cancelled.
                    </p>
                    {((gameData.creator_deposited && isCreator) || (gameData.challenger_deposited && isJoiner)) && (
                      <PayButton 
                        onClick={handleReclaimAssets}
                        style={{ 
                          background: theme.colors.neonPink,
                          animation: 'pulse 2s infinite'
                        }}
                      >
                        Reclaim Your Assets
                      </PayButton>
                    )}
                  </div>
                ) : (
                  <p style={{ color: theme.colors.textSecondary }}>
                    {gameData?.status === 'waiting_challenger_deposit' 
                      ? 'NFT already deposited - challenger needs to add crypto'
                      : 'Turn Order: Player 1 deposits NFT first → Player 2 deposits crypto → Game starts'
                    }
                  </p>
                )}
              </div>
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
            <CoinSection style={{ position: 'relative' }}>
              <RoundTimer 
                isActive={gameActive && gameState.phase === 'charging'}
                onTimeout={() => {
                  if (gameState.chargingPlayer === address) {
                    handlePowerChargeStop()
                  }
                }}
              />
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
                size={isMobile ? 250 : 400} // Smaller size for mobile
              />
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
                      href={`https://basescan.org/token/${getGameNFTContract()}?a=${getGameNFTTokenId()}`}
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
                      href={`https://opensea.io/assets/base/${getGameNFTContract()}/${getGameNFTTokenId()}`}
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
                
                {/* Coin Display */}
                <div style={{ marginBottom: '1rem' }}>
                  <p style={{ margin: '0 0 0.5rem 0', color: theme.colors.textSecondary, fontSize: '0.9rem' }}>
                    <strong>Coin:</strong>
                  </p>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <div style={{ textAlign: 'center' }}>
                      <img 
                        src={customHeadsImage} 
                        alt="Heads" 
                        style={{ 
                          width: '40px', 
                          height: '40px', 
                          borderRadius: '0.25rem',
                          border: `2px solid ${theme.colors.neonYellow}`
                        }} 
                      />
                      <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.7rem', color: theme.colors.textSecondary }}>
                        Heads
                      </p>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <img 
                        src={customTailsImage} 
                        alt="Tails" 
                        style={{ 
                          width: '40px', 
                          height: '40px', 
                          borderRadius: '0.25rem',
                          border: `2px solid ${theme.colors.neonYellow}`
                        }} 
                      />
                      <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.7rem', color: theme.colors.textSecondary }}>
                        Tails
                      </p>
                    </div>
                  </div>
                </div>
                
                <div style={{ marginTop: 'auto' }}>
                  <p style={{ margin: '0', color: theme.colors.textSecondary, fontSize: '0.8rem' }}>
                    Status: {gameData?.status || 'Unknown'}
                  </p>
                  <p style={{ margin: '0.25rem 0 0 0', color: theme.colors.textSecondary, fontSize: '0.8rem' }}>
                    Type: {isListing ? 'Listing' : 'Game'}
                  </p>
                  {isListing && (
                    <p style={{ margin: '0.25rem 0 0 0', color: theme.colors.neonYellow, fontSize: '0.8rem' }}>
                      Accepting offers
                    </p>
                  )}
                </div>
              </InfoSection>
              
              {/* Chat Section */}
              <ChatSection>
                <h4 style={{ margin: '0 0 1rem 0', color: theme.colors.neonBlue }}>Game Chat</h4>
                <GameChatBox 
                  gameId={gameId} 
                  socket={socket} 
                  connected={!!socket && socket.readyState === WebSocket.OPEN}
                />
              </ChatSection>
              
{/* Offers Section */}
<OffersSection>
  <h4 style={{ margin: '0 0 1rem 0', color: theme.colors.neonPink }}>
    {gameData?.status === 'waiting_challenger_deposit' && isJoiner ? 'Payment Required' : 'Offers'}
  </h4>
  
  {/* Show payment UI for Player 2 whose offer was accepted */}
  {gameData?.status === 'waiting_challenger_deposit' && isJoiner && (
    <div style={{
      background: 'rgba(0, 255, 65, 0.1)',
      border: `2px solid ${theme.colors.neonGreen}`,
      borderRadius: '0.5rem',
      padding: '1rem',
      marginBottom: '1rem',
      animation: 'pulse 2s infinite'
    }}>
      <h5 style={{ 
        margin: '0 0 0.5rem 0', 
        color: theme.colors.neonGreen,
        textAlign: 'center'
      }}>
        🎉 Your Offer Was Accepted!
      </h5>
      
      {/* Countdown Timer */}
      <DepositTimer gameData={gameData} />
      
      <div style={{ 
        textAlign: 'center',
        marginBottom: '1rem'
      }}>
        <p style={{ 
          fontSize: '1.2rem', 
          fontWeight: 'bold',
          color: theme.colors.neonYellow,
          margin: '0.5rem 0'
        }}>
          Deposit ${getGamePrice()} {gameData.payment_token || 'ETH'}
        </p>
        <p style={{ 
          fontSize: '0.9rem',
          color: theme.colors.textSecondary
        }}>
          to start the game
        </p>
      </div>
      
      <PayButton 
        onClick={gameData.payment_token === 'USDC' ? handleDepositUSDC : handleDepositETH} 
        disabled={paymentLoading}
        style={{ 
          width: '100%',
          background: 'linear-gradient(45deg, #00FF41, #39FF14)',
          animation: 'pulse 1.5s infinite'
        }}
      >
        {paymentLoading ? (
          <>
            <LoadingSpinner /> Processing...
          </>
        ) : (
          `Pay $${getGamePrice()} ${gameData.payment_token || 'ETH'}`
        )}
      </PayButton>
    </div>
  )}
  
  {/* Show countdown for other viewers and Player 1 */}
  {gameData?.status === 'waiting_challenger_deposit' && !isJoiner && (
    <div style={{
      background: 'rgba(255, 165, 0, 0.1)',
      border: `2px solid #FFA500`,
      borderRadius: '0.5rem',
      padding: '1rem',
      marginBottom: '1rem'
    }}>
      <h5 style={{ 
        margin: '0 0 0.5rem 0', 
        color: '#FFA500',
        textAlign: 'center'
      }}>
        ⏳ Offer Accepted - Waiting for Payment
      </h5>
      
      <DepositTimer gameData={gameData} />
      
      <p style={{ 
        textAlign: 'center',
        color: theme.colors.textSecondary,
        fontSize: '0.9rem',
        margin: '0.5rem 0 0 0'
      }}>
        {isCreator ? 
          'Waiting for challenger to deposit crypto...' : 
          'Another player is depositing crypto to start the game...'
        }
      </p>
    </div>
  )}
  
  {/* Normal offers display for listings */}
  {isListing && !gameData?.joiner && gameData?.status !== 'waiting_challenger_deposit' && (
    <>
      {/* NFT Battle Offers - Show for listings, not active games */}
      <>
        {/* For NFT vs Crypto games - show price offer form */}
        {canShowOfferForm && gameData?.game_type !== 'nft-vs-nft' && (
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
        
        {/* For NFT vs NFT games - show NFT offer component */}
        {gameData?.game_type === 'nft-vs-nft' && (
          <NFTOfferComponent
            gameId={gameId}
            gameData={gameData}
            isCreator={isCreator}
            socket={socket}
            connected={!!socket && socket.readyState === WebSocket.OPEN}
            offeredNFTs={offeredNFTs}
            onOfferSubmitted={(offerData) => {
              console.log('📤 NFT offer submitted:', offerData)
            }}
            onOfferAccepted={(offer) => {
              console.log('✅ NFT offer accepted:', offer)
              setOfferedNFTs(prev => prev.filter(o => o !== offer))
            }}
          />
        )}
      </>
      
      {!isListing && gameData?.status !== 'waiting_challenger_deposit' && (
        <p style={{ color: theme.colors.textSecondary, textAlign: 'center', marginTop: '2rem' }}>
          Game in progress - no offers available
        </p>
      )}
    </>
  )}
                
                {/* Offers List for NFT vs Crypto games */}
                {isListing && gameData?.game_type !== 'nft-vs-nft' && (
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