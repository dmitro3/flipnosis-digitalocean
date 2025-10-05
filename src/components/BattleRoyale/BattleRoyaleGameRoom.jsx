import React, { useState, useEffect, useCallback, useRef } from 'react'
import styled from '@emotion/styled'
import { useParams } from 'react-router-dom'
import { useWallet } from '../../contexts/WalletContext'
import { useToast } from '../../contexts/ToastContext'
import { useProfile } from '../../contexts/ProfileContext'
import socketService from '../../services/SocketService'
import BattleRoyaleUnified3DScene from './BattleRoyaleUnified3DScene'
import HeadsTailsDisplay from './HeadsTailsDisplay'
import './BattleRoyaleCoins.css'

// Make socketService globally available for unified scene
if (typeof window !== 'undefined') {
  window.socketService = socketService
}

const GameContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2rem;
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
  min-height: 100vh;
  overflow-y: auto;
`

const GameLayout = styled.div`
    display: flex;
  gap: 2rem;
  flex: 1;
  
  @media (max-width: 1200px) {
    flex-direction: column;
  }
`


const ActivePlayerPanel = styled.div`
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(0, 191, 255, 0.3);
  border-radius: 1rem;
  padding: 1.5rem;
  text-align: center;
  min-width: 300px;
  
  .round-timer {
    color: #00bfff;
    font-size: 2rem;
    font-weight: bold;
    margin-bottom: 1rem;
    text-shadow: 0 0 10px rgba(0, 191, 255, 0.8);
  }
  
  .player-coin-large {
    width: 150px;
    height: 150px;
    margin: 1rem auto;
    border-radius: 50%;
    background: #333;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 4rem;
    
    img {
      width: 100%;
      height: 100%;
      border-radius: 50%;
      object-fit: cover;
      
      &.spinning-large {
        animation: spin-3d 2s ease-in-out;
      }
    }
  }
  
  .choice-buttons {
    display: flex;
    gap: 1rem;
    justify-content: center;
    margin: 1rem 0;
    
    .choice-btn {
      padding: 1rem 2rem;
      border: none;
      border-radius: 0.5rem;
      font-size: 1.1rem;
      font-weight: bold;
      cursor: pointer;
      transition: all 0.3s ease;
      
      &[data-choice="heads"] {
        background: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%);
        color: #333;
        
        &:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(255, 215, 0, 0.3);
        }
      }
      
      &[data-choice="tails"] {
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
  
  .flip-button-container {
    margin: 1rem 0;
    
    .flip-btn {
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
  }
  
  .power-bar-container {
    margin-top: 1rem;
    
    .power-bar {
      width: 200px;
      height: 30px;
      border: 2px solid #fff;
      background: #222;
      border-radius: 15px;
      overflow: hidden;
      margin: 0 auto 0.5rem;
      
      .power-fill {
        height: 100%;
        background: linear-gradient(90deg, #00ff00, #ffff00, #ff0000);
        transition: width 0.05s linear;
        border-radius: 13px;
      }
    }
    
    .power-label {
      color: #00bfff;
      font-size: 0.9rem;
      font-weight: bold;
    }
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
  
  const handleRoundStart = useCallback((data) => {
    console.log('🚀 Round starting:', data)
    showToast(`Round ${data.round} starting!`, 'info')
  }, [showToast])
  
  const handleRoundEnd = useCallback((data) => {
    console.log('🏁 Round ending:', data)
    showToast(`Round complete! ${data.eliminations.length} players eliminated`, 'info')
  }, [showToast])
  
  const handleGameWon = useCallback((data) => {
    console.log('🏆 Game won:', data)
    const isWinner = data.winner.id === address
    showToast(isWinner ? 'You won!' : `${data.winner.name} won!`, isWinner ? 'success' : 'info')
  }, [address, showToast])
  
  const handleAllEliminated = useCallback(() => {
    console.log('💀 All players eliminated')
    showToast('All players eliminated - restarting round', 'warning')
  }, [showToast])

  const handleRoomJoined = useCallback((data) => {
    console.log('🏠 Battle Royale room joined:', data)
  }, [])

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
        socketService.on('roundStart', handleRoundStart)
        socketService.on('roundEnd', handleRoundEnd)
        socketService.on('gameWon', handleGameWon)
        socketService.on('allEliminated', handleAllEliminated)
        
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
      socketService.off('roundStart', handleRoundStart)
      socketService.off('roundEnd', handleRoundEnd)
      socketService.off('gameWon', handleGameWon)
      socketService.off('allEliminated', handleAllEliminated)
    }
  }, [gameId, address, handleRoomJoined, handleGameStateUpdate, handleRoundStart, handleRoundEnd, handleGameWon, handleAllEliminated, showToast])

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

  return (
    <GameContainer>
      {/* Game Status Header */}
      <HeadsTailsDisplay 
        gamePhase={serverState?.phase || 'waiting'}
        timeLeft={serverState?.roundCountdown || 20}
        currentPlayers={serverState?.activePlayers?.length || 0}
      />

      {/* Unified 3D Scene - ALL 6 coins in one scene */}
      <BattleRoyaleUnified3DScene
        players={serverState?.playerSlots?.map((address, index) => 
          address ? serverState.players[address] : null
        ) || new Array(6).fill(null)}
        gamePhase={serverState?.phase || 'filling'}
        serverState={serverState}
        flipStates={serverState?.coinStates || {}}
        playerCoinImages={playerCoinImages}
        currentUserAddress={address}
        onFlipComplete={(playerAddress, result) => {
          console.log(`🎲 Flip complete for ${playerAddress}: ${result}`)
        }}
      />

      {/* Active Player Controls */}
      {isAlive && serverState?.phase === 'round_active' && (
        <ActivePlayerPanel>
          <div className="round-timer">
            {serverState?.roundCountdown || 20}s
          </div>
          
          <div className="choice-buttons">
            <button 
              className={`choice-btn ${currentPlayer?.choice === 'heads' ? 'selected' : ''}`}
              data-choice="heads"
              onClick={() => {
                socketService.emit('battle_royale_player_choice', {
                  gameId,
                  address,
                  choice: 'heads'
                })
              }}
              disabled={currentPlayer?.hasFlipped}
            >
              HEADS
            </button>
            <button 
              className={`choice-btn ${currentPlayer?.choice === 'tails' ? 'selected' : ''}`}
              data-choice="tails"
              onClick={() => {
                socketService.emit('battle_royale_player_choice', {
                  gameId,
                  address,
                  choice: 'tails'
                })
              }}
              disabled={currentPlayer?.hasFlipped}
            >
              TAILS
            </button>
          </div>
          
          <div className="flip-button-container">
            <button 
              className="flip-btn"
              onClick={() => {
                if (currentPlayer?.choice) {
                  socketService.emit('battle_royale_execute_flip', {
                    gameId,
                    address,
                    power: currentPlayer?.power || 1
                  })
                }
              }}
              disabled={!currentPlayer?.choice || currentPlayer?.hasFlipped}
            >
              {currentPlayer?.hasFlipped ? 'FLIPPING...' : 'FLIP COIN'}
            </button>
          </div>
        </ActivePlayerPanel>
      )}

      {/* Game Over / Spectator View */}
      {(isEliminated || !isParticipant) && (
        <div style={{
          textAlign: 'center',
          padding: '2rem',
          background: 'rgba(0, 0, 0, 0.8)',
          borderRadius: '1rem',
          border: '2px solid rgba(255, 255, 255, 0.2)'
        }}>
          <h2 style={{ color: isEliminated ? '#ff6b6b' : '#00bfff' }}>
            {isEliminated ? '💀 Eliminated' : '👁️ Spectating'}
          </h2>
          <p style={{ color: '#aaa' }}>
            {isEliminated ? 'You were eliminated. Watch the remaining players!' : 'Watching the battle...'}
          </p>
        </div>
      )}
    </GameContainer>
  )
}

export default BattleRoyaleGameRoom