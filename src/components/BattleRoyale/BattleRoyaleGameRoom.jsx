import React, { useState, useEffect, useCallback } from 'react'
import styled from '@emotion/styled'
import { useParams } from 'react-router-dom'
import { useWallet } from '../../contexts/WalletContext'
import { useToast } from '../../contexts/ToastContext'
import { useProfile } from '../../contexts/ProfileContext'
import { getApiUrl } from '../../config/api'
import socketService from '../../services/SocketService'
import OptimizedGoldCoin from '../OptimizedGoldCoin'
import ProfilePicture from '../ProfilePicture'

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
  
  .coin-display {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    background: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.5rem;
    font-weight: bold;
    color: #333;
    border: 3px solid #ffa500;
    animation: ${props => props.isFlipping ? 'coinFlip 2s ease-in-out' : 'none'};
  }
  
  @keyframes coinFlip {
    0% { transform: rotateY(0deg); }
    50% { transform: rotateY(180deg); }
    100% { transform: rotateY(360deg); }
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
        width: ${props => (props.power || 0) * 10}%;
        transition: width 0.3s ease;
      }
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
  
  .power-control {
    margin: 1rem 0;
    
    .power-label {
      color: ${props => props.theme.colors.textSecondary};
      font-size: 0.9rem;
      margin-bottom: 0.5rem;
    }
    
    .power-slider {
      width: 100%;
      height: 8px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 4px;
      outline: none;
      cursor: pointer;
      
      &::-webkit-slider-thumb {
        appearance: none;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background: #00ff88;
        cursor: pointer;
        border: 2px solid #fff;
        box-shadow: 0 0 5px rgba(0, 255, 136, 0.5);
      }
    }
    
    .power-value {
      color: ${props => props.theme.colors.neonBlue};
      font-size: 1.1rem;
      font-weight: bold;
      margin-top: 0.5rem;
    }
  }
  
  .flip-button {
    background: linear-gradient(135deg, #ff1493 0%, #ff69b4 100%);
    color: white;
    border: none;
    padding: 1rem 3rem;
    border-radius: 2rem;
    font-size: 1.2rem;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.3s ease;
    
    &:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 10px 20px rgba(255, 20, 147, 0.3);
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
  
  // Server-controlled state
  const [serverState, setServerState] = useState(null)
  const [connected, setConnected] = useState(false)
  const [loading, setLoading] = useState(true)
  const [gameData, setGameData] = useState(null)
  
  // Local UI state
  const [roundCountdown, setRoundCountdown] = useState(null)
  const [showResultPopup, setShowResultPopup] = useState(false)
  const [resultData, setResultData] = useState(null)
  const [playerCoinImages, setPlayerCoinImages] = useState({}) // Store actual coin images for each player

  // Load game data
  const loadGameData = useCallback(async () => {
    if (!gameId) return
    
    try {
      const response = await fetch(`/api/battle-royale/${gameId}`)
      if (response.ok) {
        const data = await response.json()
        setGameData(data)
      } else {
        throw new Error('Failed to load game data')
      }
    } catch (error) {
      console.error('❌ Failed to load game data:', error)
      showToast('Failed to load game data', 'error')
    }
  }, [gameId, showToast])
  
  // Load game data on mount
  useEffect(() => {
    loadGameData()
  }, [loadGameData])

  // Load coin images for a player
  const loadPlayerCoinImages = useCallback(async (playerAddress, coinData) => {
    try {
      let headsImage, tailsImage
      
      if (coinData?.type === 'custom') {
        // Load custom coin images from profile
        headsImage = await getCoinHeadsImage(playerAddress)
        tailsImage = await getCoinTailsImage(playerAddress)
      } else {
        // Use default coin images
        headsImage = coinData?.headsImage || '/coins/plainh.png'
        tailsImage = coinData?.tailsImage || '/coins/plaint.png'
      }
      
      setPlayerCoinImages(prev => ({
        ...prev,
        [playerAddress]: { headsImage, tailsImage }
      }))
    } catch (error) {
      console.error('Error loading coin images for player:', playerAddress, error)
      // Fallback to default coin
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
    return serverState && address && 
           serverState.currentTurn?.toLowerCase() === address.toLowerCase()
  }, [serverState, address])

  const canMakeChoice = useCallback(() => {
    if (!serverState || !isMyTurn()) return false
    
    const myPlayer = serverState.players?.get?.(address.toLowerCase()) || 
                     serverState.players?.[address.toLowerCase()]
    return serverState.gamePhase === 'waiting_choice' && !myPlayer?.choice
  }, [serverState, isMyTurn, address])

  const canChargePower = useCallback(() => {
    if (!serverState || !isMyTurn()) return false
    
    const myPlayer = serverState.players?.get?.(address.toLowerCase()) || 
                     serverState.players?.[address.toLowerCase()]
    return serverState.gamePhase === 'charging_power' && myPlayer?.choice && !myPlayer?.hasFlipped
  }, [serverState, isMyTurn, address])

  // ===== SOCKET EVENT HANDLERS =====
  const handleGameStateUpdate = useCallback((data) => {
    console.log('🔍 Battle Royale game state received:', data)
    setServerState(data)
    setLoading(false)
    
    // Update countdown from server
    if (data.roundCountdown !== undefined) {
      setRoundCountdown(data.roundCountdown)
    }

    // Load coin images for all players
    if (data.players) {
      const playersMap = data.players instanceof Map ? data.players : new Map(Object.entries(data.players))
      playersMap.forEach((player, playerAddress) => {
        if (player.coin && !playerCoinImages[playerAddress]) {
          loadPlayerCoinImages(playerAddress, player.coin)
        }
      })
    }
  }, [loadPlayerCoinImages, playerCoinImages])

  const handleRoomJoined = useCallback((data) => {
    console.log('🏠 Battle Royale room joined:', data)
  }, [])

  const handleFlipExecuting = useCallback((data) => {
    console.log('🎲 Battle Royale flip executing:', data)
    showToast('Coin is flipping...', 'info')
  }, [showToast])

  const handleRoundResult = useCallback((data) => {
    console.log('🎲 Battle Royale round result:', data)
    
    // Show result popup for eliminated players
    if (data.eliminatedPlayers?.includes(address)) {
      setResultData({
        isEliminated: true,
        round: data.currentRound,
        eliminatedCount: data.eliminatedPlayers.length
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
    setRoundCountdown(20) // 20 seconds per round
  }, [])

  // ===== SOCKET CONNECTION =====
  useEffect(() => {
    if (!gameId || !address) return

    console.log('🔌 Connecting to Battle Royale game server...')

    const connectToGame = async () => {
      try {
        // Connect to socket
        await socketService.connect(gameId, address)
        setConnected(true)
        
        // Register event listeners
        console.log('📌 Registering Battle Royale Socket.io event listeners...')
        
        socketService.on('room_joined', handleRoomJoined)
        socketService.on('battle_royale_game_state_update', handleGameStateUpdate)
        socketService.on('battle_royale_flip_executing', handleFlipExecuting)
        socketService.on('battle_royale_round_result', handleRoundResult)
        socketService.on('battle_royale_game_complete', handleGameComplete)
        socketService.on('battle_royale_new_round', handleNewRound)
        
        console.log('✅ All Battle Royale Socket.io event listeners registered')
        
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
      socketService.off('battle_royale_game_state_update', handleGameStateUpdate)
      socketService.off('battle_royale_flip_executing', handleFlipExecuting)
      socketService.off('battle_royale_round_result', handleRoundResult)
      socketService.off('battle_royale_game_complete', handleGameComplete)
      socketService.off('battle_royale_new_round', handleNewRound)
    }
  }, [gameId, address, showToast, handleRoomJoined, handleGameStateUpdate, handleFlipExecuting, handleRoundResult, handleGameComplete, handleNewRound])

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
    socketService.emit('battle_royale_start_power_charge', {
      gameId,
      address
    })
  }, [canChargePower, gameId, address])

  const handlePowerChargeStop = useCallback(() => {
    console.log('⚡ Stopping power charge')
    socketService.emit('battle_royale_stop_power_charge', {
      gameId,
      address
    })
  }, [gameId, address])

  // Show loading state
  if (loading || !gameData) {
    return (
      <GameContainer>
        <div style={{ 
          textAlign: 'center', 
          color: 'white', 
          fontSize: '1.2rem',
          padding: '2rem'
        }}>
          {loading ? 'Loading Battle Royale Game...' : 'Game not found'}
        </div>
      </GameContainer>
    )
  }

  // Get current user's player data from server state
  const currentPlayer = serverState?.players?.get?.(address.toLowerCase()) || 
                       serverState?.players?.[address.toLowerCase()]
  const isParticipant = !!currentPlayer
  const isEliminated = currentPlayer?.status === 'eliminated'
  const canAct = isParticipant && !isEliminated && 
    serverState?.gamePhase === 'waiting_choice' && 
    isMyTurn()

  const formatAddress = (addr) => {
    if (!addr) return ''
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  const getPhaseMessage = () => {
    if (!serverState) return 'Loading...'
    
    switch (serverState.gamePhase) {
      case 'waiting_choice':
        return isMyTurn() ? 'Choose heads or tails!' : 'Waiting for other players...'
      case 'charging_power':
        return isMyTurn() ? 'Hold to charge power!' : 'Player is charging power...'
      case 'executing_flip':
        return 'Coin is flipping...'
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
        timeLeft={roundCountdown || 0}
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
          {roundCountdown > 0 ? `${roundCountdown}s remaining` : getPhaseMessage()}
        </div>
      </RoundHeader>

      <PlayersGrid>
        {serverState?.playerSlots?.map((playerAddress, index) => {
          if (!playerAddress) return null
          
          const player = serverState.players?.get?.(playerAddress.toLowerCase()) || 
                        serverState.players?.[playerAddress.toLowerCase()]
          const isCurrentUser = playerAddress.toLowerCase() === address?.toLowerCase()
          const isEliminated = player?.status === 'eliminated'
          
          return (
            <PlayerCard
              key={index}
              isCurrentUser={isCurrentUser}
              isEliminated={isEliminated}
              hasChoice={!!player?.choice}
              hasFlipped={player?.hasFlipped}
              power={player?.power}
              isFlipping={serverState?.gamePhase === 'executing_flip' && isCurrentUser}
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
                  {index === 0 ? 'Creator' : `Slot ${index + 1}`}
                </div>
              </div>
              
              <div className="coin-display">
                {playerCoinImages[playerAddress] ? (
                  <div className="coin-images" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <img 
                      src={playerCoinImages[playerAddress].headsImage} 
                      alt="Heads" 
                      className="coin-image"
                      style={{ width: '50px', height: '50px', borderRadius: '50%' }}
                    />
                    <img 
                      src={playerCoinImages[playerAddress].tailsImage} 
                      alt="Tails" 
                      className="coin-image"
                      style={{ width: '50px', height: '50px', borderRadius: '50%' }}
                    />
                  </div>
                ) : (
                  <div style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #ffd700 0%, #ffed4e 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.5rem',
                    color: '#333',
                    border: '3px solid #ffa500'
                  }}>
                    🪙
                  </div>
                )}
              </div>
              
              {player?.choice && (
                <div className="choice-display">
                  {player.choice}
                </div>
              )}
              
              <div className="power-display">
                <div className="power-label">Power</div>
                <div className="power-bar">
                  <div className="power-fill" />
                </div>
              </div>
            </PlayerCard>
          )
        })}
      </PlayersGrid>

      {canAct && (
        <ActionPanel>
          <div className="action-title">Your Turn</div>
          
          {!currentPlayer?.choice && serverState?.gamePhase === 'waiting_choice' && (
            <div className="choice-buttons">
              <button
                className="heads"
                onClick={() => handleChoice('heads')}
                disabled={!!currentPlayer?.choice}
              >
                👑 Heads
              </button>
              <button
                className="tails"
                onClick={() => handleChoice('tails')}
                disabled={!!currentPlayer?.choice}
              >
                🗲 Tails
              </button>
            </div>
          )}
          
          {currentPlayer?.choice && serverState?.gamePhase === 'charging_power' && (
            <button
              className="flip-button"
              onMouseDown={handlePowerChargeStart}
              onMouseUp={handlePowerChargeStop}
              onMouseLeave={handlePowerChargeStop}
              onTouchStart={handlePowerChargeStart}
              onTouchEnd={handlePowerChargeStop}
              style={{ 
                background: 'linear-gradient(135deg, #00ff88, #00cc6a)',
                color: '#000',
                padding: '1.5rem 3rem',
                fontSize: '1.3rem',
                userSelect: 'none',
                cursor: 'pointer',
                border: '3px solid #00ff88',
                animation: 'pulse 2s infinite'
              }}
            >
              ⚡ HOLD TO CHARGE ⚡
            </button>
          )}
          
          {currentPlayer?.hasFlipped && (
            <div className="waiting-message">
              Waiting for other players to flip...
            </div>
          )}
        </ActionPanel>
      )}
      
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

      {/* Central Coin Display */}
      {serverState?.gamePhase === 'executing_flip' && (
        <div style={{ 
          position: 'fixed', 
          top: '50%', 
          left: '50%', 
          transform: 'translate(-50%, -50%)',
          zIndex: 1000,
          background: 'rgba(0, 0, 0, 0.8)',
          borderRadius: '1rem',
          padding: '2rem',
          border: '2px solid #00BFFF'
        }}>
          <OptimizedGoldCoin
            isFlipping={true}
            flipResult={serverState.flipResult}
            flipDuration={3000}
            onFlipComplete={() => console.log('Battle Royale flip complete')}
            size={200}
            isPlayerTurn={false}
            gamePhase="executing_flip"
            isInteractive={false}
            serverControlled={true}
          />
        </div>
      )}

      {/* Result Popup */}
      {showResultPopup && resultData && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000
        }}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.9), rgba(20, 20, 20, 0.9))',
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
                  {resultData.eliminatedCount} players eliminated this round.
                </p>
              </>
            ) : resultData.isWinner ? (
              <>
                <h2 style={{ color: '#00FF41', fontSize: '2rem', margin: '0 0 1rem 0' }}>
                  🏆 You Won!
                </h2>
                <p style={{ fontSize: '1.2rem', marginBottom: '2rem' }}>
                  Congratulations! You won the Battle Royale and earned the NFT plus all entry fees!
                </p>
                <p style={{ color: '#FFD700', fontSize: '1.1rem' }}>
                  Prize: {resultData.finalPrize} ETH + NFT
                </p>
              </>
            ) : (
              <>
                <h2 style={{ color: '#FF1493', fontSize: '2rem', margin: '0 0 1rem 0' }}>
                  💔 Game Over
                </h2>
                <p style={{ fontSize: '1.2rem', marginBottom: '2rem' }}>
                  The winner is {formatAddress(resultData.winner)}. Better luck next time!
                </p>
              </>
            )}
            
            <button
              onClick={() => {
                setShowResultPopup(false)
                setResultData(null)
                window.location.href = '/'
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
              Return to Home
            </button>
          </div>
        </div>
      )}
    </GameContainer>
  )
}

export default BattleRoyaleGameRoom
