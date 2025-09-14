import React, { useState, useEffect, useCallback, useRef } from 'react'
import styled from '@emotion/styled'
import { useParams, useNavigate } from 'react-router-dom'
import { useAccount } from 'wagmi'
import { useToast } from '../../contexts/ToastContext'
import { useWallet } from '../../contexts/WalletContext'
import { useContractService } from '../../utils/useContractService'
import socketService from '../../services/SocketService'
import OptimizedGoldCoin from '../OptimizedGoldCoin'
import ProfilePicture from '../ProfilePicture'
import GameResultPopup from '../GameResultPopup'
// Import tab components
import NFTDetailsTab from './tabs/NFTDetailsTab'
import ChatOffersTab from './tabs/ChatOffersTab'
import GameRoomTab from './tabs/GameRoomTab'

// ===== TABBED GAME INTERFACE =====
// This component integrates the beautiful legacy tabbed interface
// with the current server-side game architecture
// Tabs: Details (NFT verification) → Chat/Offers → Game Room

// === TABBED INTERFACE STYLED COMPONENTS ===
const TabbedContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  min-height: 600px;
  background: rgba(0, 0, 20, 0.95);
  border: 2px solid rgba(0, 191, 255, 0.3);
  border-radius: 1rem;
  overflow: hidden;
  box-shadow: 0 0 30px rgba(0, 191, 255, 0.2);
  
  @media (max-width: 768px) {
    min-height: 500px;
    border-radius: 0;
    border: none;
  }
`

const TabsHeader = styled.div`
  display: flex;
  background: rgba(0, 0, 0, 0.8);
  border-bottom: 2px solid rgba(0, 191, 255, 0.3);
  
  @media (max-width: 768px) {
    flex-direction: row;
    overflow-x: auto;
  }
`

const Tab = styled.button`
  flex: 1;
  padding: 1.5rem 2rem;
  background: ${props => props.active ? 
    'linear-gradient(135deg, rgba(0, 191, 255, 0.2), rgba(0, 255, 65, 0.1))' : 
    'transparent'
  };
  color: ${props => props.active ? '#00BFFF' : '#FFFFFF'};
  border: none;
  border-right: 1px solid rgba(255, 255, 255, 0.1);
  cursor: pointer;
  font-size: 1.2rem;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 1px;
  transition: all 0.3s ease;
  position: relative;
  
  &:hover {
    background: ${props => props.active ? 
      'linear-gradient(135deg, rgba(0, 191, 255, 0.3), rgba(0, 255, 65, 0.2))' : 
      'rgba(255, 255, 255, 0.05)'
    };
  }
  
  &:last-child {
    border-right: none;
  }
  
  /* Tab-specific colors */
  &:nth-child(1) {
    ${props => props.active && `
      background: linear-gradient(135deg, rgba(255, 20, 147, 0.3), rgba(255, 105, 180, 0.2));
      color: #FF1493;
      text-shadow: 0 0 10px #FF1493;
    `}
  }
  
  &:nth-child(2) {
    ${props => props.active && `
      background: linear-gradient(135deg, rgba(0, 255, 65, 0.3), rgba(57, 255, 20, 0.2));
      color: #00FF41;
      text-shadow: 0 0 10px #00FF41;
    `}
  }
  
  &:nth-child(3) {
    ${props => props.active && `
      background: linear-gradient(135deg, rgba(255, 215, 0, 0.3), rgba(255, 193, 7, 0.2));
      color: #FFD700;
      text-shadow: 0 0 10px #FFD700;
    `}
  }
  
  @media (max-width: 768px) {
    flex: 1;
    padding: 1rem 0.5rem;
    font-size: 0.9rem;
    min-width: 120px;
  }
`

const TabContent = styled.div`
  flex: 1;
  overflow: hidden;
  position: relative;
`

const GameBoard = styled.div`
  display: grid;
  grid-template-columns: 300px 1fr 300px;
  gap: 2rem;
  width: 100%;
  max-width: 1200px;
  align-items: start;
