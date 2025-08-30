import React, { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import styled from '@emotion/styled'
import { useNotification } from '../../../contexts/NotificationContext'

// Import the original components
import NFTDetailsContainer from '../../Lobby/NFTDetailsContainer'
import CoinContainer from '../../GameOrchestrator/CoinContainer'

const TabContainer = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 2rem;
  width: 100%;
  height: 100%;
  
  @media (max-width: 1200px) {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
`

const LeftSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`

const RightSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  align-items: center;
  justify-content: center;
`

const SectionTitle = styled.h3`
  color: #FFD700;
  font-size: 1.3rem;
  font-weight: bold;
  margin: 0 0 1rem 0;
  text-align: center;
  text-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
`

const CoinDisplayWrapper = styled.div`
  background: rgba(0, 0, 40, 0.95);
  border: 2px solid #FFD700;
  border-radius: 1rem;
  padding: 2rem;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 0 30px rgba(255, 215, 0, 0.3);
`

const CoinInstructions = styled.p`
  color: #fff;
  text-align: center;
  margin: 1rem 0;
  font-size: 0.9rem;
  opacity: 0.8;
`

const NFTDetailsTab = ({ 
  gameData, 
  gameId, 
  isCreator, 
  isJoiner, 
  getGameNFTImage, 
  getGameNFTName, 
  getGameNFTCollection 
}) => {
  const { address } = useAccount()
  const { showSuccess, showError } = useNotification()
  
  // Coin data state (like in original GameLobby)
  const [customHeadsImage, setCustomHeadsImage] = useState(null)
  const [customTailsImage, setCustomTailsImage] = useState(null)
  const [gameCoin, setGameCoin] = useState(null)

  // Debug logging
  console.log('🔍 NFTDetailsTab Debug:', {
    gameData,
    gameId,
    isCreator,
    isJoiner,
    getGameNFTImage: getGameNFTImage(),
    getGameNFTName: getGameNFTName(),
    getGameNFTCollection: getGameNFTCollection(),
    address,
    coin_data: gameData?.coin_data,
    coinData: gameData?.coinData
  })

  // Extract coin data from gameData (like in original GameLobby)
  useEffect(() => {
    let coinData = null

    if (gameData?.coinData && typeof gameData.coinData === 'object') {
      coinData = gameData.coinData
    } else if (gameData?.coin_data) {
      try {
        coinData = typeof gameData.coin_data === 'string' ? 
          JSON.parse(gameData.coin_data) : gameData.coin_data
      } catch (error) {
        console.error('❌ Error parsing coin data:', error)
      }
    }

    if (coinData && coinData.headsImage && coinData.tailsImage) {
      setCustomHeadsImage(coinData.headsImage)
      setCustomTailsImage(coinData.tailsImage)
      setGameCoin(coinData)
      console.log('✅ Coin data extracted:', coinData)
    }
  }, [gameData])

  // Create nftData object in the format expected by NFTDetailsContainer
  const nftData = {
    image: getGameNFTImage(),
    name: getGameNFTName(),
    collection: getGameNFTCollection(),
    contract_address: gameData?.nft_contract || gameData?.nft_contract_address,
    token_id: gameData?.nft_token_id,
    verified: gameData?.nft_deposited || gameData?.nft_verified
  }

  return (
    <TabContainer>
      {/* Left Section - NFT Details */}
      <LeftSection>
        <NFTDetailsContainer
          gameData={gameData}
          isCreator={isCreator()}
          currentTurn={null}
          nftData={nftData}
          currentChain={gameData?.nft_chain || gameData?.chain || 'base'}
        />
      </LeftSection>

      {/* Right Section - Interactive Coin Display */}
      <RightSection>
        <CoinDisplayWrapper>
          <SectionTitle>🪙 Interactive Coin</SectionTitle>
          <CoinInstructions>
            Click the coin to see it spin and verify its authenticity
          </CoinInstructions>
          
          <CoinContainer
            gameId={gameId}
            gameData={gameData}
            customHeadsImage={customHeadsImage}
            customTailsImage={customTailsImage}
            gameCoin={gameCoin}
            isMobile={window.innerWidth <= 768}
            address={address}
            isCreator={isCreator}
          />
        </CoinDisplayWrapper>
      </RightSection>
    </TabContainer>
  )
}

export default NFTDetailsTab
