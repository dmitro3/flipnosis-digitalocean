import React, { useState, useEffect } from 'react'
import styled from '@emotion/styled'

const AnimationOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  opacity: ${props => props.isVisible ? 1 : 0};
  visibility: ${props => props.isVisible ? 'visible' : 'hidden'};
  transition: all 0.3s ease;
`

const VideoContainer = styled.div`
  position: relative;
  width: 100%;
  max-width: 800px;
  height: auto;
  display: flex;
  align-items: center;
  justify-content: center;
`

const AnimationVideo = styled.video`
  width: 100%;
  height: auto;
  max-height: 70vh;
  object-fit: contain;
  border-radius: 1rem;
  box-shadow: 0 0 50px rgba(255, 255, 255, 0.3);
`

const ResultText = styled.div`
  font-size: 4rem;
  font-weight: bold;
  color: ${props => props.isWin ? '#00FF41' : '#FF1493'};
  text-shadow: ${props => props.isWin ? 
    '0 0 30px #00FF41, 0 0 60px #00FF41, 0 0 90px #00FF41' :
    '0 0 30px #FF1493, 0 0 60px #FF1493, 0 0 90px #FF1493'
  };
  text-transform: uppercase;
  letter-spacing: 3px;
  margin-top: 2rem;
  text-align: center;
  animation: ${props => props.isWin ? 'winPulse' : 'losePulse'} 2s ease-in-out infinite;
  
  @keyframes winPulse {
    0%, 100% { 
      transform: scale(1);
      text-shadow: 0 0 30px #00FF41, 0 0 60px #00FF41, 0 0 90px #00FF41;
    }
    50% { 
      transform: scale(1.05);
      text-shadow: 0 0 40px #00FF41, 0 0 80px #00FF41, 0 0 120px #00FF41;
    }
  }
  
  @keyframes losePulse {
    0%, 100% { 
      transform: scale(1);
      text-shadow: 0 0 30px #FF1493, 0 0 60px #FF1493, 0 0 90px #FF1493;
    }
    50% { 
      transform: scale(1.05);
      text-shadow: 0 0 40px #FF1493, 0 0 80px #FF1493, 0 0 120px #FF1493;
    }
  }
  
  @media (max-width: 768px) {
    font-size: 2.5rem;
  }
`

const ScoreText = styled.div`
  font-size: 2rem;
  color: #FFD700;
  text-shadow: 0 0 20px #FFD700;
  margin-top: 1rem;
  text-align: center;
  font-weight: bold;
`

const RoundInfo = styled.div`
  font-size: 1.5rem;
  color: #CCC;
  margin-top: 1rem;
  text-align: center;
`

const RoundResultAnimation = ({ 
  isVisible, 
  isWin, 
  playerScore, 
  opponentScore, 
  currentRound, 
  totalRounds,
  onAnimationComplete 
}) => {
  const [videoEnded, setVideoEnded] = useState(false)
  
  // Determine which video to play
  const videoSrc = isWin ? '/Images/Video/LoseWin/final lose win/win.webm' : '/Images/Video/LoseWin/final lose win/lose.webm'
  
  useEffect(() => {
    if (isVisible) {
      setVideoEnded(false)
      
      // Auto-close after 5 seconds if video doesn't end naturally
      const timeout = setTimeout(() => {
        console.log('🎬 Animation timeout - closing')
        if (onAnimationComplete) onAnimationComplete()
      }, 5000)
      
      return () => clearTimeout(timeout)
    }
  }, [isVisible, onAnimationComplete])
  
  const handleVideoEnd = () => {
    console.log('🎬 Round animation video ended')
    setVideoEnded(true)
    
    // Wait a moment to show the text, then close
    setTimeout(() => {
      if (onAnimationComplete) onAnimationComplete()
    }, 2000)
  }
  
  const handleVideoError = (e) => {
    console.error('🎬 Video playback error:', e)
    console.log('🎬 Attempting fallback - showing text only')
    setVideoEnded(true)
    
    // Show text for 3 seconds then close
    setTimeout(() => {
      if (onAnimationComplete) onAnimationComplete()
    }, 3000)
  }
  
  if (!isVisible) return null
  
  return (
    <AnimationOverlay isVisible={isVisible}>
      <VideoContainer>
        {!videoEnded ? (
          <AnimationVideo
            src={videoSrc}
            autoPlay
            muted
            playsInline
            onEnded={handleVideoEnd}
            onError={handleVideoError}
            onCanPlay={() => console.log('🎬 Video ready to play:', videoSrc)}
          />
        ) : (
          <>
            <ResultText isWin={isWin}>
              {isWin ? '🏆 Round Won!' : '💔 Round Lost'}
            </ResultText>
            <ScoreText>
              You: {playerScore} - Opponent: {opponentScore}
            </ScoreText>
            <RoundInfo>
              Round {currentRound} of {totalRounds}
            </RoundInfo>
          </>
        )}
      </VideoContainer>
    </AnimationOverlay>
  )
}

export default RoundResultAnimation
