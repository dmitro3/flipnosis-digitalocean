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
  width: 494px;
  height: 826px;
  background: transparent;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 20px;
`;

const LoserPopup = styled(WinnerPopup)`
  // Inherits all styles from WinnerPopup
`;

const VideoContainer = styled.div`
  position: relative;
  width: 494px;
  height: 826px;
`;

const MessageBox = styled.div`
  position: absolute;
  bottom: -120px;
  left: 50%;
  transform: translateX(-50%);
  width: 90%;
  max-width: 400px;
  background: rgba(0, 0, 0, 0.8);
  border: 2px solid ${props => props.isWinner ? '#00ff00' : '#ff0000'};
  border-radius: 10px;
  padding: 20px;
  text-align: center;
  color: white;
  box-shadow: 0 0 20px ${props => props.isWinner ? 'rgba(0, 255, 0, 0.3)' : 'rgba(255, 0, 0, 0.3)'};
`;

const WarningText = styled.p`
  color: #ff6b6b;
  font-size: 14px;
  margin: 10px 0;
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
        <WinnerPopup>
          <VideoContainer>
            <video
              key="win"
              autoPlay
              muted
              playsInline
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
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
            <MessageBox isWinner={true}>
              <h2>Congratulations!</h2>
              <p>You've won the game!</p>
              <WarningText>Warning: Leaving the game will result in a loss</WarningText>
              <Button onClick={handleClaimWinnings}>Claim</Button>
            </MessageBox>
          </VideoContainer>
        </WinnerPopup>
      )}

      {/* Loser Popup */}
      {!isWinner && (
        <LoserPopup>
          <VideoContainer>
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
            <MessageBox isWinner={false}>
              <h2>Game Over</h2>
              <p>Better luck next time!</p>
              <Button onClick={handleBackToHome}>Try Again</Button>
            </MessageBox>
          </VideoContainer>
        </LoserPopup>
      )}
    </div>
  )
}

export default GameResultPopup 