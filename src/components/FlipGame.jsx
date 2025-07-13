import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useWallet } from '../contexts/WalletContext'
import { useToast } from '../contexts/ToastContext'
// Removed useProfile import - game now only uses game-specific coin data
import { useWalletConnection } from '../utils/useWalletConnection'
import { useSignMessage } from 'wagmi'
import { ThemeProvider } from '@emotion/react'
import { theme } from '../styles/theme'
import {
  Container,
  ContentWrapper,
  GlassCard,
  NeonText,
  Button,
  LoadingSpinner
} from '../styles/components'
import OptimizedGoldCoin from './OptimizedGoldCoin'
import MobileOptimizedCoin from './MobileOptimizedCoin'
import PowerDisplay from '../components/PowerDisplay'
import PaymentService from '../services/PaymentService'
import contractService from '../services/ContractService'
import ProfilePicture from './ProfilePicture'
import baseEthLogo from '../../Images/baseeth.webp'
import hazeVideo from '../../Images/Video/haze.webm'
import mobileVideo from '../../Images/Video/Mobile/mobile.webm'
import GoldGameInstructions from './GoldGameInstructions'
import ShareButton from './ShareButton'
import styled from '@emotion/styled'
import GameResultPopup from './GameResultPopup'

// Disable console logs in production
if (process.env.NODE_ENV === 'production') {
  console.log = () => {}
  console.warn = () => {}
}

// Chain configuration
const chainConfig = {
  ethereum: {
    explorer: 'https://etherscan.io',
    marketplace: 'https://opensea.io/assets/ethereum'
  },
  polygon: {
    explorer: 'https://polygonscan.com',
    marketplace: 'https://opensea.io/assets/matic'
  },
  base: {
    explorer: 'https://basescan.org',
    marketplace: 'https://opensea.io/assets/base'
  },
  arbitrum: {
    explorer: 'https://arbiscan.io',
    marketplace: 'https://opensea.io/assets/arbitrum'
  },
  optimism: {
    explorer: 'https://optimistic.etherscan.io',
    marketplace: 'https://opensea.io/assets/optimism'
  }
}

const getChainUrls = (chain) => {
  const config = chainConfig[chain?.toLowerCase()] || chainConfig.ethereum
  return {
    explorer: config.explorer,
    marketplace: config.marketplace
  }
}

// Common style constants
const commonStyles = {
  glassPanel: {
    background: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '1rem',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    padding: '1rem'
  },
  playerBox: {
    padding: '0.75rem',
    borderRadius: '12px',
    height: '60px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  nftInfo: {
    padding: '0.5rem',
    background: 'rgba(0, 0, 0, 0.3)',
    borderRadius: '0.5rem',
    fontSize: '0.8rem'
  },
  copyButton: {
    background: 'rgba(0, 0, 0, 0.3)',
    border: 'none',
    padding: '0.25rem 0.5rem',
    borderRadius: '0.25rem',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  }
}

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
  background: #000;
  transform: translateZ(0);
  backface-visibility: hidden;
  perspective: 1000px;
`

const ChoiceAnimation = styled.div`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: ${props => props.isMobile ? '6rem' : '10rem'};
  font-weight: 900;
  color: ${props => props.color};
  text-transform: uppercase;
  opacity: 0;
  z-index: 1000;
  pointer-events: none;
  animation: choiceAnimation 1s ease-out forwards;
  text-shadow: 0 0 20px ${props => props.color};

  @keyframes choiceAnimation {
    0% {
      opacity: 0;
      transform: translate(-50%, -50%) scale(0.2);
    }
    20% {
      opacity: 1;
      transform: translate(-50%, -50%) scale(1.1);
    }
    80% {
      opacity: 1;
      transform: translate(-50%, -50%) scale(1);
    }
    100% {
      opacity: 0;
      transform: translate(-50%, -50%) scale(1.2);
    }
  }
`

const AutoFlipAnimation = styled.div`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: ${props => props.isMobile ? '4rem' : '6rem'};
  font-weight: 900;
  color: #FFD700;
  text-transform: uppercase;
  opacity: 0;
  z-index: 1000;
  pointer-events: none;
  animation: autoFlipAnimation 2s ease-out forwards;
  text-shadow: 0 0 30px #FFD700, 0 0 60px #FFD700;
  text-align: center;
  line-height: 1.2;

  @keyframes autoFlipAnimation {
    0% {
      opacity: 0;
      transform: translate(-50%, -50%) scale(0.1) translateZ(-100px);
    }
    20% {
      opacity: 1;
      transform: translate(-50%, -50%) scale(1.2) translateZ(50px);
    }
    60% {
      opacity: 1;
      transform: translate(-50%, -50%) scale(1) translateZ(0px);
    }
    100% {
      opacity: 0;
      transform: translate(-50%, -50%) scale(1.5) translateZ(100px);
    }
  }
`

const Modal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`

const ModalContent = styled(GlassCard)`
  max-width: 500px;
  width: 90%;
  padding: 2rem;
`

const ModalHeader = styled.div`
  margin-bottom: 1.5rem;
`

const ModalBody = styled.div`
  margin-bottom: 1.5rem;
`

const ModalFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
`

const CloseButton = styled.button`
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: none;
  border: none;
  color: ${props => props.theme.colors.textSecondary};
  cursor: pointer;
  font-size: 1.5rem;
  padding: 0.5rem;
  
  &:hover {
    color: ${props => props.theme.colors.textPrimary};
  }
`

const NFTImage = styled.img`
  width: 100%;
  max-width: 200px;
  height: auto;
  border-radius: 1rem;
  margin: 0.5rem 0;
`

const NFTLink = styled.a`
  color: ${props => props.theme.colors.neonBlue};
  text-decoration: none;
  
  &:hover {
    text-decoration: underline;
  }
`

// Add these styled components at the top with the other styled components
const MobileOnlyLayout = styled.div`
  display: none;
  
  @media (max-width: 768px) {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding: 0.5rem;
    width: 100%;
  }
`

const MobilePlayerBox = styled.div`
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  width: 100%;
  margin-bottom: 0.5rem;
`;

const MobileNFTBox = styled.div`
  padding: 1rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  width: 100%;
  margin: 0.5rem 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
`;

const NFTDetails = styled.div`
  width: 100%;
  padding: 0.75rem;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 0.5rem;
  margin-bottom: 0.5rem;
`;

const NFTDetailRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const NFTLabel = styled.span`
  color: ${props => props.theme.colors.textSecondary};
`;

const NFTValue = styled.span`
  color: ${props => props.theme.colors.textPrimary};
  font-family: monospace;
`;

const MobileCoinBox = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 0.5rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  width: 100%;
  margin: 0.5rem 0;
  aspect-ratio: 1;
  max-width: 300px;
  margin-left: auto;
  margin-right: auto;
  touch-action: none;
  
  /* Ensure Three.js canvas is properly contained */
  canvas {
    max-width: 100%;
    max-height: 100%;
    border-radius: 50%;
  }
`

const MobileStatusBox = styled.div`
  padding: 1rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  width: 100%;
  margin: 0.5rem 0;
`

const MobileChatBox = styled.div`
  padding: 1rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  width: 100%;
  margin: 0.5rem 0;
  height: 300px;
  overflow-y: auto;
`

const DesktopOnlyLayout = styled.div`
  display: grid;
  grid-template-columns: 300px 1fr 300px;
  gap: 2rem;
  margin-bottom: 2rem;
  align-items: start;
  min-height: 500px;

  @media (max-width: 768px) {
    display: none;
  }
`

const ButtonGroup = styled.div`
  display: flex;
  gap: 0.5rem;
  width: 100%;
  justify-content: center;
  padding: 0.5rem;
`

const MobileBottomNav = styled.div`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  gap: 0.25rem;
  padding: 0.5rem;
  background: rgba(0, 0, 0, 0.9);
  backdrop-filter: blur(10px);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  z-index: 1000;

  @media (min-width: 769px) {
    display: none;
  }
`

const MobileNavButton = styled.button`
  flex: ${props => props.isJoinButton ? '2' : '1'};
  padding: 0.5rem;
  border-radius: 0.5rem;
  border: 2px solid rgba(0, 255, 65, 0.6);
  background: ${props => props.isJoinButton ? 'linear-gradient(45deg, #FF1493, #FF69B4)' : 'rgba(255, 255, 255, 0.05)'};
  color: white;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.875rem;

  &:hover {
    transform: translateY(-2px);
    border-color: rgba(0, 255, 65, 0.8);
    box-shadow: ${props => props.isJoinButton ? '0 0 20px rgba(255, 20, 147, 0.5)' : '0 0 15px rgba(0, 255, 65, 0.3)'};
  }
`

const MobileHidden = styled.div`
  @media (max-width: 768px) {
    display: none;
  }
`;

const MobileOnly = styled.div`
  display: none;
  @media (max-width: 768px) {
    display: block;
  }
`;

const MobileInfoPanel = styled.div`
  position: fixed;
  bottom: ${props => props.isOpen ? '60px' : '-100%'};
  left: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.95);
  backdrop-filter: blur(10px);
  padding: 0.75rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  transition: bottom 0.3s ease;
  z-index: 999;
  max-height: 70vh;
  overflow-y: auto;

  @media (min-width: 769px) {
    display: none;
  }
`

const MobileChatPanel = styled.div`
  position: fixed;
  bottom: ${props => props.isOpen ? '60px' : '-100%'};
  left: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.95);
  backdrop-filter: blur(10px);
  padding: 0.75rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  transition: bottom 0.3s ease;
  z-index: 999;
  height: 50vh;

  @media (min-width: 769px) {
    display: none;
  }
`

