import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useWallet } from '../contexts/WalletContext'
import { useToast } from '../contexts/ToastContext'
// Removed useProfile import - game now only uses game-specific coin data
import { useWalletConnection } from '../utils/useWalletConnection'
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
import GameChatBox from './GameChatBox'
import NFTVerificationDisplay from './NFTVerificationDisplay'
import NFTOfferComponent from './NFTOfferComponent'

const BackgroundVideo = styled.video`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  z-index: -1;
  opacity: 0.7;
  pointer-events: none;
  background: #000;
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
  const [joiningGame, setJoiningGame] = useState(false)

  // NEW: Enhanced join state management
  const [joinInProgress, setJoinInProgress] = useState(false)
  const [joiningPlayer, setJoiningPlayer] = useState(null)

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
  const [offeredNFTs, setOfferedNFTs] = useState([])
  const [acceptedOffer, setAcceptedOffer] = useState(null)
  const [challengerPaid, setChallengerPaid] = useState(false)
  const [isNFTGame, setIsNFTGame] = useState(false)

  // Choice animation states
  const [showChoiceAnimation, setShowChoiceAnimation] = useState(false)
  const [choiceAnimationText, setChoiceAnimationText] = useState('')
  const [choiceAnimationColor, setChoiceAnimationColor] = useState('#00FF41')

  // Auto-flip animation state
  const [showAutoFlipAnimation, setShowAutoFlipAnimation] = useState(false)

  // NFT modal states (needed for NFT vs NFT games)
  const [showNFTOfferModal, setShowNFTOfferModal] = useState(false)
  const [showNFTVerificationModal, setShowNFTVerificationModal] = useState(false)
  const [showNFTDetailsModal, setShowNFTDetailsModal] = useState(false)
  const [showOfferReviewModal, setShowOfferReviewModal] = useState(false)
  const [selectedNFT, setSelectedNFT] = useState(null)
  const [nftOffer, setNftOffer] = useState(null)
  const [pendingNFTOffer, setPendingNFTOffer] = useState(null)

  // NEW: Join button state calculation
  const getJoinButtonState = () => {
    if (!gameData) return { text: 'Loading...', disabled: true, color: 'gray' }
    
    console.log('🔍 Join button state check:', {
      gameData: {
        joiner: gameData.joiner,
        status: gameData.status,
        creator: gameData.creator
      },
      gameState: {
        joiner: gameState?.joiner,
        phase: gameState?.phase
      },
      address,
      joinInProgress,
      joiningGame
    })
    
    // If there's a join in progress
    if (joinInProgress || gameState?.joinInProgress) {
      const playerJoining = joiningPlayer || gameState?.joiningPlayer
      if (playerJoining === address) {
        return { text: '⏳ Joining...', disabled: true, color: 'yellow' }
      } else {
        return { text: '👤 Player Joining...', disabled: true, color: 'blue' }
      }
    }
    
    // If game already has joiner
    if (gameData.joiner && gameData.joiner !== '0x0000000000000000000000000000000000000000') {
      return { text: 'Game Full', disabled: true, color: 'gray' }
    }
    
    // Check gameState joiner as well
    if (gameState?.joiner && gameState.joiner !== '0x0000000000000000000000000000000000000000') {
      return { text: 'Game Full', disabled: true, color: 'gray' }
    }
    
    // If creator tries to join own game
    if (gameData.creator === address) {
      return { text: 'Your Game', disabled: true, color: 'gray' }
    }
    
    // If game is not waiting
    if (gameData.status !== 'waiting' && gameState?.phase !== 'waiting') {
      return { text: 'In Progress', disabled: true, color: 'gray' }
    }
    
    // If user is joining
    if (joiningGame) {
      return { text: '⏳ Processing...', disabled: true, color: 'yellow' }
    }
    
    // If not connected
    if (!isFullyConnected) {
      return { text: 'Connect Wallet', disabled: true, color: 'red' }
    }
    
    // Ready to join
    return { text: 'Join Flip', disabled: false, color: 'green' }
  }

  const videoRef = useRef(null);
  const [videoError, setVideoError] = useState(false);

  const [isInfoOpen, setIsInfoOpen] = useState(false)
  const [isChatOpen, setIsChatOpen] = useState(false)

  // Add screen size detection
  const [isMobileScreen, setIsMobileScreen] = useState(false)
  const [screenSizeDetermined, setScreenSizeDetermined] = useState(false)

  // Update coin images when game state changes (use creator's selected coin ONLY)
  useEffect(() => {
    console.log('🪙 Coin useEffect triggered - gameState?.coin:', gameState?.coin);
    
    if (gameState?.coin) {
      console.log('🪙 Using game creator\'s selected coin:', gameState.coin);
      setGameCoin(gameState.coin);
      
      // ALWAYS use the game's selected coin, regardless of type
      setCustomHeadsImage(gameState.coin.headsImage);
      setCustomTailsImage(gameState.coin.tailsImage);
      
      console.log('🪙 Set coin images to:', {
        heads: gameState.coin.headsImage,
        tails: gameState.coin.tailsImage,
        type: gameState.coin.type
      });
    } else {
      console.log('🪙 No game coin data - using default null (no fallback to profile)');
      
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
      console.log('📱 Screen size check:', { 
        windowWidth: window.innerWidth, 
        isMobile: newIsMobile,
        previousIsMobile: isMobileScreen 
      })
      setIsMobileScreen(newIsMobile)
      setScreenSizeDetermined(true)
    }

    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [isMobileScreen])

  // Initialize contract service when wallet is connected
  useEffect(() => {
    if (isFullyConnected && walletClient) {
      const chainId = 8453 // Base network
      contractService.initializeClients(chainId, walletClient)
        .then(() => {
          console.log('✅ Contract service initialized for chain: base')
        })
        .catch(error => {
          console.error('❌ Failed to initialize contract service:', error)
        })
    }
  }, [isFullyConnected, walletClient])

  // WebSocket connection
  useEffect(() => {
    if (!gameId || !address) {
      console.log('❌ Cannot connect - missing gameId or address:', { gameId, address })
      return
    }

    console.log('🎮 Setting up WebSocket connection:', { gameId, address })
    let reconnectAttempts = 0
    const maxReconnectAttempts = 5
    let reconnectTimer

    const connect = () => {
      // Always use production WebSocket server since local development server doesn't exist
      const wsUrl = 'wss://cryptoflipz2-production.up.railway.app'
      
      console.log('🔌 Connecting to WebSocket:', wsUrl)
      const ws = new WebSocket(wsUrl)

      ws.onopen = () => {
        console.log('✅ WebSocket connected')
        setConnected(true)
        setSocket(ws)
        reconnectAttempts = 0
        
        // Join game
        const joinMessage = {
          type: 'connect_to_game',
          gameId,
          address
        }
        console.log('🎮 Sending join message:', joinMessage)
        ws.send(JSON.stringify(joinMessage))
      }

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          console.log('📡 Received WebSocket message:', {
            type: data.type,
            phase: data.phase,
            currentPlayer: data.currentPlayer,
            creatorChoice: data.creatorChoice,
            joinerChoice: data.joinerChoice,
            creator: data.creator,
            joiner: data.joiner
          })
          
          switch (data.type) {
            case 'game_state':
              console.log('🔄 Game state update:', {
                phase: data.phase,
                currentRound: data.currentRound,
                currentPlayer: data.currentPlayer,
                creatorWins: data.creatorWins,
                joinerWins: data.joinerWins,
                isFlipInProgress: data.isFlipInProgress,
                creatorChoice: data.creatorChoice,
                joinerChoice: data.joinerChoice,
                creator: data.creator,
                joiner: data.joiner,
                coin: data.coin // NEW: Log coin data
              })
              console.log('🪙 Coin data in game state:', data.coin);
              setGameState(data)
              
              // Show opponent's choice animation if they just made a choice
              if (data.phase === 'round_active' && 
                  ((isCreator && data.joinerChoice) || (isJoiner && data.creatorChoice))) {
                const opponentChoice = isCreator ? data.joinerChoice : data.creatorChoice
                // Show the opposite of what the opponent chose (your side)
                const mySide = opponentChoice === 'heads' ? 'tails' : 'heads'
                setChoiceAnimationText(mySide.toUpperCase())
                setChoiceAnimationColor('#FF1493') // Neon pink
                setShowChoiceAnimation(true)
                setTimeout(() => {
                  setShowChoiceAnimation(false)
                }, 1000)
              }
              break
              
            case 'flip_animation':
              console.log('🎬 Flip animation received:', data)
              console.log('🎬 Flip animation details:', {
                result: data.result,
                duration: data.duration,
                playerChoice: data.playerChoice,
                playerAddress: data.playerAddress,
                power: data.power
              })
              setFlipAnimation(data)
              setRoundResult(null)
              break
              
            case 'round_result':
              console.log('🏁 Round result received:', data)
              console.log('🏁 Round result details:', {
                result: data.result,
                isWinner: data.isWinner,
                playerAddress: data.playerAddress,
                playerChoice: data.playerChoice,
                actualWinner: data.actualWinner,
                creatorWins: data.creatorWins,
                joinerWins: data.joinerWins,
                roundNumber: data.roundNumber,
                myAddress: address,
                isCreator,
                isJoiner,
                // Additional debug info
                flipperWon: data.flipperWon,
                creatorChoice: data.creatorChoice,
                joinerChoice: data.joinerChoice
              })
              setRoundResult(data)
              setLastFlipResult(data.result) // Save the last flip result
              setFlipAnimation(null) // Clear the animation so coin uses roundResult
              setTimeout(() => setRoundResult(null), 4000)
              break
              
            case 'error':
              console.log('❌ Error received:', data.error)
              showError(data.error)
              break
          }
        } catch (error) {
          console.error('❌ Error parsing WebSocket message:', error)
        }
      }

      ws.onclose = () => {
        console.log('❌ WebSocket disconnected')
        setConnected(false)
        setSocket(null)
        
        // Attempt to reconnect
        if (reconnectAttempts < maxReconnectAttempts) {
          reconnectAttempts++
          console.log(`🔄 Attempting to reconnect (${reconnectAttempts}/${maxReconnectAttempts})...`)
          reconnectTimer = setTimeout(() => {
            connect()
          }, 2000 * reconnectAttempts)
        } else {
          showError('Lost connection to game server. Please refresh the page.')
        }
      }

      ws.onerror = (error) => {
        console.error('❌ WebSocket error:', error)
      }

      return ws
    }

    const ws = connect()

    return () => {
      if (reconnectTimer) {
        clearTimeout(reconnectTimer)
      }
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.close()
      }
    }
  }, [gameId, address])

  // Auto-flip detection
  useEffect(() => {
    if (!gameState) return
    
    const currentTurnTimeLeft = gameState.turnTimeLeft
    const previousTurnTimeLeft = previousTurnTimeLeftRef.current
    
    // Detect auto-flip: timer went from positive number to 0 or undefined
    if (previousTurnTimeLeft !== null && 
        previousTurnTimeLeft > 0 && 
        (currentTurnTimeLeft === 0 || currentTurnTimeLeft === undefined) &&
        gameState.phase === 'round_active') {
      
      console.log('⚡ Auto-flip detected! Showing animation...')
      setShowAutoFlipAnimation(true)
      
      // Hide animation after 2 seconds
      setTimeout(() => {
        setShowAutoFlipAnimation(false)
      }, 2000)
    }
    
    // Update the ref with current value
    previousTurnTimeLeftRef.current = currentTurnTimeLeft
  }, [gameState?.turnTimeLeft, gameState?.phase])

  // Load game data from database
  // Load game from contract
  const loadGameFromContract = async () => {
    try {
      console.log('📋 Loading game from smart contract...')
      
      const result = await contractService.getGameDetails(gameId)
      
      if (!result.success) {
        console.warn('Failed to load from contract:', result.error)
        return null
      }

      // Transform contract data to match your UI format
      const { game, payment, gameState } = result.data
      
      // Try to extract coin design from authInfo
      let coinData = null
      try {
        if (game.authInfo) {
          const authInfo = JSON.parse(game.authInfo)
          if (authInfo.coinDesign) {
            coinData = authInfo.coinDesign
            console.log('🪙 Found coin design in authInfo:', coinData)
          }
        }
      } catch (parseError) {
        console.warn('⚠️ Could not parse authInfo for coin design:', parseError)
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
        rounds: gameState.maxRounds,
        status: getGameStatusFromContract(game, gameState),
        current_round: gameState.currentRound,
        max_rounds: gameState.maxRounds,
        creator_wins: gameState.creatorWins,
        joiner_wins: gameState.joinerWins,
        winner: gameState.winner,
        contract_game_id: gameId,
        coin: coinData // Use extracted coin data
      }
    } catch (error) {
      console.error('Error loading from contract:', error)
      return null
    }
  }

  // Helper to determine game status
  const getGameStatusFromContract = (game, gameState) => {
    if (game.state === 0) return 'waiting' // CREATED state
    if (game.state === 1) return 'active' // JOINED state
    if (game.state === 2) return 'completed' // COMPLETED state
    if (game.state === 3) return 'cancelled' // CANCELLED state
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

  const loadGame = async () => {
    try {
      setLoading(true)
      setError('')
      
      const API_URL = 'https://cryptoflipz2-production.up.railway.app'
      const response = await fetch(`${API_URL}/api/games/${gameId}`)
      
      if (!response.ok) {
        throw new Error('Game not found')
      }
      
      const gameData = await response.json()
      console.log('✅ Game loaded from database:', gameData)
      
      // Parse coin data if it's a string
      if (gameData.coin && typeof gameData.coin === 'string') {
        try {
          console.log('🪙 Parsing coin data from string:', gameData.coin)
          gameData.coin = JSON.parse(gameData.coin)
          console.log('🪙 Parsed coin data:', gameData.coin)
        } catch (e) {
          console.warn('Could not parse coin data:', e)
        }
      } else if (gameData.coin) {
        console.log('🪙 Coin data is already an object:', gameData.coin)
      } else {
        console.log('🪙 No coin data in gameData')
      }
      
      setGameData(gameData)
      
      // Set NFT data directly from database
      setNftData({
        contractAddress: gameData.nft_contract,
        tokenId: gameData.nft_token_id,
        name: gameData.nft_name,
        image: gameData.nft_image,
        collection: gameData.nft_collection,
        chain: gameData.nft_chain
      })
      
    } catch (err) {
      console.error('❌ Error loading game:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadGame()
  }, [gameId])

  // Update useEffect to fetch NFT data when game loads or when we have game data
  useEffect(() => {
    if (gameId && gameData) {
      fetchNFTData(gameId)
    }
  }, [gameId, gameData])

  // Add effect to set NFT data from gameData as fallback
  useEffect(() => {
    if (gameData && !nftData && !isLoadingNFT) {
      console.log('🎨 Setting NFT data from gameData:', gameData.nft)
      setNftData({
        contractAddress: gameData.nft.contractAddress,
        tokenId: gameData.nft.tokenId,
        name: gameData.nft.name,
        image: gameData.nft.image,
        collection: gameData.nft.collection,
        chain: gameData.nft.chain,
        metadata: {
          description: gameData.nft.description || '',
          attributes: gameData.nft.attributes || []
        }
      })
    }
  }, [gameData, nftData, isLoadingNFT])

  // Add effect to set coin data when loaded from contract
  useEffect(() => {
    console.log('🪙 Coin data effect triggered:', {
      hasGameData: !!gameData,
      hasCoinData: !!gameData?.coin,
      coinData: gameData?.coin
    })
    
    if (gameData?.coin) {
      console.log('🪙 Setting coin data from gameData:', gameData.coin)
      console.log('🪙 Coin details:', {
        id: gameData.coin.id,
        name: gameData.coin.name,
        headsImage: gameData.coin.headsImage,
        tailsImage: gameData.coin.tailsImage
      })
      setGameCoin(gameData.coin)
      setCustomHeadsImage(gameData.coin.headsImage)
      setCustomTailsImage(gameData.coin.tailsImage)
    } else {
      console.log('🪙 No coin data found in gameData')
      console.log('🪙 Full gameData:', gameData)
    }
  }, [gameData?.coin])

  // Add the missing fetchNFTData function
  const fetchNFTData = async (gameId) => {
    try {
      setIsLoadingNFT(true)
      console.log('🎨 Fetching NFT data for game:', gameId)
      const response = await fetch(`${API_URL}/api/games/${gameId}/nft`)
      if (!response.ok) throw new Error('Failed to fetch NFT data')
      const data = await response.json()
      console.log('✅ NFT data received:', data)
      setNftData(data)
    } catch (error) {
      console.error('❌ Error fetching NFT data:', error)
      setNftData(null)
    } finally {
      setIsLoadingNFT(false)
    }
  }

  // User input handlers - ONLY send to server
  const handlePowerChargeStart = () => {
    console.log('💥 handlePowerChargeStart called:', {
      isMyTurn,
      hasSocket: !!socket,
      isCharging: isChargingRef.current,
      gamePhase: gameState?.phase,
      currentPlayer: gameState?.currentPlayer,
      myAddress: address
    })
    
    // Only allow charging if player has made their choice and it's the charging phase
    if (!isMyTurn || !socket || isChargingRef.current) {
      console.log('❌ Cannot start charging:', {
        isMyTurn,
        hasSocket: !!socket,
        isCharging: isChargingRef.current
      })
      return
    }
    
    // Allow charging in both 'round_active' and after choosing
    if (gameState?.phase !== 'round_active' && gameState?.phase !== 'choosing') {
      console.log('❌ Wrong phase for charging:', gameState?.phase)
      return
    }
    
    // Check if player has made their choice
    const playerChoice = isCreator ? gameState?.creatorChoice : gameState?.joinerChoice
    if (!playerChoice) {
      showError('You must choose heads or tails first!')
      return
    }
    
    isChargingRef.current = true
    
    // Send start_charging immediately - no pre-calculation
    socket.send(JSON.stringify({
      type: 'start_charging',
      gameId,
      address
    }))
  }

  const handlePowerChargeStop = async () => {
    if (!socket || !isChargingRef.current) return
    
    isChargingRef.current = false
    
    // If contract service is available, use smart contract for flipping
    if (contractService.currentChain && gameData?.contract_game_id) {
      try {
        showInfo('Flipping coin on blockchain...')
        
        // Prepare flip parameters
        const flipParams = {
          gameId: gameData.contract_game_id,
          power: chargedPower || 50 // Use your existing power value
        }

        console.log('🪙 Flipping coin with smart contract:', flipParams)

        // Flip coin using smart contract
        const result = await contractService.flipCoin(flipParams)
        
        if (!result.success) {
          throw new Error('Failed to flip coin: ' + result.error)
        }

        console.log('✅ Coin flipped on blockchain:', result)

        // Update game state with new data from contract
        if (result.gameDetails) {
          const { game: contractGame, gameState } = result.gameDetails
          
          setGameData(prev => ({
            ...prev,
            current_round: gameState.currentRound,
            creator_wins: gameState.creatorWins,
            joiner_wins: gameState.joinerWins,
            winner: gameState.winner,
            status: gameState.winner !== '0x0000000000000000000000000000000000000000' ? 'completed' : 'active'
          }))

          // Update database
          await updateGameInDatabase({
            current_round: gameState.currentRound,
            creator_wins: gameState.creatorWins,
            joiner_wins: gameState.joinerWins,
            winner: gameState.winner,
            status: gameState.winner !== '0x0000000000000000000000000000000000000000' ? 'completed' : 'active',
            flip_transaction_hash: result.transactionHash
          })

          // Show flip result
          const isWinner = gameState.winner === address
          if (gameState.winner !== '0x0000000000000000000000000000000000000000') {
            showSuccess(`Game completed! ${isWinner ? 'You won!' : 'You lost!'}`)
          } else {
            showSuccess(`Round ${gameState.currentRound} completed!`)
          }
        }
        
      } catch (error) {
        console.error('❌ Error flipping coin:', error)
        showError('Failed to flip coin: ' + error.message)
        // Fallback to WebSocket if contract fails
        socket.send(JSON.stringify({
          type: 'stop_charging',
          gameId,
          address
        }))
      }
    } else {
      // Fallback to WebSocket if no contract
      socket.send(JSON.stringify({
        type: 'stop_charging',
        gameId,
        address
      }))
    }
  }

  const handlePlayerChoice = (choice) => {
    console.log('🎯 handlePlayerChoice called:', {
      choice,
      hasSocket: !!socket,
      hasGameState: !!gameState,
      gamePhase: gameState?.phase,
      isMyTurn: gameState?.currentPlayer === address,
      currentPlayer: gameState?.currentPlayer,
      myAddress: address,
      isCreator,
      isJoiner
    })

    if (!socket || !gameState) {
      console.log('❌ Cannot make choice - missing socket or gameState')
      showError('Connection error - please refresh')
      return
    }
    
    if (gameState.phase !== 'choosing') {
      console.log('❌ Cannot make choice - wrong phase:', gameState.phase)
      showError('Not in choosing phase')
      return
    }
    
    const isMyTurn = gameState.currentPlayer === address
    if (!isMyTurn) {
      console.log('❌ Not my turn:', { 
        currentPlayer: gameState.currentPlayer, 
        myAddress: address,
        isCreator,
        isJoiner
      })
      showError('Not your turn')
      return
    }
    
    // Show animation for player's choice
    setChoiceAnimationText(choice.toUpperCase())
    setChoiceAnimationColor('#00FF41') // Neon green
    setShowChoiceAnimation(true)
    
    // Hide animation after 1 second
    setTimeout(() => {
      setShowChoiceAnimation(false)
    }, 1000)
    
    console.log('🎯 Sending player choice to server:', choice)
    
    socket.send(JSON.stringify({
      type: 'player_choice',
      gameId,
      address,
      choice
    }))
  }

  const handleJoinGame = async () => {
    if (!isFullyConnected || !address) {
      showError('Please connect your wallet to join the game')
      return
    }

    if (!gameData) {
      showError('Game data not available')
      return
    }

    setJoiningGame(true)
    try {
      showInfo('Joining game...')

      // First, ensure contract service is initialized
      if (!contractService.isInitialized() && walletClient) {
        console.log('🔄 Reinitializing contract service...')
        const chainId = 8453 // Base network
        await contractService.initializeClients(chainId, walletClient)
        await new Promise(resolve => setTimeout(resolve, 1000)) // Longer delay for initialization
        
        // Double-check initialization
        if (!contractService.isInitialized()) {
          throw new Error('Failed to initialize contract service. Please reconnect your wallet.')
        }
      }

      // Prepare join parameters
      const joinParams = {
        gameId: gameId,
        paymentToken: 0, // 0 = ETH
        challengerNFTContract: null,
        challengerTokenId: null
      }

      console.log('🎮 Joining game with smart contract:', joinParams)

      // Try to join game using smart contract with retry logic
      let result
      let retryCount = 0
      const maxRetries = 2
      
      while (retryCount < maxRetries) {
        try {
          result = await contractService.joinGame(joinParams)
          break // Success, exit retry loop
        } catch (error) {
          retryCount++
          console.log(`🔄 Join game attempt ${retryCount}/${maxRetries} failed:`, error.message)
          
          if (error.message.includes('reinitialized') && retryCount < maxRetries) {
            // Try to reinitialize and retry
            console.log('🔄 Attempting to reinitialize contract service...')
            const chainId = 8453
            await contractService.initializeClients(chainId, walletClient)
            await new Promise(resolve => setTimeout(resolve, 1000))
            continue
          }
          
          if (error.message.includes('validation failed') && retryCount < maxRetries) {
            // Try to refresh wallet client and retry
            console.log('🔄 Attempting to refresh wallet client...')
            await contractService.refreshWalletClient(walletClient)
            await new Promise(resolve => setTimeout(resolve, 500))
            continue
          }
          
          if (retryCount >= maxRetries) {
            throw error
          }
        }
      }
      
      if (!result.success) {
        // If contract join fails, don't automatically fall back to database
        // This prevents issues with incorrect game state
        throw new Error(result.error || 'Failed to join game')
      }

      // Update database after successful blockchain join
      try {
        const response = await fetch(`${API_URL}/api/games/${gameId}/join`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            joinerAddress: address,
            paymentTxHash: result.transactionHash,
            paymentAmount: gameData.price_usd
          })
        })

        if (!response.ok) {
          const errorText = await response.text()
          console.warn('Failed to update database after join:', errorText)
        } else {
          console.log('✅ Database updated successfully after join')
        }
      } catch (dbError) {
        console.warn('Database update failed, but blockchain join succeeded:', dbError)
      }

      showSuccess('Successfully joined the game!')
      
      // Send WebSocket message to notify server that join is complete
      if (socket && socket.readyState === WebSocket.OPEN) {
        const joinMessage = {
          type: 'join_game',
          gameId,
          role: 'joiner',
          address,
          entryFeeHash: result.transactionHash
        }
        console.log('🎮 Sending join completion message to server:', joinMessage)
        socket.send(JSON.stringify(joinMessage))
      } else {
        console.warn('⚠️ Cannot send join completion message - socket not ready:', {
          hasSocket: !!socket,
          readyState: socket?.readyState
        })
      }
      
      // Reload game data to get updated state
      setTimeout(() => {
        loadGame()
      }, 2000)

    } catch (error) {
      console.error('❌ Error joining game:', error)
      showError(error.message || 'Failed to join game')
    } finally {
      setJoiningGame(false)
    }
  }

  // Add handleClaimWinnings function
  const handleClaimWinnings = async () => {
    if (!isFullyConnected || !address) {
      showError('Please connect your wallet to withdraw')
      return
    }

    try {
      showInfo('Processing withdrawal...')
      
      const result = await contractService.withdrawRewards()
      
      if (!result.success) {
        throw new Error('Failed to withdraw: ' + result.error)
      }

      showSuccess('Winnings withdrawn successfully! 🎉')
      console.log('✅ Withdrawal successful:', result)

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

  // Enhanced WebSocket message handler
  useEffect(() => {
    if (!socket) return

    const handleMessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        console.log('📡 Received WebSocket message:', data)
        
        switch (data.type) {
          case 'game_state':
            setGameState(data)
            // Update local join state from game state
            if (data.joinInProgress !== undefined) {
              setJoinInProgress(data.joinInProgress)
              setJoiningPlayer(data.joiningPlayer)
            }
            break

          case 'game_info':
            // Basic game info for non-players
            setJoinInProgress(data.joinInProgress || false)
            setJoiningPlayer(data.joiningPlayer || null)
            break

          case 'join_state_update':
            // Real-time join state updates
            setJoinInProgress(data.joinInProgress || false)
            setJoiningPlayer(data.joiningPlayer || null)
            // Update gameData if joiner changed
            if (data.joiner && data.joiner !== gameData?.joiner) {
              setGameData(prev => ({ ...prev, joiner: data.joiner }))
            }
            break

          case 'join_process_response':
            if (data.success) {
              showInfo('Join process started - processing payment...')
            } else {
              showError(data.error || 'Failed to start join process')
              setJoiningGame(false)
            }
            break
            
          case 'flip_animation':
            console.log('🎬 Flip animation received:', data)
            setFlipAnimation(data)
            setRoundResult(null)
            break
            
          case 'round_result':
            console.log('🏁 Round result received:', data)
            setRoundResult(data)
            setLastFlipResult(data.result)
            setFlipAnimation(null)
            setTimeout(() => setRoundResult(null), 4000)
            break

          // NFT offer handling
          case 'nft_offer_received':
            console.log('🎯 NFT offer received:', data.offer)
            setOfferedNFTs(prev => [...prev, data.offer])
            if (!isCreator) {
              showInfo(`New NFT battle offer: ${data.offer.nft.name}`)
            }
            break

          case 'nft_offer_accepted':
            console.log('✅ NFT offer accepted:', data.acceptedOffer)
            setAcceptedOffer(data.acceptedOffer)
            
            if (data.acceptedOffer.offererAddress === address) {
              showInfo('Your NFT offer was accepted! Please pay to join the battle.')
            }
            break

          case 'challenger_payment_confirmed':
            console.log('💰 Challenger payment confirmed')
            setChallengerPaid(true)
            showSuccess('Payment confirmed! Game starting...')
            break
            
          case 'error':
            console.log('❌ Error received:', data.error)
            showError(data.error)
            setJoiningGame(false)
            break

          case 'chat_message':
            // Only players receive chat messages now
            console.log('💬 Chat message received:', data)
            break
        }
      } catch (error) {
        console.error('❌ Error parsing WebSocket message:', error)
      }
    }

    socket.addEventListener('message', handleMessage)
    return () => socket.removeEventListener('message', handleMessage)
  }, [socket, address, gameData, isCreator, showError, showInfo, showSuccess])

  // NEW: Handle payment for accepted NFT offer
  const handlePaymentForAcceptedOffer = async (offer) => {
    try {
      showInfo('Your offer was accepted! Processing payment...')
      
      // Calculate 50¢ fee
      const feeUSD = 0.50
      const feeCalculation = await PaymentService.calculateETHFee(feeUSD)
      
      if (!feeCalculation.success) {
        throw new Error('Failed to calculate fee: ' + feeCalculation.error)
      }

      const feeAmountETH = feeCalculation.ethAmount
      const feeRecipient = PaymentService.getFeeRecipient()

      // Send transaction using walletClient
      const txResult = await PaymentService.sendTransaction(walletClient, feeRecipient, feeAmountETH.toString())
      
      if (!txResult.success) {
        throw new Error('Transaction failed: ' + txResult.error)
      }

      showInfo('Confirming payment...')
      
      // Wait for transaction confirmation
      let feeReceipt = null
      let attempts = 0
      while (!feeReceipt && attempts < 30) {
        await new Promise(resolve => setTimeout(resolve, 2000))
        try {
          feeReceipt = await publicClient.getTransactionReceipt({ hash: txResult.hash })
          if (feeReceipt) {
            showSuccess('Payment confirmed! Starting battle...')
            break
          }
        } catch (e) {
          // Transaction might not be mined yet
        }
        attempts++
      }
      
      if (!feeReceipt) {
        throw new Error('Transaction confirmation timeout')
      }

      // Update database with payment
      const response = await fetch(`${API_URL}/api/games/${gameId}/nft-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challengerAddress: address,
          paymentTxHash: feeReceipt.transactionHash,
          paymentAmount: feeUSD,
          acceptedOffer: offer
        })
      })

      if (!response.ok) {
        throw new Error('Failed to record payment')
      }

      // Notify via WebSocket that payment is complete
      if (socket) {
        socket.send(JSON.stringify({
          type: 'nft_payment_complete',
          gameId,
          challengerAddress: address,
          paymentTxHash: feeReceipt.transactionHash,
          acceptedOffer: offer
        }))
      }

    } catch (error) {
      console.error('❌ Payment failed:', error)
      showError('Payment failed: ' + error.message)
    }
  }

  // NEW: Handle NFT offer submission
  const handleOfferSubmitted = (offerData) => {
    console.log('📤 NFT offer submitted:', offerData)
    // The offer will be handled by WebSocket response
  }

  // NEW: Handle NFT offer acceptance
  const handleOfferAccepted = async (offer) => {
    try {
      showInfo('Accepting NFT challenge...')
      
      // Update database to record the accepted offer
      const response = await fetch(`${API_URL}/api/games/${gameId}/accept-nft-offer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creatorAddress: address,
          acceptedOffer: offer
        })
      })

      if (!response.ok) {
        throw new Error('Failed to accept offer')
      }

      showSuccess(`Challenge accepted! Waiting for ${offer.offererAddress.slice(0, 6)}... to pay.`)
      setAcceptedOffer(offer)
      
    } catch (error) {
      console.error('❌ Error accepting offer:', error)
      showError('Failed to accept offer: ' + error.message)
    }
  }

  // Add new useEffect for NFT vs NFT game detection
  useEffect(() => {
    if (gameData?.gameType === 'nft-vs-nft') {
      console.log('🎮 NFT vs NFT game detected')
      // If player is not creator and no offer exists, show offer button
      if (!isCreator && !offeredNFTs?.length) {
        setShowNFTOfferModal(true)
      }
    }
  }, [gameData, isCreator, offeredNFTs])

  // Add new handler for NFT offer submission
  const handleNFTOffer = async (selectedNFT) => {
    if (!connected || !selectedNFT) return
    
    try {
      const offerData = {
        type: 'nft_offer',
        gameId: gameId,
        offererAddress: address,
        nft: {
          contractAddress: selectedNFT.contractAddress,
          tokenId: selectedNFT.tokenId,
          name: selectedNFT.name,
          image: selectedNFT.image,
          collection: selectedNFT.collection,
          chain: selectedNFT.chain
        }
      }
      
      socket.send(JSON.stringify(offerData))
      setShowNFTOfferModal(false)
      setOfferStatus('pending')
      
      showInfo('NFT offer submitted successfully! Waiting for creator to review your offer...')
    } catch (error) {
      console.error('Error submitting NFT offer:', error)
      showError('Failed to submit NFT offer. Please try again.')
    }
  }

  // Add new handler for offer acceptance/rejection
  const handleOfferResponse = async (accepted) => {
    if (!isCreator || !pendingNFTOffer) return
    
    try {
      const responseData = {
        type: accepted ? 'accept_nft_offer' : 'reject_nft_offer',
        gameId: gameId,
        creatorAddress: address,
        offer: pendingNFTOffer
      }
      
      socket.send(JSON.stringify(responseData))
      setShowOfferReviewModal(false)
      
      if (accepted) {
        showInfo('Offer accepted! Waiting for challenger to join the game...')
      } else {
        showInfo('Offer rejected. The NFT offer has been rejected.')
      }
    } catch (error) {
      console.error('Error responding to offer:', error)
      showError('Failed to process offer response. Please try again.')
    }
  }

  // NFT Modal Handlers
  const handleNFTOfferAccepted = (offer) => {
    console.log('NFT offer accepted:', offer)
    setAcceptedOffer(offer)
    setShowNFTOfferModal(false)
    showSuccess('NFT offer accepted!')
  }

  const handleNFTOfferRejected = () => {
    console.log('NFT offer rejected')
    setShowNFTOfferModal(false)
    showInfo('NFT offer rejected')
  }

  const handleNFTVerificationComplete = (nft) => {
    console.log('NFT verification complete:', nft)
    setSelectedNFT(nft)
    setShowNFTVerificationModal(false)
    showSuccess('NFT verified successfully!')
  }

  const renderNFTOfferModal = () => {
    if (!showNFTOfferModal) return null

    return (
      <Modal>
        <ModalContent>
          <CloseButton onClick={() => setShowNFTOfferModal(false)}>×</CloseButton>
          <ModalHeader>
            <NeonText>NFT Offer</NeonText>
          </ModalHeader>
          <ModalBody>
            <NFTOfferComponent
              gameId={gameId}
              onOfferAccepted={handleNFTOfferAccepted}
              onOfferRejected={handleNFTOfferRejected}
            />
          </ModalBody>
        </ModalContent>
      </Modal>
    )
  }

  const renderNFTVerificationModal = () => {
    if (!showNFTVerificationModal) return null

    return (
      <Modal>
        <ModalContent>
          <CloseButton onClick={() => setShowNFTVerificationModal(false)}>×</CloseButton>
          <ModalHeader>
            <NeonText>NFT Verification</NeonText>
          </ModalHeader>
          <ModalBody>
            <NFTVerificationDisplay
              nft={selectedNFT}
              onVerificationComplete={handleNFTVerificationComplete}
            />
          </ModalBody>
        </ModalContent>
      </Modal>
    )
  }

  const renderNFTDetailsModal = () => {
    if (!showNFTDetailsModal || !selectedNFT) return null

    return (
      <Modal>
        <ModalContent>
          <CloseButton onClick={() => setShowNFTDetailsModal(false)}>×</CloseButton>
          <ModalHeader>
            <NeonText>NFT Details</NeonText>
          </ModalHeader>
          <ModalBody>
            <NFTImage src={selectedNFT.image} alt={selectedNFT.name} />
            <div>
              <h3>{selectedNFT.name}</h3>
              <p>Collection: {selectedNFT.collection}</p>
              <p>Token ID: {selectedNFT.tokenId}</p>
              <NFTLink href={selectedNFT.openseaUrl} target="_blank" rel="noopener noreferrer">
                View on OpenSea
              </NFTLink>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button onClick={() => setShowNFTDetailsModal(false)}>Close</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    )
  }

  const renderOfferReviewModal = () => {
    if (!showOfferReviewModal || !nftOffer) return null

    return (
      <Modal>
        <ModalContent>
          <CloseButton onClick={() => setShowOfferReviewModal(false)}>×</CloseButton>
          <ModalHeader>
            <NeonText>Review NFT Offer</NeonText>
          </ModalHeader>
          <ModalBody>
            <div>
              <h3>NFT Details</h3>
              <NFTImage src={nftOffer.image} alt={nftOffer.name} />
              <p>Name: {nftOffer.name}</p>
              <p>Collection: {nftOffer.collection}</p>
              <p>Token ID: {nftOffer.tokenId}</p>
              <NFTLink href={nftOffer.openseaUrl} target="_blank" rel="noopener noreferrer">
                View on OpenSea
              </NFTLink>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button onClick={() => {
              handleNFTOfferAccepted(nftOffer)
              setShowOfferReviewModal(false)
            }}>
              Accept Offer
            </Button>
            <Button onClick={() => {
              handleNFTOfferRejected()
              setShowOfferReviewModal(false)
            }}>
              Reject Offer
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
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
      <BackgroundVideo 
        ref={videoRef}
        autoPlay 
        loop 
        muted 
        playsInline
        preload="auto"
        onError={(e) => {
          console.error('Video error:', e);
          setVideoError(true);
        }}
      >
        <source src={isMobileScreen ? mobileVideo : hazeVideo} type="video/webm" />
      </BackgroundVideo>
      
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
          {/* Debug logging */}
          {console.log('🔍 Screen size debug:', { isMobileScreen, windowWidth: window.innerWidth })}
          
          {/* Mobile Layout - Only shows on mobile */}
          {screenSizeDetermined && isMobileScreen ? (
            <MobileOnlyLayout>

              {/* Mobile Bottom Navigation */}
              <MobileBottomNav>
                <MobileNavButton onClick={() => setIsInfoOpen(!isInfoOpen)}>
                  <span>ℹ️</span> Info
                </MobileNavButton>
                <MobileNavButton onClick={() => setIsChatOpen(!isChatOpen)}>
                  <span>💬</span> Chat
                </MobileNavButton>
                {!isPlayer && (() => {
                  const buttonState = getJoinButtonState()
                  return (
                    <MobileNavButton 
                      isJoinButton 
                      onClick={handleJoinGame}
                      disabled={buttonState.disabled}
                      style={{
                        background: buttonState.disabled ? 
                          'rgba(100, 100, 100, 0.5)' : 
                          buttonState.color === 'green' ? 'linear-gradient(45deg, #00FF41, #00BF31)' :
                          buttonState.color === 'yellow' ? 'linear-gradient(45deg, #FFD700, #FFA500)' :
                          buttonState.color === 'blue' ? 'linear-gradient(45deg, #00BFFF, #1E90FF)' :
                          'rgba(100, 100, 100, 0.5)',
                        opacity: buttonState.disabled ? 0.6 : 1
                      }}
                    >
                      {buttonState.text}
                    </MobileNavButton>
                  )
                })()}
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
                <MobileOptimizedCoin
                  isFlipping={!!flipAnimation}
                  flipResult={flipAnimation ? flipAnimation.result : (roundResult?.result || lastFlipResult)}
                  flipDuration={flipAnimation?.duration}
                  onPowerCharge={handlePowerChargeStart}
                  onPowerRelease={handlePowerChargeStop}
                  isPlayerTurn={isMyTurn}
                  isCharging={gameState?.chargingPlayer === address}
                  chargingPlayer={gameState?.chargingPlayer}
                  creatorPower={gameState?.creatorPower || 0}
                  joinerPower={gameState?.joinerPower || 0}
                  creatorChoice={gameState?.creatorChoice}
                  joinerChoice={gameState?.joinerChoice}
                  isCreator={isCreator}
                  size={187} // Smaller for optimization (1/3 reduction)
                  customHeadsImage={customHeadsImage || '/coins/plainh.png'}
                  customTailsImage={customTailsImage || '/coins/plaint.png'}
                />
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
                      onClick={() => window.open(getExplorerUrl(gameData?.chain), '_blank')}
                      style={{ flex: 1 }}
                    >
                      View on Explorer
                    </Button>
                    <Button
                      onClick={() => window.open(getMarketplaceUrl(gameData?.chain), '_blank')}
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

              {/* Chat - Moved to end */}
              <MobileHidden>
                <MobileChatBox>
                  <GameChatBox gameId={gameId} />
                </MobileChatBox>
              </MobileHidden>
            </MobileOnlyLayout>
          ) : (
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
                    <OptimizedGoldCoin
                      isFlipping={!!flipAnimation}
                      flipResult={flipAnimation ? flipAnimation.result : (roundResult?.result || lastFlipResult)}
                      flipDuration={flipAnimation?.duration}
                      onPowerCharge={handlePowerChargeStart}
                      onPowerRelease={handlePowerChargeStop}
                      isPlayerTurn={isMyTurn}
                      isCharging={gameState?.chargingPlayer === address}
                      chargingPlayer={gameState?.chargingPlayer}
                      gamePhase={gameState?.phase}
                      creatorPower={gameState?.creatorPower || 0}
                      joinerPower={gameState?.joinerPower || 0}
                      creatorChoice={gameState?.creatorChoice}
                      joinerChoice={gameState?.joinerChoice}
                      isCreator={isCreator}
                      size={440}
                      customHeadsImage={customHeadsImage || gameCoin?.headsImage || '/coins/plainh.png'}
                      customTailsImage={customTailsImage || gameCoin?.tailsImage || '/coins/plaint.png'}
                    />
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
                        href={`${getExplorerUrl(nftData?.chain)}/token/${nftData.contractAddress}?a=${nftData.tokenId}`}
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
                        href={`${getMarketplaceUrl(nftData?.chain)}/${nftData.contractAddress}/${nftData.tokenId}`}
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
                {/* Enhanced Join Button */}
                {!isPlayer && (
                  <div style={{
                    marginTop: '2rem',
                    textAlign: 'center'
                  }}>
                    {(() => {
                      const buttonState = getJoinButtonState()
                      const getButtonColor = () => {
                        switch (buttonState.color) {
                          case 'green': return 'linear-gradient(45deg, #00FF41, #00BF31)'
                          case 'yellow': return 'linear-gradient(45deg, #FFD700, #FFA500)'
                          case 'blue': return 'linear-gradient(45deg, #00BFFF, #1E90FF)'
                          case 'red': return 'linear-gradient(45deg, #FF4444, #CC0000)'
                          default: return 'rgba(100, 100, 100, 0.5)'
                        }
                      }
                      
                      return (
                        <button
                          onClick={handleJoinGame}
                          disabled={buttonState.disabled}
                          style={{
                            background: buttonState.disabled ? 
                              'rgba(100, 100, 100, 0.5)' : 
                              getButtonColor(),
                            color: '#fff',
                            border: 'none',
                            padding: '1.5rem 3rem',
                            borderRadius: '1rem',
                            fontSize: '1.3rem',
                            fontWeight: 'bold',
                            cursor: buttonState.disabled ? 'not-allowed' : 'pointer',
                            width: '100%',
                            transition: 'all 0.3s ease',
                            opacity: buttonState.disabled ? 0.6 : 1,
                            boxShadow: !buttonState.disabled ? '0 0 20px rgba(0, 255, 65, 0.3)' : 'none'
                          }}
                        >
                          {buttonState.text}
                        </button>
                      )
                    })()}
                  </div>
                )}
              </div>
            </DesktopOnlyLayout>
          )}

          {/* NFT vs NFT Offer Component */}
          {isNFTGame && gameState?.phase === 'waiting' && (
            <div style={{ gridColumn: '1 / -1', marginTop: '2rem' }}>
              <NFTOfferComponent
                gameId={gameId}
                gameData={gameData}
                isCreator={isCreator}
                socket={socket}
                connected={connected}
                offeredNFTs={offeredNFTs}
                onOfferSubmitted={handleOfferSubmitted}
                onOfferAccepted={handleOfferAccepted}
              />
            </div>
          )}

          {/* Show accepted offer status */}
          {isNFTGame && acceptedOffer && gameState?.phase === 'waiting' && (
            <div style={{
              gridColumn: '1 / -1',
              marginTop: '1rem',
              textAlign: 'center',
              padding: '1rem',
              background: 'rgba(255, 215, 0, 0.1)',
              border: '1px solid rgba(255, 215, 0, 0.3)',
              borderRadius: '1rem'
            }}>
              <h3 style={{ color: '#FFD700', marginBottom: '0.5rem' }}>
                ⚔️ BATTLE ACCEPTED!
              </h3>
              <p style={{ color: 'white', margin: 0 }}>
                Waiting for {acceptedOffer.offererAddress.slice(0, 6)}...{acceptedOffer.offererAddress.slice(-4)} to complete payment...
              </p>
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '2rem',
                marginTop: '1rem',
                alignItems: 'center'
              }}>
                <div style={{ textAlign: 'center' }}>
                  <img
                    src={gameData.nft.image}
                    alt={gameData.nft.name}
                    style={{
                      width: '80px',
                      height: '80px',
                      borderRadius: '0.5rem',
                      objectFit: 'cover',
                      marginBottom: '0.5rem'
                    }}
                  />
                  <div style={{ fontSize: '0.8rem', color: 'white' }}>
                    {gameData.nft.name}
                  </div>
                </div>
                
                <div style={{
                  fontSize: '2rem',
                  color: '#FFD700',
                  animation: 'pulse 2s infinite'
                }}>
                  ⚔️
                </div>
                
                <div style={{ textAlign: 'center' }}>
                  <img
                    src={acceptedOffer.nft.image}
                    alt={acceptedOffer.nft.name}
                    style={{
                      width: '80px',
                      height: '80px',
                      borderRadius: '0.5rem',
                      objectFit: 'cover',
                      marginBottom: '0.5rem'
                    }}
                  />
                  <div style={{ fontSize: '0.8rem', color: 'white' }}>
                    {acceptedOffer.nft.name}
                  </div>
                </div>
              </div>
            </div>
          )}

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

          {/* Show NFT offer button for non-creators in NFT vs NFT games */}
          {gameData?.gameType === 'nft-vs-nft' && !isCreator && !offeredNFTs?.length && (
            <Button
              colorScheme="green"
              size="lg"
              onClick={() => setShowNFTOfferModal(true)}
              mb={4}
            >
              Offer NFT to Battle
            </Button>
          )}
          
          {/* Show offer status for challengers */}
          {gameData?.gameType === 'nft-vs-nft' && !isCreator && offerStatus === 'pending' && (
            <Text color="neonYellow" mb={4}>
              Your NFT offer is pending review...
            </Text>
          )}
          
          {/* Show join button after offer is accepted */}
          {gameData?.gameType === 'nft-vs-nft' && !isCreator && offerStatus === 'accepted' && (
            <Button
              colorScheme="green"
              size="lg"
              onClick={handleJoinGame}
              mb={4}
            >
              Join Battle
            </Button>
          )}

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
      
      {/* Add new modals */}
      {renderNFTOfferModal()}
      {renderNFTVerificationModal()}
      {renderNFTDetailsModal()}
      {renderOfferReviewModal()}
    </ThemeProvider>
  )
}

// Add helper functions for chain URLs
const getExplorerUrl = (chain) => {
  if (!chain) return 'https://etherscan.io' // Default to Ethereum explorer
  
  const explorers = {
    ethereum: 'https://etherscan.io',
    polygon: 'https://polygonscan.com',
    base: 'https://basescan.org',
    arbitrum: 'https://arbiscan.io',
    optimism: 'https://optimistic.etherscan.io',
    // Add more chains as needed
  }
  return explorers[chain.toLowerCase()] || 'https://etherscan.io'
}

const getMarketplaceUrl = (chain) => {
  if (!chain) return 'https://opensea.io/assets/ethereum' // Default to Ethereum marketplace
  
  const marketplaces = {
    ethereum: 'https://opensea.io/assets/ethereum',
    polygon: 'https://opensea.io/assets/matic',
    base: 'https://opensea.io/assets/base',
    arbitrum: 'https://opensea.io/assets/arbitrum',
    optimism: 'https://opensea.io/assets/optimism',
    // Add more chains as needed
  }
  return marketplaces[chain.toLowerCase()] || 'https://opensea.io/assets/ethereum'
}

export default FlipGame