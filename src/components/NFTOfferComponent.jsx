import React, { useState } from 'react'
import { useWallet } from '../contexts/WalletContext'
import { useToast } from '../contexts/ToastContext'
import PaymentService from '../services/PaymentService'
import { ethers } from 'ethers'
import { theme } from '../styles/theme'

const NFTOfferComponent = ({ 
  gameId, 
  gameData, 
  isCreator, 
  socket, 
  connected,
  offeredNFTs = [],
  onOfferSubmitted,
  onOfferAccepted 
}) => {
  const { isConnected, address, nfts } = useWallet()
  const { showSuccess, showError, showInfo } = useToast()
  const [selectedNFT, setSelectedNFT] = useState(null)
  const [isSubmittingOffer, setIsSubmittingOffer] = useState(false)
  const [showNFTSelector, setShowNFTSelector] = useState(false)

  const handleSubmitOffer = async () => {
    if (!selectedNFT || !connected || !socket) return

    try {
      setIsSubmittingOffer(true)
      showInfo('Submitting NFT offer...')

      // Create the offer data
      const offerData = {
        type: 'nft_offer',
        gameId,
        offererAddress: address,
        nft: {
          contractAddress: selectedNFT.contractAddress,
          tokenId: selectedNFT.tokenId,
          name: selectedNFT.name,
          image: selectedNFT.image,
          collection: selectedNFT.collection,
          chain: selectedNFT.chain
        },
        timestamp: new Date().toISOString()
      }

      // Send offer via WebSocket
      socket.send(JSON.stringify(offerData))
      
      showSuccess('NFT offer submitted! Waiting for creator to accept...')
      setSelectedNFT(null)
      setShowNFTSelector(false)
      
      if (onOfferSubmitted) {
        onOfferSubmitted(offerData)
      }
      
    } catch (error) {
      console.error('Error submitting offer:', error)
      showError('Failed to submit offer: ' + error.message)
    } finally {
      setIsSubmittingOffer(false)
    }
  }

  const handleAcceptOffer = async (offer) => {
    if (!isCreator || !connected || !socket) return

    try {
      showInfo('Accepting NFT challenge...')

      // Send acceptance via WebSocket
      const acceptanceData = {
        type: 'accept_nft_offer',
        gameId,
        creatorAddress: address,
        acceptedOffer: offer,
        timestamp: new Date().toISOString()
      }

      socket.send(JSON.stringify(acceptanceData))
      
      if (onOfferAccepted) {
        onOfferAccepted(offer)
      }
      
    } catch (error) {
      console.error('Error accepting offer:', error)
      showError('Failed to accept offer: ' + error.message)
    }
  }

  const getExplorerLink = (nft) => {
    const explorers = {
      ethereum: 'https://etherscan.io',
      base: 'https://basescan.org',
      polygon: 'https://polygonscan.com',
      arbitrum: 'https://arbiscan.io'
    }
    const explorer = explorers[nft.chain?.toLowerCase()] || explorers.ethereum
    return `${explorer}/token/${nft.contractAddress}?a=${nft.tokenId}`
  }

  const getOpenSeaLink = (nft) => {
    const chains = {
      ethereum: 'ethereum',
      base: 'base',
      polygon: 'matic',
      arbitrum: 'arbitrum'
    }
    const chain = chains[nft.chain?.toLowerCase()] || 'ethereum'
    return `https://opensea.io/assets/${chain}/${nft.contractAddress}/${nft.tokenId}`
  }

  // If user is the creator, show offers from other players
  if (isCreator) {
    return (
      <div style={{
        background: 'rgba(0, 255, 65, 0.1)',
        border: '2px solid rgba(0, 255, 65, 0.3)',
        borderRadius: '1rem',
        padding: '1.5rem',
        marginTop: '1rem'
      }}>
        <h3 style={{
          color: '#00FF41',
          fontSize: '1.2rem',
          marginBottom: '1rem',
          textAlign: 'center'
        }}>
          💎 NFT Battle Offers ({offeredNFTs.length})
        </h3>

        {offeredNFTs.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '2rem',
            color: 'rgba(255, 255, 255, 0.7)'
          }}>
            <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
            <p>Waiting for players to offer their NFTs...</p>
            <p style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>
              Share your game link to attract challengers!
            </p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gap: '1rem',
            maxHeight: '400px',
            overflowY: 'auto'
          }}>
            {offeredNFTs.map((offer, index) => (
              <div
                key={index}
                style={{
                  background: 'rgba(0, 0, 0, 0.4)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '0.75rem',
                  padding: '1rem',
                  display: 'flex',
                  gap: '1rem',
                  alignItems: 'center'
                }}
              >
                <img
                  src={offer.nft.image}
                  alt={offer.nft.name}
                  style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '0.5rem',
                    objectFit: 'cover'
                  }}
                />
                
                <div style={{ flex: 1 }}>
                  <h4 style={{ 
                    color: 'white', 
                    margin: '0 0 0.25rem 0',
                    fontSize: '1rem'
                  }}>
                    {offer.nft.name}
                  </h4>
                  <p style={{ 
                    color: 'rgba(255, 255, 255, 0.7)',
                    margin: '0 0 0.5rem 0',
                    fontSize: '0.8rem'
                  }}>
                    {offer.nft.collection}
                  </p>
                  <div style={{ 
                    color: 'rgba(255, 255, 255, 0.5)',
                    fontSize: '0.7rem',
                    marginBottom: '0.5rem'
                  }}>
                    From: {offer.offererAddress ? `${offer.offererAddress.slice(0, 6)}...${offer.offererAddress.slice(-4)}` : 'Unknown'}
                  </div>
                  
                  {/* Verification Links */}
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <a
                      href={getExplorerLink(offer.nft)}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        background: 'rgba(255, 255, 255, 0.1)',
                        color: '#00FF41',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '0.25rem',
                        fontSize: '0.7rem',
                        textDecoration: 'none',
                        border: '1px solid rgba(0, 255, 65, 0.3)'
                      }}
                    >
                      🔍 Verify
                    </a>
                    <a
                      href={getOpenSeaLink(offer.nft)}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        background: 'rgba(255, 255, 255, 0.1)',
                        color: '#00BFFF',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '0.25rem',
                        fontSize: '0.7rem',
                        textDecoration: 'none',
                        border: '1px solid rgba(0, 191, 255, 0.3)'
                      }}
                    >
                      🛍️ OpenSea
                    </a>
                  </div>
                </div>
                
                <button
                  onClick={() => handleAcceptOffer(offer)}
                  style={{
                    background: 'linear-gradient(45deg, #00FF41, #39FF14)',
                    color: '#000',
                    border: 'none',
                    borderRadius: '0.5rem',
                    padding: '0.75rem 1.5rem',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseOver={(e) => {
                    e.target.style.transform = 'scale(1.05)'
                    e.target.style.boxShadow = '0 0 15px rgba(0, 255, 65, 0.5)'
                  }}
                  onMouseOut={(e) => {
                    e.target.style.transform = 'scale(1)'
                    e.target.style.boxShadow = 'none'
                  }}
                >
                  ⚔️ BATTLE!
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  // If user is not the creator and game is waiting for NFT offers
  if (!isCreator && gameData?.gameType === 'nft-vs-nft' && gameData?.status === 'waiting') {
    return (
      <div style={{
        background: 'rgba(255, 20, 147, 0.1)',
        border: '2px solid rgba(255, 20, 147, 0.3)',
        borderRadius: '1rem',
        padding: '1.5rem',
        marginTop: '1rem'
      }}>
        <h3 style={{
          color: '#FF1493',
          fontSize: '1.2rem',
          marginBottom: '1rem',
          textAlign: 'center'
        }}>
          ⚔️ Challenge with Your NFT!
        </h3>

        <div style={{
          background: 'rgba(0, 0, 0, 0.3)',
          padding: '1rem',
          borderRadius: '0.75rem',
          marginBottom: '1rem'
        }}>
          <h4 style={{ color: 'white', margin: '0 0 0.5rem 0' }}>
            Creator's NFT:
          </h4>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <img
              src={gameData.nft.image}
              alt={gameData.nft.name}
              style={{
                width: '60px',
                height: '60px',
                borderRadius: '0.5rem',
                objectFit: 'cover'
              }}
            />
            <div>
              <div style={{ color: 'white', fontWeight: 'bold' }}>
                {gameData.nft.name}
              </div>
              <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.8rem' }}>
                {gameData.nft.collection}
              </div>
            </div>
          </div>
        </div>

        {selectedNFT ? (
          <div style={{
            background: 'rgba(0, 0, 0, 0.3)',
            padding: '1rem',
            borderRadius: '0.75rem',
            marginBottom: '1rem'
          }}>
            <h4 style={{ color: 'white', margin: '0 0 0.5rem 0' }}>
              Your NFT:
            </h4>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <img
                src={selectedNFT.image}
                alt={selectedNFT.name}
                style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '0.5rem',
                  objectFit: 'cover'
                }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ color: 'white', fontWeight: 'bold' }}>
                  {selectedNFT.name}
                </div>
                <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.8rem' }}>
                  {selectedNFT.collection}
                </div>
              </div>
              <button
                onClick={() => setSelectedNFT(null)}
                style={{
                  background: 'rgba(255, 0, 0, 0.2)',
                  color: 'white',
                  border: '1px solid rgba(255, 0, 0, 0.5)',
                  borderRadius: '0.25rem',
                  padding: '0.25rem 0.5rem',
                  cursor: 'pointer',
                  fontSize: '0.8rem'
                }}
              >
                Change
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowNFTSelector(true)}
            style={{
              width: '100%',
              padding: '1rem',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '2px dashed rgba(255, 20, 147, 0.5)',
              borderRadius: '0.75rem',
              color: '#FF1493',
              cursor: 'pointer',
              marginBottom: '1rem'
            }}
          >
            Select Your NFT to Battle
          </button>
        )}

        <div style={{
          background: 'rgba(255, 215, 0, 0.1)',
          border: '1px solid rgba(255, 215, 0, 0.3)',
          borderRadius: '0.5rem',
          padding: '0.75rem',
          marginBottom: '1rem',
          fontSize: '0.8rem'
        }}>
          <strong style={{ color: '#FFD700' }}>⚠️ Battle Rules:</strong>
          <br />
          • Winner takes both NFTs<br />
          • You pay $0.50 only if your offer is accepted<br />
          • Best of 5 rounds
        </div>

        <button
          onClick={handleSubmitOffer}
          disabled={!selectedNFT || isSubmittingOffer || !connected}
          style={{
            width: '100%',
            padding: '1rem',
            background: selectedNFT ? 
              'linear-gradient(45deg, #FF1493, #FF69B4)' : 
              'rgba(255, 255, 255, 0.1)',
            color: 'white',
            border: 'none',
            borderRadius: '0.75rem',
            fontWeight: 'bold',
            cursor: selectedNFT ? 'pointer' : 'not-allowed',
            fontSize: '1rem',
            opacity: selectedNFT ? 1 : 0.5,
            transition: 'all 0.3s ease'
          }}
        >
          {isSubmittingOffer ? 'Submitting Offer...' : '⚔️ Submit Battle Offer!'}
        </button>

        {/* NFT Selector Modal */}
        {showNFTSelector && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backdropFilter: 'blur(5px)'
          }}>
            <div style={{
              background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(25, 20, 0, 0.9) 100%)',
              border: '2px solid #FF1493',
              borderRadius: '1rem',
              padding: '2rem',
              maxWidth: '600px',
              maxHeight: '80vh',
              overflowY: 'auto',
              position: 'relative'
            }}>
              <button
                onClick={() => setShowNFTSelector(false)}
                style={{
                  position: 'absolute',
                  top: '1rem',
                  right: '1rem',
                  background: 'rgba(255, 0, 0, 0.2)',
                  border: '1px solid rgba(255, 0, 0, 0.5)',
                  borderRadius: '50%',
                  width: '30px',
                  height: '30px',
                  color: 'white',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                ✕
              </button>

              <h3 style={{ color: '#FF1493', marginBottom: '1rem' }}>
                Select Your Battle NFT
              </h3>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                gap: '1rem'
              }}>
                {nfts?.map((nft) => (
                  <div
                    key={nft.id}
                    onClick={() => {
                      setSelectedNFT(nft)
                      setShowNFTSelector(false)
                    }}
                    style={{
                      background: 'rgba(255, 255, 255, 0.1)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '0.75rem',
                      padding: '1rem',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      textAlign: 'center'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.transform = 'scale(1.05)'
                      e.currentTarget.style.borderColor = '#FF1493'
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.transform = 'scale(1)'
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)'
                    }}
                  >
                    <img
                      src={nft.image}
                      alt={nft.name}
                      style={{
                        width: '100%',
                        aspectRatio: '1',
                        objectFit: 'cover',
                        borderRadius: '0.5rem',
                        marginBottom: '0.5rem'
                      }}
                    />
                    <div style={{
                      color: 'white',
                      fontWeight: 'bold',
                      fontSize: '0.9rem',
                      marginBottom: '0.25rem',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {nft.name}
                    </div>
                    <div style={{
                      color: 'rgba(255, 255, 255, 0.7)',
                      fontSize: '0.8rem',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {nft.collection}
                    </div>
                  </div>
                ))}
              </div>

              {(!nfts || nfts.length === 0) && (
                <div style={{
                  textAlign: 'center',
                  color: 'rgba(255, 255, 255, 0.7)',
                  padding: '2rem'
                }}>
                  No NFTs found in your wallet
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    )
  }

  return null
}

export default NFTOfferComponent 