`

const PlayerCard = styled.div`
  background: linear-gradient(135deg, 
    ${props => props.isCreator ? 'rgba(255, 215, 0, 0.1)' : 'rgba(0, 123, 255, 0.1)'} 0%, 
    ${props => props.isCreator ? 'rgba(255, 165, 0, 0.2)' : 'rgba(0, 86, 179, 0.2)'} 100%);
  border: 2px solid ${props => props.isCreator ? '#FFD700' : '#007BFF'};
  border-radius: 1rem;
  padding: 1.5rem;
  text-align: center;
  position: relative;
  
  ${props => props.isActive && `
    box-shadow: 0 0 20px ${props.isCreator ? 'rgba(255, 215, 0, 0.5)' : 'rgba(0, 123, 255, 0.5)'};
    transform: scale(1.05);
  `}
  
  transition: all 0.3s ease;
`

const PlayerHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
`

const PlayerLabel = styled.div`
  font-size: 1.2rem;
  font-weight: bold;
  color: ${props => props.isCreator ? '#FFD700' : '#007BFF'};
`

const PlayerStats = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
`

const StatRow = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 0.9rem;
`

const StatLabel = styled.span`
  color: #aaa;
`

const StatValue = styled.span`
  font-weight: bold;
  color: ${props => props.isCreator ? '#FFD700' : '#007BFF'};
`

const CoinArea = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 1rem;
  padding: 2rem;
  border: 2px solid rgba(255, 255, 255, 0.1);
`

const GameStatus = styled.div`
  text-align: center;
  margin-bottom: 2rem;
`

const StatusText = styled.h2`
  margin: 0;
  font-size: 1.5rem;
  color: #00ff88;
`

const ChoiceButtons = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
`

const ChoiceButton = styled.button`
  padding: 1rem 2rem;
  font-size: 1.1rem;
  font-weight: bold;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
  
  background: ${props => props.choice === 'heads' 
    ? 'linear-gradient(135deg, #ffd700, #ffed4e)' 
    : 'linear-gradient(135deg, #c0392b, #e74c3c)'};
  color: ${props => props.choice === 'heads' ? '#000' : '#fff'};
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 15px rgba(0, 255, 136, 0.3);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`

const PowerBar = styled.div`
  width: 200px;
  height: 20px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  overflow: hidden;
  margin: 1rem 0;
`

const PowerFill = styled.div`
  height: 100%;
  background: linear-gradient(90deg, #00ff88, #00cc6a);
  width: ${props => props.power}%;
  transition: width 0.1s ease;
`

const LoadingSpinner = styled.div`
  border: 4px solid #f3f3f3;
  border-top: 4px solid #00ff88;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin: 2rem auto;
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`

