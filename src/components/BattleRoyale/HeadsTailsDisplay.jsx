import React from 'react'
import styled from '@emotion/styled'

const StatusContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
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
  text-align: center;
`

const PlayersCount = styled.div`
  color: #aaa;
  font-size: 0.9rem;
  margin-top: 0.25rem;
  text-align: center;
`

const HeadsTailsDisplay = ({ 
  gamePhase = 'waiting', 
  timeLeft = 20,
  currentPlayers = 0
}) => {
  const getStatusText = () => {
    switch (gamePhase) {
      case 'starting': return 'Game Starting...'
      case 'round_active': return `Choose & Flip! (${timeLeft}s)`
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
    </StatusContainer>
  )
}

export default HeadsTailsDisplay
