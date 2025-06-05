import React from 'react'
import { theme } from '../styles/theme'

const GoldGameInstructions = ({ 
  isPlayerTurn, 
  gamePhase, 
  isPlayer, 
  playerNumber, 
  spectatorMode,
  currentPower = 0 
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
          Watch players charge their power and flip the golden coin!<br />
          Higher power = More dramatic flip with longer duration.
        </p>
      </div>
    )
  }

  if (gamePhase !== 'round_active') return null
  
  if (!isPlayer) {
    return (
      <div style={{
        marginTop: '2rem',
        textAlign: 'center',
        padding: '1.5rem',
        background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.1) 0%, rgba(0, 0, 0, 0.3) 100%)',
        border: '2px solid rgba(255, 215, 0, 0.3)',
        borderRadius: '1rem'
      }}>
        <p style={{ 
          color: 'rgba(255, 215, 0, 0.8)',
          fontSize: '1rem'
        }}>
          🏛️ Watch the golden battle unfold!
        </p>
      </div>
    )
  }

  if (isPlayerTurn) {
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
        
        <p style={{ 
          color: playerNumber === 1 ? theme.colors.neonPink : theme.colors.neonBlue, 
          fontSize: '0.95rem',
          fontWeight: 'bold',
          marginBottom: '0.5rem'
        }}>
          You are {playerNumber === 1 ? 'HEADS 👑' : 'TAILS 💎'}
        </p>
        
        <div style={{
          background: 'rgba(255, 215, 0, 0.1)',
          padding: '0.8rem',
          borderRadius: '0.6rem',
          border: '1px solid rgba(255, 215, 0, 0.3)'
        }}>
          <p style={{ 
            color: 'rgba(255, 215, 0, 0.8)', 
            fontSize: '0.8rem',
            lineHeight: '1.3'
          }}>
            💡 <strong>Pro Tip:</strong> Higher power creates longer, more dramatic flips!<br />
            ⏱️ <strong>Timing:</strong> Build power between 3-8 for optimal results<br />
            🎯 <strong>Strategy:</strong> Quick taps = fast flips, long holds = epic flips
          </p>
        </div>
      </div>
    )
  }

  // Waiting for opponent
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
        Opponent's Golden Turn
      </p>
      
      <p style={{ 
        color: 'rgba(255, 215, 0, 0.7)',
        fontSize: '0.9rem',
        lineHeight: '1.3'
      }}>
        They are charging power for their flip...<br />
        You are {playerNumber === 1 ? 'HEADS 👑' : 'TAILS 💎'}
      </p>
      
      <div style={{
        marginTop: '1rem',
        padding: '0.6rem',
        background: 'rgba(255, 215, 0, 0.1)',
        borderRadius: '0.5rem',
        border: '1px solid rgba(255, 215, 0, 0.2)'
      }}>
        <p style={{
          color: 'rgba(255, 215, 0, 0.8)',
          fontSize: '0.75rem'
        }}>
          💫 Get ready for your next turn!
        </p>
      </div>
    </div>
  )
}

export default GoldGameInstructions 