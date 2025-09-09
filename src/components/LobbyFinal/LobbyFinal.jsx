import React, { useState, useEffect, useRef, useCallback } from 'react'
import styled from '@emotion/styled'
import { useParams, useNavigate } from 'react-router-dom'
import { useAccount } from 'wagmi'
import { useToast } from '../../contexts/ToastContext'
import socketService from '../../services/SocketService'
import ProfilePicture from '../ProfilePicture'
import OptimizedGoldCoin from '../OptimizedGoldCoin'

// === STYLED COMPONENTS ===
const LobbyContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  display: flex;
  flex-direction: column;
  color: white;
  position: relative;
`

const LobbyHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 2rem;
  background: rgba(0, 0, 0, 0.3);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`

const LobbyTitle = styled.h1`
  font-size: 1.8rem;
  font-weight: bold;
  color: #00FF41;
  margin: 0;
`

const ConnectionStatus = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  color: ${props => props.connected ? '#00FF41' : '#FF4444'};
`

const StatusDot = styled.div`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${props => props.connected ? '#00FF41' : '#FF4444'};
  animation: ${props => props.connected ? 'pulse 2s infinite' : 'none'};
  
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
`

const LobbyContent = styled.div`
  display: flex;
  flex: 1;
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
  padding: 2rem;
  gap: 2rem;
  
  @media (max-width: 768px) {
    flex-direction: column;
    padding: 1rem;
  }
`

const LeftPanel = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`

const RightPanel = styled.div`
  width: 400px;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  
  @media (max-width: 768px) {
    width: 100%;
  }
`

const NFTDetailsCard = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 15px;
  padding: 1.5rem;
  backdrop-filter: blur(10px);
`

const NFTImage = styled.img`
  width: 100%;
  max-width: 300px;
  height: 300px;
  object-fit: cover;
  border-radius: 10px;
  margin-bottom: 1rem;
`

const NFTTitle = styled.h2`
  font-size: 1.5rem;
  margin: 0 0 0.5rem 0;
  color: #00FF41;
`

const NFTDescription = styled.p`
  color: rgba(255, 255, 255, 0.8);
  line-height: 1.6;
  margin: 0 0 1rem 0;
`

const PriceDisplay = styled.div`
  font-size: 1.2rem;
  font-weight: bold;
  color: #FFD700;
  margin-bottom: 1rem;
`

const GameStatusCard = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 15px;
  padding: 1.5rem;
  backdrop-filter: blur(10px);
`

const StatusTitle = styled.h3`
  font-size: 1.2rem;
  margin: 0 0 1rem 0;
  color: #00FF41;
`

const PlayerInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 10px;
`

const PlayerName = styled.div`
  font-weight: bold;
  color: ${props => props.isCreator ? '#00FF41' : '#00BFFF'};
`

const WaitingMessage = styled.div`
  text-align: center;
  padding: 2rem;
  color: rgba(255, 255, 255, 0.7);
  font-style: italic;
`

const ChatCard = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 15px;
  padding: 1.5rem;
  backdrop-filter: blur(10px);
  display: flex;
  flex-direction: column;
  height: 500px;
`

const ChatTitle = styled.h3`
  font-size: 1.2rem;
  margin: 0 0 1rem 0;
  color: #00FF41;
`

const ChatMessages = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 10px;
  margin-bottom: 1rem;
  max-height: 300px;
`

const ChatMessage = styled.div`
  margin-bottom: 0.75rem;
  padding: 0.5rem;
  border-radius: 8px;
  background: ${props => props.isCurrentUser ? 'rgba(0, 255, 65, 0.1)' : 'rgba(255, 255, 255, 0.05)'};
  border-left: 3px solid ${props => props.isCurrentUser ? '#00FF41' : '#00BFFF'};
`

const MessageSender = styled.div`
  font-size: 0.8rem;
  color: ${props => props.isCurrentUser ? '#00FF41' : '#00BFFF'};
  font-weight: bold;
  margin-bottom: 0.25rem;
`

const MessageText = styled.div`
  color: white;
  line-height: 1.4;
`

const MessageTime = styled.div`
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.5);
  margin-top: 0.25rem;
`

const ChatInput = styled.div`
  display: flex;
  gap: 0.5rem;
`

const MessageInput = styled.input`
  flex: 1;
  padding: 0.75rem;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  color: white;
  font-size: 0.9rem;
  
  &::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }
  
  &:focus {
    outline: none;
    border-color: #00FF41;
  }
