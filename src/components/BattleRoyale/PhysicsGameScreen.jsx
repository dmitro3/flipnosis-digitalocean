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
`

const PlayerBoxesContainer = styled.div`
  height: 200px;
  width: 100%;
  background: rgba(0, 0, 20, 0.9);
  border-top: 2px solid #00ffff;
`

const TurnIndicator = styled.div`
  position: absolute;
  top: 2rem;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.9);
  border: 3px solid ${props => props.isYourTurn ? '#00ff88' : '#ff1493'};
  padding: 1rem 3rem;
  border-radius: 2rem;
  color: white;
  font-size: 1.5rem;
  font-weight: bold;
  text-align: center;
  z-index: 100;
  box-shadow: 0 0 30px ${props => props.isYourTurn ? 'rgba(0, 255, 136, 0.5)' : 'rgba(255, 20, 147, 0.5)'};
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
  const { gameState, address, makeChoice } = useBattleRoyaleGame()
  const [localChoice, setLocalChoice] = useState(null)
  const [coinPositions, setCoinPositions] = useState([])
  const [cameraTarget, setCameraTarget] = useState(null)
  if (!gameState) return null
  const phase = gameState.phase
  const isMyTurn = gameState.currentTurnPlayer?.toLowerCase() === address?.toLowerCase()
  const currentPlayer = gameState.players?.[address?.toLowerCase()]
  const turnTimer = gameState.turnTimer || 0
  const urgent = turnTimer <= 10

  useEffect(() => {
    const handleCoinPosition = (data) => {
      setCoinPositions(prev => [...prev, { position: data.position, rotation: data.rotation, timestamp: Date.now() }])
      setCameraTarget(data.position)
    }
    const handleCoinLanded = (data) => {
      setCameraTarget(null)
      setTimeout(() => { setCoinPositions([]) }, 3000)
    }
    socketService.on('physics_coin_position', handleCoinPosition)
    socketService.on('physics_coin_landed', handleCoinLanded)
    return () => {
      socketService.off('physics_coin_position', handleCoinPosition)
      socketService.off('physics_coin_landed', handleCoinLanded)
    }
  }, [])

  const handleChoiceSelect = useCallback((choice) => {
    if (!isMyTurn) return
    setLocalChoice(choice)
    makeChoice(choice)
  }, [isMyTurn, makeChoice])

  const handleFireCoin = useCallback((angle, power) => {
    if (!isMyTurn || !currentPlayer?.choice) return
    socketService.emit('physics_fire_coin', { gameId: gameState.gameId, address, angle, power })
  }, [isMyTurn, currentPlayer, gameState.gameId, address])

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
      {phase === 'player_turn' && (
        <TurnIndicator isYourTurn={isMyTurn}>{isMyTurn ? '🎯 YOUR TURN!' : `⏳ ${gameState.currentTurnPlayer?.slice(0, 8)}'s Turn`}</TurnIndicator>
      )}
      {phase === 'player_turn' && (<TimerDisplay urgent={urgent}>{turnTimer}s</TimerDisplay>)}
      <SceneContainer>
        <PhysicsScene obstacles={gameState.obstacles || []} players={gameState.players || {}} coinPositions={coinPositions} cameraTarget={cameraTarget} currentPlayerAddress={address} isMyTurn={isMyTurn} />
        {isMyTurn && phase === 'player_turn' && (
          <CannonController onChoiceSelect={handleChoiceSelect} onFire={handleFireCoin} selectedChoice={localChoice || currentPlayer?.choice} disabled={!currentPlayer?.choice} />
        )}
      </SceneContainer>
      <PlayerBoxesContainer>
        <PlayerLifeBoxes players={gameState.players || {}} playerOrder={gameState.playerOrder || []} currentPlayerAddress={address} currentTurnPlayer={gameState.currentTurnPlayer} />
      </PlayerBoxesContainer>
    </Container>
  )
}

export default PhysicsGameScreen


