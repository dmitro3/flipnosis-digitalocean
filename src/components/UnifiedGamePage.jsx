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
import SpriteBasedCoin from './SpriteBasedCoin'
import MobileOptimizedCoin from './MobileOptimizedCoin'
import PowerDisplay from '../components/PowerDisplay'
import GameResultPopup from './GameResultPopup'
import ProfilePicture from './ProfilePicture'
import GameChatBox from './GameChatBox'
import NFTOfferComponent from './NFTOfferComponent'
import GoldGameInstructions from './GoldGameInstructions'
import ShareButton from './ShareButton'

// 6. Style imports
import { theme } from '../styles/theme'
import { API_CONFIG, getApiUrl, getWsUrl } from '../config/api'
import { LoadingSpinner } from '../styles/components'

// 7. Asset imports last
import hazeVideo from '../../Images/Video/haze.webm'
import mobileVideo from '../../Images/Video/Mobile/mobile.webm'

// Styled Components - Original Design
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
`

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
`

const NFTDetails = styled.div`
  width: 100%;
  padding: 0.75rem;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 0.5rem;
  margin-bottom: 0.5rem;
`

const NFTDetailRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
  
  &:last-child {
    margin-bottom: 0;
  }
`

const NFTLabel = styled.span`
  color: ${props => props.theme.colors.textSecondary};
`

const NFTValue = styled.span`
  color: ${props => props.theme.colors.textPrimary};
  font-family: monospace;
`

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
`

const MobileOnly = styled.div`
  display: none;
  @media (max-width: 768px) {
    display: block;
  }
`

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

