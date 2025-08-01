import React from 'react'
import { theme } from '../styles/theme'

const PowerDisplay = ({ 
  creatorPower = 0,
  joinerPower = 0,
  currentPlayer = null,
  creator = null,
  joiner = null,
  chargingPlayer = null,
  gamePhase = null,
  isMyTurn = false,
  playerChoice = null,
  onChoiceSelect = null,
  isMobile = false
}) => {
  // Calculate total power for single bar
  const totalPower = creatorPower + joinerPower
  const maxTotalPower = 10 // Single player max
  
  // Show choice buttons if it's choosing phase AND player's turn AND no choice made yet
  // Also show if game is active but phase might not be set correctly (fallback)
  const showChoiceButtons = (gamePhase === 'choosing' || gamePhase === 'active' || gamePhase === 'waiting') && 
                           isMyTurn && !playerChoice && onChoiceSelect
  
  // Debug log removed to reduce console spam
  
  // Show power bar if choice is made or in active phase
  const showPowerBar = gamePhase === 'round_active' || playerChoice
  
  // Always show the power display area when in game
  if (!showChoiceButtons && !showPowerBar && gamePhase !== 'choosing' && gamePhase !== 'active' && gamePhase !== 'waiting') {
    return null
  }

  const containerStyle = isMobile ? {
    background: 'rgba(0, 0, 0, 0.3)',
    padding: '1rem',
    borderRadius: '0.75rem',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    width: '100%'
  } : {
    background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.9) 0%, rgba(25, 20, 0, 0.8) 100%)',
    padding: '1.5rem',
    borderRadius: '1rem',
    border: `2px solid #FFD700`,
    backdropFilter: 'blur(10px)',
    maxWidth: '550px',
    margin: '0 auto',
    boxShadow: '0 0 20px rgba(255, 215, 0, 0.3), inset 0 0 20px rgba(255, 215, 0, 0.1)'
  }

  const headerStyle = isMobile ? {
    color: theme.colors.neonYellow,
    fontSize: '1rem',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: '1rem'
  } : {
    color: '#FFD700',
    fontSize: '1.1rem',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: '1.2rem',
    textShadow: '0 0 10px rgba(255, 215, 0, 0.5)',
    letterSpacing: '1px'
  }

  const choiceButtonStyle = isMobile ? {
    width: '100%',
    padding: '1rem',
    fontSize: '1rem',
    minHeight: '50px'
  } : {
    flex: 1,
    padding: '1.5rem',
    fontSize: '1.2rem'
  }

  return (
    <div style={containerStyle}>
      {/* Power Display Header - Always Show */}
      <div style={headerStyle}>
        ⚡ POWER LEVEL ⚡
      </div>
      
      {/* Choice Buttons - Show during choosing phase */}
      {showChoiceButtons && (
        <div style={{ marginBottom: isMobile ? '1rem' : '1.5rem' }}>
          <div style={{
            color: isMobile ? theme.colors.neonYellow : '#FFD700',
            fontSize: isMobile ? '0.9rem' : '1rem',
            fontWeight: 'bold',
            marginBottom: isMobile ? '0.75rem' : '1rem',
            textAlign: 'center'
          }}>
            🎯 CHOOSE YOUR SIDE
          </div>
          
          <div style={{ 
            display: 'flex', 
            gap: isMobile ? '0.75rem' : '1rem',
            flexDirection: isMobile ? 'column' : 'row'
          }}>
            <button
              onClick={() => {
                console.log('🎯 HEADS clicked by:', currentPlayer, 'gamePhase:', gamePhase)
                if (onChoiceSelect) {
                  onChoiceSelect('heads')
                } else {
                  console.error('❌ onChoiceSelect is null!')
                }
              }}
              style={{
                ...choiceButtonStyle,
                background: 'linear-gradient(45deg, #00FF41, #00CC33)',
                border: '2px solid rgba(255, 255, 255, 0.2)',
                borderRadius: isMobile ? '0.75rem' : '1rem',
                color: '#000000',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 0 20px rgba(0, 255, 65, 0.5)',
                textShadow: '0 0 10px rgba(255, 255, 255, 0.5)',
                position: 'relative',
                overflow: 'hidden',
                animation: 'colorPulse 2s ease infinite'
              }}
            >
              HEADS
            </button>
            
            <button
              onClick={() => {
                console.log('🎯 TAILS clicked by:', currentPlayer, 'gamePhase:', gamePhase)
                if (onChoiceSelect) {
                  onChoiceSelect('tails')
                } else {
                  console.error('❌ onChoiceSelect is null!')
                }
              }}
              style={{
                ...choiceButtonStyle,
                background: '#FF1493',
                border: '2px solid rgba(255, 255, 255, 0.2)',
                borderRadius: isMobile ? '0.75rem' : '1rem',
                color: 'white',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 0 20px rgba(255, 20, 147, 0.5)',
                textShadow: '0 0 10px rgba(255, 255, 255, 0.5)',
                position: 'relative',
                overflow: 'hidden',
                animation: 'colorPulse 2s ease infinite'
              }}
            >
              TAILS
            </button>
          </div>
        </div>
      )}

      {/* Single Power Bar - Show after choice is made or always show structure */}
      {(showPowerBar || !showChoiceButtons) && (
        <div>
          {/* Single Combined Power Bar */}
          <div style={{ marginBottom: isMobile ? '1rem' : '1.2rem' }}>
            <div style={{
              color: isMobile ? theme.colors.neonYellow : '#FFD700',
              fontSize: isMobile ? '0.85rem' : '0.95rem',
              fontWeight: 'bold',
              marginBottom: isMobile ? '0.5rem' : '0.6rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span>Total Power</span>
              <span style={{ 
                color: isMobile ? theme.colors.neonYellow : '#FFD700',
                textShadow: isMobile ? 'none' : '0 0 5px rgba(255, 215, 0, 0.8)' 
              }}>
                {totalPower.toFixed(1)}/10
              </span>
            </div>
            
            <div style={{
              height: isMobile ? '16px' : '24px',
              background: 'linear-gradient(90deg, rgba(0, 0, 0, 0.8) 0%, rgba(40, 30, 0, 0.6) 100%)',
              borderRadius: isMobile ? '8px' : '12px',
              overflow: 'hidden',
              border: isMobile ? '2px solid #FFD700' : '3px solid #FFD700',
              position: 'relative',
              boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.5)'
            }}>
              <div style={{
                height: '100%',
                width: `${(totalPower / maxTotalPower) * 100}%`,
                background: chargingPlayer ? 
                  `linear-gradient(90deg, #FFD700 0%, #FFA500 30%, #FF6B00 60%, #FF1493 100%)` :
                  `linear-gradient(90deg, #FFD700 0%, #FFA500 50%, #FF6B00 100%)`,
                borderRadius: isMobile ? '6px' : '9px',
                transition: 'width 0.15s ease-out',
                backgroundSize: '200% 100%',
                animation: chargingPlayer ? 'powerCharge 0.6s linear infinite' : 'none',
                boxShadow: chargingPlayer ? 
                  '0 0 15px rgba(255, 215, 0, 0.8), inset 0 0 10px rgba(255, 255, 255, 0.3)' :
                  '0 0 8px rgba(255, 215, 0, 0.6)'
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
                padding: '0 0.5rem'
              }}>
                {[2, 4, 6, 8].map(level => (
                  <div key={level} style={{
                    width: '2px',
                    height: '70%',
                    background: 'rgba(255, 255, 255, 0.4)',
                    opacity: totalPower >= level ? 1 : 0.3
                  }} />
                ))}
              </div>
            </div>
          </div>

          {/* Charging Indicator */}
          {chargingPlayer && (
            <div style={{
              padding: isMobile ? '0.5rem' : '0.6rem',
              background: 'linear-gradient(90deg, rgba(255, 215, 0, 0.2) 0%, rgba(255, 165, 0, 0.1) 100%)',
              border: '1px solid rgba(255, 215, 0, 0.5)',
              borderRadius: isMobile ? '0.5rem' : '0.75rem',
              textAlign: 'center'
            }}>
              <div style={{
                color: isMobile ? theme.colors.neonYellow : '#FFD700',
                fontSize: isMobile ? '0.8rem' : '0.9rem',
                fontWeight: 'bold',
                animation: 'powerPulse 0.4s ease-in-out infinite',
                textShadow: isMobile ? 'none' : '0 0 10px rgba(255, 215, 0, 0.8)'
              }}>
                ⚡ {chargingPlayer === creator ? 'PLAYER 1' : 'PLAYER 2'} CHARGING ⚡
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default PowerDisplay 