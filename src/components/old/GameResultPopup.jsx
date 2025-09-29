import React from 'react'
import { useNavigate } from 'react-router-dom'
import { theme } from '../styles/theme'
import styled from '@emotion/styled'
import { Button } from '../styles/components'

const WinnerPopup = styled.div`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  /* Responsive sizing: Mobile good as is, Desktop 20% smaller */
  width: ${props => props.isMobile ? '320px' : '400px'};
  background: rgba(0, 0, 0, 0.9);
  border-radius: 1.5rem;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 1rem;
  backdrop-filter: blur(10px);
`;

const LoserPopup = styled(WinnerPopup)`
  /* Same styling as WinnerPopup, color differences handled in JSX */
`;

const VideoContainer = styled.div`
  position: relative;
  width: ${props => props.isMobile ? '280px' : '360px'};
  height: ${props => props.isMobile ? '280px' : '360px'};
  border-radius: 1rem;
  overflow: hidden;
  border: ${props => props.isWinner ? '3px solid #00FF41' : '3px solid #FF1493'};
  box-shadow: ${props => props.isWinner ? 
    '0 0 30px rgba(0, 255, 65, 0.6), 0 0 60px rgba(0, 255, 65, 0.3)' : 
    '0 0 30px rgba(255, 20, 147, 0.6), 0 0 60px rgba(255, 20, 147, 0.3)'};
  animation: ${props => props.isWinner ? 'winnerGlow' : 'loserGlow'} 2s ease-in-out infinite alternate;
  
  @keyframes winnerGlow {
    0% {
      box-shadow: 0 0 30px rgba(0, 255, 65, 0.4), 0 0 60px rgba(0, 255, 65, 0.2);
    }
    100% {
      box-shadow: 0 0 40px rgba(0, 255, 65, 0.6), 0 0 80px rgba(0, 255, 65, 0.3);
    }
  }
  
  @keyframes loserGlow {
    0% {
      box-shadow: 0 0 30px rgba(255, 20, 147, 0.4), 0 0 60px rgba(255, 20, 147, 0.2);
    }
    100% {
      box-shadow: 0 0 40px rgba(255, 20, 147, 0.6), 0 0 80px rgba(255, 20, 147, 0.3);
    }
  }
`;

const ButtonContainer = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  align-items: center;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.8);
  border-radius: 1rem;
  border: 2px solid ${props => props.isWinner ? '#00FF41' : '#FF1493'};
  backdrop-filter: blur(10px);
  animation: buttonFlash 2s ease-in-out infinite;
  
  @keyframes buttonFlash {
    0%, 100% {
      border-color: ${props => props.isWinner ? 'rgba(0, 255, 65, 0.6)' : 'rgba(255, 20, 147, 0.6)'};
      box-shadow: 0 0 20px ${props => props.isWinner ? 'rgba(0, 255, 65, 0.3)' : 'rgba(255, 20, 147, 0.3)'};
    }
    50% {
      border-color: ${props => props.isWinner ? 'rgba(0, 255, 65, 1)' : 'rgba(255, 20, 147, 1)'};
      box-shadow: 0 0 30px ${props => props.isWinner ? 'rgba(0, 255, 65, 0.6)' : 'rgba(255, 20, 147, 0.6)'};
    }
  }
`;

const WarningText = styled.p`
  color: #ff6b6b;
  font-size: 14px;
  margin: 10px 0;
  font-weight: bold;
