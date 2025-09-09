import React from 'react'
import styled from '@emotion/styled'

const NFTContainer = styled.div`
  background: rgba(0, 0, 40, 0.95);
  padding: 1.5rem;
  border-radius: 1rem;
  border: 2px solid #FF1493;
  backdrop-filter: blur(10px);
  box-shadow: 0 0 30px rgba(255, 20, 147, 0.3), inset 0 0 20px rgba(255, 20, 147, 0.1);
  min-height: 200px;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
  
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
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid rgba(255, 20, 147, 0.3);
`

const NFTTitle = styled.h3`
  margin: 0;
  color: #FF1493;
  font-size: 1.2rem;
  font-weight: bold;
`

const NFTImage = styled.div`
  width: 80px;
  height: 80px;
  border-radius: 0.5rem;
  background: rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1rem;
  border: 2px solid rgba(255, 20, 147, 0.3);
  overflow: hidden;
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`

const NFTItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  
  &:last-child {
    border-bottom: none;
  }
`

const NFTLabel = styled.span`
  color: #00BFFF;
  font-weight: 500;
`

const NFTValue = styled.span`
  color: #fff;
  font-weight: bold;
  word-break: break-all;
`

const VerificationBadge = styled.div`
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.8rem;
  font-weight: bold;
  background: ${props => props.verified ? 'rgba(0, 255, 65, 0.2)' : 'rgba(255, 149, 0, 0.2)'};
  border: 1px solid ${props => props.verified ? 'rgba(0, 255, 65, 0.4)' : 'rgba(255, 149, 0, 0.4)'};
  color: ${props => props.verified ? '#00FF41' : '#FF9500'};
`

const NFTDetailsContainer = ({ gameData, nftData }) => {
  const getNFTImage = () => {
    if (nftData?.image) return nftData.image
    if (gameData?.nft_image) return gameData.nft_image
    return '/placeholder-nft.svg'
  }

  const getNFTName = () => {
    if (nftData?.name) return nftData.name
    if (gameData?.nft_name) return gameData.nft_name
    return 'Unknown NFT'
  }

  const getNFTContract = () => {
    if (nftData?.contract_address) return nftData.contract_address
    if (gameData?.nft_contract_address) return gameData.nft_contract_address
    return 'N/A'
  }

  const getNFTTokenId = () => {
    if (nftData?.token_id) return nftData.token_id
    if (gameData?.nft_token_id) return gameData.nft_token_id
    return 'N/A'
  }

  const isNFTVerified = () => {
    return gameData?.nft_verified === true || nftData?.verified === true
  }

  return (
    <NFTContainer>
      <NFTHeader>
        <NFTTitle>💎 NFT Details</NFTTitle>
        <VerificationBadge verified={isNFTVerified()}>
          {isNFTVerified() ? '✅ Verified' : '⚠️ Unverified'}
        </VerificationBadge>
      </NFTHeader>
      
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
          <NFTImage>
            <img src={getNFTImage()} alt={getNFTName()} />
          </NFTImage>
        </div>
        
        <NFTItem>
          <NFTLabel>Name:</NFTLabel>
          <NFTValue>{getNFTName()}</NFTValue>
        </NFTItem>
        
        <NFTItem>
          <NFTLabel>Contract:</NFTLabel>
          <NFTValue style={{ fontSize: '0.8rem' }}>
            {getNFTContract().slice(0, 8)}...{getNFTContract().slice(-6)}
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
        
        {!isNFTVerified() && (
          <div style={{ 
            marginTop: '1rem', 
            padding: '0.75rem', 
            background: 'rgba(255, 149, 0, 0.1)', 
            borderRadius: '0.5rem',
            border: '1px solid rgba(255, 149, 0, 0.3)'
          }}>
            <div style={{ color: '#FF9500', fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>
              ⚠️ NFT Not Verified
            </div>
            <div style={{ color: '#fff', fontSize: '0.8rem' }}>
              This NFT has not been verified on-chain. Proceed with caution.
            </div>
          </div>
        )}
      </div>
    </NFTContainer>
  )
}

export default NFTDetailsContainer 