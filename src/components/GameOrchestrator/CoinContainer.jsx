import React from 'react'
import styled from '@emotion/styled'
import GameCoin from './GameCoin'

const CoinContainerStyled = styled.div`
  background: transparent;
  border: none;
  border-radius: 1rem;
  padding: 1rem;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-shadow: none;
  position: relative;
  overflow: hidden;
`

const CoinTitle = styled.h3`
  margin: 0 0 1rem 0;
  color: #FF1493;
  font-size: 1.2rem;
  font-weight: bold;
  text-align: center;
  text-shadow: 0 0 10px rgba(255, 20, 147, 0.5);
  background: rgba(0, 0, 139, 0.8);
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  border: 1px solid rgba(255, 20, 147, 0.3);
`

const CoinWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  width: 100%;
`

const CoinContainer = ({ 
  gameId, 
  gameData, 
  customHeadsImage, 
  customTailsImage, 
  gameCoin, 
  isMobile, 
  address, 
  isCreator 
}) => {
  return (
    <CoinContainerStyled>
      <CoinTitle>Game Coin</CoinTitle>
      <CoinWrapper>
        <div style={{ 
          transform: 'scale(0.8)',
          animation: 'float 4s ease-in-out infinite'
        }}>
          <GameCoin
            gameId={gameId}
            gameState={{ phase: 'waiting' }}
            streamedCoinState={{ isStreaming: false, frameData: null }}
            flipAnimation={null}
            customHeadsImage={customHeadsImage}
            customTailsImage={customTailsImage}
            gameCoin={gameCoin}
            isMobile={isMobile}
            onPowerChargeStart={() => {}}
            onPowerChargeStop={() => {}}
            isMyTurn={() => false}
            address={address}
            isCreator={isCreator}
          />
        </div>
      </CoinWrapper>
    </CoinContainerStyled>
  )
}

export default CoinContainer