`;

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

  // Device detection
  const isMobileScreen = window.innerWidth <= 768

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
        <WinnerPopup isMobile={isMobileScreen}>
          {/* Video Container with Border */}
          <VideoContainer isMobile={isMobileScreen} isWinner={true}>
            <video
              key="win"
              autoPlay
              muted
              loop
              playsInline
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }}
              src="/images/video/LoseWin/final lose win/endwin.webm"
              onError={(e) => {
                console.error('Video playback error:', e);
                console.log('Video source:', e.target.src);
                const paths = [
                  '/images/video/LoseWin/final lose win/endwin.webm',
                  'images/video/LoseWin/final lose win/endwin.webm',
                  './images/video/LoseWin/final lose win/endwin.webm'
                ];
                const currentIndex = paths.indexOf(e.target.src);
                const nextIndex = (currentIndex + 1) % paths.length;
                e.target.src = paths[nextIndex];
              }}
              onLoadedData={(e) => {
                console.log('Video loaded successfully');
                e.target.play().catch(err => console.error('Play error:', err));
              }}
            />
          </VideoContainer>
          
          {/* Button Container */}
          <ButtonContainer isWinner={true}>
            <h2 style={{ 
              color: '#00FF41', 
              textShadow: '0 0 10px #00FF41',
              marginBottom: '0.5rem',
              fontSize: '1.4rem',
              textAlign: 'center'
            }}>
              🎉 You Won!
            </h2>
            <p style={{ 
              fontSize: '1rem', 
              marginBottom: '1rem', 
              color: 'white',
              textAlign: 'center'
            }}>
              Congratulations!
            </p>
            
            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '0.75rem', width: '100%' }}>
              <button
                onClick={handleClaimWinnings}
                style={{
                  flex: 1,
                  background: 'linear-gradient(135deg, #00FF41, #39FF14)',
                  color: '#000',
                  border: 'none',
                  padding: '1rem 0.75rem',
                  borderRadius: '0.75rem',
                  fontSize: '1.1rem',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  boxShadow: '0 0 20px rgba(0, 255, 65, 0.5)',
                  transition: 'all 0.3s ease',
                  textTransform: 'uppercase',
                  animation: 'collectFlash 1.5s ease-in-out infinite'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'scale(1.05)';
                  e.currentTarget.style.boxShadow = '0 0 25px rgba(0, 255, 65, 0.7)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = '0 0 20px rgba(0, 255, 65, 0.5)';
                }}
              >
                💰 COLLECT
              </button>
              <button
                onClick={handleBackToHome}
                style={{
                  flex: 1,
                  background: 'linear-gradient(135deg, #FF1493, #FF69B4)',
                  color: '#fff',
                  border: 'none',
                  padding: '1rem 0.75rem',
                  borderRadius: '0.75rem',
                  fontSize: '1.1rem',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  boxShadow: '0 0 20px rgba(255, 20, 147, 0.5)',
                  transition: 'all 0.3s ease',
                  textTransform: 'uppercase'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'scale(1.05)';
                  e.currentTarget.style.boxShadow = '0 0 25px rgba(255, 20, 147, 0.7)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = '0 0 20px rgba(255, 20, 147, 0.5)';
                }}
              >
                🏠 HOME
              </button>
            </div>
          </ButtonContainer>
        </WinnerPopup>
      )}

      {/* Loser Popup */}
      {!isWinner && (
        <LoserPopup isMobile={isMobileScreen}>
          {/* Video Container with Border */}
          <VideoContainer isMobile={isMobileScreen} isWinner={false}>
            <video
              key="lose"
              autoPlay
              muted
              playsInline
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }}
              src="/images/video/LoseWin/final lose win/endlose.webm"
              onError={(e) => {
                console.error('Video playback error:', e);
                console.log('Video source:', e.target.src);
                const paths = [
                  '/images/video/LoseWin/final lose win/endlose.webm',
                  'images/video/LoseWin/final lose win/endlose.webm',
                  './images/video/LoseWin/final lose win/endlose.webm'
                ];
                const currentIndex = paths.indexOf(e.target.src);
                const nextIndex = (currentIndex + 1) % paths.length;
                e.target.src = paths[nextIndex];
              }}
              onLoadedData={(e) => {
                console.log('Video loaded successfully');
                e.target.play().catch(err => console.error('Play error:', err));
              }}
            />
          </VideoContainer>
          
          {/* Button Container */}
          <ButtonContainer isWinner={false}>
            <h2 style={{ 
              color: '#FF1493', 
              textShadow: '0 0 10px #FF1493',
              marginBottom: '0.5rem',
              fontSize: '1.4rem',
              textAlign: 'center'
            }}>
              💔 You Lost
            </h2>
            <p style={{ 
              fontSize: '1rem', 
              marginBottom: '1rem', 
              color: 'white',
              textAlign: 'center'
            }}>
              Better luck next time!
            </p>
            
            {/* Action Button */}
            <button
              onClick={handleBackToHome}
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, #FF1493, #FF69B4)',
                color: '#fff',
                border: 'none',
                padding: '1rem',
                borderRadius: '0.75rem',
                fontSize: '1.1rem',
                fontWeight: 'bold',
                cursor: 'pointer',
                boxShadow: '0 0 20px rgba(255, 20, 147, 0.5)',
                transition: 'all 0.3s ease',
                textTransform: 'uppercase',
                animation: 'homeFlash 1.5s ease-in-out infinite'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.boxShadow = '0 0 25px rgba(255, 20, 147, 0.7)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = '0 0 20px rgba(255, 20, 147, 0.5)';
              }}
            >
              🏠 HOME
            </button>
          </ButtonContainer>
        </LoserPopup>
      )}
    </div>
  )
}

export default GameResultPopup 