import React from 'react'
import { theme } from '../styles/theme'

const GoldGameInstructions = ({ 
  isPlayerTurn, 
  gamePhase, 
  isPlayer, 
  playerNumber, 
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

  // Render instructions based on game phase and player status
  const renderInstructions = () => {
    // If not a player, show simplified message
    if (!isPlayer) {
      return (
        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
          <p style={{ color: theme.colors.textSecondary, fontSize: '0.875rem' }}>
            Game in progress - join to participate!
          </p>
        </div>
      )
    }

    // Player-specific instructions based on game phase
    if (gamePhase === 'choosing') {
      return (
        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
          <p style={{ 
            color: theme.colors.neonYellow, 
            fontWeight: 'bold',
            fontSize: '1rem',
            marginBottom: '0.5rem'
          }}>
            {isPlayerTurn ? 'YOUR TURN TO CHOOSE!' : 'WAITING FOR OPPONENT...'}
          </p>
          <p style={{ color: theme.colors.textSecondary, fontSize: '0.875rem' }}>
            {isPlayerTurn ? 'Select heads or tails below' : 'Opponent is making their choice'}
          </p>
        </div>
      )
    }

    if (gamePhase === 'round_active') {
      return (
        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
          <p style={{ 
            color: theme.colors.statusSuccess, 
            fontWeight: 'bold',
            fontSize: '1rem',
            marginBottom: '0.5rem'
          }}>
            {isPlayerTurn ? 'CHARGE YOUR POWER!' : 'OPPONENT IS CHARGING...'}
          </p>
          <p style={{ color: theme.colors.textSecondary, fontSize: '0.875rem', marginBottom: '0.5rem' }}>
            {isPlayerTurn ? 'Hold the coin to charge, release to flip!' : 'Wait for your opponent to flip'}
          </p>
          {isPlayerTurn && (
            <p style={{ 
              color: playerNumber === 1 ? theme.colors.neonPink : theme.colors.neonBlue, 
              fontSize: '0.875rem',
              fontWeight: 'bold'
            }}>
              You chose: {playerChoice?.toUpperCase() || 'NONE'}
            </p>
          )}
        </div>
      )
    }

    // Default instructions
    return (
      <div style={{ marginTop: '2rem', textAlign: 'center' }}>
        <p style={{ color: theme.colors.textSecondary, fontSize: '0.875rem' }}>
          Game ready - waiting for next phase
        </p>
      </div>
    )
  }

  return (
    <div style={{
      background: 'rgba(0, 0, 0, 0.3)',
      borderRadius: '1rem',
      padding: '1rem',
      border: '1px solid rgba(255, 255, 255, 0.1)'
    }}>
      {/* Score Display */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1rem'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: theme.colors.neonPink, fontSize: '1.5rem', fontWeight: 'bold' }}>
            {creatorWins}
          </div>
          <div style={{ color: theme.colors.textSecondary, fontSize: '0.75rem' }}>
            Player 1
          </div>
        </div>
        
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: theme.colors.textPrimary, fontSize: '1rem', fontWeight: 'bold' }}>
            Round {currentRound} / {maxRounds}
          </div>
          {renderTimer()}
        </div>
        
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: theme.colors.neonBlue, fontSize: '1.5rem', fontWeight: 'bold' }}>
            {joinerWins}
          </div>
          <div style={{ color: theme.colors.textSecondary, fontSize: '0.75rem' }}>
            Player 2
          </div>
        </div>
      </div>

      {/* Power Display */}
      {isPlayer && gamePhase === 'round_active' && (
        <div style={{
          textAlign: 'center',
          marginBottom: '1rem'
        }}>
          <div style={{ color: theme.colors.textSecondary, fontSize: '0.875rem', marginBottom: '0.5rem' }}>
            Power Level
          </div>
          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '1rem',
            padding: '0.5rem',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <div style={{
              width: `${(currentPower / 10) * 100}%`,
              height: '20px',
              background: `linear-gradient(90deg, ${theme.colors.neonGreen}, ${theme.colors.neonYellow})`,
              borderRadius: '1rem',
              transition: 'width 0.1s ease',
              minWidth: currentPower > 0 ? '10%' : '0%'
            }} />
          </div>
          <div style={{
            color: theme.colors.neonYellow,
            fontSize: '1rem',
            fontWeight: 'bold',
            marginTop: '0.5rem'
          }}>
            {currentPower}/10
          </div>
        </div>
      )}

      {/* Instructions */}
      {renderInstructions()}
    </div>
  )
}

export default GoldGameInstructions 