import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useWallet } from '../contexts/WalletContext'
import { useToast } from '../contexts/ToastContext'
import { useProfile } from '../contexts/ProfileContext'
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
import PowerDisplay from '../components/PowerDisplay'
import PaymentService from '../services/PaymentService'
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
  gap: 0.5rem;
  padding: 1rem;
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
  padding: 0.75rem;
  border-radius: 0.75rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: ${props => props.isJoinButton ? 'linear-gradient(45deg, #FF1493, #FF69B4)' : 'rgba(255, 255, 255, 0.05)'};
  color: white;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: ${props => props.isJoinButton ? '0 0 20px rgba(255, 20, 147, 0.5)' : '0 0 10px rgba(255, 255, 255, 0.2)'};
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
  bottom: ${props => props.isOpen ? '80px' : '-100%'};
  left: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.95);
  backdrop-filter: blur(10px);
  padding: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  transition: bottom 0.3s ease;
  z-index: 999;
  max-height: 80vh;
  overflow-y: auto;

  @media (min-width: 769px) {
    display: none;
  }
`

const MobileChatPanel = styled.div`
  position: fixed;
  bottom: ${props => props.isOpen ? '80px' : '-100%'};
  left: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.95);
  backdrop-filter: blur(10px);
  padding: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  transition: bottom 0.3s ease;
  z-index: 999;
  height: 60vh;

  @media (min-width: 769px) {
    display: none;
  }
