import React, { useState, useEffect } from 'react'
import styled from '@emotion/styled'

const StatusContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(15px);
  border: 3px solid #FF1493;
  border-radius: 1rem;
  margin-bottom: 2rem;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(45deg, transparent 30%, rgba(255, 20, 147, 0.1) 50%, transparent 70%);
    animation: shimmer 3s ease-in-out infinite;
    pointer-events: none;
    z-index: -1;
  }
  
  @keyframes shimmer {
    0%, 100% { transform: translateX(-100%); }
    50% { transform: translateX(100%); }
  }
`

const StatusText = styled.div`
  color: #00ff88;
  font-size: 1.2rem;
  font-weight: bold;
  text-align: left;
`

const PlayersCount = styled.div`
  color: #aaa;
  font-size: 0.9rem;
  margin-top: 0.25rem;
`

const HeadsTailsContainer = styled.div`
  display: flex;
  gap: 1rem;
  align-items: center;
`

const OptionButton = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  font-weight: bold;
  font-size: 1rem;
  transition: all 0.3s ease;
  
  &.heads {
    color: ${props => {
      if (props.winner === 'heads') return '#00ff88' // Green for winner
      if (props.winner === 'tails') return '#333' // Blacked out for loser
      return '#FFD700' // Yellow when alternating
    }};
    background: ${props => {
      if (props.winner === 'heads') return 'rgba(0, 255, 136, 0.1)'
      if (props.winner === 'tails') return 'rgba(0, 0, 0, 0.3)'
      return 'rgba(255, 215, 0, 0.1)'
    }};
    border: 2px solid ${props => {
      if (props.winner === 'heads') return 'rgba(0, 255, 136, 0.3)'
      if (props.winner === 'tails') return 'rgba(0, 0, 0, 0.5)'
      return 'rgba(255, 215, 0, 0.3)'
    }};
    opacity: ${props => props.winner === 'tails' ? 0.3 : 1};
  }
  
  &.tails {
    color: ${props => {
      if (props.winner === 'tails') return '#00ff88' // Green for winner
      if (props.winner === 'heads') return '#333' // Blacked out for loser
      return '#FFD700' // Yellow when alternating
    }};
    background: ${props => {
      if (props.winner === 'tails') return 'rgba(0, 255, 136, 0.1)'
      if (props.winner === 'heads') return 'rgba(0, 0, 0, 0.3)'
      return 'rgba(255, 215, 0, 0.1)'
    }};
    border: 2px solid ${props => {
      if (props.winner === 'tails') return 'rgba(0, 255, 136, 0.3)'
      if (props.winner === 'heads') return 'rgba(0, 0, 0, 0.5)'
      return 'rgba(255, 215, 0, 0.3)'
    }};
    opacity: ${props => props.winner === 'heads' ? 0.3 : 1};
  }
  
  &.alternating {
    animation: pulse 0.5s ease-in-out infinite;
  }
  
  @keyframes pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.7; transform: scale(1.05); }
  }
`

const HeadsTailsDisplay = ({ 
  gamePhase = 'waiting', 
  targetResult = null, 
  timeLeft = 20,
  isRevealing = false,
  currentPlayers = 0
}) => {
  const [alternatingOption, setAlternatingOption] = useState('heads')
  const [alternatingInterval, setAlternatingInterval] = useState(null)

  // Handle alternating animation during revealing
  useEffect(() => {
    if (isRevealing && !targetResult) {
      // Start alternating between heads and tails
      const interval = setInterval(() => {
        setAlternatingOption(prev => prev === 'heads' ? 'tails' : 'heads')
      }, 200) // Switch every 200ms for rapid alternating
      
      setAlternatingInterval(interval)
      
      return () => {
        clearInterval(interval)
        setAlternatingInterval(null)
      }
    } else if (targetResult) {
      // Stop alternating when result is determined
      if (alternatingInterval) {
        clearInterval(alternatingInterval)
        setAlternatingInterval(null)
      }
    }
  }, [isRevealing, targetResult, alternatingInterval])

  // Get status text based on game phase
  const getStatusText = () => {
    switch (gamePhase) {
      case 'starting': return 'Game Starting...'
      case 'revealing_target': return 'Revealing Target...'
      case 'charging_power': return `Charge Your Power! (${timeLeft}s)`
      case 'executing_flips': return 'Flipping...'
      case 'showing_result': return 'Round Complete!'
      case 'completed': return 'Game Over!'
      default: return 'Waiting for game to begin'
    }
  }

  return (
    <StatusContainer>
      <div>
        <StatusText>{getStatusText()}</StatusText>
        <PlayersCount>{currentPlayers} / 6 Players</PlayersCount>
      </div>
      
      <HeadsTailsContainer>
        <OptionButton 
          className={`heads ${isRevealing && !targetResult ? 'alternating' : ''}`}
          winner={targetResult}
          style={{
            opacity: isRevealing && !targetResult && alternatingOption !== 'heads' ? 0.3 : undefined
          }}
        >
          🟡 HEADS
        </OptionButton>
        
        <OptionButton 
          className={`tails ${isRevealing && !targetResult ? 'alternating' : ''}`}
          winner={targetResult}
          style={{
            opacity: isRevealing && !targetResult && alternatingOption !== 'tails' ? 0.3 : undefined
          }}
        >
          🔴 TAILS
        </OptionButton>
      </HeadsTailsContainer>
    </StatusContainer>
  )
}

export default HeadsTailsDisplay