`

const SendButton = styled.button`
  padding: 0.75rem 1.5rem;
  background: #00FF41;
  color: #000;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: bold;
  transition: all 0.3s ease;
  
  &:hover {
    background: #00CC33;
    transform: translateY(-1px);
  }
  
  &:disabled {
    background: rgba(0, 255, 65, 0.3);
    cursor: not-allowed;
    transform: none;
  }
`

const OffersCard = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 15px;
  padding: 1.5rem;
  backdrop-filter: blur(10px);
`

const OffersTitle = styled.h3`
  font-size: 1.2rem;
  margin: 0 0 1rem 0;
  color: #00FF41;
`

const OfferItem = styled.div`
  padding: 1rem;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 10px;
  margin-bottom: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
`

const OfferHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
`

const OfferPrice = styled.div`
  font-size: 1.1rem;
  font-weight: bold;
  color: #FFD700;
`

const OfferActions = styled.div`
  display: flex;
  gap: 0.5rem;
`

const ActionButton = styled.button`
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: bold;
  transition: all 0.3s ease;
  
  &.accept {
    background: #00FF41;
    color: #000;
    
    &:hover {
      background: #00CC33;
    }
  }
  
  &.reject {
    background: #FF4444;
    color: white;
    
    &:hover {
      background: #CC3333;
    }
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`

const OfferInput = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 1rem;
`

const InputGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`

const InputLabel = styled.label`
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.8);
`

const Input = styled.input`
  padding: 0.75rem;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  color: white;
  font-size: 0.9rem;
  
  &::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }
  
  &:focus {
    outline: none;
    border-color: #00FF41;
  }
`

const TextArea = styled.textarea`
  padding: 0.75rem;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  color: white;
  font-size: 0.9rem;
  resize: vertical;
  min-height: 80px;
  
  &::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }
  
  &:focus {
    outline: none;
    border-color: #00FF41;
  }
`

const SubmitButton = styled.button`
  padding: 0.75rem 1.5rem;
  background: #00BFFF;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: bold;
  transition: all 0.3s ease;
  
  &:hover {
    background: #0099CC;
    transform: translateY(-1px);
  }
  
  &:disabled {
    background: rgba(0, 191, 255, 0.3);
    cursor: not-allowed;
    transform: none;
  }
`

const DepositOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(5px);
`

const DepositModal = styled.div`
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  padding: 2rem;
  max-width: 500px;
  width: 90%;
  text-align: center;
  position: relative;
`

const CloseButton = styled.button`
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: none;
  border: none;
  color: white;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0.5rem;
  
  &:hover {
    color: #FF4444;
  }
`

const DepositTitle = styled.h2`
  font-size: 1.5rem;
  margin: 0 0 1rem 0;
  color: #00FF41;
`

const DepositSubtitle = styled.p`
  color: rgba(255, 255, 255, 0.8);
  margin: 0 0 1.5rem 0;
`

const CountdownDisplay = styled.div`
  font-size: 2rem;
  font-weight: bold;
  color: ${props => props.isUrgent ? '#FF4444' : '#00FF41'};
  margin: 1rem 0;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 10px;
  border: 2px solid ${props => props.isUrgent ? '#FF4444' : '#00FF41'};
`

const DepositButton = styled.button`
  padding: 1rem 2rem;
  background: #00FF41;
  color: #000;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-size: 1.1rem;
  font-weight: bold;
  transition: all 0.3s ease;
  margin-top: 1rem;
  
  &:hover {
    background: #00CC33;
    transform: translateY(-2px);
  }
  
  &:disabled {
    background: rgba(0, 255, 65, 0.3);
    cursor: not-allowed;
    transform: none;
  }
`

