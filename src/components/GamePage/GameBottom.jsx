import React from 'react'
import styled from '@emotion/styled'
import { useToast } from '../../contexts/ToastContext'
import UnifiedGameChat from '../UnifiedGameChat'

// Styled Components
const BottomSection = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  margin-top: 2rem;
  background: rgba(0, 0, 20, 0.95);
  border-radius: 1rem;
  padding: 2rem;
  
  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
`

const InfoSection = styled.div`
  background: rgba(0, 0, 20, 0.95);
  border: 2px solid ${props => props.theme.colors.neonYellow};
  border-radius: 1rem;
  padding: 1rem;
  height: 400px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 0 30px rgba(255, 215, 0, 0.3);
`

const UnifiedChatSection = styled.div`
  background: rgba(0, 0, 20, 0.95);
  border: 2px solid ${props => props.theme.colors.neonBlue};
  border-radius: 1rem;
  padding: 1rem;
  height: 400px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 0 30px rgba(0, 191, 255, 0.3);
`

const CreatorCountdown = styled.div`
  margin-bottom: 1rem;
  padding: 1rem;
  background: rgba(255, 20, 147, 0.1);
  border-radius: 0.5rem;
  text-align: center;
  border: 1px solid #FF1493;
`

const GameBottom = ({
  gameData,
  gameId,
  address,
  offers,
  wsRef,
  wsConnected,
  isCreator,
  getGameCreator,
  getGameJoiner,
  getGamePrice,
  getGameNFTImage,
  getGameNFTName,
  getGameNFTCollection,
  getGameNFTContract,
  getGameNFTTokenId,
  customHeadsImage,
  customTailsImage
}) => {
  const { showInfo, showSuccess, showError } = useToast()



  return (
    <BottomSection>
      {/* NFT Info Section */}
      <InfoSection>
        <h4 style={{ margin: '0 0 1rem 0', color: '#FFD700' }}>NFT Details</h4>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
          <img 
            src={getGameNFTImage()} 
            alt={getGameNFTName()} 
            style={{ 
              width: '80px', 
              height: '80px', 
              borderRadius: '0.5rem',
              border: '2px solid #FFD700'
            }} 
          />
          <div>
            <h5 style={{ margin: '0 0 0.5rem 0', color: '#FFFFFF' }}>
              {getGameNFTName()}
            </h5>
            <p style={{ margin: '0', color: '#CCCCCC', fontSize: '0.9rem' }}>
              {getGameNFTCollection()}
            </p>
          </div>
        </div>
        
        <div style={{ marginBottom: '1rem' }}>
          <p style={{ margin: '0 0 0.5rem 0', color: '#CCCCCC' }}>
            <strong>Creator:</strong> {getGameCreator().slice(0, 6)}...{getGameCreator().slice(-4)}
          </p>
          {getGameJoiner() && (
            <p style={{ margin: '0 0 0.5rem 0', color: '#CCCCCC' }}>
              <strong>Player:</strong> {getGameJoiner().slice(0, 6)}...{getGameJoiner().slice(-4)}
            </p>
          )}
          <p style={{ margin: '0 0 0.5rem 0', color: '#FFD700', fontSize: '1.2rem', fontWeight: 'bold' }}>
            Price: ${(getGamePrice() || 0).toFixed(2)} USD
          </p>
          <p style={{ margin: '0', color: '#CCCCCC', fontSize: '0.9rem' }}>
            <strong>Chain:</strong> Base (ETH)
          </p>
        </div>
        
        {/* External Links */}
        {getGameNFTContract() && getGameNFTTokenId() && (
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <a 
                href={`https://basescan.org/token/${getGameNFTContract()}?a=${getGameNFTTokenId()}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  background: '#00BFFF',
                  color: '#000',
                  padding: '0.25rem 0.5rem',
                  borderRadius: '0.25rem',
                  textDecoration: 'none',
                  fontSize: '0.8rem',
                  fontWeight: 'bold'
                }}
              >
                Explorer
              </a>
              <a 
                href={`https://opensea.io/assets/base/${getGameNFTContract()}/${getGameNFTTokenId()}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  background: '#00FF41',
                  color: '#000',
                  padding: '0.25rem 0.5rem',
                  borderRadius: '0.25rem',
                  textDecoration: 'none',
                  fontSize: '0.8rem',
                  fontWeight: 'bold'
                }}
              >
                OpenSea
              </a>
            </div>
          </div>
        )}
        
        {/* Coin Display */}
        <div style={{ marginBottom: '1rem' }}>
          <p style={{ margin: '0 0 0.5rem 0', color: '#CCCCCC', fontSize: '0.9rem' }}>
            <strong>Coin:</strong>
          </p>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <div style={{ textAlign: 'center' }}>
              <img 
                src={customHeadsImage} 
                alt="Heads" 
                style={{ 
                  width: '40px', 
                  height: '40px', 
                  borderRadius: '0.25rem',
                  border: '2px solid #FFD700'
                }} 
              />
              <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.7rem', color: '#CCCCCC' }}>
                Heads
              </p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <img 
                src={customTailsImage} 
                alt="Tails" 
                style={{ 
                  width: '40px', 
                  height: '40px', 
                  borderRadius: '0.25rem',
                  border: '2px solid #FFD700'
                }} 
              />
              <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.7rem', color: '#CCCCCC' }}>
                Tails
              </p>
            </div>
          </div>
        </div>
        
        <div style={{ marginTop: 'auto' }}>
          <p style={{ margin: '0', color: '#CCCCCC', fontSize: '0.8rem' }}>
            Status: {gameData?.status || 'Unknown'}
          </p>
          <p style={{ margin: '0.25rem 0 0 0', color: '#CCCCCC', fontSize: '0.8rem' }}>
            Type: Game
          </p>
        </div>
      </InfoSection>
      
      {/* Unified Chat & Offers Section */}
      <UnifiedChatSection>
        <UnifiedGameChat 
          gameId={gameId}
          gameData={gameData}
          isCreator={isCreator}
          socket={wsRef}
          connected={wsConnected}
          offeredNFTs={offers}
          onOfferSubmitted={(offerData) => {
            console.log('Offer submitted via unified chat:', offerData)
            // Handle offer submission if needed
          }}
          onOfferAccepted={(offer) => {
            console.log('Offer accepted via unified chat:', offer)
            // Handle offer acceptance if needed
          }}
        />
      </UnifiedChatSection>
    </BottomSection>
  )
}

export default GameBottom 