const FlipGame = () => {
  const { gameId } = useParams()
  const navigate = useNavigate()
  const { publicClient, isMobile } = useWallet()
  const { showSuccess, showError, showInfo } = useToast()
  const { isFullyConnected, connectionError, address, walletClient } = useWalletConnection()

  // API URL
  const API_URL = 'https://cryptoflipz2-production.up.railway.app'

  // Local state - ONLY for non-game logic
  const [gameData, setGameData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // WebSocket state - SINGLE SOURCE OF TRUTH for game
  const [socket, setSocket] = useState(null)
  const [connected, setConnected] = useState(false)
  const [gameState, setGameState] = useState(null)
  const [flipAnimation, setFlipAnimation] = useState(null)
  const [roundResult, setRoundResult] = useState(null)
  const [lastFlipResult, setLastFlipResult] = useState(null)

  // Custom coin images
  const [customHeadsImage, setCustomHeadsImage] = useState(null)
  const [customTailsImage, setCustomTailsImage] = useState(null)
  const [gameCoin, setGameCoin] = useState(null)

  // Refs for user input
  const isChargingRef = useRef(false)
  const previousTurnTimeLeftRef = useRef(null)

  // Player identification
  const isCreator = gameData?.creator === address
  const isJoiner = gameData?.joiner === address
  const isPlayer = isCreator || isJoiner
  const isMyTurn = gameState?.currentPlayer === address

  // Add state for popup
  const [showResultPopup, setShowResultPopup] = useState(false)
  const [popupData, setPopupData] = useState(null)

  // Add new state for enhanced NFT data
  const [nftData, setNftData] = useState(null)
  const [isLoadingNFT, setIsLoadingNFT] = useState(false)

  // Add these state variables to your existing FlipGame component
  const [isNFTGame, setIsNFTGame] = useState(false)

  // Choice animation states
  const [showChoiceAnimation, setShowChoiceAnimation] = useState(false)
  const [choiceAnimationText, setChoiceAnimationText] = useState('')
  const [choiceAnimationColor, setChoiceAnimationColor] = useState('#00FF41')

  // Auto-flip animation state
  const [showAutoFlipAnimation, setShowAutoFlipAnimation] = useState(false)

  // NFT modal states (needed for NFT vs NFT games)
      // [CLEANUP] Removed showNFTOfferModal state - NFT offer logic now handled in Dashboard

  const videoRef = useRef(null);
  const [videoError, setVideoError] = useState(false);

  // Add screen size detection
  const [isMobileScreen, setIsMobileScreen] = useState(false)
  const [screenSizeDetermined, setScreenSizeDetermined] = useState(false)
  
  // Add missing isInfoOpen state
  const [isInfoOpen, setIsInfoOpen] = useState(false)
  
  // Add missing isChatOpen state
  const [isChatOpen, setIsChatOpen] = useState(false)

  // Session-based authentication state
  const { signMessageAsync } = useSignMessage()
  const [sessionEstablished, setSessionEstablished] = useState(false)
  const [isAuthenticating, setIsAuthenticating] = useState(false)

  // Animation handlers
  const showChoiceAnimationEffect = (text, color = '#00FF41') => {
    setChoiceAnimationText(text.toUpperCase())
    setChoiceAnimationColor(color)
    setShowChoiceAnimation(true)
    
    setTimeout(() => setShowChoiceAnimation(false), 1000)
  }

  const showAutoFlipEffect = () => {
    setShowAutoFlipAnimation(true)
    setTimeout(() => setShowAutoFlipAnimation(false), 2000)
  }

  // Async action wrapper
  const handleAsyncAction = async (action, errorMessage = 'Operation failed') => {
    try {
      return await action()
    } catch (error) {
      console.error('❌ Error:', error)
      showError(error.message || errorMessage)
      throw error
    }
  }

  // [CLEANUP] Removed getJoinButtonState - join logic now handled in Dashboard

  // WebSocket message handlers
  const handleGameStateUpdate = (data) => {
    // Show opponent's choice animation if needed
    if (data.phase === 'round_active') {
      const opponentChoice = isCreator ? data.joinerChoice : data.creatorChoice
      if (opponentChoice) {
        const mySide = opponentChoice === 'heads' ? 'tails' : 'heads'
        showChoiceAnimationEffect(mySide, '#FF1493')
      }
    }
  }

  const handlePlayerJoined = (data) => {
    showSuccess(`${data.joinerName || 'Player'} joined the game!`)
    
    // Immediately update game data to show joined status
    setGameData(prev => ({
      ...prev,
      status: 'joined',
      joiner: data.joiner || data.address,
      joiner_address: data.joiner || data.address
    }))
    
    // Also refresh from contract to get latest data
    loadGame()
  }

  const handleFlipResult = (data) => {
    setRoundResult(data)
    setLastFlipResult(data.result)
    setFlipAnimation(null)
    setTimeout(() => setRoundResult(null), 4000)
    
    if (data.isGameComplete) {
      setShowResultPopup(true)
    }
  }

  const handleGameCompleted = async (data) => {
    console.log('🏆 Game completed! Winner:', data.winner)
    
    // Only complete on blockchain if we have a contract game ID
    if (gameData?.contract_game_id && data.winner) {
      try {
        const result = await contractService.completeGame(
          gameData.contract_game_id,
          data.winner
        )
        
        if (result.success) {
          showSuccess('Game completed on blockchain! Winner can now withdraw rewards.')
        }
      } catch (error) {
        console.error('Failed to complete game on blockchain:', error)
        showError('Game finished but failed to record on blockchain. Contact support.')
      }
    }
    
    setGameData(prev => ({
      ...prev,
      status: 'completed',
      winner: data.winner
    }))
    setShowResultPopup(true)
  }

  const handleOpponentChoice = (data) => {
    const opponentChoice = data.choice
    const mySide = opponentChoice === 'heads' ? 'tails' : 'heads'
    showChoiceAnimationEffect(mySide, '#FF1493')
  }

  // Video background component
  const VideoBackground = () => (
    <BackgroundVideo 
      ref={videoRef}
      autoPlay 
      loop 
      muted 
      playsInline
      preload="auto"
      onError={() => setVideoError(true)}
      onLoadedMetadata={(e) => {
        const duration = e.target.duration;
        // Video duration detected, could be used for refresh timing
        if (duration > 0) {
          // Convert seconds to milliseconds and add a small buffer
          const refreshInterval = Math.floor(duration * 1000) + 1000;
          // Could set reconnection timer to match video duration
        }
      }}
      style={{
        willChange: 'auto',
        contain: 'layout style paint'
      }}
    >
      <source src={isMobileScreen ? mobileVideo : hazeVideo} type="video/webm" />
    </BackgroundVideo>
  )

  // Update coin images when game state changes (use creator's selected coin ONLY)
  useEffect(() => {
    if (gameState?.coin) {
      setGameCoin(gameState.coin);
      
      // ALWAYS use the game's selected coin, regardless of type
      setCustomHeadsImage(gameState.coin.headsImage);
      setCustomTailsImage(gameState.coin.tailsImage);
    } else {
      // NO FALLBACK TO PERSONAL COINS - game must specify coin
      setCustomHeadsImage(null);
      setCustomTailsImage(null);
    }
  }, [gameState?.coin]);

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      const playVideo = async () => {
        try {
          await video.play();
        } catch (err) {
          console.error('Video play error:', err);
          setVideoError(true);
        }
      };
      playVideo();
    }
  }, []);

  // Add useEffect to detect screen size
  useEffect(() => {
    const checkScreenSize = () => {
      const newIsMobile = window.innerWidth <= 768
      setIsMobileScreen(newIsMobile)
      setScreenSizeDetermined(true)
    }

    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])

  // Single contract initialization
  useEffect(() => {
    if (!isFullyConnected || !walletClient) return
    
    const initContract = async () => {
      try {
        const chainId = 8453 // Base network
        await contractService.initializeClients(chainId, walletClient)
        console.log('✅ Contract service initialized')
      } catch (error) {
        console.error('❌ Contract initialization failed:', error)
      }
    }
    
    initContract()
  }, [isFullyConnected, walletClient])

  // WebSocket connection with better organization
  useEffect(() => {
    if (!gameId || !address) return

    let ws = null
    let reconnectTimer = null
    let reconnectAttempts = 0
    const maxReconnectAttempts = 5

    const createWebSocket = async () => {
      const wsUrl = 'wss://cryptoflipz2-production.up.railway.app'
      console.log('🔌 Connecting to WebSocket:', wsUrl)
      
      const websocket = new WebSocket(wsUrl)
      
      websocket.onopen = async () => {
        console.log('✅ WebSocket connected')
        setConnected(true)
        setSocket(websocket)
        reconnectAttempts = 0
        
        // Authenticate session
        if (!sessionEstablished && address) {
          setIsAuthenticating(true)
          try {
            const timestamp = Date.now()
            const message = `Join Flip Game #${gameId} at ${timestamp}`
            
            console.log('🔐 Signing authentication message...')
            const signature = await signMessageAsync({ message })
            
            websocket.send(JSON.stringify({
              type: 'authenticate_session',
              gameId,
              address,
              signature,
              timestamp
            }))
          } catch (error) {
            console.error('❌ Failed to sign message:', error)
            showError('Failed to authenticate. Please try again.')
            setIsAuthenticating(false)
          }
        }
      }

      websocket.onmessage = handleWebSocketMessage
      
      websocket.onclose = (event) => {
        console.log('🔌 WebSocket closed:', event.code, event.reason)
        setConnected(false)
        setSocket(null)
        setSessionEstablished(false)
        
        if (reconnectAttempts < maxReconnectAttempts) {
          reconnectAttempts++
          const backoffDelay = Math.min(5000 * Math.pow(2, reconnectAttempts - 1), 30000)
          console.log(`🔄 Reconnecting in ${backoffDelay}ms...`)
          reconnectTimer = setTimeout(createWebSocket, backoffDelay)
        } else {
          setError('Connection lost. Please refresh the page.')
        }
      }

      websocket.onerror = (error) => {
        console.error('❌ WebSocket error:', error)
      }

      return websocket
    }

    // Extract message handler to separate function
    const handleWebSocketMessage = async (event) => {
      try {
        const data = JSON.parse(event.data)
        
        // Handle authentication response
        if (data.type === 'session_established') {
          console.log('✅ Session authenticated!')
          setSessionEstablished(true)
          setIsAuthenticating(false)
          showSuccess('Connected to game!')
          return
        }
        
        if (data.type === 'auth_failed') {
          console.error('❌ Authentication failed:', data.error)
          setIsAuthenticating(false)
          showError(data.error || 'Authentication failed')
          return
        }
        
        // Only process other messages if authenticated
        if (!sessionEstablished && data.type !== 'session_established') {
          console.warn('⚠️ Received message before authentication:', data.type)
          return
        }
        
        // Handle game messages
        switch (data.type) {
          case 'game_state':
            console.log('🎮 Received game state:', data)
            setGameState(data)
            break
            
          case 'player_choice_made':
            if (data.isCreator) {
              setGameState(prev => ({ ...prev, creatorChoice: data.choice }))
            } else {
              setGameState(prev => ({ ...prev, joinerChoice: data.choice }))
            }
            
            // Show opponent's choice animation
            if (data.player !== address) {
              const mySide = data.choice === 'heads' ? 'tails' : 'heads'
              showChoiceAnimationEffect(mySide, '#FF1493')
            }
            break
            
          case 'both_players_ready':
            setGameState(prev => ({
              ...prev,
              phase: 'round_active',
              bothChosen: true,
              creatorChoice: data.creatorChoice,
              joinerChoice: data.joinerChoice
            }))
            showInfo('Both players ready! Charge your power!')
            break
            
          case 'round_result':
            handleFlipResult(data)
            break
            
          case 'game_completed':
            handleGameCompleted(data)
            break
            
          case 'player_connected':
            if (data.address !== address) {
              showInfo(`Opponent connected`)
            }
            break
            
          case 'player_disconnected':
            if (data.address !== address) {
              showWarning(`Opponent disconnected`)
            }
            break
            
          case 'chat_message':
            // Handle in chat component
            break
            
          case 'timer_update':
            console.log('⏰ Timer update:', data.turnTimeLeft)
            setGameState(prev => ({
              ...prev,
              turnTimeLeft: data.turnTimeLeft
            }))
            break
            
          case 'game_info':
            // Handle game info updates
            console.log('📊 Game info update:', data)
            if (data.game) {
              setGameData(data.game)
            }
            break
            
          case 'join_state_update':
            // Handle join state updates
            console.log('👥 Join state update:', data)
            if (data.game) {
              setGameData(data.game)
              // Only trigger background poll for status changes, not for active games
              if (data.game.status === 'active' || data.game.status === 'joined') {
                // Only poll if we don't have game data yet or status changed
                if (!gameData || gameData.status !== data.game.status) {
                  pollGameData(false) // Background poll without page refresh
                }
              }
            }
            break
            
          case 'flip_animation':
            setFlipAnimation(data)
            setRoundResult(null)
            break
            
          case 'player_joined':
            handlePlayerJoined(data)
            break
            
          case 'opponent_choice':
            handleOpponentChoice(data)
            break
            
          case 'charging_started':
            console.log('⚡ Charging started:', data)
            // Update game state to show charging
            setGameState(prev => ({
              ...prev,
              chargingPlayer: data.player,
              phase: 'round_active'
            }))
            break
            
          case 'charging_stopped':
            console.log('🪙 Charging stopped:', data)
            // Update game state to show flip result
            setGameState(prev => ({
              ...prev,
              chargingPlayer: null
            }))
            break
            
          case 'error':
            showError(data.error)
            break
            
          default:
            console.log('Unknown message type:', data.type)
        }
      } catch (error) {
        console.error('❌ Error parsing WebSocket message:', error)
      }
    }

    ws = createWebSocket()

    return () => {
      if (reconnectTimer) clearTimeout(reconnectTimer)
      if (ws && ws.readyState === WebSocket.OPEN) ws.close()
    }
  }, [gameId, address])

  // Add debounce for game state updates to prevent spam
  const [lastGameStateUpdate, setLastGameStateUpdate] = useState(0)
  const GAME_STATE_DEBOUNCE_MS = 2000 // Increased to 2 seconds debounce
  const [lastGameStateHash, setLastGameStateHash] = useState('')

  // Auto-flip detection with debounced game state updates
  useEffect(() => {
    if (!gameState) return
    
    const currentTurnTimeLeft = gameState.turnTimeLeft
    const previousTurnTimeLeft = previousTurnTimeLeftRef.current
    
    // Detect auto-flip: timer went from positive number to 0 or undefined
    if (previousTurnTimeLeft !== null && 
        previousTurnTimeLeft > 0 && 
        (currentTurnTimeLeft === 0 || currentTurnTimeLeft === undefined) &&
        gameState.phase === 'round_active') {
      
      showAutoFlipEffect()
    }
    
    // Update the ref with current value
    previousTurnTimeLeftRef.current = currentTurnTimeLeft
  }, [gameState?.turnTimeLeft, gameState?.phase])

  // Debounced game state update handler with content comparison
  const debouncedGameStateUpdate = useCallback((data) => {
    const now = Date.now()
    
    // Create a simple hash of the game state to detect actual changes
    const stateHash = JSON.stringify({
      phase: data.phase,
      currentPlayer: data.currentPlayer,
      creatorChoice: data.creatorChoice,
      joinerChoice: data.joinerChoice,
      creatorPower: data.creatorPower,
      joinerPower: data.joinerPower,
      turnTimeLeft: data.turnTimeLeft,
      chargingPlayer: data.chargingPlayer
    })
    
    // Skip if too soon OR if the state hasn't actually changed
    if (now - lastGameStateUpdate < GAME_STATE_DEBOUNCE_MS || stateHash === lastGameStateHash) {
      return
    }
    
    setLastGameStateUpdate(now)
    setLastGameStateHash(stateHash)
    handleGameStateUpdate(data)
  }, [lastGameStateUpdate, lastGameStateHash])

  // Load game data from database
  // Load game from contract
  const loadGameFromContract = async () => {
    try {
      const result = await contractService.getGameDetails(gameId)
      
      if (!result.success) {
        console.warn('Failed to load from contract:', result.error)
        return null
      }

      // Transform contract data to match your UI format
      const { game, payment } = result.data
      
      // Extract coin info from the new contract structure
      let coinData = null
      if (game.coinInfo) {
        coinData = {
          type: game.coinInfo.coinType || 'default',
          headsImage: game.coinInfo.headsImage || '/coins/plainh.png',
          tailsImage: game.coinInfo.tailsImage || '/coins/plaint.png',
          isCustom: game.coinInfo.isCustom || false
        }
      }
      
      return {
        id: gameId,
        creator: game.creator,
        joiner: game.joiner,
        nft: {
          contractAddress: game.nftContract,
          tokenId: game.tokenId.toString(),
          name: 'NFT', // Will be filled from database
          image: '/placeholder-nft.png', // Use a real placeholder image
          collection: 'Collection',
          chain: 'base'
        },
        price: Number(payment.priceUSD) / 1000000, // Convert from 6 decimals
        priceUSD: Number(payment.priceUSD) / 1000000,
        rounds: 5, // Best of 5 rounds
        status: getGameStatusFromContract(game),
        current_round: game.currentRound,
        max_rounds: 5,
        creator_wins: game.creatorWins,
        joiner_wins: game.joinerWins,
        winner: game.winner,
        contract_game_id: gameId,
        coin: coinData // Use extracted coin data
      }
    } catch (error) {
      console.error('Error loading from contract:', error)
      return null
    }
  }

  // Helper to determine game status
  const getGameStatusFromContract = (game) => {
    if (game.state === 0) return 'waiting' // CREATED state
    if (game.state === 1) return 'joined' // JOINED state - joiner has joined but game hasn't started
    if (game.state === 2) return 'active' // ACTIVE state - game is being played
    if (game.state === 3) return 'completed' // COMPLETED state
    if (game.state === 4) return 'cancelled' // CANCELLED state
    return 'waiting'
  }

  // Add helper function to update database
  const updateGameInDatabase = async (updates) => {
    try {
      const API_URL = 'https://cryptoflipz2-production.up.railway.app'
      
      const response = await fetch(`${API_URL}/api/games/${gameId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      })
      
      if (!response.ok) {
        console.warn('Failed to update game in database')
      }
    } catch (error) {
      console.error('Error updating database:', error)
    }
  }

  // Background polling function that updates data without page refresh
  const pollGameData = async (showLoading = false) => {
    try {
      if (showLoading) {
        setLoading(true)
        setError('')
      }
      
      // First, try to load from contract to get the latest state
      let contractGameData = null
      try {
        contractGameData = await loadGameFromContract()
        if (!showLoading) {
          console.log('📋 Contract game data (background):', contractGameData)
        }
      } catch (contractError) {
        console.warn('Could not load from contract:', contractError)
      }
      
      // Then load from database
      const API_URL = 'https://cryptoflipz2-production.up.railway.app'
      const response = await fetch(`${API_URL}/api/games/${gameId}`)
      
      if (!response.ok) {
        throw new Error('Game not found')
      }
      
      const dbGameData = await response.json()
      
      // Parse coin data if it's a string
      if (dbGameData.coin && typeof dbGameData.coin === 'string') {
        try {
          dbGameData.coin = JSON.parse(dbGameData.coin)
        } catch (e) {
          console.warn('Could not parse coin data:', e)
        }
      }
      
      // Merge contract data with database data
      let finalGameData = { ...dbGameData }
      
      if (contractGameData) {
        // Update with contract state
        finalGameData.status = contractGameData.status
        finalGameData.creator = contractGameData.creator
        finalGameData.joiner = contractGameData.joiner
        finalGameData.current_round = contractGameData.current_round
        finalGameData.creator_wins = contractGameData.creator_wins
        finalGameData.joiner_wins = contractGameData.joiner_wins
        finalGameData.winner = contractGameData.winner
        finalGameData.contract_game_id = contractGameData.contract_game_id
        
        // Use contract coin data if available
        if (contractGameData.coin) {
          finalGameData.coin = contractGameData.coin
        }
        
        if (!showLoading) {
          console.log('🔄 Background sync:', {
            status: finalGameData.status,
            joiner: finalGameData.joiner,
            current_round: finalGameData.current_round
          })
        }
      }
      
      setGameData(finalGameData)
      
      // Set NFT data directly from database
      setNftData({
        contractAddress: finalGameData.nft_contract,
        tokenId: finalGameData.nft_token_id,
        name: finalGameData.nft_name,
        image: finalGameData.nft_image,
        collection: finalGameData.nft_collection,
        chain: finalGameData.nft_chain
      })
      
    } catch (err) {
      console.error('❌ Error polling game data:', err)
      if (showLoading) {
        setError(err.message)
      }
    } finally {
      if (showLoading) {
        setLoading(false)
      }
    }
  }

  // Initial load function (with loading state)
  const loadGame = async () => {
    console.log('🔄 Initial loadGame called at:', new Date().toLocaleTimeString())
    await pollGameData(true) // Show loading state for initial load
  }

  useEffect(() => {
    loadGame()
    
    // Set up background polling to keep game state in sync (no page refresh)
    const refreshInterval = setInterval(() => {
      if (gameData && (gameData.status === 'waiting' || gameData.status === 'joined')) {
        // Background poll without page refresh
        pollGameData(false)
      }
    }, 15000) // Poll every 15 seconds for waiting/joined games
    
    return () => {
      clearInterval(refreshInterval)
    }
  }, [gameId])

  // Auto-start game when it's in 'joined' status (only for game creator)
  const [hasAutoStarted, setHasAutoStarted] = useState(false)
  
  // Reset auto-start flag when game status changes from 'joined'
  useEffect(() => {
    if (gameData?.status !== 'joined') {
      setHasAutoStarted(false)
    }
  }, [gameData?.status])
  
  // Debug logging for auto-start conditions
  useEffect(() => {
    console.log('🔍 Auto-start conditions check:', {
      gameStatus: gameData?.status,
      contractGameId: gameData?.contract_game_id,
      contractInitialized: contractService.isInitialized(),
      isCreator: gameData?.creator === address,
      hasAutoStarted,
      socketAvailable: !!socket,
      socketReady: socket?.readyState === WebSocket.OPEN
    })
  }, [gameData?.status, gameData?.contract_game_id, gameData?.creator, address, hasAutoStarted, socket])
  
  // Polling mechanism to keep game state synchronized (especially for creator)
  useEffect(() => {
    if (!gameData?.contract_game_id || !contractService.isInitialized()) return
    
    // Background contract polling (no page refresh)
    const pollInterval = setInterval(async () => {
      try {
        const contractGameData = await loadGameFromContract()
        if (contractGameData) {
          // Update only the contract-specific fields without triggering full refresh
          setGameData(prev => ({
            ...prev,
            status: contractGameData.status,
            joiner: contractGameData.joiner,
            current_round: contractGameData.current_round,
            creator_wins: contractGameData.creator_wins,
            joiner_wins: contractGameData.joiner_wins,
            winner: contractGameData.winner
          }))
          console.log('📊 Background contract update:', contractGameData.status)
        }
      } catch (error) {
        console.warn('Contract polling error:', error)
      }
    }, 10000) // Poll every 10 seconds
    
    return () => clearInterval(pollInterval)
  }, [gameData?.contract_game_id, contractService.isInitialized])
  
  // Note: Game flow is now handled by the server via WebSocket
  // No need for blockchain auto-start since server manages the game state

  // Initialize WebSocket game state when contract state is 'active' but no WebSocket state exists
  useEffect(() => {
    if (gameData?.status === 'active' && !gameState && socket) {
      console.log('🎮 Initializing WebSocket game state for active game...')
      
      // Create a basic game state to enable UI interactions
      const initialGameState = {
        phase: 'choosing',
        currentPlayer: address,
        isMyTurn: true,
        creatorChoice: null,
        joinerChoice: null,
        creatorPower: 0,
        joinerPower: 0,
        turnTimeLeft: 30,
        coin: gameData.coin
      }
      
      setGameState(initialGameState)
      console.log('✅ WebSocket game state initialized:', initialGameState)
    }
  }, [gameData?.status, gameState, socket, address, gameData?.coin])

  // Single NFT data manager
  useEffect(() => {
    if (!gameData) return

    const nftInfo = {
      contractAddress: gameData.nft_contract || gameData.nft?.contractAddress,
      tokenId: gameData.nft_token_id || gameData.nft?.tokenId,
      name: gameData.nft_name || gameData.nft?.name || 'Unknown NFT',
      image: gameData.nft_image || gameData.nft?.image,
      collection: gameData.nft_collection || gameData.nft?.collection || 'Unknown Collection',
      chain: gameData.nft_chain || gameData.nft?.chain || 'base',
      metadata: {
        description: gameData.nft?.description || '',
        attributes: gameData.nft?.attributes || []
      }
    }

    setNftData(nftInfo)
  }, [gameData, gameId])

  // Single coin data manager
  useEffect(() => {
    if (gameData?.coin) {
      setGameCoin(gameData.coin)
      
      // Handle both preset and custom coin images
      let headsImage = gameData.coin.headsImage
      let tailsImage = gameData.coin.tailsImage
      
      // For custom coins, use the actual image data if available
      if (gameData.coin.isCustom) {
        if (gameData.coin.actualHeadsImage) {
          headsImage = gameData.coin.actualHeadsImage
        }
        if (gameData.coin.actualTailsImage) {
          tailsImage = gameData.coin.actualTailsImage
        }
      }
      
      // If it's a custom coin (base64 data URL), use it directly
      // If it's a preset coin (file path), use it as is
      setCustomHeadsImage(headsImage)
      setCustomTailsImage(tailsImage)
      
      console.log('🪙 Coin data loaded:', {
        type: gameData.coin.type,
        isCustom: gameData.coin.isCustom,
        headsImage: headsImage?.substring(0, 50) + '...',
        tailsImage: tailsImage?.substring(0, 50) + '...',
        hasActualHeads: !!gameData.coin.actualHeadsImage,
        hasActualTails: !!gameData.coin.actualTailsImage
      })
    }
  }, [gameData?.coin])



  // Update power charging - also no signature needed
  const handlePowerChargeStart = useCallback(() => {
    if (!socket || !sessionEstablished) return
    if (!gameState?.bothChosen) {
      showError('Wait for both players to choose!')
      return
    }
    
    isChargingRef.current = true
    
    socket.send(JSON.stringify({
      type: 'start_charging'
    }))
  }, [socket, sessionEstablished, gameState?.bothChosen])

  const handlePowerChargeStop = useCallback(async () => {
    if (!socket || !isChargingRef.current) return
    
    isChargingRef.current = false
    
    // For the actual flip, we'll use the contract
    if (gameData?.contract_game_id && contractService.isInitialized()) {
      try {
        showInfo('Flipping coin on blockchain...')
        
        const result = await contractService.playRound(gameData.contract_game_id)
        
        if (!result.success) {
          throw new Error(result.error)
        }
        
        showSuccess(`Round ${result.round} completed!`)
        
        // Server will detect the blockchain event and update game state
      } catch (error) {
        console.error('❌ Blockchain flip failed:', error)
        showError('Failed to flip: ' + error.message)
        
        // Fallback to server flip
        socket.send(JSON.stringify({
          type: 'stop_charging'
        }))
      }
    } else {
      // No contract, use server
      socket.send(JSON.stringify({
        type: 'stop_charging'
      }))
    }
  }, [socket, gameData?.contract_game_id])

  // Update the player choice handler - NO SIGNATURE NEEDED
  const handlePlayerChoice = (choice) => {
    if (!socket || !sessionEstablished) {
      showError('Not connected to game')
      return
    }
    
    if (gameState?.phase !== 'choosing') {
      showError('Not in choosing phase')
      return
    }
    
    // Instant feedback
    showChoiceAnimationEffect(choice.toUpperCase(), '#00FF41')
    
    // Send to server - no signature required!
    socket.send(JSON.stringify({
      type: 'player_choice',
      choice
    }))
    
    // Optimistic update
    if (isCreator) {
      setGameState(prev => ({ ...prev, creatorChoice: choice }))
    } else {
      setGameState(prev => ({ ...prev, joinerChoice: choice }))
    }
  }

  const handleFlip = async () => {
    if (!canFlip) return
    
    try {
      setIsFlipping(true)
      
      // Call contract to play round
      const result = await contractService.playRound(gameData.contract_game_id)
      
      if (!result.success) {
        throw new Error(result.error)
      }
      
      // Show flip animation
      setFlipAnimation({
        id: Date.now(),
        result: result.result === 0 ? 'heads' : 'tails'
      })
      
      // Reload game state
      setTimeout(async () => {
        await loadGame()
        setIsFlipping(false)
      }, 3000)
      
    } catch (error) {
      console.error('Failed to flip:', error)
      showError('Failed to play round')
      setIsFlipping(false)
    }
  }

  // Update the canFlip logic
  const canFlip = gameData && 
    (gameData.status === 'joined' || gameData.status === 'active') &&
    (address === gameData.creator || address === gameData.joiner) &&
    !isFlipping



  // [CLEANUP] Removed handleJoinGame - join logic now handled in Dashboard

  // Add handleClaimWinnings function
  const handleClaimWinnings = async () => {
    if (!isFullyConnected || !address) {
      showError('Please connect your wallet to withdraw')
      return
    }

    try {
      showInfo('Checking for unclaimed rewards...')
      
      // First check if there are any unclaimed rewards
      const unclaimedResult = await contractService.getUnclaimedRewards(address)
      
      if (!unclaimedResult.success) {
        throw new Error('Failed to check rewards: ' + unclaimedResult.error)
      }
      
      const { eth, usdc } = unclaimedResult
      const hasRewards = eth > 0 || usdc > 0
      
      if (!hasRewards) {
        showError('No rewards to claim. Make sure the game is completed and you are the winner.')
        return
      }
      
      showInfo('Processing withdrawal...')
      
      const result = await contractService.withdrawRewards()
      
      if (!result.success) {
        throw new Error('Failed to withdraw: ' + result.error)
      }

      showSuccess('Winnings withdrawn successfully! 🎉')

            // Also withdraw NFT if this was the winner
      if (gameData?.nft_contract && gameData?.token_id) {
        const nftResult = await contractService.withdrawNFT(
          gameData.nft_contract,
          gameData.token_id
        )
        
        if (nftResult.success) {
          showSuccess('NFT returned to your wallet!')
        }
      }
    } catch (error) {
      console.error('❌ Error withdrawing:', error)
      showError('Failed to withdraw: ' + error.message)
    }
  }

  // Add handleCompleteGame function
  const handleCompleteGame = async () => {
    if (!isFullyConnected || !address) {
      showError('Please connect your wallet to complete the game')
      return
    }

    // Check if we have a winner from the server
    if (!gameState?.winner) {
      showError('No winner determined yet. Please wait for the game to complete.')
      return
    }

    try {
      showInfo('Completing game on blockchain...')
      
      const result = await contractService.completeGame(gameData.contract_game_id, gameState.winner)
      
      if (!result.success) {
        throw new Error('Failed to complete game: ' + result.error)
      }

      showSuccess('Game completed successfully! You can now withdraw your winnings.')
      
      // Reload game data
      setTimeout(() => {
        loadGame()
      }, 2000)
      
    } catch (error) {
      console.error('❌ Error completing game:', error)
      showError('Failed to complete game: ' + error.message)
    }
  }

  // Add effect to show popup when game is complete
  useEffect(() => {
    if (gameState?.phase === 'game_complete') {
      const isWinner = gameState.winner === address
      setPopupData({
        isWinner,
        flipResult: null, // No specific flip result for game end
        playerChoice: null, // No specific choice for game end
        gameData,
        finalScore: {
          creatorWins: gameState.creatorWins,
          joinerWins: gameState.joinerWins
        }
      })
      setShowResultPopup(true)
    }
  }, [gameState?.phase, gameState?.winner, address, gameData])

  // Debug effect to monitor game state changes
  useEffect(() => {
    if (gameState) {
      console.log('🎮 Game state updated:', {
        phase: gameState.phase,
        currentPlayer: gameState.currentPlayer,
        creator: gameState.creator,
        joiner: gameState.joiner,
        currentRound: gameState.currentRound,
        creatorWins: gameState.creatorWins,
        joinerWins: gameState.joinerWins,
        isFlipInProgress: gameState.isFlipInProgress,
        turnTimeLeft: gameState.turnTimeLeft
      })
    }
  }, [gameState])

  const handleShare = (platform) => {
    const shareText = `Join my game of Crypto Flipz! Game ID: ${gameId}`;
    const shareUrl = window.location.href;
    
    if (platform === 'x') {
      const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
      window.open(twitterUrl, '_blank');
    } else if (platform === 'telegram') {
      const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`;
      window.open(telegramUrl, '_blank');
    } else if (platform === 'copy') {
      navigator.clipboard.writeText(shareUrl);
      showInfo('Link copied to clipboard!');
    }
  };

  // Add this useEffect to detect NFT vs NFT games
  useEffect(() => {
    if (gameData) {
      setIsNFTGame(gameData.gameType === 'nft-vs-nft')
    }
  }, [gameData])



  // [CLEANUP] Removed handlePaymentForAcceptedOffer - NFT offer logic now handled in Dashboard

  // [CLEANUP] Removed handleOfferSubmitted and handleOfferAccepted - NFT offer logic now handled in Dashboard

  // [CLEANUP] Removed NFT vs NFT game detection useEffect - now handled in Dashboard

  // [CLEANUP] Removed handleNFTOffer - NFT offer logic now handled in Dashboard

  // [CLEANUP] Removed handleOfferResponse - NFT offer logic now handled in Dashboard

  // [CLEANUP] Removed NFT Modal Handlers - NFT offer logic now handled in Dashboard

  // [CLEANUP] Removed renderNFTOfferModal - NFT offer logic now handled in Dashboard

  // [CLEANUP] Removed renderNFTDetailsModal - NFT offer logic now handled in Dashboard

  // Single coin render function to prevent duplicates
  const renderCoin = useMemo(() => {
    if (!screenSizeDetermined) return null;
    
    // Generate unique render ID for debugging
    const renderId = Date.now() + Math.random();
    console.log('🪙 renderCoin called - ID:', renderId, 'isMobileScreen:', isMobileScreen, 'screenSizeDetermined:', screenSizeDetermined);
    
    // Allow coin to render even without gameState, but with default values
    const defaultGameState = {
      phase: 'waiting',
      currentPlayer: null,
      creatorChoice: null,
      joinerChoice: null,
      creatorPower: 0,
      joinerPower: 0,
      chargingPlayer: null
    };
    
    const effectiveGameState = gameState || defaultGameState;

    const coinProps = {
      isFlipping: !!flipAnimation,
      flipResult: flipAnimation ? flipAnimation.result : (roundResult?.result || lastFlipResult),
      flipDuration: flipAnimation?.duration,
      onPowerCharge: handlePowerChargeStart,
      onPowerRelease: handlePowerChargeStop,
      isPlayerTurn: isMyTurn,
      isCharging: effectiveGameState.chargingPlayer === address,
      chargingPlayer: effectiveGameState.chargingPlayer,
      creatorPower: effectiveGameState.creatorPower || 0,
      joinerPower: effectiveGameState.joinerPower || 0,
      creatorChoice: effectiveGameState.creatorChoice,
      joinerChoice: effectiveGameState.joinerChoice,
      isCreator: isCreator,
      customHeadsImage: customHeadsImage || gameCoin?.headsImage || '/coins/plainh.png',
      customTailsImage: customTailsImage || gameCoin?.tailsImage || '/coins/plaint.png'
    };

    // Use stable keys to prevent constant re-rendering
    const coinKey = `coin-${isMobileScreen ? 'mobile' : 'desktop'}-${gameId}-${renderId}`;

    if (isMobileScreen) {
      return (
        <MobileOptimizedCoin
          key={coinKey}
          {...coinProps}
          size={187}
        />
      );
    } else {
      return (
        <OptimizedGoldCoin
          key={coinKey}
          {...coinProps}
          gamePhase={effectiveGameState.phase}
          size={440}
        />
      );
    }
  }, [
    screenSizeDetermined,
    isMobileScreen,
    gameId,
    // Only re-render when these critical props actually change
    flipAnimation?.id, // Use ID instead of full object
    flipAnimation?.result,
    roundResult?.result,
    lastFlipResult,
    // Simplified game state dependencies - only re-render on major changes
    gameState?.phase,
    gameState?.currentPlayer,
    isCreator,
    // Only re-render when coin images actually change
    customHeadsImage,
    customTailsImage,
    gameCoin?.headsImage,
    gameCoin?.tailsImage
  ]);

  // [CLEANUP] Removed renderOfferReviewModal - NFT offer logic now handled in Dashboard

  // Add loading state while authenticating
  if (isAuthenticating) {
    return (
      <ThemeProvider theme={theme}>
        <Container>
          <ContentWrapper>
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              gap: '2rem',
              padding: '3rem' 
            }}>
              <LoadingSpinner />
              <div style={{ color: theme.colors.textPrimary }}>
                Authenticating session...
              </div>
              <div style={{ color: theme.colors.textSecondary, fontSize: '0.875rem' }}>
                Please sign the message in your wallet
              </div>
            </div>
          </ContentWrapper>
        </Container>
      </ThemeProvider>
    )
  }

  if (!isFullyConnected) {
    return (
      <ThemeProvider theme={theme}>
        <Container>
          <ContentWrapper>
            <GlassCard style={{ textAlign: 'center', padding: '3rem' }}>
              <NeonText>Connect Your Wallet</NeonText>
              {connectionError && (
                <p style={{ color: '#FF6B6B', marginTop: '1rem' }}>{connectionError}</p>
              )}
              <Button onClick={() => navigate('/')} style={{ marginTop: '1rem' }}>Go Home</Button>
            </GlassCard>
          </ContentWrapper>
        </Container>
      </ThemeProvider>
    )
  }

  if (loading) {
    return (
      <ThemeProvider theme={theme}>
        <Container>
          <ContentWrapper>
            <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
              <LoadingSpinner />
            </div>
          </ContentWrapper>
        </Container>
      </ThemeProvider>
    )
  }

  // REMOVED: canJoin variable - now using getJoinButtonState() for enhanced logic

  return (
    <ThemeProvider theme={theme}>
      <VideoBackground />
      
      {/* Add the choice animation component */}
      {showChoiceAnimation && (
        <ChoiceAnimation color={choiceAnimationColor} isMobile={isMobileScreen}>
          {choiceAnimationText}
        </ChoiceAnimation>
      )}

      {/* Add the auto-flip animation component */}
      {showAutoFlipAnimation && (
        <AutoFlipAnimation isMobile={isMobileScreen}>
          FINAL ROUND<br />AUTOFLIP
        </AutoFlipAnimation>
      )}

      <Container style={{ 
        position: 'relative', 
        minHeight: '100vh',
        background: 'transparent !important',
        zIndex: 1
      }}>
        <ContentWrapper>
          {/* Layout - Mobile or Desktop */}
          {screenSizeDetermined && (
            isMobileScreen ? (
              (() => {
                return (
                  <MobileOnlyLayout>

              {/* Mobile Bottom Navigation */}
              <MobileBottomNav>
                <MobileNavButton onClick={() => setIsInfoOpen(!isInfoOpen)}>
                  <span>ℹ️</span> Info
                </MobileNavButton>
                <MobileNavButton onClick={() => setIsChatOpen(!isChatOpen)}>
                  <span>💬</span> Chat
                </MobileNavButton>
                {/* [CLEANUP] Removed join button - join logic now handled in Dashboard */}
              </MobileBottomNav>

              {/* Mobile Info Panel */}
              <MobileInfoPanel isOpen={isInfoOpen}>
                <div style={{ marginBottom: '0.5rem' }}>
                  <h3 style={{ color: theme.colors.neonYellow, marginBottom: '0.25rem', fontSize: '1rem' }}>Game Info</h3>
                  <div style={{ color: theme.colors.textSecondary }}>
                    {/* Entry Fee */}
                    <div style={{ 
                      padding: '0.5rem',
                      background: 'rgba(255, 255, 255, 0.05)',
                      borderRadius: '0.5rem',
                      marginBottom: '0.5rem'
                    }}>
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <span style={{ fontSize: '0.875rem' }}>Cost:</span>
                        <span style={{ 
                          color: theme.colors.neonGreen,
                          fontWeight: 'bold',
                          fontSize: '0.875rem'
                        }}>
                          ${(gameData?.priceUSD || 0).toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* Contract Info */}
                    <div style={{ 
                      padding: '0.5rem',
                      background: 'rgba(255, 255, 255, 0.05)',
                      borderRadius: '0.5rem',
                      marginBottom: '0.5rem'
                    }}>
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <span style={{ fontSize: '0.875rem' }}>Contract:</span>
                        <span 
                          onClick={() => {
                            if (gameData?.nft?.contractAddress) {
                              navigator.clipboard.writeText(gameData.nft.contractAddress);
                              showSuccess('Contract address copied to clipboard!');
                            }
                          }}
                          style={{ 
                            color: theme.colors.textPrimary,
                            fontFamily: 'monospace',
                            fontSize: '0.8rem',
                            cursor: 'pointer',
                            padding: '0.25rem 0.5rem',
                            background: 'rgba(0, 0, 0, 0.3)',
                            borderRadius: '0.25rem',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.background = 'rgba(0, 0, 0, 0.4)';
                            e.currentTarget.style.border = '1px solid rgba(255, 255, 255, 0.2)';
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.background = 'rgba(0, 0, 0, 0.3)';
                            e.currentTarget.style.border = 'none';
                          }}
                        >
                          {gameData?.nft?.contractAddress ? 
                            `${gameData.nft.contractAddress.slice(0, 6)}...${gameData.nft.contractAddress.slice(-4)}` : 
                            'Unknown'
                          }
                        </span>
                      </div>
                    </div>

                    {/* NFT Info */}
                    {gameData?.nft && (
                      <>
                        <div style={{ 
                          margin: '0.5rem 0',
                          padding: '0.5rem',
                          background: 'rgba(255, 255, 255, 0.05)',
                          borderRadius: '0.5rem',
                          border: '1px solid rgba(255, 255, 255, 0.1)'
                        }}>
                          <img 
                            src={gameData.nft.image} 
                            alt={gameData.nft.name}
                            style={{
                              width: '100%',
                              maxWidth: '120px',
                              height: 'auto',
                              borderRadius: '0.25rem',
                              margin: '0 auto',
                              display: 'block'
                            }}
                          />
                          <p style={{ marginTop: '0.25rem', textAlign: 'center', fontSize: '0.8rem', margin: '0.25rem 0' }}>{gameData.nft.name}</p>
                          <p style={{ fontSize: '0.75rem', opacity: 0.8, margin: '0.125rem 0' }}>Collection: {gameData.nft.collection}</p>
                          <p style={{ fontSize: '0.75rem', opacity: 0.8, margin: '0.125rem 0' }}>Token ID: {gameData.nft.tokenId}</p>
                        </div>
                        <div style={{
                          display: 'flex',
                          gap: '0.25rem',
                          marginTop: '0.25rem',
                          justifyContent: 'center'
                        }}>
                          <Button 
                            onClick={() => window.open(`https://opensea.io/assets/${gameData.nft.contract}/${gameData.nft.tokenId}`, '_blank')}
                            style={{
                              background: 'rgba(255, 255, 255, 0.1)',
                              padding: '0.25rem 0.5rem',
                              borderRadius: '0.25rem',
                              fontSize: '0.7rem',
                              textDecoration: 'none',
                              color: '#fff',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                              border: '1px solid rgba(255, 255, 255, 0.2)',
                              transition: 'all 0.3s ease',
                              flex: 1,
                              justifyContent: 'center'
                            }}
                          >
                            <img 
                              src="/images/opensea.png" 
                              alt="OpenSea" 
                              style={{ 
                                width: '12px', 
                                height: '12px',
                                objectFit: 'contain'
                              }} 
                            />
                            OpenSea
                          </Button>
                          <Button 
                            onClick={() => window.open(`https://etherscan.io/token/${gameData.nft.contract}?a=${gameData.nft.tokenId}`, '_blank')}
                            style={{
                              background: 'rgba(255, 255, 255, 0.1)',
                              padding: '0.25rem 0.5rem',
                              borderRadius: '0.25rem',
                              fontSize: '0.7rem',
                              textDecoration: 'none',
                              color: '#fff',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                              border: '1px solid rgba(255, 255, 255, 0.2)',
                              transition: 'all 0.3s ease',
                              flex: 1,
                              justifyContent: 'center'
                            }}
                          >
                            <span style={{ fontSize: '0.8rem' }}>🔍</span>
                            Etherscan
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </MobileInfoPanel>

              {/* Mobile Chat Panel */}
              <MobileInfoPanel isOpen={isChatOpen}>
                <div style={{ marginBottom: '1rem' }}>
                  <h3 style={{ color: theme.colors.neonYellow, marginBottom: '0.5rem' }}>Game Chat</h3>
                  <GameChatBox 
                    gameId={gameId}
                    socket={socket}
                    connected={connected}
                    isMobile={true}
                  />
                </div>
              </MobileInfoPanel>

              {/* Player 1 Box - Profile Image */}
              <MobilePlayerBox style={{
                background: isCreator ? 'rgba(255, 20, 147, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                border: `2px solid ${isCreator ? '#FF1493' : 'rgba(255, 255, 255, 0.1)'}`,
                padding: '0.5rem',
                marginBottom: '0.5rem',
                borderRadius: '12px',
                height: '60px',
                width: '100%',
                animation: (isMyTurn && isCreator && (gameState?.phase === 'choosing' || gameState?.phase === 'round_active')) ? 
                  'playerTurnFlash 1.5s ease-in-out infinite' : 'none',
                transition: 'all 0.3s ease'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  {/* Profile Image */}
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: gameState?.creatorProfile?.profilePicture ? 
                      `url(${gameState.creatorProfile.profilePicture})` : 
                      'linear-gradient(45deg, #FF1493, #FF69B4)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '2px solid rgba(255, 255, 255, 0.3)',
                    fontSize: '1rem',
                    fontWeight: 'bold',
                    color: '#fff',
                    textShadow: '1px 1px 2px rgba(0,0,0,0.8)'
                  }}>
                    {!gameState?.creatorProfile?.profilePicture && 'P1'}
                  </div>
                  <div style={{ display: 'flex', gap: '0.25rem' }}>
                    {[1, 2, 3, 4, 5].map(round => {
                      const roundNumber = round;
                      const currentRound = gameState?.currentRound || 1;
                      
                      // Determine what happened in this round
                      let roundStatus = 'pending'; // pending, current, creator_won, joiner_won
                      
                      if (roundNumber < currentRound) {
                        // This round is completed - determine winner
                        const roundWinner = gameState?.roundResults?.[roundNumber - 1];
                        if (roundWinner === 'creator') {
                          roundStatus = 'creator_won';
                        } else if (roundWinner === 'joiner') {
                          roundStatus = 'joiner_won';
                        }
                      } else if (roundNumber === currentRound) {
                        roundStatus = 'current';
                      }
                      
                      const getBackgroundColor = () => {
                        switch (roundStatus) {
                          case 'current': return '#FFFF00'; // Yellow for current round
                          case 'creator_won': return '#00FF41'; // Green for creator win
                          case 'joiner_won': return '#FF1493'; // Pink for creator loss (joiner win)
                          default: return 'rgba(255, 255, 255, 0.1)'; // Gray for pending
                        }
                      };
                      
                      const getTextColor = () => {
                        switch (roundStatus) {
                          case 'current': return '#000';
                          case 'creator_won': return '#000';
                          case 'joiner_won': return '#000';
                          default: return '#666';
                        }
                      };
                      
                      return (
                        <div
                          key={`p1-round-${round}`}
                          style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            background: getBackgroundColor(),
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.7rem',
                            fontWeight: 'bold',
                            color: getTextColor(),
                            boxShadow: roundStatus === 'current' ? '0 0 10px #FFFF00' : 
                                     roundStatus === 'creator_won' ? '0 0 8px #00FF41' :
                                     roundStatus === 'joiner_won' ? '0 0 8px #FF1493' : 'none',
                            transition: 'all 0.3s ease',
                            transform: roundStatus === 'current' ? 'scale(1.1)' : 'scale(1)',
                            animation: roundStatus === 'current' ? 'pulse 2s infinite' : 'none'
                          }}
                        >
                          {round}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </MobilePlayerBox>

              {/* MOBILE COIN - Optimized 3D Version */}
              <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center',
                margin: '0.25rem auto',
                padding: '0.25rem',
                width: '100%',
                textAlign: 'center'
              }}>
                {isMobileScreen && renderCoin}
              </div>

              {/* Choice Display - Mobile */}
              {(() => {
                // Show choice when either player has made their choice
                const creatorChoice = gameState?.creatorChoice;
                const joinerChoice = gameState?.joinerChoice;
                
                if (creatorChoice || joinerChoice) {
                  // Determine what side this player is on
                  let mySide;
                  if (isCreator) {
                    mySide = creatorChoice;
                  } else if (isJoiner) {
                    mySide = joinerChoice;
                  }
                  
                  // If this player hasn't made their choice yet, show the opposite of the other player's choice
                  if (!mySide) {
                    if (isCreator && joinerChoice) {
                      mySide = joinerChoice === 'heads' ? 'tails' : 'heads';
                    } else if (isJoiner && creatorChoice) {
                      mySide = creatorChoice === 'heads' ? 'tails' : 'heads';
                    }
                  }
                  
                  return mySide ? (
                    <div style={{
                      textAlign: 'center',
                      marginBottom: '1rem',
                      padding: '0.5rem',
                      background: 'rgba(0, 255, 65, 0.1)',
                      border: '2px solid rgba(0, 255, 65, 0.3)',
                      borderRadius: '0.75rem',
                      animation: 'pulse 2s ease-in-out infinite'
                    }}>
                      <div style={{
                        fontSize: '1rem',
                        fontWeight: 'bold',
                        color: '#00FF41',
                        textShadow: '0 0 10px rgba(0, 255, 65, 0.5)'
                      }}>
                        You're {mySide.toUpperCase()}
                      </div>
                    </div>
                  ) : null;
                }
                return null;
              })()}

              {/* Player 2 Box - Profile Image */}
              <MobilePlayerBox style={{
                background: isJoiner ? 'rgba(0, 191, 255, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                border: `2px solid ${isJoiner ? '#00BFFF' : 'rgba(255, 255, 255, 0.1)'}`,
                padding: '0.5rem',
                marginBottom: '0.5rem',
                marginTop: '-15px',
                borderRadius: '12px',
                height: '60px',
                width: '100%',
                animation: (isMyTurn && isJoiner && (gameState?.phase === 'choosing' || gameState?.phase === 'round_active')) ? 
                  'playerTurnFlash 1.5s ease-in-out infinite' : 'none',
                transition: 'all 0.3s ease'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  {/* Profile Image */}
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: gameState?.joinerProfile?.profilePicture ? 
                      `url(${gameState.joinerProfile.profilePicture})` : 
                      'linear-gradient(45deg, #00BFFF, #87CEEB)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '2px solid rgba(255, 255, 255, 0.3)',
                    fontSize: '1rem',
                    fontWeight: 'bold',
                    color: '#fff',
                    textShadow: '1px 1px 2px rgba(0,0,0,0.8)'
                  }}>
                    {!gameState?.joinerProfile?.profilePicture && 'P2'}
                  </div>
                  <div style={{ display: 'flex', gap: '0.25rem' }}>
                    {[1, 2, 3, 4, 5].map(round => {
                      const roundNumber = round;
                      const currentRound = gameState?.currentRound || 1;
                      
                      // Determine what happened in this round
                      let roundStatus = 'pending'; // pending, current, creator_won, joiner_won
                      
                      if (roundNumber < currentRound) {
                        // This round is completed - determine winner
                        const roundWinner = gameState?.roundResults?.[roundNumber - 1];
                        if (roundWinner === 'creator') {
                          roundStatus = 'creator_won';
                        } else if (roundWinner === 'joiner') {
                          roundStatus = 'joiner_won';
                        }
                      } else if (roundNumber === currentRound) {
                        roundStatus = 'current';
                      }
                      
                      const getBackgroundColor = () => {
                        switch (roundStatus) {
                          case 'current': return '#FFFF00'; // Yellow for current round
                          case 'creator_won': return '#FF1493'; // Pink for joiner loss (creator win)
                          case 'joiner_won': return '#00FF41'; // Green for joiner win
                          default: return 'rgba(255, 255, 255, 0.1)'; // Gray for pending
                        }
                      };
                      
                      const getTextColor = () => {
                        switch (roundStatus) {
                          case 'current': return '#000';
                          case 'creator_won': return '#000';
                          case 'joiner_won': return '#000';
                          default: return '#666';
                        }
                      };
                      
                      return (
                        <div
                          key={`p2-round-${round}`}
                          style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            background: getBackgroundColor(),
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.7rem',
                            fontWeight: 'bold',
                            color: getTextColor(),
                            boxShadow: roundStatus === 'current' ? '0 0 10px #FFFF00' : 
                                     roundStatus === 'creator_won' ? '0 0 8px #FF1493' :
                                     roundStatus === 'joiner_won' ? '0 0 8px #00FF41' : 'none',
                            transition: 'all 0.3s ease',
                            transform: roundStatus === 'current' ? 'scale(1.1)' : 'scale(1)',
                            animation: roundStatus === 'current' ? 'pulse 2s infinite' : 'none'
                          }}
                        >
                          {round}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </MobilePlayerBox>

              {/* Mobile Power Display - Heads/Tails Choice */}
              <div style={{ 
                marginBottom: '1rem',
                padding: '0.5rem'
              }}>
                <PowerDisplay
                  creatorPower={gameState?.creatorPower || 0}
                  joinerPower={gameState?.joinerPower || 0}
                  currentPlayer={gameState?.currentPlayer}
                  creator={gameState?.creator}
                  joiner={gameState?.joiner}
                  chargingPlayer={gameState?.chargingPlayer}
                  gamePhase={gameState?.phase}
                  isMyTurn={isMyTurn}
                  playerChoice={isCreator ? gameState?.creatorChoice : gameState?.joinerChoice}
                  onChoiceSelect={handlePlayerChoice}
                />
              </div>

              {/* NFT Box */}
              <MobileHidden>
                <MobileNFTBox>
                  {gameData?.nftImage && (
                    <NFTImage src={gameData.nftImage} alt="NFT" />
                  )}
                  <NFTDetails>
                    <NFTDetailRow>
                      <NFTLabel>Collection:</NFTLabel>
                      <NFTValue>{gameData?.collectionName || 'Unknown'}</NFTValue>
                    </NFTDetailRow>
                    <NFTDetailRow>
                      <NFTLabel>Token ID:</NFTLabel>
                      <NFTValue>{gameData?.tokenId || 'Unknown'}</NFTValue>
                    </NFTDetailRow>
                    <NFTDetailRow>
                      <NFTLabel>Contract:</NFTLabel>
                      <NFTValue>{gameData?.contractAddress ? 
                        `${gameData.contractAddress.slice(0, 6)}...${gameData.contractAddress.slice(-4)}` : 
                        'Unknown'
                      }</NFTValue>
                    </NFTDetailRow>
                  </NFTDetails>
                  <ButtonGroup>
                                              <Button
                            onClick={() => {
                              const urls = getChainUrls(gameData?.chain)
                              window.open(urls.explorer, '_blank')
                            }}
                            style={{ flex: 1 }}
                          >
                            View on Explorer
                          </Button>
                          <Button
                            onClick={() => {
                              const urls = getChainUrls(gameData?.chain)
                              window.open(urls.marketplace, '_blank')
                            }}
                            style={{ flex: 1 }}
                          >
                      <img 
                        src="/images/opensea.png" 
                        alt="OpenSea" 
                        style={{ 
                          width: '16px', 
                          height: '16px',
                          objectFit: 'contain',
                          marginRight: '0.4rem'
                        }} 
                      />
                      View on OpenSea
                    </Button>
                  </ButtonGroup>
                </MobileNFTBox>
              </MobileHidden>

              {/* Game Status */}
              <MobileHidden>
                <MobileStatusBox>
                  <div style={{
                    fontSize: '0.85rem',
                    color: gameState?.currentPlayer === address ? 
                      theme.colors.neonGreen : theme.colors.textSecondary,
                    textAlign: 'center',
                    padding: '0.5rem',
                    background: gameState?.currentPlayer === address ? 
                      'rgba(0, 255, 65, 0.1)' : 'transparent',
                    borderRadius: '0.5rem'
                  }}>
                    {gameState?.currentPlayer === address ? 
                      'Your Turn' : 
                      gameState?.phase === 'waiting' ? 'Waiting for opponent' : 'Waiting'
                    }
                  </div>
                </MobileStatusBox>
              </MobileHidden>


                  </MobileOnlyLayout>
                );
              })()
                      ) : (
              (() => {
                return (
                <DesktopOnlyLayout>
              {/* Keep the existing desktop layout code here */}
              {/* LEFT CONTAINER - Players & Game Info */}
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '1.5rem',
                position: 'relative'
              }}>
                {/* Rest of the desktop layout code remains unchanged */}
                {/* PLAYERS SECTION - Top */}
                <div style={{
                  marginBottom: '1rem',
                  padding: '1rem',
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '1rem',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                  
                  {/* Player 1 */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '1rem',
                    padding: '0.75rem',
                    background: isCreator ? 'rgba(255, 20, 147, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '12px',
                    border: `2px solid ${isCreator ? theme.colors.neonPink : 'rgba(255, 255, 255, 0.1)'}`,
                    height: '60px',
                    animation: (isMyTurn && isCreator && (gameState?.phase === 'choosing' || gameState?.phase === 'round_active')) ? 
                      'playerTurnFlash 1.5s ease-in-out infinite' : 'none',
                    transition: 'all 0.3s ease'
                  }}>
                    <ProfilePicture 
                      address={gameData?.creator} 
                      size={40} 
                      isClickable={isCreator}
                      showUploadIcon={isCreator}
                      profileData={gameState?.creatorProfile}
                      style={{
                        borderRadius: '12px',
                        border: `2px solid ${theme.colors.neonPink}`
                      }}
                    />
                    
                    {/* Round indicators */}
                    <div style={{
                      display: 'flex',
                      gap: '0.25rem',
                      alignItems: 'center'
                    }}>
                      {[...Array(gameData?.rounds || 5)].map((_, i) => {
                        const roundNumber = i + 1;
                        const currentRound = gameState?.currentRound || 1;
                        const creatorWins = gameState?.creatorWins || 0;
                        const joinerWins = gameState?.joinerWins || 0;
                        
                        // Determine what happened in this round
                        let roundStatus = 'pending'; // pending, current, creator_won, joiner_won
                        
                        if (roundNumber < currentRound) {
                          // This round is completed - determine winner
                          const roundWinner = gameState?.roundResults?.[roundNumber - 1];
                          if (roundWinner === 'creator') {
                            roundStatus = 'creator_won';
                          } else if (roundWinner === 'joiner') {
                            roundStatus = 'joiner_won';
                          }
                        } else if (roundNumber === currentRound) {
                          roundStatus = 'current';
                        }
                        
                        const getBackgroundColor = () => {
                          switch (roundStatus) {
                            case 'current': return '#FFFF00'; // Yellow for current round
                            case 'creator_won': return '#00FF41'; // Green for creator win
                            case 'joiner_won': return '#FF1493'; // Pink for creator loss (joiner win)
                            default: return 'rgba(255, 255, 255, 0.2)'; // Gray for pending
                          }
                        };
                        
                        const getShadowColor = () => {
                          switch (roundStatus) {
                            case 'current': return '0 0 10px #FFFF00, 0 0 20px #FFFF00';
                            case 'creator_won': return '0 0 10px #00FF41, 0 0 20px #00FF41';
                            case 'joiner_won': return '0 0 10px #FF1493, 0 0 20px #FF1493';
                            default: return 'none';
                          }
                        };

                        const getTextColor = () => {
                          switch (roundStatus) {
                            case 'current': return '#000000';
                            case 'creator_won': return '#000000';
                            case 'joiner_won': return '#000000';
                            default: return '#ffffff';
                          }
                        };
                        
                        return (
                          <div
                            key={i}
                            style={{
                              width: '24px',
                              height: '24px',
                              borderRadius: '50%',
                              background: getBackgroundColor(),
                              opacity: 1,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '12px',
                              fontWeight: 'bold',
                              color: getTextColor(),
                              boxShadow: getShadowColor(),
                              transition: 'all 0.3s ease',
                              transform: roundStatus === 'current' ? 'scale(1.1)' : 'scale(1)',
                              animation: roundStatus === 'current' ? 'pulse 2s infinite' : 'none'
                            }}
                          >
                            {roundNumber}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Timer Display Box */}
                  {gameState?.turnTimeLeft !== undefined && (
                    <div style={{
                      padding: '1.5rem',
                      background: 'linear-gradient(135deg, rgba(255, 255, 0, 0.2), rgba(255, 215, 0, 0.1))',
                      borderRadius: '1rem',
                      border: `2px solid ${gameState.turnTimeLeft <= 5 ? '#FF1493' : '#FFFF00'}`,
                      textAlign: 'center',
                      marginBottom: '1rem',
                      boxShadow: gameState.turnTimeLeft <= 5 
                        ? '0 0 30px rgba(255, 20, 147, 0.6), inset 0 0 20px rgba(255, 20, 147, 0.3)'
                        : '0 0 30px rgba(255, 255, 0, 0.6), inset 0 0 20px rgba(255, 255, 0, 0.3)',
                      animation: gameState.turnTimeLeft <= 5 ? 'pulse 1s infinite' : 'none'
                    }}>
                      <div style={{ 
                        color: gameState.turnTimeLeft <= 5 ? '#FF1493' : '#FFFF00',
                        fontSize: '0.9rem',
                        fontWeight: 'bold',
                        marginBottom: '0.5rem',
                        textTransform: 'uppercase',
                        letterSpacing: '2px'
                      }}>
                        Turn Timer
                      </div>
                      <div style={{
                        fontSize: '3rem',
                        fontWeight: 'bold',
                        color: gameState.turnTimeLeft <= 5 ? '#FF1493' : '#FFFF00',
                        textShadow: gameState.turnTimeLeft <= 5 
                          ? '0 0 20px rgba(255, 20, 147, 0.8)'
                          : '0 0 20px rgba(255, 255, 0, 0.8)',
                        fontFamily: 'monospace'
                      }}>
                        {gameState.turnTimeLeft}s
                      </div>
                      {gameState?.currentPlayer && (
                        <div style={{
                          fontSize: '0.8rem',
                          color: 'rgba(255, 255, 255, 0.8)',
                          marginTop: '0.5rem'
                        }}>
                          {gameState.currentPlayer === address ? "Your Turn" : "Opponent's Turn"}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Player 2 */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.75rem',
                    background: isJoiner ? 'rgba(0, 191, 255, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '12px',
                    border: `2px solid ${isJoiner ? theme.colors.neonBlue : 'rgba(255, 255, 255, 0.1)'}`,
                    height: '60px',
                    animation: (isMyTurn && isJoiner && (gameState?.phase === 'choosing' || gameState?.phase === 'round_active')) ? 
                      'playerTurnFlash 1.5s ease-in-out infinite' : 'none',
                    transition: 'all 0.3s ease'
                  }}>
                    <ProfilePicture 
                      address={gameData?.joiner} 
                      size={40} 
                      isClickable={isJoiner}
                      showUploadIcon={isJoiner}
                      profileData={gameState?.joinerProfile}
                      style={{
                        borderRadius: '12px',
                        border: `2px solid ${theme.colors.neonBlue}`
                      }}
                    />
                    
                    {/* Round indicators */}
                    <div style={{
                      display: 'flex',
                      gap: '0.25rem',
                      alignItems: 'center'
                    }}>
                      {[...Array(gameData?.rounds || 5)].map((_, i) => {
                        const roundNumber = i + 1;
                        const currentRound = gameState?.currentRound || 1;
                        const creatorWins = gameState?.creatorWins || 0;
                        const joinerWins = gameState?.joinerWins || 0;
                        
                        // Determine what happened in this round
                        let roundStatus = 'pending'; // pending, current, creator_won, joiner_won
                        
                        if (roundNumber < currentRound) {
                          // This round is completed - determine winner
                          const roundWinner = gameState?.roundResults?.[roundNumber - 1];
                          if (roundWinner === 'creator') {
                            roundStatus = 'creator_won';
                          } else if (roundWinner === 'joiner') {
                            roundStatus = 'joiner_won';
                          }
                        } else if (roundNumber === currentRound) {
                          roundStatus = 'current';
                        }
                        
                        const getBackgroundColor = () => {
                          switch (roundStatus) {
                            case 'current': return '#FFFF00'; // Yellow for current round
                            case 'creator_won': return '#FF1493'; // Pink for joiner loss (creator win)
                            case 'joiner_won': return '#00FF41'; // Green for joiner win
                            default: return 'rgba(255, 255, 255, 0.2)'; // Gray for pending
                          }
                        };
                        
                        const getShadowColor = () => {
                          switch (roundStatus) {
                            case 'current': return '0 0 10px #FFFF00, 0 0 20px #FFFF00';
                            case 'creator_won': return '0 0 10px #FF1493, 0 0 20px #FF1493';
                            case 'joiner_won': return '0 0 10px #00FF41, 0 0 20px #00FF41';
                            default: return 'none';
                          }
                        };

                        const getTextColor = () => {
                          switch (roundStatus) {
                            case 'current': return '#000000';
                            case 'creator_won': return '#000000';
                            case 'joiner_won': return '#000000';
                            default: return '#ffffff';
                          }
                        };
                        
                        return (
                          <div
                            key={i}
                            style={{
                              width: '24px',
                              height: '24px',
                              borderRadius: '50%',
                              background: getBackgroundColor(),
                              opacity: 1,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '12px',
                              fontWeight: 'bold',
                              color: getTextColor(),
                              boxShadow: getShadowColor(),
                              transition: 'all 0.3s ease',
                              transform: roundStatus === 'current' ? 'scale(1.1)' : 'scale(1)',
                              animation: roundStatus === 'current' ? 'pulse 2s infinite' : 'none'
                            }}
                          >
                            {roundNumber}
                          </div>
                        );
                      })}
                    </div>
                  </div>


                </div>

                {/* Combined Game Info Section */}
                <div style={{
                  padding: '1rem',
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '1rem',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  textAlign: 'center'
                }}>
                  <div style={{ marginBottom: '1rem' }}>
                    <div style={{ 
                      color: theme.colors.textSecondary,
                      fontSize: '0.875rem',
                      marginBottom: '0.25rem'
                    }}>
                      Game ID
                    </div>
                    <div style={{ 
                      color: theme.colors.textPrimary,
                      fontWeight: 'bold',
                      fontSize: '1.125rem'
                    }}>
                      #{gameData?.id?.slice(-6).toUpperCase()}
                    </div>
                  </div>

                  <div style={{ marginBottom: '1rem' }}>
                    <div style={{ 
                      color: theme.colors.textSecondary,
                      fontSize: '0.875rem',
                      marginBottom: '0.25rem'
                    }}>
                      Entry Fee
                    </div>
                    <div style={{ 
                      color: theme.colors.textPrimary,
                      fontWeight: 'bold',
                      fontSize: '1.125rem'
                    }}>
                      ${gameData?.priceUSD?.toFixed(2)}
                    </div>
                  </div>

                  <div>
                    <div style={{ 
                      color: theme.colors.textSecondary,
                      fontSize: '0.875rem',
                      marginBottom: '0.25rem'
                    }}>
                      Rounds
                    </div>
                    <div style={{ 
                      color: theme.colors.textPrimary,
                      fontWeight: 'bold',
                      fontSize: '1.125rem'
                    }}>
                      Best of {gameData?.rounds}
                    </div>
                  </div>
                </div>

                {/* Game Chat Box - Moved here */}
                <div style={{ marginTop: '2rem' }}>
                  <GameChatBox 
                    gameId={gameId}
                    socket={socket}
                    connected={connected}
                  />
                </div>
              </div>

              {/* Center - Coin and Power Area - DESKTOP ONLY */}
              {screenSizeDetermined && !isMobileScreen && (
                <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  {/* Coin */}
                                    <div 
                    id="desktop-coin-container"
                    style={{ 
                      display: 'flex', 
                      justifyContent: 'center', 
                      alignItems: 'center',
                      width: '100%',
                      height: '440px',
                      marginBottom: '2rem',
                      marginLeft: 'auto',
                      marginRight: 'auto',
                      position: 'relative',
                      padding: '20px'
                    }}
                  >
                    {!isMobileScreen && renderCoin}
                  </div>

                  {/* Choice Display - Desktop */}
                  {(() => {
                    // Show choice when either player has made their choice
                    const creatorChoice = gameState?.creatorChoice;
                    const joinerChoice = gameState?.joinerChoice;
                    
                    if (creatorChoice || joinerChoice) {
                      // Determine what side this player is on
                      let mySide;
                      if (isCreator) {
                        mySide = creatorChoice;
                      } else if (isJoiner) {
                        mySide = joinerChoice;
                      }
                      
                      // If this player hasn't made their choice yet, show the opposite of the other player's choice
                      if (!mySide) {
                        if (isCreator && joinerChoice) {
                          mySide = joinerChoice === 'heads' ? 'tails' : 'heads';
                        } else if (isJoiner && creatorChoice) {
                          mySide = creatorChoice === 'heads' ? 'tails' : 'heads';
                        }
                      }
                      
                      return mySide ? (
                        <div style={{
                          textAlign: 'center',
                          marginBottom: '1.5rem',
                          padding: '1rem',
                          background: 'rgba(0, 255, 65, 0.1)',
                          border: '2px solid rgba(0, 255, 65, 0.3)',
                          borderRadius: '1rem',
                          animation: 'pulse 2s ease-in-out infinite'
                        }}>
                          <div style={{
                            fontSize: '1.5rem',
                            fontWeight: 'bold',
                            color: '#00FF41',
                            textShadow: '0 0 15px rgba(0, 255, 65, 0.5)'
                          }}>
                            You're {mySide.toUpperCase()}
                          </div>
                        </div>
                      ) : null;
                    }
                    return null;
                  })()}

                  {/* Power Display with Choice Buttons */}
                  <PowerDisplay
                    creatorPower={gameState?.creatorPower || 0}
                    joinerPower={gameState?.joinerPower || 0}
                    currentPlayer={gameState?.currentPlayer}
                    creator={gameState?.creator}
                    joiner={gameState?.joiner}
                    chargingPlayer={gameState?.chargingPlayer}
                    gamePhase={gameState?.phase}
                    isMyTurn={isMyTurn}
                    playerChoice={isCreator ? gameState?.creatorChoice : gameState?.joinerChoice}
                    onChoiceSelect={handlePlayerChoice}
                  />
                </div>
              )}

              {/* RIGHT CONTAINER - NFT & Game Details */}
              <div style={{
                position: 'relative',
                width: '100%',
                maxWidth: '600px',
                margin: '0 auto',
                padding: '2rem',
                background: 'linear-gradient(135deg, rgba(0, 255, 65, 0.1) 0%, rgba(0, 0, 0, 0.3) 100%)',
                border: '2px solid rgba(0, 255, 65, 0.3)',
                borderRadius: '1.5rem',
                backdropFilter: 'blur(10px)'
              }}>
                
                {/* NFT IMAGE - Top */}
                {nftData?.image && (
                  <div style={{
                    textAlign: 'center',
                    marginBottom: '1.5rem'
                  }}>
                    <img 
                      src={nftData.image} 
                      alt="NFT" 
                      style={{
                        width: '200px',
                        height: '200px',
                        borderRadius: '1rem',
                        objectFit: 'cover',
                        border: '4px solid rgba(0, 255, 65, 0.6)',
                        boxShadow: '0 0 30px rgba(0, 255, 65, 0.5), inset 0 0 30px rgba(0, 255, 65, 0.3)',
                        animation: 'nftBananaGlow 2s ease-in-out infinite'
                      }}
                      onError={(e) => {
                        e.target.src = '/placeholder-nft.svg'
                      }}
                    />
                  </div>
                )}

                {/* SOCIAL SHARE */}
                <div style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '1rem',
                  padding: '1rem',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  marginBottom: '1.5rem'
                }}>
                  <div style={{
                    color: theme.colors.textSecondary,
                    fontSize: '0.875rem',
                    marginBottom: '0.75rem',
                    textAlign: 'center'
                  }}>
                    Share
                  </div>
                  <div style={{
                    display: 'flex',
                    gap: '0.5rem',
                    justifyContent: 'center'
                  }}>
                    <button
                      onClick={() => {
                        const url = window.location.href
                        window.open(`https://twitter.com/intent/tweet?text=Join my game of Crypto Flipz! ${url}`, '_blank')
                      }}
                      style={{
                        background: 'rgba(255, 255, 255, 0.1)',
                        color: '#fff',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '0.5rem',
                        padding: '0.4rem 0.8rem',
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      <span style={{ fontSize: '1rem' }}>𝕏</span>
                    </button>
                    <button
                      onClick={() => {
                        const url = window.location.href
                        window.open(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=Join my game of Crypto Flipz!`, '_blank')
                      }}
                      style={{
                        background: 'rgba(255, 255, 255, 0.1)',
                        color: '#fff',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '0.5rem',
                        padding: '0.4rem 0.8rem',
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      <span style={{ fontSize: '1rem' }}>✈️</span>
                    </button>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(window.location.href)
                        showSuccess('Game link copied to clipboard!')
                      }}
                      style={{
                        background: 'rgba(255, 255, 255, 0.1)',
                        color: '#fff',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '0.5rem',
                        padding: '0.4rem 0.8rem',
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      <span style={{ fontSize: '1rem' }}>📋</span>
                    </button>
                  </div>
                </div>

                {/* NFT DETAILS */}
                {nftData && (
                  <div style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '1rem',
                    padding: '1.5rem',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                  }}>
                    {/* NFT Name */}
                    <div style={{
                      fontSize: '1.2rem',
                      fontWeight: 'bold',
                      marginBottom: '1rem',
                      color: theme.colors.neonYellow
                    }}>
                      {nftData.name}
                    </div>

                    {/* Collection */}
                    <div style={{ marginBottom: '1rem' }}>
                      <div style={{ 
                        fontSize: '0.8rem', 
                        opacity: 0.8, 
                        marginBottom: '0.25rem' 
                      }}>
                        Collection
                      </div>
                      <div style={{ 
                        fontWeight: 'bold',
                        fontSize: '1rem'
                      }}>
                        {nftData.collection}
                      </div>
                    </div>
                    
                    {/* Token ID */}
                    <div style={{ marginBottom: '1.5rem' }}>
                      <div style={{ 
                        fontSize: '0.8rem', 
                        opacity: 0.8, 
                        marginBottom: '0.25rem' 
                      }}>
                        Token ID
                      </div>
                      <div style={{ 
                        fontWeight: 'bold',
                        fontSize: '1rem'
                      }}>
                        #{nftData.tokenId}
                      </div>
                    </div>
                    
                    {/* Links */}
                    <div style={{ 
                      display: 'flex', 
                      gap: '0.5rem', 
                      marginBottom: '1.5rem'
                    }}>
                      <a
                        href={`${getChainUrls(nftData?.chain).explorer}/token/${nftData.contractAddress}?a=${nftData.tokenId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      style={{
                          background: 'rgba(255, 255, 255, 0.1)',
                          padding: '0.4rem 0.8rem',
                        borderRadius: '0.5rem',
                          fontSize: '0.8rem',
                          textDecoration: 'none',
                          color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                          gap: '0.4rem',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                        transition: 'all 0.3s ease'
                      }}
                      >
                        🔍 Explorer
                      </a>
                      <a
                        href={`${getChainUrls(nftData?.chain).marketplace}/${nftData.contractAddress}/${nftData.tokenId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          background: 'rgba(255, 255, 255, 0.1)',
                          padding: '0.4rem 0.8rem',
                          borderRadius: '0.5rem',
                          fontSize: '0.8rem',
                          textDecoration: 'none',
                          color: '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          transition: 'all 0.3s ease'
                        }}
                      >
                        <img 
                          src="/images/opensea.png" 
                          alt="OpenSea" 
                          style={{ 
                            width: '16px', 
                            height: '16px',
                            objectFit: 'contain'
                          }} 
                        />
                        OpenSea
                      </a>
                    </div>
                    
                    {/* Contract Address */}
                    <div style={{ marginBottom: '1rem' }}>
                      <div style={{ 
                        fontSize: '0.8rem', 
                        opacity: 0.8, 
                        marginBottom: '0.25rem' 
                      }}>
                        Contract Address
                      </div>
                      <div 
                        onClick={() => {
                          navigator.clipboard.writeText(nftData.contractAddress);
                          // You can add a toast notification here if you want
                        }}
                        style={{ 
                          fontSize: '0.9rem',
                          fontFamily: 'monospace',
                          background: 'rgba(0, 0, 0, 0.3)',
                          padding: '0.5rem',
                          borderRadius: '0.25rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.background = 'rgba(0, 0, 0, 0.4)';
                          e.currentTarget.style.border = '1px solid rgba(255, 255, 255, 0.2)';
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.background = 'rgba(0, 0, 0, 0.3)';
                          e.currentTarget.style.border = 'none';
                        }}
                      >
                        <span>{nftData.contractAddress?.slice(0, 6)}...{nftData.contractAddress?.slice(-4)}</span>
                        <span style={{ opacity: 0.6 }}>📋</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* JOIN GAME BUTTON - Only show if game is waiting and user is not creator */}
                {/* [CLEANUP] Removed Enhanced Join Button - join logic now handled in Dashboard */}
              </div>
                </DesktopOnlyLayout>
              );
            })()
          )
          )}

          {/* [CLEANUP] Removed NFT vs NFT Offer Component - now handled in Dashboard */}

          {/* [CLEANUP] Removed accepted offer status display - now handled in Dashboard */}

          {/* Game Access Message */}
          {!isPlayer && gameState?.phase && gameState.phase !== 'waiting' && (
            <div style={{
              marginTop: '2rem',
              textAlign: 'center',
              padding: '1rem',
              background: 'rgba(0, 191, 255, 0.1)',
              border: '1px solid rgba(0, 191, 255, 0.3)',
              borderRadius: '1rem'
            }}>
              <p style={{ color: '#00BFFF', fontWeight: 'bold', margin: 0 }}>
                🎮 GAME IN PROGRESS
              </p>
              <p style={{ color: '#888', fontSize: '0.875rem', margin: '0.5rem 0 0 0' }}>
                Join a game to see the action!
              </p>
            </div>
          )}

          {/* Game Status */}
          {/* Show joined status for creator */}
          {gameData?.status === 'joined' && isCreator && (
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <div style={{
                padding: '1rem',
                background: 'rgba(0, 255, 65, 0.1)',
                border: '1px solid rgba(0, 255, 65, 0.3)',
                borderRadius: '1rem'
              }}>
                <div style={{ color: '#00FF41', fontWeight: 'bold', fontSize: '1.2rem' }}>
                  🎉 Player Joined!
                </div>
                <div style={{ color: 'white', marginTop: '0.5rem' }}>
                  {gameData.joiner ? 
                    `Player ${gameData.joiner.slice(0, 6)}...${gameData.joiner.slice(-4)} has joined your game!` :
                    'A player has joined your game!'
                  }
                </div>
                <div style={{ color: '#FFD700', marginTop: '0.5rem', fontSize: '0.9rem' }}>
                  Game will start automatically in a few seconds...
                </div>
                <Button 
                  onClick={async () => {
                    try {
                      console.log('🚀 Manual start: Game will start automatically via server')
                      showSuccess('Game will start automatically when both players are ready!')
                    } catch (error) {
                      console.error('❌ Manual start failed:', error)
                      showError('Failed to start game: ' + error.message)
                    }
                  }}
                  style={{
                    marginTop: '1rem',
                    background: 'linear-gradient(45deg, #00FF41, #39FF14)',
                    color: '#fff',
                    border: 'none',
                    padding: '0.5rem 1rem',
                    borderRadius: '0.5rem',
                    fontSize: '0.9rem',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  🚀 Start Game Now
                </Button>
              </div>
            </div>
          )}

          {/* Show waiting status for joiner */}
          {gameData?.status === 'joined' && !isCreator && (
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <div style={{
                padding: '1rem',
                background: 'rgba(255, 165, 0, 0.1)',
                border: '1px solid rgba(255, 165, 0, 0.3)',
                borderRadius: '1rem'
              }}>
                <div style={{ color: '#FFA500', fontWeight: 'bold', fontSize: '1.2rem' }}>
                  ⏳ Waiting for Game to Start
                </div>
                <div style={{ color: 'white', marginTop: '0.5rem' }}>
                  You've joined the game! Waiting for the creator to start...
                </div>
              </div>
            </div>
          )}

          {/* Show waiting status for creator */}
          {gameData?.status === 'waiting' && isCreator && (
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <div style={{
                padding: '1rem',
                background: 'rgba(0, 191, 255, 0.1)',
                border: '1px solid rgba(0, 191, 255, 0.3)',
                borderRadius: '1rem'
              }}>
                <div style={{ color: '#00BFFF', fontWeight: 'bold', fontSize: '1.2rem' }}>
                  🔍 Waiting for Player to Join
                </div>
                <div style={{ color: 'white', marginTop: '0.5rem' }}>
                  Share this game link with someone to start playing!
                </div>
                <div style={{ color: '#FFD700', marginTop: '0.5rem', fontSize: '0.9rem' }}>
                  Game ID: {gameId}
                </div>
              </div>
            </div>
          )}

          {gameState?.phase === 'choosing' && (
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              {isMyTurn ? (
                <div style={{
                  padding: '1rem',
                  background: 'rgba(255, 215, 0, 0.1)',
                  border: '1px solid rgba(255, 215, 0, 0.3)',
                  borderRadius: '1rem'
                }}>
                  <div style={{ color: theme.colors.textSecondary, marginTop: '0.5rem' }}>
                    Select heads or tails in your player box, then you can charge power and flip!
                  </div>
                  {gameState.turnTimeLeft !== undefined && (
                    <div style={{ 
                      color: gameState.turnTimeLeft <= 5 ? theme.colors.statusError : theme.colors.neonYellow,
                      fontWeight: 'bold',
                      fontSize: '1.2rem',
                      marginTop: '0.5rem',
                      animation: gameState.turnTimeLeft <= 5 ? 'pulse 1s infinite' : 'none'
                    }}>
                      {gameState.turnTimeLeft}s to choose
                    </div>
                  )}
                </div>
              ) : (
                <div style={{
                  padding: '1rem',
                  background: 'rgba(255, 165, 0, 0.1)',
                  border: '1px solid rgba(255, 165, 0, 0.3)',
                  borderRadius: '1rem'
                }}>
                  <div style={{ color: theme.colors.statusWarning, fontWeight: 'bold', fontSize: '1.2rem' }}>
                    ⏳ Opponent is Choosing
                  </div>
                  <div style={{ color: theme.colors.textSecondary, marginTop: '0.5rem' }}>
                    Waiting for {!isCreator ? 'Player 1' : 'Player 2'} to choose heads or tails
                  </div>
                  {gameState.turnTimeLeft !== undefined && (
                    <div style={{ 
                      color: gameState.turnTimeLeft <= 5 ? theme.colors.statusError : theme.colors.neonYellow,
                      fontWeight: 'bold',
                      fontSize: '1.2rem',
                      marginTop: '0.5rem',
                      animation: gameState.turnTimeLeft <= 5 ? 'pulse 1s infinite' : 'none'
                    }}>
                      {gameState.turnTimeLeft}s remaining
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {gameState?.phase === 'round_active' && (
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              {isMyTurn ? (
                <div style={{
                  padding: '1rem',
                  background: 'rgba(0, 255, 65, 0.1)',
                  border: '1px solid rgba(0, 255, 65, 0.3)',
                  borderRadius: '1rem'
                }}>
                  <div style={{ color: theme.colors.statusSuccess, fontWeight: 'bold', fontSize: '1.2rem' }}>
                    ⚡ YOUR TURN TO FLIP!
                  </div>
                  <div style={{ color: theme.colors.textSecondary, marginTop: '0.5rem' }}>
                    You chose {isCreator ? gameState.creatorChoice?.toUpperCase() : gameState.joinerChoice?.toUpperCase()} - Hold coin to charge power, release to flip!
                  </div>
                </div>
              ) : (
                <div style={{
                  padding: '1rem',
                  background: 'rgba(255, 165, 0, 0.1)',
                  border: '1px solid rgba(255, 165, 0, 0.3)',
                  borderRadius: '1rem'
                }}>
                  <div style={{ color: theme.colors.statusWarning, fontWeight: 'bold', fontSize: '1.2rem' }}>
                    ⏳ Opponent's Turn
                  </div>
                  <div style={{ color: theme.colors.textSecondary, marginTop: '0.5rem' }}>
                    They chose {!isCreator ? gameState.creatorChoice?.toUpperCase() : gameState.joinerChoice?.toUpperCase()} and are charging power to flip
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Round Result Display */}
          {roundResult && (
            <div style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 9999,
              background: 'rgba(0, 0, 0, 0.95)',
              padding: '2rem',
              borderRadius: '2rem',
              border: `4px solid ${roundResult.actualWinner === address ? '#00FF41' : '#FF1493'}`,
              textAlign: 'center',
              width: '90%',
              maxWidth: '600px',
              pointerEvents: 'none',
              boxShadow: `0 0 50px ${roundResult.actualWinner === address ? 'rgba(0, 255, 65, 0.5)' : 'rgba(255, 20, 147, 0.5)'}`
            }}>
              <div style={{
                position: 'relative',
                width: '100%',
                height: '200px',
                marginBottom: '1rem',
                borderRadius: '1rem',
                overflow: 'hidden'
              }}>
                <video
                  key={roundResult.actualWinner === address ? 'win' : 'lose'}
                  autoPlay
                  muted
                  playsInline
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    borderRadius: '1rem'
                  }}
                  src={roundResult.actualWinner === address ? 
                    'images/video/LoseWin/final lose win/win.webm' : 
                    'images/video/LoseWin/final lose win/lose.webm'
                  }
                  onError={(e) => {
                    console.error('Video playback error:', e);
                    console.log('Video source:', e.target.src);
                    // Try alternative path
                    e.target.src = roundResult.actualWinner === address ? 
                      '/images/video/LoseWin/final lose win/win.webm' : 
                      '/images/video/LoseWin/final lose win/lose.webm';
                  }}
                  onLoadedData={(e) => {
                    console.log('Video loaded successfully');
                    e.target.play().catch(err => console.error('Play error:', err));
                  }}
                />
              </div>
              
              {/* Clear Result Display */}
              <div style={{
                fontSize: '2.5rem',
                color: 'white',
                fontWeight: 'bold',
                marginBottom: '1rem',
                pointerEvents: 'auto',
                textShadow: '0 0 10px rgba(255, 255, 255, 0.5)'
              }}>
                {roundResult.result === 'heads' ? '👑 HEADS' : '💎 TAILS'}
              </div>
              
              {/* Player Choice Display */}
              <div style={{
                fontSize: '1.2rem',
                color: 'rgba(255, 255, 255, 0.9)',
                marginBottom: '1rem',
                pointerEvents: 'auto',
                padding: '0.5rem 1rem',
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '0.5rem',
                border: '1px solid rgba(255, 255, 255, 0.2)'
              }}>
                You chose: <strong>{(() => {
                  const myChoice = isCreator ? gameState?.creatorChoice : gameState?.joinerChoice;
                  // Fallback to roundResult.playerChoice if gameState choice is not available
                  return (myChoice || roundResult?.playerChoice)?.toUpperCase() || 'UNKNOWN';
                })()}</strong>
              </div>
              
              {/* Win/Lose Status */}
              <div style={{
                fontSize: '1.8rem',
                color: (() => {
                  // Determine if current player won by checking if their choice matched the result
                  const myChoice = isCreator ? gameState?.creatorChoice : gameState?.joinerChoice;
                  const didIWin = myChoice === roundResult.result;
                  return didIWin ? '#00FF41' : '#FF1493';
                })(),
                fontWeight: 'bold',
                marginBottom: '1rem',
                pointerEvents: 'auto',
                textShadow: (() => {
                  const myChoice = isCreator ? gameState?.creatorChoice : gameState?.joinerChoice;
                  const didIWin = myChoice === roundResult.result;
                  return `0 0 15px ${didIWin ? 'rgba(0, 255, 65, 0.7)' : 'rgba(255, 20, 147, 0.7)'}`;
                })(),
                animation: 'pulse 1s infinite'
              }}>
                {(() => {
                  const myChoice = isCreator ? gameState?.creatorChoice : gameState?.joinerChoice;
                  const didIWin = myChoice === roundResult.result;
                  return didIWin ? '🎉 YOU WON!' : '💔 YOU LOST!';
                })()}
              </div>
            </div>
          )}

          {/* NEW: Popup Result Display - Only for game completion */}
          <GameResultPopup
            isVisible={showResultPopup && gameState?.phase === 'game_complete'}
            isWinner={popupData?.isWinner || false}
            flipResult={popupData?.flipResult}
            playerChoice={popupData?.playerChoice}
            gameData={popupData?.gameData}
            onClose={() => setShowResultPopup(false)}
            onClaimWinnings={handleClaimWinnings}
          />

          {/* Winner Screen */}
          {gameState?.winner && ( 
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.9)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              padding: '2rem',
              backdropFilter: 'blur(10px)'
            }}>
              <div style={{
                background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(25, 20, 0, 0.9) 100%)',
                border: '2px solid #FFD700',
                borderRadius: '1rem',
                padding: '2rem',
                textAlign: 'center',
                // Responsive sizing: Mobile 20% smaller, Desktop 40% larger
                maxWidth: isMobileScreen ? '400px' : '700px', // 500px * 0.8 = 400px for mobile, 500px * 1.4 = 700px for desktop
                width: isMobileScreen ? '80%' : '140%', // 100% * 0.8 = 80% for mobile, 100% * 1.4 = 140% for desktop
                boxShadow: '0 0 30px rgba(255, 215, 0, 0.3)'
              }}>
                <h2 style={{ color: '#FFD700', marginBottom: '1rem' }}>🎉 You Won! 🎉</h2>
                <p style={{ color: '#fff', marginBottom: '2rem' }}>
                  Congratulations! You've won {gameState?.potAmount || 0} {gameState?.currency || 'ETH'}
                </p>
                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '1rem', width: '100%', marginBottom: '1rem' }}>
                  <button
                    onClick={handleClaimWinnings}
                    style={{
                      flex: 1,
                      background: 'linear-gradient(135deg, #00FF41, #39FF14)',
                      color: '#000',
                      border: 'none',
                      padding: '1rem',
                      borderRadius: '0.8rem',
                      fontSize: '1.2rem',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      boxShadow: '0 0 20px rgba(0, 255, 65, 0.4)',
                      transition: 'all 0.3s ease',
                      textTransform: 'uppercase'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.transform = 'scale(1.05)';
                      e.currentTarget.style.boxShadow = '0 0 30px rgba(0, 255, 65, 0.6)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                      e.currentTarget.style.boxShadow = '0 0 20px rgba(0, 255, 65, 0.4)';
                    }}
                  >
                    💰 COLLECT
                  </button>
                  <button
                    onClick={() => navigate('/')}
                    style={{
                      flex: 1,
                      background: 'linear-gradient(135deg, #FF1493, #FF69B4)',
                      color: '#fff',
                      border: 'none',
                      padding: '1rem',
                      borderRadius: '0.8rem',
                      fontSize: '1.2rem',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      boxShadow: '0 0 20px rgba(255, 20, 147, 0.4)',
                      transition: 'all 0.3s ease',
                      textTransform: 'uppercase'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.transform = 'scale(1.05)';
                      e.currentTarget.style.boxShadow = '0 0 30px rgba(255, 20, 147, 0.6)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                      e.currentTarget.style.boxShadow = '0 0 20px rgba(255, 20, 147, 0.4)';
                    }}
                  >
                    🏠 HOME
                  </button>
                </div>
                <p style={{ 
                  color: '#ff4444', 
                  fontSize: '0.9rem', 
                  marginTop: '1rem',
                  border: '1px solid rgba(255, 68, 68, 0.3)',
                  padding: '0.5rem',
                  borderRadius: '0.5rem',
                  background: 'rgba(255, 68, 68, 0.1)'
                }}>
                  ⚠️ Warning: If you leave this screen without claiming, you will lose your winnings.
                </p>
              </div>
            </div>
          )}

          {/* [CLEANUP] Removed NFT offer button and join button - now handled in Dashboard */}

          {/* Add withdrawal button for completed games where user won */}
          {gameData?.status === 'completed' && gameData?.winner === address && (
            <div style={{
              marginTop: '2rem',
              display: 'flex',
              justifyContent: 'center'
            }}>
              <button
                onClick={handleClaimWinnings}
                style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  border: 'none',
                  padding: '1rem 2rem',
                  borderRadius: '12px',
                  fontSize: '1.1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 10px 30px rgba(102, 126, 234, 0.4)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                Claim Your Winnings 🎉
              </button>
            </div>
          )}
        </ContentWrapper>
      </Container>
      <style>
        {`
          @keyframes buttonPulse {
            0% {
              box-shadow: 0 0 15px rgba(255, 215, 0, 0.3);
            }
            50% {
              box-shadow: 0 0 25px rgba(255, 215, 0, 0.6);
            }
            100% {
              box-shadow: 0 0 15px rgba(255, 215, 0, 0.3);
            }
          }

          @keyframes nftBananaGlow {
            0% {
              box-shadow: 0 0 30px rgba(255, 255, 0, 0.5), inset 0 0 30px rgba(255, 255, 0, 0.3);
            }
            50% {
              box-shadow: 0 0 50px rgba(255, 255, 0, 0.7), inset 0 0 50px rgba(255, 255, 0, 0.4);
            }
            100% {
              box-shadow: 0 0 30px rgba(255, 255, 0, 0.5), inset 0 0 30px rgba(255, 255, 0, 0.3);
            }
          }
        `}
      </style>
      
      {/* [CLEANUP] Removed modal renders - NFT offer logic now handled in Dashboard */}
    </ThemeProvider>
  )
}



export default FlipGame