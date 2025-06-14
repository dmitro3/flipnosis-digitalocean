import React from 'react'
import { useNavigate } from 'react-router-dom'
import { theme } from '../styles/theme'

const GameResultPopup = ({ 
  isVisible, 
  isWinner, 
  flipResult, 
  playerChoice,
  onClose,
  onClaimWinnings,
  gameData = null
}) => {
  const navigate = useNavigate()

  if (!isVisible) return null

  const handleBackToHome = () => {
    navigate('/')
  }

  const handleClaimWinnings = () => {
    if (onClaimWinnings) {
      onClaimWinnings()
    }
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.85)',
      backdropFilter: 'blur(10px)',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      animation: 'fadeIn 0.3s ease-in-out'
    }}>
      {/* Winner Popup */}
      {isWinner && (
        <div style={{
          position: 'relative',
          width: '494px',
          height: '826px',
          borderRadius: '2rem',
          overflow: 'hidden',
          boxShadow: `0 0 50px ${theme.colors.statusSuccess}, 0 0 100px rgba(0, 255, 65, 0.3)`
        }}>
          <video
            autoPlay
            loop
            muted
            playsInline
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
            src="/Images/Video/End/endwin.webm"
          />
          
          {/* Warning Message */}
          <div style={{
            position: 'absolute',
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(255, 0, 0, 0.8)',
            padding: '10px 20px',
            borderRadius: '10px',
            color: 'white',
            fontWeight: 'bold',
            textAlign: 'center',
            width: '80%',
            animation: 'pulse 2s infinite'
          }}>
            WARNING: If you leave, you will lose your winnings!
          </div>

          {/* Claim Button */}
          <button
            onClick={handleClaimWinnings}
            style={{
              position: 'absolute',
              bottom: '80px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: theme.colors.statusSuccess,
              color: 'white',
              border: 'none',
              padding: '15px 30px',
              borderRadius: '10px',
              fontSize: '1.2rem',
              fontWeight: 'bold',
              cursor: 'pointer',
              boxShadow: '0 0 20px rgba(0, 255, 65, 0.5)',
              transition: 'all 0.3s ease'
            }}
            onMouseOver={(e) => {
              e.target.style.transform = 'translateX(-50%) scale(1.05)'
              e.target.style.boxShadow = '0 0 30px rgba(0, 255, 65, 0.7)'
            }}
            onMouseOut={(e) => {
              e.target.style.transform = 'translateX(-50%)'
              e.target.style.boxShadow = '0 0 20px rgba(0, 255, 65, 0.5)'
            }}
          >
            CLAIM WINNINGS
          </button>
        </div>
      )}

      {/* Loser Popup */}
      {!isWinner && (
        <div style={{
          position: 'relative',
          width: '494px',
          height: '826px',
          borderRadius: '2rem',
          overflow: 'hidden',
          boxShadow: `0 0 50px ${theme.colors.statusError}, 0 0 100px rgba(255, 20, 147, 0.3)`
        }}>
          <video
            autoPlay
            loop
            muted
            playsInline
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
            src="/Images/Video/End/endlose.webm"
          />

          {/* Try Again Button */}
          <button
            onClick={handleBackToHome}
            style={{
              position: 'absolute',
              bottom: '40px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: theme.colors.statusError,
              color: 'white',
              border: 'none',
              padding: '15px 30px',
              borderRadius: '10px',
              fontSize: '1.2rem',
              fontWeight: 'bold',
              cursor: 'pointer',
              boxShadow: '0 0 20px rgba(255, 20, 147, 0.5)',
              transition: 'all 0.3s ease'
            }}
            onMouseOver={(e) => {
              e.target.style.transform = 'translateX(-50%) scale(1.05)'
              e.target.style.boxShadow = '0 0 30px rgba(255, 20, 147, 0.7)'
            }}
            onMouseOut={(e) => {
              e.target.style.transform = 'translateX(-50%)'
              e.target.style.boxShadow = '0 0 20px rgba(255, 20, 147, 0.5)'
            }}
          >
            TRY AGAIN
          </button>
        </div>
      )}
    </div>
  )
}

export default GameResultPopup 