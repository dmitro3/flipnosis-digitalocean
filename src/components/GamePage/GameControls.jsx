import React from 'react'
import styled from '@emotion/styled'

const GameControls = ({
  gameData,
  gameState,
  playerChoices,
  isMyTurn,
  isCreator,
  isJoiner,
  onPlayerChoice,
  onAutoFlip
}) => {
  return (
    <>
      {/* Game Phase Messages */}
      {gameState.phase === 'choosing' && gameState.currentRound === 5 && (
        <div style={{
          textAlign: 'center',
          marginBottom: '1rem',
          padding: '1rem',
          background: 'rgba(255, 20, 147, 0.1)',
          border: '1px solid rgba(255, 20, 147, 0.3)',
          borderRadius: '0.75rem'
        }}>
          <p style={{ color: '#FF1493', margin: 0 }}>
            🎲 FINAL ROUND - Auto-flip for fairness! 🎲
          </p>
        </div>
      )}
      
      {gameState.phase === 'charging' && (
        <div style={{
          textAlign: 'center',
          marginBottom: '1rem',
          padding: '1rem',
          background: 'rgba(0, 255, 65, 0.1)',
          border: '1px solid rgba(0, 255, 65, 0.3)',
          borderRadius: '0.75rem'
        }}>
          <p style={{ color: '#00FF41', margin: 0 }}>
            Both players ready! Hold the coin to charge power!
          </p>
        </div>
      )}
      
      {/* Choice Buttons - Show when game is active and it's player's turn */}
      {gameData?.creator_deposited && gameData?.challenger_deposited && gameData?.status === 'active' && 
       (gameState.phase === 'choosing' || gameState.phase === 'active' || gameState.phase === 'waiting') && 
       isMyTurn() && !(isCreator() ? gameState.creatorChoice : gameState.joinerChoice) && 
       !(isCreator() ? playerChoices.creator : playerChoices.joiner) && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(0, 20, 40, 0.95) 0%, rgba(0, 100, 120, 0.9) 100%)',
          padding: '2rem',
          borderRadius: '1rem',
          border: '2px solid #FFD700',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 0 30px rgba(0, 100, 120, 0.4), inset 0 0 20px rgba(255, 215, 0, 0.1)',
          marginBottom: '2rem',
          textAlign: 'center'
        }}>
          <h3 style={{ 
            color: '#FFD700', 
            marginBottom: '1.5rem', 
            fontSize: '1.3rem',
            textShadow: '0 0 10px rgba(255, 215, 0, 0.5)'
          }}>
            🎯 CHOOSE YOUR SIDE
          </h3>
          
          <div style={{
            display: 'flex',
            gap: '2rem',
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
            {/* HEADS Button */}
            <button
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                onPlayerChoice('heads')
              }}
              onMouseDown={(e) => {
                e.preventDefault()
                if (navigator.vibrate) {
                  navigator.vibrate(50)
                }
              }}
              style={{
                padding: '1.5rem 3rem',
                fontSize: '1.5rem',
                background: 'linear-gradient(135deg, #00FF41 0%, #00CC33 25%, #009926 50%, #006619 75%, #00330C 100%)',
                border: '3px solid #00FF41',
                borderRadius: '1.25rem',
                color: '#FFFFFF',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: `
                  0 0 20px rgba(0, 255, 65, 0.6),
                  0 0 40px rgba(0, 255, 65, 0.4),
                  0 0 60px rgba(0, 255, 65, 0.2),
                  inset 0 1px 0 rgba(255, 255, 255, 0.3),
                  inset 0 -1px 0 rgba(0, 0, 0, 0.2)
                `,
                textShadow: '0 2px 4px rgba(0, 0, 0, 0.8)',
                position: 'relative',
                overflow: 'hidden',
                transform: 'translateY(0)',
                animation: 'headsGlow 2s ease-in-out infinite',
                minWidth: '150px'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px) scale(1.02)'
                e.target.style.boxShadow = `
                  0 0 30px rgba(0, 255, 65, 0.8),
                  0 0 60px rgba(0, 255, 65, 0.6),
                  0 0 90px rgba(0, 255, 65, 0.4),
                  inset 0 1px 0 rgba(255, 255, 255, 0.4),
                  inset 0 -1px 0 rgba(0, 0, 0, 0.3)
                `
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0) scale(1)'
                e.target.style.boxShadow = `
                  0 0 20px rgba(0, 255, 65, 0.6),
                  0 0 40px rgba(0, 255, 65, 0.4),
                  0 0 60px rgba(0, 255, 65, 0.2),
                  inset 0 1px 0 rgba(255, 255, 255, 0.3),
                  inset 0 -1px 0 rgba(0, 0, 0, 0.2)
                `
              }}
            >
              <span style={{
                position: 'relative',
                zIndex: 2,
                display: 'block',
                width: '100%',
                height: '100%',
                letterSpacing: '1px'
              }}>
                🪙 HEADS
              </span>
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.3) 50%, transparent 70%)',
                animation: 'headsShimmer 3s ease-in-out infinite',
                zIndex: 1
              }} />
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '60%',
                height: '60%',
                background: 'radial-gradient(circle, rgba(0, 255, 65, 0.2) 0%, transparent 70%)',
                borderRadius: '50%',
                animation: 'headsPulse 2s ease-in-out infinite',
                zIndex: 0
              }} />
            </button>
            
            {/* TAILS Button */}
            <button
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                onPlayerChoice('tails')
              }}
              onMouseDown={(e) => {
                e.preventDefault()
                if (navigator.vibrate) {
                  navigator.vibrate(50)
                }
              }}
              style={{
                padding: '1.5rem 3rem',
                fontSize: '1.5rem',
                background: 'linear-gradient(135deg, #FF1493 0%, #CC1175 25%, #990E57 50%, #660B39 75%, #33081C 100%)',
                border: '3px solid #FF1493',
                borderRadius: '1.25rem',
                color: '#FFFFFF',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: `
                  0 0 20px rgba(255, 20, 147, 0.6),
                  0 0 40px rgba(255, 20, 147, 0.4),
                  0 0 60px rgba(255, 20, 147, 0.2),
                  inset 0 1px 0 rgba(255, 255, 255, 0.3),
                  inset 0 -1px 0 rgba(0, 0, 0, 0.2)
                `,
                textShadow: '0 2px 4px rgba(0, 0, 0, 0.8)',
                position: 'relative',
                overflow: 'hidden',
                transform: 'translateY(0)',
                animation: 'tailsGlow 2s ease-in-out infinite',
                minWidth: '150px'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px) scale(1.02)'
                e.target.style.boxShadow = `
                  0 0 30px rgba(255, 20, 147, 0.8),
                  0 0 60px rgba(255, 20, 147, 0.6),
                  0 0 90px rgba(255, 20, 147, 0.4),
                  inset 0 1px 0 rgba(255, 255, 255, 0.4),
                  inset 0 -1px 0 rgba(0, 0, 0, 0.3)
                `
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0) scale(1)'
                e.target.style.boxShadow = `
                  0 0 20px rgba(255, 20, 147, 0.6),
                  0 0 40px rgba(255, 20, 147, 0.4),
                  0 0 60px rgba(255, 20, 147, 0.2),
                  inset 0 1px 0 rgba(255, 255, 255, 0.3),
                  inset 0 -1px 0 rgba(0, 0, 0, 0.2)
                `
              }}
            >
              <span style={{
                position: 'relative',
                zIndex: 2,
                display: 'block',
                width: '100%',
                height: '100%',
                letterSpacing: '1px'
              }}>
                🪙 TAILS
              </span>
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.3) 50%, transparent 70%)',
                animation: 'tailsShimmer 3s ease-in-out infinite',
                zIndex: 1
              }} />
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '60%',
                height: '60%',
                background: 'radial-gradient(circle, rgba(255, 20, 147, 0.2) 0%, transparent 70%)',
                borderRadius: '50%',
                animation: 'tailsPulse 2s ease-in-out infinite',
                zIndex: 0
              }} />
            </button>
          </div>
          
          {/* Add CSS animations */}
          <style>{`
            @keyframes headsGlow {
              0%, 100% { box-shadow: 0 0 20px rgba(0, 255, 65, 0.6), 0 0 40px rgba(0, 255, 65, 0.4), 0 0 60px rgba(0, 255, 65, 0.2); }
              50% { box-shadow: 0 0 30px rgba(0, 255, 65, 0.8), 0 0 60px rgba(0, 255, 65, 0.6), 0 0 90px rgba(0, 255, 65, 0.4); }
            }
            @keyframes tailsGlow {
              0%, 100% { box-shadow: 0 0 20px rgba(255, 20, 147, 0.6), 0 0 40px rgba(255, 20, 147, 0.4), 0 0 60px rgba(255, 20, 147, 0.2); }
              50% { box-shadow: 0 0 30px rgba(255, 20, 147, 0.8), 0 0 60px rgba(255, 20, 147, 0.6), 0 0 90px rgba(255, 20, 147, 0.4); }
            }
            @keyframes headsShimmer {
              0% { transform: translateX(-100%); }
              100% { transform: translateX(100%); }
            }
            @keyframes tailsShimmer {
              0% { transform: translateX(-100%); }
              100% { transform: translateX(100%); }
            }
            @keyframes headsPulse {
              0%, 100% { opacity: 0.3; transform: translate(-50%, -50%) scale(1); }
              50% { opacity: 0.6; transform: translate(-50%, -50%) scale(1.1); }
            }
            @keyframes tailsPulse {
              0%, 100% { opacity: 0.3; transform: translate(-50%, -50%) scale(1); }
              50% { opacity: 0.6; transform: translate(-50%, -50%) scale(1.1); }
            }
          `}</style>
        </div>
      )}
    </>
  )
}

export default GameControls 