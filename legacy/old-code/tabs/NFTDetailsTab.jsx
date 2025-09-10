import React, { useState, useEffect } from 'react'
import styled from '@emotion/styled'
import CoinContainer from '../../GameOrchestrator/CoinContainer'

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
  padding: 1.25rem;
  border-radius: 1rem;
  border: 2px solid #FF1493;
  backdrop-filter: blur(10px);
  box-shadow: 0 0 30px rgba(255, 20, 147, 0.3), inset 0 0 20px rgba(255, 20, 147, 0.1);
  position: relative;
  overflow: hidden;
  flex: 2;
  height: fit-content;
  max-height: 100%;
  min-height: 0;
  z-index: 1;
  
  @media (max-width: 1200px) {
    padding: 1rem;
    flex: 1.5;
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
  cursor: ${props => props.verified ? 'default' : 'help'};
  position: relative;
  z-index: 100;
  
  &:hover::after {
    content: ${props => props.verified ? 'none' : '"⚠️ This NFT has not been verified. Proceed with caution."'};
    position: absolute;
    top: 100%;
    right: 0;
    background: rgba(255, 149, 0, 0.9);
    color: white;
    padding: 0.5rem;
    border-radius: 0.5rem;
    font-size: 0.7rem;
    white-space: nowrap;
    z-index: 1000;
    margin-top: 0.5rem;
    max-width: 200px;
    word-wrap: break-word;
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
  
  @media (max-width: 480px) {
    gap: 0.75rem;
  }
`

const NFTImageContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
`

const ShareButtonsContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
  width: 100%;
  margin-top: 2rem;
  position: relative;
  z-index: 100;
  
  @media (max-width: 1200px) {
    margin-top: 1.5rem;
    gap: 0.4rem;
  }
  
  @media (max-width: 768px) {
    margin-top: 1.25rem;
    gap: 0.3rem;
  }
  
  @media (max-width: 480px) {
    margin-top: 1rem;
    gap: 0.25rem;
  }
`

const NFTImage = styled.div`
  width: 180px;
  height: 180px;
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
  
  @media (max-width: 1200px) {
    width: 160px;
    height: 160px;
  }
  
  @media (max-width: 768px) {
    width: 140px;
    height: 140px;
  }
  
  @media (max-width: 480px) {
    width: 120px;
    height: 120px;
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
  padding: 0.6rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 0.5rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  
  @media (max-width: 1200px) {
    padding: 0.5rem;
  }
  
  @media (max-width: 768px) {
    padding: 0.45rem;
  }
  
  @media (max-width: 480px) {
    padding: 0.4rem;
  }
`

const NFTLabel = styled.span`
  color: #00BFFF;
  font-weight: 500;
  font-size: 0.9rem;
  
  @media (max-width: 1200px) {
    font-size: 0.85rem;
  }
  
  @media (max-width: 768px) {
    font-size: 0.8rem;
  }
  
  @media (max-width: 480px) {
    font-size: 0.75rem;
  }
`

const NFTValue = styled.span`
  color: #fff;
  font-weight: bold;
  word-break: break-all;
  text-align: right;
  max-width: 60%;
  font-size: 0.9rem;
  
  @media (max-width: 1200px) {
    font-size: 0.85rem;
    max-width: 55%;
  }
  
  @media (max-width: 768px) {
    font-size: 0.8rem;
    max-width: 50%;
  }
  
  @media (max-width: 480px) {
    font-size: 0.75rem;
    max-width: 45%;
  }
`

const CoinSection = styled.div`
  background: transparent;
  border: none;
  border-radius: 1rem;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: fit-content;
  max-height: 100%;
  min-height: 0;
  flex: 1;
  max-width: 350px;
  position: relative;
  z-index: 1;
  
  @media (max-width: 1200px) {
    padding: 1.25rem;
    max-width: 300px;
  }
  
  @media (max-width: 768px) {
    padding: 1rem;
    max-width: 100%;
    width: 100%;
  }
  
  @media (max-width: 480px) {
    padding: 0.75rem;
  }
`

const GameInfo = styled.div`
  background: rgba(0, 191, 255, 0.1);
  border: 1px solid rgba(0, 191, 255, 0.3);
  border-radius: 0.5rem;
  padding: 0.8rem;
  margin-top: 0.8rem;
  
  @media (max-width: 1200px) {
    padding: 0.7rem;
    margin-top: 0.7rem;
  }
  
  @media (max-width: 768px) {
    padding: 0.6rem;
    margin-top: 0.6rem;
  }
  
  @media (max-width: 480px) {
    padding: 0.5rem;
    margin-top: 0.5rem;
  }
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



const ActionButton = styled.button`
  padding: 0.6rem 1rem;
  border: none;
  border-radius: 0.75rem;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.85rem;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  text-decoration: none;
  position: relative;
  z-index: 100;
  min-width: 100px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  backdrop-filter: blur(10px);
  
  @media (max-width: 1200px) {
    padding: 0.5rem 0.8rem;
    font-size: 0.8rem;
    min-width: 90px;
    gap: 0.3rem;
  }
  
  @media (max-width: 768px) {
    padding: 0.45rem 0.7rem;
    font-size: 0.75rem;
    min-width: 80px;
    gap: 0.25rem;
  }
  
  @media (max-width: 480px) {
    padding: 0.4rem 0.6rem;
    font-size: 0.7rem;
    min-width: 70px;
    gap: 0.2rem;
  }
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    border-radius: 0.75rem;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
    opacity: 0;
    transition: opacity 0.3s ease;
  }
  
  &:hover::before {
    opacity: 1;
  }
  
  &:active {
    transform: translateY(1px);
    box-shadow: 0 2px 4px -1px rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.06);
  }
  
  &.share-x {
    background: linear-gradient(135deg, #000000 0%, #1a1a1a 50%, #000000 100%);
    color: white;
    border: 1px solid rgba(255, 255, 255, 0.1);
    
    &:hover {
      background: linear-gradient(135deg, #1a1a1a 0%, #333333 50%, #1a1a1a 100%);
      border-color: rgba(255, 255, 255, 0.2);
      box-shadow: 0 8px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.2);
    }
  }
  
  &.share-tg {
    background: linear-gradient(135deg, #0088cc 0%, #0099dd 50%, #0088cc 100%);
    color: white;
    border: 1px solid rgba(255, 255, 255, 0.1);
    
    &:hover {
      background: linear-gradient(135deg, #0099dd 0%, #00aaff 50%, #0099dd 100%);
      border-color: rgba(255, 255, 255, 0.2);
      box-shadow: 0 8px 15px -3px rgba(0, 136, 204, 0.3), 0 4px 6px -2px rgba(0, 136, 204, 0.2);
    }
  }
  
  &.opensea {
    background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 50%, #ffffff 100%);
    color: #2081e2;
    border: 2px solid #2081e2;
    
    &:hover {
      background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 50%, #f8f9fa 100%);
      border-color: #0056b3;
      color: #0056b3;
      box-shadow: 0 8px 15px -3px rgba(32, 129, 226, 0.2), 0 4px 6px -2px rgba(32, 129, 226, 0.1);
    }
  }
  
  &.explorer {
    background: linear-gradient(135deg, #6c757d 0%, #7a8288 50%, #6c757d 100%);
    color: white;
    border: 1px solid rgba(255, 255, 255, 0.1);
    
    &:hover {
      background: linear-gradient(135deg, #7a8288 0%, #868e96 50%, #7a8288 100%);
      border-color: rgba(255, 255, 255, 0.2);
      box-shadow: 0 8px 15px -3px rgba(108, 117, 125, 0.3), 0 4px 6px -2px rgba(108, 117, 125, 0.2);
    }
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`

const NFTDetailsTab = ({ gameData, gameId, coinConfig, address, isCreator }) => {
  const [nftData, setNftData] = useState(null)
  const [coinData, setCoinData] = useState(null)

  // Load NFT data and coin data
  useEffect(() => {
    if (gameData) {
      console.log('🪙 NFTDetailsTab - gameData received:', gameData)
      
      setNftData({
        image: gameData.nft_image,
        name: gameData.nft_name,
        contract_address: gameData.nft_contract, // Fixed: use nft_contract instead of nft_contract_address
        token_id: gameData.nft_token_id,
        collection: gameData.nft_collection,
        verified: gameData.nft_verified
      })

      // Parse coin data from gameData
      let parsedCoinData = null
      if (gameData.coinData && typeof gameData.coinData === 'object') {
        parsedCoinData = gameData.coinData
        console.log('🪙 Using gameData.coinData:', parsedCoinData)
      } else if (gameData.coin_data) {
        try {
          parsedCoinData = typeof gameData.coin_data === 'string' ? 
            JSON.parse(gameData.coin_data) : gameData.coin_data
          console.log('🪙 Parsed gameData.coin_data:', parsedCoinData)
        } catch (error) {
          console.error('❌ Error parsing coin data:', error)
        }
      } else {
        console.log('🪙 No coin data found in gameData, using default')
        parsedCoinData = {
          id: 'plain',
          type: 'default',
          name: 'Classic',
          headsImage: '/coins/plainh.png',
          tailsImage: '/coins/plaint.png'
        }
      }
      setCoinData(parsedCoinData)
    }
  }, [gameData])

  // Helper function to get marketplace URL based on chain
  const getMarketplaceUrl = (chain) => {
    if (!chain) return 'https://opensea.io/assets/base' // Default to Base marketplace
    
    const marketplaces = {
      ethereum: 'https://opensea.io/assets/ethereum',
      polygon: 'https://opensea.io/assets/matic',
      base: 'https://opensea.io/assets/base',
      arbitrum: 'https://opensea.io/assets/arbitrum',
      optimism: 'https://opensea.io/assets/optimism',
    }
    
    return marketplaces[chain.toLowerCase()] || 'https://opensea.io/assets/base'
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

  // Share functionality
  const handleShare = async (platform) => {
    if (!gameData) return
    
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
            </ShareButtonsContainer>
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
                <span style={{ color: '#FFD700', fontWeight: 'bold', fontSize: '1.8rem' }}>
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
          </NFTDetails>
        </NFTContent>
      </NFTSection>
      
       {/* Coin Display Section - Right Side */}
               <CoinSection>
          {coinData ? (
            <CoinContainer
              gameId={gameId}
              gameData={gameData}
              customHeadsImage={coinData.headsImage}
              customTailsImage={coinData.tailsImage}
              gameCoin={coinData}
              isMobile={window.innerWidth <= 768}
              address={address}
              isCreator={isCreator}
            />
          ) : (
            <div style={{ color: 'white', textAlign: 'center' }}>
              <p>Loading coin...</p>
              <p>Coin data: {JSON.stringify(coinData)}</p>
              <p>Coin config: {JSON.stringify(coinConfig)}</p>
            </div>
          )}
        </CoinSection>
    </TabContainer>
  )
}

export default NFTDetailsTab
