import React from 'react'
import styled from '@emotion/styled'
import GameCoin from './GameCoin'

const CoinContainerStyled = styled.div`
  background: transparent;
  border: 2px solid #FFD700;
  border-radius: 1rem;
  padding: 1rem;
  height: 500px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 30px rgba(255, 215, 0, 0.3);
  position: relative;
  overflow: hidden;
`

const CoinTitle = styled.h3`
  margin: 0 0 1rem 0;
  color: #FFD700;
  font-size: 1.2rem;
  font-weight: bold;
  text-align: center;
  text-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
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
      <CoinTitle>🎲 Game Coin Preview</CoinTitle>
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
