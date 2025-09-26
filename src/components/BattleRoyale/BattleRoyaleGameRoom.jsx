import React, { useState, useEffect, useCallback, useRef } from 'react'
import styled from '@emotion/styled'
import { useParams } from 'react-router-dom'
import { useWallet } from '../../contexts/WalletContext'
import { useToast } from '../../contexts/ToastContext'
import { useProfile } from '../../contexts/ProfileContext'
import socketService from '../../services/SocketService'
import Single3DCoin from './Single3DCoin'
import ProfilePicture from '../ProfilePicture'
import CoinSelector from '../CoinSelector'
import './BattleRoyaleCoins.css'

const GameContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-width: 1400px;
  margin: 0 auto;
  padding: 1rem;
  min-height: 100vh;
`

const RoundHeader = styled.div`
  text-align: center;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 20, 147, 0.5);
  border-radius: 1rem;
  padding: 1.5rem;
  
  .round-title {
    color: ${props => props.theme.colors.neonPink};
    font-size: 2rem;
    font-weight: bold;
    margin: 0 0 1rem 0;
  }
  
  .target-display {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    margin: 1rem 0;
    
    .target-label {
      color: ${props => props.theme.colors.textSecondary};
      font-size: 1.1rem;
    }
    
    .target-result {
      color: ${props => props.theme.colors.neonBlue};
      font-size: 1.5rem;
      font-weight: bold;
      text-transform: uppercase;
      padding: 0.5rem 1rem;
      background: rgba(0, 191, 255, 0.1);
      border: 1px solid rgba(0, 191, 255, 0.3);
      border-radius: 0.5rem;
      animation: ${props => props.showingTarget ? 'pulse 1s ease-in-out infinite' : 'none'};
    }
  }
  
  .timer {
    color: ${props => props.timeLeft <= 5 ? '#ff1493' : props.theme.colors.neonBlue};
    font-size: 1.2rem;
    font-weight: bold;
    animation: ${props => props.timeLeft <= 5 ? 'pulse 0.5s ease-in-out infinite' : 'none'};
  }
  
  @keyframes pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.7; transform: scale(1.05); }
  }
`

const PlayersGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
  flex: 1;
  
  @media (max-width: 1200px) {
    grid-template-columns: repeat(2, 1fr);
  }
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`

const PlayerCard = styled.div`
  background: ${props => {
    if (props.isEliminated) {
      return 'linear-gradient(135deg, rgba(255, 0, 0, 0.2) 0%, rgba(139, 0, 0, 0.2) 100%)'
    }
    if (props.isCurrentUser) {
      return 'linear-gradient(135deg, rgba(0, 255, 136, 0.2) 0%, rgba(0, 204, 106, 0.2) 100%)'
    }
    return 'linear-gradient(135deg, rgba(0, 191, 255, 0.1) 0%, rgba(138, 43, 226, 0.1) 100%)'
  }};
  border: 2px solid ${props => {
    if (props.isEliminated) return '#ff0000'
    if (props.isCurrentUser) return '#00ff88'
    return '#00bfff'
  }};
  border-radius: 1rem;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  position: relative;
  transition: all 0.3s ease;
  opacity: ${props => props.isEliminated ? 0.5 : 1};
  
  .elimination-overlay {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 3rem;
    color: #ff0000;
    z-index: 2;
    animation: eliminationPulse 2s ease-out;
  }
  
  @keyframes eliminationPulse {
    0% { transform: translate(-50%, -50%) scale(0); opacity: 0; }
    50% { transform: translate(-50%, -50%) scale(1.2); opacity: 1; }
    100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
  }
  
  .player-info {
    text-align: center;
    
    .player-address {
      color: ${props => props.theme.colors.textPrimary};
      font-family: monospace;
      font-size: 0.9rem;
      font-weight: bold;
    }
    
    .player-slot {
      color: ${props => props.theme.colors.textSecondary};
      font-size: 0.8rem;
    }
  }
  
  .choice-display {
    color: ${props => props.theme.colors.neonBlue};
    font-size: 0.9rem;
    font-weight: bold;
    text-transform: uppercase;
    background: rgba(0, 191, 255, 0.1);
    padding: 0.25rem 0.5rem;
    border-radius: 1rem;
    border: 1px solid rgba(0, 191, 255, 0.3);
  }
  
  .power-display {
    width: 100%;
    
    .power-label {
      color: ${props => props.theme.colors.textSecondary};
      font-size: 0.8rem;
      margin-bottom: 0.25rem;
    }
    
    .power-bar {
      width: 100%;
      height: 8px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 4px;
      overflow: hidden;
      
      .power-fill {
        height: 100%;
        background: linear-gradient(90deg, #00ff88 0%, #ffed4e 50%, #ff1493 100%);
        width: ${props => (props.power || 1) * 10}%;
        transition: width 0.3s ease;
      }
    }
    
    .power-value {
      color: ${props => props.theme.colors.neonBlue};
      font-size: 0.9rem;
      font-weight: bold;
      margin-top: 0.25rem;
      text-align: center;
    }
  }
  
  .status-indicator {
    position: absolute;
    top: 1rem;
    right: 1rem;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: ${props => {
      if (props.isEliminated) return '#ff0000'
      if (props.hasFlipped) return '#00ff88'
      if (props.hasChoice) return '#ffed4e'
      return '#666'
    }};
  }
`

