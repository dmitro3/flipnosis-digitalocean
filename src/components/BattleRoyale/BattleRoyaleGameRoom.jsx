import React, { useState, useEffect, useCallback, useRef } from 'react'
import styled from '@emotion/styled'
import { useParams } from 'react-router-dom'
import { useWallet } from '../../contexts/WalletContext'
import { useToast } from '../../contexts/ToastContext'
import { useProfile } from '../../contexts/ProfileContext'
import socketService from '../../services/SocketService'
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
  gap: 2rem;
  flex: 1;
  
  @media (max-width: 1200px) {
    flex-direction: column;
  }
`

const PlayersGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  flex: 1;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`

const PlayerSlot = styled.div`
  background: ${props => {
    if (props.isEliminated) {
      return 'linear-gradient(135deg, rgba(255, 0, 0, 0.2) 0%, rgba(139, 0, 0, 0.2) 100%)'
    }
    return 'linear-gradient(135deg, rgba(0, 191, 255, 0.1) 0%, rgba(138, 43, 226, 0.1) 100%)'
  }};
  border: 2px solid ${props => props.isEliminated ? '#ff0000' : '#00bfff'};
  border-radius: 1rem;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  transition: all 0.3s ease;
  opacity: ${props => props.isEliminated ? 0.3 : 1};
  filter: ${props => props.isEliminated ? 'grayscale(100%)' : 'none'};
  
  .player-coin {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    background: #333;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 2rem;
    transition: all 0.3s ease;
    
    img {
      width: 100%;
      height: 100%;
      border-radius: 50%;
      object-fit: cover;
    }
    
    &.spinning {
      animation: spin 2s linear infinite;
    }
  }
  
  .player-name {
    color: white;
    font-size: 0.9rem;
    font-weight: bold;
    text-align: center;
    font-family: monospace;
  }
  
  .player-status {
    color: #aaa;
      font-size: 0.8rem;
      text-align: center;
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


// Game Phase Manager Class
class GamePhaseManager {
  constructor(socket, playerId) {
    this.socket = socket
    this.playerId = playerId
    this.currentChoice = null
    this.hasFlipped = false
    this.powerInterval = null
    this.powerLevel = 0
    
    this.setupEventListeners()
  }
  
  setupEventListeners() {
    // Remove ALL old listeners first
    this.socket.off('roundStart')
    this.socket.off('playerChose')
    this.socket.off('coinFlipping')
    this.socket.off('flipResult')
    this.socket.off('roundEnd')
    
    // Round starts
    this.socket.on('roundStart', (data) => {
      this.resetRound()
      this.startTimer(data.deadline)
      this.enableChoiceButtons()
    })
    
    // Choice buttons
    document.querySelectorAll('.choice-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        if (this.currentChoice) return
        
        this.currentChoice = e.target.dataset.choice
        this.socket.emit('makeChoice', this.currentChoice)
        
        // Visual feedback
        e.target.classList.add('selected')
        document.querySelector('.flip-btn').disabled = false
        
        // Start power bar
        this.startPowerBar()
      })
    })
    
    // Flip button
    document.querySelector('.flip-btn').addEventListener('click', () => {
      if (this.hasFlipped) return
      
      this.hasFlipped = true
      this.socket.emit('flipCoin', this.powerLevel)
      this.stopPowerBar()
      
      // Disable button
      document.querySelector('.flip-btn').disabled = true
    })
    
    // Coin animations
    this.socket.on('coinFlipping', (data) => {
      // Animate the coin in the 6-player grid
      const slot = document.querySelector(`[data-player-index="${data.playerIndex}"]`)
      if (slot) {
        slot.querySelector('.player-coin').classList.add('spinning')
      }
      
      // If it's current player, also spin the large coin
      if (data.playerId === this.playerId) {
        const largeCoin = document.querySelector('.coin-image')
        if (largeCoin) {
          largeCoin.classList.add('spinning-large')
        }
      }
    })
    
    // Flip results
    this.socket.on('flipResult', (data) => {
      // Stop spinning
      const slot = document.querySelector(`[data-player-index="${data.playerIndex}"]`)
      if (slot) {
        slot.querySelector('.player-coin').classList.remove('spinning')
        
        // Show result
        slot.querySelector('.player-coin').dataset.result = data.result
        
        if (!data.survived) {
          slot.classList.add('eliminated')
        }
      }
    })
  }
  
  startPowerBar() {
    this.powerLevel = 0
    this.powerInterval = setInterval(() => {
      this.powerLevel = (this.powerLevel + 2) % 100
      const powerFill = document.querySelector('.power-fill')
      const powerValue = document.querySelector('.power-value')
      if (powerFill) powerFill.style.width = `${this.powerLevel}%`
      if (powerValue) powerValue.textContent = `${this.powerLevel}%`
    }, 50)
  }
  
  stopPowerBar() {
    if (this.powerInterval) {
      clearInterval(this.powerInterval)
      this.powerInterval = null
    }
  }
  
  resetRound() {
    this.currentChoice = null
    this.hasFlipped = false
    this.powerLevel = 0
    
    // Reset UI
    document.querySelectorAll('.choice-btn').forEach(btn => {
      btn.classList.remove('selected')
      btn.disabled = false
    })
    const flipBtn = document.querySelector('.flip-btn')
    if (flipBtn) flipBtn.disabled = true
    const powerFill = document.querySelector('.power-fill')
    if (powerFill) powerFill.style.width = '0%'
  }
  
  startTimer(deadline) {
    const timerElement = document.querySelector('.round-timer')
    if (!timerElement) return
    
    const interval = setInterval(() => {
      const now = Date.now()
      const timeLeft = Math.max(0, Math.ceil((deadline - now) / 1000))
      timerElement.textContent = timeLeft
      
      if (timeLeft === 0) {
        clearInterval(interval)
      }
    }, 1000)
  }
  
  enableChoiceButtons() {
    document.querySelectorAll('.choice-btn').forEach(btn => {
      btn.disabled = false
    })
  }
}

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
  const [gameManager, setGameManager] = useState(null)
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
        
        // Initialize game manager when connected
        if (mounted) {
          const manager = new GamePhaseManager(socketService, address)
          setGameManager(manager)
        }
        
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
      {/* Main game layout */}
      <div id="gamePhase">
        <GameLayout>
          {/* Left side: 6 player coins grid */}
          <PlayersGrid>
            {(serverState.playerSlots || new Array(6).fill(null)).map((playerAddress, index) => {
              if (!playerAddress) {
                return (
                  <PlayerSlot key={index} data-player-index={index}>
                    <div className="player-coin">?</div>
                    <div className="player-name">Empty</div>
                    <div className="player-status">Waiting...</div>
                  </PlayerSlot>
                )
              }
              
              const player = serverState.players?.[playerAddress.toLowerCase()]
              const coinImages = playerCoinImages[playerAddress.toLowerCase()]
              const isEliminated = player?.status === 'eliminated'
              const isCurrentUser = playerAddress.toLowerCase() === address?.toLowerCase()
              
              return (
                <PlayerSlot 
                  key={index} 
                  data-player-index={index}
                  isEliminated={isEliminated}
                  isCurrentUser={isCurrentUser}
                >
                  <div className="player-coin">
                    {coinImages ? (
                      <img 
                        src={coinImages.headsImage} 
                        alt={`${player?.name || formatAddress(playerAddress)} coin`}
                      />
                    ) : (
                      '🪙'
                    )}
              </div>
                  <div className="player-name">
                    {player?.name || formatAddress(playerAddress)}
              </div>
                  <div className="player-status">
                    {isEliminated ? 'Eliminated' : 'Alive'}
              </div>
                </PlayerSlot>
              )
            })}
          </PlayersGrid>
          
          {/* Right side: Active player panel */}
          <ActivePlayerPanel>
            <div className="round-timer">20</div>
            
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
              <button className="choice-btn" data-choice="heads">HEADS</button>
              <button className="choice-btn" data-choice="tails">TAILS</button>
              </div>
              
            <div className="flip-button-container">
              <button className="flip-btn" disabled>FLIP COIN</button>
            </div>
            
            <div className="power-bar-container">
              <div className="power-bar">
                <div className="power-fill"></div>
            </div>
              <div className="power-label">POWER: <span className="power-value">0%</span></div>
          </div>
          </ActivePlayerPanel>
        </GameLayout>
        </div>
    </GameContainer>
  )
}

export default BattleRoyaleGameRoom