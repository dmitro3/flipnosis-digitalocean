import React from 'react'
import styled from '@emotion/styled'

const StatsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.75rem;
  background: rgba(0, 0, 0, 0.6);
  border-radius: 0.5rem;
  backdrop-filter: blur(10px);
`

const StatRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  font-size: 0.9rem;
`

const LivesDisplay = styled.div`
  display: flex;
  gap: 0.25rem;
  align-items: center;
`

const Heart = styled.span`
  font-size: 1.2rem;
  filter: ${props => props.filled ? 'none' : 'grayscale(100%)'};
  opacity: ${props => props.filled ? 1 : 0.3};
  animation: ${props => props.critical ? 'heartbeat 1s ease-in-out infinite' : 'none'};
  
  @keyframes heartbeat {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.2); }
  }
`

const PowerBar = styled.div`
  flex: 1;
  height: 8px;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 4px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.2);
`

const PowerFill = styled.div`
  height: 100%;
  width: ${props => props.percent}%;
  background: linear-gradient(90deg, #00ffff 0%, #00ff88 50%, #ffff00 100%);
  transition: width 0.3s ease;
  box-shadow: 0 0 10px rgba(0, 255, 255, 0.5);
`

const AbilityIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0.5rem;
  background: ${props => props.available 
    ? 'linear-gradient(135deg, rgba(255, 215, 0, 0.2), rgba(255, 140, 0, 0.2))' 
    : 'rgba(100, 100, 100, 0.2)'};
  border: 1px solid ${props => props.available ? '#FFD700' : '#666'};
  border-radius: 0.5rem;
  font-size: 0.8rem;
  color: ${props => props.available ? '#FFD700' : '#999'};
  animation: ${props => props.available ? 'abilityGlow 2s ease-in-out infinite' : 'none'};
  
  @keyframes abilityGlow {
    0%, 100% { box-shadow: 0 0 5px rgba(255, 215, 0, 0.3); }
    50% { box-shadow: 0 0 15px rgba(255, 215, 0, 0.6); }
  }
`

const XPDisplay = styled.div`
  color: #FFD700;
  font-weight: bold;
  text-align: center;
  font-size: 0.9rem;
  text-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
`

const PlayerStatsBar = ({ lives, power, hasShield, hasLightningRound, totalXPEarned, isCompact = false }) => {
  const isCritical = lives === 1
  return (
    <StatsContainer>
      <StatRow>
        <LivesDisplay>
          {[1, 2, 3].map(i => (
            <Heart key={i} filled={i <= lives} critical={isCritical && i <= lives}>
              {i <= lives ? '❤️' : '🖤'}
            </Heart>
          ))}
        </LivesDisplay>
      </StatRow>
      <StatRow>
        <span style={{ fontSize: '0.8rem', color: '#00ffff' }}>⚡</span>
        <PowerBar>
          <PowerFill percent={power * 10} />
        </PowerBar>
        <span style={{ fontSize: '0.8rem', color: '#00ffff', minWidth: '40px' }}>{power * 10}%</span>
      </StatRow>
      {!isCompact && (
        <StatRow style={{ flexWrap: 'wrap', gap: '0.25rem' }}>
          <AbilityIndicator available={hasShield}>🛡️ {hasShield ? 'READY' : 'USED'}</AbilityIndicator>
          <AbilityIndicator available={hasLightningRound}>⚡ {hasLightningRound ? 'READY' : 'LOCKED'}</AbilityIndicator>
        </StatRow>
      )}
      <XPDisplay>🌟 {totalXPEarned.toLocaleString()} XP</XPDisplay>
    </StatsContainer>
  )
}

export default PlayerStatsBar

