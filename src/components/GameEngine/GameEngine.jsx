// components/GameEngine/GameEngine.jsx
// Clean Game Engine Component - Single Source of Truth
// Uses server-side game logic via Socket.io

import React, { useState, useEffect } from 'react'
import styled from '@emotion/styled'
import useGameEngine from '../../hooks/useGameEngine'
import FinalCoin from '../FinalCoin'

// === STYLED COMPONENTS ===
const GameContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  min-height: 500px;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border-radius: 1rem;
  color: white;
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
`

const GameStatus = styled.div`
  text-align: center;
  margin-bottom: 2rem;
`

const StatusText = styled.h2`
  margin: 0;
  font-size: 1.5rem;
  color: #00ff88;
`

const GameInfo = styled.div`
  display: flex;
  justify-content: space-between;
  width: 100%;
  max-width: 600px;
  margin-bottom: 2rem;
`

const PlayerCard = styled.div`
  background: rgba(255, 255, 255, 0.1);
  padding: 1rem;
  border-radius: 0.5rem;
  text-align: center;
  min-width: 120px;
  border: ${props => props.isActive ? '2px solid #00ff88' : '2px solid transparent'};
`

const PlayerName = styled.div`
  font-weight: bold;
  margin-bottom: 0.5rem;
`

const PlayerChoice = styled.div`
  font-size: 0.9rem;
  color: #aaa;
  margin-bottom: 0.5rem;
`

const PlayerScore = styled.div`
  font-size: 1.2rem;
  color: #00ff88;
`

const CoinArea = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 2rem 0;
`

const ChoiceButtons = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
`

const ChoiceButton = styled.button`
  padding: 1rem 2rem;
  font-size: 1.1rem;
  font-weight: bold;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
  
  background: ${props => props.choice === 'heads' 
    ? 'linear-gradient(135deg, #ffd700, #ffed4e)' 
    : 'linear-gradient(135deg, #c0392b, #e74c3c)'};
  color: ${props => props.choice === 'heads' ? '#000' : '#fff'};
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 15px rgba(0, 255, 136, 0.3);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`

const WaitingMessage = styled.div`
  text-align: center;
  font-size: 1.1rem;
  color: #aaa;
  margin: 2rem 0;
`

const CountdownDisplay = styled.div`
  font-size: 2rem;
  color: #ff6b6b;
  font-weight: bold;
  margin: 1rem 0;
`

const PowerBar = styled.div`
  width: 200px;
  height: 20px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  overflow: hidden;
  margin: 1rem 0;
