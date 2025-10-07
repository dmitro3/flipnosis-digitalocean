import React, { useState, useEffect, useCallback } from 'react'
import styled from '@emotion/styled'
import PhysicsScene from './PhysicsScene'
import CannonController from './CannonController'
import PlayerLifeBoxes from './PlayerLifeBoxes'
import { useBattleRoyaleGame } from '../../contexts/BattleRoyaleGameContext'
import socketService from '../../services/SocketService'

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100vw;
  background: #000;
  overflow: hidden;
`

const SceneContainer = styled.div`
  flex: 1;
  position: relative;
  width: 100%;
  min-height: 0;
`

const BottomSection = styled.div`
  height: 250px;
  width: 100%;
  background: rgba(0, 0, 20, 0.95);
  border-top: 3px solid #00ffff;
  display: grid;
  grid-template-columns: 400px 1fr;
  gap: 1rem;
  padding: 1rem;
  
  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
    height: auto;
  }
`

const RoundIndicator = styled.div`
  position: absolute;
  top: 2rem;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.9);
  border: 3px solid #00ffff;
  padding: 1rem 3rem;
  border-radius: 2rem;
  color: white;
  font-size: 1.5rem;
  font-weight: bold;
  text-align: center;
  z-index: 100;
  box-shadow: 0 0 30px rgba(0, 255, 255, 0.5);
`

const TimerDisplay = styled.div`
  position: absolute;
  top: 2rem;
  right: 2rem;
  background: rgba(0, 0, 0, 0.9);
  border: 2px solid ${props => props.urgent ? '#ff6b6b' : '#00bfff'};
  padding: 1rem 2rem;
  border-radius: 1rem;
  color: white;
  font-size: 2rem;
  font-weight: bold;
  z-index: 100;
  animation: ${props => props.urgent ? 'pulse 1s ease-in-out infinite' : 'none'};
  @keyframes pulse { 0%, 100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.1); opacity: 0.8; } }
`

const GameOverOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.95);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  .trophy { font-size: 6rem; margin-bottom: 2rem; }
  .message { font-size: 3rem; font-weight: bold; color: ${props => props.isWinner ? '#FFD700' : '#ff6b6b'}; margin-bottom: 1rem; text-shadow: 0 0 20px currentColor; }
  .winner { font-size: 1.5rem; color: white; font-family: monospace; }
`

const PhysicsGameScreen = () => {
  const { gameState, address } = useBattleRoyaleGame()
  const [localChoice, setLocalChoice] = useState(null)
  const [coinPositions, setCoinPositions] = useState(new Map()) // Map of playerAddress -> coinPosition
  
  if (!gameState) return null
  
  const phase = gameState.phase
  const currentPlayer = gameState.players?.[address?.toLowerCase()]
  const turnTimer = gameState.roundTimer || 0
  const urgent = turnTimer <= 10

  useEffect(() => {
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
      <Container>
        <GameOverOverlay isWinner={isWinner}>
          <div className="trophy">{isWinner ? '🏆' : '💀'}</div>
          <div className="message">{isWinner ? 'VICTORY!' : 'GAME OVER'}</div>
          <div className="winner">Winner: {gameState.winner ? `${gameState.winner.slice(0, 10)}...${gameState.winner.slice(-8)}` : 'None'}</div>
        </GameOverOverlay>
      </Container>
    )
  }

  return (
    <Container>
      {phase === 'round_active' && (
        <>
          <RoundIndicator>
            🎯 ROUND {gameState.currentRound} - EVERYONE FIRES!
          </RoundIndicator>
          <TimerDisplay urgent={urgent}>{turnTimer}s</TimerDisplay>
        </>
      )}
      
      <SceneContainer>
        <PhysicsScene 
          obstacles={gameState.obstacles || []} 
          players={gameState.players || {}} 
          coinPositions={Array.from(coinPositions.values())}
          playerAddresses={Array.from(coinPositions.keys())}
          currentPlayerAddress={address} 
        />
      </SceneContainer>
      
      <BottomSection>
        <CannonController 
          onChoiceSelect={handleChoiceSelect} 
          onFire={handleFireCoin} 
          selectedChoice={localChoice || currentPlayer?.choice} 
          disabled={phase !== 'round_active' || currentPlayer?.hasFired}
          hasFired={currentPlayer?.hasFired}
        />
        
        <PlayerLifeBoxes 
          players={gameState.players || {}} 
          playerOrder={gameState.playerOrder || []} 
          currentPlayerAddress={address}
          maxPlayers={gameState.maxPlayers || 6}
        />
      </BottomSection>
    </Container>
  )
}

export default PhysicsGameScreen