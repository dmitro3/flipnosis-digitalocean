import React from 'react'
import styled from '@emotion/styled'
import OptimizedGoldCoin from '../OptimizedGoldCoin'
import StreamedCoin from '../StreamedCoin'

const CoinSection = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 2rem 0;
  min-height: 400px;
`

const GameCoin = ({
  gameId,
  gameState,
  streamedCoinState,
  flipAnimation,
  customHeadsImage,
  customTailsImage,
  gameCoin,
  isMobile,
  onPowerChargeStart,
  onPowerChargeStop,
  isMyTurn,
  address,
  isCreator
}) => {
  return (
    <CoinSection style={{ position: 'relative' }}>
      {streamedCoinState.isStreaming ? (
        <StreamedCoin
          gameId={gameId}
          isStreaming={streamedCoinState.isStreaming}
          frameData={streamedCoinState.frameData}
          onFlipComplete={() => {
            // This will be handled by the parent component
          }}
          size={isMobile ? 250 : 400}
        />
      ) : (
        <OptimizedGoldCoin
          isFlipping={!!flipAnimation}
          flipResult={flipAnimation?.result}
          onPowerCharge={onPowerChargeStart}
          onPowerRelease={onPowerChargeStop}
          isPlayerTurn={isMyTurn()}
          isCharging={gameState.chargingPlayer === address}
          chargingPlayer={gameState.chargingPlayer}
          creatorPower={gameState.creatorPower}
          joinerPower={gameState.joinerPower}
          creatorChoice={gameState.creatorChoice}
          joinerChoice={gameState.joinerChoice}
          isCreator={isCreator()}
          customHeadsImage={customHeadsImage}
          customTailsImage={customTailsImage}
          gamePhase={gameState.phase}
          size={isMobile ? 250 : 400}
        />
      )}
    </CoinSection>
  )
}

export default GameCoin 