`

const FlipGame = () => {
  const { gameId } = useParams()
  const navigate = useNavigate()
  const { publicClient, isMobile } = useWallet()
  const { showSuccess, showError, showInfo } = useToast()
  const { getCoinHeadsImage, getCoinTailsImage } = useProfile()
  const { isFullyConnected, connectionError, address, walletClient } = useWalletConnection()

  // API URL
  const API_URL = 'https://cryptoflipz2-production.up.railway.app'

  // Local state - ONLY for non-game logic
  const [gameData, setGameData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [joiningGame, setJoiningGame] = useState(false)

  // WebSocket state - SINGLE SOURCE OF TRUTH for game
  const [socket, setSocket] = useState(null)
  const [connected, setConnected] = useState(false)
  const [gameState, setGameState] = useState(null)
  const [flipAnimation, setFlipAnimation] = useState(null)
  const [roundResult, setRoundResult] = useState(null)
  const [lastFlipResult, setLastFlipResult] = useState(null) // Track the last flip result

  // Custom coin images
  const [customHeadsImage, setCustomHeadsImage] = useState(null)
  const [customTailsImage, setCustomTailsImage] = useState(null)

  // Refs for user input
  const isChargingRef = useRef(false)

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
  const [isNFTGame, setIsNFTGame] = useState(false)

  // Add new state variables
  const [showNFTOfferModal, setShowNFTOfferModal] = useState(false)
  const [showNFTVerificationModal, setShowNFTVerificationModal] = useState(false)
  const [showNFTDetailsModal, setShowNFTDetailsModal] = useState(false)
  const [showOfferReviewModal, setShowOfferReviewModal] = useState(false)
  const [selectedNFT, setSelectedNFT] = useState(null)
  const [nftOffer, setNftOffer] = useState(null)

  // Add new state variables for choice animation
  const [showChoiceAnimation, setShowChoiceAnimation] = useState(false)
  const [choiceAnimationText, setChoiceAnimationText] = useState('')
  const [choiceAnimationColor, setChoiceAnimationColor] = useState('')

  // Add state for auto-flip animation
  const [showAutoFlipAnimation, setShowAutoFlipAnimation] = useState(false)
  const previousTurnTimeLeftRef = useRef(null)

  const videoRef = useRef(null);
  const [videoError, setVideoError] = useState(false);

  const [isInfoOpen, setIsInfoOpen] = useState(false)
  const [isChatOpen, setIsChatOpen] = useState(false)

  // Add screen size detection
  const [isMobileScreen, setIsMobileScreen] = useState(false)

  // Load custom coin images when address changes
  useEffect(() => {
    const loadCustomCoinImages = async () => {
      if (!address) return;
      
      try {
        const headsImage = await getCoinHeadsImage(address);
        const tailsImage = await getCoinTailsImage(address);
        setCustomHeadsImage(headsImage);
        setCustomTailsImage(tailsImage);
      } catch (error) {
        console.error('Error loading custom coin images:', error);
      }
    };

    loadCustomCoinImages();
  }, [address, getCoinHeadsImage, getCoinTailsImage]);

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
      setIsMobileScreen(window.innerWidth <= 768)
    }
    
    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)
    
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])

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
      const wsUrl = process.env.NODE_ENV === 'production' 
        ? 'wss://cryptoflipz2-production.up.railway.app' 
        : 'ws://localhost:3001'
      
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
                joiner: data.joiner
              })
              setGameState(data)
              
              // Show opponent's choice animation if they just made a choice
              if (data.phase === 'round_active' && 
                  ((isCreator && data.joinerChoice) || (isJoiner && data.creatorChoice))) {
                const opponentChoice = isCreator ? data.joinerChoice : data.creatorChoice
                setChoiceAnimationText(opponentChoice.toUpperCase())
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
  useEffect(() => {
    const loadGame = async () => {
      try {
        setLoading(true)
        const response = await fetch(`${API_URL}/api/games/${gameId}`)
        
        if (response.ok) {
          const dbGame = await response.json()
          
          const gameData = {
            id: dbGame.id,
            creator: dbGame.creator,
            joiner: dbGame.joiner,
            nft: {
              contractAddress: dbGame.nft_contract,
              tokenId: dbGame.nft_token_id,
              name: dbGame.nft_name,
              image: dbGame.nft_image || 'https://picsum.photos/300/300?random=' + dbGame.id,
              collection: dbGame.nft_collection,
              chain: dbGame.nft_chain
            },
            price: dbGame.price_usd,
            priceUSD: dbGame.price_usd,
            rounds: dbGame.rounds,
            status: dbGame.status
          }
          
          setGameData(gameData)
        } else {
          throw new Error('Game not found')
        }
      } catch (error) {
        console.error('❌ Error loading game:', error)
        showError('Game not found')
        navigate('/')
      } finally {
        setLoading(false)
      }
    }

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

  const handlePowerChargeStop = () => {
    if (!socket || !isChargingRef.current) return
    
    isChargingRef.current = false
    socket.send(JSON.stringify({
      type: 'stop_charging',
      gameId,
      address
    }))
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
    console.log('🔍 Join game attempt:', {
      hasGameData: !!gameData,
      hasWalletClient: !!walletClient,
      hasAddress: !!address,
      isJoining: joiningGame,
      isFullyConnected: isFullyConnected,
      connectionError
    })

    if (!gameData || !walletClient || !address || joiningGame || !isFullyConnected) {
      console.log('❌ Cannot join game:', { 
        hasGameData: !!gameData, 
        hasWalletClient: !!walletClient, 
        hasAddress: !!address, 
        isJoining: joiningGame,
        isFullyConnected: isFullyConnected
      })
      showError(connectionError || 'Please ensure your wallet is connected properly')
      return
    }

    try {
      setJoiningGame(true)
      showInfo('Processing payment...')
      
      const paymentResult = await PaymentService.calculateETHAmount(gameData.priceUSD)
      
      // Use walletClient for transaction
      const feeRecipient = PaymentService.getFeeRecipient()
      
      // Send transaction using walletClient
      const txResult = await PaymentService.sendTransaction(walletClient, feeRecipient, paymentResult.ethAmount.toString())
      
      if (!txResult.success) {
        throw new Error('Transaction failed: ' + txResult.error)
      }
      
      showInfo('Confirming payment...')
      
      // Wait for transaction confirmation
      let receipt = null
      let attempts = 0
      while (!receipt && attempts < 30) {
        await new Promise(resolve => setTimeout(resolve, 2000))
        try {
          receipt = await publicClient.getTransactionReceipt({ hash: txResult.hash })
          if (receipt) {
            console.log('✅ Payment confirmed:', receipt.transactionHash)
            break
          }
        } catch (e) {
          // Transaction might not be mined yet
        }
        attempts++
      }
      
      if (!receipt) {
        throw new Error('Transaction confirmation timeout')
      }
      
      // Update game in database first
      const joinResponse = await fetch(`${API_URL}/api/games/${gameData.id}/simple-join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          joinerAddress: address,
          paymentTxHash: receipt.transactionHash,
          paymentAmount: gameData.priceUSD
        })
      })
      
      if (!joinResponse.ok) {
        const error = await joinResponse.json()
        throw new Error(error.error || 'Failed to join game')
      }
      
      // Update local state
      setGameData(prev => ({ ...prev, joiner: address, status: 'joined' }))
      
      // Tell server via WebSocket
      if (socket) {
        socket.send(JSON.stringify({
          type: 'join_game',
          gameId,
          role: 'joiner',
          address,
          entryFeeHash: receipt.transactionHash
        }))
      }
      
      showSuccess('Successfully joined the game!')
        
    } catch (error) {
      console.error('❌ Failed to join game:', error)
      showError('Failed to join: ' + error.message)
    } finally {
      setJoiningGame(false)
    }
  }

  // Add handleClaimWinnings function
  const handleClaimWinnings = async () => {
    try {
      showInfo('Claiming winnings... (Contract integration coming soon)')
      // TODO: Add contract integration here
      // For now, just show success and navigate home
      setTimeout(() => {
        showSuccess('Winnings claimed successfully!')
        setShowResultPopup(false)
        navigate('/')
      }, 2000)
    } catch (error) {
      showError('Failed to claim winnings: ' + error.message)
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

  // Enhanced WebSocket message handler (add to existing useEffect)
  useEffect(() => {
    if (!socket) return

    const handleMessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        console.log('📡 Received WebSocket message:', data)
        
        switch (data.type) {
          case 'game_state':
            setGameState(data)
            break
            
          case 'flip_animation':
            setFlipAnimation(data)
            setRoundResult(null)
            break
            
          case 'round_result':
            setRoundResult(data)
            setLastFlipResult(data.result) // Save the last flip result
            setFlipAnimation(null) // Clear the animation so coin uses roundResult
            setTimeout(() => setRoundResult(null), 4000)
            break

          // NEW: Handle NFT offers
          case 'nft_offer_received':
            console.log('🎯 NFT offer received:', data.offer)
            setOfferedNFTs(prev => [...prev, data.offer])
            if (!isCreator) {
              showInfo(`New NFT battle offer: ${data.offer.nft.name}`)
            }
            break

          // NEW: Handle offer acceptance
          case 'nft_offer_accepted':
            console.log('✅ NFT offer accepted:', data.acceptedOffer)
            setAcceptedOffer(data.acceptedOffer)
            
            // Show payment prompt to the challenger
            if (data.acceptedOffer.offererAddress === address) {
              handlePaymentForAcceptedOffer(data.acceptedOffer)
            }
            break

          // NEW: Handle game start after NFT payment
          case 'nft_game_ready':
            console.log('🎮 NFT game ready to start')
            showSuccess('Battle payment confirmed! Game starting...')
            break
            
          case 'error':
            showError(data.error)
            break
        }
      } catch (error) {
        console.error('❌ Error parsing WebSocket message:', error)
      }
    }

    socket.addEventListener('message', handleMessage)
    return () => socket.removeEventListener('message', handleMessage)
  }, [socket, address, isCreator])

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

  const canJoin = gameData && 
                  !gameData.joiner && 
                  gameData.creator !== address && 
                  gameData.status === 'waiting' &&
                  isFullyConnected

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
          {isMobileScreen ? (
            <MobileOnlyLayout>
              {/* Join Game Button - Top Priority */}
              {canJoin && (
                <div style={{
                  position: 'sticky',
                  top: '0',
                  zIndex: 100,
                  padding: '1rem',
                  background: 'rgba(0, 0, 0, 0.9)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: '0 0 1rem 1rem',
                  marginBottom: '1rem'
                }}>
                  <Button
                    onClick={handleJoinGame}
                    disabled={joiningGame}
                    style={{
                      width: '100%',
                      padding: '1rem',
                      fontSize: '1.2rem',
                      fontWeight: 'bold',
                      background: 'linear-gradient(45deg, #00FF41, #39FF14)',
                      color: '#000',
                      border: 'none',
                      borderRadius: '0.75rem',
                      boxShadow: '0 0 20px rgba(0, 255, 65, 0.5)'
                    }}
                  >
                    {joiningGame ? 'Joining...' : 'JOIN FLIP'}
                  </Button>
                </div>
              )}

              {/* Mobile Bottom Navigation */}
              <MobileBottomNav>
                <MobileNavButton onClick={() => setIsInfoOpen(!isInfoOpen)}>
                  <span>ℹ️</span> Info
                </MobileNavButton>
                <MobileNavButton onClick={() => setIsChatOpen(!isChatOpen)}>
                  <span>💬</span> Chat
                </MobileNavButton>
                {canJoin && (
                  <MobileNavButton 
                    isJoinButton 
                    onClick={handleJoinGame}
                    disabled={joiningGame || !isFullyConnected}
                  >
                    {joiningGame ? '⏳ Joining...' : 'Join Flip'}
                  </MobileNavButton>
                )}
              </MobileBottomNav>

              {/* Mobile Info Panel */}
              <MobileInfoPanel isOpen={isInfoOpen}>
                <div style={{ marginBottom: '1rem' }}>
                  <h3 style={{ color: theme.colors.neonYellow, marginBottom: '0.5rem' }}>Game Info</h3>
                  <div style={{ color: theme.colors.textSecondary }}>
                    {/* Entry Fee */}
                    <div style={{ 
                      padding: '0.75rem',
                      background: 'rgba(255, 255, 255, 0.05)',
                      borderRadius: '0.75rem',
                      marginBottom: '1rem'
                    }}>
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '0.5rem'
                      }}>
                        <span>Cost:</span>
                        <span style={{ 
                          color: theme.colors.neonGreen,
                          fontWeight: 'bold'
                        }}>
                          ${(gameData?.priceUSD || 0).toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* Contract Info */}
                    <div style={{ 
                      padding: '0.75rem',
                      background: 'rgba(255, 255, 255, 0.05)',
                      borderRadius: '0.75rem',
                      marginBottom: '1rem'
                    }}>
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '0.5rem'
                      }}>
                        <span>Contract:</span>
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
                          margin: '1rem 0',
                          padding: '1rem',
                          background: 'rgba(255, 255, 255, 0.05)',
                          borderRadius: '0.75rem',
                          border: '1px solid rgba(255, 255, 255, 0.1)'
                        }}>
                          <img 
                            src={gameData.nft.image} 
                            alt={gameData.nft.name}
                            style={{
                              width: '100%',
                              maxWidth: '200px',
                              height: 'auto',
                              borderRadius: '0.5rem',
                              margin: '0 auto',
                              display: 'block'
                            }}
                          />
                          <p style={{ marginTop: '0.5rem', textAlign: 'center' }}>{gameData.nft.name}</p>
                          <p style={{ fontSize: '0.9rem', opacity: 0.8 }}>Collection: {gameData.nft.collection}</p>
                          <p style={{ fontSize: '0.9rem', opacity: 0.8 }}>Token ID: {gameData.nft.tokenId}</p>
                        </div>
                        <div style={{
                          display: 'flex',
                          gap: '0.5rem',
                          marginTop: '0.5rem',
                          justifyContent: 'center'
                        }}>
                          <Button 
                            onClick={() => window.open(`https://opensea.io/assets/${gameData.nft.contract}/${gameData.nft.tokenId}`, '_blank')}
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
                              transition: 'all 0.3s ease',
                              flex: 1,
                              justifyContent: 'center'
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
                          </Button>
                          <Button 
                            onClick={() => window.open(`https://etherscan.io/token/${gameData.nft.contract}?a=${gameData.nft.tokenId}`, '_blank')}
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
                              transition: 'all 0.3s ease',
                              flex: 1,
                              justifyContent: 'center'
                            }}
                          >
                            <span style={{ fontSize: '1rem' }}>🔍</span>
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

              {/* Player 1 Box */}
              <MobilePlayerBox style={{
                background: isCreator ? 'rgba(255, 20, 147, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                border: `2px solid ${isCreator ? '#FF1493' : 'rgba(255, 255, 255, 0.1)'}`
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '0.75rem'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <div style={{
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      background: isCreator ? '#FF1493' : '#666',
                      boxShadow: isCreator ? '0 0 10px #FF1493' : 'none'
                    }} />
                    <div style={{
                      color: theme.colors.textPrimary,
                      fontWeight: 'bold',
                      fontSize: '1rem'
                    }}>
                      {gameState?.creatorProfile?.name || 'Player 1'} {isCreator && '(You)'}
                    </div>
                  </div>
                  <div style={{
                    fontSize: '0.9rem',
                    color: theme.colors.textSecondary,
                    fontFamily: 'monospace'
                  }}>
                    {gameData?.creator ? 
                      `${gameData.creator.slice(0, 6)}...${gameData.creator.slice(-4)}` : 
                      'Waiting...'
                    }
                  </div>
                </div>

                {/* Rounds Display for Player 1 */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.75rem',
                  background: 'rgba(0, 0, 0, 0.3)',
                  borderRadius: '0.5rem',
                  marginBottom: '0.5rem'
                }}>
                  <span style={{ fontSize: '0.9rem', color: theme.colors.textSecondary }}>
                    Rounds Won:
                  </span>
                  <div style={{ display: 'flex', gap: '0.25rem' }}>
                    {[1, 2, 3, 4, 5].map(round => (
                      <div
                        key={`p1-round-${round}`}
                        style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          background: (gameState?.creatorWins || 0) >= round ? 
                            'linear-gradient(45deg, #FFD700, #FFA500)' : 
                            'rgba(255, 255, 255, 0.1)',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.7rem',
                          fontWeight: 'bold',
                          color: (gameState?.creatorWins || 0) >= round ? '#000' : '#666'
                        }}
                      >
                        {round}
                      </div>
                    ))}
                  </div>
                </div>
              </MobilePlayerBox>

              {/* MOBILE COIN */}
              <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center',
                margin: '1rem 0',
                padding: '1rem'
              }}>
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
                  size={280} // Smaller size for mobile
                  customHeadsImage={customHeadsImage}
                  customTailsImage={customTailsImage}
                />
              </div>

              {/* Player 2 Box - Moved below coin */}
              <MobilePlayerBox style={{
                background: isJoiner ? 'rgba(0, 191, 255, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                border: `2px solid ${isJoiner ? '#00BFFF' : 'rgba(255, 255, 255, 0.1)'}`
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '0.75rem'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <div style={{
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      background: isJoiner ? '#00BFFF' : '#666',
                      boxShadow: isJoiner ? '0 0 10px #00BFFF' : 'none'
                    }} />
                    <div style={{
                      color: theme.colors.textPrimary,
                      fontWeight: 'bold',
                      fontSize: '1rem'
                    }}>
                      {gameState?.joinerProfile?.name || 'Player 2'} {isJoiner && '(You)'}
                    </div>
                  </div>
                  <div style={{
                    fontSize: '0.9rem',
                    color: theme.colors.textSecondary,
                    fontFamily: 'monospace'
                  }}>
                    {gameData?.joiner ? 
                      `${gameData.joiner.slice(0, 6)}...${gameData.joiner.slice(-4)}` : 
                      'Waiting...'
                    }
                  </div>
                </div>

                {/* Rounds Display for Player 2 */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.75rem',
                  background: 'rgba(0, 0, 0, 0.3)',
                  borderRadius: '0.5rem',
                  marginBottom: '0.5rem'
                }}>
                  <span style={{ fontSize: '0.9rem', color: theme.colors.textSecondary }}>
                    Rounds Won:
                  </span>
                  <div style={{ display: 'flex', gap: '0.25rem' }}>
                    {[1, 2, 3, 4, 5].map(round => (
                      <div
                        key={`p2-round-${round}`}
                        style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          background: (gameState?.joinerWins || 0) >= round ? 
                            'linear-gradient(45deg, #FFD700, #FFA500)' : 
                            'rgba(255, 255, 255, 0.1)',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.7rem',
                          fontWeight: 'bold',
                          color: (gameState?.joinerWins || 0) >= round ? '#000' : '#666'
                        }}
                      >
                        {round}
                      </div>
                    ))}
                  </div>
                </div>
              </MobilePlayerBox>

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
                    borderRadius: '0.75rem',
                    border: `2px solid ${isCreator ? theme.colors.neonPink : 'rgba(255, 255, 255, 0.1)'}`
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem'
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
                      <div>
                      <div style={{
                          fontSize: '0.9rem', 
                          opacity: 0.8,
                          color: theme.colors.neonPink 
                        }}>
                          💎 {gameState?.creatorProfile?.name || 'Player 1'} {gameState?.creatorChoice && `(${gameState.creatorChoice.toUpperCase()})`}
                        </div>
                        <div style={{ fontWeight: 'bold', fontSize: '1rem' }}>
                          {gameState?.creatorProfile?.name || 
                           (gameData?.creator ? 
                             `${gameData.creator.slice(0, 8)}...${gameData.creator.slice(-4)}` : 
                             'Waiting...'
                           )}
                        </div>
                      </div>
                    </div>

                    {/* Timer - only show for current player */}
                    {gameState?.currentPlayer === gameData?.creator && gameState?.turnTimeLeft !== undefined && (
                      <div style={{
                        background: theme.colors.neonPink,
                        color: '#000',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '0.5rem',
                        fontSize: '0.8rem',
                        fontWeight: 'bold',
                        animation: gameState.turnTimeLeft <= 5 ? 'pulse 1s infinite' : 'none'
                      }}>
                        {gameState.turnTimeLeft}s
                      </div>
                    )}
                    
                    {gameState?.currentPlayer === gameData?.creator && !gameState?.turnTimeLeft && (
                      <div style={{
                        background: theme.colors.neonPink,
                        color: '#000',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '0.5rem',
                        fontSize: '0.8rem',
                        fontWeight: 'bold'
                      }}>
                        {isCreator ? 'YOUR TURN' : 'THEIR TURN'}
                    </div>
                    )}
                  </div>

                  {/* Round Wins for Player 1 */}
                    <div style={{
                    display: 'flex',
                    gap: '0.25rem',
                    justifyContent: 'center',
                    marginBottom: '1rem'
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
                          case 'creator_won': return isCreator ? '#00FF41' : '#FF1493'; // Green if you won, pink if you lost
                          case 'joiner_won': return !isCreator ? '#00FF41' : '#FF1493'; // Green if you won, pink if you lost
                          default: return 'rgba(255, 255, 255, 0.2)'; // Gray for pending
                        }
                      };
                      
                      const getShadowColor = () => {
                        switch (roundStatus) {
                          case 'current': return '0 0 10px #FFFF00, 0 0 20px #FFFF00';
                          case 'creator_won': return isCreator ? '0 0 10px #00FF41, 0 0 20px #00FF41' : '0 0 10px #FF1493, 0 0 20px #FF1493';
                          case 'joiner_won': return !isCreator ? '0 0 10px #00FF41, 0 0 20px #00FF41' : '0 0 10px #FF1493, 0 0 20px #FF1493';
                          default: return 'none';
                        }
                      };

                      const getTextColor = () => {
                        switch (roundStatus) {
                          case 'current': return '#000000';
                          case 'creator_won': return isCreator ? '#000000' : '#000000';
                          case 'joiner_won': return !isCreator ? '#000000' : '#000000';
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

                    {/* Timer Display */}
                    {gameState?.turnTimeLeft !== undefined && (
                      <div style={{
                        textAlign: 'center',
                        marginTop: '0.5rem',
                        color: gameState.turnTimeLeft <= 5 ? '#FF1493' : '#FFFF00',
                        fontSize: '1.2rem',
                        fontWeight: 'bold',
                        animation: gameState.turnTimeLeft <= 5 ? 'pulse 1s infinite' : 'none'
                      }}>
                        {gameState.turnTimeLeft}s
                      </div>
                    )}
                  
                  {/* Player 2 */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.75rem',
                    background: isJoiner ? 'rgba(0, 191, 255, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '0.75rem',
                    border: `2px solid ${isJoiner ? theme.colors.neonBlue : 'rgba(255, 255, 255, 0.1)'}`
                  }}>
                    <div style={{
                      display: 'flex',
                    alignItems: 'center',
                      gap: '0.75rem'
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
                      <div>
                        <div style={{ 
                          fontSize: '0.9rem', 
                          opacity: 0.8,
                          color: theme.colors.neonBlue 
                        }}>
                          💎 {gameState?.joinerProfile?.name || 'Player 2'} {gameState?.joinerChoice && `(${gameState.joinerChoice.toUpperCase()})`}
                        </div>
                        <div style={{ fontWeight: 'bold', fontSize: '1rem' }}>
                          {gameState?.joinerProfile?.name || 
                           (gameData?.joiner ? 
                             `${gameData.joiner.slice(0, 8)}...${gameData.joiner.slice(-4)}` : 
                             'Waiting...'
                           )}
                        </div>
                      </div>
                    </div>

                    {/* Timer - only show for current player */}
                    {gameState?.currentPlayer === gameData?.joiner && gameState?.turnTimeLeft !== undefined && (
                      <div style={{
                        background: theme.colors.neonBlue,
                        color: '#000',
                        padding: '0.25rem 0.75rem',
                    borderRadius: '0.5rem',
                        fontSize: '0.8rem',
                        fontWeight: 'bold',
                        animation: gameState.turnTimeLeft <= 5 ? 'pulse 1s infinite' : 'none'
                      }}>
                        {gameState.turnTimeLeft}s
                      </div>
                    )}
                    
                    {gameState?.currentPlayer === gameData?.joiner && !gameState?.turnTimeLeft && (
                      <div style={{
                        background: theme.colors.neonBlue,
                        color: '#000',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '0.5rem',
                        fontSize: '0.8rem',
                        fontWeight: 'bold'
                      }}>
                        {isJoiner ? 'YOUR TURN' : 'THEIR TURN'}
                      </div>
                    )}
                  </div>

                  {/* Round Wins for Player 2 */}
                  <div style={{
                    display: 'flex',
                    gap: '0.25rem',
                    justifyContent: 'center',
                    marginTop: '1rem'
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
                          case 'creator_won': return isCreator ? '#00FF41' : '#FF1493'; // Green if you won, pink if you lost
                          case 'joiner_won': return !isCreator ? '#00FF41' : '#FF1493'; // Green if you won, pink if you lost
                          default: return 'rgba(255, 255, 255, 0.2)'; // Gray for pending
                        }
                      };
                      
                      const getShadowColor = () => {
                        switch (roundStatus) {
                          case 'current': return '0 0 10px #FFFF00, 0 0 20px #FFFF00';
                          case 'creator_won': return isCreator ? '0 0 10px #00FF41, 0 0 20px #00FF41' : '0 0 10px #FF1493, 0 0 20px #FF1493';
                          case 'joiner_won': return !isCreator ? '0 0 10px #00FF41, 0 0 20px #00FF41' : '0 0 10px #FF1493, 0 0 20px #FF1493';
                          default: return 'none';
                        }
                      };

                      const getTextColor = () => {
                        switch (roundStatus) {
                          case 'current': return '#000000';
                          case 'creator_won': return isCreator ? '#000000' : '#000000';
                          case 'joiner_won': return !isCreator ? '#000000' : '#000000';
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

                  {/* Timer Display */}
                  {gameState?.turnTimeLeft !== undefined && (
                    <div style={{
                      textAlign: 'center',
                      marginTop: '0.5rem',
                      color: gameState.turnTimeLeft <= 5 ? '#FF1493' : '#FFFF00',
                      fontSize: '1.2rem',
                      fontWeight: 'bold',
                      animation: gameState.turnTimeLeft <= 5 ? 'pulse 1s infinite' : 'none'
                    }}>
                      {gameState.turnTimeLeft}s
                  </div>
                  )}
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

              {/* Center - Coin and Power Area */}
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
                    padding: '20px',
                    transform: 'translateX(50px)' // Shift right to center
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
                    customHeadsImage={customHeadsImage}
                    customTailsImage={customTailsImage}
                  />
                </div>

                {/* TEST BUTTONS - Development Only */}
                {process.env.NODE_ENV === 'development' && (
                  <div style={{ 
                    textAlign: 'center', 
                    marginBottom: '1rem',
                    padding: '1rem',
                    background: 'rgba(255, 255, 0, 0.1)',
                    borderRadius: '0.5rem',
                    border: '1px solid rgba(255, 255, 0, 0.3)'
                  }}>
                    <div style={{ marginBottom: '0.5rem', fontSize: '0.9rem', color: '#FFD700' }}>
                      🧪 Test Controls
                    </div>
                    
                    {/* Test Mode Activation */}
                    <button
                      onClick={() => {
                        setGameState(prev => ({
                          ...prev,
                          phase: 'choosing',
                          currentPlayer: address,
                          creatorPower: 0,
                          joinerPower: 0,
                          creatorChoice: null,
                          joinerChoice: null
                        }))
                        showInfo('🧪 Test mode activated! Choose heads or tails first!')
                      }}
                      style={{
                        background: 'linear-gradient(45deg, #FFD700, #FFA500)',
                        color: '#000',
                        border: 'none',
                        padding: '0.4rem 0.8rem',
                        borderRadius: '0.4rem',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        fontSize: '0.8rem',
                        marginRight: '0.5rem',
                        marginBottom: '0.5rem'
                      }}
                    >
                      🧪 Activate Test
                    </button>

                    {/* Choice Buttons */}
                    <button
                      onClick={() => {
                        setGameState(prev => ({
                          ...prev,
                          creatorChoice: 'heads',
                          phase: 'playing'
                        }))
                        showInfo('💰 You chose HEADS! Now hold the coin to charge power!')
                      }}
                      style={{
                        background: gameState?.creatorChoice === 'heads' ? 'linear-gradient(45deg, #FF1493, #FF69B4)' : 'rgba(255, 255, 255, 0.1)',
                        color: '#fff',
                        border: '1px solid rgba(255, 255, 255, 0.3)',
                        padding: '0.4rem 0.8rem',
                        borderRadius: '0.4rem',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        fontSize: '0.8rem',
                        marginRight: '0.5rem',
                        marginBottom: '0.5rem'
                      }}
                    >
                      👑 Heads
                    </button>

                    <button
                      onClick={() => {
                        setGameState(prev => ({
                          ...prev,
                          creatorChoice: 'tails',
                          phase: 'playing'
                        }))
                        showInfo('💎 You chose TAILS! Now hold the coin to charge power!')
                      }}
                      style={{
                        background: gameState?.creatorChoice === 'tails' ? 'linear-gradient(45deg, #FF1493, #FF69B4)' : 'rgba(255, 255, 255, 0.1)',
                        color: '#fff',
                        border: '1px solid rgba(255, 255, 255, 0.3)',
                        padding: '0.4rem 0.8rem',
                        borderRadius: '0.4rem',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        fontSize: '0.8rem',
                        marginRight: '0.5rem',
                        marginBottom: '0.5rem'
                      }}
                    >
                      💎 Tails
                    </button>

                                         {/* Test Flip Button - Only show if choice is made */}
                     {gameState?.creatorChoice && (
                       <button
                         onClick={() => {
                           const results = ['heads', 'tails']
                           const randomResult = results[Math.floor(Math.random() * results.length)]
                           const isWinner = randomResult === gameState.creatorChoice
                           
                           showInfo(`🎲 Flipping coin... You chose ${gameState.creatorChoice.toUpperCase()}!`)
                           
                           // Start flip animation
                           setTimeout(() => {
                             setFlipAnimation({
                               result: randomResult,
                               duration: 4000 // Longer duration
                             })
                             setRoundResult({ result: randomResult })
                           }, 1000)
                           
                           // Just show simple result message - no popup
                           setTimeout(() => {
                             showSuccess(`🪙 Result: ${randomResult.toUpperCase()}! ${isWinner ? 'You WON!' : 'You lost...'}`)
                           }, 5500)
                         }}
                         style={{
                           background: 'linear-gradient(45deg, #00FF41, #39FF14)',
                           color: '#000',
                           border: 'none',
                           padding: '0.4rem 0.8rem',
                           borderRadius: '0.4rem',
                           cursor: 'pointer',
                           fontWeight: 'bold',
                           fontSize: '0.8rem',
                           marginBottom: '0.5rem'
                         }}
                       >
                         🎲 Test Flip Now!
                       </button>
                     )}
                  </div>
                )}

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

              {/* RIGHT CONTAINER - NFT & Game Details */}
              <div style={{
                position: 'relative',
                width: '100%',
                maxWidth: '600px',
                margin: '0 auto',
                padding: '2rem',
                background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.1) 0%, rgba(0, 0, 0, 0.3) 100%)',
                border: '2px solid rgba(255, 215, 0, 0.3)',
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
                        border: '4px solid rgba(255, 255, 0, 0.6)',
                        boxShadow: '0 0 30px rgba(255, 255, 0, 0.5), inset 0 0 30px rgba(255, 255, 0, 0.3)',
                        animation: 'nftBananaGlow 2s ease-in-out infinite'
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
                {gameData?.status === 'waiting' && !isCreator && !isJoiner && (
                  <div style={{
                    marginTop: '2rem',
                    textAlign: 'center'
                  }}>
                    <button
                      onClick={handleJoinGame}
                      disabled={joiningGame || !isFullyConnected}
                      style={{
                        background: joiningGame ? 
                          'rgba(255, 20, 147, 0.5)' : 
                          'linear-gradient(45deg, #FF1493, #FF69B4)',
                        color: '#fff',
                        border: 'none',
                        padding: '1.5rem 3rem',
                        borderRadius: '1rem',
                        fontSize: '1.3rem',
                        fontWeight: 'bold',
                        cursor: joiningGame ? 'not-allowed' : 'pointer',
                        width: '100%',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      {joiningGame ? '⏳ Joining...' : 'Join Flip'}
                    </button>
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

          {/* Spectator Mode Message */}
          {!isPlayer && (
            <div style={{
              marginTop: '2rem',
              textAlign: 'center',
              padding: '1rem',
              background: 'rgba(255, 215, 0, 0.1)',
              border: '1px solid rgba(255, 215, 0, 0.3)',
              borderRadius: '1rem'
            }}>
              <p style={{ color: '#FFD700', fontWeight: 'bold', margin: 0 }}>
                👀 SPECTATING
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
                paddingTop: '56.25%', // 16:9 aspect ratio
                marginBottom: '1rem'
              }}>
                <video
                  key={roundResult.actualWinner === address ? 'win' : 'lose'}
                  autoPlay
                  muted
                  playsInline
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    borderRadius: '1rem',
                    objectFit: 'cover'
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
                You chose: <strong>{roundResult.playerChoice?.toUpperCase()}</strong>
              </div>
              
              {/* Win/Lose Status */}
              <div style={{
                fontSize: '1.8rem',
                color: roundResult.actualWinner === address ? '#00FF41' : '#FF1493',
                fontWeight: 'bold',
                marginBottom: '1rem',
                pointerEvents: 'auto',
                textShadow: `0 0 15px ${roundResult.actualWinner === address ? 'rgba(0, 255, 65, 0.7)' : 'rgba(255, 20, 147, 0.7)'}`,
                animation: 'pulse 1s infinite'
              }}>
                {roundResult.actualWinner === address ? '🎉 YOU WON!' : '💔 YOU LOST!'}
              </div>
              
              {/* Explanation */}
              <div style={{
                fontSize: '1rem',
                color: 'rgba(255, 255, 255, 0.7)',
                pointerEvents: 'auto',
                fontStyle: 'italic'
              }}>
                {roundResult.result === roundResult.playerChoice 
                  ? `Your choice (${roundResult.playerChoice}) matched the result (${roundResult.result})!`
                  : `Your choice (${roundResult.playerChoice}) did not match the result (${roundResult.result}).`
                }
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
                maxWidth: '500px',
                width: '100%',
                boxShadow: '0 0 30px rgba(255, 215, 0, 0.3)'
              }}>
                <h2 style={{ color: '#FFD700', marginBottom: '1rem' }}>🎉 You Won! 🎉</h2>
                <p style={{ color: '#fff', marginBottom: '2rem' }}>
                  Congratulations! You've won {gameState?.potAmount || 0} {gameState?.currency || 'ETH'}
                </p>
                <button
                  onClick={handleClaimWinnings}
                  style={{
                    background: 'linear-gradient(135deg, #FF69B4 0%, #FF1493 100%)',
                    color: '#fff',
                    border: 'none',
                    padding: '1rem 2rem',
                    borderRadius: '0.5rem',
                    fontSize: '1.2rem',
                    cursor: 'pointer',
                    width: '100%',
                    marginBottom: '1rem',
                    boxShadow: '0 0 20px rgba(255, 105, 180, 0.4)',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'scale(1.05)';
                    e.currentTarget.style.boxShadow = '0 0 30px rgba(255, 105, 180, 0.6)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow = '0 0 20px rgba(255, 105, 180, 0.4)';
                  }}
                >
                  💰 Claim Your Winnings
                </button>
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

export default FlipGame