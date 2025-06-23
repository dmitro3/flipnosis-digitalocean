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
  width: ${props => props.isMobile ? '256px' : '358px'}; /* 320px * 0.8 = 256px for mobile, 448px * 0.8 = 358px for desktop */
  height: ${props => props.isMobile ? '416px' : '582px'}; /* 520px * 0.8 = 416px for mobile, 728px * 0.8 = 582px for desktop */
  background: rgba(0, 0, 0, 0.3);
  border: 3px solid #00FF41;
  border-radius: 1.5rem;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 20px;
  box-shadow: 0 0 30px rgba(0, 255, 65, 0.4), 0 0 60px rgba(0, 255, 65, 0.2);
  animation: winnerGlow 2s ease-in-out infinite alternate;
  
  @keyframes winnerGlow {
    0% {
      box-shadow: 0 0 30px rgba(0, 255, 65, 0.4), 0 0 60px rgba(0, 255, 65, 0.2);
    }
    100% {
      box-shadow: 0 0 40px rgba(0, 255, 65, 0.6), 0 0 80px rgba(0, 255, 65, 0.3);
    }
  }
`;

const LoserPopup = styled(WinnerPopup)`
  border: 3px solid #FF1493;
  box-shadow: 0 0 30px rgba(255, 20, 147, 0.4), 0 0 60px rgba(255, 20, 147, 0.2);
  animation: loserGlow 2s ease-in-out infinite alternate;
  
  @keyframes loserGlow {
    0% {
      box-shadow: 0 0 30px rgba(255, 20, 147, 0.4), 0 0 60px rgba(255, 20, 147, 0.2);
    }
    100% {
      box-shadow: 0 0 40px rgba(255, 20, 147, 0.6), 0 0 80px rgba(255, 20, 147, 0.3);
    }
  }
`;

const VideoContainer = styled.div`
  position: relative;
  /* Responsive sizing: Mobile good as is, Desktop 20% smaller */
  width: ${props => props.isMobile ? '224px' : '314px'}; /* 280px * 0.8 = 224px for mobile, 392px * 0.8 = 314px for desktop */
  height: ${props => props.isMobile ? '280px' : '400px'}; /* Reduced height to make room for buttons, 320px for mobile, 448px for desktop */
  border-radius: 1rem;
  overflow: visible; /* Changed to visible so buttons can appear below */
  background: rgba(0, 0, 0, 0.5);
`;

const MessageBox = styled.div`
  position: absolute;
  bottom: 10px;
  left: 50%;
  transform: translateX(-50%);
  width: 90%;
  background: rgba(0, 0, 0, 0.95);
  border: 2px solid ${props => props.isWinner ? '#00ff00' : '#ff1493'};
  border-radius: 1rem;
  padding: 15px;
  text-align: center;
  color: white;
  box-shadow: 0 0 20px ${props => props.isWinner ? 'rgba(0, 255, 0, 0.5)' : 'rgba(255, 20, 147, 0.5)'};
  backdrop-filter: blur(10px);
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
          <VideoContainer isMobile={isMobileScreen}>
            <video
              key="win"
              autoPlay
              muted
              loop
              playsInline
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                borderRadius: '1rem'
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
            <MessageBox isWinner={true}>
              <h2 style={{ 
                color: '#00FF41', 
                textShadow: '0 0 10px #00FF41',
                marginBottom: '0.3rem',
                fontSize: '1.2rem'
              }}>
                🎉 You Won!
              </h2>
              <p style={{ fontSize: '0.9rem', marginBottom: '0.8rem' }}>Congratulations!</p>
              
              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '0.5rem', width: '100%' }}>
                <button
                  onClick={handleClaimWinnings}
                  style={{
                    flex: 1,
                    background: 'linear-gradient(135deg, #00FF41, #39FF14)',
                    color: '#000',
                    border: 'none',
                    padding: '0.7rem 0.5rem',
                    borderRadius: '0.6rem',
                    fontSize: '1rem',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    boxShadow: '0 0 15px rgba(0, 255, 65, 0.4)',
                    transition: 'all 0.3s ease',
                    textTransform: 'uppercase'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'scale(1.05)';
                    e.currentTarget.style.boxShadow = '0 0 20px rgba(0, 255, 65, 0.6)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow = '0 0 15px rgba(0, 255, 65, 0.4)';
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
                    padding: '0.7rem 0.5rem',
                    borderRadius: '0.6rem',
                    fontSize: '1rem',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    boxShadow: '0 0 15px rgba(255, 20, 147, 0.4)',
                    transition: 'all 0.3s ease',
                    textTransform: 'uppercase'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'scale(1.05)';
                    e.currentTarget.style.boxShadow = '0 0 20px rgba(255, 20, 147, 0.6)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow = '0 0 15px rgba(255, 20, 147, 0.4)';
                  }}
                >
                  🏠 HOME
                </button>
              </div>
            </MessageBox>
          </VideoContainer>
        </WinnerPopup>
      )}

      {/* Loser Popup */}
      {!isWinner && (
        <LoserPopup isMobile={isMobileScreen}>
          <VideoContainer isMobile={isMobileScreen}>
            <video
              key="lose"
              autoPlay
              muted
              playsInline
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                borderRadius: '1rem'
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
            <MessageBox isWinner={false}>
              <h2 style={{ 
                color: '#FF1493', 
                textShadow: '0 0 10px #FF1493',
                marginBottom: '0.3rem',
                fontSize: '1.2rem'
              }}>
                💔 You Lost
              </h2>
              <p style={{ fontSize: '0.9rem', marginBottom: '0.8rem' }}>Better luck next time!</p>
              
              {/* Action Button */}
              <button
                onClick={handleBackToHome}
                style={{
                  width: '100%',
                  background: 'linear-gradient(135deg, #FF1493, #FF69B4)',
                  color: '#fff',
                  border: 'none',
                  padding: '0.7rem',
                  borderRadius: '0.6rem',
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  boxShadow: '0 0 15px rgba(255, 20, 147, 0.4)',
                  transition: 'all 0.3s ease',
                  textTransform: 'uppercase'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'scale(1.05)';
                  e.currentTarget.style.boxShadow = '0 0 20px rgba(255, 20, 147, 0.6)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = '0 0 15px rgba(255, 20, 147, 0.4)';
                }}
              >
                🏠 HOME
              </button>
            </MessageBox>
          </VideoContainer>
        </LoserPopup>
      )}
    </div>
  )
}

export default GameResultPopup 