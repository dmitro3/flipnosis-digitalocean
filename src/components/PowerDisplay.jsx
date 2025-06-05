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
      background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.9) 0%, rgba(25, 20, 0, 0.8) 100%)',
      padding: '1.5rem',
      borderRadius: '1rem',
      border: `2px solid #FFD700`,
      backdropFilter: 'blur(10px)',
      maxWidth: '450px',
      margin: '0 auto',
      boxShadow: '0 0 20px rgba(255, 215, 0, 0.3), inset 0 0 20px rgba(255, 215, 0, 0.1)'
    }}>
      <div style={{
        color: '#FFD700',
        fontSize: '1.1rem',
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: '1.2rem',
        textShadow: '0 0 10px rgba(255, 215, 0, 0.5)',
        letterSpacing: '1px'
      }}>
        ⚡ GOLD POWER LEVELS ⚡
      </div>

      {/* Player 1 (Creator) - Heads */}
      <div style={{ marginBottom: '1.2rem' }}>
        <div style={{
          color: theme.colors.neonPink,
          fontSize: '0.95rem',
          fontWeight: 'bold',
          marginBottom: '0.6rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.2rem' }}>👑</span>
            Player 1 (Heads)
          </span>
          <span style={{ 
            color: '#FFD700',
            textShadow: '0 0 5px rgba(255, 215, 0, 0.8)' 
          }}>
            {creatorPower.toFixed(1)}/10
          </span>
          {currentPlayer === creator && (
            <span style={{ 
              color: theme.colors.statusSuccess, 
              fontSize: '0.8rem',
              animation: 'pulse 1s infinite',
              background: 'rgba(0, 255, 65, 0.2)',
              padding: '0.2rem 0.5rem',
              borderRadius: '0.3rem',
              border: '1px solid rgba(0, 255, 65, 0.5)'
            }}>
              ← YOUR TURN
            </span>
          )}
        </div>
        <div style={{
          height: '18px',
          background: 'linear-gradient(90deg, rgba(0, 0, 0, 0.8) 0%, rgba(40, 30, 0, 0.6) 100%)',
          borderRadius: '10px',
          overflow: 'hidden',
          border: `3px solid ${theme.colors.neonPink}`,
          position: 'relative',
          boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.5)'
        }}>
          <div style={{
            height: '100%',
            width: `${(creatorPower / 10) * 100}%`,
            background: chargingPlayer === creator ? 
              `linear-gradient(90deg, #FFD700 0%, #FFA500 30%, #FF6B00 60%, #FF1493 100%)` :
              `linear-gradient(90deg, ${theme.colors.neonPink} 0%, #B026FF 50%, #FFD700 100%)`,
            borderRadius: '7px',
            transition: 'width 0.15s ease-out',
            backgroundSize: '200% 100%',
            animation: chargingPlayer === creator ? 'powerCharge 0.6s linear infinite' : 'none',
            boxShadow: chargingPlayer === creator ? 
              '0 0 15px rgba(255, 215, 0, 0.8), inset 0 0 10px rgba(255, 255, 255, 0.3)' :
              '0 0 8px rgba(255, 20, 147, 0.6)'
          }} />
          
          {/* Power level markers */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '0 0.3rem'
          }}>
            {[2, 4, 6, 8].map(level => (
              <div key={level} style={{
                width: '1px',
                height: '60%',
                background: 'rgba(255, 255, 255, 0.4)',
                opacity: creatorPower >= level ? 1 : 0.3
              }} />
            ))}
          </div>
        </div>
      </div>

      {/* Player 2 (Joiner) - Tails */}
      <div style={{ marginBottom: '1.2rem' }}>
        <div style={{
          color: theme.colors.neonBlue,
          fontSize: '0.95rem',
          fontWeight: 'bold',
          marginBottom: '0.6rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.2rem' }}>💎</span>
            Player 2 (Tails)
          </span>
          <span style={{ 
            color: '#FFD700',
            textShadow: '0 0 5px rgba(255, 215, 0, 0.8)' 
          }}>
            {joinerPower.toFixed(1)}/10
          </span>
          {currentPlayer === joiner && (
            <span style={{ 
              color: theme.colors.statusSuccess, 
              fontSize: '0.8rem',
              animation: 'pulse 1s infinite',
              background: 'rgba(0, 255, 65, 0.2)',
              padding: '0.2rem 0.5rem',
              borderRadius: '0.3rem',
              border: '1px solid rgba(0, 255, 65, 0.5)'
            }}>
              ← YOUR TURN
            </span>
          )}
        </div>
        <div style={{
          height: '18px',
          background: 'linear-gradient(90deg, rgba(0, 0, 0, 0.8) 0%, rgba(0, 20, 40, 0.6) 100%)',
          borderRadius: '10px',
          overflow: 'hidden',
          border: `3px solid ${theme.colors.neonBlue}`,
          position: 'relative',
          boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.5)'
        }}>
          <div style={{
            height: '100%',
            width: `${(joinerPower / 10) * 100}%`,
            background: chargingPlayer === joiner ? 
              `linear-gradient(90deg, #FFD700 0%, #00BFFF 30%, #00FF41 60%, #00FFFF 100%)` :
              `linear-gradient(90deg, ${theme.colors.neonBlue} 0%, #00FF41 50%, #FFD700 100%)`,
            borderRadius: '7px',
            transition: 'width 0.15s ease-out',
            backgroundSize: '200% 100%',
            animation: chargingPlayer === joiner ? 'powerCharge 0.6s linear infinite' : 'none',
            boxShadow: chargingPlayer === joiner ? 
              '0 0 15px rgba(255, 215, 0, 0.8), inset 0 0 10px rgba(255, 255, 255, 0.3)' :
              '0 0 8px rgba(0, 191, 255, 0.6)'
          }} />
          
          {/* Power level markers */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '0 0.3rem'
          }}>
            {[2, 4, 6, 8].map(level => (
              <div key={level} style={{
                width: '1px',
                height: '60%',
                background: 'rgba(255, 255, 255, 0.4)',
                opacity: joinerPower >= level ? 1 : 0.3
              }} />
            ))}
          </div>
        </div>
      </div>

      {/* Combined Power Info */}
      <div style={{
        textAlign: 'center',
        paddingTop: '0.8rem',
        borderTop: '1px solid rgba(255, 215, 0, 0.3)',
        marginTop: '0.5rem'
      }}>
        <div style={{
          color: '#FFD700',
          fontSize: '0.9rem',
          fontWeight: 'bold',
          marginBottom: '0.3rem',
          textShadow: '0 0 8px rgba(255, 215, 0, 0.6)'
        }}>
          Combined Power: {(creatorPower + joinerPower).toFixed(1)}
        </div>
        <div style={{
          color: 'rgba(255, 215, 0, 0.7)',
          fontSize: '0.75rem'
        }}>
          Higher power = Longer, more dramatic coin flip!
        </div>
      </div>

      {/* Charging Indicator */}
      {chargingPlayer && (
        <div style={{
          marginTop: '0.8rem',
          padding: '0.6rem',
          background: 'linear-gradient(90deg, rgba(255, 215, 0, 0.2) 0%, rgba(255, 165, 0, 0.1) 100%)',
          border: '1px solid rgba(255, 215, 0, 0.5)',
          borderRadius: '0.5rem',
          textAlign: 'center'
        }}>
          <div style={{
            color: '#FFD700',
            fontSize: '0.9rem',
            fontWeight: 'bold',
            animation: 'powerPulse 0.4s ease-in-out infinite',
            textShadow: '0 0 10px rgba(255, 215, 0, 0.8)'
          }}>
            ⚡ {chargingPlayer === creator ? 'PLAYER 1' : 'PLAYER 2'} CHARGING POWER ⚡
          </div>
          <div style={{
            color: 'rgba(255, 215, 0, 0.8)',
            fontSize: '0.75rem',
            marginTop: '0.2rem'
          }}>
            Hold to build energy, release to flip!
          </div>
        </div>
      )}

      {/* Power Tips */}
      {!chargingPlayer && (creatorPower > 0 || joinerPower > 0) && (
        <div style={{
          marginTop: '0.8rem',
          padding: '0.5rem',
          background: 'rgba(255, 215, 0, 0.1)',
          border: '1px solid rgba(255, 215, 0, 0.3)',
          borderRadius: '0.5rem',
          textAlign: 'center'
        }}>
          <div style={{
            color: 'rgba(255, 215, 0, 0.9)',
            fontSize: '0.75rem'
          }}>
            💡 Tip: Higher power = More dramatic flip with longer duration
          </div>
        </div>
      )}
    </div>
  )
}

export default PowerDisplay 