import React from 'react'
import styled from '@emotion/styled'

const Card = styled.div`
  background: rgba(0, 0, 0, 0.8);
  border: 2px solid ${props => props.isActive ? '#00FF41' : 'rgba(255, 255, 255, 0.3)'};
  border-radius: 1rem;
  padding: 1.5rem;
  text-align: center;
  transition: all 0.3s;
  
  ${props => props.isActive && `
    box-shadow: 0 0 20px rgba(0, 255, 65, 0.3);
    animation: activePulse 2s ease-in-out infinite;
    
    @keyframes activePulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.8; }
    }
  `}
`

const PlayerName = styled.h3`
  color: #FFFFFF;
  margin: 0 0 0.5rem 0;
  font-size: 1.2rem;
  font-weight: bold;
`

const PlayerAddress = styled.div`
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.8rem;
  margin-bottom: 1rem;
  word-break: break-all;
`

const Score = styled.div`
  font-size: 2rem;
  font-weight: bold;
  color: #FFD700;
  margin: 1rem 0;
`

const Choice = styled.div`
  background: rgba(255, 255, 255, 0.1);
  border-radius: 0.5rem;
  padding: 0.5rem;
  margin: 0.5rem 0;
  color: ${props => props.choice ? '#00FF41' : 'rgba(255, 255, 255, 0.5)'};
  font-weight: bold;
`

const PowerBar = styled.div`
  width: 100%;
  height: 8px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  overflow: hidden;
  margin: 0.5rem 0;
`

const PowerFill = styled.div`
  height: 100%;
  background: linear-gradient(90deg, #00FF41, #00BFFF);
  width: ${props => props.power}%;
  transition: width 0.3s ease;
`

const PowerText = styled.div`
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.7);
  margin-top: 0.25rem;
`

const TurnIndicator = styled.div`
  background: #00FF41;
  color: #000;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.7rem;
  font-weight: bold;
  margin-top: 0.5rem;
  animation: turnPulse 1s ease-in-out infinite;
  
  @keyframes turnPulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.7; }
  }
`

const PlayerCard = ({ player, isActive, score, choice, power }) => {
  if (!player || !player.address) {
    return (
      <Card>
        <PlayerName>Waiting for player...</PlayerName>
      </Card>
    )
  }

  return (
    <Card isActive={isActive}>
      <PlayerName>{player.name || 'Unknown Player'}</PlayerName>
      <PlayerAddress>{player.address}</PlayerAddress>
      
      <Score>{score || 0}</Score>
      
      {choice && (
        <Choice choice={choice}>
          {choice.toUpperCase()}
        </Choice>
      )}
      
      <PowerBar>
        <PowerFill power={power || 0} />
      </PowerBar>
      <PowerText>Power: {power || 0}%</PowerText>
      
      {isActive && (
        <TurnIndicator>YOUR TURN</TurnIndicator>
      )}
    </Card>
  )
}

export default PlayerCard
