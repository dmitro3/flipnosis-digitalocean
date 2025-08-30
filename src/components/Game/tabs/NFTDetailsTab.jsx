import React, { useState, useEffect } from 'react'
import styled from '@emotion/styled'
import { useAccount } from 'wagmi'
import NFTDetailsContainer from '../../Lobby/NFTDetailsContainer'
import LobbyCoin from '../../Lobby/LobbyCoin'
import { useNotification } from '../../../contexts/NotificationContext'

const TabContainer = styled.div`
  height: 100%;
  display: flex;
  gap: 2rem;
  
  @media (max-width: 1200px) {
    flex-direction: column;
    gap: 1.5rem;
  }
`

const LeftSection = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`

const RightSection = styled.div`
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
`

const CoinDisplayWrapper = styled.div`
  background: rgba(0, 0, 0, 0.8);
  border: 2px solid rgba(255, 215, 0, 0.3);
  border-radius: 1rem;
  padding: 2rem;
  box-shadow: 0 0 20px rgba(255, 215, 0, 0.2);
  position: relative;
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(45deg, transparent 30%, rgba(255, 215, 0, 0.05) 50%, transparent 70%);
    animation: shimmer 3s ease-in-out infinite;
    pointer-events: none;
  }
  
  @keyframes shimmer {
    0%, 100% { transform: translateX(-100%); }
    50% { transform: translateX(100%); }
  }
`

const SectionTitle = styled.h2`
  color: #00FF41;
  font-size: 1.5rem;
  font-weight: bold;
  margin-bottom: 1rem;
  text-shadow: 0 0 10px rgba(0, 255, 65, 0.3);
`

const CoinInstructions = styled.div`
  text-align: center;
  color: rgba(255, 255, 255, 0.8);
  font-size: 1rem;
  margin-bottom: 1rem;
  position: relative;
  z-index: 2;
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
  const [isNFTVerified, setIsNFTVerified] = useState(false)
  const [verificationChecked, setVerificationChecked] = useState(false)

  // Debug logging
  console.log('🔍 NFTDetailsTab Debug:', {
    gameData,
    gameId,
    isCreator,
    isJoiner,
    getGameNFTImage: getGameNFTImage(),
    getGameNFTName: getGameNFTName(),
    getGameNFTCollection: getGameNFTCollection(),
    address
  })

  useEffect(() => {
    // Check NFT verification status
    if (gameData && gameData.nft_deposited) {
      setIsNFTVerified(true)
    }
    setVerificationChecked(true)
  }, [gameData])

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text)
    showSuccess(`${label} copied to clipboard!`)
  }

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
        <SectionTitle>🔍 NFT Verification</SectionTitle>
        
        <NFTDetailsContainer
          gameData={gameData}
          isCreator={isCreator}
          currentTurn={null}
          nftData={nftData}
          currentChain={gameData?.nft_chain || gameData?.chain || 'base'}
        />
      </LeftSection>

      {/* Right Section - Interactive Coin Display */}
      <RightSection>
        <CoinDisplayWrapper>
          <div style={{ position: 'relative', zIndex: 2, width: '100%', textAlign: 'center' }}>
            <SectionTitle style={{ color: '#FFD700' }}>🪙 Interactive Coin</SectionTitle>
            
            <CoinInstructions>
              Click the coin to see it spin and verify its authenticity
            </CoinInstructions>
            
            <LobbyCoin
              size={250}
              customHeadsImage={getGameNFTImage()}
              customTailsImage={getGameNFTImage()}
              material={gameData?.coin_material || 'gold'}
            />
          </div>
        </CoinDisplayWrapper>
      </RightSection>
    </TabContainer>
  )
}

export default NFTDetailsTab
