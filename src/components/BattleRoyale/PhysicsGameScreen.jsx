import React, { useState, useCallback } from 'react'
import styled from '@emotion/styled'
import PhysicsScene from './PhysicsScene'
import CannonController from './CannonController'
import PlayerLifeBoxes from './PlayerLifeBoxes'
import { useBattleRoyaleGame } from '../../contexts/BattleRoyaleGameContext'
import socketService from '../../services/SocketService'

const FullScreenContainer = styled.div`
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  width: 100vw !important;
  height: 100vh !important;
  background: #000000;
  display: flex !important;
  flex-direction: column;
  overflow: hidden;
  z-index: 9999 !important;
  margin: 0 !important;
  padding: 0 !important;
  border: none !important;
`

const GameArea = styled.div`
  flex: 1;
  position: relative;
  width: 100vw;
  height: calc(100vh - 220px);
  background: #000000;
  border-bottom: 4px solid #00ffff;
  box-shadow: 0 4px 30px rgba(0, 255, 255, 0.3);
  overflow: hidden;
  
  > div {
    width: 100% !important;
    height: 100% !important;
  }
`

const ControlArea = styled.div`
  height: 220px;
  width: 100vw;
  background: rgba(0, 0, 30, 0.98);
  border-top: 4px solid #00ffff;
  display: grid;
  grid-template-columns: 2fr 200px 2fr;
  gap: 1rem;
  padding: 1rem;
  align-items: stretch;
  box-shadow: 0 -4px 30px rgba(0, 255, 255, 0.2);
  
  @media (max-width: 1200px) {
    grid-template-columns: 1fr 180px 1fr;
  }
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    height: auto;
  }
`

const CenterColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  align-items: stretch;
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

const TimerDisplay = styled.div`
  background: rgba(0, 0, 0, 0.95);
  border: 4px solid ${props => props.urgent ? '#ff1493' : '#00ffff'};
  border-radius: 1.5rem;
  color: white;
  font-size: 2.5rem;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 80px;
  box-shadow: 0 0 50px ${props => props.urgent ? 'rgba(255, 20, 147, 0.8)' : 'rgba(0, 255, 255, 0.8)'};
  animation: ${props => props.urgent ? 'pulse 0.8s ease-in-out infinite' : 'none'};
  font-family: 'Hyperwave', monospace;
  
  @keyframes pulse { 
    0%, 100% { transform: scale(1); opacity: 1; } 
    50% { transform: scale(1.08); opacity: 0.85; } 
  }
`

const CoinSelectButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.8rem;
  padding: 0.8rem;
  background: rgba(0, 255, 255, 0.15);
  border: 3px solid #00ffff;
  border-radius: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  flex: 1;
  
  &:hover:not(:disabled) {
    background: rgba(0, 255, 255, 0.25);
    transform: translateY(-2px);
    box-shadow: 0 4px 20px rgba(0, 255, 255, 0.4);
  }
  
  img {
    width: 50px;
    height: 50px;
    border-radius: 50%;
    border: 3px solid #FFD700;
    box-shadow: 0 0 20px rgba(255, 215, 0, 0.6);
  }
  
  .coin-info {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    
    .coin-name {
      color: #00ffff;
      font-weight: bold;
      font-size: 1.2rem;
      font-family: 'Hyperwave', sans-serif;
      letter-spacing: 1px;
    }
    
    .coin-hint {
      color: #aaa;
      font-size: 0.7rem;
    }
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
      
      <ControlArea>
        <PlayerLifeBoxes 
          players={gameState.players || {}} 
          playerOrder={gameState.playerOrder || []} 
          currentPlayerAddress={address}
          maxPlayers={gameState.maxPlayers || 6}
        />
        
        <CenterColumn>
          <TimerDisplay urgent={urgent}>
            {phase === 'round_active' ? `${turnTimer}s` : '⏸'}
          </TimerDisplay>
          
          <CoinSelectButton disabled={true}>
            <img 
              src={currentPlayer?.coin?.headsImage || '/coins/plainh.png'} 
              alt="Current coin" 
            />
            <div className="coin-info">
              <div className="coin-name">{currentPlayer?.coin?.name || 'Classic'}</div>
              <div className="coin-hint">Your Coin</div>
            </div>
          </CoinSelectButton>
        </CenterColumn>
        
        <CannonController 
          onChoiceSelect={handleChoiceSelect} 
          onFire={handleFireCoin} 
          selectedChoice={localChoice || currentPlayer?.choice} 
          disabled={phase !== 'round_active' || currentPlayer?.hasFired}
          hasFired={currentPlayer?.hasFired}
          currentCoin={currentPlayer?.coin}
        />
      </ControlArea>
    </FullScreenContainer>
  )
}

export default PhysicsGameScreen
