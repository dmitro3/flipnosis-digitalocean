import React, { useState } from 'react'
import styled from '@emotion/styled'
import { useToast } from '../../contexts/ToastContext'
import { getApiUrl } from '../../config/api'
import GameChatBox from '../GameChatBox'
import NFTOfferComponent from '../NFTOfferComponent'

// Styled Components
const BottomSection = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
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
  border: 2px solid ${props => props.theme.colors.neonPink};
  border-radius: 1rem;
  padding: 1rem;
  height: 400px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 0 30px rgba(255, 20, 147, 0.3);
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
  depositTimeLeft,
  wsRef,
  wsConnected,
  isCreator,
  isJoiner,
  getGameCreator,
  getGameJoiner,
  getGamePrice,
  getGameNFTImage,
  getGameNFTName,
  getGameNFTCollection,
  getGameNFTContract,
  getGameNFTTokenId,
  customHeadsImage,
  customTailsImage,
  formatTimeLeft,
  newOffer,
  creatingOffer,
  setNewOffer,
  createOffer,
  acceptOffer,
  rejectOffer
}) => {
  const { showInfo, showSuccess, showError } = useToast()

  const handleCreateOffer = async () => {
    if (!newOffer.price) {
      showError('Please enter an offer price')
      return
    }

    setCreatingOffer(true)
    try {
      await createOffer()
      setNewOffer({ price: '', message: '' })
      showSuccess('Offer created successfully!')
    } catch (error) {
      showError('Failed to create offer')
    } finally {
      setCreatingOffer(false)
    }
  }

  const handleAcceptOffer = async (offerId, offerPrice) => {
    try {
      await acceptOffer(offerId, offerPrice)
      showSuccess('Offer accepted! Waiting for challenger to deposit payment...')
    } catch (error) {
      showError('Failed to accept offer')
    }
  }

  const handleRejectOffer = async (offerId) => {
    try {
      await rejectOffer(offerId)
      showSuccess('Offer rejected')
    } catch (error) {
      showError('Failed to reject offer')
    }
  }

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
      
      {/* Chat Section */}
      <ChatSection>
        <h4 style={{ margin: '0 0 1rem 0', color: '#00BFFF' }}>Game Chat</h4>
        <GameChatBox 
          gameId={gameId} 
          socket={wsRef} 
          connected={wsConnected}
        />
      </ChatSection>
      
      {/* Offers Section */}
      <OffersSection>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h4 style={{ margin: 0, color: '#FF1493' }}>NFT Offers</h4>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ 
              width: '8px', 
              height: '8px', 
              borderRadius: '50%', 
              background: '#00FF41',
              animation: 'pulse 2s infinite'
            }}></div>
            <span style={{ color: '#00FF41', fontSize: '0.8rem' }}>Live</span>
          </div>
        </div>
        
        {/* Creator countdown */}
        {isCreator() && gameData?.status === 'waiting_challenger_deposit' && depositTimeLeft !== null && (
          <CreatorCountdown>
            <p style={{ color: '#FF1493', margin: '0 0 0.5rem 0', fontWeight: 'bold' }}>
              Waiting for challenger to deposit
            </p>
            <p style={{ color: '#FFD700', margin: 0, fontSize: '1.2rem', fontWeight: 'bold' }}>
              {formatTimeLeft(depositTimeLeft)}
            </p>
          </CreatorCountdown>
        )}
        
        {/* Offer Creation Form - Only show for non-creators */}
        {!isCreator() && (
          <div style={{ marginBottom: '1rem', padding: '1rem', background: 'rgba(255, 20, 147, 0.1)', borderRadius: '0.5rem' }}>
            <h5 style={{ margin: '0 0 0.5rem 0', color: '#FF1493' }}>Make an Offer</h5>
            <input
              type="number"
              placeholder="Offer price (USD)"
              value={newOffer.price}
              onChange={(e) => setNewOffer(prev => ({ ...prev, price: e.target.value }))}
              style={{
                width: '100%',
                marginBottom: '0.5rem',
                padding: '0.5rem',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: 'white',
                borderRadius: '0.25rem'
              }}
            />
            <input
              type="text"
              placeholder="Message (optional)"
              value={newOffer.message}
              onChange={(e) => setNewOffer(prev => ({ ...prev, message: e.target.value }))}
              style={{
                width: '100%',
                marginBottom: '0.5rem',
                padding: '0.5rem',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: 'white',
                borderRadius: '0.25rem'
              }}
            />
            <button
              onClick={handleCreateOffer}
              disabled={creatingOffer || !newOffer.price}
              style={{
                width: '100%',
                background: '#FF1493',
                color: '#000',
                border: 'none',
                padding: '0.5rem',
                borderRadius: '0.25rem',
                cursor: creatingOffer ? 'not-allowed' : 'pointer',
                opacity: creatingOffer ? 0.5 : 1,
                fontWeight: 'bold'
              }}
            >
              {creatingOffer ? 'Creating...' : 'Submit Offer'}
            </button>
          </div>
        )}
        
        {/* Creator message */}
        {isCreator() && (
          <div style={{ marginBottom: '1rem', padding: '1rem', background: 'rgba(0, 255, 65, 0.1)', borderRadius: '0.5rem', textAlign: 'center' }}>
            <p style={{ color: '#00FF41', margin: 0, fontSize: '0.9rem' }}>
              You are the creator. You can accept or reject offers below.
            </p>
          </div>
        )}
        
        {/* Offers List */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {offers.length === 0 ? (
            <p style={{ color: '#CCCCCC', textAlign: 'center', marginTop: '2rem' }}>
              No offers yet
            </p>
          ) : (
            offers.map((offer) => (
              <div 
                key={offer.id} 
                style={{ 
                  marginBottom: '1rem', 
                  padding: '1rem', 
                  background: 'rgba(255, 255, 255, 0.05)', 
                  borderRadius: '0.5rem',
                  border: `1px solid ${offer.status === 'accepted' ? '#00FF41' : offer.status === 'rejected' ? '#FF1493' : 'rgba(255, 255, 255, 0.1)'}`
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <strong style={{ color: '#FF1493' }}>
                    {offer.offerer_name || offer.offerer_address.slice(0, 6) + '...' + offer.offerer_address.slice(-4)}
                  </strong>
                  <span style={{ 
                    color: offer.status === 'accepted' ? '#00FF41' : 
                           offer.status === 'rejected' ? '#FF1493' : 
                           '#FFD700',
                    fontSize: '0.8rem',
                    textTransform: 'uppercase'
                  }}>
                    {offer.status}
                  </span>
                </div>
                <p style={{ margin: '0 0 0.5rem 0', color: '#FFD700', fontWeight: 'bold' }}>
                  ${offer.offer_price} USD
                </p>
                {offer.message && (
                  <p style={{ margin: '0 0 0.5rem 0', color: '#CCCCCC', fontSize: '0.9rem' }}>
                    "{offer.message}"
                  </p>
                )}
                {isCreator() && offer.status === 'pending' && (
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={() => handleAcceptOffer(offer.id, offer.offer_price)}
                      style={{
                        flex: 1,
                        background: '#00FF41',
                        color: '#000',
                        border: 'none',
                        padding: '0.25rem',
                        borderRadius: '0.25rem',
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                        fontWeight: 'bold'
                      }}
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleRejectOffer(offer.id)}
                      style={{
                        flex: 1,
                        background: '#FF1493',
                        color: '#000',
                        border: 'none',
                        padding: '0.25rem',
                        borderRadius: '0.25rem',
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                        fontWeight: 'bold'
                      }}
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </OffersSection>
    </BottomSection>
  )
}

export default GameBottom 