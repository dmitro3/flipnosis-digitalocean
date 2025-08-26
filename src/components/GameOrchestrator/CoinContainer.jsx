import React from 'react'
import styled from '@emotion/styled'
import LobbyCoin from '../Lobby/LobbyCoin'

const CoinContainerStyled = styled.div`
  background: transparent;
  border: none;
  border-radius: 1rem;
  padding: 0.5rem;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: flex-start;
  box-shadow: none;
  position: relative;
  overflow: hidden;
`

const CoinTitle = styled.h3`
  margin: 0 0 0.5rem 0;
  color: #FFD700;
  font-size: 1.3rem;
  font-weight: bold;
  text-align: center;
  text-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
  background: rgba(0, 0, 139, 0.8);
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  border: 1px solid rgba(255, 215, 0, 0.3);
  width: 100%;
`

const CoinWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  width: 100%;
  height: 100%;
  position: relative;
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
        <LobbyCoin
          customHeadsImage={customHeadsImage}
          customTailsImage={customTailsImage}
          material={gameCoin?.material}
          size={isMobile ? 200 : 250}
        />
      </CoinWrapper>
    </CoinContainerStyled>
  )
}

export default CoinContainer
