import React, { useMemo } from 'react'
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
  onPlayerChoice = null,
  address = null
}) => {
  // Calculate total power for single bar
  const totalPower = creatorPower + joinerPower
  const maxTotalPower = 20 // 10 + 10
  
  // Show choice buttons if it's choosing phase and player's turn
  const showChoiceButtons = useMemo(() => {
    console.log('🎯 Computing showChoiceButtons:', {
      gamePhase,
      isMyTurn,
      playerChoice,
      currentPlayer,
      address
    })
    return gamePhase === 'choosing' && isMyTurn && !playerChoice
  }, [gamePhase, isMyTurn, playerChoice, currentPlayer, address])

  const showPowerControls = useMemo(() => {
    console.log('🎯 Computing showPowerControls:', {
      gamePhase,
      isMyTurn,
      playerChoice,
      currentPlayer,
      address
    })
    return gamePhase === 'round_active' && isMyTurn && playerChoice
  }, [gamePhase, isMyTurn, playerChoice, currentPlayer, address])

  const showWaitingMessage = useMemo(() => {
    console.log('🎯 Computing showWaitingMessage:', {
      gamePhase,
      isMyTurn,
      playerChoice,
      currentPlayer,
      address
    })
    return (gamePhase === 'choosing' && !isMyTurn) || 
           (gamePhase === 'round_active' && !isMyTurn)
  }, [gamePhase, isMyTurn, playerChoice, currentPlayer, address])
  
  // Add detailed debug logging in PowerDisplay
  console.log('🎯 PowerDisplay props:', {
    gamePhase,
    isMyTurn,
    playerChoice,
    currentPlayer,
    creator,
    joiner,
    chargingPlayer,
    hasOnPlayerChoice: !!onPlayerChoice
  })
  
  console.log('🎯 PowerDisplay computed:', {
    showChoiceButtons,
    totalPower,
    maxTotalPower
  })
  
  // Show power bar if choice is made or in active phase
  const showPowerBar = gamePhase === 'round_active' || playerChoice
  
  // Always show the power display area
  if (!showChoiceButtons && !showPowerBar && gamePhase !== 'choosing') {
    return null
  }

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.9) 0%, rgba(25, 20, 0, 0.8) 100%)',
      padding: '1.5rem',
      borderRadius: '1rem',
      border: `2px solid #FFD700`,
      backdropFilter: 'blur(10px)',
      maxWidth: '550px',
      margin: '0 auto',
      boxShadow: '0 0 20px rgba(255, 215, 0, 0.3), inset 0 0 20px rgba(255, 215, 0, 0.1)'
    }}>
      {/* Power Display Header - Always Show */}
      <div style={{
        color: '#FFD700',
        fontSize: '1.1rem',
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: '1.2rem',
        textShadow: '0 0 10px rgba(255, 215, 0, 0.5)',
        letterSpacing: '1px'
      }}>
        ⚡ POWER LEVEL ⚡
      </div>
      
      {/* Choice Buttons - Show during choosing phase */}
      {showChoiceButtons && (
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{
            color: '#FFD700',
            fontSize: '1rem',
            fontWeight: 'bold',
            marginBottom: '1rem',
            textAlign: 'center'
          }}>
            🎯 CHOOSE YOUR SIDE
          </div>
          
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              onClick={() => {
                console.log('🎯 Heads button clicked')
                console.log('Current state:', { gamePhase, isMyTurn, playerChoice })
                onPlayerChoice('heads')
              }}
              style={{
                flex: 1,
                padding: '1rem',
                background: `linear-gradient(45deg, ${theme.colors.neonPink}, ${theme.colors.neonPurple})`,
                border: `2px solid ${theme.colors.neonPink}`,
                borderRadius: '0.75rem',
                color: 'white',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontSize: '1rem',
                transition: 'all 0.3s ease',
                boxShadow: '0 0 15px rgba(255, 20, 147, 0.3)'
              }}
            >
              👑 HEADS
            </button>
            
            <button
              onClick={() => {
                console.log('🎯 Tails button clicked')
                console.log('Current state:', { gamePhase, isMyTurn, playerChoice })
                onPlayerChoice('tails')
              }}
              style={{
                flex: 1,
                padding: '1rem',
                background: `linear-gradient(45deg, ${theme.colors.neonBlue}, ${theme.colors.neonGreen})`,
                border: `2px solid ${theme.colors.neonBlue}`,
                borderRadius: '0.75rem',
                color: 'white',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontSize: '1rem',
                transition: 'all 0.3s ease',
                boxShadow: '0 0 15px rgba(0, 191, 255, 0.3)'
              }}
            >
              💎 TAILS
            </button>
          </div>
        </div>
      )}

      {/* Single Power Bar - Show after choice is made or always show structure */}
      {(showPowerBar || !showChoiceButtons) && (
        <div>
          {/* Single Combined Power Bar */}
          <div style={{ marginBottom: '1.2rem' }}>
            <div style={{
              color: '#FFD700',
              fontSize: '0.95rem',
              fontWeight: 'bold',
              marginBottom: '0.6rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span>Total Power</span>
              <span style={{ 
                color: '#FFD700',
                textShadow: '0 0 5px rgba(255, 215, 0, 0.8)' 
              }}>
                {totalPower.toFixed(1)}/20
              </span>
            </div>
            
            <div style={{
              height: '24px',
              background: 'linear-gradient(90deg, rgba(0, 0, 0, 0.8) 0%, rgba(40, 30, 0, 0.6) 100%)',
              borderRadius: '12px',
              overflow: 'hidden',
              border: `3px solid #FFD700`,
              position: 'relative',
              boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.5)'
            }}>
              <div style={{
                height: '100%',
                width: `${(totalPower / maxTotalPower) * 100}%`,
                background: chargingPlayer ? 
                  `linear-gradient(90deg, #FFD700 0%, #FFA500 30%, #FF6B00 60%, #FF1493 100%)` :
                  `linear-gradient(90deg, #FFD700 0%, #FFA500 50%, #FF6B00 100%)`,
                borderRadius: '9px',
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
                {[4, 8, 12, 16].map(level => (
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