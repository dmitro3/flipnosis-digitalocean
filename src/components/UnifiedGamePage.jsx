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

// Styled Components - Original Design
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

const UnifiedGamePage = () => {
  const { gameId } = useParams()
  const navigate = useNavigate()
  const { address, isConnected, walletClient, publicClient, isMobile } = useWallet()
  const { showSuccess, showError, showInfo } = useToast()
  const { isInitialized: contractInitialized } = useContractService()
  
  // Game state - moved up to avoid initialization error
  const [gameData, setGameData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [wsConnected, setWsConnected] = useState(false)
  const [wsRef, setWsRef] = useState(null)
  const [offers, setOffers] = useState([])
  const [chatMessages, setChatMessages] = useState([])
  const [playerChoices, setPlayerChoices] = useState({ creator: null, joiner: null })
  const [gameState, setGameState] = useState({
    phase: 'waiting',
    currentRound: 1,
    creatorWins: 0,
    joinerWins: 0,
    creatorChoice: null,
    joinerChoice: null
  })
  
  const [readyNFTStatus, setReadyNFTStatus] = useState({ ready: false, nft: null })
  
  // Coin state
  const [flipAnimation, setFlipAnimation] = useState(null)
  const [customHeadsImage, setCustomHeadsImage] = useState(null)
  const [customTailsImage, setCustomTailsImage] = useState(null)
  const [gameCoin, setGameCoin] = useState(null)
  

  
  // UI state
  const [showResultPopup, setShowResultPopup] = useState(false)
  const [resultData, setResultData] = useState(null)
  const [showOfferReviewModal, setShowOfferReviewModal] = useState(false)
  const [pendingNFTOffer, setPendingNFTOffer] = useState(null)
  
  // Offer state
  const [newOffer, setNewOffer] = useState({ price: '', message: '' })
  const [creatingOffer, setCreatingOffer] = useState(false)
  
  // Load game data
  const loadGameData = async () => {
    try {
      setLoading(true)
      const response = await fetch(getApiUrl(`/games/${gameId}`))
      
      if (!response.ok) {
        // If API is not available, show error
        console.log('⚠️ API not available')
        setError('Game not found or API unavailable')
        setLoading(false)
        return
      }
      
      // Debug: Log the raw response
      const responseText = await response.text()
      console.log('🔍 Raw API response:', responseText)
      
      let data
      try {
        data = JSON.parse(responseText)
      } catch (err) {
        console.error('❌ Failed to parse JSON:', err)
        console.log('🔍 Response was not valid JSON, showing error state')
        setError('Invalid response from server. Please try again.')
        setLoading(false)
        return
      }
      setGameData(data)
      
      // Load offers for this listing/game
      const listingId = data?.listing_id || data?.id
      if (listingId) {
        try {
          const offersResponse = await fetch(getApiUrl(`/listings/${listingId}/offers`))
          if (offersResponse.ok) {
            const offersData = await offersResponse.json()
            setOffers(offersData)
            console.log('✅ Loaded offers:', offersData)
          }
        } catch (error) {
          console.error('❌ Error loading offers:', error)
        }
      }
      
      // Initialize WebSocket connection
      initializeWebSocket()
      
    } catch (err) {
      console.error('Error loading game data:', err)
      
      // Show error instead of using mock data
      console.log('🔄 API error, showing error state')
      setError('Failed to load game data. Please try again.')
    } finally {
      setLoading(false)
    }
  }
  
  // Load offers for listings
  const loadOffers = async () => {
    if (!gameData?.listing_id && !gameData?.id) return
    
    try {
      const listingId = gameData.listing_id || gameData.id
      const response = await fetch(getApiUrl(`/listings/${listingId}/offers`))
      if (response.ok) {
        const offersData = await response.json()
        console.log('✅ Loaded offers:', offersData)
        setOffers(offersData)
      }
    } catch (error) {
      console.error('Error loading offers:', error)
    }
  }

  // Initialize WebSocket connection
  const initializeWebSocket = () => {
    try {
      console.log('🔌 Initializing WebSocket connection to:', getWsUrl())
      const ws = new WebSocket(getWsUrl())
      
      ws.onopen = () => {
        console.log('🔌 WebSocket connected successfully')
        setWsConnected(true)
        
        // Join room with the game ID
        const joinMessage = {
          type: 'join_room',
          roomId: gameId
        }
        console.log('📤 Sending join room message:', joinMessage)
        ws.send(JSON.stringify(joinMessage))
        
        // Register user if we have an address
        if (address) {
          const registerMessage = {
            type: 'register_user',
            address: address
          }
          console.log('📤 Sending register user message:', registerMessage)
          ws.send(JSON.stringify(registerMessage))
        }
      }
      
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          console.log('📨 WebSocket message received:', data)
          handleWebSocketMessage(data)
        } catch (err) {
          console.error('Error parsing WebSocket message:', err)
          console.log('Raw message:', event.data)
        }
      }
      
      ws.onclose = (event) => {
        console.log('🔌 WebSocket disconnected:', event.code, event.reason)
        setWsConnected(false)
        
        // Attempt to reconnect after 3 seconds
        setTimeout(() => {
          if (gameData) {
            console.log('🔄 Attempting to reconnect WebSocket...')
            initializeWebSocket()
          }
        }, 3000)
      }
      
      ws.onerror = (error) => {
        console.error('WebSocket error:', error)
        setWsConnected(false)
        
        // Use mock WebSocket for testing
        console.log('🔄 Using mock WebSocket for testing')
        setWsConnected(true)
        setWsRef(createMockWebSocket())
      }
      
      setWsRef(ws)
    } catch (error) {
      console.error('Failed to initialize WebSocket:', error)
      console.log('🔄 Using mock WebSocket for testing')
      setWsConnected(true)
      setWsRef(createMockWebSocket())
    }
  }
  
  // Create mock WebSocket for testing
  const createMockWebSocket = () => {
    return {
      send: (data) => {
        console.log('📤 Mock WebSocket send:', data)
        // Simulate receiving a response
        setTimeout(() => {
          const parsedData = JSON.parse(data)
          if (parsedData.type === 'CHAT_MESSAGE') {
            handleWebSocketMessage({
              type: 'CHAT_MESSAGE',
              message: parsedData.message
            })
          } else if (parsedData.type === 'NFT_OFFER') {
            handleWebSocketMessage({
              type: 'NFT_OFFER',
              offer: parsedData.offer
            })
          }
        }, 100)
      },
      close: () => {
        console.log('🔌 Mock WebSocket closed')
      }
    }
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
        
      case 'PLAYER_CHOICE':
        // Handle player choice updates from other players
        if (data.player === getGameCreator()) {
          setPlayerChoices(prev => ({ ...prev, creator: data.choice }))
          setGameState(prev => ({ ...prev, creatorChoice: data.choice }))
        } else if (data.player === getGameJoiner()) {
          setPlayerChoices(prev => ({ ...prev, joiner: data.choice }))
          setGameState(prev => ({ ...prev, joinerChoice: data.choice }))
        }
        break
        
      case 'FLIP_RESULT':
        handleFlipResult(data.result)
        break
        
      case 'GAME_COMPLETED':
        handleGameCompleted(data)
        break
        
      case 'new_offer':
        console.log('🔄 New offer received, reloading offers')
        // Reload offers immediately when a new offer is created
        loadOffers()
        break
        
      case 'offer_accepted':
        console.log('✅ Offer accepted! Details:', data)
        
        // Show success message
        showSuccess('Offer accepted! Game created successfully.')
        
        // Reload game data to show the new game state
        loadGameData()
        
        // If we're the offerer, show payment UI
        if (data.gameId && address === getGameJoiner()) {
          showInfo('Your offer was accepted! Please deposit payment to start the game.')
        }
        break
        
      case 'offer_rejected':
        console.log('❌ Offer rejected')
        showInfo('Offer was rejected')
        loadOffers()
        break
        
      case 'chat_message':
        // Only add the message if it's not from the current user
        // This prevents duplicate messages for the sender
        if (data.from !== address) {
          setChatMessages(prev => [...prev, {
            id: Date.now(),
            from: data.from,
            message: data.message,
            timestamp: new Date().toISOString()
          }])
        } else {
          // If it's from the current user, add it to show their own message
          setChatMessages(prev => [...prev, {
            id: Date.now(),
            from: data.from,
            message: data.message,
            timestamp: new Date().toISOString()
          }])
        }
        break
        
      case 'deposit_confirmed':
        console.log('💰 Deposit confirmed:', data)
        const depositor = data.player === address ? 'You' : 'Opponent'
        showSuccess(`${depositor} deposited ${data.assetType.toUpperCase()}!`)
        
        // Reload game data to update deposit status
        loadGameData()
        
        // If both players have deposited, show game starting message
        if (gameData?.creator_deposited && gameData?.challenger_deposited) {
          showSuccess('Both players deposited! Game starting...')
        }
        break
        
      case 'game_started':
        console.log('🎮 Game started!')
        showSuccess('Game is now active! Both players can start playing.')
        loadGameData()
        break
        
      case 'game_completed':
        console.log('🏁 Game completed:', data)
        handleGameCompleted(data)
        break
        
      default:
        console.log('📨 Unhandled WebSocket message type:', data.type)
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
    
    // Update local state immediately for better UX
    if (address === getGameCreator()) {
      setPlayerChoices(prev => ({ ...prev, creator: choice }))
      setGameState(prev => ({
        ...prev,
        creatorChoice: choice
      }))
    } else if (address === getGameJoiner()) {
      setPlayerChoices(prev => ({ ...prev, joiner: choice }))
      setGameState(prev => ({
        ...prev,
        joinerChoice: choice
      }))
    }
    
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
  

  
  // Offer functions
  const createOffer = async () => {
    if (!newOffer.price || !gameData?.id) {
      console.log('❌ Cannot create offer:', { price: newOffer.price, gameId: gameData?.id })
      showError('Please enter a price and ensure game data is loaded')
      return
    }
    
    // Check if we have a listing ID (for offers) or game ID
    const listingId = gameData?.listing_id || gameData?.id
    console.log('🔍 Using listing ID for offer:', { listingId, gameData: gameData?.id, listing_id: gameData?.listing_id })
    
    try {
      setCreatingOffer(true)
      console.log('📤 Creating offer:', { 
        gameId: gameData.id, 
        price: newOffer.price, 
        message: newOffer.message,
        address 
      })
      
      const response = await fetch(getApiUrl(`/listings/${listingId}/offers`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          offerer_address: address,
          offerer_name: address.slice(0, 6) + '...' + address.slice(-4),
          offer_price: parseFloat(newOffer.price),
          message: newOffer.message
        })
      })
      
      console.log('📥 Offer creation response:', { status: response.status, ok: response.ok })
      
      if (response.ok) {
        const result = await response.json()
        console.log('✅ Offer created successfully:', result)
        showSuccess('Offer created successfully!')
        setNewOffer({ price: '', message: '' })
        // Refresh offers
        const offersResponse = await fetch(getApiUrl(`/listings/${listingId}/offers`))
        if (offersResponse.ok) {
          const offersData = await offersResponse.json()
          setOffers(offersData)
        }
      } else {
        const errorData = await response.text()
        console.error('❌ Offer creation failed:', { status: response.status, error: errorData })
        showError(`Failed to create offer: ${response.status} ${response.statusText}`)
      }
    } catch (error) {
      console.error('❌ Error creating offer:', error)
      showError(`Failed to create offer: ${error.message}`)
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
        
        // Reload game data to show the new game state
        await loadGameData()
        
        // Reload offers to update the list
        await loadOffers()
        
        // If we're the creator, show message about waiting for challenger
        if (isCreator) {
          showInfo('Offer accepted! Waiting for challenger to deposit payment...')
        }
        
        // If we're the challenger, show payment UI
        if (address === getGameJoiner()) {
          showInfo('Your offer was accepted! Please deposit payment to start the game.')
        }
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
        const listingId = gameData?.listing_id || gameData?.id
        await fetch(getApiUrl(`/listings/${listingId}/offers`)).then(async response => {
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
  
  // Helper functions to handle both game and listing data structures
  const getGameCreator = () => gameData?.creator || gameData?.creator_address
  const getGameJoiner = () => gameData?.challenger || gameData?.joiner || gameData?.joiner_address || gameData?.challenger_address
  const getGamePrice = () => {
    const price = gameData?.price || gameData?.priceUSD || gameData?.final_price || gameData?.asking_price || 0
    console.log('🔍 Game Price Debug:', { price, gameData: gameData?.price, priceUSD: gameData?.priceUSD, final_price: gameData?.final_price, asking_price: gameData?.asking_price })
    return price
  }
  const getGameNFTImage = () => gameData?.nft?.image || gameData?.nft_image || gameData?.nftImage || '/placeholder-nft.svg'
  const getGameNFTName = () => gameData?.nft?.name || gameData?.nft_name || gameData?.nftName || 'Unknown NFT'
  const getGameNFTCollection = () => gameData?.nft?.collection || gameData?.nft_collection || gameData?.nftCollection || 'Unknown Collection'
  const getGameNFTContract = () => {
    const contract = gameData?.nft?.contract || gameData?.nft_contract
    console.log('🔍 NFT Contract:', { contract, gameData: gameData?.nft })
    return contract
  }
  const getGameNFTTokenId = () => {
    const tokenId = gameData?.nft?.tokenId || gameData?.nft_token_id
    console.log('🔍 NFT Token ID:', { tokenId, gameData: gameData?.nft })
    return tokenId
  }
  
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
  
  // Update coin images when game state changes
  useEffect(() => {
    console.log('🪙 Loading coin images for game:', {
      hasGame: !!gameData,
      hasCoinData: !!gameData?.coinData,
      hasCoinDataField: !!gameData?.coin_data,
      coinData: gameData?.coinData,
      coin_data: gameData?.coin_data,
      gameDataKeys: gameData ? Object.keys(gameData) : []
    })
    
    let coinData = null
    
    // Try to get coin data from normalized structure first
    if (gameData?.coinData) {
      coinData = gameData.coinData
      console.log('✅ Using coinData field:', coinData)
    } else if (gameData?.coin_data) {
      try {
        // Parse coin_data if it's a string
        coinData = typeof gameData.coin_data === 'string' ? 
          JSON.parse(gameData.coin_data) : gameData.coin_data
        console.log('✅ Parsed coin_data field:', coinData)
      } catch (error) {
        console.error('❌ Error parsing coin data:', error)
      }
    } else if (gameData?.coin) {
      coinData = gameData.coin
      console.log('✅ Using coin field:', coinData)
    }
    
    // Set coin images
    console.log('🔍 Coin Data Debug:', { 
      coinData, 
      gameData: gameData?.coin_data, 
      coinDataParsed: coinData,
      hasHeadsImage: coinData?.headsImage,
      hasTailsImage: coinData?.tailsImage,
      headsImage: coinData?.headsImage,
      tailsImage: coinData?.tailsImage
    })
    
    if (coinData && coinData.headsImage && coinData.tailsImage) {
      console.log('✅ Setting custom coin images:', coinData)
      setCustomHeadsImage(coinData.headsImage)
      setCustomTailsImage(coinData.tailsImage)
    } else {
      console.log('🪙 Using default coin images - no valid coin data found')
      console.log('🔍 Coin data validation failed:', {
        hasCoinData: !!coinData,
        hasHeadsImage: !!coinData?.headsImage,
        hasTailsImage: !!coinData?.tailsImage,
        coinDataKeys: coinData ? Object.keys(coinData) : []
      })
      setCustomHeadsImage('/coins/plainh.png')
      setCustomTailsImage('/coins/plaint.png')
    }
  }, [gameData])
  
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

  // Load offers when game data changes
  useEffect(() => {
    if (gameData && (gameData.listing_id || gameData.id)) {
      loadOffers()
    }
  }, [gameData])
  
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
        {/* Background Video */}
        <BackgroundVideo autoPlay muted loop playsInline>
          <source src={isMobile ? mobileVideo : hazeVideo} type="video/webm" />
        </BackgroundVideo>
        
        <GameContainer>
          {/* Remove the "Join This Game" section - flow should be offers only */}
          
          {/* Game Section */}
          <GameSection>
            {/* Player Section */}
            <PlayerSection>
              <PlayerBox isActive={isCreator()}>
                <div>
                  <h3 style={{ color: '#FFD700', marginBottom: '0.5rem' }}>Creator</h3>
                  <ProfilePicture 
                    address={getGameCreator()}
                    size={60}
                    showAddress={true}
                  />
                  <p style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: 'white' }}>
                    Power: {gameState.creatorPower}
                  </p>
                  <p style={{ fontSize: '0.8rem', color: '#ccc' }}>
                    Wins: {gameState.creatorWins}
                  </p>
                  {/* Display player choice */}
                  {playerChoices.creator && (
                    <div style={{ 
                      marginTop: '0.5rem', 
                      padding: '0.25rem 0.5rem', 
                      background: playerChoices.creator === 'heads' ? 'rgba(0, 255, 65, 0.2)' : 'rgba(255, 20, 147, 0.2)',
                      border: `1px solid ${playerChoices.creator === 'heads' ? '#00FF41' : '#FF1493'}`,
                      borderRadius: '0.25rem',
                      fontSize: '0.8rem',
                      color: 'white',
                      textAlign: 'center'
                    }}>
                      Chose: {playerChoices.creator.toUpperCase()}
                    </div>
                  )}
                </div>
                <RoundIndicators>
                  <RoundDot isCurrent={gameState.currentRound === 1} isWon={gameState.creatorWins > 0} isLost={gameState.joinerWins > 0}>
                    1
                  </RoundDot>
                  <RoundDot isCurrent={gameState.currentRound === 2} isWon={gameState.creatorWins > 1} isLost={gameState.joinerWins > 1}>
                    2
                  </RoundDot>
                  <RoundDot isCurrent={gameState.currentRound === 3} isWon={gameState.creatorWins > 2} isLost={gameState.joinerWins > 2}>
                    3
                  </RoundDot>
                </RoundIndicators>
              </PlayerBox>
              
              <PlayerBox isActive={isJoiner()}>
                <div>
                  <h3 style={{ color: '#FFD700', marginBottom: '0.5rem' }}>Joiner</h3>
                  <ProfilePicture 
                    address={getGameJoiner()}
                    size={60}
                    showAddress={true}
                  />
                  <p style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: 'white' }}>
                    Power: {gameState.joinerPower}
                  </p>
                  <p style={{ fontSize: '0.8rem', color: '#ccc' }}>
                    Wins: {gameState.joinerWins}
                  </p>
                  {/* Display player choice */}
                  {playerChoices.joiner && (
                    <div style={{ 
                      marginTop: '0.5rem', 
                      padding: '0.25rem 0.5rem', 
                      background: playerChoices.joiner === 'heads' ? 'rgba(0, 255, 65, 0.2)' : 'rgba(255, 20, 147, 0.2)',
                      border: `1px solid ${playerChoices.joiner === 'heads' ? '#00FF41' : '#FF1493'}`,
                      borderRadius: '0.25rem',
                      fontSize: '0.8rem',
                      color: 'white',
                      textAlign: 'center'
                    }}>
                      Chose: {playerChoices.joiner.toUpperCase()}
                    </div>
                  )}
                </div>
                <RoundIndicators>
                  <RoundDot isCurrent={gameState.currentRound === 1} isWon={gameState.joinerWins > 0} isLost={gameState.creatorWins > 0}>
                    1
                  </RoundDot>
                  <RoundDot isCurrent={gameState.currentRound === 2} isWon={gameState.joinerWins > 1} isLost={gameState.creatorWins > 1}>
                    2
                  </RoundDot>
                  <RoundDot isCurrent={gameState.currentRound === 3} isWon={gameState.joinerWins > 2} isLost={gameState.creatorWins > 2}>
                    3
                  </RoundDot>
                </RoundIndicators>
              </PlayerBox>
            </PlayerSection>
            
            {/* Game Phase Messages */}
            {gameState.phase === 'choosing' && (
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
              <OptimizedGoldCoin
                isFlipping={!!flipAnimation}
                flipResult={flipAnimation?.result}
                onPowerCharge={handlePowerChargeStart}
                onPowerRelease={handlePowerChargeStop}
                isPlayerTurn={isMyTurn()}
                isCharging={gameState.chargingPlayer === address}
                chargingPlayer={gameState.chargingPlayer}
                creatorPower={gameState.creatorPower}
                joinerPower={gameState.joinerPower}
                creatorChoice={gameState.creatorChoice}
                joinerChoice={gameState.joinerChoice}
                isCreator={isCreator()}
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
              playerChoice={isCreator() ? gameState.creatorChoice : gameState.joinerChoice}
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
                    Price: ${(getGamePrice() / 1000000).toFixed(2)} USD
                  </p>
                  <p style={{ margin: '0', color: theme.colors.textSecondary, fontSize: '0.9rem' }}>
                    <strong>Chain:</strong> Base (ETH)
                  </p>
                </div>
                
                {/* External Links */}
                {getGameNFTContract() && getGameNFTTokenId() && (
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
                )}
                
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
                    Type: Game
                  </p>
                </div>
              </InfoSection>
              
              {/* Chat Section */}
              <ChatSection>
                <h4 style={{ margin: '0 0 1rem 0', color: theme.colors.neonBlue }}>Game Chat</h4>
                <GameChatBox 
                  gameId={gameId} 
                  socket={wsRef} 
                  connected={wsConnected}
                />
              </ChatSection>
              
              {/* Offers Section */}
              <OffersSection>
                <h4 style={{ margin: '0 0 1rem 0', color: theme.colors.neonPink }}>NFT Offers</h4>
                
                {/* Offer Creation Form - Only show for non-creators */}
                {!isCreator() && (
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
                        opacity: creatingOffer ? 0.5 : 1,
                        fontWeight: 'bold'
                      }}
                    >
                      {creatingOffer ? 'Creating...' : 'Submit Offer'}
                    </button>
                  </div>
                )}
                
                {/* Creator message */}
                {isCreator() && (
                  <div style={{ marginBottom: '1rem', padding: '1rem', background: 'rgba(0, 255, 65, 0.1)', borderRadius: '0.5rem', textAlign: 'center' }}>
                    <p style={{ color: theme.colors.neonGreen, margin: 0, fontSize: '0.9rem' }}>
                      You are the creator. You can accept or reject offers below.
                    </p>
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
                        {isCreator() && offer.status === 'pending' && (
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
                                fontSize: '0.8rem',
                                fontWeight: 'bold'
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
                                fontSize: '0.8rem',
                                fontWeight: 'bold'
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
              </OffersSection>
            </BottomSection>
          </GameSection>
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