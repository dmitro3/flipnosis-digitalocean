// 1. React imports first
import React, { useState, useEffect, useRef } from 'react'

// 2. Third-party imports
import { useParams, useNavigate } from 'react-router-dom'
import { ThemeProvider } from '@emotion/react'
import styled from '@emotion/styled'
import { ethers } from 'ethers'

// 3. Context imports
import { useWallet } from '../contexts/WalletContext'
import { useToast } from '../contexts/ToastContext'

// 4. Service imports
import contractService from '../services/ContractService'
import { useContractService } from '../utils/useContractService'

// 5. Component imports
import OptimizedGoldCoin from './OptimizedGoldCoin'

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
  
  @keyframes pulse {
    0% { opacity: 1; }
    50% { opacity: 0.5; }
    100% { opacity: 1; }
  }
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

const DepositCountdown = styled.div`
  background: ${props => props.isUrgent ? 'rgba(255, 0, 0, 0.2)' : 'rgba(255, 165, 0, 0.2)'};
  border: 2px solid ${props => props.isUrgent ? '#ff0000' : '#ffa500'};
  border-radius: 0.75rem;
  padding: 1rem;
  text-align: center;
  margin: 1rem 0;
  animation: ${props => props.isUrgent ? 'urgentPulse 1s infinite' : 'none'};
  
  @keyframes urgentPulse {
    0% { opacity: 1; }
    50% { opacity: 0.7; }
    100% { opacity: 1; }
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
    joinerChoice: null,
    chargingPlayer: null,
    creatorPower: 0,
    joinerPower: 0
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
  
  // Countdown state
  const [depositTimeLeft, setDepositTimeLeft] = useState(null)
  const [countdownInterval, setCountdownInterval] = useState(null)
  const [roundCountdown, setRoundCountdown] = useState(null)
  const [roundCountdownInterval, setRoundCountdownInterval] = useState(null)
  
  // Live updates state
  const [offersRefreshInterval, setOffersRefreshInterval] = useState(null)
  
  // ETH amount state
  const [ethAmount, setEthAmount] = useState(null)
  
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
      
      // Validate data structure
      if (!data || typeof data !== 'object') {
        console.error('❌ Invalid data structure:', data)
        setError('Invalid game data received from server.')
        setLoading(false)
        return
      }
      setGameData(data)
      
      // Calculate ETH amount if we have a final price
      if (data.final_price) {
        // First check if eth_amount is already available from database
        if (data.eth_amount) {
          console.log('💰 Using ETH amount from database:', data.eth_amount)
          setEthAmount(BigInt(data.eth_amount))
        } else {
          // Calculate ETH amount if not available in database
          await calculateAndSetEthAmount(data.final_price)
        }
      } else {
        setEthAmount(null)
      }
      
      // Start countdown if game is waiting for challenger deposit
      if (data.status === 'waiting_challenger_deposit' && data.deposit_deadline) {
        const now = new Date().getTime()
        const deadline = new Date(data.deposit_deadline).getTime()
        if (deadline > now) {
          startDepositCountdown(data.deposit_deadline)
        }
      }
      
      // Set game phase to choosing if both players have deposited and game is active
      if (data.creator_deposited && data.challenger_deposited && 
          (data.status === 'active' || data.status === 'waiting_choices')) {
        console.log('🎮 Both players deposited, setting game phase to choosing')
        
        // Only show success message if we're transitioning from waiting to active
        const wasWaiting = gameState.phase !== 'choosing' || !gameState.phase
        if (wasWaiting) {
          setGameState(prev => ({
            ...prev,
            phase: 'choosing',
            creatorChoice: null,
            joinerChoice: null
          }))
          
          // Show success message for both players
          if (address === getGameCreator() || address === getGameJoiner()) {
            showSuccess('🎮 Game is now active! Choose heads or tails to begin!')
          }
        } else {
          // Just update the state without showing message again
          setGameState(prev => ({
            ...prev,
            phase: 'choosing',
            creatorChoice: null,
            joinerChoice: null
          }))
        }
      }
      
      // Sync player choices from game data if available
      if (data.game_data && data.game_data.choices) {
        const { creatorChoice, joinerChoice } = data.game_data.choices
        if (creatorChoice || joinerChoice) {
          setPlayerChoices(prev => ({
            creator: creatorChoice || prev.creator,
            joiner: joinerChoice || prev.joiner
          }))
          
          setGameState(prev => ({
            ...prev,
            creatorChoice: creatorChoice || prev.creatorChoice,
            joinerChoice: joinerChoice || prev.joinerChoice
          }))
          
          console.log('🔄 Synced choices from game data:', { creatorChoice, joinerChoice })
        }
      }
      
      // Load offers for this listing/game
      const listingId = data?.listing_id || data?.id
      if (listingId) {
        try {
          const offersResponse = await fetch(getApiUrl(`/listings/${listingId}/offers`))
          if (offersResponse.ok) {
            let offersData = await offersResponse.json()
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

  // Helper function to calculate ETH amount with retry logic
  // Cache for ETH amounts to reduce RPC calls
  const ethAmountCache = useRef(new Map())
  
  // Rate limiting for RPC calls
  const lastRpcCall = useRef(0)
  const RPC_COOLDOWN = 2000 // 2 seconds between RPC calls
  
  const calculateAndSetEthAmount = async (finalPrice, retryCount = 0) => {
    try {
      console.log('🔍 Starting ETH amount calculation:', {
        finalPrice,
        retryCount
      })
      
      // Use let instead of const for cacheKey to avoid assignment issues
      let cacheKey = Math.round(finalPrice * 100)
      
      // Check cache first
      if (ethAmountCache.current && ethAmountCache.current.has(cacheKey) && retryCount === 0) {
        const cachedAmount = ethAmountCache.current.get(cacheKey)
        console.log('💰 Using cached ETH amount for price:', finalPrice, 'USD')
        setEthAmount(cachedAmount)
        return
      }
      
      // If we already have an ETH amount, don't recalculate
      if (ethAmount && retryCount === 0) {
        console.log('💰 ETH amount already calculated, skipping')
        return
      }
      
      // Use contract's getETHAmount function (same as create page)
      try {
        if (!contractService.isReady()) {
          console.log('⏳ Contract service not ready, waiting...')
          if (retryCount < 3) {
            setTimeout(() => calculateAndSetEthAmount(finalPrice, retryCount + 1), 1000)
          }
          return
        }
        
        // Convert finalPrice to microdollars (same as create page)
        const priceInMicrodollars = Math.round(finalPrice * 1000000)
        
        console.log(`💰 Game price: $${finalPrice} (${priceInMicrodollars} microdollars)`)
        
        // Use contract's getETHAmount function
        const calculatedEthAmount = await contractService.contract.getETHAmount(priceInMicrodollars)
        
        setEthAmount(calculatedEthAmount)
        
        // Make sure ethAmountCache.current exists before setting
        if (!ethAmountCache.current) {
          ethAmountCache.current = new Map()
        }
        ethAmountCache.current.set(cacheKey, calculatedEthAmount)
        
        console.log('💰 Calculated ETH amount using contract:', ethers.formatEther(calculatedEthAmount), 'ETH for price:', finalPrice, 'USD')
      } catch (contractError) {
        console.error('❌ Contract getETHAmount call failed:', contractError)
        
        if (retryCount < 2) {
          console.log('🔄 Retrying ETH calculation...')
          setTimeout(() => calculateAndSetEthAmount(finalPrice, retryCount + 1), 1000)
        } else {
          // Final fallback - use same method as create page
          const priceInMicrodollars = Math.round(finalPrice * 1000000)
          console.log('💰 Using fallback calculation with microdollars:', priceInMicrodollars)
          
          // This should match what the contract expects
          setEthAmount(BigInt(priceInMicrodollars))
          
          // Make sure ethAmountCache.current exists before setting
          if (!ethAmountCache.current) {
            ethAmountCache.current = new Map()
          }
          ethAmountCache.current.set(cacheKey, BigInt(priceInMicrodollars))
          
          console.log('💰 Using fallback ETH amount for microdollars:', priceInMicrodollars)
        }
      }
    } catch (error) {
      console.error('❌ Error calculating ETH amount:', error)
      setEthAmount(null)
    }
  }
  
  // Load offers for listings
  const loadOffers = async () => {
    if (!gameData?.listing_id && !gameData?.id) return
    
    try {
      const listingId = gameData.listing_id || gameData.id
      const response = await fetch(getApiUrl(`/listings/${listingId}/offers`))
      if (response.ok) {
        let offersData = await response.json()
        console.log('✅ Loaded offers:', offersData)
        setOffers(offersData)
      }
    } catch (error) {
      console.error('Error loading offers:', error)
    }
  }

  // Initialize WebSocket connection
  const initializeWebSocket = () => {
    if (wsRef) {
      console.log('🔌 Closing existing WebSocket connection')
      wsRef.close()
    }
    
    const wsUrl = getWsUrl()
    console.log('🔌 Initializing WebSocket connection to:', wsUrl)
    
    const ws = new WebSocket(wsUrl)
    setWsRef(ws)
    
    // Add connection timeout
    const connectionTimeout = setTimeout(() => {
      if (ws.readyState === WebSocket.CONNECTING) {
        console.log('⏰ WebSocket connection timeout, closing...')
        ws.close()
      }
    }, 10000) // 10 second timeout
    
    ws.onopen = () => {
      console.log('🔌 WebSocket connected successfully')
      clearTimeout(connectionTimeout)
      setWsConnected(true)
      
      // Join game room immediately
      try {
        ws.send(JSON.stringify({
          type: 'join_room',
          roomId: gameId
        }))
        console.log('🏠 Joined game room:', gameId)
      } catch (error) {
        console.error('❌ Failed to join room:', error)
      }
      
      // Register user if we have an address
      if (address) {
        try {
          ws.send(JSON.stringify({
            type: 'register_user',
            address: address
          }))
          console.log('👤 Registered user:', address)
        } catch (error) {
          console.error('❌ Failed to register user:', error)
        }
      }
    }
    
    ws.onmessage = (event) => {
      try {
        let data = JSON.parse(event.data)
        console.log('📨 Raw WebSocket message:', data)
        
        // Handle 'message' wrapper from Socket.IO if present
        if (data.type === 'message' && data.data) {
          handleWebSocketMessage(data.data)
        } else {
          handleWebSocketMessage(data)
        }
      } catch (err) {
        console.error('❌ Error parsing WebSocket message:', err, 'Raw data:', event.data)
      }
    }
    
    ws.onerror = (error) => {
      console.error('🔌 WebSocket error:', error)
      clearTimeout(connectionTimeout)
      setWsConnected(false)
    }
    
    ws.onclose = (event) => {
      console.log('🔌 WebSocket disconnected:', {
        code: event.code,
        reason: event.reason,
        wasClean: event.wasClean
      })
      clearTimeout(connectionTimeout)
      setWsConnected(false)
      
      // Reconnect if game is still active
      if (gameData && !gameData.completed && gameData.status !== 'cancelled') {
        setTimeout(() => {
          console.log('🔄 Reconnecting WebSocket...')
          initializeWebSocket()
        }, 3000)
      }
    }
  }
  
  // Create mock WebSocket for testing
  const createMockWebSocket = () => {
    return {
      send: (data) => {
        console.log('📤 Mock WebSocket send:', data)
        // Simulate receiving a response
        setTimeout(() => {
          let parsedData = JSON.parse(data)
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
  
  // Safe serialization function to avoid circular references
  const safeSerialize = (obj) => {
    if (obj === null || obj === undefined) return obj
    if (typeof obj === 'string' || typeof obj === 'number' || typeof obj === 'boolean') return obj
    if (Array.isArray(obj)) return obj.map(safeSerialize)
    if (typeof obj === 'object') {
      // Check for event objects and React components/internal objects at the top level
      if (obj.nativeEvent || obj._reactName || (obj.target && obj.currentTarget) || obj.$$typeof || obj.nodeType || obj.tagName || obj.stateNode || obj._reactInternalInstance || obj.__reactFiber || obj._reactName || obj.type === 'click' || obj.type === 'mousedown' || obj.type === 'mouseup' || obj.type === 'touchstart' || obj.type === 'touchend') {
        console.warn('⚠️ Detected event object or React component/internal object, skipping serialization')
        return null
      }
      
      // Debug: Log when we're processing WebSocket messages
      if (obj.type && (obj.type === 'your_offer_accepted' || obj.type === 'game_awaiting_challenger_deposit' || obj.type === 'deposit_received')) {
        console.log('✅ Processing WebSocket message:', obj.type, 'safely')
      }
      
      const safeObj = {}
      for (const [key, value] of Object.entries(obj)) {
        // Skip React internal properties and functions
        if (key.startsWith('_') || key.startsWith('__') || typeof value === 'function' || key === 'stateNode' || key === '_reactInternalInstance' || key === '__reactFiber' || key === '_reactName') {
          continue
        }
        // Skip DOM elements and React components/internal objects
        if (value && typeof value === 'object' && (value.nodeType || value.$$typeof || value.stateNode || value._reactInternalInstance || value.__reactFiber || value._reactName)) {
          continue
        }
        try {
          safeObj[key] = safeSerialize(value)
        } catch (error) {
          console.warn(`⚠️ Could not serialize property ${key}:`, error)
        }
      }
      return safeObj
    }
    return obj
  }

  // Handle WebSocket messages
  const handleWebSocketMessage = (data) => {
    console.log('📨 WebSocket message received:', data)
    
    // Ensure data is valid
    if (!data || typeof data !== 'object') {
      console.warn('⚠️ Invalid WebSocket message format:', data)
      return
    }
    
    // Handle different message types
    switch (data.type) {
      case 'player_choice_made':
        console.log('🎯 Player choice received:', data)
        const { player, choice } = data
        
        // Update game state immediately
        setGameState(prev => ({
          ...prev,
          creatorChoice: player === getGameCreator() ? choice : prev.creatorChoice,
          joinerChoice: player === getGameJoiner() ? choice : prev.joinerChoice
        }))
        
        // Update player choices display
        setPlayerChoices(prev => ({
          ...prev,
          creator: player === getGameCreator() ? choice : prev.creator,
          joiner: player === getGameJoiner() ? choice : prev.joiner
        }))
        
        // Show notification only if it's from the other player
        if (player !== address) {
          const playerName = player === getGameCreator() ? 'Player 1' : 'Player 2'
          showInfo(`🎯 ${playerName} chose ${choice.toUpperCase()}!`)
        }
        break
        
      case 'choice_made_ready_to_flip':
        console.log('🎯 Choice made, ready to flip:', data)
        const { creatorChoice, challengerChoice, roundNumber, currentTurn, waitingFor } = data
        
        // Update game state to charging phase
        setGameState(prev => ({
          ...prev,
          phase: 'charging',
          creatorChoice,
          joinerChoice: challengerChoice,
          currentRound: roundNumber,
          currentTurn: currentTurn || null
        }))
        
        // Update player choices
        setPlayerChoices({
          creator: creatorChoice,
          joiner: challengerChoice
        })
        
        // Show appropriate message
        if (waitingFor) {
          showInfo(`Waiting for ${waitingFor.slice(0, 6)}... to choose...`)
        } else if (currentTurn) {
          const isMyTurn = currentTurn === address
          if (isMyTurn) {
            showSuccess('🎯 Your turn! Hold the coin to charge power!')
          } else {
            showInfo(`⚡ ${currentTurn.slice(0, 6)}...'s turn to charge power!`)
          }
        }
        break
        
      case 'turn_changed':
        console.log('🔄 Turn changed:', data)
        const { currentTurn: newTurn } = data
        
        setGameState(prev => ({
          ...prev,
          currentTurn: newTurn
        }))
        
        const isMyTurn = newTurn === address
        if (isMyTurn) {
          showSuccess('🎯 Your turn! Hold the coin to charge power!')
        } else {
          showInfo(`⚡ ${newTurn.slice(0, 6)}...'s turn to charge power!`)
        }
        break
        
      case 'both_choices_made':
        console.log('🎯 Both choices received:', data)
        const { creatorChoice: cChoice2, challengerChoice: jChoice2 } = data
        
        // Update state to charging phase
        setGameState(prev => ({
          ...prev,
          creatorChoice: cChoice2,
          joinerChoice: jChoice2,
          phase: 'charging'
        }))
        
        setPlayerChoices({
          creator: cChoice2,
          joiner: jChoice2
        })
        
        showSuccess('🎯 Both players have chosen! Hold the coin to charge power!')
        break
        
      case 'power_charge_started':
        console.log('⚡ Power charge started by:', data.player)
        const { player: chargingPlayer } = data
        
        // Update charging state
        setGameState(prev => ({
          ...prev,
          chargingPlayer: chargingPlayer
        }))
        
        // Show notification if it's the other player
        if (chargingPlayer !== address) {
          const playerName = chargingPlayer === getGameCreator() ? 'Player 1' : 'Player 2'
          showInfo(`⚡ ${playerName} is charging power!`)
        }
        break
        
      case 'power_charged':
        console.log('⚡ Power update received:', data)
        const { player: powerPlayer, powerLevel } = data
        
        // Update power levels
        setGameState(prev => ({
          ...prev,
          creatorPower: powerPlayer === getGameCreator() ? powerLevel : prev.creatorPower,
          joinerPower: powerPlayer === getGameJoiner() ? powerLevel : prev.joinerPower,
          chargingPlayer: null // Clear charging state when power is set
        }))
        
        // Show notification if it's the other player
        if (powerPlayer !== address) {
          const playerName = powerPlayer === getGameCreator() ? 'Player 1' : 'Player 2'
          showInfo(`⚡ ${playerName} charged power: ${powerLevel.toFixed(1)}/10`)
        }
        break
        

        
      case 'choice_update':
        console.log('🔄 Choice update:', data)
        // Just for logging, main choice handling is in player_choice_made
        break
        
      case 'auto_flip_triggered':
        console.log('🎲 Auto-flip triggered:', data)
        const { autoChoice } = data
        setGameState(prev => ({
          ...prev,
          creatorChoice: autoChoice,
          joinerChoice: autoChoice,
          phase: 'charging'
        }))
        
        setPlayerChoices({
          creator: autoChoice,
          joiner: autoChoice
        })
        
        showInfo('🎲 Auto-flip triggered due to time limit!')
        break
        
      case 'PLAYER_CHOICE':
        console.log('👤 Player made choice:', data)
        // Update UI to show player has made their choice
        if (data.player === getGameCreator()) {
          setPlayerChoices(prev => ({ ...prev, creator: data.choice }))
          setGameState(prev => ({ ...prev, creatorChoice: data.choice }))
        } else if (data.player === getGameJoiner()) {
          setPlayerChoices(prev => ({ ...prev, joiner: data.choice }))
          setGameState(prev => ({ ...prev, joinerChoice: data.choice }))
        }
        break
        
      case 'FLIP_RESULT':
        console.log('🎲 Flip result received:', data)
        handleFlipResult(data)
        break
        
      case 'GAME_COMPLETED':
        console.log('🏁 Game completed:', data)
        handleGameCompleted(data)
        break
        
      case 'your_offer_accepted':
        console.log('🎉 Your offer was accepted!')
        showSuccess('Your offer has been accepted! Waiting for deposit...')
        setTimeout(() => {
          window.location.href = `/game/${data.gameId}`
        }, 2000)
        break
        
      case 'game_awaiting_challenger_deposit':
        console.log('💰 Game awaiting your deposit')
        showInfo('Game is waiting for your ETH deposit')
        loadGameData()
        break
        
      case 'deposit_received':
        console.log('✅ Deposit received:', data)
        if (data.bothDeposited) {
          showSuccess('🎮 Game is now active! Both players can start playing.')
          // Force reload game data to get updated status
          loadGameData()
          // Set game state to choosing phase immediately
          setGameState(prev => ({
            ...prev,
            phase: 'choosing',
            creatorChoice: null,
            joinerChoice: null
          }))
        } else {
          // Even if only one deposit, reload to update UI
          loadGameData()
        }
        break
        
      case 'game_started':
        console.log('🎮 Game started notification:', data)
        showSuccess('🎮 Game is now active! Choose heads or tails to begin!')
        loadGameData()
        setGameState(prev => ({
          ...prev,
          phase: 'choosing',
          creatorChoice: null,
          joinerChoice: null
        }))
        break
        
      case 'offer_accepted':
        console.log('🎉 Offer accepted notification:', data)
        showSuccess('🎉 Your offer was accepted! Redirecting to game...')
        setTimeout(() => {
          window.location.href = `/game/${data.gameId}`
        }, 2000)
        break
        
      case 'PLAYER_CHOICE_BROADCAST':
        console.log('🎯 Player choice broadcast received:', data)
        const { player: broadcastPlayer, choice: broadcastChoice } = data
        
        // Only process if it's from the other player
        if (broadcastPlayer !== address) {
          setGameState(prev => ({
            ...prev,
            creatorChoice: broadcastPlayer === getGameCreator() ? broadcastChoice : prev.creatorChoice,
            joinerChoice: broadcastPlayer === getGameJoiner() ? broadcastChoice : prev.joinerChoice
          }))
          
          setPlayerChoices(prev => ({
            ...prev,
            creator: broadcastPlayer === getGameCreator() ? broadcastChoice : prev.creator,
            joiner: broadcastPlayer === getGameJoiner() ? broadcastChoice : prev.joiner
          }))
          
          const otherPlayerName = broadcastPlayer === getGameCreator() ? 'Player 1' : 'Player 2'
          showInfo(`🎯 ${otherPlayerName} chose ${broadcastChoice.toUpperCase()}!`)
          
          // Check if both players have chosen
          const currentChoices = {
            creator: broadcastPlayer === getGameCreator() ? broadcastChoice : (gameState.creatorChoice || playerChoices.creator),
            joiner: broadcastPlayer === getGameJoiner() ? broadcastChoice : (gameState.joinerChoice || playerChoices.joiner)
          }
          
          if (currentChoices.creator && currentChoices.joiner) {
            console.log('🎯 Both players have chosen, transitioning to charging phase')
            setGameState(prev => ({
              ...prev,
              phase: 'charging'
            }))
            showSuccess('🎯 Both players have chosen! Hold the coin to charge power!')
          }
        }
        break
        
      case 'room_joined':
        console.log('🏠 Room joined successfully:', data)
        showInfo(`Connected to game room (${data.members} players)`)
        break
        
      case 'game_status_changed':
        console.log('🔄 Game status changed:', data)
        if (data.newStatus === 'active') {
          showSuccess('🎮 Game is now active! Choose heads or tails to begin!')
          loadGameData()
          setGameState(prev => ({
            ...prev,
            phase: 'choosing',
            creatorChoice: null,
            joinerChoice: null
          }))
        }
        break
        
      default:
        console.log('📨 Unhandled WebSocket message type:', data.type)
    }
  }
  
  // Handle game actions
  const handleGameAction = (data) => {
    // Use safe serialization to avoid circular references
    let safeData
    try {
      safeData = safeSerialize(data)
    } catch (error) {
      console.error('❌ Error serializing game action data:', error)
      safeData = {
        action: data?.action,
        player: data?.player,
        choice: data?.choice,
        gameId: data?.gameId,
        powerLevel: data?.powerLevel
      }
    }
    
    switch (safeData.action) {
      case 'CHOICE_MADE':
        setGameState(prev => ({
          ...prev,
          phase: 'charging',
          chargingPlayer: safeData.player
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
        console.log('Unknown game action:', safeData.action)
    }
  }
  
  // Handle flip result
  const handleFlipResult = (result) => {
    // Use safe serialization to avoid circular references
    let safeResult
    try {
      safeResult = safeSerialize(result)
    } catch (error) {
      console.error('❌ Error serializing flip result:', error)
      safeResult = {
        roundWinner: result?.roundWinner,
        result: result?.result,
        creatorChoice: result?.creatorChoice,
        challengerChoice: result?.challengerChoice,
        creatorPower: result?.creatorPower,
        joinerPower: result?.joinerPower
      }
    }
    
    console.log('🎲 Processing flip result:', safeResult)
    
    // Update game state with flip result
    setGameState(prev => ({
      ...prev,
      phase: 'flipping',
      flipResult: safeResult.result,
      roundWinner: safeResult.roundWinner,
      creatorPower: safeResult.creatorPower || 0,
      joinerPower: safeResult.joinerPower || 0
    }))
    
    // Set flip animation data
    setFlipAnimation({
      result: safeResult.result,
      roundWinner: safeResult.roundWinner,
      creatorChoice: safeResult.creatorChoice,
      challengerChoice: safeResult.challengerChoice,
      creatorPower: safeResult.creatorPower,
      joinerPower: safeResult.joinerPower
    })
    
    // Show result after animation
    setTimeout(() => {
      setFlipAnimation(null)
      
      // Determine if current player won this round
      const isRoundWinner = safeResult.roundWinner === address
      const myChoice = isCreator() ? safeResult.creatorChoice : safeResult.challengerChoice
      
      setResultData({
        isWinner: isRoundWinner,
        flipResult: safeResult.result,
        playerChoice: myChoice,
        roundWinner: safeResult.roundWinner,
        creatorPower: safeResult.creatorPower,
        joinerPower: safeResult.joinerPower
      })
      setShowResultPopup(true)
      
      // Show appropriate message
      if (isRoundWinner) {
        showSuccess(`🎉 You won this round! The coin landed on ${safeResult.result.toUpperCase()}!`)
      } else {
        showInfo(`😔 You lost this round. The coin landed on ${safeResult.result.toUpperCase()}.`)
      }
    }, 3000)
  }
  
  // Reset game state for next round
  const resetForNextRound = () => {
    console.log('🔄 Resetting game state for next round')
    
    setGameState(prev => ({
      ...prev,
      phase: 'choosing',
      creatorChoice: null,
      joinerChoice: null,
      currentTurn: null,
      creatorPower: 0,
      joinerPower: 0,
      chargingPlayer: null
    }))
    
    setPlayerChoices({
      creator: null,
      joiner: null
    })
    
    setFlipAnimation(null)
    setShowResultPopup(false)
    setResultData(null)
  }
  
  // Handle game completed
  const handleGameCompleted = (data) => {
    // Use safe serialization to avoid circular references
    let safeData
    try {
      safeData = safeSerialize(data)
    } catch (error) {
      console.error('❌ Error serializing game completed data:', error)
      safeData = {
        winner: data?.winner,
        finalResult: data?.finalResult,
        playerChoice: data?.playerChoice
      }
    }
    
    setGameState(prev => ({
      ...prev,
      phase: 'completed'
    }))
    
    setResultData({
      isWinner: safeData.winner === address,
      flipResult: safeData.finalResult,
      playerChoice: safeData.playerChoice,
      isGameComplete: true
    })
    setShowResultPopup(true)
  }
  
  // Game actions
  const handlePlayerChoice = (choice) => {
    if (!wsRef || wsRef.readyState !== WebSocket.OPEN) {
      showError('Not connected to game server')
      return
    }
    
    console.log('🎯 Player choice:', choice)
    
    // Stop any existing countdown
    stopRoundCountdown()
    
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
    
    // Show immediate feedback
    showSuccess(`🎯 You chose ${choice.toUpperCase()}!`)
    
    // Send choice to server with proper error handling
    const choiceMessage = {
      type: 'GAME_ACTION',
      gameId: gameId,
      action: 'MAKE_CHOICE',
      choice: choice,
      player: address,
      timestamp: Date.now()
    }
    
    console.log('📤 Sending choice to server:', choiceMessage)
    
    try {
      wsRef.send(JSON.stringify(choiceMessage))
      console.log('✅ Choice sent successfully')
      
      // Also send a broadcast message to ensure other player gets notified
      const broadcastMessage = {
        type: 'PLAYER_CHOICE_BROADCAST',
        gameId: gameId,
        player: address,
        choice: choice,
        timestamp: Date.now()
      }
      
      // Send broadcast after a small delay
      setTimeout(() => {
        if (wsRef && wsRef.readyState === WebSocket.OPEN) {
          wsRef.send(JSON.stringify(broadcastMessage))
          console.log('📡 Broadcast message sent')
        }
      }, 100)
      
    } catch (error) {
      console.error('❌ Failed to send choice:', error)
      showError('Failed to send choice. Please try again.')
      
      // Revert local state on error
      if (address === getGameCreator()) {
        setPlayerChoices(prev => ({ ...prev, creator: null }))
        setGameState(prev => ({ ...prev, creatorChoice: null }))
      } else if (address === getGameJoiner()) {
        setPlayerChoices(prev => ({ ...prev, joiner: null }))
        setGameState(prev => ({ ...prev, joinerChoice: null }))
      }
    }
    
    // Check if this is Round 5 - if so, auto-flip after choice
    if (gameState.currentRound === 5) {
      console.log('🎯 Round 5 detected - auto-flipping after choice')
      setTimeout(() => {
        handleAutoFlip()
      }, 1000)
    }
  }
  
  const handleAutoFlip = () => {
    console.log('🎲 Auto-flipping for Round 5')
    showInfo('Round 5 - Auto-flipping for fairness!')
    
    // Generate a random choice for fairness
    const autoChoice = Math.random() < 0.5 ? 'heads' : 'tails'
    
    // Update state to show auto-choice
    setGameState(prev => ({
      ...prev,
      creatorChoice: autoChoice,
      joinerChoice: autoChoice
    }))
    
    // Send auto-flip action
    if (wsRef && wsConnected) {
      const autoFlipMessage = {
        type: 'GAME_ACTION',
        gameId: gameId,
        action: 'AUTO_FLIP',
        choice: autoChoice,
        player: 'system'
      }
      
      // Ensure the message is serializable
      wsRef.send(JSON.stringify(autoFlipMessage))
    }
  }
  
  const handlePowerChargeStart = () => {
    setGameState(prev => ({
      ...prev,
      chargingPlayer: address
    }))
  }
  
  const handlePowerChargeStop = async (powerLevel) => {
    if (!wsRef || wsRef.readyState !== WebSocket.OPEN) {
      showError('Not connected to game server')
      return
    }
    
    // Ensure powerLevel is a valid number
    const validPowerLevel = typeof powerLevel === 'number' && !isNaN(powerLevel) ? powerLevel : 5
    
    console.log('⚡ Power charge stopped:', { 
      powerLevel: validPowerLevel, 
      originalType: typeof powerLevel,
      isCreator: isCreator(),
      address 
    })
    
    // Update local state
    setGameState(prev => ({
      ...prev,
      chargingPlayer: null,
      creatorPower: address === getGameCreator() ? validPowerLevel : prev.creatorPower,
      joinerPower: address === getGameJoiner() ? validPowerLevel : prev.joinerPower
    }))
    
    // Send power data to server
    const powerMessage = {
      type: 'GAME_ACTION',
      gameId: gameId,
      action: 'POWER_CHARGED',
      powerLevel: validPowerLevel,
      player: address,
      timestamp: Date.now()
    }
    
    try {
      wsRef.send(JSON.stringify(powerMessage))
      console.log('✅ Power level sent to server:', validPowerLevel)
      
      // Show success message
      showSuccess(`⚡ Power charged: ${validPowerLevel.toFixed(1)}/10`)
      
    } catch (error) {
      console.error('❌ Failed to send power message:', error)
      showError('Failed to send power data. Please try again.')
    }
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
        let result = await response.json()
        console.log('✅ Offer created successfully:', result)
        showSuccess('Offer created successfully!')
        setNewOffer({ price: '', message: '' })
        // Refresh offers
        const offersResponse = await fetch(getApiUrl(`/listings/${listingId}/offers`))
        if (offersResponse.ok) {
          let offersData = await offersResponse.json()
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
      
              let result = await response.json()
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
            let offersData = await response.json()
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
  
  // Countdown functions
  const startDepositCountdown = (deadline) => {
    // Clear any existing interval
    if (countdownInterval) {
      clearInterval(countdownInterval)
    }
    
    const interval = setInterval(() => {
      const now = new Date().getTime()
      const deadlineTime = new Date(deadline).getTime()
      const timeLeft = Math.max(0, deadlineTime - now)
      
      if (timeLeft === 0) {
        clearInterval(interval)
        setDepositTimeLeft(0)
        // Reload game data to check timeout status
        loadGameData()
      } else {
        setDepositTimeLeft(Math.floor(timeLeft / 1000))
      }
    }, 1000)
    
    setCountdownInterval(interval)
  }
  
  // Format time for display
  const formatTimeLeft = (seconds) => {
    if (!seconds && seconds !== 0) return ''
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }
  
  // Start round countdown timer
  const startRoundCountdown = () => {
    console.log('⏰ Starting 20-second round countdown')
    setRoundCountdown(20)
    
    const interval = setInterval(() => {
      setRoundCountdown(prev => {
        if (prev <= 1) {
          // Time's up - auto-flip at max power
          console.log('⏰ Round countdown expired - auto-flipping at max power')
          clearInterval(interval)
          setRoundCountdownInterval(null)
          
          // Auto-flip at max power
          if (isMyTurn()) {
            const autoChoice = Math.random() < 0.5 ? 'heads' : 'tails'
            console.log('🎲 Auto-flipping with choice:', autoChoice)
            
            // Update state immediately
            if (address === getGameCreator()) {
              setPlayerChoices(prev => ({ ...prev, creator: autoChoice }))
              setGameState(prev => ({
                ...prev,
                creatorChoice: autoChoice
              }))
            } else if (address === getGameJoiner()) {
              setPlayerChoices(prev => ({ ...prev, joiner: autoChoice }))
              setGameState(prev => ({
                ...prev,
                joinerChoice: autoChoice
              }))
            }
            
            // Send auto-flip message
            if (wsRef && wsConnected) {
              const autoFlipMessage = {
                type: 'GAME_ACTION',
                gameId: gameId,
                action: 'AUTO_FLIP_TIMEOUT',
                choice: autoChoice,
                player: address,
                powerLevel: 10, // Max power
                timestamp: Date.now()
              }
              
              try {
                wsRef.send(JSON.stringify(autoFlipMessage))
                showInfo('🎲 Auto-flip triggered due to time limit!')
              } catch (error) {
                console.error('❌ Failed to send auto-flip:', error)
              }
            }
          }
          
          return null
        }
        return prev - 1
      })
    }, 1000)
    
    setRoundCountdownInterval(interval)
  }
  
  // Stop round countdown timer
  const stopRoundCountdown = () => {
    if (roundCountdownInterval) {
      clearInterval(roundCountdownInterval)
      setRoundCountdownInterval(null)
    }
    setRoundCountdown(null)
  }
  
  // Helper functions to handle both game and listing data structures
  const getGameCreator = () => gameData?.creator || gameData?.creator_address
  const getGameJoiner = () => gameData?.challenger || gameData?.joiner || gameData?.joiner_address || gameData?.challenger_address
  const getGamePrice = () => {
    // Only log price debug info once per game load
    if (!gameData?.price_debug_logged) {
      console.log('🔍 Game Price Debug:', {
        price: gameData?.price,
        final_price: gameData?.final_price,
        asking_price: gameData?.asking_price,
        priceUSD: gameData?.priceUSD,
        gameData: gameData?.game_data,
        gameDataKeys: gameData ? Object.keys(gameData) : []
      })
      // Mark as logged to prevent repeated logging
      if (gameData) {
        gameData.price_debug_logged = true
      }
    }
    
    return gameData?.final_price || gameData?.price || gameData?.asking_price || gameData?.priceUSD || 0
  }
  const getGameNFTImage = () => gameData?.nft?.image || gameData?.nft_image || gameData?.nftImage || '/placeholder-nft.svg'
  const getGameNFTName = () => gameData?.nft?.name || gameData?.nft_name || gameData?.nftName || 'Unknown NFT'
  const getGameNFTCollection = () => gameData?.nft?.collection || gameData?.nft_collection || gameData?.nftCollection || 'Unknown Collection'
  const getGameNFTContract = () => {
    // Only log once per game load
    if (!gameData?.nft_contract_logged) {
      console.log('🔍 NFT Contract:', { contract: gameData?.nft_contract })
      if (gameData) {
        gameData.nft_contract_logged = true
      }
    }
    return gameData?.nft_contract || gameData?.nft?.contract || gameData?.nftContract
  }
  
  const getGameNFTTokenId = () => {
    // Only log once per game load
    if (!gameData?.nft_token_logged) {
      console.log('🔍 NFT Token ID:', { tokenId: gameData?.nft_token_id })
      if (gameData) {
        gameData.nft_token_logged = true
      }
    }
    return gameData?.nft_token_id || gameData?.nft?.tokenId || gameData?.nftTokenId
  }
  
  // Check if user is the creator
  const isCreator = () => address === getGameCreator()
  
  // Check if user is the joiner
  const isJoiner = () => address === getGameJoiner()
  
  // Check if it's user's turn
  const isMyTurn = () => {
    // Don't allow turns if game hasn't started yet
    if (!gameData?.creator_deposited || !gameData?.challenger_deposited || gameData?.status !== 'active') {
      console.log('❌ Game not ready for turns:', {
        creatorDeposited: gameData?.creator_deposited,
        challengerDeposited: gameData?.challenger_deposited,
        status: gameData?.status
      })
      return false
    }
    
    console.log('🔍 Checking if it\'s my turn:', {
      gamePhase: gameState.phase,
      currentRound: gameState.currentRound,
      currentTurn: gameState.currentTurn,
      isCreator: isCreator(),
      isJoiner: isJoiner(),
      creatorChoice: gameState.creatorChoice,
      joinerChoice: gameState.joinerChoice,
      address,
      gameCreator: getGameCreator(),
      gameJoiner: getGameJoiner(),
      hasGameData: !!gameData
    })
    
    if (gameState.phase === 'choosing') {
      // Round 1: Player 1 (creator) goes first
      if (gameState.currentRound === 1) {
        const myTurn = isCreator() && !gameState.creatorChoice
        console.log('Round 1 - Creator turn:', myTurn)
        return myTurn
      }
      // Round 2: Player 2 (joiner) goes
      else if (gameState.currentRound === 2) {
        const myTurn = isJoiner() && !gameState.joinerChoice
        console.log('Round 2 - Joiner turn:', myTurn)
        return myTurn
      }
      // Round 3: Player 1 goes again
      else if (gameState.currentRound === 3) {
        const myTurn = isCreator() && !gameState.creatorChoice
        console.log('Round 3 - Creator turn:', myTurn)
        return myTurn
      }
      // Round 4: Player 2 goes again
      else if (gameState.currentRound === 4) {
        const myTurn = isJoiner() && !gameState.joinerChoice
        console.log('Round 4 - Joiner turn:', myTurn)
        return myTurn
      }
      // Round 5: Auto-flip (no player choice needed)
      else if (gameState.currentRound === 5) {
        console.log('Round 5 - Auto flip')
        return false
      }
      // Default fallback - allow anyone who hasn't chosen yet
      const myTurn = (isCreator() && !gameState.creatorChoice) || (isJoiner() && !gameState.joinerChoice)
      console.log('Default fallback turn:', myTurn)
      return myTurn
    }
    
    // Charging phase - check if it's this player's turn to charge
    if (gameState.phase === 'charging') {
      if (gameState.currentTurn) {
        const myTurn = gameState.currentTurn === address
        console.log('Charging phase - my turn:', myTurn)
        return myTurn
      } else {
        // Fallback: allow the player who made their choice to charge
        const hasMadeChoice = (isCreator() && gameState.creatorChoice) || (isJoiner() && gameState.joinerChoice)
        console.log('🎯 Player has made choice, allowing flip/power charging')
        return hasMadeChoice
      }
    }
    
    // Other phases - no turn restrictions
    return true
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
    
    // Try to get coin data from normalized structure first (parsed by server)
    if (gameData?.coinData && typeof gameData.coinData === 'object') {
      coinData = gameData.coinData
      console.log('✅ Using parsed coinData field:', coinData)
    } else if (gameData?.coin_data) {
      try {
        // Parse coin_data if it's a string
        coinData = typeof gameData.coin_data === 'string' ? 
          JSON.parse(gameData.coin_data) : gameData.coin_data
        console.log('✅ Parsed coin_data field:', coinData)
      } catch (error) {
        console.error('❌ Error parsing coin data:', error)
        // Try to extract basic coin info even if parsing fails
        if (gameData.coin_data && typeof gameData.coin_data === 'string') {
          try {
            // Look for coin ID in the string
            const coinMatch = gameData.coin_data.match(/"id"\s*:\s*"([^"]+)"/)
            if (coinMatch) {
              const coinId = coinMatch[1]
              console.log('🔍 Found coin ID in string:', coinId)
              
              // Create basic coin data structure - use let instead of const
              let fallbackCoinData = {
                id: coinId,
                type: 'default',
                name: coinId.charAt(0).toUpperCase() + coinId.slice(1),
                headsImage: `/coins/${coinId}h.png`,
                tailsImage: `/coins/${coinId}t.png`
              }
              
              // Handle special cases
              if (coinId === 'trump') {
                fallbackCoinData = {
                  ...fallbackCoinData,
                  headsImage: '/coins/trumpheads.webp',
                  tailsImage: '/coins/trumptails.webp'
                }
              } else if (coinId === 'mario') {
                fallbackCoinData = {
                  ...fallbackCoinData,
                  headsImage: '/coins/mario.png',
                  tailsImage: '/coins/luigi.png'
                }
              } else if (coinId === 'skull') {
                fallbackCoinData = {
                  ...fallbackCoinData,
                  headsImage: '/coins/skullh.png',
                  tailsImage: '/coins/skullt.png'
                }
              } else if (coinId === 'plain') {
                fallbackCoinData = {
                  ...fallbackCoinData,
                  headsImage: '/coins/plainh.png',
                  tailsImage: '/coins/plaint.png'
                }
              }
              
              coinData = fallbackCoinData
              console.log('✅ Created fallback coin data:', coinData)
            }
          } catch (fallbackError) {
            console.error('❌ Error in fallback coin parsing:', fallbackError)
          }
        }
      }
    } else if (gameData?.coin && typeof gameData.coin === 'object') {
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
      setGameCoin(coinData)
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
      setGameCoin({
        id: 'plain',
        type: 'default',
        name: 'Classic',
        headsImage: '/coins/plainh.png',
        tailsImage: '/coins/plaint.png'
      })
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
  
  // Cleanup countdown interval on unmount
  useEffect(() => {
    return () => {
      if (countdownInterval) {
        clearInterval(countdownInterval)
      }
    }
  }, [countdownInterval])
  
  // Auto-refresh offers every 5 seconds
  useEffect(() => {
    if (gameData && (gameData.listing_id || gameData.id)) {
      const interval = setInterval(() => {
        loadOffers()
      }, 5000)
      
      setOffersRefreshInterval(interval)
      
      return () => {
        clearInterval(interval)
      }
    }
  }, [gameData])
  
  // Recalculate ETH amount when contract becomes initialized
  useEffect(() => {
    if (gameData?.final_price && contractInitialized) {
      // First check if eth_amount is already available from database
      if (gameData.eth_amount) {
        console.log('💰 Using ETH amount from database:', gameData.eth_amount)
        setEthAmount(BigInt(gameData.eth_amount))
      } else if (!ethAmount) {
        // Only calculate if we don't already have an ETH amount
        console.log('💰 Calculating ETH amount for price:', gameData.final_price)
        calculateAndSetEthAmount(gameData.final_price)
      }
    }
  }, [contractInitialized, gameData?.final_price, gameData?.eth_amount, ethAmount])
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (countdownInterval) {
        clearInterval(countdownInterval)
      }
      if (roundCountdownInterval) {
        clearInterval(roundCountdownInterval)
      }
      if (offersRefreshInterval) {
        clearInterval(offersRefreshInterval)
      }
    }
  }, [countdownInterval, roundCountdownInterval, offersRefreshInterval])
  
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
            {/* Combined Player Section */}
            <PlayerSection style={{ display: 'flex', gap: '1rem', justifyContent: 'space-between' }}>
              {/* Combined Player Box - Left Side */}
              <div style={{
                flex: '1',
                background: 'linear-gradient(135deg, rgba(0, 255, 65, 0.1) 0%, rgba(0, 255, 65, 0.05) 100%)',
                padding: '1rem',
                borderRadius: '1rem',
                border: '2px solid #00FF41',
                backdropFilter: 'blur(10px)',
                boxShadow: '0 0 30px rgba(0, 255, 65, 0.3), inset 0 0 20px rgba(0, 255, 65, 0.1)'
              }}>
                
                {/* Creator */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  marginBottom: '1rem',
                  padding: '0.75rem',
                  background: isCreator() ? 'rgba(255, 215, 0, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '0.5rem',
                  border: isCreator() ? '1px solid rgba(255, 215, 0, 0.3)' : '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                  <div>
                    <ProfilePicture 
                      address={getGameCreator()}
                      size={50}
                      showAddress={true}
                    />
                  </div>
                  <div style={{ flex: '1' }}>
                    <h4 style={{ color: '#FFD700', margin: '0 0 0.25rem 0', fontSize: '1rem' }}>Creator</h4>
                                         <p style={{ margin: '0.25rem 0', fontSize: '0.9rem', color: 'white' }}>
                       Power: {Number(gameState.creatorPower) || 0}
                     </p>
                    <p style={{ margin: '0.25rem 0', fontSize: '0.8rem', color: '#ccc' }}>
                      Wins: {gameState.creatorWins}
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
                </div>
                
                {/* Joiner */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  padding: '0.75rem',
                  background: isJoiner() ? 'rgba(255, 215, 0, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '0.5rem',
                  border: isJoiner() ? '1px solid rgba(255, 215, 0, 0.3)' : '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                  <div>
                    <ProfilePicture 
                      address={getGameJoiner()}
                      size={50}
                      showAddress={true}
                    />
                  </div>
                  <div style={{ flex: '1' }}>
                    <h4 style={{ color: '#FFD700', margin: '0 0 0.25rem 0', fontSize: '1rem' }}>Joiner</h4>
                                         <p style={{ margin: '0.25rem 0', fontSize: '0.9rem', color: 'white' }}>
                       Power: {Number(gameState.joinerPower) || 0}
                     </p>
                    <p style={{ margin: '0.25rem 0', fontSize: '0.8rem', color: '#ccc' }}>
                      Wins: {gameState.joinerWins}
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
                </div>
              </div>
              
                             {/* Power Display - Right Side */}
               <div style={{
                 flex: '1',
                 background: 'linear-gradient(135deg, rgba(0, 20, 40, 0.95) 0%, rgba(0, 40, 80, 0.9) 100%)',
                 padding: '1.5rem',
                 borderRadius: '1rem',
                 border: '2px solid #FFD700',
                 backdropFilter: 'blur(10px)',
                 boxShadow: '0 0 30px rgba(0, 100, 120, 0.4), inset 0 0 20px rgba(255, 215, 0, 0.1)',
                 display: 'flex',
                 flexDirection: 'column',
                 justifyContent: 'space-between'
               }}>
                 <h3 style={{ 
                   color: '#FFD700', 
                   marginBottom: '1rem', 
                   textAlign: 'center', 
                   fontSize: '1.2rem',
                   animation: 'powerLevelFlash 2s ease-in-out infinite',
                   textShadow: '0 0 10px rgba(255, 215, 0, 0.8)'
                 }}>
                   ⚡ POWER LEVEL ⚡
                 </h3>
                
                {/* Power Bar */}
                <div style={{ flex: '1', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <div style={{ marginBottom: '1rem' }}>
                    <div style={{
                      color: '#FFD700',
                      fontSize: '1rem',
                      fontWeight: 'bold',
                      marginBottom: '0.5rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <span>Total Power</span>
                                             <span style={{ 
                         color: '#FFD700',
                         textShadow: '0 0 5px rgba(255, 215, 0, 0.8)' 
                       }}>
                         {((Number(gameState.creatorPower) || 0) + (Number(gameState.joinerPower) || 0)).toFixed(1)}/10
                       </span>
                    </div>
                    
                    <div style={{
                      height: '30px',
                      background: 'linear-gradient(90deg, rgba(0, 0, 0, 0.8) 0%, rgba(40, 30, 0, 0.6) 100%)',
                      borderRadius: '15px',
                      overflow: 'hidden',
                      border: '3px solid #FFD700',
                      position: 'relative',
                      boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.5)'
                    }}>
                                             <div style={{
                         height: '100%',
                         width: `${(((Number(gameState.creatorPower) || 0) + (Number(gameState.joinerPower) || 0)) / 10) * 100}%`,
                        background: gameState.chargingPlayer ? 
                          `linear-gradient(90deg, #FFD700 0%, #FFA500 30%, #FF6B00 60%, #FF1493 100%)` :
                          `linear-gradient(90deg, #FFD700 0%, #FFA500 50%, #FF6B00 100%)`,
                        borderRadius: '12px',
                        transition: 'width 0.15s ease-out',
                        backgroundSize: '200% 100%',
                        animation: gameState.chargingPlayer ? 'powerCharge 0.6s linear infinite' : 'none',
                        boxShadow: gameState.chargingPlayer ? 
                          '0 0 15px rgba(255, 215, 0, 0.8), inset 0 0 10px rgba(255, 255, 255, 0.3)' :
                          '0 0 8px rgba(255, 215, 0, 0.6)'
                      }} />
                      
                      {/* Power level markers */}
                      <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '0 0.5rem'
                      }}>
                        {[2, 4, 6, 8].map(level => (
                          <div key={level} style={{
                            width: '2px',
                            height: '70%',
                            background: 'rgba(255, 255, 255, 0.4)',
                            opacity: ((Number(gameState.creatorPower) || 0) + (Number(gameState.joinerPower) || 0)) >= level ? 1 : 0.3
                          }} />
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  {/* Charging Indicator */}
                  {gameState.chargingPlayer && (
                    <div style={{
                      padding: '0.75rem',
                      background: 'linear-gradient(90deg, rgba(255, 215, 0, 0.2) 0%, rgba(255, 165, 0, 0.1) 100%)',
                      border: '1px solid rgba(255, 215, 0, 0.5)',
                      borderRadius: '0.75rem',
                      textAlign: 'center',
                      marginBottom: '1rem'
                    }}>
                      <div style={{
                        color: '#FFD700',
                        fontSize: '0.9rem',
                        fontWeight: 'bold',
                        animation: 'powerPulse 0.4s ease-in-out infinite',
                        textShadow: '0 0 10px rgba(255, 215, 0, 0.8)'
                      }}>
                        ⚡ {gameState.chargingPlayer === getGameCreator() ? 'PLAYER 1' : 'PLAYER 2'} CHARGING ⚡
                      </div>
                    </div>
                  )}
                  
                  {/* Round Countdown */}
                  {roundCountdown !== null && (
                    <div style={{
                      padding: '0.75rem',
                      background: 'rgba(255, 215, 0, 0.1)',
                      border: '1px solid rgba(255, 215, 0, 0.3)',
                      borderRadius: '0.75rem',
                      textAlign: 'center'
                    }}>
                      <div style={{
                        fontSize: '1.2rem',
                        color: roundCountdown <= 5 ? '#FF4444' : '#00FF41',
                        fontWeight: 'bold',
                        textShadow: roundCountdown <= 5 ? '0 0 10px rgba(255, 68, 68, 0.8)' : '0 0 10px rgba(0, 255, 65, 0.5)',
                        animation: roundCountdown <= 5 ? 'pulse 1s ease-in-out infinite' : 'none'
                      }}>
                        ⏰ {roundCountdown}s
                      </div>
                    </div>
                  )}
                  
                  {/* Waiting for Opponent Message */}
                  {gameData?.status === 'active' && gameState.phase === 'choosing' && 
                   !isMyTurn() && !(isCreator() ? gameState.creatorChoice : gameState.joinerChoice) && (
                    <div style={{
                      padding: '0.75rem',
                      background: 'rgba(255, 215, 0, 0.1)',
                      border: '1px solid rgba(255, 215, 0, 0.3)',
                      borderRadius: '0.75rem',
                      textAlign: 'center',
                      marginTop: '0.5rem'
                    }}>
                      <div style={{
                        color: '#FFD700',
                        fontSize: '0.9rem',
                        fontWeight: 'bold',
                        animation: 'pulse 2s ease-in-out infinite',
                        textShadow: '0 0 5px rgba(255, 215, 0, 0.8)'
                      }}>
                        ⏳ Waiting for opponent's choice...
                      </div>
                      <div style={{
                        color: '#CCCCCC',
                        fontSize: '0.8rem',
                        marginTop: '0.25rem'
                      }}>
                        {gameState.phase === 'choosing' ? 'Player 1 goes first' : 'Please wait...'}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </PlayerSection>
            
            {/* Game Phase Messages */}
            {gameState.phase === 'choosing' && gameState.currentRound === 5 && (
              <div style={{
                textAlign: 'center',
                marginBottom: '1rem',
                padding: '1rem',
                background: 'rgba(255, 20, 147, 0.1)',
                border: '1px solid rgba(255, 20, 147, 0.3)',
                borderRadius: '0.75rem'
              }}>
                <p style={{ color: theme.colors.neonPink, margin: 0 }}>
                  🎲 FINAL ROUND - Auto-flip for fairness! 🎲
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
            
            {/* Choice Buttons - Show when game is active and it's player's turn */}
            {gameData?.creator_deposited && gameData?.challenger_deposited && gameData?.status === 'active' && 
             (gameState.phase === 'choosing' || gameState.phase === 'active' || gameState.phase === 'waiting') && 
             isMyTurn() && !(isCreator() ? gameState.creatorChoice : gameState.joinerChoice) && 
             !(isCreator() ? playerChoices.creator : playerChoices.joiner) && (
              <div style={{
                background: 'linear-gradient(135deg, rgba(0, 20, 40, 0.95) 0%, rgba(0, 100, 120, 0.9) 100%)',
                padding: '2rem',
                borderRadius: '1rem',
                border: '2px solid #FFD700',
                backdropFilter: 'blur(10px)',
                boxShadow: '0 0 30px rgba(0, 100, 120, 0.4), inset 0 0 20px rgba(255, 215, 0, 0.1)',
                marginBottom: '2rem',
                textAlign: 'center'
              }}>
                <h3 style={{ 
                  color: '#FFD700', 
                  marginBottom: '1.5rem', 
                  fontSize: '1.3rem',
                  textShadow: '0 0 10px rgba(255, 215, 0, 0.5)'
                }}>
                  🎯 CHOOSE YOUR SIDE
                </h3>
                
                <div style={{
                  display: 'flex',
                  gap: '2rem',
                  justifyContent: 'center',
                  flexWrap: 'wrap'
                }}>
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      handlePlayerChoice('heads')
                    }}
                    onMouseDown={(e) => {
                      e.preventDefault()
                      if (navigator.vibrate) {
                        navigator.vibrate(50)
                      }
                    }}
                    style={{
                      padding: '1.5rem 3rem',
                      fontSize: '1.5rem',
                      background: 'linear-gradient(45deg, #00FF41, #0080FF, #00FF41)',
                      backgroundSize: '200% 200%',
                      border: '3px solid rgba(255, 255, 255, 0.3)',
                      borderRadius: '1rem',
                      color: '#000000',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      boxShadow: '0 0 30px rgba(0, 255, 65, 0.7), 0 0 60px rgba(0, 128, 255, 0.5)',
                      textShadow: '0 0 10px rgba(255, 255, 255, 0.8)',
                      position: 'relative',
                      overflow: 'hidden',
                      animation: 'gradientShift 2s ease infinite, glowPulse 1.5s ease-in-out infinite',
                      minWidth: '150px'
                    }}
                  >
                    <span style={{
                      position: 'relative',
                      zIndex: 2,
                      display: 'block',
                      width: '100%',
                      height: '100%'
                    }}>
                      HEADS
                    </span>
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: 'linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.2) 50%, transparent 70%)',
                      animation: 'shimmer 2s ease-in-out infinite',
                      zIndex: 1
                    }} />
                  </button>
                  
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      handlePlayerChoice('tails')
                    }}
                    onMouseDown={(e) => {
                      e.preventDefault()
                      if (navigator.vibrate) {
                        navigator.vibrate(50)
                      }
                    }}
                    style={{
                      padding: '1.5rem 3rem',
                      fontSize: '1.5rem',
                      background: 'linear-gradient(45deg, #FF1493, #FF6B35, #FF1493)',
                      backgroundSize: '200% 200%',
                      border: '3px solid rgba(255, 255, 255, 0.3)',
                      borderRadius: '1rem',
                      color: 'white',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      boxShadow: '0 0 30px rgba(255, 20, 147, 0.7), 0 0 60px rgba(255, 107, 53, 0.5)',
                      textShadow: '0 0 10px rgba(255, 255, 255, 0.8)',
                      position: 'relative',
                      overflow: 'hidden',
                      animation: 'gradientShift 2s ease infinite, glowPulse 1.5s ease-in-out infinite',
                      minWidth: '150px'
                    }}
                  >
                    <span style={{
                      position: 'relative',
                      zIndex: 2,
                      display: 'block',
                      width: '100%',
                      height: '100%'
                    }}>
                      TAILS
                    </span>
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: 'linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.2) 50%, transparent 70%)',
                      animation: 'shimmer 2s ease-in-out infinite',
                      zIndex: 1
                    }} />
                  </button>
                </div>
              </div>
            )}
            

            
            
            
            {/* Three Column Layout */}
            <BottomSection>
              {/* Payment Section - Show for challenger who needs to deposit */}
              {gameData?.status === 'waiting_challenger_deposit' && address === getGameJoiner() && !gameData?.challenger_deposited && (
                <PaymentSection style={{ animation: 'pulse 2s infinite' }}>
                  <h2 style={{ color: theme.colors.neonPink, marginBottom: '1rem' }}>
                    ⏰ Your Offer Was Accepted! Deposit Required
                  </h2>
                  
                  {/* Countdown Timer */}
                  {depositTimeLeft !== null && (
                    <DepositCountdown isUrgent={depositTimeLeft < 30}>
                      <div style={{ fontSize: '2rem', fontWeight: 'bold', color: depositTimeLeft < 30 ? '#ff0000' : '#ffa500' }}>
                        {formatTimeLeft(depositTimeLeft)}
                      </div>
                      <div style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>
                        Time remaining to deposit
                      </div>
                    </DepositCountdown>
                  )}
                  
                  <NFTPreview>
                    <NFTImage src={getGameNFTImage()} alt={getGameNFTName()} />
                    <NFTInfo>
                      <h3>{getGameNFTName()}</h3>
                      <p>{getGameNFTCollection()}</p>
                      <p style={{ color: theme.colors.textSecondary, fontSize: '0.9rem' }}>
                        Creator has already deposited this NFT!
                      </p>
                    </NFTInfo>
                  </NFTPreview>
                  
                  <PriceDisplay>${(getGamePrice() || 0).toFixed(2)} USD</PriceDisplay>
                  
                  <div style={{ 
                    background: 'rgba(255, 255, 255, 0.1)', 
                    padding: '1rem', 
                    borderRadius: '0.5rem',
                    marginBottom: '1rem'
                  }}>
                    <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem' }}>
                      💎 ETH Amount: {ethAmount ? ethers.formatEther(ethAmount) : 'Calculating...'} ETH
                    </p>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: theme.colors.textSecondary }}>
                      Includes 3.5% platform fee
                    </p>
                  </div>
                  
                  <PayButton 
                    onClick={async () => {
                      try {
                        showInfo('Depositing ETH...')
                        
                        // Use the calculated ETH amount
                        if (!ethAmount) {
                          showError('ETH amount not available. Please wait for calculation.')
                          return
                        }
                        
                        console.log('💰 Using calculated ETH amount:', ethers.formatEther(ethAmount), 'ETH')
                        console.log('💰 ETH amount type:', typeof ethAmount)
                        console.log('💰 ETH amount constructor:', ethAmount?.constructor?.name)
                        console.log('💰 ETH amount toString:', ethAmount?.toString())
                        
                        const result = await contractService.depositETH(gameId, ethAmount)
                        if (result.success) {
                          showSuccess('ETH deposited successfully!')
                          
                          // Clear countdown
                          if (countdownInterval) {
                            clearInterval(countdownInterval)
                            setCountdownInterval(null)
                          }
                          setDepositTimeLeft(null)
                          
                          // Confirm deposit to backend
                          await fetch(getApiUrl(`/games/${gameId}/deposit-confirmed`), {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              player: address,
                              assetType: 'eth',
                              transactionHash: result.transactionHash
                            })
                          })
                          
                          // Reload game data
                          loadGameData()
                        } else {
                          showError(result.error || 'Failed to deposit ETH')
                        }
                      } catch (error) {
                        console.error('Error depositing ETH:', error)
                        showError('Failed to deposit ETH')
                      }
                    }}
                    disabled={!contractInitialized || depositTimeLeft === 0}
                  >
                    {depositTimeLeft === 0 ? 'Deposit Timeout' : 'Deposit ETH & Start Game'}
                  </PayButton>
                  
                  {depositTimeLeft === 0 && (
                    <div style={{ 
                      marginTop: '1rem', 
                      padding: '1rem', 
                      background: 'rgba(255, 0, 0, 0.1)', 
                      border: '1px solid rgba(255, 0, 0, 0.3)',
                      borderRadius: '0.5rem'
                    }}>
                      <p style={{ color: '#ff6666', margin: 0 }}>
                        ⏰ Deposit timeout! The game has been cancelled and the listing is open for new offers.
                      </p>
                    </div>
                  )}
                </PaymentSection>
              )}

              {/* Show countdown in offers section for creator */}
              {gameData?.status === 'waiting_challenger_deposit' && address === getGameCreator() && depositTimeLeft !== null && (
                <div style={{
                  background: 'rgba(255, 165, 0, 0.1)',
                  border: '2px solid #ffa500',
                  borderRadius: '0.75rem',
                  padding: '1rem',
                  marginBottom: '1rem',
                  textAlign: 'center'
                }}>
                  <h4 style={{ color: '#ffa500', margin: '0 0 0.5rem 0' }}>
                    Waiting for Challenger to Deposit
                  </h4>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: depositTimeLeft < 30 ? '#ff0000' : '#ffa500' }}>
                    {formatTimeLeft(depositTimeLeft)}
                  </div>
                  <p style={{ fontSize: '0.8rem', color: theme.colors.textSecondary, margin: '0.5rem 0 0 0' }}>
                    If challenger doesn't deposit, listing will reopen for new offers
                  </p>
                </div>
              )}

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
                    Price: ${(getGamePrice() || 0).toFixed(2)} USD
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h4 style={{ margin: 0, color: theme.colors.neonPink }}>NFT Offers</h4>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ 
                      width: '8px', 
                      height: '8px', 
                      borderRadius: '50%', 
                      background: theme.colors.neonGreen,
                      animation: 'pulse 2s infinite'
                    }}></div>
                    <span style={{ color: theme.colors.neonGreen, fontSize: '0.8rem' }}>Live</span>
                  </div>
                </div>
                
                {/* Creator countdown */}
                {isCreator() && gameData?.status === 'waiting_challenger_deposit' && depositTimeLeft !== null && (
                  <div style={{ 
                    marginBottom: '1rem', 
                    padding: '1rem', 
                    background: 'rgba(255, 20, 147, 0.1)', 
                    borderRadius: '0.5rem',
                    textAlign: 'center',
                    border: `1px solid ${theme.colors.neonPink}`
                  }}>
                    <p style={{ color: theme.colors.neonPink, margin: '0 0 0.5rem 0', fontWeight: 'bold' }}>
                      Waiting for challenger to deposit
                    </p>
                    <p style={{ color: theme.colors.neonYellow, margin: 0, fontSize: '1.2rem', fontWeight: 'bold' }}>
                      {formatTimeLeft(depositTimeLeft)}
                    </p>
                  </div>
                )}
                
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
            onClose={() => {
              setShowResultPopup(false)
              resetForNextRound()
            }}
            onClaimWinnings={() => {
              showSuccess('Winnings claimed!')
              setShowResultPopup(false)
              resetForNextRound()
            }}
            gameData={gameData}
          />
        )}
      </Container>
    </ThemeProvider>
  )
  }
  
export default UnifiedGamePage