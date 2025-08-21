import React, { useState } from 'react'
import styled from '@emotion/styled'
import OptimizedGoldCoin from '../OptimizedGoldCoin'

const CoinWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  transition: transform 0.2s ease;
  
  &:hover {
    transform: scale(1.05);
  }
  
  &:active {
    transform: scale(0.95);
  }
`

const LobbyCoin = ({ 
  customHeadsImage, 
  customTailsImage, 
  size = 200 
}) => {
  const [isFlipping, setIsFlipping] = useState(false)
  const [flipResult, setFlipResult] = useState(null)

  const handleClick = () => {
    if (isFlipping) return // Prevent multiple clicks during flip
    
    setIsFlipping(true)
    setFlipResult(null)
    
    // Simple flip animation - just rotate on the spot
    setTimeout(() => {
      const result = Math.random() < 0.5 ? 'heads' : 'tails'
      setFlipResult(result)
      
      // Reset after showing result
      setTimeout(() => {
        setIsFlipping(false)
        setFlipResult(null)
      }, 1500)
    }, 1000)
  }

  return (
    <CoinWrapper onClick={handleClick}>
      <div style={{ 
        transform: `scale(${size / 100})`,
        animation: isFlipping ? 'flip 1s ease-in-out' : 'float 4s ease-in-out infinite'
      }}>
        <OptimizedGoldCoin
          customHeadsImage={customHeadsImage}
          customTailsImage={customTailsImage}
          flipResult={flipResult}
          isFlipping={isFlipping}
        />
      </div>
    </CoinWrapper>
  )
}

export default LobbyCoin
