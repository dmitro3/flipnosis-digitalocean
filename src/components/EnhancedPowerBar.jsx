import React from 'react'
import { theme } from '../styles/theme'

const EnhancedPowerBar = ({ 
  power = 0, 
  isCharging = false, 
  isVisible = true, 
  label = "Power",
  color = theme.colors.neonYellow,
  maxPower = 10 
}) => {
  if (!isVisible) return null

  const powerPercent = (power / maxPower) * 100
  
  return (
    <div style={{
      position: 'absolute',
      bottom: '-60px',
      left: '50%',
      transform: 'translateX(-50%)',
      width: '220px',
      background: 'rgba(0, 0, 0, 0.8)',
      padding: '1rem',
      borderRadius: '1rem',
      border: `1px solid ${color}`,
      backdropFilter: 'blur(10px)'
    }}>
      {/* Power Label */}
      <div style={{
        color: theme.colors.textSecondary,
        fontSize: '0.875rem',
        textAlign: 'center',
        marginBottom: '0.5rem',
        fontWeight: 'bold'
      }}>
        {label}
      </div>

      {/* Power Meter Container */}
      <div style={{
        height: '20px',
        background: 'rgba(255, 255, 255, 0.1)',
        borderRadius: '10px',
        overflow: 'hidden',
        border: `2px solid ${color}`,
        position: 'relative'
      }}>
        {/* Power Fill */}
        <div style={{
          height: '100%',
          width: `${powerPercent}%`,
          background: isCharging 
            ? `linear-gradient(90deg, ${color}, ${theme.colors.neonOrange}, ${theme.colors.neonPink})`
            : `linear-gradient(90deg, ${theme.colors.neonGreen}, ${color})`,
          borderRadius: '8px',
          transition: isCharging ? 'none' : 'width 0.1s ease',
          backgroundSize: '200% 100%',
          animation: isCharging ? 'powerCharge 0.5s linear infinite' : 'none'
        }} />

        {/* Power Level Indicators */}
        <div style={{
          position: 'absolute',
          top: '-25px',
          left: '0',
          right: '0',
          display: 'flex',
          justifyContent: 'space-between',
          paddingLeft: '5px',
          paddingRight: '5px'
        }}>
          {Array.from({ length: 10 }, (_, i) => (
            <span key={i} style={{
              fontSize: '0.75rem',
              color: power > i ? color : theme.colors.textTertiary,
              opacity: power > i ? 1 : 0.3,
              fontWeight: 'bold',
              transition: 'all 0.1s ease'
            }}>
              |
            </span>
          ))}
        </div>
      </div>

      {/* Power Display */}
      <div style={{
        color: color,
        fontSize: '1.25rem',
        fontWeight: 'bold',
        textAlign: 'center',
        marginTop: '0.5rem',
        textShadow: `0 0 10px ${color}`,
        animation: isCharging ? 'powerPulse 0.3s ease-in-out infinite' : 'none'
      }}>
        {power.toFixed(1)} / {maxPower}
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

      {/* Power Level Description */}
      <div style={{
        color: theme.colors.textTertiary,
        fontSize: '0.625rem',
        textAlign: 'center',
        marginTop: '0.25rem'
      }}>
        {power < 3 ? 'Gentle Flip' :
         power < 6 ? 'Medium Power' :
         power < 8 ? 'Strong Flip' :
         power < 10 ? 'Powerful!' : 'MAXIMUM POWER!'}
      </div>
    </div>
  )
}

export default EnhancedPowerBar 