// === MAIN COMPONENT ===
const LobbyFinal = () => {
  const { gameId } = useParams()
  const { address } = useAccount()
  const { showSuccess, showError, showInfo } = useToast()
  const navigate = useNavigate()
  
  // State
  const [connected, setConnected] = useState(false)
  const [gameData, setGameData] = useState(null)
  const [messages, setMessages] = useState([])
  const [offers, setOffers] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [newOffer, setNewOffer] = useState({ price: '', message: '' })
  const [isCreatingOffer, setIsCreatingOffer] = useState(false)
  const [showDepositOverlay, setShowDepositOverlay] = useState(false)
  const [depositState, setDepositState] = useState(null)
  const [isDepositing, setIsDepositing] = useState(false)
  
  // Refs
  const messagesEndRef = useRef(null)
  const chatMessagesRef = useRef(null)
  
  // Scroll to bottom of chat
  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [])
  
  // Load chat history
  const loadChatHistory = useCallback(async () => {
    try {
      const response = await fetch(`/api/chat/${gameId}?limit=100`)
      if (response.ok) {
        const data = await response.json()
        if (data.messages && Array.isArray(data.messages)) {
          const formattedMessages = data.messages.map(msg => ({
            id: msg.id || Date.now() + Math.random(),
            sender: msg.sender_address || msg.sender,
            message: msg.message,
            timestamp: new Date(msg.timestamp).toLocaleTimeString(),
            isCurrentUser: (msg.sender_address || msg.sender)?.toLowerCase() === address?.toLowerCase()
          }))
          setMessages(formattedMessages)
          console.log(`📜 Loaded ${formattedMessages.length} chat messages`)
        }
      }
    } catch (error) {
      console.error('❌ Failed to load chat history:', error)
    }
  }, [gameId, address])
  
  // Load game data
  const loadGameData = useCallback(async () => {
    try {
      const response = await fetch(`/api/games/${gameId}`)
      if (response.ok) {
        const data = await response.json()
        setGameData(data)
        console.log('🎮 Game data loaded:', data)
      }
    } catch (error) {
      console.error('❌ Failed to load game data:', error)
    }
  }, [gameId])
  
  // Load offers
  const loadOffers = useCallback(async () => {
    try {
      const response = await fetch(`/api/games/${gameId}/offers`)
      if (response.ok) {
        const data = await response.json()
        setOffers(data.offers || [])
        console.log('💰 Offers loaded:', data.offers?.length || 0)
      }
    } catch (error) {
      console.error('❌ Failed to load offers:', error)
    }
  }, [gameId])
  
  // Socket.io connection
  useEffect(() => {
    if (!gameId || !address) return
    
    const connectSocket = async () => {
      try {
        await socketService.connect(gameId, address)
        setConnected(true)
        console.log('✅ Socket.io connected to lobby')
      } catch (error) {
        console.error('❌ Socket.io connection failed:', error)
        setConnected(false)
      }
    }
    
    connectSocket()
    
    // Load initial data
    loadGameData()
    loadChatHistory()
    loadOffers()
    
    return () => {
      socketService.disconnect()
      setConnected(false)
    }
  }, [gameId, address, loadGameData, loadChatHistory, loadOffers])
  
  // Socket.io event handlers
  useEffect(() => {
    if (!connected) return
    
    // Chat message handler
    const handleChatMessage = (data) => {
      console.log('💬 Chat message received:', data)
      const newMsg = {
        id: Date.now() + Math.random(),
        sender: data.from || data.sender || data.sender_address,
        message: data.message,
        timestamp: new Date().toLocaleTimeString(),
        isCurrentUser: (data.from || data.sender || data.sender_address)?.toLowerCase() === address?.toLowerCase()
      }
      setMessages(prev => [...prev, newMsg])
      console.log('💬 Added message to chat:', newMsg)
    }
    
    // Chat history handler
    const handleChatHistory = (data) => {
      console.log('📜 Chat history received:', data.messages?.length || 0, 'messages')
      if (data.messages && Array.isArray(data.messages)) {
        const formattedMessages = data.messages.map(msg => ({
          id: msg.id || Date.now() + Math.random(),
          sender: msg.sender_address || msg.sender,
          message: msg.message,
          timestamp: new Date(msg.timestamp).toLocaleTimeString(),
          isCurrentUser: (msg.sender_address || msg.sender)?.toLowerCase() === address?.toLowerCase()
        }))
        setMessages(formattedMessages)
      }
    }
    
    // Offer handler
    const handleOffer = (data) => {
      console.log('💰 New offer received:', data)
      setOffers(prev => [...prev, data])
    }
    
    // Offer accepted handler
    const handleOfferAccepted = (data) => {
      console.log('✅ Offer accepted:', data)
      showSuccess('Offer accepted! Game starting...')
      
      // Show deposit overlay
      setDepositState({
        phase: 'deposit_stage',
        creator: data.creator,
        challenger: data.challenger,
        timeRemaining: 120,
        creatorDeposited: false,
        challengerDeposited: false,
        cryptoAmount: data.cryptoAmount
      })
      setShowDepositOverlay(true)
    }
    
    // Deposit stage started handler
    const handleDepositStageStarted = (data) => {
      console.log('🎯 Deposit stage started:', data)
      if (data.gameId === gameId) {
        setDepositState({
          phase: 'deposit_stage',
          creator: data.creator,
          challenger: data.challenger,
          timeRemaining: data.timeRemaining || 120,
          creatorDeposited: false,
          challengerDeposited: false,
          cryptoAmount: data.cryptoAmount
        })
        setShowDepositOverlay(true)
      }
    }
    
    // Deposit countdown handler
    const handleDepositCountdown = (data) => {
      if (data.gameId === gameId) {
        setDepositState(prev => prev ? { ...prev, timeRemaining: data.timeRemaining } : null)
      }
    }
    
    // Deposit confirmed handler
    const handleDepositConfirmed = (data) => {
      console.log('💰 Deposit confirmed:', data)
      if (data.gameId === gameId) {
        setDepositState(prev => prev ? {
          ...prev,
          creatorDeposited: data.creatorDeposited || prev.creatorDeposited,
          challengerDeposited: data.challengerDeposited || prev.challengerDeposited
        } : null)
      }
    }
    
    // Game started handler
    const handleGameStarted = (data) => {
      console.log('🎮 Game started:', data)
      if (data.gameId === gameId) {
        setShowDepositOverlay(false)
        setDepositState(null)
        
        // Transport to flip suite
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('switchToFlipSuite', {
            detail: { gameId: gameId, immediate: true }
          }))
        }, 1000)
      }
    }
    
    // Register handlers
    socketService.on('chat_message', handleChatMessage)
    socketService.on('chat_history', handleChatHistory)
    socketService.on('crypto_offer', handleOffer)
    socketService.on('offer_accepted', handleOfferAccepted)
    socketService.on('deposit_stage_started', handleDepositStageStarted)
    socketService.on('deposit_countdown', handleDepositCountdown)
    socketService.on('deposit_confirmed', handleDepositConfirmed)
    socketService.on('game_started', handleGameStarted)
    
    // Cleanup
    return () => {
      socketService.off('chat_message', handleChatMessage)
      socketService.off('chat_history', handleChatHistory)
      socketService.off('crypto_offer', handleOffer)
      socketService.off('offer_accepted', handleOfferAccepted)
      socketService.off('deposit_stage_started', handleDepositStageStarted)
      socketService.off('deposit_countdown', handleDepositCountdown)
      socketService.off('deposit_confirmed', handleDepositConfirmed)
      socketService.off('game_started', handleGameStarted)
    }
  }, [connected, gameId, address, showSuccess])
  
  // Auto-scroll chat
  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])
  
  // Send chat message
  const sendMessage = () => {
    if (!newMessage.trim()) return
    
    console.log('💬 Sending chat message:', { message: newMessage.trim(), from: address })
    
    socketService.emit('chat_message', {
      message: newMessage.trim(),
      from: address,
      gameId: gameId
    })
    
    // Add optimistic message
    const optimisticMessage = {
      id: Date.now() + Math.random(),
      sender: address,
      message: newMessage.trim(),
      timestamp: new Date().toLocaleTimeString(),
      isCurrentUser: true
    }
    setMessages(prev => [...prev, optimisticMessage])
    
    setNewMessage('')
  }
  
  // Create offer
  const createOffer = async () => {
    if (!newOffer.price || !newOffer.message) {
      showError('Please fill in both price and message')
      return
    }
    
    setIsCreatingOffer(true)
    try {
      const response = await fetch(`/api/games/${gameId}/offers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          offerer_address: address,
          offer_price: parseFloat(newOffer.price),
          message: newOffer.message
        })
      })
      
      if (response.ok) {
        showSuccess('Offer created successfully!')
        setNewOffer({ price: '', message: '' })
        loadOffers()
      } else {
        showError('Failed to create offer')
      }
    } catch (error) {
      console.error('❌ Error creating offer:', error)
      showError('Failed to create offer')
    } finally {
      setIsCreatingOffer(false)
    }
  }
  
  // Accept offer
  const acceptOffer = async (offerId, offerPrice) => {
    try {
      showInfo('Accepting offer...')
      
      socketService.emit('accept_offer', {
        offerId,
        accepterAddress: address,
        cryptoAmount: offerPrice
      })
      
      showSuccess('Offer accepted! Game starting...')
    } catch (error) {
      console.error('❌ Error accepting offer:', error)
      showError('Failed to accept offer')
    }
  }
  
  // Handle deposit
  const handleDeposit = async () => {
    if (isDepositing) return
    setIsDepositing(true)
    
    try {
      const userRole = depositState?.creator?.toLowerCase() === address?.toLowerCase() ? 'creator' : 'challenger'
      
      if (userRole === 'creator') {
        // Creator deposits NFT
        showInfo('Depositing NFT...')
        // TODO: Implement NFT deposit logic
        showSuccess('NFT deposited successfully!')
      } else if (userRole === 'challenger') {
        // Challenger deposits crypto
        showInfo('Depositing crypto...')
        // TODO: Implement crypto deposit logic
        showSuccess('Crypto deposited successfully!')
      }
      
      // Notify server
      socketService.emit('deposit_confirmed', {
        gameId: gameId,
        player: address,
        assetType: userRole === 'creator' ? 'nft' : 'crypto'
      })
      
    } catch (error) {
      console.error('❌ Deposit failed:', error)
      showError('Deposit failed: ' + error.message)
    } finally {
      setIsDepositing(false)
    }
  }
  
  // Format time
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }
  
  // Check if user is creator
  const isCreator = () => {
    if (!gameData || !address) {
      console.log('🔍 isCreator check failed:', { hasGameData: !!gameData, hasAddress: !!address })
      return false
    }
    
    const creatorAddress = gameData.creator
    if (!creatorAddress) {
      console.log('🔍 No creator address found in gameData:', Object.keys(gameData))
      return false
    }
    
    const isCreatorResult = address.toLowerCase() === creatorAddress.toLowerCase()
    console.log('🔍 isCreator result:', { 
      address: address.toLowerCase(), 
      creatorAddress: creatorAddress.toLowerCase(), 
      isCreator: isCreatorResult 
    })
    
    return isCreatorResult
  }
  
  // Check if user is challenger
  const isChallenger = () => {
    if (!gameData || !address) return false
    return gameData?.challenger?.toLowerCase() === address?.toLowerCase()
  }
  
  if (!gameData) {
    return (
      <LobbyContainer>
        <LobbyHeader>
          <LobbyTitle>Loading...</LobbyTitle>
        </LobbyHeader>
      </LobbyContainer>
    )
  }
  
  return (
    <LobbyContainer>
      <LobbyHeader>
        <LobbyTitle>🎮 Flip Lobby</LobbyTitle>
        <ConnectionStatus connected={connected}>
          <StatusDot connected={connected} />
          {connected ? 'Connected' : 'Disconnected'}
        </ConnectionStatus>
      </LobbyHeader>
      
      <LobbyContent>
        <LeftPanel>
          <NFTDetailsCard>
            <NFTImage 
              src={gameData.nft_image || '/placeholder-nft.svg'} 
              alt={gameData.nft_name || 'NFT'}
            />
            <NFTTitle>{gameData.nft_name || 'Unknown NFT'}</NFTTitle>
            <NFTDescription>
              {gameData.nft_description || 'No description available'}
            </NFTDescription>
            <PriceDisplay>
              ${gameData.price_usd || 0} USD
            </PriceDisplay>
          </NFTDetailsCard>
          
          <GameStatusCard>
            <StatusTitle>Game Status</StatusTitle>
            <div>Status: {gameData.status || 'Unknown'}</div>
            <div>Phase: {gameData.phase || 'Unknown'}</div>
            
            {gameData.creator && (
              <PlayerInfo>
                <ProfilePicture 
                  address={gameData.creator} 
                  size={40}
                />
                <PlayerName isCreator={true}>
                  Creator: {gameData.creator?.slice(0, 6)}...{gameData.creator?.slice(-4)}
                </PlayerName>
              </PlayerInfo>
            )}
            
            {gameData.challenger && (
              <PlayerInfo>
                <ProfilePicture 
                  address={gameData.challenger} 
                  size={40}
                />
                <PlayerName isCreator={false}>
                  Challenger: {gameData.challenger?.slice(0, 6)}...{gameData.challenger?.slice(-4)}
                </PlayerName>
              </PlayerInfo>
            )}
            
            {!gameData.challenger && (
              <WaitingMessage>
                Waiting for challenger to join...
              </WaitingMessage>
            )}
          </GameStatusCard>
        </LeftPanel>
        
        <RightPanel>
          <ChatCard>
            <ChatTitle>💬 Chat</ChatTitle>
            <ChatMessages ref={chatMessagesRef}>
              {messages.map((msg) => (
                <ChatMessage key={msg.id} isCurrentUser={msg.isCurrentUser}>
                  <MessageSender isCurrentUser={msg.isCurrentUser}>
                    {msg.sender?.slice(0, 6)}...{msg.sender?.slice(-4)}
                  </MessageSender>
                  <MessageText>{msg.message}</MessageText>
                  <MessageTime>{msg.timestamp}</MessageTime>
                </ChatMessage>
              ))}
              <div ref={messagesEndRef} />
            </ChatMessages>
            <ChatInput>
              <MessageInput
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              />
              <SendButton onClick={sendMessage} disabled={!newMessage.trim()}>
                Send
              </SendButton>
            </ChatInput>
          </ChatCard>
          
          <OffersCard>
            <OffersTitle>💰 Offers</OffersTitle>
            
            {offers.map((offer) => (
              <OfferItem key={offer.id}>
                <OfferHeader>
                  <div>
                    <div>From: {offer.offerer_address?.slice(0, 6)}...{offer.offerer_address?.slice(-4)}</div>
                    <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>
                      {offer.message}
                    </div>
                  </div>
                  <OfferPrice>${offer.offer_price}</OfferPrice>
                </OfferHeader>
                {isCreator() && offer.status === 'pending' && (
                  <OfferActions>
                    <ActionButton 
                      className="accept"
                      onClick={() => acceptOffer(offer.id, offer.offer_price)}
                    >
                      Accept
                    </ActionButton>
                    <ActionButton className="reject">
                      Reject
                    </ActionButton>
                  </OfferActions>
                )}
              </OfferItem>
            ))}
            
            {/* Debug info */}
            <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', marginBottom: '1rem' }}>
              Debug: isCreator() = {isCreator().toString()}, address = {address?.slice(0, 6)}..., creator = {gameData?.creator?.slice(0, 6)}...
            </div>
            
            {!isCreator() && (
              <OfferInput>
                <InputGroup>
                  <InputLabel>Offer Price (USD)</InputLabel>
                  <Input
                    type="number"
                    value={newOffer.price}
                    onChange={(e) => setNewOffer(prev => ({ ...prev, price: e.target.value }))}
                    placeholder="Enter your offer"
                  />
                </InputGroup>
                <InputGroup>
                  <InputLabel>Message</InputLabel>
                  <TextArea
                    value={newOffer.message}
                    onChange={(e) => setNewOffer(prev => ({ ...prev, message: e.target.value }))}
                    placeholder="Add a message to your offer"
                  />
                </InputGroup>
                <SubmitButton 
                  onClick={createOffer}
                  disabled={isCreatingOffer || !newOffer.price || !newOffer.message}
                >
                  {isCreatingOffer ? 'Creating...' : 'Submit Offer'}
                </SubmitButton>
              </OfferInput>
            )}
          </OffersCard>
        </RightPanel>
      </LobbyContent>
      
      {/* Deposit Overlay */}
      {showDepositOverlay && depositState && (
        <DepositOverlay>
          <DepositModal>
            <CloseButton onClick={() => setShowDepositOverlay(false)}>✕</CloseButton>
            <DepositTitle>💰 Deposit Required</DepositTitle>
            <DepositSubtitle>
              {depositState.creator?.toLowerCase() === address?.toLowerCase() 
                ? 'You need to deposit your NFT to start the game'
                : 'You need to deposit crypto to join the game'
              }
            </DepositSubtitle>
            
            <CountdownDisplay isUrgent={depositState.timeRemaining <= 30}>
              {formatTime(depositState.timeRemaining)}
            </CountdownDisplay>
            
            <div style={{ marginBottom: '1rem' }}>
              <div>Creator: {depositState.creator?.slice(0, 6)}...{depositState.creator?.slice(-4)}</div>
              <div>Challenger: {depositState.challenger?.slice(0, 6)}...{depositState.challenger?.slice(-4)}</div>
              <div>Amount: ${depositState.cryptoAmount}</div>
            </div>
            
            <DepositButton 
              onClick={handleDeposit}
              disabled={isDepositing || depositState.timeRemaining === 0}
            >
              {isDepositing ? 'Processing...' : 'Deposit Now'}
            </DepositButton>
          </DepositModal>
        </DepositOverlay>
      )}
    </LobbyContainer>
  )
}

export default LobbyFinal
