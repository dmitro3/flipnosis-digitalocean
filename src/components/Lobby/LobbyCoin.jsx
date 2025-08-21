import React from 'react'
import styled from '@emotion/styled'
import OptimizedGoldCoin from '../OptimizedGoldCoin'

const CoinWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
`

const LobbyCoin = ({ 
  customHeadsImage, 
  customTailsImage, 
  size = 200 
}) => {
  return (
    <CoinWrapper>
      <div style={{ 
        transform: `scale(${size / 100})`,
        animation: 'float 4s ease-in-out infinite'
      }}>
        <OptimizedGoldCoin
          customHeadsImage={customHeadsImage}
          customTailsImage={customTailsImage}
          flipResult={null}
          isFlipping={false}
        />
      </div>
    </CoinWrapper>
  )
}

export default LobbyCoin
