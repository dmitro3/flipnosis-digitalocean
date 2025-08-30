import React, { useState, useEffect } from 'react'
import styled from '@emotion/styled'
import CoinContainer from '../../GameOrchestrator/CoinContainer'

const TabContainer = styled.div`
  height: 100%;
  display: flex;
  flex-direction: row;
  gap: 2rem;
  padding: 2rem;
  overflow-y: auto;
  
  @media (max-width: 768px) {
    flex-direction: column;
    padding: 1rem;
    gap: 1.5rem;
  }
`

const NFTSection = styled.div`
  background: rgba(0, 0, 40, 0.95);
  padding: 1.5rem;
  border-radius: 1rem;
  border: 2px solid #FF1493;
  backdrop-filter: blur(10px);
  box-shadow: 0 0 30px rgba(255, 20, 147, 0.3), inset 0 0 20px rgba(255, 20, 147, 0.1);
  position: relative;
  overflow: hidden;
  flex: 2;
  
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
  margin-bottom: 1.5rem;
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
  border-radius: 1rem;
  font-size: 0.8rem;
  font-weight: bold;
  background: ${props => props.verified ? 'rgba(0, 255, 65, 0.2)' : 'rgba(255, 149, 0, 0.2)'};
  border: 1px solid ${props => props.verified ? 'rgba(0, 255, 65, 0.4)' : 'rgba(255, 149, 0, 0.4)'};
  color: ${props => props.verified ? '#00FF41' : '#FF9500'};
`

const NFTContent = styled.div`
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 2rem;
  align-items: start;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
`

const NFTImageContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
`

const NFTImage = styled.div`
  width: 200px;
  height: 200px;
  border-radius: 1rem;
  background: rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid rgba(255, 20, 147, 0.3);
  overflow: hidden;
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  
  @media (max-width: 768px) {
    width: 150px;
    height: 150px;
  }
`

const NFTDetails = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`

const NFTItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 0.5rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
`

const NFTLabel = styled.span`
  color: #00BFFF;
  font-weight: 500;
  font-size: 1rem;
`

const NFTValue = styled.span`
  color: #fff;
  font-weight: bold;
  word-break: break-all;
  text-align: right;
  max-width: 60%;
`

const CoinSection = styled.div`
  background: rgba(0, 0, 0, 0.7);
  border: 3px solid rgba(255, 215, 0, 0.3);
  border-radius: 1rem;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 20px rgba(255, 215, 0, 0.2);
  min-height: 400px;
  flex: 1;
  max-width: 400px;
`

const GameInfo = styled.div`
  background: rgba(0, 191, 255, 0.1);
  border: 1px solid rgba(0, 191, 255, 0.3);
  border-radius: 0.5rem;
  padding: 1rem;
  margin-top: 1rem;
`

const GameInfoTitle = styled.h4`
  margin: 0 0 0.5rem 0;
  color: #00BFFF;
  font-size: 1.1rem;
`

const GameInfoItem = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
  
  &:last-child {
    margin-bottom: 0;
  }
`

const ActionButtons = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
  flex-wrap: wrap;
