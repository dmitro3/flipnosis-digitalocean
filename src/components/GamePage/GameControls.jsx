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
                background: 'linear-gradient(45deg, #00FF41, #0080FF, #00FF41)',
                backgroundSize: '200% 200%',
                border: '3px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '1rem',
                color: '#000000',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 0 30px rgba(0, 255, 65, 0.7), 0 0 60px rgba(0, 128, 255, 0.5)',
                textShadow: '0 0 10px rgba(255, 255, 255, 0.8)',
                position: 'relative',
                overflow: 'hidden',
                animation: 'gradientShift 2s ease infinite, glowPulse 1.5s ease-in-out infinite',
                minWidth: '150px'
              }}
            >
              <span style={{
                position: 'relative',
                zIndex: 2,
                display: 'block',
                width: '100%',
                height: '100%'
              }}>
                HEADS
              </span>
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.2) 50%, transparent 70%)',
                animation: 'shimmer 2s ease-in-out infinite',
                zIndex: 1
              }} />
            </button>
            
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
                background: 'linear-gradient(45deg, #FF1493, #FF6B35, #FF1493)',
                backgroundSize: '200% 200%',
                border: '3px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '1rem',
                color: 'white',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 0 30px rgba(255, 20, 147, 0.7), 0 0 60px rgba(255, 107, 53, 0.5)',
                textShadow: '0 0 10px rgba(255, 255, 255, 0.8)',
                position: 'relative',
                overflow: 'hidden',
                animation: 'gradientShift 2s ease infinite, glowPulse 1.5s ease-in-out infinite',
                minWidth: '150px'
              }}
            >
              <span style={{
                position: 'relative',
                zIndex: 2,
                display: 'block',
                width: '100%',
                height: '100%'
              }}>
                TAILS
              </span>
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.2) 50%, transparent 70%)',
                animation: 'shimmer 2s ease-in-out infinite',
                zIndex: 1
              }} />
            </button>
          </div>
        </div>
      )}
    </>
  )
}

export default GameControls 