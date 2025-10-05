import React, { useState, useEffect, useCallback, useRef } from 'react'
import styled from '@emotion/styled'
import { useParams } from 'react-router-dom'
import { useWallet } from '../../contexts/WalletContext'
import { useToast } from '../../contexts/ToastContext'
import { useProfile } from '../../contexts/ProfileContext'
import socketService from '../../services/SocketService'
import BattleRoyaleUnified3DScene from './BattleRoyaleUnified3DScene'
import BattleRoyaleGamePageTab from './tabs/BattleRoyaleGamePageTab'
import './BattleRoyaleCoins.css'

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
  justify-content: center;
  align-items: center;
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
  const [isCharging, setIsCharging] = useState(false)
  const [powerLevel, setPowerLevel] = useState(1)
  
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

  // Handle choice selection (heads/tails)
  const handleChoiceSelect = useCallback((choice) => {
    if (!gameId || !address || !serverState) return
    
    console.log(`🎯 Player ${address} chose ${choice}`)
    
    try {
      socketService.emit('battle_royale_player_choice', {
        gameId,
        address,
        choice
      })
      showToast(`Selected ${choice}!`, 'success')
    } catch (error) {
      console.error('Error sending choice:', error)
      showToast('Failed to send choice', 'error')
    }
  }, [gameId, address, serverState, showToast])

  // Handle power charging
  const startPowerCharging = useCallback(() => {
    if (isCharging) return
    
    setIsCharging(true)
    setPowerLevel(1)
    
    const chargeInterval = setInterval(() => {
      setPowerLevel(prev => {
        if (prev >= 10) {
          clearInterval(chargeInterval)
          setIsCharging(false)
          return 10
        }
        return prev + 0.1
      })
    }, 50)
  }, [isCharging])

  // Handle coin flip
  const handleFlipCoin = useCallback(() => {
    if (!gameId || !address || !serverState) return
    
    const finalPower = Math.round(powerLevel)
    console.log(`🪙 Player ${address} flipping coin with power ${finalPower}`)
    
    try {
      socketService.emit('battle_royale_flip_coin', {
        gameId,
        address,
        power: finalPower
      })
      
      setIsCharging(false)
      setPowerLevel(1)
      showToast('Coin flipped!', 'success')
    } catch (error) {
      console.error('Error flipping coin:', error)
      showToast('Failed to flip coin', 'error')
    }
  }, [gameId, address, serverState, powerLevel, showToast])

  // Power charging on mouse down
  const handleMouseDown = useCallback(() => {
    if (serverState?.phase === 'round_active' && !isCharging) {
      startPowerCharging()
    }
  }, [serverState?.phase, isCharging, startPowerCharging])

  // Stop charging on mouse up
  const handleMouseUp = useCallback(() => {
    if (isCharging) {
      setIsCharging(false)
    }
  }, [isCharging])

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
    let connectionTimeout = null
    
    console.log('🔌 Connecting to Battle Royale game server...')

    const connectToGame = async () => {
      try {
        // Ensure we're connected to the right game
        const roomId = `game_${gameId}`
        await socketService.connect(gameId, address)
        
        if (mounted) {
          setConnected(true)
          console.log('✅ Connected to Battle Royale server')
        }
        
        // Register event listeners with proper cleanup
        const cleanupFunctions = []
        
        const setupListener = (event, handler) => {
          socketService.on(event, handler)
          cleanupFunctions.push(() => socketService.off(event, handler))
        }
        
        setupListener('room_joined', handleRoomJoined)
        setupListener('battle_royale_state_update', handleGameStateUpdate)
        setupListener('roundStart', handleRoundStart)
        setupListener('roundEnd', handleRoundEnd)
        setupListener('gameWon', handleGameWon)
        setupListener('allEliminated', handleAllEliminated)
        setupListener('battle_royale_player_flipped', (data) => {
          console.log('🪙 Player flip received:', data)
        })
        
        // Join room with consistent room ID
        socketService.emit('join_battle_royale_room', { 
          roomId: roomId,
          address 
        })
        
        // Request current game state with retry mechanism
        const requestState = () => {
          socketService.emit('request_battle_royale_state', { gameId })
        }
        
        // Immediate request
        requestState()
        
        // Retry request after a short delay to handle race conditions
        connectionTimeout = setTimeout(() => {
          if (mounted && !serverState) {
            console.log('🔄 Retrying state request...')
            requestState()
          }
        }, 500)
        
        // Store cleanup functions for later use
        return cleanupFunctions
        
      } catch (error) {
        console.error('❌ Failed to connect to Battle Royale game server:', error)
        if (mounted) {
          showToast('Failed to connect to game server', 'error')
        }
      }
    }

    connectToGame().then(cleanupFunctions => {
      // Store cleanup functions for component unmount
      if (cleanupFunctions) {
        mounted.cleanup = cleanupFunctions
      }
    })

    return () => {
      mounted = false
      
      // Clear timeout
      if (connectionTimeout) {
        clearTimeout(connectionTimeout)
      }
      
      // Execute cleanup functions
      if (mounted.cleanup) {
        mounted.cleanup.forEach(cleanup => cleanup())
      }
    }
  }, [gameId, address]) // Removed handlers from dependencies to prevent re-connections

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

  // If game is in filling phase, show the lobby
  if (serverState?.phase === 'filling' || !serverState) {
    return <BattleRoyaleGamePageTab gameData={gameData} gameId={gameId} address={address} isCreator={isCreator} />
  }

  return (
    <GameContainer>
      {/* 3D Battle Royale Scene */}
      {serverState?.phase === 'round_active' && (
        <div style={{
          width: '100%',
          height: '600px',
          background: 'rgba(0, 0, 0, 0.3)',
          borderRadius: '1rem',
          overflow: 'hidden',
          border: '2px solid #FFD700',
          marginBottom: '2rem'
        }}>
          <BattleRoyaleUnified3DScene
            players={serverState.playerSlots?.map((address, index) => ({
              address,
              slotNumber: index,
              ...(address && serverState.players?.[address])
            })) || []}
            gamePhase={serverState.phase}
            serverState={serverState}
            flipStates={{}}
            playerCoinImages={playerCoinImages}
            currentUserAddress={address}
            onFlipComplete={(playerAddress, result) => {
              console.log(`🪙 Flip complete for ${playerAddress}: ${result}`)
            }}
          />
        </div>
      )}

      {/* Main game layout - Only show active player panel */}
      <div id="gamePhase">
        <GameLayout>
          {/* Active player panel - centered */}
          <ActivePlayerPanel>
            <div className="round-timer">
              {serverState?.roundCountdown || 20}
            </div>
            
            <div className="player-coin-large">
              {currentPlayer && playerCoinImages[address.toLowerCase()] ? (
                <img 
                  src={playerCoinImages[address.toLowerCase()].headsImage} 
                  alt="Your coin"
                  className="coin-image"
                />
              ) : (
                '🪙'
              )}
          </div>
            
            <div className="choice-buttons">
              <button 
                className="choice-btn" 
                data-choice="heads"
                onClick={() => handleChoiceSelect('heads')}
                disabled={currentPlayer?.hasFlipped || serverState?.phase !== 'round_active'}
              >
                HEADS
              </button>
              <button 
                className="choice-btn" 
                data-choice="tails"
                onClick={() => handleChoiceSelect('tails')}
                disabled={currentPlayer?.hasFlipped || serverState?.phase !== 'round_active'}
              >
                TAILS
              </button>
              </div>
              
            <div className="flip-button-container">
              <button 
                className="flip-btn" 
                onClick={handleFlipCoin}
                onMouseDown={handleMouseDown}
                onMouseUp={handleMouseUp}
                disabled={
                  !currentPlayer?.choice || 
                  currentPlayer?.hasFlipped || 
                  serverState?.phase !== 'round_active'
                }
              >
                {isCharging ? `CHARGING... ${Math.round(powerLevel * 10)}%` : 'FLIP COIN'}
              </button>
            </div>
            
            <div className="power-bar-container">
              <div className="power-bar">
                <div 
                  className="power-fill" 
                  style={{ width: `${(powerLevel / 10) * 100}%` }}
                ></div>
              </div>
              <div className="power-label">POWER: <span className="power-value">{Math.round(powerLevel * 10)}%</span></div>
            </div>
          </ActivePlayerPanel>
        </GameLayout>
        </div>
    </GameContainer>
  )
}

export default BattleRoyaleGameRoom