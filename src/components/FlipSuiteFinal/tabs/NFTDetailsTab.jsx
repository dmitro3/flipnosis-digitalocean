import React, { useState, useEffect } from 'react'
import styled from '@emotion/styled'
import OptimizedGoldCoin from '../../OptimizedGoldCoin'

const TabContainer = styled.div`
  height: 100%;
  display: flex;
  flex-direction: row;
  gap: 1.5rem;
  padding: 1.5rem;
  overflow-y: auto;
  align-items: flex-start;
  min-height: 0;
  
  @media (max-width: 1200px) {
    gap: 1rem;
    padding: 1rem;
  }
  
  @media (max-width: 768px) {
    flex-direction: column;
    padding: 1rem;
    gap: 1rem;
    align-items: stretch;
  }
  
  @media (max-width: 480px) {
    padding: 0.75rem;
    gap: 0.75rem;
  }
`

const NFTSection = styled.div`
  background: rgba(0, 0, 40, 0.95);
  padding: 1rem;
  border-radius: 1rem;
  border: 2px solid #FF1493;
  backdrop-filter: blur(10px);
  box-shadow: 0 0 30px rgba(255, 20, 147, 0.3), inset 0 0 20px rgba(255, 20, 147, 0.1);
  position: relative;
  overflow: hidden;
  flex: 1.2;
  height: fit-content;
  max-height: 100%;
  min-height: 0;
  z-index: 1;
  
  @media (max-width: 1200px) {
    padding: 0.75rem;
    flex: 1;
  }
  
  @media (max-width: 768px) {
    padding: 1rem;
    flex: none;
    width: 100%;
    max-height: none;
  }
  
  @media (max-width: 480px) {
    padding: 0.75rem;
  }
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(45deg, transparent 30%, rgba(255, 20, 147, 0.1) 50%, transparent 70%);
    animation: shimmer 3s ease-in-out infinite;
    pointer-events: none;
    z-index: -1;
  }
  
  @keyframes shimmer {
    0%, 100% { transform: translateX(-100%); }
    50% { transform: translateX(100%); }
  }
`

const NFTHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid rgba(255, 20, 147, 0.3);
`

const NFTTitle = styled.h2`
  margin: 0;
  color: #FF1493;
  font-size: 1.4rem;
  font-weight: bold;
`

const VerificationBadge = styled.div`
  padding: 0.5rem 1rem;
  background: ${props => props.verified ? 'rgba(0, 255, 65, 0.2)' : 'rgba(255, 149, 0, 0.2)'};
  border: 1px solid ${props => props.verified ? '#00FF41' : '#FF9500'};
  border-radius: 0.5rem;
  color: ${props => props.verified ? '#00FF41' : '#FF9500'};
  font-size: 0.8rem;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 1px;
`

const NFTImage = styled.img`
  width: 100%;
  max-width: 200px;
  height: auto;
  border-radius: 0.75rem;
  border: 2px solid rgba(255, 20, 147, 0.3);
  margin-bottom: 1rem;
  transition: all 0.3s ease;
  
  &:hover {
    border-color: #FF1493;
    box-shadow: 0 0 20px rgba(255, 20, 147, 0.4);
  }
`

const NFTInfo = styled.div`
  margin-bottom: 1rem;
`

const InfoRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
  padding: 0.25rem 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`

const InfoLabel = styled.span`
  color: #aaa;
  font-size: 0.9rem;
  font-weight: 500;
`

const InfoValue = styled.span`
  color: white;
  font-weight: bold;
  font-size: 1rem;
`

const PriceDisplay = styled.div`
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.2), rgba(255, 193, 7, 0.1));
  border: 2px solid #FFD700;
  border-radius: 0.75rem;
  padding: 0.75rem;
  text-align: center;
  margin-bottom: 1rem;
`

const PriceLabel = styled.div`
  color: #aaa;
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
`

const PriceValue = styled.div`
  color: #FFD700;
  font-size: 1.8rem;
  font-weight: bold;
  text-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
`

