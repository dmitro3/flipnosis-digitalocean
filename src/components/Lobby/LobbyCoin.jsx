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
  transform: ${props => `scale(${props.size / 100}) rotateY(${props.rotation}deg)`};
  transition: transform 0.8s ease-in-out;
`

const LobbyCoin = ({ 
  customHeadsImage, 
  customTailsImage, 
  size = 200 
}) => {
  const [isFlipping, setIsFlipping] = useState(false)
  const [rotation, setRotation] = useState(0)

  const handleClick = () => {
    if (isFlipping) return // Prevent multiple clicks during flip
    
    setIsFlipping(true)
    
    // Simple slow rotation - 1-2 full rotations
    const targetRotation = rotation + 720 // 2 full rotations (720 degrees)
    setRotation(targetRotation)
    
    // Reset after animation completes
    setTimeout(() => {
      setIsFlipping(false)
    }, 800)
  }

  return (
    <CoinWrapper onClick={handleClick}>
      <CoinContainer size={size} rotation={rotation}>
        <OptimizedGoldCoin
          customHeadsImage={customHeadsImage}
          customTailsImage={customTailsImage}
          flipResult={null}
          isFlipping={isFlipping}
        />
      </CoinContainer>
    </CoinWrapper>
  )
}

export default LobbyCoin