const SpectatorCount = styled.div`
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: rgba(0, 0, 0, 0.5);
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  font-size: 0.9rem;
  color: #00ff88;
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

// === MAIN COMPONENT - PURE RENDERER ===
const FlipSuiteFinal = ({ gameData: propGameData, coinConfig: propCoinConfig }) => {
  const { gameId } = useParams()
  const { address } = useAccount()
  const { showSuccess, showError, showInfo } = useToast()
  const { contractService } = useContractService()
  const navigate = useNavigate()
  
  // ===== TAB STATE =====
  const [activeTab, setActiveTab] = useState('details') // 'details', 'chat', 'game'
  const [isGameReady, setIsGameReady] = useState(false)
  
  // ===== GAME DATA LOADING =====
  const [gameData, setGameData] = useState(null)
  const [coinConfig, setCoinConfig] = useState(null)
  const [gameDataLoading, setGameDataLoading] = useState(true)
  const [gameDataError, setGameDataError] = useState(null)
  
  const loadGameData = useCallback(async () => {
    if (!gameId) return
    
    try {
      setGameDataLoading(true)
      const response = await fetch(`/api/games/${gameId}`)
      if (response.ok) {
        const data = await response.json()
        setGameData(data)
        setCoinConfig(data.coinData || null)
        setGameDataError(null)
      } else {
        setGameDataError('Failed to load game data')
      }
    } catch (error) {
      console.error('❌ Failed to load game data:', error)
      setGameDataError(error.message)
    } finally {
      setGameDataLoading(false)
    }
  }, [gameId])
  
  // Load game data on mount
  useEffect(() => {
    loadGameData()
  }, [loadGameData])
  
  // ===== SERVER STATE ONLY =====
  const [serverState, setServerState] = useState(null)
  const [connected, setConnected] = useState(false)
  const [loading, setLoading] = useState(true)
  const [role, setRole] = useState('spectator') // creator, challenger, spectator
  const [showResultPopup, setShowResultPopup] = useState(false)
  const [resultData, setResultData] = useState(null)
  
  // ===== DEPOSIT STATE =====
  const [depositState, setDepositState] = useState(null)
  const [showDepositOverlay, setShowDepositOverlay] = useState(false)
  const [isDepositing, setIsDepositing] = useState(false)
  
  // Use props if provided, otherwise use loaded data
  const finalGameData = propGameData || gameData
  const finalCoinConfig = propCoinConfig || coinConfig
  
  // No local game state - everything comes from server

  // ===== HELPER FUNCTIONS =====
  const isCreator = useCallback(() => {
    return role === 'creator'
  }, [role])

  const isChallenger = useCallback(() => {
    return role === 'challenger'
  }, [role])

  const isMyTurn = useCallback(() => {
    return serverState && address && 
           serverState.currentTurn?.toLowerCase() === address.toLowerCase()
  }, [serverState, address])

  const canMakeChoice = useCallback(() => {
    if (!serverState || !isMyTurn()) return false
    
    const myChoice = isCreator() ? serverState.creatorChoice : serverState.challengerChoice
    return serverState.gamePhase === 'waiting_choice' && !myChoice
  }, [serverState, isMyTurn, isCreator])

  const canChargePower = useCallback(() => {
    if (!serverState || !isMyTurn()) return false
    
    const myChoice = isCreator() ? serverState.creatorChoice : serverState.challengerChoice
    const isCharging = isCreator() ? serverState.creatorCharging : serverState.challengerCharging
    
    return serverState.gamePhase === 'charging_power' && myChoice && !isCharging
  }, [serverState, isMyTurn, isCreator])

  // ===== SOCKET EVENT HANDLERS =====
  const handleGameStateUpdate = useCallback((data) => {
    console.log('📊 Game state update received:', data)
    setServerState(data)
    setLoading(false)
    
    // Check for round results
    if (data.gamePhase === 'showing_result' && data.roundWinner) {
      setResultData({
        isWinner: data.roundWinner === address,
        flipResult: data.flipResult,
        playerChoice: isCreator() ? data.creatorChoice : data.challengerChoice,
        roundWinner: data.roundWinner,
        round: data.currentRound
      })
      setShowResultPopup(true)
    }
    
    // Check for game completion
    if (data.phase === 'game_complete' && data.gameWinner) {
      setResultData({
        isWinner: data.gameWinner === address,
        isGameComplete: true,
        finalScore: `${data.creatorScore}-${data.challengerScore}`,
        gameWinner: data.gameWinner
      })
      setShowResultPopup(true)
    }
  }, [address, isCreator])

  const handleRoomJoined = useCallback((data) => {
    console.log('🏠 Room joined:', data)
    setRole(data.role)
  }, [])


  const handleFlipExecuting = useCallback((data) => {
    console.log('🎲 Flip executing:', data)
    showInfo('Coin is flipping...')
  }, [showInfo])

  const handleGameReady = useCallback((data) => {
    console.log('🎮 Game ready event received:', data)
    showInfo('Game is ready!')
  }, [showInfo])

  const handleRoundResult = useCallback((data) => {
    console.log('🎲 Round result received:', data)
    // Server will handle all game logic, we just display the result
  }, [])

  // ===== DEPOSIT EVENT HANDLERS =====
  const handleDepositStageStarted = useCallback((data) => {
    console.log('🎯 Deposit stage started:', data)
    if (data.gameId === gameId) {
      const isChallenger = data.challenger?.toLowerCase() === address?.toLowerCase()
      const isCreator = data.creator?.toLowerCase() === address?.toLowerCase()
      
      console.log('🎯 Player roles in deposit stage:', { isChallenger, isCreator, challenger: data.challenger, creator: data.creator, address })
      
      if (isChallenger || isCreator) {
        setDepositState({
          phase: 'deposit_stage',
          creator: data.creator,
          challenger: data.challenger,
          timeRemaining: data.timeRemaining || 120,
          creatorDeposited: true, // Creator already deposited NFT
          challengerDeposited: data.challengerDeposited || false,
          cryptoAmount: data.cryptoAmount
        })
        setShowDepositOverlay(true)
      } else {
        console.log('❌ Neither challenger nor creator - not showing deposit overlay')
      }
    }
  }, [gameId, address])

  const handleDepositCountdown = useCallback((data) => {
    console.log('⏰ Deposit countdown update:', data)
    
    // Handle both gameId formats (with and without 'game_' prefix)
    const eventGameId = data.gameId?.replace('game_', '') || data.gameId
    const componentGameId = gameId?.replace('game_', '') || gameId
    
    if (eventGameId === componentGameId) {
      console.log('✅ Countdown update matches current game')
      setDepositState(prev => prev ? { 
        ...prev, 
        timeRemaining: data.timeRemaining,
        creatorDeposited: data.creatorDeposited !== undefined ? data.creatorDeposited : prev.creatorDeposited,
        challengerDeposited: data.challengerDeposited !== undefined ? data.challengerDeposited : prev.challengerDeposited
      } : null)
    } else {
      console.log('❌ Countdown update gameId mismatch:', { eventGameId, componentGameId })
    }
  }, [gameId])

  const handleDepositConfirmed = useCallback((data) => {
    console.log('💰 Deposit confirmed:', data)
    
    // Handle both gameId formats (with and without 'game_' prefix)
    const eventGameId = data.gameId?.replace('game_', '') || data.gameId
    const componentGameId = gameId?.replace('game_', '') || gameId
    
    if (eventGameId === componentGameId) {
      console.log('✅ Deposit confirmed for current game')
      setDepositState(prev => prev ? {
        ...prev,
        creatorDeposited: data.creatorDeposited || prev.creatorDeposited,
        challengerDeposited: data.challengerDeposited || prev.challengerDeposited
      } : null)
      
      // Check if both players have deposited - unlock game tab
      const bothDeposited = data.creatorDeposited && data.challengerDeposited
      if (bothDeposited) {
        console.log('🎮 Both players deposited - game ready!')
        setIsGameReady(true)
        setShowDepositOverlay(false)
        setDepositState(null)
        
        // Transport to game room
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('switchToFlipSuite', {
            detail: { gameId: gameId, immediate: true }
          }))
        }, 1000)
      }
    } else {
      console.log('❌ Deposit confirmed gameId mismatch:', { eventGameId, componentGameId })
    }
  }, [gameId])

  const handleGameStarted = useCallback((data) => {
    console.log('🎮 Game started:', data)
    if (data.gameId === gameId) {
      setShowDepositOverlay(false)
      setDepositState(null)
      setIsGameReady(true)
      setActiveTab('game') // Switch to game tab when game starts
      showSuccess('Game started!')
    }
  }, [gameId, showSuccess])

  const handleGameNotFound = useCallback((data) => {
    console.error('❌ Game not found:', data)
    setLoading(false)
    showError(`Game not found: ${data.gameId || 'Unknown'} - ${data.error || 'Game may not exist or has ended'}`)
  }, [showError])

  const handleOfferAccepted = useCallback((data) => {
    console.log('🎯 Offer accepted event received:', data)
    
    // Handle both gameId formats (with and without 'game_' prefix)
    const eventGameId = data.gameId?.replace('game_', '') || data.gameId
    const componentGameId = gameId?.replace('game_', '') || gameId
    
    if (eventGameId === componentGameId) {
      console.log('✅ Offer accepted for current game')
      const isChallenger = (data.challengerAddress || data.challenger)?.toLowerCase() === address?.toLowerCase()
      const isCreator = finalGameData?.creator?.toLowerCase() === address?.toLowerCase()
      
      console.log('🎯 Player roles:', { isChallenger, isCreator, challenger: data.challengerAddress || data.challenger, creator: finalGameData?.creator, address })
      
      if (isChallenger) {
        console.log('✅ You are the challenger - need to deposit')
        setDepositState({
          phase: 'deposit_stage',
          creator: finalGameData?.creator,
          challenger: data.challengerAddress || data.challenger,
          timeRemaining: 120,
          creatorDeposited: true, // Creator already deposited NFT
          challengerDeposited: false,
          cryptoAmount: data.cryptoAmount || data.finalPrice
        })
        setShowDepositOverlay(true)
        showSuccess('Offer accepted! Please complete your deposit.')
      } else if (isCreator) {
        console.log('✅ You are the creator - waiting for challenger to deposit')
        setDepositState({
          phase: 'deposit_stage',
          creator: finalGameData?.creator,
          challenger: data.challengerAddress || data.challenger,
          timeRemaining: 120,
          creatorDeposited: true, // Creator already deposited NFT
          challengerDeposited: false,
          cryptoAmount: data.cryptoAmount || data.finalPrice
        })
        setShowDepositOverlay(true)
        showSuccess('Offer accepted! Waiting for challenger to deposit.')
      } else {
        console.log('❌ Neither challenger nor creator - ignoring')
      }
    } else {
      console.log('❌ Offer accepted gameId mismatch:', { eventGameId, componentGameId })
    }
  }, [gameId, finalGameData, address, showSuccess])

  // ===== SOCKET CONNECTION =====
  useEffect(() => {
    if (!gameId || !address || !finalGameData) return

    console.log('🔌 Connecting to game server...')

    const connectToGame = async () => {
      try {
        // Connect to socket
        await socketService.connect(gameId, address)
        setConnected(true)
        
        // Register event listeners
        socketService.on('room_joined', handleRoomJoined)
        socketService.on('game_state_update', handleGameStateUpdate)
        socketService.on('game_started', handleGameStarted)
        socketService.on('game_ready', handleGameReady)
        socketService.on('flip_executing', handleFlipExecuting)
        socketService.on('round_result', handleRoundResult)
        socketService.on('game_not_found', handleGameNotFound)
        
        // Deposit event listeners
        socketService.on('deposit_stage_started', handleDepositStageStarted)
        socketService.on('deposit_countdown', handleDepositCountdown)
        socketService.on('deposit_confirmed', handleDepositConfirmed)
        
        // Offer event listeners
        socketService.on('offer_accepted', handleOfferAccepted)
        
        // Join room
        socketService.emit('join_room', { 
          roomId: gameId.startsWith('game_') ? gameId : `game_${gameId}`, 
          address 
        })
        
        // Request current game state
        setTimeout(() => {
          socketService.emit('request_game_state', { gameId })
        }, 100)
        
      } catch (error) {
        console.error('❌ Failed to connect to game server:', error)
        showError('Failed to connect to game server')
      }
    }

    connectToGame()

    return () => {
      // Cleanup listeners
      socketService.off('room_joined', handleRoomJoined)
      socketService.off('game_state_update', handleGameStateUpdate)
      socketService.off('game_started', handleGameStarted)
      socketService.off('game_ready', handleGameReady)
      socketService.off('flip_executing', handleFlipExecuting)
      socketService.off('round_result', handleRoundResult)
      socketService.off('game_not_found', handleGameNotFound)
      
      // Deposit event cleanup
      socketService.off('deposit_stage_started', handleDepositStageStarted)
      socketService.off('deposit_countdown', handleDepositCountdown)
      socketService.off('deposit_confirmed', handleDepositConfirmed)
      
      // Offer event cleanup
      socketService.off('offer_accepted', handleOfferAccepted)
    }
  }, [gameId, address, finalGameData]) // Added finalGameData dependency

  // ===== SWITCH TO FLIP SUITE EVENT LISTENER =====
  useEffect(() => {
    const handleSwitchToFlipSuite = (event) => {
      console.log('🚀 switchToFlipSuite event received:', event.detail)
      const { gameId: eventGameId, immediate, player2, fallback, force, attempt } = event.detail
      
      // Only handle events for this game
      if (eventGameId === gameId) {
        console.log('🚀 Switching to flip suite tab for game:', gameId)
        setIsGameReady(true)
        setActiveTab('game')
        setShowDepositOverlay(false)
        setDepositState(null)
        
        if (immediate) {
          console.log('🚀 Immediate switch to game tab')
        }
        if (player2) {
          console.log('🚀 Player 2 transport to game tab')
        }
        if (fallback) {
          console.log('🚀 Fallback transport to game tab')
        }
        if (force) {
          console.log(`🚀 Force transport attempt ${attempt} to game tab`)
        }
      }
    }

    // Add event listener
    window.addEventListener('switchToFlipSuite', handleSwitchToFlipSuite)

    // Cleanup
    return () => {
      window.removeEventListener('switchToFlipSuite', handleSwitchToFlipSuite)
    }
  }, [gameId])

  // ===== USER ACTIONS - ALL GO TO SERVER =====
  const handleChoice = useCallback((choice) => {
    if (!canMakeChoice()) return
    
    console.log('🎯 Sending choice to server:', choice)
    socketService.emit('player_choice', {
      gameId,
      address,
      choice
    })
    
    showInfo(`You chose ${choice}!`)
  }, [canMakeChoice, gameId, address, showInfo])

  const handlePowerChargeStart = useCallback(() => {
    if (!canChargePower()) return
    
    console.log('⚡ Starting power charge')
    socketService.emit('start_power_charge', {
      gameId,
      address
    })
  }, [canChargePower, gameId, address])

  const handlePowerChargeStop = useCallback(() => {
    if (!serverState) return
    
    const isCharging = isCreator() ? serverState.creatorCharging : serverState.challengerCharging
    if (!isCharging) return
    
    console.log('⚡ Stopping power charge')
    socketService.emit('stop_power_charge', {
      gameId,
      address
    })
  }, [serverState, isCreator, gameId, address])

  // ===== DEPOSIT HANDLING =====
  const handleDeposit = useCallback(async () => {
    if (isDepositing || !depositState) return
    setIsDepositing(true)
    
    try {
      const userRole = depositState?.creator?.toLowerCase() === address?.toLowerCase() ? 'creator' : 'challenger'
      
      if (userRole === 'creator') {
        // Creator deposits NFT - should already be deposited
        showInfo('NFT already deposited!')
        showSuccess('NFT is ready for game!')
      } else if (userRole === 'challenger') {
        // Challenger deposits crypto
        showInfo('Depositing crypto...')
        
        if (!depositState?.cryptoAmount) {
          throw new Error('Crypto amount not found')
        }
        
        if (!contractService) {
          throw new Error('Contract service not available. Please connect your wallet.')
        }
        
        // Call real crypto deposit contract method
        const result = await contractService.depositETH(gameId, depositState.cryptoAmount)
        
        if (result.success) {
          showSuccess('Crypto deposited successfully!')
          
          // Notify server via Socket.io
          socketService.emit('deposit_confirmed', {
            gameId: gameId,
            player: address,
            assetType: 'crypto',
            transactionHash: result.transactionHash
          })
          
          // Also confirm via API endpoint
          try {
            await fetch(`/api/games/${gameId}/deposit-confirmed`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                player: address,
                assetType: 'eth',
                transactionHash: result.transactionHash
              })
            })
          } catch (apiError) {
            console.warn('⚠️ API confirmation failed:', apiError)
          }
          
          // Transport to game room immediately
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('switchToFlipSuite', {
              detail: { gameId: gameId, immediate: true, player2: true }
            }))
          }, 1000)
          
        } else {
          throw new Error(result.error || 'Crypto deposit failed')
        }
      }
      
    } catch (error) {
      console.error('❌ Deposit failed:', error)
      
      // Handle insufficient funds error with helpful message
      if (error.message?.includes('Insufficient funds') || error.message?.includes('exceeds the balance')) {
        const errorMsg = error.message.includes('Insufficient funds') 
          ? error.message 
          : 'Insufficient funds. You need more ETH to cover the deposit amount and gas fees.'
        
        showError(errorMsg + ' 💡 Tip: You can get ETH from exchanges like Coinbase, Binance, or use a faucet for testnet ETH.')
      } else {
        showError('Deposit failed: ' + error.message)
      }
    } finally {
      setIsDepositing(false)
    }
  }, [isDepositing, depositState, address, gameId, showInfo, showSuccess, showError, contractService])

  // Format time for countdown
  const formatTime = useCallback((seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }, [])

  // ===== TAB SWITCHING LOGIC =====
  const handleTabChange = useCallback((tabId) => {
    console.log(`📑 Switching to tab: ${tabId}`)
    setActiveTab(tabId)
  }, [])

  // Check if game is ready based on game data
  useEffect(() => {
    if (!finalGameData) return
    
    const readyStatuses = ['active', 'in_progress', 'playing']
    const readyPhases = ['active', 'game_active', 'playing']
    
    const statusReady = readyStatuses.includes(finalGameData.status)
    const phaseReady = readyPhases.includes(finalGameData.phase)
    const bothDeposited = finalGameData.creatorDeposited && finalGameData.challengerDeposited
    
    const gameReady = statusReady || phaseReady || bothDeposited
    setIsGameReady(gameReady)
    
    console.log('🎮 Game readiness check:', {
      status: finalGameData.status,
      phase: finalGameData.phase,
      bothDeposited,
      gameReady
    })
  }, [finalGameData])

  // ===== TAB RENDERING =====
  const renderTabContent = () => {
    const commonProps = {
      gameData: finalGameData,
      gameId,
      socket: socketService,
      connected,
      address,
      coinConfig: finalCoinConfig,
      isCreator: finalGameData?.creator?.toLowerCase() === address?.toLowerCase()
    }

    switch (activeTab) {
      case 'details':
        return <NFTDetailsTab {...commonProps} />
      case 'chat':
        return <ChatOffersTab {...commonProps} />
      case 'game':
        return <GameRoomTab {...commonProps} isGameReady={isGameReady} />
      default:
        return <NFTDetailsTab {...commonProps} />
    }
  }

  // ===== RENDER HELPERS =====
  const getStatusText = () => {
    if (loading) return 'Loading game...'
    if (!connected) return 'Connecting...'
    if (!serverState) return 'Waiting for game state...'
    
    const { gamePhase, currentTurn } = serverState
    const isYourTurn = isMyTurn()
    
    switch (gamePhase) {
      case 'waiting_choice':
        if (isYourTurn) return 'Choose heads or tails!'
        return `Waiting for ${currentTurn === serverState.creator ? 'creator' : 'challenger'} to choose...`
      
      case 'charging_power':
        if (isYourTurn) return 'Hold the coin to charge power!'
        return `${currentTurn === serverState.creator ? 'Creator' : 'Challenger'} is charging power...`
      
      case 'executing_flip':
        return 'Coin is flipping...'
      
      case 'showing_result':
        return `Round ${serverState.currentRound} complete!`
      
      case 'round_transition':
        return 'Starting next round...'
      
      default:
        return 'Game active'
    }
  }

  const getPlayerName = (playerAddress) => {
    if (!playerAddress) return 'Waiting...'
    return `${playerAddress.slice(0, 6)}...${playerAddress.slice(-4)}`
  }

  // ===== RENDER =====
  // Show loading state for game data
  if (gameDataLoading) {
    return (
      <TabbedContainer>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'white' }}>
          <LoadingSpinner />
          <div style={{ marginLeft: '1rem' }}>Loading game data...</div>
        </div>
      </TabbedContainer>
    )
  }

  // Show error state for game data
  if (gameDataError) {
    return (
      <TabbedContainer>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'red' }}>
          Error loading game: {gameDataError}
        </div>
      </TabbedContainer>
    )
  }

  // Show loading state for server connection
  if (loading) {
    return (
      <TabbedContainer>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'white' }}>
          <LoadingSpinner />
          <div style={{ marginLeft: '1rem' }}>Loading game...</div>
        </div>
      </TabbedContainer>
    )
  }

  if (!connected) {
    return (
      <TabbedContainer>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'white' }}>
          Connecting to game server...
        </div>
      </TabbedContainer>
    )
  }

  if (!finalGameData) {
    return (
      <TabbedContainer>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'red' }}>
          Game not found
        </div>
      </TabbedContainer>
    )
  }

  return (
    <TabbedContainer>
      {/* Tab Header */}
      <TabsHeader>
        <Tab 
          active={activeTab === 'details'} 
          onClick={() => handleTabChange('details')}
        >
          🎨 Flip Deets
        </Tab>
        <Tab 
          active={activeTab === 'chat'} 
          onClick={() => handleTabChange('chat')}
        >
          💬 Flip Lounge
        </Tab>
        <Tab 
          active={activeTab === 'game'} 
          onClick={() => handleTabChange('game')}
          disabled={!isGameReady}
          style={{ 
            opacity: isGameReady ? 1 : 0.5, 
            cursor: isGameReady ? 'pointer' : 'not-allowed' 
          }}
        >
          🎮 Flip Suite {!isGameReady && '(Locked)'}
        </Tab>
      </TabsHeader>

      {/* Tab Content */}
      <TabContent>
        {renderTabContent()}
      </TabContent>

      {/* Result Popup */}
      {showResultPopup && resultData && (
        <GameResultPopup
          isOpen={showResultPopup}
          onClose={() => setShowResultPopup(false)}
          resultData={resultData}
        />
      )}

      {/* Deposit Overlay */}
      {showDepositOverlay && depositState && (
        <DepositOverlay>
          <DepositModal>
            <CloseButton onClick={() => setShowDepositOverlay(false)}>✕</CloseButton>
            <DepositTitle>💰 Deposit Required</DepositTitle>
            <DepositSubtitle>
              {depositState.creator?.toLowerCase() === address?.toLowerCase() 
                ? 'Your NFT is already deposited. Waiting for challenger...'
                : 'You need to deposit crypto to join the game'
              }
            </DepositSubtitle>
            
            <CountdownDisplay isUrgent={depositState.timeRemaining <= 30}>
              {formatTime(depositState.timeRemaining)}
            </CountdownDisplay>
            
            <div style={{ marginBottom: '1rem', textAlign: 'center' }}>
              <div style={{ marginBottom: '0.5rem' }}>
                <strong>Creator:</strong> {depositState.creator?.slice(0, 6)}...{depositState.creator?.slice(-4)}
                <span style={{ color: '#00FF41', marginLeft: '0.5rem' }}>✅ NFT Deposited</span>
              </div>
              <div style={{ marginBottom: '0.5rem' }}>
                <strong>Challenger:</strong> {depositState.challenger?.slice(0, 6)}...{depositState.challenger?.slice(-4)}
                <span style={{ color: depositState.challengerDeposited ? '#00FF41' : '#FFA500', marginLeft: '0.5rem' }}>
                  {depositState.challengerDeposited ? '✅ Crypto Deposited' : '⏳ Awaiting Crypto'}
                </span>
              </div>
              <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#00FF41' }}>
                Amount: ${depositState.cryptoAmount}
              </div>
            </div>
            
            {/* Only show deposit button for challenger who hasn't deposited yet */}
            {depositState.challenger?.toLowerCase() === address?.toLowerCase() && !depositState.challengerDeposited && (
              <DepositButton 
                onClick={handleDeposit}
                disabled={isDepositing || depositState.timeRemaining === 0}
              >
                {isDepositing ? 'Processing Deposit...' : `Deposit $${depositState.cryptoAmount} Crypto`}
              </DepositButton>
            )}
            
            {/* Show waiting message for creator */}
            {depositState.creator?.toLowerCase() === address?.toLowerCase() && (
              <div style={{ 
                textAlign: 'center', 
                color: '#00BFFF', 
                padding: '1rem',
                background: 'rgba(0, 191, 255, 0.1)',
                borderRadius: '0.5rem',
                border: '1px solid rgba(0, 191, 255, 0.3)'
              }}>
                ✅ Your NFT is already deposited<br/>
                ⏳ Waiting for challenger to deposit crypto...
              </div>
            )}
            
            {/* Show success message when both deposited */}
            {depositState.challengerDeposited && (
              <div style={{ 
                textAlign: 'center', 
                color: '#00FF41', 
                padding: '1rem',
                background: 'rgba(0, 255, 65, 0.1)',
                borderRadius: '0.5rem',
                border: '1px solid rgba(0, 255, 65, 0.3)'
              }}>
                🎮 Both deposits confirmed! Starting game...
              </div>
            )}
          </DepositModal>
        </DepositOverlay>
      )}
    </TabbedContainer>
  )
}

export default FlipSuiteFinal