const ActionPanel = styled.div`
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(0, 191, 255, 0.3);
  border-radius: 1rem;
  padding: 1.5rem;
  text-align: center;
  
  .action-title {
    color: ${props => props.theme.colors.neonBlue};
    font-size: 1.2rem;
    font-weight: bold;
    margin: 0 0 1rem 0;
  }
  
  .choice-buttons {
    display: flex;
    gap: 1rem;
    justify-content: center;
    margin: 1rem 0;
    
    button {
      padding: 1rem 2rem;
      border: none;
      border-radius: 0.5rem;
      font-size: 1.1rem;
      font-weight: bold;
      cursor: pointer;
      transition: all 0.3s ease;
      
      &.heads {
        background: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%);
        color: #333;
        
        &:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(255, 215, 0, 0.3);
        }
      }
      
      &.tails {
        background: linear-gradient(135deg, #c0c0c0 0%, #e5e5e5 100%);
        color: #333;
        
        &:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(192, 192, 192, 0.3);
        }
      }
      
      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
        transform: none;
      }
      
      &.selected {
        border: 3px solid #00ff88;
        box-shadow: 0 0 10px rgba(0, 255, 136, 0.5);
      }
    }
  }
  
  .flip-button {
    background: linear-gradient(135deg, #00ff88 0%, #00cc6a 100%);
    color: #000;
    border: none;
    padding: 1.5rem 3rem;
    border-radius: 2rem;
    font-size: 1.3rem;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.3s ease;
    text-transform: uppercase;
    user-select: none;
    border: 3px solid #00ff88;
    
    &:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 10px 20px rgba(0, 255, 136, 0.3);
    }
    
    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      transform: none;
    }
  }
  
  .waiting-message {
    color: ${props => props.theme.colors.textSecondary};
    font-style: italic;
    font-size: 1.1rem;
  }
`

