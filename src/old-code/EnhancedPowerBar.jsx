import React from 'react'
import { theme } from '../styles/theme'

const EnhancedPowerBar = ({ 
  creatorPower = 0,
  joinerPower = 0,
  isCharging = false, 
  isVisible = true,
  currentPlayer = null,
  isCreator = false,
  maxPower = 10 
}) => {
  if (!isVisible) return null

  return (
    <div style={{
      position: 'absolute',
      bottom: '-80px',
      left: '50%',
      transform: 'translateX(-50%)',
      width: '300px',
      background: 'rgba(0, 0, 0, 0.8)',
      padding: '1rem',
      borderRadius: '1rem',
      border: `1px solid ${theme.colors.neonYellow}`,
      backdropFilter: 'blur(10px)'
    }}>
      {/* Power Bars for both players */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        
        {/* Player 1 (Creator) - Heads */}
        <div>
          <div style={{
            color: theme.colors.neonPink,
            fontSize: '0.8rem',
            fontWeight: 'bold',
            marginBottom: '0.25rem',
            display: 'flex',
            justifyContent: 'space-between'
          }}>
            <span>👑 Player 1 (Heads)</span>
            <span>{creatorPower.toFixed(1)}/{maxPower}</span>
          </div>
          <div style={{
            height: '12px',
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '6px',
            overflow: 'hidden',
            border: `1px solid ${theme.colors.neonPink}`
          }}>
            <div style={{
              height: '100%',
              width: `${(creatorPower / maxPower) * 100}%`,
              background: `linear-gradient(90deg, ${theme.colors.neonPink}, ${theme.colors.neonPurple})`,
              borderRadius: '5px',
              transition: 'width 0.1s ease'
            }} />
          </div>
        </div>

        {/* Player 2 (Joiner) - Tails */}
        <div>
          <div style={{
            color: theme.colors.neonBlue,
            fontSize: '0.8rem',
            fontWeight: 'bold',
            marginBottom: '0.25rem',
            display: 'flex',
            justifyContent: 'space-between'
          }}>
            <span>💎 Player 2 (Tails)</span>
            <span>{joinerPower.toFixed(1)}/{maxPower}</span>
          </div>
          <div style={{
            height: '12px',
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '6px',
            overflow: 'hidden',
            border: `1px solid ${theme.colors.neonBlue}`
          }}>
            <div style={{
              height: '100%',
              width: `${(joinerPower / maxPower) * 100}%`,
              background: `linear-gradient(90deg, ${theme.colors.neonBlue}, ${theme.colors.neonGreen})`,
              borderRadius: '5px',
              transition: 'width 0.1s ease'
            }} />
          </div>
        </div>
      </div>

      {/* Current Player Indicator */}
      <div style={{
        marginTop: '0.5rem',
        textAlign: 'center',
        color: theme.colors.neonYellow,
        fontSize: '0.8rem',
        fontWeight: 'bold'
      }}>
        {currentPlayer === 'creator' ? '👑 Player 1 Turn' : 
         currentPlayer === 'joiner' ? '💎 Player 2 Turn' : 
         'Waiting...'}
      </div>

      {/* Charging Indicator */}
      {isCharging && (
        <div style={{
          color: theme.colors.neonPink,
          fontSize: '0.75rem',
          fontWeight: 'bold',
          textAlign: 'center',
          marginTop: '0.25rem',
          animation: 'powerPulse 0.2s ease-in-out infinite'
        }}>
          ⚡ CHARGING ⚡
        </div>
      )}

      {/* Total Power Display */}
      <div style={{
        marginTop: '0.5rem',
        textAlign: 'center',
        color: theme.colors.textTertiary,
        fontSize: '0.7rem'
      }}>
        Combined Power: {(creatorPower + joinerPower).toFixed(1)} = Longer Flip!
      </div>
    </div>
  )
}

export default EnhancedPowerBar 