`

const ActionButton = styled.button`
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  font-weight: bold;
  font-size: 0.9rem;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  text-decoration: none;
  
  &.share-x {
    background: linear-gradient(45deg, #1DA1F2, #0d8bd9);
    color: white;
    
    &:hover {
      background: linear-gradient(45deg, #0d8bd9, #0a7bc4);
    }
  }
  
  &.share-tg {
    background: linear-gradient(45deg, #0088cc, #006bb3);
    color: white;
    
    &:hover {
      background: linear-gradient(45deg, #006bb3, #005a99);
    }
  }
  
  &.opensea {
    background: linear-gradient(45deg, #2081e2, #1a6dc7);
    color: white;
    
    &:hover {
      background: linear-gradient(45deg, #1a6dc7, #1559ad);
    }
  }
  
  &.explorer {
    background: linear-gradient(45deg, #00BFFF, #0080FF);
    color: white;
    
    &:hover {
      background: linear-gradient(45deg, #0080FF, #0060FF);
    }
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`

const NFTDetailsTab = ({ gameData, gameId, coinConfig, address, isCreator }) => {
  const [nftData, setNftData] = useState(null)

  // Load NFT data
  useEffect(() => {
    if (gameData) {
      setNftData({
        image: gameData.nft_image,
        name: gameData.nft_name,
        contract_address: gameData.nft_contract_address,
        token_id: gameData.nft_token_id,
        collection: gameData.nft_collection,
        verified: gameData.nft_verified
      })
    }
  }, [gameData])

  // Helper function to get marketplace URL based on chain
  const getMarketplaceUrl = (chain) => {
    if (!chain) return 'https://opensea.io/assets/ethereum' // Default to Ethereum marketplace
    
    const marketplaces = {
      ethereum: 'https://opensea.io/assets/ethereum',
      polygon: 'https://opensea.io/assets/matic',
      base: 'https://opensea.io/assets/base',
      arbitrum: 'https://opensea.io/assets/arbitrum',
      optimism: 'https://opensea.io/assets/optimism',
    }
    
    return marketplaces[chain.toLowerCase()] || 'https://opensea.io/assets/ethereum'
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
    
    const baseUrl = explorers[chain.toLowerCase()] || 'https://etherscan.io/token'
    return `${baseUrl}/${contract}?a=${tokenId}`
  }

  // Share functionality
  const handleShare = async (platform) => {
    if (!gameData || !address) return
    
    const gameUrl = `${window.location.origin}/game/${gameId}`
    const nftName = getNFTName()
    const gamePrice = getGamePrice()
    
    try {
      const message = platform === 'twitter' 
        ? `🎮 Join my Flip on Flipnosis!!!\n\n💎 ${nftName} vs $${gamePrice.toFixed(2)} USD\n\n🔥 Bidding is live! Click to join now!\n\n${gameUrl}\n\n#FLIPNOSIS #NFTGaming #Web3`
        : `🎮 Join my Flip on Flipnosis!\n\n💎 ${nftName} vs $${gamePrice.toFixed(2)} USD\n\nClick to join: ${gameUrl}`
      
      const shareUrls = {
        twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}`,
        telegram: `https://t.me/share/url?url=${encodeURIComponent(gameUrl)}&text=${encodeURIComponent(message)}`
      }
      
      if (shareUrls[platform]) {
        window.open(shareUrls[platform], '_blank', 'width=600,height=400')
      }
    } catch (error) {
      console.error('Share failed:', error)
    }
  }

  const getNFTImage = () => {
    if (nftData?.image) return nftData.image
    return '/placeholder-nft.svg'
  }

  const getNFTName = () => {
    if (nftData?.name) return nftData.name
    return 'Unknown NFT'
  }

  const getNFTContract = () => {
    if (nftData?.contract_address) return nftData.contract_address
    return 'N/A'
  }

  const getNFTTokenId = () => {
    if (nftData?.token_id) return nftData.token_id
    return 'N/A'
  }

  const isNFTVerified = () => {
    return gameData?.nft_verified === true
  }

  const getGamePrice = () => {
    return gameData?.payment_amount || 
           gameData?.price_usd || 
           gameData?.final_price || 
           gameData?.price || 
           gameData?.asking_price || 
           gameData?.priceUSD || 
           0
  }

  const getGameStatus = () => {
    switch (gameData?.status) {
      case 'waiting_challenger':
      case 'awaiting_challenger':
      case 'waiting_for_challenger':
        return 'Waiting for challenger'
      case 'waiting_challenger_deposit':
        return 'Waiting for deposit'
      case 'active':
      case 'in_progress':
        return 'Game in progress'
      case 'completed':
        return 'Game completed'
      default:
        return gameData?.status || 'Unknown'
    }
  }

  return (
    <TabContainer>
      {/* NFT Details Section - Left Side */}
      <NFTSection>
        <NFTHeader>
          <NFTTitle>💎 NFT Details</NFTTitle>
          <VerificationBadge verified={isNFTVerified()}>
            {isNFTVerified() ? '✅ Verified' : '⚠️ Unverified'}
          </VerificationBadge>
        </NFTHeader>
        
        <NFTContent>
          <NFTImageContainer>
            <NFTImage>
              <img src={getNFTImage()} alt={getNFTName()} />
            </NFTImage>
          </NFTImageContainer>
          
          <NFTDetails>
            <NFTItem>
              <NFTLabel>Name:</NFTLabel>
              <NFTValue>{getNFTName()}</NFTValue>
            </NFTItem>
            
            <NFTItem>
              <NFTLabel>Contract:</NFTLabel>
              <NFTValue style={{ fontSize: '0.9rem' }}>
                {getNFTContract() !== 'N/A' 
                  ? `${getNFTContract().slice(0, 8)}...${getNFTContract().slice(-6)}`
                  : 'N/A'
                }
              </NFTValue>
            </NFTItem>
            
            <NFTItem>
              <NFTLabel>Token ID:</NFTLabel>
              <NFTValue>{getNFTTokenId()}</NFTValue>
            </NFTItem>
            
            <NFTItem>
              <NFTLabel>Chain:</NFTLabel>
              <NFTValue>{gameData?.chain || 'Base'}</NFTValue>
            </NFTItem>
            
            {gameData?.nft_collection && (
              <NFTItem>
                <NFTLabel>Collection:</NFTLabel>
                <NFTValue>{gameData.nft_collection}</NFTValue>
              </NFTItem>
            )}

            <GameInfo>
              <GameInfoTitle>🎮 Game Information</GameInfoTitle>
              <GameInfoItem>
                <span style={{ color: '#00BFFF' }}>Price:</span>
                <span style={{ color: '#FFD700', fontWeight: 'bold' }}>
                  ${getGamePrice().toFixed(2)} USD
                </span>
              </GameInfoItem>
              <GameInfoItem>
                <span style={{ color: '#00BFFF' }}>Status:</span>
                <span style={{ color: '#00FF41' }}>{getGameStatus()}</span>
              </GameInfoItem>
              <GameInfoItem>
                <span style={{ color: '#00BFFF' }}>Your Role:</span>
                <span style={{ color: '#FF1493' }}>
                  {isCreator ? 'Creator' : 'Challenger/Spectator'}
                </span>
              </GameInfoItem>
            </GameInfo>

            {/* Action Buttons */}
            <ActionButtons>
              <ActionButton 
                className="share-x"
                onClick={() => handleShare('twitter')}
                disabled={!address}
              >
                Share on X
              </ActionButton>
              <ActionButton 
                className="share-tg"
                onClick={() => handleShare('telegram')}
                disabled={!address}
              >
                Share on TG
              </ActionButton>
              <a
                href={getNFTContract() !== 'N/A' && getNFTTokenId() !== 'N/A' ? 
                  `${getMarketplaceUrl(gameData?.chain || 'base')}/${getNFTContract()}/${getNFTTokenId()}` :
                  '#'
                }
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => {
                  if (getNFTContract() === 'N/A' || getNFTTokenId() === 'N/A') {
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
                href={getExplorerUrl(gameData?.chain || 'base', getNFTContract(), getNFTTokenId())}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => {
                  if (getNFTContract() === 'N/A' || getNFTTokenId() === 'N/A') {
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
            </ActionButtons>
          </NFTDetails>
        </NFTContent>
      </NFTSection>
      
      {/* Coin Display Section - Right Side */}
      <CoinSection>
        <CoinContainer
          gameId={gameId}
          gameData={gameData}
          customHeadsImage={coinConfig?.headsImage}
          customTailsImage={coinConfig?.tailsImage}
          gameCoin={coinConfig}
          isMobile={window.innerWidth <= 768}
          address={address}
          isCreator={isCreator}
        />
      </CoinSection>
    </TabContainer>
  )
}

export default NFTDetailsTab
