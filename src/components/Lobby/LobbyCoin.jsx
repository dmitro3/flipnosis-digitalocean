import React, { useState } from 'react'
import styled from '@emotion/styled'
import FinalCoin from '../FinalCoin'

const CoinContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 1rem 0;
  width: 100%;
  height: 100%;
  position: relative;
`

const LobbyCoin = ({ 
  size = 150, 
  customHeadsImage = null, 
  customTailsImage = null,
  material = null 
}) => {
  const [testFlip, setTestFlip] = useState(null)
  const [isTestFlipping, setIsTestFlipping] = useState(false)
  
  const handleCoinClick = () => {
    if (isTestFlipping) return
    
    setIsTestFlipping(true)
    const result = Math.random() < 0.5 ? 'heads' : 'tails'
    setTestFlip({
      isActive: true,
      result,
      duration: 3000
    })
    
    // Reset after animation completes
    setTimeout(() => {
      setTestFlip(null)
      setIsTestFlipping(false)
    }, 4000)
  }
  
  return (
    <CoinContainer onClick={handleCoinClick} style={{ cursor: 'pointer' }}>
      <FinalCoin
        isFlipping={testFlip?.isActive || false}
        flipResult={testFlip?.result || null}
        flipDuration={testFlip?.duration || 3000}
        onFlipComplete={() => {
          console.log('Lobby coin flip complete')
        }}
        onPowerCharge={() => {}}
        onPowerRelease={() => {}}
        isPlayerTurn={false}
        isCharging={false}
        creatorPower={0}
        joinerPower={0}
        customHeadsImage={customHeadsImage}
        customTailsImage={customTailsImage}
        size={size}
        material={material}
        seed={null}
      />
    </CoinContainer>
  )
}

export default LobbyCoin
