import React from 'react'
import styled from '@emotion/styled'
import FinalCoin from '../FinalCoin'

const CoinContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 1rem 0;
`

const LobbyCoin = ({ 
  size = 150, 
  customHeadsImage = null, 
  customTailsImage = null,
  material = null 
}) => {
  return (
    <CoinContainer>
      <FinalCoin
        isFlipping={false}
        flipResult={null}
        flipDuration={3000}
        onFlipComplete={() => {}}
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
