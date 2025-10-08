import React, { useState, useCallback } from 'react'
import styled from '@emotion/styled'
import PhysicsScene from './PhysicsScene'
import CannonController from './CannonController'
import PlayerLifeBoxes from './PlayerLifeBoxes'
import { useBattleRoyaleGame } from '../../contexts/BattleRoyaleGameContext'
import socketService from '../../services/SocketService'

const FullScreenContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: #000000;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  z-index: 1;
`

const GameArea = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: #000000;
  overflow: hidden;
  
  > div {
    width: 100% !important;
    height: 100% !important;
  }
`

const ControlArea = styled.div`
  display: none;
`

const RoundIndicator = styled.div`
  position: absolute;
  top: 2rem;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.95);
  border: 4px solid #00ffff;
  padding: 1.2rem 3rem;
  border-radius: 2rem;
  color: white;
  font-size: 1.8rem;
  font-weight: bold;
  text-align: center;
  z-index: 100;
  box-shadow: 0 0 40px rgba(0, 255, 255, 0.6);
  font-family: 'Hyperwave', monospace;
  letter-spacing: 2px;
  text-transform: uppercase;
  
  .round-text {
    background: linear-gradient(135deg, #00ffff, #00ff88);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
`

const GameOverOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.97);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(10px);
  
  .trophy { 
    font-size: 8rem; 
    margin-bottom: 2rem;
    animation: bounce 1s ease-in-out infinite;
  }
  
  .message { 
    font-size: 4rem; 
    font-weight: bold; 
    color: ${props => props.isWinner ? '#FFD700' : '#ff6b6b'}; 
    margin-bottom: 1.5rem; 
    text-shadow: 0 0 30px currentColor;
    font-family: 'Hyperwave', monospace;
    letter-spacing: 3px;
  }
  
  .winner { 
    font-size: 1.8rem; 
    color: white; 
    font-family: monospace;
    background: rgba(0, 255, 255, 0.2);
    padding: 1rem 2rem;
    border-radius: 1rem;
    border: 2px solid #00ffff;
  }
  
  @keyframes bounce {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-20px); }
  }
`

const PhysicsGameScreen = () => {
  const { gameState, address } = useBattleRoyaleGame()
  const [localChoice, setLocalChoice] = useState(null)
  const [coinPositions, setCoinPositions] = useState(new Map())
  
  if (!gameState) return null
  
  const phase = gameState.phase
  const currentPlayer = gameState.players?.[address?.toLowerCase()]
  const turnTimer = gameState.roundTimer || 0
  const urgent = turnTimer <= 10

  React.useEffect(() => {
    const handleCoinPosition = (data) => {
      setCoinPositions(prev => {
        const newMap = new Map(prev)
        newMap.set(data.playerAddress, {
          position: data.position,
          rotation: data.rotation,
          timestamp: Date.now()
        })
        return newMap
      })
    }
    
    const handleCoinLanded = (data) => {
      setCoinPositions(prev => {
        const newMap = new Map(prev)
        newMap.delete(data.playerAddress)
        return newMap
      })
    }
    
    socketService.on('physics_coin_position', handleCoinPosition)
    socketService.on('physics_coin_landed', handleCoinLanded)
    
    return () => {
      socketService.off('physics_coin_position', handleCoinPosition)
      socketService.off('physics_coin_landed', handleCoinLanded)
    }
  }, [])

  const handleChoiceSelect = useCallback((choice) => {
    if (currentPlayer?.hasFired) return
    setLocalChoice(choice)
    socketService.emit('physics_set_choice', { gameId: gameState.gameId, address, choice })
  }, [currentPlayer, gameState.gameId, address])

  const handleFireCoin = useCallback((angle, power) => {
    if (!currentPlayer?.choice || currentPlayer?.hasFired) return
    socketService.emit('physics_fire_coin', { gameId: gameState.gameId, address, angle, power })
  }, [currentPlayer, gameState.gameId, address])

  if (phase === 'game_over') {
    const isWinner = gameState.winner?.toLowerCase() === address?.toLowerCase()
    return (
      <FullScreenContainer>
        <GameOverOverlay isWinner={isWinner}>
          <div className="trophy">{isWinner ? '🏆' : '💀'}</div>
          <div className="message">{isWinner ? 'VICTORY!' : 'GAME OVER'}</div>
          <div className="winner">
            Winner: {gameState.winner ? `${gameState.winner.slice(0, 10)}...${gameState.winner.slice(-8)}` : 'None'}
          </div>
        </GameOverOverlay>
      </FullScreenContainer>
    )
  }

  return (
    <FullScreenContainer>
      {phase === 'round_active' && (
        <RoundIndicator>
          <div className="round-text">
            🎯 ROUND {gameState.currentRound}
          </div>
        </RoundIndicator>
      )}
      
      <GameArea>
        <PhysicsScene 
          obstacles={gameState.obstacles || []} 
          players={gameState.players || {}} 
          coinPositions={Array.from(coinPositions.values())}
          playerAddresses={Array.from(coinPositions.keys())}
          currentPlayerAddress={address} 
        />
      </GameArea>
    </FullScreenContainer>
  )
}

export default PhysicsGameScreen
