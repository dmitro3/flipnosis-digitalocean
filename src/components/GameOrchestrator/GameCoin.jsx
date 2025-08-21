import React from 'react'
import styled from '@emotion/styled'
import FinalCoin from '../FinalCoin'

const CoinSection = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 1rem 0;
  min-height: 200px;
`

const GameCoin = ({
  gameId,
  gameState,
  flipAnimation,
  customHeadsImage,
  customTailsImage,
  gameCoin,
  isMobile,
  onPowerChargeStart,
  onPowerChargeStop,
  isMyTurn,
  address,
  isCreator,
  flipSeed // Pass this from the server for deterministic animations
}) => {
  return (
    <CoinSection>
      <FinalCoin
        isFlipping={!!flipAnimation}
        flipResult={flipAnimation?.result}
        flipDuration={flipAnimation?.duration || 3000}
        onFlipComplete={() => {
          // Handle flip completion
          console.log('Flip animation complete')
        }}
        onPowerCharge={onPowerChargeStart}
        onPowerRelease={onPowerChargeStop}
        isPlayerTurn={isMyTurn()}
        isCharging={gameState.chargingPlayer === address}
        creatorPower={gameState.creatorPower}
        joinerPower={gameState.joinerPower}
        customHeadsImage={customHeadsImage}
        customTailsImage={customTailsImage}
        size={isMobile ? 150 : 200}
        material={gameCoin?.material}
        seed={flipSeed}
      />
    </CoinSection>
  )
}

export default GameCoin 