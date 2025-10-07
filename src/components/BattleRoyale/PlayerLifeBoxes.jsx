import React from 'react'
import styled from '@emotion/styled'
import ProfilePicture from '../ProfilePicture'

const BoxesContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(2, 1fr);
  gap: 0.5rem;
  height: 100%;
  padding: 0;
`

const PlayerBox = styled.div`
  background: linear-gradient(135deg, ${props => {
    if (props.isEmpty) return 'rgba(255, 20, 147, 0.1)'
    if (props.isEliminated) return 'rgba(255, 0, 0, 0.2)'
    if (props.isCurrentPlayer) return 'rgba(0, 255, 136, 0.2)'
    return 'rgba(0, 191, 255, 0.2)'
  }}, rgba(0, 0, 0, 0.8));
  
  border: 2px solid ${props => { 
    if (props.isEmpty) return 'rgba(255, 20, 147, 0.3)'
    if (props.isEliminated) return '#ff0000'
    if (props.isCurrentPlayer) return '#00ff88'
    return '#00bfff'
  }};
  
  border-radius: 0.75rem;
  padding: 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  position: relative;
  transition: all 0.3s ease;
  
  opacity: ${props => props.isEliminated || props.isEmpty ? 0.5 : 1};
  filter: ${props => props.isEliminated ? 'grayscale(100%)' : 'none'};
`

const EmptySlot = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 4rem;
  color: #ff1493;
  text-shadow: 0 0 20px rgba(255, 20, 147, 0.8);
  font-weight: bold;
  animation: pulseX 2s ease-in-out infinite;
  
  @keyframes pulseX {
    0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.8; }
    50% { transform: translate(-50%, -50%) scale(1.1); opacity: 1; }
  }
`

const EliminatedX = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 5rem;
  color: #ff1493;
  text-shadow: 0 0 30px rgba(255, 20, 147, 1);
  font-weight: bold;
  z-index: 10;
  animation: pulseX 2s ease-in-out infinite;
`

const PlayerHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  position: relative;
  z-index: 1;
`

const PlayerInfo = styled.div`
  flex: 1;
  .address { 
    color: white; 
    font-size: 0.75rem; 
    font-family: monospace; 
    font-weight: bold; 
  }
  .label { 
    color: ${props => props.isCurrentPlayer ? '#00ff88' : '#aaa'}; 
    font-size: 0.65rem; 
  }
`

const LivesDisplay = styled.div`
  display: flex;
  gap: 0.25rem;
  justify-content: center;
  position: relative;
  z-index: 1;
  
  .heart { 
    font-size: 1.25rem; 
  }
`

const ChoiceDisplay = styled.div`
  text-align: center;
  padding: 0.5rem;
  background: ${props => { 
    if (props.choice === 'heads') return 'rgba(255, 215, 0, 0.2)'
    if (props.choice === 'tails') return 'rgba(192, 192, 192, 0.2)'
    return 'rgba(100, 100, 100, 0.2)' 
  }};
  border: 2px solid ${props => { 
    if (props.choice === 'heads') return '#FFD700'
    if (props.choice === 'tails') return '#C0C0C0'
    return '#666' 
  }};
  border-radius: 0.5rem;
  color: ${props => { 
    if (props.choice === 'heads') return '#FFD700'
    if (props.choice === 'tails') return '#C0C0C0'
    return '#999' 
  }};
  font-weight: bold;
  font-size: 0.8rem;
  position: relative;
  z-index: 1;
`

const FiredIndicator = styled.div`
  text-align: center;
  padding: 0.5rem;
  background: rgba(0, 255, 136, 0.3);
  border: 2px solid #00ff88;
  border-radius: 0.5rem;
  color: #00ff88;
  font-weight: bold;
  font-size: 0.8rem;
  animation: pulse 1s ease-in-out infinite;
  position: relative;
  z-index: 1;
  
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.7; }
  }
`

