import React, { useState, useEffect } from 'react'
import styled from '@emotion/styled'
import { keyframes } from '@emotion/react'

const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: scale(0.8);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
`

const pulse = keyframes`
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.8;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
`

const CountdownOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(0, 20, 40, 0.98) 100%);
  backdrop-filter: blur(20px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  animation: ${fadeIn} 0.3s ease-out;
`

const CountdownContent = styled.div`
  text-align: center;
  color: white;
`

const CountdownTitle = styled.h1`
  font-size: 3rem;
  margin-bottom: 2rem;
  background: linear-gradient(90deg, #FFD700 0%, #FFA500 50%, #FF6B00 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: 0 0 40px rgba(255, 215, 0, 0.5);
  
  @media (max-width: 768px) {
    font-size: 2rem;
  }
`

const CountdownNumber = styled.div`
  font-size: 12rem;
  font-weight: 900;
  margin: 2rem 0;
  animation: ${pulse} 1s ease-in-out infinite;
  background: linear-gradient(135deg, #00FFFF 0%, #0080FF 50%, #0040FF 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: 
    0 0 20px rgba(0, 255, 255, 0.8),
    0 0 40px rgba(0, 128, 255, 0.6),
    0 0 60px rgba(0, 64, 255, 0.4);
  filter: drop-shadow(0 0 30px rgba(0, 255, 255, 0.5));
  
  @media (max-width: 768px) {
    font-size: 8rem;
  }
`

const PlayerInfo = styled.div`
  display: flex;
  gap: 3rem;
  margin-top: 3rem;
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 1.5rem;
  }
`

const PlayerCard = styled.div`
  background: ${props => props.isCreator ? 
    'linear-gradient(135deg, rgba(255, 215, 0, 0.2) 0%, rgba(255, 165, 0, 0.1) 100%)' :
    'linear-gradient(135deg, rgba(0, 255, 65, 0.2) 0%, rgba(0, 204, 51, 0.1) 100%)'
  };
  border: 2px solid ${props => props.isCreator ? '#FFD700' : '#00FF41'};
  border-radius: 1rem;
  padding: 1.5rem 2rem;
  min-width: 200px;
  box-shadow: 0 0 30px ${props => props.isCreator ? 
    'rgba(255, 215, 0, 0.3)' : 
    'rgba(0, 255, 65, 0.3)'
  };
`

const PlayerRole = styled.div`
  font-size: 0.9rem;
  color: ${props => props.isCreator ? '#FFD700' : '#00FF41'};
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 2px;
`

const PlayerAddress = styled.div`
  font-size: 1rem;
  color: white;
  font-family: monospace;
`

const GameStartingText = styled.div`
  font-size: 1.2rem;
  color: #CCCCCC;
  margin-top: 2rem;
  animation: ${pulse} 2s ease-in-out infinite;
`

const GameCountdown = ({ 
  isVisible, 
  onComplete,
  creatorAddress,
  challengerAddress,
  currentUserAddress
}) => {
  const [count, setCount] = useState(3)

  useEffect(() => {
    if (!isVisible) return

    const timer = setInterval(() => {
      setCount(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          setTimeout(() => {
            onComplete()
          }, 500)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [isVisible, onComplete])

  if (!isVisible) return null

  const formatAddress = (address) => {
    if (!address) return 'Unknown'
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const isCreator = currentUserAddress?.toLowerCase() === creatorAddress?.toLowerCase()

  return (
    <CountdownOverlay>
      <CountdownContent>
        <CountdownTitle>⚔️ GAME STARTING ⚔️</CountdownTitle>
        
        {count > 0 ? (
          <CountdownNumber>{count}</CountdownNumber>
        ) : (
          <CountdownNumber style={{ fontSize: '4rem' }}>GO!</CountdownNumber>
        )}
        
        <PlayerInfo>
          <PlayerCard isCreator={true}>
            <PlayerRole isCreator={true}>
              {isCreator ? '👑 You (Creator)' : '👑 Creator'}
            </PlayerRole>
            <PlayerAddress>{formatAddress(creatorAddress)}</PlayerAddress>
          </PlayerCard>
          
          <PlayerCard isCreator={false}>
            <PlayerRole isCreator={false}>
              {!isCreator ? '⚔️ You (Challenger)' : '⚔️ Challenger'}
            </PlayerRole>
            <PlayerAddress>{formatAddress(challengerAddress)}</PlayerAddress>
          </PlayerCard>
        </PlayerInfo>
        
        <GameStartingText>
          Prepare for battle! Best of 3 rounds wins the game.
        </GameStartingText>
      </CountdownContent>
    </CountdownOverlay>
  )
}

export default GameCountdown