const BattleRoyaleGameRoom = ({ 
  gameId: propGameId, 
  gameState: propGameState, 
  onMakeChoice, 
  onExecuteFlip, 
  onSpectate 
}) => {
  const { gameId: paramGameId } = useParams()
  const { address } = useWallet()
  const { showToast } = useToast()
  const { getCoinHeadsImage, getCoinTailsImage } = useProfile()
  
  // Use gameId from props or URL params
  const gameId = propGameId || paramGameId
  
  // Server-controlled state - ONLY from server
  const [serverState, setServerState] = useState(null)
  const [connected, setConnected] = useState(false)
  const [loading, setLoading] = useState(true)
  const [playerCoinImages, setPlayerCoinImages] = useState({})
  const [showResultPopup, setShowResultPopup] = useState(false)
  const [resultData, setResultData] = useState(null)
  const [isChargingPower, setIsChargingPower] = useState(false)
  const [currentPower, setCurrentPower] = useState(1)
  const powerIntervalRef = useRef(null)
  const [showCoinSelector, setShowCoinSelector] = useState(false)
  const [selectedPlayerForCoinChange, setSelectedPlayerForCoinChange] = useState(null)
  const [coinSides, setCoinSides] = useState({}) // Track which side (heads/tails) is showing for each player
  const [showStartNowWarning, setShowStartNowWarning] = useState(false)
  const [calculatedPayout, setCalculatedPayout] = useState(0)
  
  // Fix the isCreator check - add this near the top of the component:
  const isCreator = serverState?.creator?.toLowerCase() === address?.toLowerCase()

  // Load coin images for players
  const loadPlayerCoinImages = useCallback(async (playerAddress, coinData) => {
    try {
      let headsImage, tailsImage
      
      if (coinData?.type === 'custom') {
        headsImage = await getCoinHeadsImage(playerAddress)
        tailsImage = await getCoinTailsImage(playerAddress)
      } else {
        headsImage = coinData?.headsImage || '/coins/plainh.png'
        tailsImage = coinData?.tailsImage || '/coins/plaint.png'
      }
      
      setPlayerCoinImages(prev => ({
        ...prev,
        [playerAddress]: { headsImage, tailsImage }
      }))
    } catch (error) {
      console.error('Error loading coin images for player:', playerAddress, error)
      setPlayerCoinImages(prev => ({
        ...prev,
        [playerAddress]: { 
          headsImage: '/coins/plainh.png', 
          tailsImage: '/coins/plaint.png' 
        }
      }))
    }
  }, [getCoinHeadsImage, getCoinTailsImage])

  // ===== HELPER FUNCTIONS =====
  const isMyTurn = useCallback(() => {
    if (!serverState || !address) return false
    
    // In battle royale, all alive players can act simultaneously during choice/power phases
    const myPlayer = serverState.players?.[address.toLowerCase()]
    return myPlayer && myPlayer.status !== 'eliminated'
  }, [serverState, address])

  const canMakeChoice = useCallback(() => {
    if (!serverState || !address) return false
    
    const myPlayer = serverState.players?.[address.toLowerCase()]
    return serverState.gamePhase === 'waiting_choice' && 
           myPlayer && 
           myPlayer.status !== 'eliminated' &&
           !myPlayer.choice
  }, [serverState, address])

  const canChargePower = useCallback(() => {
    if (!serverState || !address) return false
    
    const myPlayer = serverState.players?.[address.toLowerCase()]
    return serverState.gamePhase === 'charging_power' && 
           myPlayer && 
           myPlayer.status !== 'eliminated' &&
           myPlayer.choice && 
           !myPlayer.hasFlipped
  }, [serverState, address])

  // ===== SOCKET EVENT HANDLERS =====
  const handleGameStateUpdate = useCallback((data) => {
    console.log('🎮 Battle Royale state update:', data)
    setServerState(data)
    setLoading(false)
    
    // Load coin images for all players
    if (data.players) {
      Object.entries(data.players).forEach(([playerAddress, player]) => {
        if (player.coin && !playerCoinImages[playerAddress]) {
          loadPlayerCoinImages(playerAddress, player.coin)
        }
      })
    }
  }, [loadPlayerCoinImages, playerCoinImages])

  const handleRoomJoined = useCallback((data) => {
    console.log('🏠 Battle Royale room joined:', data)
  }, [])

  const handleTargetReveal = useCallback((data) => {
    console.log('🎯 Target revealed for round:', data)
    showToast(`Target for this round: ${data.target.toUpperCase()}!`, 'info')
  }, [showToast])

  const handleFlipsExecuting = useCallback((data) => {
    console.log('🎲 All players flipping simultaneously:', data)
    showToast('All coins are flipping...', 'info')
    
    // Update server state with flip data
    setServerState(prev => ({
      ...prev,
      gamePhase: 'executing_flips',
      flipsInProgress: true,
      playerFlipStates: data.playerFlipStates
    }))
  }, [showToast])

  const handleRoundResult = useCallback((data) => {
    console.log('🎲 Battle Royale round result:', data)
    
    // Update server state with results
    setServerState(prev => ({
      ...prev,
      gamePhase: 'showing_result',
      roundResult: data.roundResult,
      eliminatedPlayers: data.eliminatedPlayers,
      survivingPlayers: data.survivingPlayers,
      currentRound: data.currentRound
    }))
    
    // Show result popup for eliminated players
    if (data.eliminatedPlayers?.includes(address)) {
      setResultData({
        isEliminated: true,
        round: data.currentRound,
        eliminatedCount: data.eliminatedPlayers.length,
        survivorsCount: data.survivingPlayers.length
      })
      setShowResultPopup(true)
    }
  }, [address])

  const handleGameComplete = useCallback((data) => {
    console.log('🏆 Battle Royale game complete:', data)
    
    const isWinner = data.winner?.toLowerCase() === address.toLowerCase()
    setResultData({
      isWinner,
      isGameComplete: true,
      winner: data.winner,
      finalPrize: data.finalPrize
    })
    setShowResultPopup(true)
  }, [address])

  const handleNewRound = useCallback((data) => {
    console.log('🔄 Battle Royale new round:', data)
    showToast(`Round ${data.currentRound} starting!`, 'info')
  }, [showToast])

  const handlePowerUpdate = useCallback((data) => {
    // Update power levels from server
    if (data.playerAddress?.toLowerCase() === address?.toLowerCase()) {
      setCurrentPower(data.power)
    }
    
    setServerState(prev => ({
      ...prev,
      players: {
        ...prev.players,
        [data.playerAddress]: {
          ...prev.players[data.playerAddress],
          power: data.power
        }
      }
    }))
  }, [address])

  const handleGameStarting = useCallback((data) => {
    console.log('🚀 Battle Royale game starting:', data)
    showToast(`Game starting in ${data.countdown} seconds!`, 'success')
    
    // Update server state to show starting phase
    setServerState(prev => ({
      ...prev,
      phase: 'starting',
      gamePhase: 'starting',
      countdown: data.countdown
    }))
  }, [showToast])

  // Handle coin change
  const handleCoinChange = useCallback((playerAddress) => {
    setSelectedPlayerForCoinChange(playerAddress)
    setShowCoinSelector(true)
  }, [])

  const handleCoinSelect = useCallback((coin) => {
    if (!selectedPlayerForCoinChange) return

    // Update player's coin choice
    const playerAddress = selectedPlayerForCoinChange
    
    // Load coin images for the new coin choice
    loadPlayerCoinImages(playerAddress, coin)
    
    // Send coin update to server
    try {
      socketService.emit('battle_royale_update_coin', {
        gameId,
        address: playerAddress,
        coinData: coin
      })
      console.log('🪙 Sent coin update to server:', coin)
      showToast(`Coin changed to ${coin.name}`, 'success')
    } catch (error) {
      console.error('Error sending coin update to server:', error)
      showToast('Failed to update coin', 'error')
    }
    
    setShowCoinSelector(false)
    setSelectedPlayerForCoinChange(null)
  }, [selectedPlayerForCoinChange, gameId, loadPlayerCoinImages, showToast])

  // Toggle coin side (heads/tails) for lobby viewing
  const toggleCoinSide = useCallback((playerAddress) => {
    setCoinSides(prev => ({
      ...prev,
      [playerAddress]: prev[playerAddress] === 'tails' ? 'heads' : 'tails'
    }))
  }, [])

  // Calculate payout for starting game early
  const calculateEarlyStartPayout = useCallback(() => {
    const currentPlayers = serverState?.playerSlots?.filter(Boolean).length || 0
    const maxPlayers = 8
    const basePayout = serverState?.entryFee || 0 // Assuming entry fee is the base payout
    
    // Calculate reduced payout based on player count
    // Formula: (currentPlayers / maxPlayers) * basePayout
    const payoutRatio = currentPlayers / maxPlayers
    const reducedPayout = Math.floor(basePayout * payoutRatio)
    
    return {
      currentPlayers,
      maxPlayers,
      basePayout,
      reducedPayout,
      payoutRatio: Math.round(payoutRatio * 100) // Percentage
    }
  }, [serverState?.playerSlots, serverState?.entryFee])

  // Handle start now button click
  const handleStartNowClick = useCallback(() => {
    const payoutInfo = calculateEarlyStartPayout()
    setCalculatedPayout(payoutInfo.reducedPayout)
    setShowStartNowWarning(true)
  }, [calculateEarlyStartPayout])

  // Handle proceed with early start
  const handleProceedStart = useCallback(() => {
    console.log('🚀 Proceeding with early start!', {
      gameId,
      address,
      serverState: serverState?.phase,
      currentPlayers: serverState?.currentPlayers
    })
    try {
      socketService.emit('battle_royale_start_early', {
        gameId,
        address
      })
      console.log('🚀 Sent early start request to server')
      showToast('Game starting now!', 'success')
    } catch (error) {
      console.error('Error starting game early:', error)
      showToast('Failed to start game', 'error')
    }
    setShowStartNowWarning(false)
  }, [gameId, address, showToast, serverState])

  // ===== SOCKET CONNECTION =====
  useEffect(() => {
    if (!gameId || !address) return

    console.log('🔌 Connecting to Battle Royale game server...')

    const connectToGame = async () => {
      try {
        await socketService.connect(gameId, address)
        setConnected(true)
        
        // Register event listeners
        socketService.on('room_joined', handleRoomJoined)
        socketService.on('battle_royale_state_update', handleGameStateUpdate)
        socketService.on('battle_royale_starting', handleGameStarting)
        socketService.on('battle_royale_target_reveal', handleTargetReveal)
        socketService.on('battle_royale_flips_executing', handleFlipsExecuting)
        socketService.on('battle_royale_round_result', handleRoundResult)
        socketService.on('battle_royale_game_complete', handleGameComplete)
        socketService.on('battle_royale_new_round', handleNewRound)
        socketService.on('battle_royale_power_update', handlePowerUpdate)
        
        // Join room
        socketService.emit('join_battle_royale_room', { 
          roomId: gameId.startsWith('br_') ? gameId : `br_${gameId}`, 
          address 
        })
        
        // Request current game state
        setTimeout(() => {
          socketService.emit('request_battle_royale_state', { gameId })
        }, 100)
        
      } catch (error) {
        console.error('❌ Failed to connect to Battle Royale game server:', error)
        showToast('Failed to connect to game server', 'error')
      }
    }

    connectToGame()

    return () => {
      // Cleanup listeners
      socketService.off('room_joined', handleRoomJoined)
      socketService.off('battle_royale_state_update', handleGameStateUpdate)
      socketService.off('battle_royale_target_reveal', handleTargetReveal)
      socketService.off('battle_royale_flips_executing', handleFlipsExecuting)
      socketService.off('battle_royale_round_result', handleRoundResult)
      socketService.off('battle_royale_game_complete', handleGameComplete)
      socketService.off('battle_royale_new_round', handleNewRound)
      socketService.off('battle_royale_power_update', handlePowerUpdate)
    }
  }, [gameId, address, showToast, handleRoomJoined, handleGameStateUpdate, handleTargetReveal, handleFlipsExecuting, handleRoundResult, handleGameComplete, handleNewRound, handlePowerUpdate])

  // ===== USER ACTIONS =====
  const handleChoice = useCallback((choice) => {
    if (!canMakeChoice()) return
    
    console.log('🎯 Sending choice to server:', choice)
    socketService.emit('battle_royale_player_choice', {
      gameId,
      address,
      choice
    })
    
    showToast(`You chose ${choice}!`, 'success')
  }, [canMakeChoice, gameId, address, showToast])

  const handlePowerChargeStart = useCallback(() => {
    if (!canChargePower()) return
    
    console.log('⚡ Starting power charge')
    setIsChargingPower(true)
    setCurrentPower(1)
    
    // Send start charge event to server
    socketService.emit('battle_royale_start_power_charge', {
      gameId,
      address
    })
    
    // Start local power accumulation for UI feedback
    const startTime = Date.now()
    powerIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime
      const newPower = Math.min(10, 1 + (elapsed / 200)) // 2 seconds to reach max
      setCurrentPower(newPower)
      
      // Send power updates to server
      socketService.emit('battle_royale_power_update', {
        gameId,
        address,
        power: newPower
      })
      
      if (newPower >= 10) {
        handlePowerChargeStop()
      }
    }, 50)
  }, [canChargePower, gameId, address])

  const handlePowerChargeStop = useCallback(() => {
    if (!isChargingPower) return
    
    console.log('⚡ Stopping power charge at:', currentPower)
    setIsChargingPower(false)
    
    if (powerIntervalRef.current) {
      clearInterval(powerIntervalRef.current)
      powerIntervalRef.current = null
    }
    
    // Send final power to server
    socketService.emit('battle_royale_stop_power_charge', {
      gameId,
      address,
      finalPower: currentPower
    })
    
    // Auto-execute flip after stopping charge
    setTimeout(() => {
      socketService.emit('battle_royale_execute_flip', {
        gameId,
        address
      })
    }, 100)
  }, [isChargingPower, currentPower, gameId, address])

  // Show loading state
  if (loading) {
    return (
      <GameContainer>
        <div style={{ 
          textAlign: 'center', 
          color: 'white', 
          fontSize: '1.2rem',
          padding: '2rem'
        }}>
          Loading Battle Royale Game...
        </div>
      </GameContainer>
    )
  }

  if (!serverState) {
    return (
      <GameContainer>
        <div style={{ 
          textAlign: 'center', 
          color: 'white', 
          fontSize: '1.2rem',
          padding: '2rem'
        }}>
          Waiting for game state...
        </div>
      </GameContainer>
    )
  }

  // Get current user's player data
  const currentPlayer = serverState?.players?.[address.toLowerCase()]
  const isParticipant = !!currentPlayer
  const isEliminated = currentPlayer?.status === 'eliminated'
  const isAlive = isParticipant && !isEliminated

  const formatAddress = (addr) => {
    if (!addr) return ''
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  const getPhaseMessage = () => {
    if (!serverState) return 'Loading...'
    
    switch (serverState.gamePhase) {
      case 'waiting_players':
        return 'Waiting for all players to join...'
      case 'revealing_target':
        return 'Revealing target for this round...'
      case 'waiting_choice':
        return isAlive ? 'Choose heads or tails!' : 'Players are choosing...'
      case 'charging_power':
        return isAlive ? 'Hold to charge power!' : 'Players are charging power...'
      case 'executing_flips':
        return 'All coins are flipping...'
      case 'showing_result':
        return 'Round complete!'
      case 'game_complete':
        return 'Game finished!'
      default:
        return 'Waiting...'
    }
  }

  return (
    <GameContainer>
      <RoundHeader 
        showingTarget={serverState?.gamePhase === 'showing_result'}
        timeLeft={serverState?.roundCountdown || 0}
      >
        <div className="round-title">
          Round {serverState?.currentRound || 1}
        </div>
        
        {serverState?.targetResult && (
          <div className="target-display">
            <span className="target-label">Target:</span>
            <span className="target-result">{serverState.targetResult}</span>
          </div>
        )}
        
        <div className="timer">
          {serverState?.roundCountdown > 0 ? 
            `${serverState.roundCountdown}s remaining` : 
            getPhaseMessage()
          }
        </div>
      </RoundHeader>


      {/* 3D coins will be rendered within each PlayerCard instead of as a separate component */}

      <PlayersGrid>
        {serverState?.playerSlots?.map((playerAddress, index) => {
          if (!playerAddress) return null
          
          const player = serverState.players?.[playerAddress.toLowerCase()]
          const isCurrentUser = playerAddress.toLowerCase() === address?.toLowerCase()
          const isEliminated = player?.status === 'eliminated'
          
          return (
            <PlayerCard
              key={index}
              isCurrentUser={isCurrentUser}
              isEliminated={isEliminated}
              hasChoice={!!player?.choice}
              hasFlipped={player?.hasFlipped}
              power={player?.power || 1}
            >
              {isEliminated && (
                <div className="elimination-overlay">❌</div>
              )}
              
              <div className="status-indicator" />
              
              <div className="player-info">
                <div className="player-address">
                  {formatAddress(playerAddress)}
                </div>
                <div className="player-slot">
                  {index === 0 ? 'Creator' : `Player ${index + 1}`}
                </div>
              </div>
              
              {/* Coin display - 2D image in lobby, 3D coin in game */}
              <div className="coin-placeholder">
                {serverState?.gamePhase === 'filling' ? (
                  // 2D coin image for lobby phase
                  <>
                    <img 
                      src={
                        coinSides[playerAddress] === 'tails' 
                          ? (playerCoinImages[playerAddress]?.tailsImage || '/coins/plaint.png')
                          : (playerCoinImages[playerAddress]?.headsImage || '/coins/plainh.png')
                      }
                      alt={`Player ${index + 1} coin`}
                      className="coin-image clickable"
                      onClick={() => toggleCoinSide(playerAddress)}
                    />
                    <div className="coin-slot-number">{index + 1}</div>
                    <div className="coin-side-indicator">
                      {coinSides[playerAddress] === 'tails' ? 'Tails' : 'Heads'}
                    </div>
                  </>
                ) : (
                  // 3D coin for active game phases
                  <>
                    <Single3DCoin
                      playerAddress={playerAddress}
                      coinData={player?.coin}
                      playerIndex={index}
                      gamePhase={serverState?.gamePhase}
                      isFlippable={true}
                      onFlip={(playerAddress, result) => {
                        console.log(`Player ${playerAddress} flipped: ${result}`)
                        // TODO: Send flip choice to server
                      }}
                      playerCoinImages={playerCoinImages}
                      size={200}
                    />
                    <div className="coin-slot-number">{index + 1}</div>
                  </>
                )}
                
                {/* Change Coin Button for current user - only show in lobby */}
                {isCurrentUser && serverState?.gamePhase === 'filling' && (
                  <button 
                    className="coin-change-button"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleCoinChange(playerAddress)
                    }}
                  >
                    Change Coin
                  </button>
                )}
              </div>
              
              {player?.choice && !player?.coinState?.isFlipping && (
                <div className="choice-display">
                  Choice: {player.choice}
                </div>
              )}
              
              <div className="power-display">
                <div className="power-label">Power Level</div>
                <div className="power-bar">
                  <div className="power-fill" />
                </div>
                <div className="power-value">{(player?.power || 1).toFixed(1)}/10</div>
              </div>
            </PlayerCard>
          )
        })}
      </PlayersGrid>

      {/* Action Panel */}
      {isAlive && (
        <ActionPanel>
          <div className="action-title">Your Actions</div>
          
          {/* Choice Phase */}
          {canMakeChoice() && (
            <div className="choice-buttons">
              <button
                className="heads"
                onClick={() => handleChoice('heads')}
              >
                👑 Heads
              </button>
              <button
                className="tails"
                onClick={() => handleChoice('tails')}
              >
                🗿 Tails
              </button>
            </div>
          )}
          
          {/* Power Charging Phase */}
          {canChargePower() && (
            <>
              <div style={{ marginBottom: '1rem', color: '#FFD700' }}>
                Your choice: {currentPlayer?.choice?.toUpperCase()}
              </div>
              <button
                className="flip-button"
                onMouseDown={handlePowerChargeStart}
                onMouseUp={handlePowerChargeStop}
                onMouseLeave={handlePowerChargeStop}
                onTouchStart={handlePowerChargeStart}
                onTouchEnd={handlePowerChargeStop}
                style={{
                  animation: isChargingPower ? 'pulse 0.5s infinite' : 'none'
                }}
              >
                {isChargingPower ? `⚡ CHARGING: ${currentPower.toFixed(1)} ⚡` : '⚡ HOLD TO CHARGE ⚡'}
              </button>
              <div style={{ marginTop: '1rem', fontSize: '0.9rem', color: '#888' }}>
                Power affects flip duration and drama!
              </div>
            </>
          )}
          
          {/* Waiting States */}
          {currentPlayer?.hasFlipped && serverState?.gamePhase === 'charging_power' && (
            <div className="waiting-message">
              Waiting for other players to flip...
            </div>
          )}
          
          {currentPlayer?.choice && serverState?.gamePhase === 'waiting_choice' && (
            <div className="waiting-message">
              You chose {currentPlayer.choice}. Waiting for others...
            </div>
          )}
        </ActionPanel>
      )}
      
      {/* Spectator/Eliminated Panel */}
      {!isParticipant && (
        <ActionPanel>
          <div className="action-title">Spectating</div>
          <div className="waiting-message">
            You are watching this Battle Royale game.
          </div>
        </ActionPanel>
      )}
      
      {isEliminated && (
        <ActionPanel>
          <div className="action-title">Eliminated</div>
          <div className="waiting-message">
            You were eliminated in round {currentPlayer?.eliminatedInRound}. 
            Better luck next time!
          </div>
        </ActionPanel>
      )}

      {/* Result Popup */}
      {showResultPopup && resultData && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.9)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000
        }}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.95), rgba(20, 20, 20, 0.95))',
            border: '3px solid #FF1493',
            borderRadius: '1rem',
            padding: '3rem',
            textAlign: 'center',
            color: 'white',
            maxWidth: '500px',
            margin: '1rem'
          }}>
            {resultData.isEliminated ? (
              <>
                <h2 style={{ color: '#FF1493', fontSize: '2rem', margin: '0 0 1rem 0' }}>
                  ❌ Eliminated!
                </h2>
                <p style={{ fontSize: '1.2rem', marginBottom: '2rem' }}>
                  You were eliminated in round {resultData.round}.
                  <br />
                  {resultData.eliminatedCount} players eliminated, {resultData.survivorsCount} remaining.
                </p>
              </>
            ) : resultData.isWinner ? (
              <>
                <h2 style={{ color: '#00FF41', fontSize: '2rem', margin: '0 0 1rem 0' }}>
                  🏆 You Won!
                </h2>
                <p style={{ fontSize: '1.2rem', marginBottom: '2rem' }}>
                  Congratulations! You won the Battle Royale!
                  <br />
                  You've earned the NFT prize!
                </p>
                <p style={{ color: '#FFD700', fontSize: '1.1rem' }}>
                  NFT Prize: {resultData.finalPrize}
                </p>
              </>
            ) : (
              <>
                <h2 style={{ color: '#FF1493', fontSize: '2rem', margin: '0 0 1rem 0' }}>
                  💔 Game Over
                </h2>
                <p style={{ fontSize: '1.2rem', marginBottom: '2rem' }}>
                  The winner is {formatAddress(resultData.winner)}. 
                  <br />
                  Better luck next time!
                </p>
              </>
            )}
            
            <button
              onClick={() => {
                setShowResultPopup(false)
                setResultData(null)
                if (resultData.isGameComplete) {
                  window.location.href = '/'
                }
              }}
              style={{
                background: 'linear-gradient(135deg, #00BFFF, #0080FF)',
                color: 'white',
                border: 'none',
                padding: '1rem 2rem',
                borderRadius: '0.5rem',
                fontSize: '1.1rem',
                fontWeight: 'bold',
                cursor: 'pointer',
                marginTop: '1rem'
              }}
            >
              {resultData.isGameComplete ? 'Return to Home' : 'Continue Watching'}
            </button>
          </div>
        </div>
      )}

      {/* Coin Selector Modal */}
      {showCoinSelector && (
        <CoinSelector
          isOpen={showCoinSelector}
          onClose={() => {
            setShowCoinSelector(false)
            setSelectedPlayerForCoinChange(null)
          }}
          onSelect={handleCoinSelect}
          currentCoin={null}
        />
      )}

      {/* Start Now Warning Modal */}
      {showStartNowWarning && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #1a1a1a, #2d2d2d)',
            border: '2px solid #ff6b6b',
            borderRadius: '1rem',
            padding: '2rem',
            maxWidth: '500px',
            width: '90%',
            textAlign: 'center',
            color: 'white'
          }}>
            <h2 style={{ 
              color: '#ff6b6b', 
              marginBottom: '1rem',
              fontSize: '1.5rem'
            }}>
              ⚠️ Start Game Early?
            </h2>
            
            <div style={{ marginBottom: '1.5rem' }}>
              <p style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>
                If you start now with {calculateEarlyStartPayout().currentPlayers} players, 
                you will only receive:
              </p>
              
              <div style={{
                background: 'rgba(255, 107, 107, 0.2)',
                border: '1px solid #ff6b6b',
                borderRadius: '0.5rem',
                padding: '1rem',
                margin: '1rem 0'
              }}>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#ff6b6b' }}>
                  {calculatedPayout} ETH
                </div>
                <div style={{ fontSize: '0.9rem', color: '#888' }}>
                  Instead of {calculateEarlyStartPayout().basePayout} ETH (full game)
                </div>
                <div style={{ fontSize: '0.8rem', color: '#ff6b6b', marginTop: '0.5rem' }}>
                  {calculateEarlyStartPayout().payoutRatio}% of full payout
                </div>
              </div>
              
              <p style={{ fontSize: '0.9rem', color: '#ccc' }}>
                This is because you're starting with fewer players than the maximum of 8.
              </p>
            </div>
            
            <div style={{ 
              display: 'flex', 
              gap: '1rem', 
              justifyContent: 'center' 
            }}>
              <button
                onClick={() => setShowStartNowWarning(false)}
                style={{
                  background: 'linear-gradient(135deg, #666, #444)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  padding: '0.8rem 1.5rem',
                  fontSize: '1rem',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'linear-gradient(135deg, #777, #555)'
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'linear-gradient(135deg, #666, #444)'
                }}
              >
                Return
              </button>
              
              <button
                onClick={handleProceedStart}
                style={{
                  background: 'linear-gradient(135deg, #ff6b6b, #ee5a24)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  padding: '0.8rem 1.5rem',
                  fontSize: '1rem',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'linear-gradient(135deg, #ff5252, #d63031)'
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'linear-gradient(135deg, #ff6b6b, #ee5a24)'
                }}
              >
                Proceed
              </button>
            </div>
          </div>
        </div>
      )}
    </GameContainer>
  )
}

export default BattleRoyaleGameRoom