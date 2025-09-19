import React, { useState, useEffect } from 'react'
import styled from '@emotion/styled'
import { useParams } from 'react-router-dom'
import { useWallet } from '../../contexts/WalletContext'
import { useToast } from '../../contexts/ToastContext'
import { getApiUrl } from '../../config/api'

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
  
  // Use gameId from props or URL params
  const gameId = propGameId || paramGameId
  
  const [gameState, setGameState] = useState(propGameState || null)
  const [loading, setLoading] = useState(!propGameState)
  const [selectedChoice, setSelectedChoice] = useState(null)

  // Fetch game state if not provided as prop
  useEffect(() => {
    if (!propGameState && gameId) {
      const fetchGameState = async () => {
        try {
          setLoading(true)
          const response = await fetch(getApiUrl(`/battle-royale/${gameId}/state`))
          if (response.ok) {
            const data = await response.json()
            setGameState(data)
          } else {
            throw new Error('Failed to fetch game state')
          }
        } catch (error) {
          console.error('Error fetching game state:', error)
          showToast('Failed to load game state', 'error')
        } finally {
          setLoading(false)
        }
      }
      fetchGameState()
    }
  }, [gameId, propGameState, showToast])
  
  const [powerLevel, setPowerLevel] = useState(5)
  const [timeLeft, setTimeLeft] = useState(0)
  const [isFlipping, setIsFlipping] = useState(false)

  // Show loading state
  if (loading || !gameState) {
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

  // Get current user's player data
  const currentPlayer = gameState.players[address]
  const isParticipant = !!currentPlayer
  const isEliminated = currentPlayer?.status === 'eliminated'
  const canAct = isParticipant && !isEliminated && 
    gameState.phase === 'round_active' && 
    gameState.roundPhase === 'choosing_flipping'

  // Timer effect
  useEffect(() => {
    if (gameState.roundDeadline) {
      const interval = setInterval(() => {
        const remaining = Math.max(0, Math.ceil((gameState.roundDeadline - Date.now()) / 1000))
        setTimeLeft(remaining)
        if (remaining === 0) {
          clearInterval(interval)
        }
      }, 1000)
      
      return () => clearInterval(interval)
    }
  }, [gameState.roundDeadline])

  const handleChoiceSelect = async (choice) => {
    if (!canAct || currentPlayer?.choice) return
    
    setSelectedChoice(choice)
    try {
      await onMakeChoice(choice)
      showToast(`Selected ${choice}!`, 'success')
    } catch (error) {
      showToast('Failed to make choice', 'error')
      setSelectedChoice(null)
    }
  }

  const handleFlip = async () => {
    if (!canAct || !currentPlayer?.choice || currentPlayer?.hasFlipped) return
    
    setIsFlipping(true)
    try {
      await onExecuteFlip(powerLevel)
      showToast('Coin flipped!', 'success')
    } catch (error) {
      showToast('Failed to flip coin', 'error')
    }
    setIsFlipping(false)
  }

  const formatAddress = (addr) => {
    if (!addr) return ''
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  const getPhaseMessage = () => {
    switch (gameState.roundPhase) {
      case 'showing_target':
        return 'Target revealed! Get ready...'
      case 'choosing_flipping':
        return 'Choose heads or tails, then flip!'
      case 'processing':
        return 'Processing results...'
      case 'showing_results':
        return 'Round complete!'
      default:
        return 'Waiting...'
    }
  }

  return (
    <GameContainer>
      <RoundHeader 
        showingTarget={gameState.roundPhase === 'showing_target'}
        timeLeft={timeLeft}
      >
        <div className="round-title">
          Round {gameState.currentRound}
        </div>
        
        {gameState.targetResult && (
          <div className="target-display">
            <span className="target-label">Target:</span>
            <span className="target-result">{gameState.targetResult}</span>
          </div>
        )}
        
        <div className="timer">
          {timeLeft > 0 ? `${timeLeft}s remaining` : getPhaseMessage()}
        </div>
      </RoundHeader>

      <PlayersGrid>
        {gameState.playerSlots.map((playerAddress, index) => {
          if (!playerAddress) return null
          
          const player = gameState.players[playerAddress]
          const isCurrentUser = playerAddress === address
          const isEliminated = player?.status === 'eliminated'
          
          return (
            <PlayerCard
              key={index}
              isCurrentUser={isCurrentUser}
              isEliminated={isEliminated}
              hasChoice={!!player?.choice}
              hasFlipped={player?.hasFlipped}
              power={player?.power}
              isFlipping={isFlipping && isCurrentUser}
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
                  Slot {index + 1}
                </div>
              </div>
              
              <div className="coin-display">
                {player?.coinResult ? 
                  (player.coinResult === 'heads' ? '👑' : '🗲') : 
                  '🪙'
                }
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
          
          {!currentPlayer?.choice && (
            <div className="choice-buttons">
              <button
                className={`heads ${selectedChoice === 'heads' ? 'selected' : ''}`}
                onClick={() => handleChoiceSelect('heads')}
                disabled={!!currentPlayer?.choice}
              >
                👑 Heads
              </button>
              <button
                className={`tails ${selectedChoice === 'tails' ? 'selected' : ''}`}
                onClick={() => handleChoiceSelect('tails')}
                disabled={!!currentPlayer?.choice}
              >
                🗲 Tails
              </button>
            </div>
          )}
          
          {currentPlayer?.choice && !currentPlayer?.hasFlipped && (
            <>
              <div className="power-control">
                <div className="power-label">Flip Power</div>
                <input
                  type="range"
                  min="0"
                  max="10"
                  value={powerLevel}
                  onChange={(e) => setPowerLevel(parseInt(e.target.value))}
                  className="power-slider"
                />
                <div className="power-value">Power: {powerLevel}</div>
              </div>
              
              <button
                className="flip-button"
                onClick={handleFlip}
                disabled={isFlipping}
              >
                {isFlipping ? 'Flipping...' : 'Flip Coin!'}
              </button>
            </>
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
    </GameContainer>
  )
}

export default BattleRoyaleGameRoom