const UnifiedGamePage = () => {
  const { gameId } = useParams()
  const navigate = useNavigate()
  const { address, isConnected, walletClient, publicClient } = useWallet()
  const { showSuccess, showError, showInfo } = useToast()
  const { isInitialized: contractInitialized } = useContractService()
  
  // Game state - moved up to avoid initialization error
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
  const [gameCoin, setGameCoin] = useState(null)
  
  // Game data and WebSocket state
  const [gameData, setGameData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [wsConnected, setWsConnected] = useState(false)
  const [wsRef, setWsRef] = useState(null)
  
  // UI state
  const [showResultPopup, setShowResultPopup] = useState(false)
  const [resultData, setResultData] = useState(null)
  const [messages, setMessages] = useState([])
  const [offers, setOffers] = useState([])
  const [showOfferReviewModal, setShowOfferReviewModal] = useState(false)
  const [pendingNFTOffer, setPendingNFTOffer] = useState(null)
  
  // Mobile state
  const [isMobileScreen, setIsMobileScreen] = useState(false)
  const [isInfoOpen, setIsInfoOpen] = useState(false)
  const [isChatOpen, setIsChatOpen] = useState(false)
  
  // Load game data
  const loadGameData = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${getApiUrl()}/api/games/${gameId}`)
      
      if (!response.ok) {
        // If API is not available, use mock data
        console.log('⚠️ API not available, using mock game data')
        const mockGameData = {
          id: gameId,
          creator: address,
          joiner: null,
          price: 150000, // $0.15 in microdollars
          nft: {
            name: 'Based Ape 2025 #1271',
            collection: 'Based Ape 2025',
            image: 'https://ipfs.io/ipfs/QmT8559uspQQcfsAF2VTd3Um2zLjjjTpa7BUGXaDQybfqy',
            contract: '0x70cdCC990EFBD44a1Cb1C86F7fEB9962d15Ed71f',
            tokenId: '1271'
          },
          status: 'waiting',
          created_at: new Date().toISOString()
        }
        setGameData(mockGameData)
        setLoading(false)
        return
      }
      
      const data = await response.json()
      setGameData(data)
      
      // Initialize WebSocket connection
      initializeWebSocket()
      
    } catch (err) {
      console.error('Error loading game data:', err)
      
      // Use mock data as fallback
      console.log('🔄 Using mock game data as fallback')
      const mockGameData = {
        id: gameId,
        creator: address,
        joiner: null,
        price: 150000, // $0.15 in microdollars
        nft: {
          name: 'Based Ape 2025 #1271',
          collection: 'Based Ape 2025',
          image: 'https://ipfs.io/ipfs/QmT8559uspQQcfsAF2VTd3Um2zLjjjTpa7BUGXaDQybfqy',
          contract: '0x70cdCC990EFBD44a1Cb1C86F7fEB9962d15Ed71f',
          tokenId: '1271'
        },
        status: 'waiting',
        created_at: new Date().toISOString()
      }
      setGameData(mockGameData)
      setError(null) // Clear error since we have fallback data
    } finally {
      setLoading(false)
    }
  }
  
  // Initialize WebSocket connection
  const initializeWebSocket = () => {
    try {
      const ws = new WebSocket(getWsUrl())
      
      ws.onopen = () => {
        console.log('🔌 WebSocket connected')
        setWsConnected(true)
        
        // Subscribe to game updates
        ws.send(JSON.stringify({
          type: 'SUBSCRIBE_TO_GAME',
          gameId: gameId
        }))
      }
      
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          handleWebSocketMessage(data)
        } catch (err) {
          console.error('Error parsing WebSocket message:', err)
        }
      }
      
      ws.onclose = () => {
        console.log('🔌 WebSocket disconnected')
        setWsConnected(false)
        
        // Attempt to reconnect after 3 seconds
        setTimeout(() => {
          if (gameData) {
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
        
      case 'FLIP_RESULT':
        handleFlipResult(data.result)
        break
        
      case 'GAME_COMPLETED':
        handleGameCompleted(data)
        break
        
      case 'CHAT_MESSAGE':
        setMessages(prev => [...prev, data.message])
        break
        
      case 'NFT_OFFER':
        setOffers(prev => [...prev, data.offer])
        break
        
      default:
        console.log('Unknown WebSocket message type:', data.type)
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
    
    setGameState(prev => ({
      ...prev,
      phase: 'charging',
      creatorChoice: address === getGameCreator() ? choice : prev.creatorChoice,
      joinerChoice: address === getGameJoiner() ? choice : prev.joinerChoice
    }))
    
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
  
  // Helper functions to handle both game and listing data structures
  const getGameCreator = () => gameData?.creator || gameData?.creator_address
  const getGameJoiner = () => gameData?.challenger || gameData?.joiner || gameData?.joiner_address || gameData?.challenger_address
  const getGamePrice = () => gameData?.price || gameData?.priceUSD || gameData?.final_price || gameData?.asking_price || 0
  const getGameNFTImage = () => gameData?.nft?.image || gameData?.nft_image || gameData?.nftImage || '/placeholder-nft.svg'
  const getGameNFTName = () => gameData?.nft?.name || gameData?.nft_name || gameData?.nftName || 'Unknown NFT'
  const getGameNFTCollection = () => gameData?.nft?.collection || gameData?.nft_collection || gameData?.nftCollection || 'Unknown Collection'
  const getGameNFTContract = () => gameData?.nft?.contract || gameData?.nft_contract
  const getGameNFTTokenId = () => gameData?.nft?.tokenId || gameData?.nft_token_id
  
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
    console.log('🪙 Coin useEffect triggered - gameState?.coin:', gameState?.coin)
    
    if (gameState?.coin) {
      console.log('🪙 Using game creator\'s selected coin:', gameState.coin)
      setGameCoin(gameState.coin)
      
      // ALWAYS use the game's selected coin, regardless of type
      setCustomHeadsImage(gameState.coin.headsImage)
      setCustomTailsImage(gameState.coin.tailsImage)
      
      console.log('🪙 Set coin images to:', {
        heads: gameState.coin.headsImage,
        tails: gameState.coin.tailsImage,
        type: gameState.coin.type
      })
    } else {
      console.log('🪙 No game coin data - using default null (no fallback to profile)')
      
      // NO FALLBACK TO PERSONAL COINS - game must specify coin
      setCustomHeadsImage(null)
      setCustomTailsImage(null)
    }
  }, [gameState?.coin])
  
  // Add useEffect to detect screen size
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobileScreen(window.innerWidth <= 768)
    }
    
    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)
    
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])
  
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
  
  // Loading state
  if (loading) {
    return (
      <ThemeProvider theme={theme}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '100vh',
          background: '#000'
        }}>
          <LoadingSpinner />
          <span style={{ marginLeft: '1rem', color: 'white' }}>Loading game...</span>
        </div>
      </ThemeProvider>
    )
  }
  
  // Error state
  if (error) {
    return (
      <ThemeProvider theme={theme}>
        <div style={{ 
          textAlign: 'center', 
          color: 'white', 
          padding: '2rem',
          background: '#000',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center'
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
      </ThemeProvider>
    )
  }
  
  return (
    <ThemeProvider theme={theme}>
      <div style={{ background: '#000', minHeight: '100vh' }}>
        {/* Background Video */}
        <BackgroundVideo autoPlay muted loop playsInline>
          <source src={isMobileScreen ? mobileVideo : hazeVideo} type="video/webm" />
        </BackgroundVideo>
        
        {/* Desktop Layout */}
        <DesktopOnlyLayout>
          {/* Left Column - Player Info */}
          <div style={{ 
            background: 'rgba(255, 255, 255, 0.05)', 
            borderRadius: '1rem', 
            padding: '1rem',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <h3 style={{ color: '#FFD700', textAlign: 'center', marginBottom: '1rem' }}>Creator</h3>
            <ProfilePicture 
              address={getGameCreator()}
              size={80}
              showAddress={true}
            />
            <p style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: 'white', textAlign: 'center' }}>
              Power: {gameState.creatorPower}
            </p>
            <p style={{ fontSize: '0.8rem', color: '#ccc', textAlign: 'center' }}>
              Wins: {gameState.creatorWins}
            </p>
          </div>
          
          {/* Center Column - Game */}
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            gap: '2rem' 
          }}>
            <h2 style={{ color: '#FFD700', textAlign: 'center' }}>Round {gameState.currentRound}</h2>
            
            {/* Coin Component */}
            <div style={{ 
              background: 'rgba(255, 255, 255, 0.05)', 
              padding: '1rem', 
              borderRadius: '1rem',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              aspectRatio: '1',
              maxWidth: '400px',
              width: '100%'
            }}>
              {isMobileScreen ? (
                <MobileOptimizedCoin 
                  isFlipping={flipAnimation !== null}
                  flipResult={flipAnimation?.result}
                  size={300}
                  isPlayerTurn={isMyTurn()}
                  onPowerCharge={handlePowerChargeStart}
                  onPowerRelease={handlePowerChargeStop}
                  chargingPlayer={gameState.chargingPlayer}
                  creatorPower={gameState.creatorPower}
                  joinerPower={gameState.joinerPower}
                  creatorChoice={gameState.creatorChoice}
                  joinerChoice={gameState.joinerChoice}
                  isCreator={isCreator()}
                  customHeadsImage={customHeadsImage}
                  customTailsImage={customTailsImage}
                />
              ) : (
                <SpriteBasedCoin 
                  isFlipping={flipAnimation !== null}
                  flipResult={flipAnimation?.result}
                  size={300}
                  isPlayerTurn={isMyTurn()}
                  onPowerCharge={handlePowerChargeStart}
                  onPowerRelease={handlePowerChargeStop}
                  chargingPlayer={gameState.chargingPlayer}
                  creatorPower={gameState.creatorPower}
                  joinerPower={gameState.joinerPower}
                  creatorChoice={gameState.creatorChoice}
                  joinerChoice={gameState.joinerChoice}
                  isCreator={isCreator()}
                  customHeadsImage={customHeadsImage}
                  customTailsImage={customTailsImage}
                />
              )}
            </div>
            
            {/* Power Display Component */}
            <div style={{ 
              background: 'rgba(255, 255, 255, 0.05)', 
              padding: '1rem', 
              borderRadius: '1rem',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              width: '100%',
              maxWidth: '500px'
            }}>
              <PowerDisplay 
                creatorPower={gameState.creatorPower}
                joinerPower={gameState.joinerPower}
                currentPlayer={gameState.chargingPlayer}
                creator={getGameCreator()}
                joiner={getGameJoiner()}
                chargingPlayer={gameState.chargingPlayer}
                gamePhase={gameState.phase}
                isMyTurn={isMyTurn()}
                playerChoice={isCreator() ? gameState.creatorChoice : gameState.joinerChoice}
                onChoiceSelect={handlePlayerChoice}
                isMobile={isMobileScreen}
              />
            </div>
          </div>
          
          {/* Right Column - Player Info */}
          <div style={{ 
            background: 'rgba(255, 255, 255, 0.05)', 
            borderRadius: '1rem', 
            padding: '1rem',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <h3 style={{ color: '#FFD700', textAlign: 'center', marginBottom: '1rem' }}>Joiner</h3>
            <ProfilePicture 
              address={getGameJoiner()}
              size={80}
              showAddress={true}
            />
            <p style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: 'white', textAlign: 'center' }}>
              Power: {gameState.joinerPower}
            </p>
            <p style={{ fontSize: '0.8rem', color: '#ccc', textAlign: 'center' }}>
              Wins: {gameState.joinerWins}
            </p>
          </div>
        </DesktopOnlyLayout>
        
        {/* Mobile Layout */}
        <MobileOnlyLayout>
          {/* NFT Info */}
          <MobileNFTBox>
            <h3 style={{ color: '#FFD700', textAlign: 'center', marginBottom: '1rem' }}>Game NFT</h3>
            <img 
              src={getGameNFTImage()} 
              alt={getGameNFTName()} 
              style={{ 
                width: '120px', 
                height: '120px', 
                borderRadius: '1rem',
                border: '2px solid #FFD700'
              }} 
            />
            <NFTDetails>
              <NFTDetailRow>
                <NFTLabel>Name:</NFTLabel>
                <NFTValue>{getGameNFTName()}</NFTValue>
              </NFTDetailRow>
              <NFTDetailRow>
                <NFTLabel>Collection:</NFTLabel>
                <NFTValue>{getGameNFTCollection()}</NFTValue>
              </NFTDetailRow>
              <NFTDetailRow>
                <NFTLabel>Price:</NFTLabel>
                <NFTValue>${(getGamePrice() / 1000000).toFixed(2)}</NFTValue>
              </NFTDetailRow>
            </NFTDetails>
          </MobileNFTBox>
          
          {/* Players */}
          <MobilePlayerBox>
            <h3 style={{ color: '#FFD700', textAlign: 'center', marginBottom: '1rem' }}>Players</h3>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ textAlign: 'center' }}>
                <ProfilePicture 
                  address={getGameCreator()}
                  size={60}
                  showAddress={true}
                />
                <p style={{ fontSize: '0.8rem', color: 'white', marginTop: '0.5rem' }}>
                  Power: {gameState.creatorPower}
                </p>
              </div>
              <div style={{ textAlign: 'center' }}>
                <ProfilePicture 
                  address={getGameJoiner()}
                  size={60}
                  showAddress={true}
                />
                <p style={{ fontSize: '0.8rem', color: 'white', marginTop: '0.5rem' }}>
                  Power: {gameState.joinerPower}
                </p>
              </div>
            </div>
          </MobilePlayerBox>
          
          {/* Coin */}
          <MobileCoinBox>
            <MobileOptimizedCoin 
              isFlipping={flipAnimation !== null}
              flipResult={flipAnimation?.result}
              size={250}
              isPlayerTurn={isMyTurn()}
              onPowerCharge={handlePowerChargeStart}
              onPowerRelease={handlePowerChargeStop}
              chargingPlayer={gameState.chargingPlayer}
              creatorPower={gameState.creatorPower}
              joinerPower={gameState.joinerPower}
              creatorChoice={gameState.creatorChoice}
              joinerChoice={gameState.joinerChoice}
              isCreator={isCreator()}
              customHeadsImage={customHeadsImage}
              customTailsImage={customTailsImage}
            />
          </MobileCoinBox>
          
          {/* Status */}
          <MobileStatusBox>
            <h3 style={{ color: '#FFD700', textAlign: 'center', marginBottom: '1rem' }}>Round {gameState.currentRound}</h3>
            <PowerDisplay 
              creatorPower={gameState.creatorPower}
              joinerPower={gameState.joinerPower}
              currentPlayer={gameState.chargingPlayer}
              creator={getGameCreator()}
              joiner={getGameJoiner()}
              chargingPlayer={gameState.chargingPlayer}
              gamePhase={gameState.phase}
              isMyTurn={isMyTurn()}
              playerChoice={isCreator() ? gameState.creatorChoice : gameState.joinerChoice}
              onChoiceSelect={handlePlayerChoice}
              isMobile={true}
            />
          </MobileStatusBox>
          
          {/* Chat */}
          <MobileChatBox>
            <h3 style={{ color: '#FFD700', textAlign: 'center', marginBottom: '1rem' }}>Game Chat</h3>
            <GameChatBox 
              messages={messages}
              onSendMessage={(message) => {
                if (wsRef && wsConnected) {
                  wsRef.send(JSON.stringify({
                    type: 'CHAT_MESSAGE',
                    gameId: gameId,
                    message: {
                      id: Date.now(),
                      sender: address,
                      message: message,
                      timestamp: Date.now()
                    }
                  }))
                }
              }}
              gameId={gameId}
              isMobile={true}
            />
          </MobileChatBox>
        </MobileOnlyLayout>
        
        {/* Mobile Bottom Navigation */}
        <MobileBottomNav>
          <MobileNavButton onClick={() => setIsInfoOpen(!isInfoOpen)}>
            ℹ️ Info
          </MobileNavButton>
          <MobileNavButton onClick={() => setIsChatOpen(!isChatOpen)}>
            💬 Chat
          </MobileNavButton>
          <MobileNavButton isJoinButton={true} onClick={() => showInfo('Join game functionality will be implemented')}>
            🎮 Join Game
          </MobileNavButton>
        </MobileBottomNav>
        
        {/* Mobile Info Panel */}
        <MobileInfoPanel isOpen={isInfoOpen}>
          <h3 style={{ color: '#FFD700', marginBottom: '1rem' }}>Game Info</h3>
          <p style={{ color: 'white', fontSize: '0.9rem' }}>
            Game ID: {gameId}
          </p>
          <p style={{ color: 'white', fontSize: '0.9rem' }}>
            Status: {gameData?.status || 'waiting'}
          </p>
          <p style={{ color: 'white', fontSize: '0.9rem' }}>
            Price: ${(getGamePrice() / 1000000).toFixed(2)}
          </p>
        </MobileInfoPanel>
        
        {/* Mobile Chat Panel */}
        <MobileChatPanel isOpen={isChatOpen}>
          <h3 style={{ color: '#FFD700', marginBottom: '1rem' }}>Game Chat</h3>
          <GameChatBox 
            messages={messages}
            onSendMessage={(message) => {
              if (wsRef && wsConnected) {
                wsRef.send(JSON.stringify({
                  type: 'CHAT_MESSAGE',
                  gameId: gameId,
                  message: {
                    id: Date.now(),
                    sender: address,
                    message: message,
                    timestamp: Date.now()
                  }
                }))
              }
            }}
            gameId={gameId}
            isMobile={true}
          />
        </MobileChatPanel>
        
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
      </div>
    </ThemeProvider>
  )
}

export default UnifiedGamePage