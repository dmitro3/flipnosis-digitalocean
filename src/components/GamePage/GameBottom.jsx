import React from 'react'
import styled from '@emotion/styled'
import { useToast } from '../../contexts/ToastContext'
import ChatContainer from './ChatContainer'
import OffersContainer from './OffersContainer'

// Styled Components
const BottomSection = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 2rem;
  margin-top: 2rem;
  background: rgba(0, 0, 20, 0.95);
  border-radius: 1rem;
  padding: 2rem;
  
  @media (max-width: 1200px) {
    grid-template-columns: 1fr 1fr;
    gap: 1.5rem;
  }
  
  @media (max-width: 768px) {
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

const ChatSection = styled.div`
  background: rgba(0, 0, 20, 0.95);
  border: 2px solid ${props => props.theme.colors.neonBlue};
  border-radius: 1rem;
  padding: 1rem;
  height: 400px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 0 30px rgba(0, 191, 255, 0.3);
`

const OffersSection = styled.div`
  background: rgba(0, 0, 20, 0.95);
  border: 2px solid ${props => props.theme.colors.neonGreen};
  border-radius: 1rem;
  padding: 1rem;
  height: 400px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 0 30px rgba(0, 255, 65, 0.3);
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
        
        <div style={{ marginTop: 'auto' }}>
          {/* Status and Type information removed as requested */}
        </div>
      </InfoSection>
      
      {/* Chat Section */}
      <ChatSection>
        <ChatContainer 
          gameId={gameId}
          gameData={gameData}
          isCreator={isCreator}
          socket={wsRef}
          connected={wsConnected}
        />
      </ChatSection>

      {/* Offers Section */}
      <OffersSection>
        <OffersContainer 
          gameId={gameId}
          gameData={gameData}
          socket={wsRef}
          connected={wsConnected}
          onOfferSubmitted={(offerData) => {
            console.log('Offer submitted via offers container:', offerData)
          }}
          onOfferAccepted={(offer) => {
            console.log('Offer accepted via offers container:', offer)
          }}
        />
      </OffersSection>
    </BottomSection>
  )
}

export default GameBottom 