const SlotNumber = styled.div`
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  background: rgba(0, 0, 0, 0.7);
  color: #00ffff;
  padding: 0.25rem 0.5rem;
  border-radius: 0.5rem;
  font-size: 0.75rem;
  font-weight: bold;
  z-index: 1;
`

const PlayerLifeBoxes = ({ 
  players = {}, 
  playerOrder = [], 
  currentPlayerAddress = null,
  maxPlayers = 6
}) => {
  // Create array of 6 slots
  const slots = Array.from({ length: maxPlayers }, (_, i) => {
    const playerAddr = playerOrder[i]
    const player = playerAddr ? players[playerAddr] : null
    const isCurrentPlayer = playerAddr?.toLowerCase() === currentPlayerAddress?.toLowerCase()
    const isEmpty = !player
    const isEliminated = player && !player.isActive
    
    return {
      slotNumber: i + 1,
      playerAddr,
      player,
      isCurrentPlayer,
      isEmpty,
      isEliminated
    }
  })

  return (
    <BoxesContainer>
      {slots.map((slot) => (
        <PlayerBox 
          key={slot.slotNumber} 
          isCurrentPlayer={slot.isCurrentPlayer} 
          isEmpty={slot.isEmpty}
          isEliminated={slot.isEliminated}
        >
          <SlotNumber>{slot.slotNumber}</SlotNumber>
          
          {slot.isEmpty ? (
            <EmptySlot>✖</EmptySlot>
          ) : slot.isEliminated ? (
            <>
              <PlayerHeader>
                <ProfilePicture 
                  address={slot.playerAddr} 
                  size={50}
                  style={{ 
                    borderRadius: '50%', 
                    border: '2px solid rgba(255, 0, 0, 0.5)',
                    opacity: 0.3
                  }} 
                />
                <PlayerInfo isCurrentPlayer={slot.isCurrentPlayer}>
                  <div className="address">
                    {slot.isCurrentPlayer ? 'YOU' : `${slot.playerAddr.slice(0, 6)}...${slot.playerAddr.slice(-4)}`}
                  </div>
                  <div className="label" style={{ color: '#ff0000' }}>ELIMINATED</div>
                </PlayerInfo>
              </PlayerHeader>
              <EliminatedX>✖</EliminatedX>
            </>
          ) : (
            <>
              <PlayerHeader>
                <ProfilePicture 
                  address={slot.playerAddr} 
                  size={50}
                  style={{ 
                    borderRadius: '50%', 
                    border: '2px solid rgba(255, 255, 255, 0.3)' 
                  }} 
                />
                <PlayerInfo isCurrentPlayer={slot.isCurrentPlayer}>
                  <div className="address">
                    {slot.isCurrentPlayer ? 'YOU' : `${slot.playerAddr.slice(0, 6)}...${slot.playerAddr.slice(-4)}`}
                  </div>
                  <div className="label">
                    {slot.isCurrentPlayer ? 'Your Turn' : 'Opponent'}
                  </div>
                </PlayerInfo>
              </PlayerHeader>
              
              <LivesDisplay>
                {[1, 2, 3].map(i => (
                  <span 
                    key={i} 
                    className="heart" 
                    style={{ 
                      filter: i <= slot.player.lives ? 'none' : 'grayscale(100%)', 
                      opacity: i <= slot.player.lives ? 1 : 0.3 
                    }}
                  >
                    {i <= slot.player.lives ? '❤️' : '🖤'}
                  </span>
                ))}
              </LivesDisplay>
              
              {slot.player.choice && (
                <ChoiceDisplay choice={slot.player.choice}>
                  {slot.player.choice.toUpperCase()}
                </ChoiceDisplay>
              )}
              
              {slot.player.hasFired && (
                <FiredIndicator>🚀 COIN FIRED!</FiredIndicator>
              )}
            </>
          )}
        </PlayerBox>
      ))}
    </BoxesContainer>
  )
}

export default PlayerLifeBoxes