import { useState, useEffect, useCallback, useRef } from 'react'
import { useAccount } from 'wagmi'
import { getApiUrl } from '../../../config/api'
import { useNotification } from '../../../contexts/NotificationContext'
import useWebSocket from '../../../utils/useWebSocket'

export default function useGameData(gameId) {
  const { address } = useAccount()
  const { showSuccess, showError, showInfo } = useNotification()
  const { sendMessage: wsSend, lastMessage, isConnected } = useWebSocket()
  
  // State
  const [gameData, setGameData] = useState(null)
  const [gameState, setGameState] = useState({
    phase: 'waiting',
    currentRound: 0,
    scores: { creator: 0, joiner: 0 },
    choices: { creator: null, joiner: null },
    powers: { creator: 0, joiner: 0 }
  })
  const [offers, setOffers] = useState([])
  const [messages, setMessages] = useState([])
  const [depositTimeLeft, setDepositTimeLeft] = useState(null)
  const [loading, setLoading] = useState(true)
  
  const depositTimerRef = useRef(null)
  
  // Load game data from API
  const loadGameData = useCallback(async () => {
    if (!gameId) return
    
    try {
      const response = await fetch(getApiUrl(`/games/${gameId}`))
      
      if (response.ok) {
        const data = await response.json()
        console.log('📦 Loaded game data:', data)
        setGameData(data)
        
        // Set initial phase based on status
        if (data.status === 'waiting_for_challenger') {
          setGameState(prev => ({ ...prev, phase: 'waiting' }))
        } else if (data.status === 'waiting_challenger_deposit') {
          setGameState(prev => ({ ...prev, phase: 'locked' }))
          startDepositTimer(data.deposit_deadline)
        } else if (data.status === 'active') {
          setGameState(prev => ({ ...prev, phase: 'playing' }))
        }
      } else {
        console.error('Failed to load game data:', response.status)
        showError('Failed to load game data')
      }
    } catch (error) {
      console.error('Error loading game data:', error)
      showError('Error loading game data')
    } finally {
      setLoading(false)
    }
  }, [gameId, showError])
  
  // Load offers
  const loadOffers = useCallback(async () => {
    if (!gameData) return
    
    try {
      const listingId = gameData.listing_id || gameData.id
      const response = await fetch(getApiUrl(`/listings/${listingId}/offers`))
      
      if (response.ok) {
        const offersData = await response.json()
        setOffers(offersData)
      }
    } catch (error) {
      console.error('Error loading offers:', error)
    }
  }, [gameData])
  
  // Load chat messages
  const loadMessages = useCallback(async () => {
    if (!gameId) return
    
    try {
      const response = await fetch(getApiUrl(`/games/${gameId}/messages`))
      
      if (response.ok) {
        const messagesData = await response.json()
        setMessages(messagesData)
      }
    } catch (error) {
      console.error('Error loading messages:', error)
    }
  }, [gameId])
  
  // Start deposit countdown timer
  const startDepositTimer = useCallback((deadline) => {
    if (depositTimerRef.current) {
      clearInterval(depositTimerRef.current)
    }
    
    depositTimerRef.current = setInterval(() => {
      const now = new Date().getTime()
      const deadlineTime = new Date(deadline).getTime()
      const timeLeft = Math.max(0, deadlineTime - now)
      
      if (timeLeft === 0) {
        clearInterval(depositTimerRef.current)
        setDepositTimeLeft(0)
        // Reload game data to check status
        loadGameData()
      } else {
        setDepositTimeLeft(Math.floor(timeLeft / 1000))
      }
    }, 1000)
  }, [loadGameData])
  
  // Authenticate with WebSocket when connected
  useEffect(() => {
    if (isConnected && address && gameId) {
      console.log('🔌 Authenticating WebSocket connection')
      wsSend({
        type: 'authenticate',
        address,
        gameId
      })
    }
  }, [isConnected, address, gameId, wsSend])
  
  // Handle WebSocket messages
  useEffect(() => {
    if (!lastMessage) return
    
    try {
      const data = JSON.parse(lastMessage.data)
      console.log('📨 useGameData received:', data.type, data)
      
      switch (data.type) {
        case 'authenticated':
          console.log('✅ WebSocket authenticated:', data.role)
          break
          
        case 'offer_accepted':
          handleOfferAccepted(data)
          break
          
        case 'game_phase_transition':
          handlePhaseTransition(data)
          break
          
        case 'deposit_received':
          handleDepositReceived(data)
          break
          
        case 'deposit_timeout':
          handleDepositTimeout(data)
          break
          
        case 'chat_message':
          handleChatMessage(data)
          break
          
        case 'game_awaiting_challenger_deposit':
          // Update local state to show deposit UI
          setGameState(prev => ({ ...prev, phase: 'locked' }))
          if (data.deposit_deadline) {
            startDepositTimer(data.deposit_deadline)
          }
          showInfo('Waiting for deposit...')
          break
          
        default:
          // Let parent components handle other messages
          break
      }
    } catch (error) {
      console.error('Error parsing WebSocket message:', error)
    }
  }, [lastMessage])
  
  // Handle offer accepted
  const handleOfferAccepted = useCallback((data) => {
    console.log('🎉 Offer accepted:', data)
    
    // Update game data with challenger info
    setGameData(prev => ({
      ...prev,
      status: 'waiting_challenger_deposit',
      challenger: data.acceptedOffer.offerer_address,
      payment_amount: data.acceptedOffer.cryptoAmount,
      deposit_deadline: data.depositDeadline
    }))
    
    // Update phase
    setGameState(prev => ({ ...prev, phase: 'locked' }))
    
    // Start deposit timer
    if (data.depositDeadline) {
      startDepositTimer(data.depositDeadline)
    }
    
    // Show notification based on role
    if (data.acceptedOffer.offerer_address === address) {
      showSuccess('🎉 Your offer was accepted! Please deposit ETH to continue.')
    } else {
      showInfo('Offer accepted. Waiting for challenger to deposit...')
    }
    
    // Reload offers
    loadOffers()
  }, [address, showSuccess, showInfo, startDepositTimer, loadOffers])
  
  // Handle phase transition
  const handlePhaseTransition = useCallback((data) => {
    console.log('🎮 Phase transition:', data)
    
    setGameState(prev => ({
      ...prev,
      phase: data.phase
    }))
    
    if (data.phase === 'awaiting_deposit' && data.depositRequired) {
      // Challenger needs to deposit
      setGameData(prev => ({
        ...prev,
        payment_amount: data.amount,
        deposit_deadline: data.deadline
      }))
      startDepositTimer(data.deadline)
      showInfo('Please deposit ETH to join the game')
    } else if (data.phase === 'game_active') {
      // Both deposits confirmed, game starting
      showSuccess('Game is starting!')
      // Clear deposit timer
      if (depositTimerRef.current) {
        clearInterval(depositTimerRef.current)
        setDepositTimeLeft(null)
      }
    }
  }, [showInfo, showSuccess, startDepositTimer])
  
  // Handle deposit received
  const handleDepositReceived = useCallback((data) => {
    console.log('💎 Deposit received:', data)
    
    if (data.bothDeposited) {
      showSuccess('Both deposits confirmed! Game starting...')
      setGameState(prev => ({ ...prev, phase: 'countdown' }))
      // Clear deposit timer
      if (depositTimerRef.current) {
        clearInterval(depositTimerRef.current)
        setDepositTimeLeft(null)
      }
    } else {
      showInfo(`${data.player === address ? 'Your' : 'Opponent'} deposit confirmed`)
    }
  }, [address, showSuccess, showInfo])
  
  // Handle deposit timeout
  const handleDepositTimeout = useCallback((data) => {
    console.log('⏰ Deposit timeout:', data)
    showError('Deposit time expired. Game cancelled.')
    setGameState(prev => ({ ...prev, phase: 'waiting' }))
    setDepositTimeLeft(0)
    // Reload game data
    loadGameData()
  }, [showError, loadGameData])
  
  // Handle chat message
  const handleChatMessage = useCallback((data) => {
    setMessages(prev => [...prev, {
      sender: data.sender,
      message: data.message,
      timestamp: data.timestamp,
      type: data.type || 'text'
    }])
  }, [])
  
  // Accept an offer
  const handleAcceptOffer = useCallback(async (offerId) => {
    try {
      console.log('💰 Accepting offer:', offerId)
      
      // Send via WebSocket for real-time update
      wsSend({
        type: 'accept_offer',
        gameId,
        offerId
      })
      
      showSuccess('Accepting offer...')
      return true
    } catch (error) {
      console.error('Error accepting offer:', error)
      showError('Failed to accept offer')
      return false
    }
  }, [gameId, wsSend, showSuccess, showError])
  
  // Send chat message
  const sendMessage = useCallback((message) => {
    if (!message.trim()) return
    
    wsSend({
      type: 'chat_message',
      gameId,
      message
    })
    
    // Optimistically add to local messages
    setMessages(prev => [...prev, {
      sender: address,
      message,
      timestamp: new Date().toISOString(),
      type: 'text'
    }])
  }, [gameId, address, wsSend])
  
  // Initial load
  useEffect(() => {
    loadGameData()
    loadMessages()
  }, [loadGameData, loadMessages])
  
  // Load offers when game data changes
  useEffect(() => {
    if (gameData) {
      loadOffers()
    }
  }, [gameData, loadOffers])
  
  // Cleanup
  useEffect(() => {
    return () => {
      if (depositTimerRef.current) {
        clearInterval(depositTimerRef.current)
      }
    }
  }, [])
  
  // Helper functions
  const isCreator = useCallback(() => {
    return address && gameData?.creator && 
      address.toLowerCase() === gameData.creator.toLowerCase()
  }, [address, gameData])
  
  const isJoiner = useCallback(() => {
    return address && (gameData?.challenger || gameData?.joiner) && 
      address.toLowerCase() === (gameData.challenger || gameData.joiner).toLowerCase()
  }, [address, gameData])
  
  const isSpectator = useCallback(() => {
    return !isCreator() && !isJoiner()
  }, [isCreator, isJoiner])
  
  return {
    gameData,
    gameState,
    offers,
    messages,
    depositTimeLeft,
    loading,
    isCreator,
    isJoiner,
    isSpectator,
    loadGameData,
    handleAcceptOffer,
    sendMessage
  }
}
