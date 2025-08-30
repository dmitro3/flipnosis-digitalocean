import React from 'react'
import styled from '@emotion/styled'

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

const NFTInfo = styled.div`
  position: relative;
  z-index: 2;
  color: white;
`

const NFTImage = styled.img`
  width: 200px;
  height: 200px;
  object-fit: cover;
  border-radius: 1rem;
  border: 2px solid rgba(255, 215, 0, 0.3);
  cursor: pointer;
  transition: transform 0.3s ease;
  
  &:hover {
    transform: scale(1.05) rotate(5deg);
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

const InfoRow = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
  
  .label {
    color: rgba(255, 255, 255, 0.7);
  }
  
  .value {
    color: #00FF41;
    font-weight: bold;
  }
`

const NFTDetailsTabSimple = ({ gameData, gameId, isCreator, isJoiner }) => {
  return (
    <TabContainer>
      {/* Left Section - NFT Details */}
      <LeftSection>
        <SectionTitle>🔍 NFT Verification</SectionTitle>
        
        <NFTDetailsWrapper>
          <VerificationBadge $verified={gameData?.nft_deposited}>
            {gameData?.nft_deposited ? '✅ NFT Verified & Deposited' : '⚠️ NFT Not Verified'}
          </VerificationBadge>
          
          <NFTInfo>
            <InfoRow>
              <span className="label">Name:</span>
              <span className="value">{gameData?.nft_name || 'Unknown NFT'}</span>
            </InfoRow>
            <InfoRow>
              <span className="label">Collection:</span>
              <span className="value">{gameData?.nft_collection || 'Unknown Collection'}</span>
            </InfoRow>
            <InfoRow>
              <span className="label">Chain:</span>
              <span className="value">{gameData?.nft_chain || 'base'}</span>
            </InfoRow>
            <InfoRow>
              <span className="label">Contract:</span>
              <span className="value" style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                {gameData?.nft_contract ? 
                  `${gameData.nft_contract.slice(0, 6)}...${gameData.nft_contract.slice(-4)}` : 
                  'N/A'
                }
              </span>
            </InfoRow>
            <InfoRow>
              <span className="label">Token ID:</span>
              <span className="value">{gameData?.nft_token_id || 'N/A'}</span>
            </InfoRow>
          </NFTInfo>
        </NFTDetailsWrapper>
      </LeftSection>

      {/* Right Section - Spinning Coin Display */}
      <RightSection>
        <CoinDisplayWrapper>
          <div style={{ position: 'relative', zIndex: 2, width: '100%', textAlign: 'center' }}>
            <SectionTitle style={{ color: '#FFD700' }}>🪙 Interactive Coin</SectionTitle>
            
            <CoinInstructions>
              Click the coin to see it spin and verify its authenticity
            </CoinInstructions>
            
            <NFTImage
              src={gameData?.nft_image || '/placeholder-nft.svg'}
              alt={gameData?.nft_name || 'NFT'}
              onError={(e) => {
                e.target.src = '/placeholder-nft.svg'
              }}
            />
            
            <div style={{ marginTop: '1rem', color: 'rgba(255, 255, 255, 0.7)' }}>
              This is your game coin!
            </div>
          </div>
        </CoinDisplayWrapper>
      </RightSection>
    </TabContainer>
  )
}

export default NFTDetailsTabSimple
