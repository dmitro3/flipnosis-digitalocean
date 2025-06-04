import React from 'react'
import { theme } from '../styles/theme'

const PowerDisplay = ({ 
  creatorPower = 0,
  joinerPower = 0,
  currentPlayer = null,
  creator = null,
  joiner = null,
  chargingPlayer = null
}) => {
  return (
    <div style={{
      background: 'rgba(0, 0, 0, 0.8)',
      padding: '1.5rem',
      borderRadius: '1rem',
      border: `1px solid ${theme.colors.neonYellow}`,
      backdropFilter: 'blur(10px)',
      maxWidth: '400px',
      margin: '0 auto'
    }}>
      <div style={{
        color: theme.colors.neonYellow,
        fontSize: '1rem',
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: '1rem'
      }}>
        ⚡ POWER LEVELS ⚡
      </div>

      {/* Player 1 (Creator) - Heads */}
      <div style={{ marginBottom: '1rem' }}>
        <div style={{
          color: theme.colors.neonPink,
          fontSize: '0.9rem',
          fontWeight: 'bold',
          marginBottom: '0.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span>👑 Player 1 (Heads)</span>
          <span>{creatorPower.toFixed(1)}/10</span>
          {currentPlayer === creator && (
            <span style={{ 
              color: theme.colors.statusSuccess, 
              fontSize: '0.8rem',
              animation: 'pulse 1s infinite'
            }}>
              ← TURN
            </span>
          )}
        </div>
        <div style={{
          height: '15px',
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '8px',
          overflow: 'hidden',
          border: `2px solid ${theme.colors.neonPink}`,
          position: 'relative'
        }}>
          <div style={{
            height: '100%',
            width: `${(creatorPower / 10) * 100}%`,
            background: chargingPlayer === creator ? 
              `linear-gradient(90deg, ${theme.colors.neonPink}, ${theme.colors.neonOrange}, ${theme.colors.neonYellow})` :
              `linear-gradient(90deg, ${theme.colors.neonPink}, ${theme.colors.neonPurple})`,
            borderRadius: '6px',
            transition: 'width 0.1s ease',
            backgroundSize: '200% 100%',
            animation: chargingPlayer === creator ? 'powerCharge 0.5s linear infinite' : 'none'
          }} />
        </div>
      </div>

      {/* Player 2 (Joiner) - Tails */}
      <div style={{ marginBottom: '1rem' }}>
        <div style={{
          color: theme.colors.neonBlue,
          fontSize: '0.9rem',
          fontWeight: 'bold',
          marginBottom: '0.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span>💎 Player 2 (Tails)</span>
          <span>{joinerPower.toFixed(1)}/10</span>
          {currentPlayer === joiner && (
            <span style={{ 
              color: theme.colors.statusSuccess, 
              fontSize: '0.8rem',
              animation: 'pulse 1s infinite'
            }}>
              ← TURN
            </span>
          )}
        </div>
        <div style={{
          height: '15px',
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '8px',
          overflow: 'hidden',
          border: `2px solid ${theme.colors.neonBlue}`,
          position: 'relative'
        }}>
          <div style={{
            height: '100%',
            width: `${(joinerPower / 10) * 100}%`,
            background: chargingPlayer === joiner ? 
              `linear-gradient(90deg, ${theme.colors.neonBlue}, ${theme.colors.neonGreen}, ${theme.colors.neonYellow})` :
              `linear-gradient(90deg, ${theme.colors.neonBlue}, ${theme.colors.neonGreen})`,
            borderRadius: '6px',
            transition: 'width 0.1s ease',
            backgroundSize: '200% 100%',
            animation: chargingPlayer === joiner ? 'powerCharge 0.5s linear infinite' : 'none'
          }} />
        </div>
      </div>

      {/* Combined Power Info */}
      <div style={{
        textAlign: 'center',
        color: theme.colors.textTertiary,
        fontSize: '0.8rem',
        paddingTop: '0.5rem',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        Combined Power: {(creatorPower + joinerPower).toFixed(1)} = Longer Flip Duration!
      </div>

      {/* Charging Indicator */}
      {chargingPlayer && (
        <div style={{
          color: theme.colors.neonPink,
          fontSize: '0.8rem',
          fontWeight: 'bold',
          textAlign: 'center',
          marginTop: '0.5rem',
          animation: 'powerPulse 0.3s ease-in-out infinite'
        }}>
          ⚡ {chargingPlayer === creator ? 'PLAYER 1' : 'PLAYER 2'} CHARGING ⚡
        </div>
      )}
    </div>
  )
}

export default PowerDisplay 