`

const PowerFill = styled.div`
  height: 100%;
  background: linear-gradient(90deg, #00ff88, #00cc6a);
  width: ${props => props.power}%;
  transition: width 0.1s ease;
`

const LoadingSpinner = styled.div`
  border: 4px solid #f3f3f3;
  border-top: 4px solid #00ff88;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin: 2rem auto;
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`

// === MAIN COMPONENT ===
const GameEngine = ({ gameId, gameData, address, coinConfig }) => {
  // Use single game engine hook
  const {
    gameState,
    isCreator,
    isChallenger,
    isMyTurn,
    canMakeChoice,
    makeChoice,
    chargePower,
    executeFlip,
    requestGameState,
    forceGameStart,
    connected,
    loading
  } = useGameEngine(gameId, address, gameData)
  
  // Local state for power charging
  const [chargingPower, setChargingPower] = useState(0)
  const [isCharging, setIsCharging] = useState(false)
  const [chargingInterval, setChargingInterval] = useState(null)
  
  // === POWER CHARGING LOGIC ===
  const startCharging = () => {
    if (gameState.phase !== 'charging' || !isMyTurn) return
    
    console.log('⚡ Starting power charge')
    setIsCharging(true)
    setChargingPower(0)
    
    const interval = setInterval(() => {
      setChargingPower(prev => {
        const newPower = Math.min(100, prev + 2) // 2% per 100ms = 5 seconds to max
        chargePower(newPower)
        return newPower
      })
    }, 100)
    
    setChargingInterval(interval)
  }
  
  const stopCharging = () => {
    if (!isCharging) return
    
    console.log('⚡ Stopping power charge at:', chargingPower)
    
    if (chargingInterval) {
      clearInterval(chargingInterval)
      setChargingInterval(null)
    }
    
    setIsCharging(false)
    executeFlip(chargingPower)
  }
  
  // Cleanup charging on unmount
  useEffect(() => {
    return () => {
      if (chargingInterval) {
        clearInterval(chargingInterval)
      }
    }
  }, [chargingInterval])
  
  // === RENDER HELPERS ===
  const getStatusText = () => {
    if (loading) return 'Loading game...'
    if (!connected) return 'Connecting...'
    
    switch (gameState.phase) {
      case 'waiting':
        return 'Waiting for players...'
      case 'choosing':
        if (canMakeChoice) return 'Choose heads or tails!'
        if (isMyTurn) return 'Waiting for your choice...'
        return `Waiting for ${isCreator ? 'challenger' : 'creator'} to choose...`
      case 'charging':
        if (isMyTurn) return 'Hold the coin to charge power!'
        return 'Opponent is charging power...'
      case 'flipping':
        return 'Coin is flipping...'
      case 'results':
        return `Round ${gameState.currentRound} complete!`
      default:
        return 'Game active'
    }
  }
  
  const getPlayerName = (address) => {
    if (!address) return 'Waiting...'
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }
  
  // === RENDER ===
  if (loading) {
    return (
      <GameContainer>
        <LoadingSpinner />
        <StatusText>Loading game...</StatusText>
      </GameContainer>
    )
  }
  
  if (!connected) {
    return (
      <GameContainer>
        <StatusText>Connecting to game server...</StatusText>
      </GameContainer>
    )
  }
  
  return (
    <GameContainer>
      {/* Game Status */}
      <GameStatus>
        <StatusText>{getStatusText()}</StatusText>
        {gameState.countdown && (
          <CountdownDisplay>{gameState.countdown}</CountdownDisplay>
        )}
      </GameStatus>
      
      {/* Player Info */}
      <GameInfo>
        <PlayerCard isActive={gameState.currentTurn === gameState.creator}>
          <PlayerName>👑 {getPlayerName(gameState.creator)}</PlayerName>
          <PlayerChoice>
            {gameState.creatorChoice ? `Chose ${gameState.creatorChoice}` : 'Choosing...'}
          </PlayerChoice>
          <PlayerScore>Score: {gameState.creatorScore}</PlayerScore>
        </PlayerCard>
        
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
            Round {gameState.currentRound}/5
          </div>
          <div style={{ fontSize: '0.9rem', color: '#aaa', marginTop: '0.5rem' }}>
            First to 3 wins
          </div>
        </div>
        
        <PlayerCard isActive={gameState.currentTurn === gameState.challenger}>
          <PlayerName>⚔️ {getPlayerName(gameState.challenger)}</PlayerName>
          <PlayerChoice>
            {gameState.challengerChoice ? `Chose ${gameState.challengerChoice}` : 'Choosing...'}
          </PlayerChoice>
          <PlayerScore>Score: {gameState.challengerScore}</PlayerScore>
        </PlayerCard>
      </GameInfo>
      
      {/* Coin Area */}
      <CoinArea>
        <FinalCoin
          isFlipping={gameState.phase === 'flipping'}
          flipResult={gameState.flipResult}
          flipDuration={3000}
          onFlipComplete={() => console.log('Flip animation complete')}
          onPowerCharge={startCharging}
          onPowerRelease={stopCharging}
          isPlayerTurn={isMyTurn && gameState.phase === 'charging'}
          isCharging={isCharging}
          creatorPower={gameState.creatorPower}
          joinerPower={gameState.challengerPower}
          customHeadsImage={coinConfig?.headsImage}
          customTailsImage={coinConfig?.tailsImage}
          size={240}
          material={coinConfig?.material || 'gold'}
        />
        
        {/* Power Bar (only show during charging) */}
        {gameState.phase === 'charging' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ marginBottom: '0.5rem' }}>
              {isCharging ? '⚡ Charging Power ⚡' : 'Power Level'}
            </div>
            <PowerBar>
              <PowerFill power={isMyTurn ? chargingPower : (isCreator ? gameState.challengerPower : gameState.creatorPower)} />
            </PowerBar>
          </div>
        )}
      </CoinArea>
      
      {/* Choice Buttons */}
      {gameState.phase === 'choosing' && canMakeChoice && (
        <ChoiceButtons>
          <ChoiceButton 
            choice="heads" 
            onClick={() => makeChoice('heads')}
          >
            👑 Heads
          </ChoiceButton>
          <ChoiceButton 
            choice="tails" 
            onClick={() => makeChoice('tails')}
          >
            💎 Tails
          </ChoiceButton>
        </ChoiceButtons>
      )}
      
      {/* Waiting Message */}
      {gameState.phase === 'choosing' && !canMakeChoice && (
        <WaitingMessage>
          {isMyTurn ? 'Make your choice above' : 'Waiting for opponent...'}
        </WaitingMessage>
      )}
      
      {/* Debug Section - Only show if game is stuck in waiting */}
      {gameState.status === 'waiting' && gameState.creator && gameState.challenger && (
        <div style={{ 
          textAlign: 'center', 
          margin: '2rem 0', 
          padding: '1rem', 
          background: 'rgba(255, 255, 0, 0.1)', 
          borderRadius: '0.5rem',
          border: '1px solid #ffeb3b'
        }}>
          <div style={{ color: '#ffeb3b', marginBottom: '1rem', fontSize: '0.9rem' }}>
            🛠️ Debug: Both players detected but game hasn't started
          </div>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button 
              onClick={forceGameStart}
              style={{
                padding: '0.5rem 1rem',
                background: '#ff9800',
                color: 'white',
                border: 'none',
                borderRadius: '0.25rem',
                cursor: 'pointer',
                fontSize: '0.8rem'
              }}
            >
              🚀 Force Start Game
            </button>
            <button 
              onClick={requestGameState}
              style={{
                padding: '0.5rem 1rem',
                background: '#2196f3',
                color: 'white',
                border: 'none',
                borderRadius: '0.25rem',
                cursor: 'pointer',
                fontSize: '0.8rem'
              }}
            >
              📊 Request State
            </button>
          </div>
          <div style={{ fontSize: '0.8rem', color: '#aaa', marginTop: '0.5rem' }}>
            Creator: {gameState.creator?.slice(0, 8)}... | Challenger: {gameState.challenger?.slice(0, 8)}...
          </div>
        </div>
      )}
      
      {/* Results Display */}
      {gameState.showResults && gameState.flipResult && (
        <div style={{ textAlign: 'center', margin: '2rem 0' }}>
          <div style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>
            Coin landed: <strong>{gameState.flipResult.toUpperCase()}</strong>
          </div>
          <div style={{ fontSize: '1.2rem', color: gameState.roundWinner === address ? '#00ff88' : '#ff6b6b' }}>
            {gameState.roundWinner === address ? '🎉 You won this round!' : '😔 You lost this round'}
          </div>
        </div>
      )}
    </GameContainer>
  )
}

export default GameEngine