const SocialButtons = styled.div`
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1rem;
`

const SocialButton = styled.button`
  flex: 1;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 0.5rem;
  color: white;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.2);
    border-color: rgba(255, 255, 255, 0.4);
    transform: translateY(-2px);
  }
`

const NFTContent = styled.div`
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 1.5rem;
  align-items: start;
  
  @media (max-width: 1200px) {
    gap: 1rem;
  }
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
`

const NFTImageContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
`

const NFTDetailsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`

const ShareButtonsContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
  width: 100%;
  margin-top: 1rem;
`

const ActionButton = styled.button`
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 0.5rem;
  color: white;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  
  &:hover {
    background: rgba(255, 255, 255, 0.2);
    border-color: rgba(255, 255, 255, 0.4);
    transform: translateY(-2px);
  }
  
  &:active {
    transform: translateY(0);
  }
  
  &.share-x {
    background: linear-gradient(135deg, #1da1f2 0%, #0d8bd9 50%, #1da1f2 100%);
    border-color: #1da1f2;
  }
  
  &.share-tg {
    background: linear-gradient(135deg, #0088cc 0%, #006699 50%, #0088cc 100%);
    border-color: #0088cc;
  }
  
  &.opensea {
    background: linear-gradient(135deg, #2081e2 0%, #1a6bb8 50%, #2081e2 100%);
    border-color: #2081e2;
  }
  
  &.explorer {
    background: linear-gradient(135deg, #6c757d 0%, #7a8288 50%, #6c757d 100%);
    border-color: #6c757d;
  }
`

const CoinSection = styled.div`
  background: rgba(0, 0, 40, 0.95);
  padding: 1.25rem;
  border-radius: 1rem;
  border: 2px solid #00BFFF;
  backdrop-filter: blur(10px);
  box-shadow: 0 0 30px rgba(0, 191, 255, 0.3), inset 0 0 20px rgba(0, 191, 255, 0.1);
  position: relative;
  overflow: hidden;
  flex: 1;
  height: fit-content;
  max-height: 100%;
  min-height: 0;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  
  @media (max-width: 1200px) {
    padding: 1rem;
  }
  
  @media (max-width: 768px) {
    padding: 1rem;
    flex: none;
    width: 100%;
    max-height: none;
  }
  
  @media (max-width: 480px) {
    padding: 0.75rem;
  }
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(45deg, transparent 30%, rgba(0, 191, 255, 0.1) 50%, transparent 70%);
    animation: shimmer 3s ease-in-out infinite;
    pointer-events: none;
    z-index: -1;
  }
`

const CoinHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid rgba(0, 191, 255, 0.3);
  width: 100%;
`

const CoinTitle = styled.h2`
  margin: 0;
  color: #00BFFF;
  font-size: 1.4rem;
  font-weight: bold;
`

const DemoLabel = styled.div`
  padding: 0.5rem 1rem;
  background: rgba(255, 215, 0, 0.2);
  border: 1px solid #FFD700;
  border-radius: 0.5rem;
  color: #FFD700;
  font-size: 0.8rem;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 1px;
`

const CoinContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  width: 100%;
`

const CoinInfo = styled.div`
  text-align: center;
  color: #aaa;
  font-size: 0.9rem;
  line-height: 1.5;
`

const NFTDetailsTab = ({ gameData, gameId, coinConfig, address }) => {
  const [isDemoFlipping, setIsDemoFlipping] = useState(false)
  const [demoResult, setDemoResult] = useState(null)

  // Helper functions for NFT data
  const getNFTName = () => {
    return gameData?.nft_name || 'Unknown NFT'
  }

  const getNFTCollection = () => {
    return gameData?.nft_collection || 'Unknown Collection'
  }

  const getNFTTokenId = () => {
    return gameData?.nft_token_id || 'Unknown'
  }

  const getNFTContract = () => {
    return gameData?.nft_contract || 'Unknown'
  }

  const getNFTChain = () => {
    return gameData?.nft_chain || 'Unknown'
  }

  const getNFTImage = () => {
    return gameData?.nft_image || '/placeholder-nft.svg'
  }

  // Helper function to get marketplace URL
  const getMarketplaceUrl = (chain) => {
    const marketplaces = {
      ethereum: 'https://opensea.io/assets/ethereum',
      polygon: 'https://opensea.io/assets/matic',
      base: 'https://opensea.io/assets/base',
      arbitrum: 'https://opensea.io/assets/arbitrum',
      optimism: 'https://opensea.io/assets/optimism',
    }
    return marketplaces[chain?.toLowerCase()] || 'https://opensea.io/assets/base'
  }

  // Helper function to get explorer URL
  const getExplorerUrl = (chain, contract, tokenId) => {
    if (!chain || !contract || !tokenId) return '#'
    
    const explorers = {
      ethereum: 'https://etherscan.io/token',
      polygon: 'https://polygonscan.com/token',
      base: 'https://basescan.org/token',
      arbitrum: 'https://arbiscan.io/token',
      optimism: 'https://optimistic.etherscan.io/token',
    }
    
    const baseUrl = explorers[chain.toLowerCase()] || 'https://basescan.org/token'
    return `${baseUrl}/${contract}?a=${tokenId}`
  }

  // Share functions
  const handleShare = (platform) => {
    const gameUrl = window.location.href
    const nftName = getNFTName()
    const collection = getNFTCollection()
    
    let shareUrl = ''
    let shareText = ''
    
    switch (platform) {
      case 'twitter':
        shareText = `Check out this NFT flip game! 🎮\n\n${nftName} from ${collection}\n\nJoin the game: ${gameUrl}`
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`
        break
      case 'telegram':
        shareText = `Check out this NFT flip game! 🎮\n\n${nftName} from ${collection}\n\nJoin the game: ${gameUrl}`
        shareUrl = `https://t.me/share/url?url=${encodeURIComponent(gameUrl)}&text=${encodeURIComponent(shareText)}`
        break
      default:
        return
    }
    
    window.open(shareUrl, '_blank', 'width=600,height=400')
  }

  const handleDemoFlip = () => {
    // For demo coin, we'll trigger a temporary flip animation
    // by temporarily setting the flip state
    setIsDemoFlipping(true)
    
    // Set a temporary result immediately to trigger the animation
    const result = Math.random() > 0.5 ? 'heads' : 'tails'
    setDemoResult(result)
    
    // Stop flipping after animation duration
    setTimeout(() => {
      setIsDemoFlipping(false)
    }, 2000)
  }

  if (!gameData) {
    return (
      <TabContainer>
        <div style={{ color: 'white', textAlign: 'center', width: '100%' }}>
          Loading NFT details...
        </div>
      </TabContainer>
    )
  }

  return (
    <TabContainer>
      {/* NFT Details Section */}
      <NFTSection>
        <NFTHeader>
          <NFTTitle>🎨 NFT Details</NFTTitle>
          <VerificationBadge verified={gameData?.nft_verified || gameData?.verified}>
            {gameData?.nft_verified || gameData?.verified ? '✓ Verified' : '⚠️ Unverified'}
          </VerificationBadge>
        </NFTHeader>

        <NFTContent>
          <NFTImageContainer>
            <NFTImage 
              src={getNFTImage()} 
              alt={getNFTName()}
            />
            
            {/* Share Buttons - 2x2 Grid */}
            <ShareButtonsContainer>
              <ActionButton 
                className="share-x"
                onClick={() => handleShare('twitter')}
              >
                Share on X
              </ActionButton>
              <ActionButton 
                className="share-tg"
                onClick={() => handleShare('telegram')}
              >
                Share on TG
              </ActionButton>
              <a
                href={getNFTContract() !== 'Unknown' && getNFTTokenId() !== 'Unknown' ? 
                  `${getMarketplaceUrl(getNFTChain())}/${getNFTContract()}/${getNFTTokenId()}` :
                  '#'
                }
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => {
                  if (getNFTContract() === 'Unknown' || getNFTTokenId() === 'Unknown') {
                    e.preventDefault()
                    console.error('NFT contract details not available')
                  }
                }}
                style={{ textDecoration: 'none' }}
              >
                <ActionButton className="opensea">
                  <img 
                    src="/images/opensea.png" 
                    alt="OpenSea" 
                    style={{ 
                      width: '16px', 
                      height: '16px',
                      objectFit: 'contain'
                    }} 
                  />
                  OpenSea
                </ActionButton>
              </a>
              <a
                href={getExplorerUrl(getNFTChain(), getNFTContract(), getNFTTokenId())}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => {
                  if (getNFTContract() === 'Unknown' || getNFTTokenId() === 'Unknown') {
                    e.preventDefault()
                    console.error('NFT contract details not available')
                  }
                }}
                style={{ textDecoration: 'none' }}
              >
                <ActionButton className="explorer">
                  🔍 Explorer
                </ActionButton>
              </a>
            </ShareButtonsContainer>
          </NFTImageContainer>

          <NFTDetailsContainer>
            <NFTInfo>
              <InfoRow>
                <InfoLabel>Name:</InfoLabel>
                <InfoValue>{getNFTName()}</InfoValue>
              </InfoRow>
              <InfoRow>
                <InfoLabel>Collection:</InfoLabel>
                <InfoValue>{getNFTCollection()}</InfoValue>
              </InfoRow>
              <InfoRow>
                <InfoLabel>Token ID:</InfoLabel>
                <InfoValue>#{getNFTTokenId()}</InfoValue>
              </InfoRow>
              <InfoRow>
                <InfoLabel>Contract:</InfoLabel>
                <InfoValue>
                  {getNFTContract() !== 'Unknown' ? 
                    `${getNFTContract().slice(0, 6)}...${getNFTContract().slice(-4)}` : 
                    'Unknown'
                  }
                </InfoValue>
              </InfoRow>
              <InfoRow>
                <InfoLabel>Chain:</InfoLabel>
                <InfoValue>{getNFTChain()}</InfoValue>
              </InfoRow>
            </NFTInfo>

            <PriceDisplay>
              <PriceLabel>Game Value</PriceLabel>
              <PriceValue>${gameData.price_usd || 0}</PriceValue>
            </PriceDisplay>
          </NFTDetailsContainer>
        </NFTContent>
      </NFTSection>

      {/* Demo Coin Section */}
      <CoinSection>
        <CoinHeader>
          <CoinTitle>🪙 Demo Coin</CoinTitle>
          <DemoLabel>Interactive</DemoLabel>
        </CoinHeader>

        <CoinContainer>
          <OptimizedGoldCoin
            isFlipping={isDemoFlipping}
            flipResult={demoResult}
            flipDuration={2000}
            onFlipComplete={() => console.log('Demo flip complete')}
            customHeadsImage={coinConfig?.headsImage}
            customTailsImage={coinConfig?.tailsImage}
            size={180}
            material={coinConfig?.material}
            isInteractive={true}
            onCoinClick={handleDemoFlip}
            isPlayerTurn={false}
            gamePhase="demo"
            chargingPlayer={null}
            creatorPower={0}
            joinerPower={0}
            isCreator={false}
            creatorChoice={null}
            joinerChoice={null}
          />

          <CoinInfo>
            Click the coin to see a demo flip!<br/>
            This shows how the actual game coin will look and behave.
          </CoinInfo>

          {coinConfig && (
            <div style={{ marginTop: '1rem', textAlign: 'center', color: '#00BFFF' }}>
              <div style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                Custom Coin Design
              </div>
              <div style={{ fontSize: '0.8rem', color: '#aaa' }}>
                Material: {coinConfig.material?.name || 'Gold'}<br/>
                Heads: {coinConfig.headsImage ? 'Custom' : 'Default'}<br/>
                Tails: {coinConfig.tailsImage ? 'Custom' : 'Default'}
              </div>
            </div>
          )}
        </CoinContainer>
      </CoinSection>
    </TabContainer>
  )
}

export default NFTDetailsTab
