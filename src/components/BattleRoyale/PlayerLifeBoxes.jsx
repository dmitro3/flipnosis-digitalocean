import React from 'react'
import styled from '@emotion/styled'
import ProfilePicture from '../ProfilePicture'

const BoxesContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(${props => props.playerCount}, 1fr);
  gap: 0.5rem;
  height: 100%;
  padding: 0.5rem;
  background: rgba(0, 0, 20, 0.9);
`

const PlayerBox = styled.div`
  background: linear-gradient(135deg, ${props => props.isCurrentPlayer ? 'rgba(0, 255, 136, 0.2)' : 'rgba(0, 191, 255, 0.2)'}, rgba(0, 0, 0, 0.8));
  border: 3px solid ${props => { if (props.isCurrentTurn) return '#FFD700'; if (props.isCurrentPlayer) return '#00ff88'; return '#00bfff' }};
  border-radius: 1rem;
  padding: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  opacity: ${props => props.isEliminated ? 0.3 : 1};
  filter: ${props => props.isEliminated ? 'grayscale(100%)' : 'none'};
  transition: all 0.3s ease;
  box-shadow: ${props => props.isCurrentTurn ? '0 0 30px rgba(255, 215, 0, 0.5)' : 'none'};
  animation: ${props => props.isCurrentTurn ? 'turnGlow 2s ease-in-out infinite' : 'none'};
  @keyframes turnGlow { 0%, 100% { box-shadow: 0 0 20px rgba(255, 215, 0, 0.5); } 50% { box-shadow: 0 0 40px rgba(255, 215, 0, 0.8); } }
`

const PlayerHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`

const PlayerInfo = styled.div`
  flex: 1;
  .address { color: white; font-size: 0.8rem; font-family: monospace; font-weight: bold; }
  .label { color: ${props => props.isCurrentPlayer ? '#00ff88' : '#aaa'}; font-size: 0.7rem; }
`

const LivesDisplay = styled.div`
  display: flex;
  gap: 0.25rem;
  justify-content: center;
  .heart { font-size: 1.5rem; }
`

const ChoiceDisplay = styled.div`
  text-align: center;
  padding: 0.5rem;
  background: ${props => { if (props.choice === 'heads') return 'rgba(255, 215, 0, 0.2)'; if (props.choice === 'tails') return 'rgba(192, 192, 192, 0.2)'; return 'rgba(100, 100, 100, 0.2)' }};
  border: 2px solid ${props => { if (props.choice === 'heads') return '#FFD700'; if (props.choice === 'tails') return '#C0C0C0'; return '#666' }};
  border-radius: 0.5rem;
  color: ${props => { if (props.choice === 'heads') return '#FFD700'; if (props.choice === 'tails') return '#C0C0C0'; return '#999' }};
  font-weight: bold;
  font-size: 0.9rem;
`

const ResultDisplay = styled.div`
  text-align: center;
  padding: 0.5rem;
  background: ${props => props.won ? 'rgba(0, 255, 136, 0.3)' : 'rgba(255, 51, 51, 0.3)'};
  border: 2px solid ${props => props.won ? '#00ff88' : '#ff3333'};
  border-radius: 0.5rem;
  color: ${props => props.won ? '#00ff88' : '#ff3333'};
  font-weight: bold;
  font-size: 1.1rem;
`

const EliminatedBadge = styled.div`
  text-align: center;
  padding: 0.5rem;
  background: rgba(255, 0, 0, 0.3);
  border: 2px solid #ff0000;
  border-radius: 0.5rem;
  color: #ff6b6b;
  font-weight: bold;
  font-size: 0.9rem;
`

const PlayerLifeBoxes = ({ players = {}, playerOrder = [], currentPlayerAddress = null, currentTurnPlayer = null }) => {
  return (
    <BoxesContainer playerCount={Math.min(playerOrder.length, 6)}>
      {playerOrder.map(playerAddr => {
        const player = players[playerAddr]
        if (!player) return null
        const isCurrentPlayer = playerAddr.toLowerCase() === currentPlayerAddress?.toLowerCase()
        const isCurrentTurn = playerAddr.toLowerCase() === currentTurnPlayer?.toLowerCase()
        const isEliminated = !player.isActive
        return (
          <PlayerBox key={playerAddr} isCurrentPlayer={isCurrentPlayer} isCurrentTurn={isCurrentTurn} isEliminated={isEliminated}>
            <PlayerHeader>
              <ProfilePicture address={playerAddr} size={40} style={{ borderRadius: '50%', border: '2px solid rgba(255, 255, 255, 0.3)' }} />
              <PlayerInfo isCurrentPlayer={isCurrentPlayer}>
                <div className="address">{isCurrentPlayer ? 'YOU' : `${playerAddr.slice(0, 6)}...${playerAddr.slice(-4)}`}</div>
                <div className="label">{isCurrentTurn ? '🎯 Your Turn' : isCurrentPlayer ? 'Waiting...' : 'Opponent'}</div>
              </PlayerInfo>
            </PlayerHeader>
            {!isEliminated && (
              <LivesDisplay>
                {[1, 2, 3].map(i => (
                  <span key={i} className="heart" style={{ filter: i <= player.lives ? 'none' : 'grayscale(100%)', opacity: i <= player.lives ? 1 : 0.3 }}>
                    {i <= player.lives ? '❤️' : '🖤'}
                  </span>
                ))}
              </LivesDisplay>
            )}
            {player.choice && !isEliminated && (<ChoiceDisplay choice={player.choice}>{player.choice.toUpperCase()}</ChoiceDisplay>)}
            {player.lastResult && !isEliminated && (<ResultDisplay won={player.lastResult.won}>{player.lastResult.won ? '✅ WIN' : '❌ LOSE'}</ResultDisplay>)}
            {isEliminated && (<EliminatedBadge>💀 ELIMINATED</EliminatedBadge>)}
          </PlayerBox>
        )
      })}
    </BoxesContainer>
  )
}

export default PlayerLifeBoxes


