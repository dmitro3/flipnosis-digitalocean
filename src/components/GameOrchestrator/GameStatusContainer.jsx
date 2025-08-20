import React from 'react'
import styled from '@emotion/styled'

const StatusContainer = styled.div`
  background: rgba(0, 0, 40, 0.95);
  padding: 1.5rem;
  border-radius: 1rem;
  border: 2px solid #00FF41;
  backdrop-filter: blur(10px);
  box-shadow: 0 0 30px rgba(0, 255, 65, 0.3), inset 0 0 20px rgba(0, 255, 65, 0.1);
  min-height: 200px;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(45deg, transparent 30%, rgba(0, 255, 65, 0.1) 50%, transparent 70%);
    animation: shimmer 3s ease-in-out infinite;
    pointer-events: none;
  }
  
  @keyframes shimmer {
    0%, 100% { transform: translateX(-100%); }
    50% { transform: translateX(100%); }
  }
`

const StatusHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid rgba(0, 255, 65, 0.3);
`

const StatusTitle = styled.h3`
  margin: 0;
  color: #00FF41;
  font-size: 1.2rem;
  font-weight: bold;
`

const StatusBadge = styled.div`
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.8rem;
  font-weight: bold;
  background: ${props => {
    switch (props.status) {
      case 'waiting_challenger': return 'rgba(255, 215, 0, 0.2)'
      case 'waiting_challenger_deposit': return 'rgba(255, 20, 147, 0.2)'
      case 'active': return 'rgba(0, 255, 65, 0.2)'
      case 'completed': return 'rgba(0, 191, 255, 0.2)'
      default: return 'rgba(255, 255, 255, 0.1)'
    }
  }};
  border: 1px solid ${props => {
    switch (props.status) {
      case 'waiting_challenger': return 'rgba(255, 215, 0, 0.4)'
      case 'waiting_challenger_deposit': return 'rgba(255, 20, 147, 0.4)'
      case 'active': return 'rgba(0, 255, 65, 0.4)'
      case 'completed': return 'rgba(0, 191, 255, 0.4)'
      default: return 'rgba(255, 255, 255, 0.2)'
    }
  }};
  color: ${props => {
    switch (props.status) {
      case 'waiting_challenger': return '#FFD700'
      case 'waiting_challenger_deposit': return '#FF1493'
      case 'active': return '#00FF41'
      case 'completed': return '#00BFFF'
      default: return '#fff'
    }
  }};
`

const StatusItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  
  &:last-child {
    border-bottom: none;
  }
`

const StatusLabel = styled.span`
  color: #00BFFF;
  font-weight: 500;
`

const StatusValue = styled.span`
  color: #fff;
  font-weight: bold;
`

const GameStatusContainer = ({ gameData, isCreator, currentTurn }) => {
  const getStatusText = (status) => {
    switch (status) {
      case 'waiting_challenger': return 'Waiting for Challenger'
      case 'waiting_challenger_deposit': return 'Waiting for Deposit'
      case 'active': return 'Game Active'
      case 'completed': return 'Game Completed'
      default: return 'Unknown Status'
    }
  }

  const getCurrentPlayer = () => {
    if (!gameData) return 'Unknown'
            if (currentTurn === gameData.creator) {
      return isCreator ? 'You (Creator)' : 'Creator'
    } else {
      return isCreator ? 'Challenger' : 'You (Challenger)'
    }
  }

  return (
    <StatusContainer>
      <StatusHeader>
        <StatusTitle>🎮 Game Status</StatusTitle>
        <StatusBadge status={gameData?.status}>
          {getStatusText(gameData?.status)}
        </StatusBadge>
      </StatusHeader>
      
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <StatusItem>
          <StatusLabel>Game ID:</StatusLabel>
          <StatusValue>{gameData?.id || 'N/A'}</StatusValue>
        </StatusItem>
        
        <StatusItem>
          <StatusLabel>Game Type:</StatusLabel>
          <StatusValue>{gameData?.game_type || 'N/A'}</StatusValue>
        </StatusItem>
        
        <StatusItem>
          <StatusLabel>Current Turn:</StatusLabel>
          <StatusValue>{getCurrentPlayer()}</StatusValue>
        </StatusItem>
        
        {gameData?.status === 'active' && (
          <StatusItem>
            <StatusLabel>Turn Number:</StatusLabel>
            <StatusValue>{gameData?.turn_number || 1}</StatusValue>
          </StatusItem>
        )}
        
        <StatusItem>
          <StatusLabel>Created:</StatusLabel>
          <StatusValue>
            {gameData?.created_at ? new Date(gameData.created_at).toLocaleDateString() : 'N/A'}
          </StatusValue>
        </StatusItem>
        
        {gameData?.status === 'completed' && (
          <StatusItem>
            <StatusLabel>Winner:</StatusLabel>
            <StatusValue style={{ color: '#00FF41' }}>
              {gameData?.winner_address ? 
                (gameData.winner_address === gameData.creator ? 'Creator' : 'Challenger') : 
                'N/A'
              }
            </StatusValue>
          </StatusItem>
        )}
      </div>
    </StatusContainer>
  )
}

export default GameStatusContainer 