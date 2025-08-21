import React, { useState } from 'react'
import styled from '@emotion/styled'
import OptimizedGoldCoin from '../OptimizedGoldCoin'

const CoinWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
`

const CoinContainer = styled.div`
  transform: ${props => `scale(${props.size / 100}) rotateX(${props.rotation}deg)`};
  transition: transform 1.5s ease-in-out;
`

const FlipResult = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(0, 0, 0, 0.9);
  color: #FFD700;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  border: 2px solid #FFD700;
  font-weight: bold;
  font-size: 1.2rem;
  z-index: 100;
  animation: fadeInOut 2s ease-in-out;
  
  @keyframes fadeInOut {
    0%, 100% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
    50% { opacity: 1; transform: translate(-50%, -50%) scale(1.1); }
  }
`

const LobbyCoin = ({ 
  customHeadsImage, 
  customTailsImage, 
  size = 200 
}) => {
  const [isFlipping, setIsFlipping] = useState(false)
  const [rotation, setRotation] = useState(0)
  const [flipResult, setFlipResult] = useState(null)

  const handleClick = () => {
    if (isFlipping) return // Prevent multiple clicks during flip
    
    setIsFlipping(true)
    setFlipResult(null)
    
    // Slow simple flip - 2 full rotations (vertical flip)
    const targetRotation = rotation + 720 // 2 full rotations (720 degrees)
    setRotation(targetRotation)
    
    // Determine result after flip
    setTimeout(() => {
      const result = Math.random() < 0.5 ? 'HEADS' : 'TAILS'
      setFlipResult(result)
      
      // Reset after showing result
      setTimeout(() => {
        setIsFlipping(false)
        setFlipResult(null)
      }, 2000)
    }, 1500)
  }

  return (
    <CoinWrapper onClick={handleClick}>
      <div style={{ position: 'relative' }}>
        <CoinContainer size={size} rotation={rotation}>
          <OptimizedGoldCoin
            customHeadsImage={customHeadsImage}
            customTailsImage={customTailsImage}
            flipResult={null}
            isFlipping={isFlipping}
          />
        </CoinContainer>
        {flipResult && (
          <FlipResult>
            {flipResult}
          </FlipResult>
        )}
      </div>
    </CoinWrapper>
  )
}

export default LobbyCoin
