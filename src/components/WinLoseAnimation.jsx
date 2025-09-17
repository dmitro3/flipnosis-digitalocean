import React, { useEffect, useState } from 'react'
import styled from '@emotion/styled'

const AnimationOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  animation: fadeIn 0.3s ease-in;
  
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
`

const VideoContainer = styled.div`
  position: relative;
  max-width: 90vw;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rem;
`

const AnimationVideo = styled.video`
  width: 100%;
  height: auto;
  max-width: 800px;
  border-radius: 1rem;
  box-shadow: 0 0 50px rgba(255, 255, 255, 0.3);
`

const ResultText = styled.div`
  font-size: 3rem;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 3px;
  color: ${props => props.isWin ? '#00FF41' : '#FF1493'};
  text-shadow: ${props => props.isWin ? 
    '0 0 20px #00FF41, 0 0 40px #00FF41, 0 0 60px #00FF41' :
    '0 0 20px #FF1493, 0 0 40px #FF1493, 0 0 60px #FF1493'
  };
  animation: neonPulse 2s ease-in-out infinite;
  text-align: center;
  
  @keyframes neonPulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.8; transform: scale(1.05); }
  }
  
  @media (max-width: 768px) {
    font-size: 2rem;
  }
`

const ScoreText = styled.div`
  font-size: 1.5rem;
  color: #FFD700;
  text-align: center;
  margin-top: 1rem;
  
  @media (max-width: 768px) {
    font-size: 1.2rem;
  }
`

const WinLoseAnimation = ({ 
  isVisible, 
  isWin, 
  playerScore, 
  opponentScore, 
  currentRound,
  totalRounds,
  onAnimationComplete 
}) => {
  const [videoEnded, setVideoEnded] = useState(false)

  useEffect(() => {
    if (isVisible) {
      setVideoEnded(false)
    }
  }, [isVisible])

  const handleVideoEnded = () => {
    setVideoEnded(true)
    // Wait 2 seconds after video ends, then call completion callback
    setTimeout(() => {
      if (onAnimationComplete) {
        onAnimationComplete()
      }
    }, 2000)
  }

  if (!isVisible) return null

  const videoSrc = isWin 
    ? '/images/video/losewin/final lose win/win.webm'
    : '/images/video/losewin/final lose win/lose.webm'

  return (
    <AnimationOverlay>
      <VideoContainer>
        <ResultText isWin={isWin}>
          {isWin ? 'You Win!' : 'You Lose!'}
        </ResultText>
        
        <AnimationVideo
          src={videoSrc}
          autoPlay
          muted
          onEnded={handleVideoEnded}
          playsInline
        />
        
        <ScoreText>
          Round {currentRound} of {totalRounds}
          <br />
          Score: {playerScore} - {opponentScore}
        </ScoreText>
        
        {videoEnded && (
          <div style={{ 
            color: '#FFA500', 
            fontSize: '1.2rem', 
            textAlign: 'center',
            animation: 'pulse 1s ease-in-out infinite'
          }}>
            {currentRound < totalRounds ? 'Next Round Starting...' : 'Game Complete!'}
          </div>
        )}
      </VideoContainer>
    </AnimationOverlay>
  )
}

export default WinLoseAnimation
