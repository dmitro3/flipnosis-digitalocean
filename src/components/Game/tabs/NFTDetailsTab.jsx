import React, { useState, useEffect } from 'react'
import styled from '@emotion/styled'
import { useAccount } from 'wagmi'
import OptimizedCoinWrapper from '../OptimizedCoinWrapper'
import NFTDetailsContainer from '../../Lobby/NFTDetailsContainer'
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

const NFTDetailsWrapper = styled.div`
  background: rgba(0, 0, 0, 0.8);
  border: 2px solid rgba(0, 255, 65, 0.3);
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: 0 0 20px rgba(0, 255, 65, 0.2);
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(45deg, transparent 30%, rgba(0, 255, 65, 0.05) 50%, transparent 70%);
    animation: shimmer 3s ease-in-out infinite;
    pointer-events: none;
  }
  
  @keyframes shimmer {
    0%, 100% { transform: translateX(-100%); }
    50% { transform: translateX(100%); }
  }
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
  text-align: center;
  text-shadow: 0 0 10px rgba(0, 255, 65, 0.5);
  position: relative;
  z-index: 2;
`

const VerificationBadge = styled.div`
  background: ${props => props.$verified ? 
    'linear-gradient(135deg, #00FF41, #39FF14)' : 
    'linear-gradient(135deg, #FF6B6B, #FF4444)'
  };
  color: ${props => props.$verified ? '#000' : '#fff'};
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  font-weight: bold;
  font-size: 0.9rem;
  text-align: center;
  margin-bottom: 1rem;
  position: relative;
  z-index: 2;
  
  ${props => props.$verified && `
    animation: pulse 2s ease-in-out infinite;
    
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.8; }
    }
  `}
`

const ContractInfo = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.5rem;
  padding: 1rem;
  margin-top: 1rem;
  position: relative;
  z-index: 2;
`

const ContractLabel = styled.div`
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.8rem;
  margin-bottom: 0.25rem;
`

const ContractValue = styled.div`
  color: #fff;
  font-family: monospace;
  font-size: 0.9rem;
  word-break: break-all;
  cursor: pointer;
  transition: color 0.2s ease;
  
  &:hover {
    color: #00FF41;
  }
`

const CoinInstructions = styled.div`
  text-align: center;
  color: rgba(255, 255, 255, 0.8);
  font-size: 1rem;
  margin-bottom: 1rem;
  position: relative;
  z-index: 2;
`

const NFTDetailsTab = ({ gameData, gameId, isCreator, isJoiner }) => {
  const { address } = useAccount()
  const { showSuccess, showError } = useNotification()
  const [isNFTVerified, setIsNFTVerified] = useState(false)
  const [verificationChecked, setVerificationChecked] = useState(false)

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

  const getGameNFTImage = () => {
    return gameData?.nft_image || '/placeholder-nft.svg'
  }

  const getGameNFTName = () => {
    return gameData?.nft_name || 'Unknown NFT'
  }

  const getGameNFTCollection = () => {
    return gameData?.nft_collection || 'Unknown Collection'
  }

  const nftData = {
    image: getGameNFTImage(),
    name: getGameNFTName(),
    collection: getGameNFTCollection(),
    contractAddress: gameData?.nft_contract,
    tokenId: gameData?.nft_token_id,
    chain: gameData?.nft_chain || 'base'
  }

  return (
    <TabContainer>
      {/* Left Section - NFT Details */}
      <LeftSection>
        <SectionTitle>🔍 NFT Verification</SectionTitle>
        
        <NFTDetailsWrapper>
          {verificationChecked && (
            <VerificationBadge $verified={isNFTVerified}>
              {isNFTVerified ? '✅ NFT Verified & Deposited' : '⚠️ NFT Not Verified'}
            </VerificationBadge>
          )}
          
          <NFTDetailsContainer
            gameData={gameData}
            isCreator={isCreator}
            currentTurn={null}
            nftData={nftData}
            currentChain={gameData?.nft_chain || 'base'}
          />
          
          {/* Contract Information */}
          {gameData?.nft_contract && (
            <ContractInfo>
              <ContractLabel>Contract Address</ContractLabel>
              <ContractValue 
                onClick={() => copyToClipboard(gameData.nft_contract, 'Contract address')}
                title="Click to copy"
              >
                {gameData.nft_contract}
              </ContractValue>
              
              {gameData?.nft_token_id && (
                <>
                  <ContractLabel style={{ marginTop: '0.5rem' }}>Token ID</ContractLabel>
                  <ContractValue 
                    onClick={() => copyToClipboard(gameData.nft_token_id, 'Token ID')}
                    title="Click to copy"
                  >
                    {gameData.nft_token_id}
                  </ContractValue>
                </>
              )}
              
              <ContractLabel style={{ marginTop: '0.5rem' }}>Chain</ContractLabel>
              <ContractValue>
                {gameData?.nft_chain || 'base'} Network
              </ContractValue>
            </ContractInfo>
          )}
        </NFTDetailsWrapper>
      </LeftSection>

      {/* Right Section - Spinning Coin Display */}
      <RightSection>
        <CoinDisplayWrapper>
          <div style={{ position: 'relative', zIndex: 2, width: '100%' }}>
            <SectionTitle style={{ color: '#FFD700' }}>🪙 Interactive Coin</SectionTitle>
            
            <CoinInstructions>
              Click the coin to see it spin and verify its authenticity
            </CoinInstructions>
            
            <OptimizedCoinWrapper
              gameId={gameId}
              gameData={gameData}
              customHeadsImage={gameData?.nft_image}
              customTailsImage={gameData?.nft_image}
              gameCoin={null}
              isMobile={window.innerWidth <= 768}
              address={address}
              isCreator={isCreator}
            />
          </div>
        </CoinDisplayWrapper>
      </RightSection>
    </TabContainer>
  )
}

export default NFTDetailsTab
