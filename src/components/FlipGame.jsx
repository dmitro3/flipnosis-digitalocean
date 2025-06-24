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
import SpriteBasedCoin from './SpriteBasedCoin'
import MobileOptimizedCoin from './MobileOptimizedCoin'
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

const FlipGame = ({ 
  game, 
  currentPlayer, 
  onJoinGame, 
  onFlipCoin, 
  onWithdrawRewards,
  isJoining,
  isFlipping,
  contractService 
}) => {
  const navigate = useNavigate()
  const { isFullyConnected, connectionError, address } = useWalletConnection()
  const { showSuccess, showError, showInfo } = useToast()
  
  // Local state for UI interactions
  const [isPowerCharging, setIsPowerCharging] = useState(false)
  const [powerLevel, setPowerLevel] = useState(0)
  const [showInstructions, setShowInstructions] = useState(false)
  const [showNFTDetails, setShowNFTDetails] = useState(false)
  const [showOfferReview, setShowOfferReview] = useState(false)
  const [showNFTOffer, setShowNFTOffer] = useState(false)
  const [showNFTVerification, setShowNFTVerification] = useState(false)
  const [selectedNFTForOffer, setSelectedNFTForOffer] = useState(null)
  const [pendingOffer, setPendingOffer] = useState(null)
  const [gameResult, setGameResult] = useState(null)
  const [choiceAnimation, setChoiceAnimation] = useState(null)
  const [autoFlipAnimation, setAutoFlipAnimation] = useState(false)
  
  // Refs
  const powerIntervalRef = useRef(null)
  const videoRef = useRef(null)
  const isMobile = window.innerWidth <= 768

  // Screen size detection
  const [isMobileScreen, setIsMobileScreen] = useState(window.innerWidth <= 768)
  const [windowWidth, setWindowWidth] = useState(window.innerWidth)
  const [videoError, setVideoError] = useState(false)
  const [isInfoOpen, setIsInfoOpen] = useState(false)
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [isPlayer, setIsPlayer] = useState(false)
  const [showChoiceAnimation, setShowChoiceAnimation] = useState(false)
  const [choiceAnimationColor, setChoiceAnimationColor] = useState('#FFD700')
  const [choiceAnimationText, setChoiceAnimationText] = useState('HEADS')
  const [showAutoFlipAnimation, setShowAutoFlipAnimation] = useState(false)

  // Debug logging
  useEffect(() => {
    console.log('🎮 FlipGame Component - Props:', {
      game,
      currentPlayer,
      hasOnJoinGame: !!onJoinGame,
      hasOnFlipCoin: !!onFlipCoin,
      hasOnWithdrawRewards: !!onWithdrawRewards,
      isJoining,
      isFlipping,
      hasContractService: !!contractService
    })
  }, [game, currentPlayer, onJoinGame, onFlipCoin, onWithdrawRewards, isJoining, isFlipping, contractService])

  // Screen size effect
  useEffect(() => {
    const handleResize = () => {
      const newWidth = window.innerWidth
      const newIsMobile = newWidth <= 768
      setWindowWidth(newWidth)
      setIsMobileScreen(newIsMobile)
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Check if current player is in the game
  useEffect(() => {
    if (game && currentPlayer) {
      setIsPlayer(game.creator === currentPlayer || game.joiner === currentPlayer)
    }
  }, [game, currentPlayer])

  // Handle power charging
  const handlePowerChargeStart = () => {
    setIsPowerCharging(true)
    setPowerLevel(0)
    
    powerIntervalRef.current = setInterval(() => {
      setPowerLevel(prev => {
        if (prev >= 100) {
          clearInterval(powerIntervalRef.current)
          setIsPowerCharging(false)
          return 100
        }
        return prev + 2
      })
    }, 50)
  }

  const handlePowerChargeStop = () => {
    if (powerIntervalRef.current) {
      clearInterval(powerIntervalRef.current)
      setIsPowerCharging(false)
    }
  }

  // Handle player choice (heads/tails)
  const handlePlayerChoice = async (choice) => {
    if (!game || !currentPlayer) {
      showError('Game or player data not available')
      return
    }

    if (game.status !== 'active') {
      showError('Game is not active')
      return
    }

    // Show choice animation
    setChoiceAnimation({
      choice,
      color: choice === 'heads' ? '#FFD700' : '#C0C0C0'
    })

    // Clear animation after 1 second
    setTimeout(() => {
      setChoiceAnimation(null)
    }, 1000)

    // Call parent's flip coin function
    if (onFlipCoin) {
      try {
        await onFlipCoin()
      } catch (error) {
        console.error('❌ Error in flip coin:', error)
        showError('Failed to flip coin: ' + error.message)
      }
    }
  }

  // Handle join game
  const handleJoinGameClick = async () => {
    if (!game || !currentPlayer) {
      showError('Game or player data not available')
      return
    }

    if (game.status !== 'waiting') {
      showError('Game is not waiting for players')
      return
    }

    if (game.creator === currentPlayer) {
      showError('You cannot join your own game')
      return
    }

    // Call parent's join game function
    if (onJoinGame) {
      try {
        await onJoinGame()
      } catch (error) {
        console.error('❌ Error joining game:', error)
        showError('Failed to join game: ' + error.message)
      }
    }
  }

  // Handle withdraw rewards
  const handleWithdrawRewardsClick = async () => {
    if (!currentPlayer) {
      showError('Player data not available')
      return
    }

    // Call parent's withdraw rewards function
    if (onWithdrawRewards) {
      try {
        await onWithdrawRewards()
      } catch (error) {
        console.error('❌ Error withdrawing rewards:', error)
        showError('Failed to withdraw rewards: ' + error.message)
      }
    }
  }

  // Get join button state
  const getJoinButtonState = () => {
    if (!game || !currentPlayer) return 'disabled'
    if (game.status !== 'waiting') return 'disabled'
    if (game.creator === currentPlayer) return 'disabled'
    if (isJoining) return 'loading'
    return 'enabled'
  }

  // Get flip button state
  const getFlipButtonState = () => {
    if (!game || !currentPlayer) return 'disabled'
    if (game.status !== 'active') return 'disabled'
    if (isFlipping) return 'loading'
    return 'enabled'
  }

  // Check if current player can play
  const canPlay = () => {
    if (!game || !currentPlayer) return false
    return game.creator === currentPlayer || game.joiner === currentPlayer
  }

  // Check if current player is creator
  const isCreator = () => {
    return game?.creator === currentPlayer
  }

  // Check if current player is joiner
  const isJoiner = () => {
    return game?.joiner === currentPlayer
  }

  // Get current player's score
  const getCurrentPlayerScore = () => {
    if (!game || !currentPlayer) return 0
    if (isCreator()) return game.creator_score || 0
    if (isJoiner()) return game.joiner_score || 0
    return 0
  }

  // Get opponent's score
  const getOpponentScore = () => {
    if (!game || !currentPlayer) return 0
    if (isCreator()) return game.joiner_score || 0
    if (isJoiner()) return game.creator_score || 0
    return 0
  }

  // Get current round
  const getCurrentRound = () => {
    return game?.current_round || 0
  }

  // Get max rounds
  const getMaxRounds = () => {
    return game?.max_rounds || 5
  }

  // Get game status text
  const getGameStatusText = () => {
    if (!game) return 'Loading...'
    
    switch (game.status) {
      case 'waiting':
        return 'Waiting for opponent...'
      case 'active':
        return `Round ${getCurrentRound() + 1} of ${getMaxRounds()}`
      case 'completed':
        return 'Game completed'
      default:
        return 'Unknown status'
    }
  }

  // Get coin design from auth info
  const getCoinDesign = () => {
    if (!game?.auth_info?.coinDesign) {
      return { name: 'Default Coin', heads: 'heads', tails: 'tails' }
    }
    return game.auth_info.coinDesign
  }

  // Render functions
  const renderJoinButton = () => {
    const state = getJoinButtonState()
    
    if (state === 'disabled') {
      return (
        <Button disabled style={{ opacity: 0.5 }}>
          Cannot Join
        </Button>
      )
    }
    
    if (state === 'loading') {
      return (
        <Button disabled>
          <LoadingSpinner /> Joining...
        </Button>
      )
    }
    
    return (
      <Button 
        onClick={handleJoinGameClick}
        style={{
          background: 'linear-gradient(45deg, #00FF41, #39FF14)',
          color: '#000',
          fontWeight: 'bold'
        }}
      >
        Join Game
      </Button>
    )
  }

  const renderFlipButton = () => {
    const state = getFlipButtonState()
    
    if (state === 'disabled') {
      return (
        <Button disabled style={{ opacity: 0.5 }}>
          Cannot Flip
        </Button>
      )
    }
    
    if (state === 'loading') {
      return (
        <Button disabled>
          <LoadingSpinner /> Flipping...
        </Button>
      )
    }
    
    return (
      <Button 
        onClick={() => setShowInstructions(true)}
        style={{
          background: 'linear-gradient(45deg, #FFD700, #FFA500)',
          color: '#000',
          fontWeight: 'bold'
        }}
      >
        Flip Coin
      </Button>
    )
  }

  const renderWithdrawButton = () => {
    return (
      <Button 
        onClick={handleWithdrawRewardsClick}
        style={{
          background: 'linear-gradient(45deg, #FF1493, #FF69B4)',
          color: '#fff',
          fontWeight: 'bold'
        }}
      >
        Withdraw Rewards
      </Button>
    )
  }

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
                      onClick={handleJoinGameClick}
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
                  customHeadsImage={customHeadsImage}
                  customTailsImage={customTailsImage}
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
                    customHeadsImage={customHeadsImage}
                    customTailsImage={customTailsImage}
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
                          onClick={handleJoinGameClick}
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
              onClick={handleJoinGameClick}
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