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
          background: 'linear-gradient(135deg, rgba(0, 255, 65, 0.95) 0%, rgba(0, 200, 50, 0.9) 100%)',
          border: `4px solid ${theme.colors.statusSuccess}`,
          borderRadius: '2rem',
          padding: '4rem 3rem',
          textAlign: 'center',
          maxWidth: '500px',
          boxShadow: `0 0 50px ${theme.colors.statusSuccess}, 0 0 100px rgba(0, 255, 65, 0.3)`,
          animation: 'winnerPulse 1s ease-in-out infinite alternate'
        }}>
          {/* Winner Icon */}
          <div style={{
            fontSize: '6rem',
            marginBottom: '1rem',
            animation: 'bounce 1s ease-in-out infinite'
          }}>
            🏆
          </div>
          
          {/* Winner Text */}
          <h1 style={{
            color: 'white',
            fontSize: '3rem',
            fontWeight: 'bold',
            marginBottom: '1rem',
            textShadow: '0 0 20px rgba(255, 255, 255, 0.8)',
            letterSpacing: '2px'
          }}>
            WINNER!
          </h1>
          
          <h2 style={{
            color: 'white',
            fontSize: '1.8rem',
            fontWeight: 'bold',
            marginBottom: '1rem',
            textShadow: '0 0 10px rgba(255, 255, 255, 0.6)'
          }}>
            YOU WON!
          </h2>
          
          {/* Flip Result */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.2)',
            borderRadius: '1rem',
            padding: '1rem',
            marginBottom: '2rem'
          }}>
            <div style={{
              color: 'white',
              fontSize: '1.2rem',
              fontWeight: 'bold',
              marginBottom: '0.5rem'
            }}>
              Coin Result: {flipResult?.toUpperCase()}
            </div>
            <div style={{
              color: 'rgba(255, 255, 255, 0.9)',
              fontSize: '1rem'
            }}>
              You chose: {playerChoice?.toUpperCase()} ✓
            </div>
          </div>
          
          {/* Prize Information */}
          {gameData && (
            <div style={{
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '1rem',
              padding: '1rem',
              marginBottom: '2rem'
            }}>
              <div style={{
                color: 'white',
                fontSize: '1.1rem',
                fontWeight: 'bold',
                marginBottom: '0.5rem'
              }}>
                Your Winnings:
              </div>
              <div style={{
                color: '#FFD700',
                fontSize: '1.3rem',
                fontWeight: 'bold'
              }}>
                {gameData.nft?.name || 'NFT'} + ${gameData.priceUSD?.toFixed(2)} USD
              </div>
            </div>
          )}
          
          {/* Action Buttons */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
          }}>
            <button
              onClick={handleClaimWinnings}
              style={{
                background: 'linear-gradient(45deg, #FFD700, #FFA500)',
                color: '#000',
                border: '3px solid #FFD700',
                borderRadius: '1rem',
                padding: '1rem 2rem',
                fontSize: '1.3rem',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 0 20px rgba(255, 215, 0, 0.5)',
                textTransform: 'uppercase',
                letterSpacing: '1px'
              }}
              onMouseOver={(e) => {
                e.target.style.transform = 'scale(1.05)'
                e.target.style.boxShadow = '0 0 30px rgba(255, 215, 0, 0.8)'
              }}
              onMouseOut={(e) => {
                e.target.style.transform = 'scale(1)'
                e.target.style.boxShadow = '0 0 20px rgba(255, 215, 0, 0.5)'
              }}
            >
              💰 Claim Your Winnings
            </button>
            
            <button
              onClick={handleBackToHome}
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                color: 'white',
                border: '2px solid rgba(255, 255, 255, 0.5)',
                borderRadius: '1rem',
                padding: '0.75rem 1.5rem',
                fontSize: '1rem',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
              onMouseOver={(e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.3)'
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.8)'
              }}
              onMouseOut={(e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.2)'
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.5)'
              }}
            >
              🏠 Back to Home
            </button>
          </div>
        </div>
      )}

      {/* Loser Popup */}
      {!isWinner && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(255, 20, 147, 0.95) 0%, rgba(200, 15, 120, 0.9) 100%)',
          border: `4px solid ${theme.colors.statusError}`,
          borderRadius: '2rem',
          padding: '4rem 3rem',
          textAlign: 'center',
          maxWidth: '500px',
          boxShadow: `0 0 50px ${theme.colors.statusError}, 0 0 100px rgba(255, 20, 147, 0.3)`,
          animation: 'loserShake 0.5s ease-in-out'
        }}>
          {/* Loser Icon */}
          <div style={{
            fontSize: '6rem',
            marginBottom: '1rem'
          }}>
            💔
          </div>
          
          {/* Loser Text */}
          <h1 style={{
            color: 'white',
            fontSize: '3rem',
            fontWeight: 'bold',
            marginBottom: '1rem',
            textShadow: '0 0 20px rgba(255, 255, 255, 0.8)',
            letterSpacing: '2px'
          }}>
            LOSER
          </h1>
          
          <h2 style={{
            color: 'white',
            fontSize: '1.8rem',
            fontWeight: 'bold',
            marginBottom: '1rem',
            textShadow: '0 0 10px rgba(255, 255, 255, 0.6)'
          }}>
            YOU LOST
          </h2>
          
          {/* Flip Result */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.2)',
            borderRadius: '1rem',
            padding: '1rem',
            marginBottom: '2rem'
          }}>
            <div style={{
              color: 'white',
              fontSize: '1.2rem',
              fontWeight: 'bold',
              marginBottom: '0.5rem'
            }}>
              Coin Result: {flipResult?.toUpperCase()}
            </div>
            <div style={{
              color: 'rgba(255, 255, 255, 0.9)',
              fontSize: '1rem'
            }}>
              You chose: {playerChoice?.toUpperCase()} ✗
            </div>
          </div>
          
          {/* Encouragement */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '1rem',
            padding: '1rem',
            marginBottom: '2rem'
          }}>
            <div style={{
              color: 'white',
              fontSize: '1.2rem',
              fontWeight: 'bold',
              marginBottom: '0.5rem'
            }}>
              BAD LUCK!
            </div>
            <div style={{
              color: 'rgba(255, 255, 255, 0.9)',
              fontSize: '1rem'
            }}>
              Better luck next time! Keep flipping to win big!
            </div>
          </div>
          
          {/* Action Buttons */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
          }}>
            <button
              onClick={handleBackToHome}
              style={{
                background: 'linear-gradient(45deg, #FF6B6B, #FF4757)',
                color: 'white',
                border: '3px solid #FF4757',
                borderRadius: '1rem',
                padding: '1rem 2rem',
                fontSize: '1.3rem',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 0 20px rgba(255, 71, 87, 0.5)',
                textTransform: 'uppercase',
                letterSpacing: '1px'
              }}
              onMouseOver={(e) => {
                e.target.style.transform = 'scale(1.05)'
                e.target.style.boxShadow = '0 0 30px rgba(255, 71, 87, 0.8)'
              }}
              onMouseOut={(e) => {
                e.target.style.transform = 'scale(1)'
                e.target.style.boxShadow = '0 0 20px rgba(255, 71, 87, 0.5)'
              }}
            >
              🎮 Try Again
            </button>
            
            <button
              onClick={handleBackToHome}
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                color: 'white',
                border: '2px solid rgba(255, 255, 255, 0.5)',
                borderRadius: '1rem',
                padding: '0.75rem 1.5rem',
                fontSize: '1rem',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
              onMouseOver={(e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.3)'
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.8)'
              }}
              onMouseOut={(e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.2)'
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.5)'
              }}
            >
              🏠 Back to Home
            </button>
          </div>
        </div>
      )}
      
      {/* CSS Animations */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes winnerPulse {
          from { 
            transform: scale(1);
            filter: brightness(1);
          }
          to { 
            transform: scale(1.02);
            filter: brightness(1.1);
          }
        }
        
        @keyframes bounce {
          0%, 20%, 53%, 80%, 100% {
            transform: translateY(0);
          }
          40%, 43% {
            transform: translateY(-30px);
          }
          70% {
            transform: translateY(-15px);
          }
          90% {
            transform: translateY(-4px);
          }
        }
        
        @keyframes loserShake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
          20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
      `}</style>
    </div>
  )
}

export default GameResultPopup 