import React, { useState, useEffect, useCallback, useRef } from 'react'
import styled from '@emotion/styled'
import { useParams } from 'react-router-dom'
import { useWallet } from '../../contexts/WalletContext'
import { useToast } from '../../contexts/ToastContext'
import { useProfile } from '../../contexts/ProfileContext'
import socketService from '../../services/SocketService'
import BattleRoyale3DCoins from './BattleRoyale3DCoins'
import ErrorBoundary from './ErrorBoundary'
import ProfilePicture from '../ProfilePicture'
import CoinSelector from '../CoinSelector'
import './BattleRoyaleCoins.css'

const GameContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  min-height: 100vh;
  overflow-y: auto;
`

const RoundHeader = styled.div`
  text-align: center;
  background: rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(15px);
  border: 3px solid #FF1493;
  border-radius: 1rem;
  padding: 1.5rem;
  
  .round-title {
    color: ${props => props.theme?.colors?.neonPink || '#FF1493'};
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
    color: ${props => props.timeLeft <= 5 ? '#ff1493' : '#00bfff'};
    font-size: 1.4rem;
    font-weight: bold;
    text-shadow: 0 0 10px ${props => props.timeLeft <= 5 ? 'rgba(255, 20, 147, 0.8)' : 'rgba(0, 191, 255, 0.8)'};
    background: ${props => props.timeLeft <= 5 ? 'rgba(255, 20, 147, 0.1)' : 'rgba(0, 191, 255, 0.1)'};
    border: 1px solid ${props => props.timeLeft <= 5 ? 'rgba(255, 20, 147, 0.3)' : 'rgba(0, 191, 255, 0.3)'};
    border-radius: 0.5rem;
    padding: 0.5rem 1rem;
    margin-top: 0.5rem;
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
  
  // Add this check at the beginning of the component
  useEffect(() => {
    // Ensure we're in the correct route
    if (!window.location.pathname.includes('/play')) {
      console.warn('BattleRoyaleGameRoom rendered in wrong route')
      return
    }
  }, [])
  
  // Server-controlled state - ONLY from server
  const [serverState, setServerState] = useState(null)
  const [connected, setConnected] = useState(false)
  const [loading, setLoading] = useState(true)
  const [playerCoinImages, setPlayerCoinImages] = useState({})
  const [showResultPopup, setShowResultPopup] = useState(false)
  const [resultData, setResultData] = useState(null)
  const [playerChoice, setPlayerChoice] = useState(null)
  const [hasChosen, setHasChosen] = useState(false)
  const [chargingPower, setChargingPower] = useState(0)
  const [isCharging, setIsCharging] = useState(false)
  const chargeIntervalRef = useRef(null)
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
  }, [])

  // ===== HELPER FUNCTIONS =====
  const isMyTurn = useCallback(() => {
    if (!serverState || !address) return false
    
    // In battle royale, all alive players can act simultaneously during choice/power phases
    const myPlayer = serverState.players?.[address.toLowerCase()]
    return myPlayer && myPlayer.status !== 'eliminated'
  }, [])

  // Add choice handler:
  const handleChoice = useCallback((choice) => {
    if (serverState?.gamePhase !== 'waiting_choice' || hasChosen) return
    
    setPlayerChoice(choice)
    setHasChosen(true)
    
    socketService.emit('battle_royale_player_choice', {
      gameId,
      address,
      choice
    })
    
    showToast(`You chose ${choice.toUpperCase()}!`, 'success')
  }, [])

  // REMOVED: canMakeChoice - Battle Royale doesn't use player choices

  const canChargePower = useCallback(() => {
    if (!serverState || !address) return false
    
    const myPlayer = serverState.players?.[address.toLowerCase()]
    return serverState.gamePhase === 'charging_power' && 
           myPlayer && 
           myPlayer.status !== 'eliminated' &&
           !myPlayer.hasFlipped
  }, [])

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
  }, [])

  const handleRoomJoined = useCallback((data) => {
    console.log('🏠 Battle Royale room joined:', data)
  }, [])

  const handleTargetReveal = useCallback((data) => {
    console.log('🎯 Target revealed for round:', data)
    showToast(`Target for this round: ${data.target.toUpperCase()}!`, 'info')
  }, [])

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
  }, [])

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
  }, [])

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
  }, [])

  const handleNewRound = useCallback((data) => {
    console.log('🔄 Battle Royale new round:', data)
    showToast(`Round ${data.currentRound} starting!`, 'info')
  }, [])

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
  }, [])

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
  }, [])

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
  }, [])

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
  }, [])

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
  }, [])

  // Handle manual phase advancement (for debugging)
  const handleAdvancePhase = useCallback(() => {
    console.log('🔧 Manually advancing phase')
    socketService.emit('battle_royale_advance_phase', { gameId, address })
  }, [gameId, address])

  // ===== SOCKET CONNECTION =====
  useEffect(() => {
    if (!gameId || !address) return

    let mounted = true
    console.log('🔌 Connecting to Battle Royale game server...')

    const connectToGame = async () => {
      try {
        await socketService.connect(gameId, address)
        if (mounted) {
          setConnected(true)
        }
        
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
        if (mounted) {
          showToast('Failed to connect to game server', 'error')
        }
      }
    }

    connectToGame()

    return () => {
      mounted = false
      // Cleanup listeners
      socketService.off('room_joined', handleRoomJoined)
      socketService.off('battle_royale_state_update', handleGameStateUpdate)
      socketService.off('battle_royale_starting', handleGameStarting)
      socketService.off('battle_royale_target_reveal', handleTargetReveal)
      socketService.off('battle_royale_flips_executing', handleFlipsExecuting)
      socketService.off('battle_royale_round_result', handleRoundResult)
      socketService.off('battle_royale_game_complete', handleGameComplete)
      socketService.off('battle_royale_new_round', handleNewRound)
      socketService.off('battle_royale_power_update', handlePowerUpdate)
    }
  }, [gameId, address])

  // ===== USER ACTIONS =====
  // REMOVED: handleChoice - Battle Royale doesn't use player choices

  // Replace the power charging handlers with simpler ones:
  const handleStartCharge = useCallback(() => {
    if (!canChargePower() || isCharging) return
    
    setIsCharging(true)
    setChargingPower(1)
    
    const startTime = Date.now()
    chargeIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime
      const power = Math.min(10, 1 + (elapsed / 200)) // 2 seconds to reach max
      setChargingPower(power)
      
      if (power >= 10) {
        handleStopCharge()
      }
    }, 50)
  }, [])

  const handleStopCharge = useCallback(() => {
    if (!isCharging) return
    
    if (chargeIntervalRef.current) {
      clearInterval(chargeIntervalRef.current)
      chargeIntervalRef.current = null
    }
    
    const finalPower = chargingPower
    setIsCharging(false)
    
    // Execute flip with power
    socketService.emit('battle_royale_execute_flip', {
      gameId,
      address,
      power: finalPower
    })
    
    showToast(`Flipping with power ${finalPower.toFixed(1)}!`, 'info')
  }, [])

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

  // Add this safety check before rendering
  if (!serverState || !serverState.playerSlots) {
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
        return 'Waiting for game to start...'
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

      {/* Debug Phase Advancement Button */}
      {process.env.NODE_ENV === 'development' && (
        <div style={{ 
          textAlign: 'center', 
          margin: '1rem 0',
          padding: '0.5rem',
          background: 'rgba(255, 0, 0, 0.1)',
          border: '1px solid rgba(255, 0, 0, 0.3)',
          borderRadius: '0.5rem'
        }}>
          <button
            onClick={handleAdvancePhase}
            style={{
              background: 'linear-gradient(135deg, #ff6b6b, #ee5a24)',
              color: 'white',
              border: 'none',
              padding: '0.5rem 1rem',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '0.9rem'
            }}
          >
            🔧 Advance Phase (Debug)
          </button>
          <div style={{ 
            fontSize: '0.8rem', 
            color: '#ff6b6b', 
            marginTop: '0.25rem' 
          }}>
            Current: {serverState?.gamePhase || 'unknown'}
          </div>
        </div>
      )}

      {/* Unified Battle Royale Coins Display */}
      {serverState && serverState.playerSlots && (
        <ErrorBoundary>
          <BattleRoyale3DCoins
            players={serverState.playerSlots.map((playerAddress, index) => {
              if (!playerAddress) return { address: null, coin: null, isEliminated: false }
              const player = serverState.players?.[playerAddress.toLowerCase()]
              return {
                address: playerAddress,
                coin: player?.coin,
                isEliminated: player?.status === 'eliminated',
                slotIndex: index
              }
            })}
            gamePhase={serverState?.gamePhase || serverState?.phase}
            serverState={serverState}
            flipStates={Object.fromEntries(
              Object.entries(serverState?.players || {})
                .filter(([_, player]) => player?.coinState)
                .map(([address, player]) => [address, player.coinState])
            )}
            onFlipComplete={(playerAddress, result) => {
              console.log(`Player ${playerAddress} flip complete: ${result}`)
            }}
            onPowerChargeStart={handleStartCharge}
            onPowerChargeStop={handleStopCharge}
            playerCoinImages={playerCoinImages}
            isCreator={isCreator}
            currentUserAddress={address}
            size={240}
            onSlotClick={() => {}}
            canJoin={false}
            isJoining={false}
            coinSides={coinSides}
            onCoinSideToggle={toggleCoinSide}
            onCoinChange={handleCoinChange}
          />
        </ErrorBoundary>
      )}


      {/* Action Panel */}
      {isAlive && (
        <ActionPanel>
          <div className="action-title">Your Actions</div>
          
          {/* Choice Phase */}
          {serverState?.gamePhase === 'waiting_choice' && isAlive && !hasChosen && (
            <>
              <div className="action-title">Choose Your Side!</div>
              <div className="choice-buttons">
                <button
                  className="heads"
                  onClick={() => handleChoice('heads')}
                  disabled={hasChosen}
                >
                  🟡 HEADS
                </button>
                <button
                  className="tails"
                  onClick={() => handleChoice('tails')}
                  disabled={hasChosen}
                >
                  🔴 TAILS
                </button>
              </div>
              <div style={{ marginTop: '1rem', color: '#aaa' }}>
                Time left: {serverState?.roundCountdown || 0}s
              </div>
            </>
          )}

          {serverState?.gamePhase === 'waiting_choice' && hasChosen && (
            <>
              <div className="action-title">You chose: {playerChoice?.toUpperCase()}</div>
              <div className="waiting-message">
                Waiting for charging phase...
              </div>
            </>
          )}
          
          {/* Power Charging Phase */}
          {serverState?.gamePhase === 'charging_power' && isAlive && (
            <>
              <div className="action-title">Charge Your Flip!</div>
              <div style={{ marginBottom: '1rem', color: '#FFD700' }}>
                Your choice: {playerChoice?.toUpperCase()}
              </div>
              
              <button
                className="flip-button"
                onMouseDown={handleStartCharge}
                onMouseUp={handleStopCharge}
                onMouseLeave={handleStopCharge}
                onTouchStart={(e) => {
                  e.preventDefault()
                  handleStartCharge()
                }}
                onTouchEnd={(e) => {
                  e.preventDefault()
                  handleStopCharge()
                }}
                style={{
                  background: isCharging 
                    ? `linear-gradient(135deg, #FFD700 ${chargingPower * 10}%, #00ff88 100%)`
                    : 'linear-gradient(135deg, #00ff88, #00cc6a)',
                  transform: isCharging ? 'scale(1.1)' : 'scale(1)',
                  transition: 'all 0.2s ease'
                }}
              >
                {isCharging ? `⚡ POWER: ${chargingPower.toFixed(1)} ⚡` : '⚡ HOLD TO CHARGE ⚡'}
              </button>
              
              {/* Power bar visualization */}
              <div style={{
                width: '100%',
                height: '20px',
                background: 'rgba(0, 0, 0, 0.5)',
                border: '2px solid #FFD700',
                borderRadius: '10px',
                marginTop: '1rem',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${chargingPower * 10}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #00ff88, #FFD700, #ff1493)',
                  transition: 'width 0.1s ease',
                  boxShadow: isCharging ? '0 0 10px #FFD700' : 'none'
                }} />
              </div>
            </>
          )}
          
          {/* Waiting States */}
          {currentPlayer?.hasFlipped && serverState?.gamePhase === 'charging_power' && (
            <div className="waiting-message">
              Waiting for other players to flip...
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