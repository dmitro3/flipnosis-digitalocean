import React from 'react'
import { theme } from '../styles/theme'

const GoldGameInstructions = ({ 
  isPlayerTurn, 
  gamePhase, 
  isPlayer, 
  playerNumber, 
  spectatorMode,
  currentPower = 0,
  playerChoice = null
}) => {
  if (spectatorMode) {
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
        <div style={{
          fontSize: '1.5rem',
          marginBottom: '0.5rem'
        }}>
          👀
        </div>
        <p style={{ 
          color: '#FFD700', 
          marginBottom: '1rem', 
          fontWeight: 'bold',
          fontSize: '1.2rem',
          textShadow: '0 0 10px rgba(255, 215, 0, 0.5)'
        }}>
          SPECTATING GOLD FLIP
        </p>
        <p style={{ 
          color: 'rgba(255, 215, 0, 0.8)', 
          fontSize: '0.9rem',
          lineHeight: '1.4'
        }}>
          Watch players choose their side, charge power, and flip the golden coin!
        </p>
      </div>
    )
  }

  if (gamePhase === 'choosing' && isPlayerTurn) {
    return (
      <div style={{
        marginTop: '2rem',
        textAlign: 'center',
        padding: '2rem',
        background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.2) 0%, rgba(255, 165, 0, 0.1) 50%, rgba(0, 0, 0, 0.4) 100%)',
        border: '3px solid #FFD700',
        borderRadius: '1rem',
        boxShadow: '0 0 30px rgba(255, 215, 0, 0.3), inset 0 0 20px rgba(255, 215, 0, 0.1)',
        animation: 'goldContainerGlow 2s ease-in-out infinite'
      }}>
        <div style={{
          fontSize: '2rem',
          marginBottom: '1rem'
        }}>
          🎯
        </div>
        
        <p style={{ 
          color: '#FFD700', 
          marginBottom: '1rem', 
          fontWeight: 'bold',
          fontSize: '1.3rem',
          textShadow: '0 0 15px rgba(255, 215, 0, 0.8)'
        }}>
          CHOOSE YOUR SIDE!
        </p>
        
        <div style={{
          background: 'rgba(0, 0, 0, 0.3)',
          padding: '1rem',
          borderRadius: '0.8rem',
          marginBottom: '1rem',
          border: '1px solid rgba(255, 215, 0, 0.3)'
        }}>
          <p style={{ 
            color: 'rgba(255, 215, 0, 0.9)', 
            fontSize: '0.95rem',
            lineHeight: '1.4'
          }}>
            <strong>🎯 FIRST:</strong> Choose heads 👑 or tails 💎 in your player box<br />
            <strong>⚡ THEN:</strong> Hold the coin to charge power and flip!
          </p>
        </div>
        
        <p style={{ 
          color: playerNumber === 1 ? theme.colors.neonPink : theme.colors.neonBlue, 
          fontSize: '0.95rem',
          fontWeight: 'bold'
        }}>
          You are Player {playerNumber}
        </p>
      </div>
    )
  }

  if (gamePhase === 'round_active' && isPlayerTurn) {
    return (
      <div style={{
        marginTop: '2rem',
        textAlign: 'center',
        padding: '2rem',
        background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.2) 0%, rgba(255, 165, 0, 0.1) 50%, rgba(0, 0, 0, 0.4) 100%)',
        border: '3px solid #FFD700',
        borderRadius: '1rem',
        boxShadow: '0 0 30px rgba(255, 215, 0, 0.3), inset 0 0 20px rgba(255, 215, 0, 0.1)',
        animation: 'goldContainerGlow 2s ease-in-out infinite'
      }}>
        <div style={{
          fontSize: '2rem',
          marginBottom: '1rem',
          animation: 'goldSparkle 1s ease-in-out infinite'
        }}>
          ⚡
        </div>
        
        <p style={{ 
          color: '#FFD700', 
          marginBottom: '1rem', 
          fontWeight: 'bold',
          fontSize: '1.3rem',
          textShadow: '0 0 15px rgba(255, 215, 0, 0.8)'
        }}>
          YOUR GOLDEN TURN!
        </p>
        
        <div style={{
          background: 'rgba(0, 255, 65, 0.2)',
          padding: '0.75rem',
          borderRadius: '0.6rem',
          marginBottom: '1rem',
          border: '1px solid rgba(0, 255, 65, 0.4)'
        }}>
          <p style={{ 
            color: '#00FF41', 
            fontSize: '1rem',
            fontWeight: 'bold',
            margin: 0
          }}>
            ✅ You chose: {playerChoice?.toUpperCase()} {playerChoice === 'heads' ? '👑' : '💎'}
          </p>
        </div>
        
        <div style={{
          background: 'rgba(0, 0, 0, 0.3)',
          padding: '1rem',
          borderRadius: '0.8rem',
          marginBottom: '1rem',
          border: '1px solid rgba(255, 215, 0, 0.3)'
        }}>
          <p style={{ 
            color: 'rgba(255, 215, 0, 0.9)', 
            fontSize: '0.95rem',
            marginBottom: '0.5rem',
            lineHeight: '1.4'
          }}>
            <strong>🪙 HOLD</strong> the golden coin to charge power<br />
            <strong>🚀 RELEASE</strong> to flip with accumulated force
          </p>
          
          {currentPower > 0 && (
            <div style={{
              marginTop: '0.8rem',
              padding: '0.5rem',
              background: 'linear-gradient(90deg, rgba(255, 215, 0, 0.2) 0%, rgba(255, 165, 0, 0.1) 100%)',
              borderRadius: '0.5rem',
              border: '1px solid rgba(255, 215, 0, 0.4)'
            }}>
              <div style={{
                color: '#FFD700',
                fontWeight: 'bold',
                fontSize: '0.9rem',
                textShadow: '0 0 8px rgba(255, 215, 0, 0.6)'
              }}>
                ⚡ Current Power: {currentPower.toFixed(1)}/10
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Waiting states
  if (gamePhase === 'choosing' || gamePhase === 'round_active') {
    return (
      <div style={{
        marginTop: '2rem',
        textAlign: 'center',
        padding: '1.5rem',
        background: 'linear-gradient(135deg, rgba(255, 165, 0, 0.1) 0%, rgba(0, 0, 0, 0.3) 100%)',
        border: '2px solid rgba(255, 165, 0, 0.4)',
        borderRadius: '1rem',
        backdropFilter: 'blur(10px)'
      }}>
        <div style={{
          fontSize: '1.5rem',
          marginBottom: '1rem',
          animation: 'goldWaiting 2s ease-in-out infinite'
        }}>
          ⏳
        </div>
        
        <p style={{ 
          color: 'rgba(255, 165, 0, 0.9)',
          fontSize: '1.1rem',
          fontWeight: 'bold',
          marginBottom: '0.5rem'
        }}>
          {gamePhase === 'choosing' ? "Opponent is Choosing" : "Opponent's Golden Turn"}
        </p>
        
        <p style={{ 
          color: 'rgba(255, 215, 0, 0.7)',
          fontSize: '0.9rem',
          lineHeight: '1.3'
        }}>
          {gamePhase === 'choosing' 
            ? "They are choosing heads or tails..." 
            : "They are charging power for their flip..."
          }<br />
          You are Player {playerNumber} {playerChoice ? `(${playerChoice.toUpperCase()} ${playerChoice === 'heads' ? '👑' : '💎'})` : ''}
        </p>
      </div>
    )
  }

  return null
}

export default GoldGameInstructions 