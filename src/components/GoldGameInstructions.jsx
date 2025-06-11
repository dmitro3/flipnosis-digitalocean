import React from 'react'
import { theme } from '../styles/theme'

const GoldGameInstructions = ({ 
  isPlayerTurn, 
  gamePhase, 
  isPlayer, 
  playerNumber, 
  spectatorMode,
  currentPower = 0,
  playerChoice = null,
  currentRound = 1,
  maxRounds = 5,
  creatorWins = 0,
  joinerWins = 0,
  turnTimeLeft = 20
}) => {
  // Add timer display component
  const renderTimer = () => {
    if ((gamePhase === 'round_active' || gamePhase === 'choosing') && turnTimeLeft !== undefined) {
      const color = turnTimeLeft <= 5 ? theme.colors.statusError : '#FFD700'
      return (
        <div style={{
          marginTop: '1rem',
          padding: '0.5rem',
          background: 'rgba(0, 0, 0, 0.2)',
          borderRadius: '0.5rem',
          border: `1px solid ${color}`,
          animation: turnTimeLeft <= 5 ? 'pulse 1s infinite' : 'none'
        }}>
          <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>
            {gamePhase === 'choosing' ? 'Choose Side' : 'Time Left'}
          </div>
          <div style={{ 
            color: color, 
            fontWeight: 'bold',
            fontSize: '1.2rem',
            textShadow: `0 0 10px ${color}`
          }}>
            {turnTimeLeft}s
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <div style={{
      marginTop: '2rem',
      textAlign: 'center',
      padding: '1.5rem',
      background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.1) 0%, rgba(0, 0, 0, 0.3) 100%)',
      border: '2px solid rgba(255, 215, 0, 0.3)',
      borderRadius: '1rem',
      backdropFilter: 'blur(10px)'
    }}>
      {/* Game Info */}
      <div style={{
        marginTop: '1.5rem',
        padding: '1rem',
        background: 'rgba(0, 0, 0, 0.2)',
        borderRadius: '0.8rem',
        border: '1px solid rgba(255, 215, 0, 0.2)'
      }}>
        <h3 style={{
          color: '#FFD700',
          fontSize: '1rem',
          marginBottom: '1rem',
          textAlign: 'left'
        }}>
          Game Info
        </h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '1rem',
          textAlign: 'left'
        }}>
          <div>
            <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>SIDE</div>
            <div style={{ color: '#FFD700', fontWeight: 'bold', textTransform: 'capitalize' }}>
              {gamePhase?.split('\n')[1] || 'Waiting'}
            </div>
          </div>
        </div>
        {renderTimer()}
      </div>
    </div>
  )
}

export default GoldGameInstructions 