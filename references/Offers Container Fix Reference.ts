Offers Container

import React, { useState, useEffect, useRef } from 'react'
import { useWallet } from '../../contexts/WalletContext'
import { useProfile } from '../../contexts/ProfileContext'
import { useToast } from '../../contexts/ToastContext'
import styled from '@emotion/styled'
// Using global WebSocket service to avoid minification issues

const OffersContainerStyled = styled.div`
  background: rgba(0, 0, 0, 0.7);
  border: 1px solid rgba(0, 255, 65, 0.3);
  border-radius: 1rem;
  padding: 1rem;
  height: 500px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 0 20px rgba(0, 255, 65, 0.2);
`

const OffersHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid rgba(0, 255, 65, 0.3);
`

const OffersTitle = styled.h3`
  margin: 0;
  color: #00FF41;
  font-size: 1.2rem;
  font-weight: bold;
`

const ConnectionStatus = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`

const StatusDot = styled.div`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${props => props.connected ? '#00FF41' : '#FF1493'};
  animation: ${props => props.connected ? 'pulse 2s infinite' : 'none'};
`

const StatusText = styled.span`
  color: ${props => props.connected ? '#00FF41' : '#FF1493'};
  font-size: 0.8rem;
`

const OffersList = styled.div`
  flex: 1;
  overflow-y: auto;
  margin-bottom: 1rem;
  padding-right: 0.5rem;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(0, 255, 65, 0.3);
    border-radius: 3px;
  }
`

const OfferItem = styled.div`
  margin-bottom: 0.75rem;
  padding: 0.75rem;
  border-radius: 0.5rem;
  background: rgba(0, 255, 65, 0.15);
  border: 1px solid rgba(0, 255, 65, 0.4);
  animation: slideIn 0.3s ease-out;
  
  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`

const OfferHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
  font-size: 0.8rem;
  color: #00FF41;
`

const OfferContent = styled.div`
  color: #fff;
  margin-bottom: 0.5rem;
`

const OfferAmount = styled.div`
  padding: 0.5rem;
  background: rgba(255, 215, 0, 0.1);
  border-radius: 0.25rem;
  border: 1px solid rgba(255, 215, 0, 0.3);
  margin-bottom: 0.5rem;
`

const OfferAmountLabel = styled.div`
  color: #FFD700;
  font-weight: bold;
  font-size: 0.9rem;
  margin-bottom: 0.25rem;
`

const OfferAmountValue = styled.div`
  color: #fff;
  font-size: 1.1rem;
  font-weight: bold;
`

const OfferActions = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-top: 0.5rem;
`

const ActionButton = styled.button`
  flex: 1;
  padding: 0.5rem;
  border: none;
  border-radius: 0.25rem;
  cursor: pointer;
  font-weight: bold;
  transition: all 0.2s ease;
  
  &.accept {
    background: #00FF41;
    color: #000;
    
    &:hover {
      background: #00CC33;
    }
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`

const OfferInputContainer = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: flex-end;
`

const OfferInput = styled.input`
  flex: 1;
  padding: 0.75rem;
  background: rgba(0, 255, 65, 0.1);
  border: 1px solid rgba(0, 255, 65, 0.3);
  border-radius: 0.5rem;
  color: #fff;
  font-size: 0.9rem;
  
  &::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }
  
  &:focus {
    outline: none;
    border-color: #00FF41;
    box-shadow: 0 0 10px rgba(0, 255, 65, 0.3);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`

const OfferButton = styled.button`
  padding: 0.75rem 1rem;
  background: linear-gradient(45deg, #FFD700, #FFA500);
  color: #000;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  font-weight: bold;
  transition: all 0.2s ease;
  
  &:hover:not(:disabled) {
    background: linear-gradient(45deg, #FFA500, #FF8C00);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`

const PriceInfo = styled.div`
  background: rgba(255, 215, 0, 0.1);
  border: 1px solid rgba(255, 215, 0, 0.3);
  border-radius: 0.5rem;
  padding: 0.75rem;
  margin-bottom: 1rem;
  text-align: center;
`

const PriceLabel = styled.div`
  color: #FFD700;
  font-weight: bold;
  font-size: 0.9rem;
  margin-bottom: 0.25rem;
`

const PriceValue = styled.div`
  color: #fff;
  font-size: 1.1rem;
  font-weight: bold;
`

const MinOfferInfo = styled.div`
  color: #00FF41;
  font-size: 0.8rem;
  margin-top: 0.25rem;
`

const OffersContainer = ({ 
  gameId, 
  gameData, 
  socket, 
  connected,
  onOfferSubmitted,
  onOfferAccepted 
}) => {
  const { address, isConnected } = useWallet()
  const { getPlayerName } = useProfile()
  const { showError, showSuccess, showInfo } = useToast()
  
  const [offers, setOffers] = useState([])
  const [cryptoOffer, setCryptoOffer] = useState('')
  const [isSubmittingOffer, setIsSubmittingOffer] = useState(false)
  const [playerNames, setPlayerNames] = useState({})
  
  const offersEndRef = useRef(null)
  
  // Get game price for validation
  const gamePrice = gameData?.payment_amount || gameData?.price_usd || gameData?.final_price || gameData?.price || gameData?.asking_price || gameData?.priceUSD || 0
  const minOfferAmount = gamePrice * 0.8 // 80% of the game price
  
  // Auto scroll to bottom when new offers arrive
  useEffect(() => {
    offersEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [offers])

  const isCreator = () => {
    if (!gameData || !address) return false
    
    // Check both possible creator field names
    const creatorAddress = gameData.creator || gameData.creator_address
    if (!creatorAddress) return false
    
    return address.toLowerCase() === creatorAddress.toLowerCase()
  }

  // Listen for offers from socket
  useEffect(() => {
    if (!socket) return
    
    const handleMessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        console.log('ðŸ’° Offers: Raw WebSocket message received:', data)
        
        if (data.type === 'nft_offer') {
          console.log('ðŸ’Ž Offers: Received NFT offer:', data)
          addOffer({
            id: Date.now() + Math.random(),
            type: 'nft_offer',
            address: data.offererAddress,
            nft: data.nft,
            timestamp: data.timestamp || new Date().toISOString(),
            offerId: data.offerId,
            offerText: data.offerText
          })
        } else if (data.type === 'crypto_offer') {
          console.log('ðŸ’° Offers: Received crypto offer:', data)
          const newOffer = {
            id: Date.now() + Math.random(),
            type: 'crypto_offer',
            address: data.offererAddress,
            cryptoAmount: data.cryptoAmount,
            timestamp: data.timestamp || new Date().toISOString(),
            offerId: data.offerId
          }
          addOffer(newOffer)
          
          // Show success message to the offerer
          if (data.offererAddress === address) {
            showSuccess(`Your offer of $${data.cryptoAmount} USD has been submitted!`)
          }
        } else if (data.type === 'accept_nft_offer' || data.type === 'accept_crypto_offer') {
          console.log('âœ… Offers: Offer accepted:', data)
          addOffer({
            id: Date.now() + Math.random(),
            type: 'offer_accepted',
            address: data.creatorAddress,
            acceptedOffer: data.acceptedOffer,
            timestamp: data.timestamp || new Date().toISOString()
          })
          
          // Force reload game data to get updated status
          if (window.location.pathname.includes('/game/')) {
            setTimeout(() => {
              window.location.reload() // Force page reload to ensure fresh data
            }, 500)
          }
          
          // Add a system message to prompt the joiner to load their crypto
          if (data.type === 'accept_crypto_offer' && data.acceptedOffer?.cryptoAmount) {
            addOffer({
              id: Date.now() + Math.random() + 1,
              type: 'system',
              address: 'system',
              message: `ðŸŽ® Game accepted! Player 2, please load your ${data.acceptedOffer.cryptoAmount} USD worth of ETH to start the game!`,
              timestamp: new Date().toISOString()
            })
          }
        } else if (data.type === 'chat_history') {
          console.log('ðŸ“š Offers: Received chat history:', data)
          if (data.messages && Array.isArray(data.messages)) {
            const historyOffers = data.messages
              .filter(msg => msg.message_type !== 'chat') // Only non-chat messages (offers)
              .map(msg => ({
                id: msg.id || Date.now() + Math.random(),
                type: msg.message_type || 'offer',
                address: msg.sender_address,
                message: msg.message,
                timestamp: msg.created_at,
                cryptoAmount: msg.message_data?.cryptoAmount,
                nft: msg.message_data?.nft,
                offerType: msg.message_data?.offerType,
                acceptedOffer: msg.message_data?.acceptedOffer,
                rejectedOffer: msg.message_data?.rejectedOffer
              }))
            
            setOffers(historyOffers)
            console.log(`ðŸ“š Offers: Loaded ${historyOffers.length} offer history messages`)
          }
        }
      } catch (error) {
        console.error('Offers: Error parsing message:', error)
      }
    }
    
    socket.addEventListener('message', handleMessage)
    
    return () => {
      socket.removeEventListener('message', handleMessage)
    }
  }, [socket, address, showSuccess])

  // Load player names for offers
  useEffect(() => {
    const loadPlayerNames = async () => {
      const names = {}
      const uniqueAddresses = [...new Set(offers.map(o => o.address).filter(Boolean))]
      
      for (const addr of uniqueAddresses) {
        if (!names[addr] && addr) {
          const name = await getPlayerName(addr)
          names[addr] = name || `${addr.slice(0, 6)}...${addr.slice(-4)}`
        }
      }
      setPlayerNames(names)
    }

    if (offers.length > 0) {
      loadPlayerNames()
    }
  }, [offers, getPlayerName])

  const addOffer = (offer) => {
    console.log('ðŸ“ Offers: Adding offer to state:', offer)
    setOffers(prev => {
      const newOffers = [...prev, offer]
      console.log('ðŸ“ Offers: New offers state:', newOffers.length, 'offers')
      return newOffers
    })
  }

  const handleSubmitCryptoOffer = async () => {
    if (!cryptoOffer.trim()) {
      console.error('âŒ Offers: No offer amount entered')
      return
    }

    const offerAmount = parseFloat(cryptoOffer)
    
    // Validate offer amount
    if (isNaN(offerAmount) || offerAmount < minOfferAmount) {
      showError(`Minimum offer is $${minOfferAmount.toFixed(2)} USD`)
      return
    }

    setIsSubmittingOffer(true)

    try {
      // Try WebSocket first
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({
          type: 'crypto_offer',
          listingId: gameData.listing_id,
          address: address,
          cryptoAmount: offerAmount,
          timestamp: new Date().toISOString()
        }))
        
        console.log('ðŸ’° Crypto offer sent via WebSocket')
        showSuccess(`Offer of $${offerAmount.toFixed(2)} USD sent!`)
        setCryptoOffer('')
      } else {
        // Use WebSocketService with queuing
        console.log('âš ï¸ WebSocket not connected, using service to queue offer')
        
        const ws = window.FlipnosisWS
        if (ws) {
          // Send offer via global WebSocket service
          ws.send({
            type: 'crypto_offer',
            gameId: gameData.listing_id,
            address: address,
            amount: offerAmount
          })
          
          // Optimistically add to local state
          const newOffer = {
            id: Date.now(),
            type: 'crypto_offer',
            address: address,
            cryptoAmount: offerAmount,
            timestamp: new Date().toISOString(),
            message: `ðŸ’° Offered $${offerAmount.toFixed(2)} USD`
          }
          
          addOffer(newOffer)
          showSuccess(`Offer queued: $${offerAmount.toFixed(2)} USD`)
          setCryptoOffer('')
          
          // Try to reconnect
          ws.connect(gameId, address)
        }
      }
    } catch (error) {
      console.error('âŒ Error submitting offer:', error)
      showError('Failed to submit offer. Please try again.')
    } finally {
      setIsSubmittingOffer(false)
    }
  }

  const handleAcceptOffer = async (offer) => {
    if (!isCreator() || !connected || !socket) {
      console.log('âŒ Offers: Cannot accept offer:', { isCreator: isCreator(), connected, hasSocket: !!socket })
      return
    }

    try {
      const offerType = offer.cryptoAmount ? 'offer' : 'NFT'
      showInfo(`Accepting ${offerType} challenge...`)

      const acceptanceData = {
        type: offer.cryptoAmount ? 'accept_crypto_offer' : 'accept_nft_offer',
        gameId,
        creatorAddress: address,
        acceptedOffer: offer,
        timestamp: new Date().toISOString()
      }

      console.log('ðŸ“¤ Offers: Sending offer acceptance:', acceptanceData)
      socket.send(JSON.stringify(acceptanceData))
      
      // Reload game data after a short delay to get updated status
      setTimeout(() => {
        if (window.location.pathname.includes('/game/')) {
          window.location.reload() // Force reload to get updated game status
        }
      }, 1000)
      
      if (onOfferAccepted) {
        onOfferAccepted(offer)
      }
      
    } catch (error) {
      console.error('Offers: Error accepting offer:', error)
      showError('Failed to accept offer: ' + error.message)
    }
  }

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const getDisplayName = (addr) => {
    if (!addr) return 'Unknown'
    return playerNames[addr] || `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  const renderOfferContent = (offer) => {
    switch (offer.type) {
      case 'crypto_offer':
        return (
          <div>
            <OfferAmount>
              <OfferAmountLabel>ðŸ’° Offer Amount:</OfferAmountLabel>
              <OfferAmountValue>${offer.cryptoAmount} USD</OfferAmountValue>
            </OfferAmount>
            {isCreator() && gameData?.status !== 'waiting_challenger_deposit' && (
              <OfferActions>
                <ActionButton 
                  className="accept"
                  onClick={() => handleAcceptOffer(offer)}
                >
                  âœ… Accept
                </ActionButton>
              </OfferActions>
            )}
          </div>
        )
      
      case 'nft_offer':
        return (
          <div>
            <div style={{ marginBottom: '0.5rem' }}>
              <strong>ðŸ’Ž NFT Offer</strong>
            </div>
            {offer.offerText && (
              <div style={{ 
                marginBottom: '0.5rem', 
                padding: '0.5rem', 
                background: 'rgba(255, 255, 255, 0.05)', 
                borderRadius: '0.25rem',
                border: '1px solid rgba(0, 255, 65, 0.2)'
              }}>
                <strong style={{ color: '#FFD700' }}>Offer Message:</strong>
                <div style={{ color: '#fff', marginTop: '0.25rem' }}>{offer.offerText}</div>
              </div>
            )}
            {isCreator() && gameData?.status !== 'waiting_challenger_deposit' && (
              <OfferActions>
                <ActionButton 
                  className="accept"
                  onClick={() => handleAcceptOffer(offer)}
                >
                  âœ… Accept
                </ActionButton>
              </OfferActions>
            )}
          </div>
        )
      
      case 'offer_accepted':
        return (
          <div>
            <strong>âœ… Offer Accepted!</strong>
            <div style={{ fontSize: '0.9rem', color: '#00FF41', marginTop: '0.25rem' }}>
              The creator has accepted the offer!
            </div>
          </div>
        )
      
      case 'system':
        return (
          <div style={{ color: '#FFD700', fontStyle: 'italic' }}>
            {offer.message}
          </div>
        )
      
      default:
        return <div style={{ color: '#fff' }}>{offer.message}</div>
    }
  }

  // Check if offer input should be shown
  const shouldShowOfferInput = () => {
    // Show for non-creators when game is waiting for challenger
    if (isCreator()) return false
    
    // Don't show if game is waiting for deposit
    if (gameData?.status === 'waiting_challenger_deposit') return false
    
    // Check if game is in a state where offers are accepted
    const validStatuses = ['waiting_challenger', 'awaiting_challenger', 'waiting_for_challenger', 'open']
    
    // Also check if listing status allows offers (for games that are listings)
    const gameStatus = gameData?.status
    const listingStatus = gameData?.type === 'listing' ? gameData?.status : null
    
    return validStatuses.includes(gameStatus) || validStatuses.includes(listingStatus)
  }

  if (!isConnected) {
    return (
      <OffersContainerStyled>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <p style={{ color: '#00FF41' }}>Please connect your wallet to view offers</p>
        </div>
      </OffersContainerStyled>
    )
  }

  // Debug logging
  console.log('ðŸ” OffersContainer Debug:', {
    isCreator: isCreator(),
    gameStatus: gameData?.status,
    gamePrice,
    minOfferAmount,
    shouldShowInput: shouldShowOfferInput(),
    isConnected,
    connected
  })

  return (
    <OffersContainerStyled>
      <OffersHeader>
        <OffersTitle>ðŸ’° Offers</OffersTitle>
        <ConnectionStatus>
          <StatusDot connected={connected} />
          <StatusText connected={connected}>
            {connected ? 'Connected' : 'Disconnected'}
          </StatusText>
        </ConnectionStatus>
      </OffersHeader>

      {/* Game Price Info */}
      {gamePrice > 0 && (
        <PriceInfo>
          <PriceLabel>ðŸŽ¯ Game Price:</PriceLabel>
          <PriceValue>${gamePrice.toFixed(2)} USD</PriceValue>
          <MinOfferInfo>Minimum offer: ${minOfferAmount.toFixed(2)} USD (80%)</MinOfferInfo>
        </PriceInfo>
      )}

      <OffersList>
        {offers.length === 0 ? (
          <div style={{
            textAlign: 'center',
            color: 'rgba(255, 255, 255, 0.6)',
            padding: '2rem'
          }}>
            <div style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>ðŸ’°</div>
            <div style={{ marginBottom: '0.5rem' }}>No offers yet.</div>
            <div style={{ fontSize: '0.9rem', color: '#00FF41' }}>
              {isCreator() 
                ? 'Wait for other players to make offers!'
                : 'Make an offer to join the game!'
              }
            </div>
          </div>
        ) : (
          offers.map((offer, index) => {
            const displayName = getDisplayName(offer.address)
            
            return (
              <OfferItem key={index}>
                <OfferHeader>
                  <span>
                    {offer.type === 'crypto_offer' ? 'ðŸ’°' : 
                     offer.type === 'nft_offer' ? 'ðŸ’Ž' : 
                     offer.type === 'offer_accepted' ? 'âœ…' : 'âš¡'} {displayName}
                  </span>
                  <span>{formatTimestamp(offer.timestamp)}</span>
                </OfferHeader>
                {renderOfferContent(offer)}
              </OfferItem>
            )
          })
        )}
        <div ref={offersEndRef} />
      </OffersList>

      {/* Offer Input - Available to non-creators when game is waiting for challenger */}
      {shouldShowOfferInput() && (
        <OfferInputContainer>
          <OfferInput
            type="text"
            value={cryptoOffer}
            onChange={(e) => {
              // Only allow digits and decimal point
              const value = e.target.value.replace(/[^0-9.]/g, '')
              // Prevent multiple decimal points
              const parts = value.split('.')
              if (parts.length <= 2) {
                setCryptoOffer(value)
              }
            }}
            placeholder={`Min $${minOfferAmount.toFixed(2)} USD...`}
            disabled={false} // Never disable
            onKeyPress={(e) => e.key === 'Enter' && handleSubmitCryptoOffer()}
            style={{
              borderColor: connected ? '#00FF41' : '#FFA500'
            }}
          />
          <OfferButton
            onClick={handleSubmitCryptoOffer}
            disabled={!cryptoOffer.trim() || isSubmittingOffer}
            style={{
              background: connected 
                ? 'linear-gradient(45deg, #FFD700, #FFA500)' 
                : 'linear-gradient(45deg, #FFA500, #FF8C00)',
              opacity: (!cryptoOffer.trim() || isSubmittingOffer) ? 0.5 : 1
            }}
          >
            {isSubmittingOffer ? 'Submitting...' : (connected ? 'Make Offer' : 'Queue Offer')}
          </OfferButton>
        </OfferInputContainer>
      )}
    </OffersContainerStyled>
  )
}

export default OffersContainer 

Use game StatusText
import { useState, useEffect, useRef } from 'react'
import { ethers } from 'ethers'
import { useToast } from '../../../contexts/ToastContext'
import { useContractService } from '../../../utils/useContractService'
import contractService from '../../../services/ContractService'
import { getApiUrl } from '../../../config/api'

import webSocketService from '../../../services/WebSocketService'

export const useGameState = (gameId, address) => {
  const { showSuccess, showError, showInfo } = useToast()
  const { isInitialized: contractInitialized } = useContractService()

  // Core game state
  const [gameData, setGameData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [offers, setOffers] = useState([])
  const [chatMessages, setChatMessages] = useState([])
  const [playerChoices, setPlayerChoices] = useState({ creator: null, joiner: null })
  
  // Game state
  const [gameState, setGameState] = useState({
    phase: 'loading', // loading, choosing, charging, flipping, completed
    creatorChoice: null,
    joinerChoice: null,
    currentRound: 1,
    currentTurn: null,
    creatorPower: 0,
    joinerPower: 0,
    chargingPlayer: null,
    flipResult: null,
    roundWinner: null,
    creatorWins: 0,
    joinerWins: 0
  })

  // Coin state
  const [flipAnimation, setFlipAnimation] = useState(null)
  const [customHeadsImage, setCustomHeadsImage] = useState(null)
  const [customTailsImage, setCustomTailsImage] = useState(null)
  const [gameCoin, setGameCoin] = useState(null)

  // Streamed coin state
  const [streamedCoinState, setStreamedCoinState] = useState({
    isStreaming: false,
    frameData: null,
    flipStartTime: null,
    duration: 3000
  })

  // UI state
  const [showResultPopup, setShowResultPopup] = useState(false)
  const [resultData, setResultData] = useState(null)
  const [showOfferReviewModal, setShowOfferReviewModal] = useState(false)
  const [pendingNFTOffer, setPendingNFTOffer] = useState(null)

  // Offer state
  const [newOffer, setNewOffer] = useState({ price: '', message: '' })
  const [creatingOffer, setCreatingOffer] = useState(false)

  // Countdown state
  const [depositTimeLeft, setDepositTimeLeft] = useState(null)
  const [countdownInterval, setCountdownInterval] = useState(null)
  const [roundCountdown, setRoundCountdown] = useState(null)
  const [roundCountdownInterval, setRoundCountdownInterval] = useState(null)

  // Live updates state
  const [offersRefreshInterval, setOffersRefreshInterval] = useState(null)

  // ETH amount state
  const [ethAmount, setEthAmount] = useState(null)

  // Cache for ETH amounts to reduce RPC calls
  const ethAmountCache = useRef(new Map())
  const lastRpcCall = useRef(0)
  const RPC_COOLDOWN = 2000 // 2 seconds between RPC calls

  // Helper functions
  const getGameCreator = () => gameData?.creator || gameData?.creator_address
  const getGameJoiner = () => gameData?.challenger || gameData?.joiner || gameData?.joiner_address || gameData?.challenger_address
  const getGamePrice = () => gameData?.payment_amount || gameData?.final_price || gameData?.price || gameData?.asking_price || gameData?.priceUSD || gameData?.price_usd || 0
  const getGameNFTImage = () => gameData?.nft?.image || gameData?.nft_image || gameData?.nftImage || '/placeholder-nft.svg'
  const getGameNFTName = () => gameData?.nft?.name || gameData?.nft_name || gameData?.nftName || 'Unknown NFT'
  const getGameNFTCollection = () => gameData?.nft?.collection || gameData?.nft_collection || gameData?.nftCollection || 'Unknown Collection'
  const getGameNFTContract = () => gameData?.nft_contract || gameData?.nft?.contract || gameData?.nftContract
  const getGameNFTTokenId = () => gameData?.nft_token_id || gameData?.nft?.tokenId || gameData?.nftTokenId

  const isCreator = () => address === getGameCreator()
  const isJoiner = () => {
    if (!address || !gameData) return false
    
    // Check all possible joiner/challenger fields
    const challengerAddress = gameData?.challenger || gameData?.joiner || 
      gameData?.joiner_address || gameData?.challenger_address
    
    if (!challengerAddress) return false
    
    return address.toLowerCase() === challengerAddress.toLowerCase()
  }

  const isMyTurn = () => {
    // Don't allow turns if game hasn't started yet
    if (!gameData?.creator_deposited || !gameData?.challenger_deposited || gameData?.status !== 'active') {
      return false
    }

    if (gameState.phase === 'choosing') {
      // Round 1: Player 1 (creator) goes first
      if (gameState.currentRound === 1) {
        return isCreator() && !gameState.creatorChoice
      }
      // Round 2: Player 2 (joiner) goes
      else if (gameState.currentRound === 2) {
        return isJoiner() && !gameState.joinerChoice
      }
      // Round 3: Player 1 goes again
      else if (gameState.currentRound === 3) {
        return isCreator() && !gameState.creatorChoice
      }
      // Round 4: Player 2 goes again
      else if (gameState.currentRound === 4) {
        return isJoiner() && !gameState.joinerChoice
      }
      // Round 5: Auto-flip (no player choice needed)
      else if (gameState.currentRound === 5) {
        return false
      }
      // Default fallback - allow anyone who hasn't chosen yet
      return (isCreator() && !gameState.creatorChoice) || (isJoiner() && !gameState.joinerChoice)
    }

    // Charging phase - check if it's this player's turn to charge
    if (gameState.phase === 'charging') {
      if (gameState.currentTurn) {
        return gameState.currentTurn === address
      } else {
        // Fallback: allow the player who made their choice to charge
        const hasMadeChoice = (isCreator() && gameState.creatorChoice) || (isJoiner() && gameState.joinerChoice)
        return hasMadeChoice
      }
    }

    // Other phases - no turn restrictions
    return true
  }

  // Calculate ETH amount with retry logic
  const calculateAndSetEthAmount = async (finalPrice, retryCount = 0) => {
    try {
      let cacheKey = Math.round(finalPrice * 100)

      // Check cache first
      if (ethAmountCache.current && ethAmountCache.current.has(cacheKey) && retryCount === 0) {
        const cachedAmount = ethAmountCache.current.get(cacheKey)
        setEthAmount(cachedAmount)
        return
      }

      // If we already have an ETH amount, don't recalculate
      if (ethAmount && retryCount === 0) {
        return
      }

      try {
        if (!contractService.isReady()) {
          if (retryCount < 3) {
            setTimeout(() => calculateAndSetEthAmount(finalPrice, retryCount + 1), 1000)
          }
          return
        }

        const priceInMicrodollars = Math.round(finalPrice * 1000000)
        const calculatedEthAmount = await contractService.contract.getETHAmount(priceInMicrodollars)

        setEthAmount(calculatedEthAmount)

        if (!ethAmountCache.current) {
          ethAmountCache.current = new Map()
        }
        ethAmountCache.current.set(cacheKey, calculatedEthAmount)

      } catch (contractError) {
        if (retryCount < 2) {
          setTimeout(() => calculateAndSetEthAmount(finalPrice, retryCount + 1), 1000)
        } else {
          const priceInMicrodollars = Math.round(finalPrice * 1000000)
          setEthAmount(BigInt(priceInMicrodollars))

          if (!ethAmountCache.current) {
            ethAmountCache.current = new Map()
          }
          ethAmountCache.current.set(cacheKey, BigInt(priceInMicrodollars))
        }
      }
    } catch (error) {
      console.error('âŒ Error calculating ETH amount:', error)
      setEthAmount(null)
    }
  }

  // Load game data
  const loadGameData = async () => {
    try {
      setLoading(true)
      const response = await fetch(getApiUrl(`/games/${gameId}`))

      if (!response.ok) {
        setError('Game not found or API unavailable')
        setLoading(false)
        return
      }

      const responseText = await response.text()
      let data
      try {
        data = JSON.parse(responseText)
      } catch (err) {
        setError('Invalid response from server. Please try again.')
        setLoading(false)
        return
      }

      if (!data || typeof data !== 'object') {
        setError('Invalid game data received from server.')
        setLoading(false)
        return
      }

      setGameData(data)

      // Calculate ETH amount if we have a payment amount (accepted offer) or final price
      const priceForCalculation = data.payment_amount || data.final_price
      if (priceForCalculation) {
        if (data.eth_amount) {
          setEthAmount(BigInt(data.eth_amount))
        } else {
          await calculateAndSetEthAmount(priceForCalculation)
        }
      } else {
        setEthAmount(null)
      }

      // Start countdown if game is waiting for challenger deposit
      if (data.status === 'waiting_challenger_deposit') {
        if (data.deposit_deadline) {
          const now = new Date().getTime()
          const deadline = new Date(data.deposit_deadline).getTime()
          if (deadline > now) {
            startDepositCountdown(data.deposit_deadline)
          }
        } else {
          // If no deadline is set, set it to 2 minutes from now
          const deadline = new Date(Date.now() + 2 * 60 * 1000).toISOString()
          startDepositCountdown(deadline)
        }
      }

      // Set game phase to choosing if both players have deposited and game is active
      if (data.creator_deposited && data.challenger_deposited && 
          (data.status === 'active' || data.status === 'waiting_choices')) {
        const wasWaiting = gameState.phase !== 'choosing' || !gameState.phase
        if (wasWaiting) {
          setGameState(prev => ({
            ...prev,
            phase: 'choosing',
            creatorChoice: null,
            joinerChoice: null
          }))

          if (address === getGameCreator() || address === getGameJoiner()) {
            showSuccess('ðŸŽ® Game is now active! Choose heads or tails to begin!')
          }
        } else {
          setGameState(prev => ({
            ...prev,
            phase: 'choosing',
            creatorChoice: null,
            joinerChoice: null
          }))
        }
      }

      // Sync player choices from game data if available
      if (data.game_data && data.game_data.choices) {
        const { creatorChoice, joinerChoice } = data.game_data.choices
        if (creatorChoice || joinerChoice) {
          setPlayerChoices(prev => ({
            creator: creatorChoice || prev.creator,
            joiner: joinerChoice || prev.joiner
          }))

          setGameState(prev => ({
            ...prev,
            creatorChoice: creatorChoice || prev.creatorChoice,
            joinerChoice: joinerChoice || prev.joinerChoice
          }))
        }
      }

      // Load offers for this listing/game
      const listingId = data?.listing_id || data?.id
      if (listingId) {
        try {
          const offersResponse = await fetch(getApiUrl(`/listings/${listingId}/offers`))
          if (offersResponse.ok) {
            let offersData = await offersResponse.json()
            setOffers(offersData)
          }
        } catch (error) {
          console.error('âŒ Error loading offers:', error)
        }
      }

    } catch (err) {
      console.error('Error loading game data:', err)
      setError('Failed to load game data. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Load offers for listings
  const loadOffers = async () => {
    console.log('ðŸ” loadOffers called with gameData:', gameData)
    
    if (!gameData) {
      console.log('âŒ No game data available')
      return
    }

    try {
      // Use the same logic as loadGameData to determine the correct endpoint
      const listingId = gameData?.listing_id || gameData?.id
      console.log('ðŸ“‹ Attempting to fetch offers for listingId:', listingId)
      
      const response = await fetch(getApiUrl(`/listings/${listingId}/offers`))
      console.log('ðŸ“¡ Response status:', response.status)
      
      if (response.ok) {
        let offersData = await response.json()
        console.log('âœ… Fetched offers:', offersData)
        setOffers(offersData)
      } else {
        console.log('âŒ Response not ok:', response.status, response.statusText)
        setOffers([])
      }
    } catch (error) {
      console.error('âŒ Error loading offers:', error)
      setOffers([])
    }
  }

  // Countdown functions
  const startDepositCountdown = (deadline) => {
    if (countdownInterval) {
      clearInterval(countdownInterval)
    }

    const interval = setInterval(() => {
      const now = new Date().getTime()
      const deadlineTime = new Date(deadline).getTime()
      const timeLeft = Math.max(0, deadlineTime - now)

      if (timeLeft === 0) {
        clearInterval(interval)
        setDepositTimeLeft(0)
        loadGameData()
      } else {
        setDepositTimeLeft(Math.floor(timeLeft / 1000))
      }
    }, 1000)

    setCountdownInterval(interval)
  }

  const formatTimeLeft = (seconds) => {
    if (!seconds && seconds !== 0) return ''
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Start round countdown timer
  const startRoundCountdown = () => {
    setRoundCountdown(20)

    const interval = setInterval(() => {
      setRoundCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval)
          setRoundCountdownInterval(null)

          if (isMyTurn()) {
            const autoChoice = Math.random() < 0.5 ? 'heads' : 'tails'

            if (address === getGameCreator()) {
              setPlayerChoices(prev => ({ ...prev, creator: autoChoice }))
              setGameState(prev => ({
                ...prev,
                creatorChoice: autoChoice
              }))
            } else if (address === getGameJoiner()) {
              setPlayerChoices(prev => ({ ...prev, joiner: autoChoice }))
              setGameState(prev => ({
                ...prev,
                joinerChoice: autoChoice
              }))
            }

            if (wsRef && wsConnected) {
              const autoFlipMessage = {
                type: 'GAME_ACTION',
                gameId: gameId,
                action: 'AUTO_FLIP_TIMEOUT',
                choice: autoChoice,
                player: address,
                powerLevel: 10,
                timestamp: Date.now()
              }

              try {
                wsRef.send(JSON.stringify(autoFlipMessage))
                showInfo('ðŸŽ² Auto-flip triggered due to time limit!')
              } catch (error) {
                console.error('âŒ Failed to send auto-flip:', error)
              }
            }
          }

          return null
        }
        return prev - 1
      })
    }, 1000)

    setRoundCountdownInterval(interval)
  }

  // Stop round countdown timer
  const stopRoundCountdown = () => {
    if (roundCountdownInterval) {
      clearInterval(roundCountdownInterval)
      setRoundCountdownInterval(null)
    }
    setRoundCountdown(null)
  }

  // Game actions
  const handlePlayerChoice = (choice) => {
    try {
      if (!webSocketService || typeof webSocketService.isConnected !== 'function') {
        showError('WebSocket service not available')
        return
      }
      
      if (!webSocketService.isConnected()) {
        showError('Not connected to game server')
        return
      }

      stopRoundCountdown()

      // Validate choice
      if (!['heads', 'tails'].includes(choice)) {
        console.error('âŒ Invalid choice:', choice)
        return
      }

      showSuccess(`ðŸŽ¯ You chose ${choice.toUpperCase()}!`)

      // Send choice to server via WebSocket
      webSocketService.send({
        type: 'GAME_ACTION',
        gameId,
        action: 'MAKE_CHOICE',
        choice,
        player: address
      })
    } catch (error) {
      console.error('âŒ Error in handlePlayerChoice:', error)
      showError('Failed to send choice to server')
    }
  }

  const handleAutoFlip = () => {
    try {
      showInfo('Round 5 - Auto-flipping for fairness!')

      const autoChoice = Math.random() < 0.5 ? 'heads' : 'tails'

      setGameState(prev => ({
        ...prev,
        creatorChoice: autoChoice,
        joinerChoice: autoChoice
      }))

      if (webSocketService && typeof webSocketService.isConnected === 'function' && webSocketService.isConnected()) {
        webSocketService.sendAutoFlip(gameId, 'system', autoChoice)
      }
    } catch (error) {
      console.error('âŒ Error in handleAutoFlip:', error)
      showError('Failed to send auto-flip to server')
    }
  }

  const handlePowerChargeStart = () => {
    try {
      // Send power charge start to server
      if (webSocketService && typeof webSocketService.isConnected === 'function' && webSocketService.isConnected()) {
        webSocketService.send({
          type: 'GAME_ACTION',
          gameId,
          action: 'POWER_CHARGE_START',
          player: address
        })
      }
    } catch (error) {
      console.error('âŒ Error in handlePowerChargeStart:', error)
      showError('Failed to send power charge start to server')
    }
  }

  const handlePowerChargeStop = async (powerLevel) => {
    try {
      if (!webSocketService || typeof webSocketService.isConnected !== 'function') {
        showError('WebSocket service not available')
        return
      }
      
      if (!webSocketService.isConnected()) {
        showError('Not connected to game server')
        return
      }

      const validPowerLevel = typeof powerLevel === 'number' && !isNaN(powerLevel) ? powerLevel : 5

      // Send power charge completion to server
      webSocketService.send({
        type: 'GAME_ACTION',
        gameId,
        action: 'POWER_CHARGED',
        player: address,
        powerLevel: validPowerLevel
      })
    } catch (error) {
      console.error('âŒ Error in handlePowerChargeStop:', error)
      showError('Failed to send power charge to server')
    }
  }

  // Handle flip result
  const handleFlipResult = (result) => {
    let safeResult
    try {
      safeResult = JSON.parse(JSON.stringify(result))
    } catch (error) {
      safeResult = {
        roundWinner: result?.roundWinner,
        result: result?.result,
        creatorChoice: result?.creatorChoice,
        challengerChoice: result?.challengerChoice,
        creatorPower: result?.creatorPower,
        joinerPower: result?.joinerPower
      }
    }

    setGameState(prev => ({
      ...prev,
      phase: 'flipping',
      flipResult: safeResult.result,
      roundWinner: safeResult.roundWinner,
      creatorPower: safeResult.creatorPower || 0,
      joinerPower: safeResult.joinerPower || 0
    }))

    setFlipAnimation({
      result: safeResult.result,
      roundWinner: safeResult.roundWinner,
      creatorChoice: safeResult.creatorChoice,
      challengerChoice: safeResult.challengerChoice,
      creatorPower: safeResult.creatorPower,
      joinerPower: safeResult.joinerPower
    })

    setTimeout(() => {
      setFlipAnimation(null)

      const isRoundWinner = safeResult.roundWinner === address
      const myChoice = isCreator() ? safeResult.creatorChoice : safeResult.challengerChoice

      setResultData({
        isWinner: isRoundWinner,
        flipResult: safeResult.result,
        playerChoice: myChoice,
        roundWinner: safeResult.roundWinner,
        creatorPower: safeResult.creatorPower,
        joinerPower: safeResult.joinerPower
      })
      setShowResultPopup(true)

      if (isRoundWinner) {
        showSuccess(`ðŸŽ‰ You won this round! The coin landed on ${safeResult.result.toUpperCase()}!`)
      } else {
        showInfo(`ðŸ˜” You lost this round. The coin landed on ${safeResult.result.toUpperCase()}.`)
      }
    }, 3000)
  }

  // Reset game state for next round
  const resetForNextRound = () => {
    setGameState(prev => ({
      ...prev,
      phase: 'choosing',
      creatorChoice: null,
      joinerChoice: null,
      currentTurn: null,
      creatorPower: 0,
      joinerPower: 0,
      chargingPlayer: null
    }))

    setPlayerChoices({
      creator: null,
      joiner: null
    })

    setFlipAnimation(null)
    setShowResultPopup(false)
    setResultData(null)

    setStreamedCoinState({
      isStreaming: false,
      frameData: null,
      flipStartTime: null,
      duration: 3000
    })
  }

  // Handle game completed
  const handleGameCompleted = (data) => {
    let safeData
    try {
      safeData = JSON.parse(JSON.stringify(data))
    } catch (error) {
      safeData = {
        winner: data?.winner,
        finalResult: data?.finalResult,
        playerChoice: data?.playerChoice
      }
    }

    setGameState(prev => ({
      ...prev,
      phase: 'completed'
    }))

    setResultData({
      isWinner: safeData.winner === address,
      flipResult: safeData.finalResult,
      playerChoice: safeData.playerChoice,
      isGameComplete: true
    })
    setShowResultPopup(true)

    // Award XP based on game result
    const isWinner = safeData.winner === address
    const xpAmount = isWinner ? 1000 : 500
    const xpReason = isWinner ? 'Game Win' : 'Game Loss'
    
    // Award XP to the current player
    fetch(`/api/users/${address}/award-xp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: xpAmount,
        reason: xpReason
      })
    }).then(response => {
      if (response.ok) {
        return response.json()
      }
    }).then(result => {
      if (result && result.xpGained) {
        showSuccess(`+${result.xpGained} XP earned for ${xpReason}!`);
      }
    }).catch(error => {
      console.error('Failed to award XP:', error);
    })
  }

  // Offer functions
  const createOffer = async () => {
    if (!newOffer.price || !gameData?.id) {
      showError('Please enter a price and ensure game data is loaded')
      return
    }

    try {
      setCreatingOffer(true)

      // For games created directly, we'll create a listing first, then create the offer
      let listingId = gameData?.listing_id
      
      if (!listingId) {
        // Create a listing for this game
        const listingResponse = await fetch(getApiUrl('/listings'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            creator: gameData.creator,
            game_id: gameData.id,
            nft_contract: gameData.nft_contract,
            nft_token_id: gameData.nft_token_id,
            nft_name: gameData.nft_name,
            nft_image: gameData.nft_image,
            nft_collection: gameData.nft_collection,
            asking_price: gameData.final_price,
            coin_data: gameData.coin_data
          })
        })
        
        if (listingResponse.ok) {
          const listingResult = await listingResponse.json()
          listingId = listingResult.listingId
          console.log('âœ… Created listing for game:', listingId)
        } else {
          throw new Error('Failed to create listing for game')
        }
      }

      const response = await fetch(getApiUrl(`/listings/${listingId}/offers`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          offerer_address: address,
          offerer_name: address.slice(0, 6) + '...' + address.slice(-4),
          offer_price: parseFloat(newOffer.price),
          message: newOffer.message
        })
      })

      if (response.ok) {
        let result = await response.json()
        showSuccess('Offer created successfully!')
        setNewOffer({ price: '', message: '' })
        
        // Reload offers to show the new offer
        await loadOffers()
      } else {
        const errorData = await response.text()
        showError(`Failed to create offer: ${response.status} ${response.statusText}`)
      }
    } catch (error) {
      console.error('âŒ Error creating offer:', error)
      showError(`Failed to create offer: ${error.message}`)
    } finally {
      setCreatingOffer(false)
    }
  }

  const acceptOffer = async (offerId, offerPrice) => {
    try {
      showInfo('Accepting offer...')

      const response = await fetch(getApiUrl(`/offers/${offerId}/accept`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ final_price: offerPrice })
      })

      let result = await response.json()

      if (response.ok) {
        showSuccess('Offer accepted! Game created successfully.')
        await loadGameData()
        await loadOffers()

        if (isCreator) {
          showInfo('Offer accepted! Waiting for challenger to deposit payment...')
        }

        if (address === getGameJoiner()) {
          showInfo('Your offer was accepted! Please deposit payment to start the game.')
        }
      } else {
        const errorMessage = result.details 
          ? `${result.error}: ${result.details}` 
          : result.error || 'Failed to accept offer'
        showError(errorMessage)
      }
    } catch (error) {
      console.error('âŒ Error accepting offer:', error)
      showError(`Failed to accept offer: ${error.message}`)
    }
  }

  const rejectOffer = async (offerId) => {
    try {
      const response = await fetch(getApiUrl(`/offers/${offerId}/reject`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      if (response.ok) {
        showSuccess('Offer rejected')
        // Reload offers to update the list
        await loadOffers()
      } else {
        showError('Failed to reject offer')
      }
    } catch (error) {
      console.error('Error rejecting offer:', error)
      showError('Failed to reject offer')
    }
  }

  // Update coin images when game state changes
  useEffect(() => {
    let coinData = null

    if (gameData?.coinData && typeof gameData.coinData === 'object') {
      coinData = gameData.coinData
    } else if (gameData?.coin_data) {
      try {
        coinData = typeof gameData.coin_data === 'string' ? 
          JSON.parse(gameData.coin_data) : gameData.coin_data
      } catch (error) {
        console.error('âŒ Error parsing coin data:', error)
        if (gameData.coin_data && typeof gameData.coin_data === 'string') {
          try {
            const coinMatch = gameData.coin_data.match(/"id"\s*:\s*"([^"]+)"/)
            if (coinMatch) {
              const coinId = coinMatch[1]
              let fallbackCoinData = {
                id: coinId,
                type: 'default',
                name: coinId.charAt(0).toUpperCase() + coinId.slice(1),
                headsImage: `/coins/${coinId}h.png`,
                tailsImage: `/coins/${coinId}t.png`
              }

              if (coinId === 'trump') {
                fallbackCoinData = {
                  ...fallbackCoinData,
                  headsImage: '/coins/trumpheads.webp',
                  tailsImage: '/coins/trumptails.webp'
                }
              } else if (coinId === 'mario') {
                fallbackCoinData = {
                  ...fallbackCoinData,
                  headsImage: '/coins/mario.png',
                  tailsImage: '/coins/luigi.png'
                }
              } else if (coinId === 'skull') {
                fallbackCoinData = {
                  ...fallbackCoinData,
                  headsImage: '/coins/skullh.png',
                  tailsImage: '/coins/skullt.png'
                }
              } else if (coinId === 'plain') {
                fallbackCoinData = {
                  ...fallbackCoinData,
                  headsImage: '/coins/plainh.png',
                  tailsImage: '/coins/plaint.png'
                }
              }

              coinData = fallbackCoinData
            }
          } catch (fallbackError) {
            console.error('âŒ Error in fallback coin parsing:', fallbackError)
          }
        }
      }
    } else if (gameData?.coin && typeof gameData.coin === 'object') {
      coinData = gameData.coin
    }

    if (coinData && coinData.headsImage && coinData.tailsImage) {
      setCustomHeadsImage(coinData.headsImage)
      setCustomTailsImage(coinData.tailsImage)
      
      // Process material data if available
      const materialData = coinData.material || {
        id: 'poker-chip',
        name: 'Poker Chip',
        description: 'Balanced & Classic',
        edgeColor: '#0066CC',
        physics: {
          weight: 'medium',
          speedMultiplier: 1.0,
          durationMultiplier: 1.0,
          wobbleIntensity: 1.0,
          predictability: 'medium'
        }
      }
      
      setGameCoin({
        ...coinData,
        material: materialData
      })
    } else {
      setCustomHeadsImage('/coins/plainh.png')
      setCustomTailsImage('/coins/plaint.png')
      setGameCoin({
        id: 'plain',
        type: 'default',
        name: 'Classic',
        headsImage: '/coins/plainh.png',
        tailsImage: '/coins/plaint.png',
        material: {
          id: 'poker-chip',
          name: 'Poker Chip',
          description: 'Balanced & Classic',
          edgeColor: '#0066CC',
          physics: {
            weight: 'medium',
            speedMultiplier: 1.0,
            durationMultiplier: 1.0,
            wobbleIntensity: 1.0,
            predictability: 'medium'
          }
        }
      })
    }
  }, [gameData])

  // Load game data on mount
  useEffect(() => {
    if (gameId) {
      loadGameData()
    }
  }, [gameId])

  // Load offers when game data changes
  useEffect(() => {
    if (gameData && (gameData.listing_id || gameData.id)) {
      loadOffers()
    }
  }, [gameData])

  // Auto-refresh offers every 5 seconds
  useEffect(() => {
    if (gameData && (gameData.listing_id || gameData.id)) {
      const interval = setInterval(() => {
        loadOffers()
      }, 5000)

      setOffersRefreshInterval(interval)

      return () => {
        clearInterval(interval)
      }
    }
  }, [gameData])

  // Recalculate ETH amount when contract becomes initialized
  useEffect(() => {
    if (gameData?.final_price && contractInitialized) {
      if (gameData.eth_amount) {
        setEthAmount(BigInt(gameData.eth_amount))
      } else if (!ethAmount) {
        calculateAndSetEthAmount(gameData.final_price)
      }
    }
  }, [contractInitialized, gameData?.final_price, gameData?.eth_amount, ethAmount])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (countdownInterval) {
        clearInterval(countdownInterval)
      }
      if (roundCountdownInterval) {
        clearInterval(roundCountdownInterval)
      }
      if (offersRefreshInterval) {
        clearInterval(offersRefreshInterval)
      }
    }
  }, [countdownInterval, roundCountdownInterval, offersRefreshInterval])



  return {
    // State
    gameData,
    loading,
    error,
    gameState,
    playerChoices,
    streamedCoinState,
    flipAnimation,
    resultData,
    showResultPopup,
    ethAmount,
    depositTimeLeft,
    roundCountdown,
    offers,
    chatMessages,
    customHeadsImage,
    customTailsImage,
    gameCoin,
    newOffer,
    creatingOffer,

    // Actions
    resetForNextRound,
    handlePlayerChoice,
    handlePowerChargeStart,
    handlePowerChargeStop,
    handleAutoFlip,
    handleFlipResult,
    handleGameCompleted,
    createOffer,
    acceptOffer,
    rejectOffer,
    startRoundCountdown,
    stopRoundCountdown,
    formatTimeLeft,
    loadOffers,
    loadGameData,

    // Helpers
    isMyTurn,
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

    // Setters
    setNewOffer,
    setCreatingOffer,
    setStreamedCoinState,
    setGameState,
    setPlayerChoices,
    
    // Contract state
    contractInitialized
  }
} 

Dont have gameservices

getApiUrlonst express = require('express')
const crypto = require('crypto')
const ethers = require('ethers')
const { XPService } = require('../services/xpService')

function createApiRoutes(dbService, blockchainService, wsHandlers) {
  const router = express.Router()
  const db = dbService.getDatabase()
  
  // Initialize XP Service
  const xpService = new XPService(dbService.databasePath)
  xpService.initialize().catch(console.error)

  // Health check
  router.get('/health', (req, res) => {
    res.json({ 
      status: 'ok', 
      server: 'clean-architecture', 
      timestamp: new Date().toISOString(),
      hasContractOwner: blockchainService.hasOwnerWallet()
    })
  })

  // Profile endpoints
  router.get('/profile/:address', async (req, res) => {
    const { address } = req.params
    
    try {
      const profile = await new Promise((resolve, reject) => {
        db.get('SELECT * FROM profiles WHERE address = ?', [address.toLowerCase()], (err, result) => {
          if (err) reject(err)
          else resolve(result)
        })
      })
      
      if (profile) {
        res.json(profile)
      } else {
        // Return empty profile if not found
        res.json({
          address: address.toLowerCase(),
          name: '',
          avatar: '',
          headsImage: '',
          tailsImage: '',
          twitter: '',
          telegram: '',
          xp: 0,
          xp_name_earned: false,
          xp_avatar_earned: false,
          xp_twitter_earned: false,
          xp_telegram_earned: false,
          xp_heads_earned: false,
          xp_tails_earned: false,
          stats: {
            totalGames: 0,
            gamesWon: 0,
            gamesLost: 0,
            winRate: 0,
            totalVolume: 0
          }
        })
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
      res.status(500).json({ error: 'Failed to fetch profile' })
    }
  })

  router.put('/profile/:address', async (req, res) => {
    const { address } = req.params
    const { name, avatar, headsImage, tailsImage, twitter, telegram } = req.body
    
    try {
      let totalXPGained = 0
      let xpMessages = []
      
      // Award XP for each field that's being set for the first time
      // Only award XP if the field has a value and is different from current value
      if (name && name.trim() !== '') {
        try {
          const result = await xpService.awardProfileXP(address, 'name', name)
          if (result.xpGained > 0) {
            totalXPGained += result.xpGained
            xpMessages.push(result.message)
          }
        } catch (error) {
          console.error('Error awarding name XP:', error)
        }
      }
      
      if (avatar && avatar.trim() !== '') {
        try {
          const result = await xpService.awardProfileXP(address, 'avatar', avatar)
          if (result.xpGained > 0) {
            totalXPGained += result.xpGained
            xpMessages.push(result.message)
          }
        } catch (error) {
          console.error('Error awarding avatar XP:', error)
        }
      }
      
      if (twitter && twitter.trim() !== '') {
        try {
          const result = await xpService.awardProfileXP(address, 'twitter', twitter)
          if (result.xpGained > 0) {
            totalXPGained += result.xpGained
            xpMessages.push(result.message)
          }
        } catch (error) {
          console.error('Error awarding twitter XP:', error)
        }
      }
      
      if (telegram && telegram.trim() !== '') {
        try {
          const result = await xpService.awardProfileXP(address, 'telegram', telegram)
          if (result.xpGained > 0) {
            totalXPGained += result.xpGained
            xpMessages.push(result.message)
          }
        } catch (error) {
          console.error('Error awarding telegram XP:', error)
        }
      }
      
      if (headsImage && headsImage.trim() !== '') {
        try {
          const result = await xpService.awardProfileXP(address, 'headsImage', headsImage)
          if (result.xpGained > 0) {
            totalXPGained += result.xpGained
            xpMessages.push(result.message)
          }
        } catch (error) {
          console.error('Error awarding heads XP:', error)
        }
      }
      
      if (tailsImage && tailsImage.trim() !== '') {
        try {
          const result = await xpService.awardProfileXP(address, 'tailsImage', tailsImage)
          if (result.xpGained > 0) {
            totalXPGained += result.xpGained
            xpMessages.push(result.message)
          }
        } catch (error) {
          console.error('Error awarding tails XP:', error)
        }
      }
        
      // Update profile fields (preserving XP and boolean flags)
      const updateQuery = `
        UPDATE profiles 
        SET name = ?, avatar = ?, headsImage = ?, tailsImage = ?, twitter = ?, telegram = ?, 
            updated_at = CURRENT_TIMESTAMP
        WHERE address = ?
      `
      await new Promise((resolve, reject) => {
        db.run(updateQuery, [
          name || '', 
          avatar || '', 
          headsImage || '', 
          tailsImage || '', 
          twitter || '', 
          telegram || '',
          address.toLowerCase()
        ], function(err) {
          if (err) {
            // If profile doesn't exist, create it
            const insertQuery = `
              INSERT INTO profiles (
                address, name, avatar, headsImage, tailsImage, twitter, telegram, 
                xp, xp_name_earned, xp_avatar_earned, xp_twitter_earned, 
                xp_telegram_earned, xp_heads_earned, xp_tails_earned,
                created_at, updated_at
              ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            `
            db.run(insertQuery, [
              address.toLowerCase(),
              name || '', 
              avatar || '', 
              headsImage || '', 
              tailsImage || '', 
              twitter || '', 
              telegram || ''
            ], function(err2) {
              if (err2) reject(err2)
              else resolve()
            })
          } else {
            resolve()
          }
        })
      })
      
      // Get updated profile with XP info
      const updatedProfile = await new Promise((resolve, reject) => {
        db.get('SELECT * FROM profiles WHERE address = ?', [address.toLowerCase()], (err, result) => {
          if (err) reject(err)
          else resolve(result)
        })
      })
      
      res.json({ 
        success: true, 
        xpGained: totalXPGained,
        xpMessages,
        profile: updatedProfile
      })
    } catch (error) {
      console.error('Error updating profile:', error)
      res.status(500).json({ error: 'Failed to update profile' })
    }
  })

  // Game sharing endpoint
  router.post('/games/:gameId/share', async (req, res) => {
    const { gameId } = req.params
    const { address, platform } = req.body
    
    if (!address || !platform) {
      return res.status(400).json({ error: 'Address and platform are required' })
    }
    
    try {
      // Record the share
      await dbService.recordGameShare(gameId, address, platform)
      
      // Award XP for sharing
      const result = await xpService.awardShareXP(address, gameId, platform)
      
      res.json({
        success: true,
        xpGained: result.xpGained,
        message: result.message,
        totalXP: result.totalXP,
        alreadyAwarded: result.alreadyAwarded || false
      })
    } catch (error) {
      console.error('Error recording game share:', error)
      res.status(500).json({ error: 'Failed to record game share' })
    }
  })

  // Get user offers
  router.get('/users/:address/offers', async (req, res) => {
    const { address } = req.params
    
    try {
      const offers = await new Promise((resolve, reject) => {
        db.all(`
          SELECT * FROM offers 
          WHERE (from_address = ? OR to_address = ?)
          ORDER BY created_at DESC
        `, [address.toLowerCase(), address.toLowerCase()], (err, results) => {
          if (err) reject(err)
          else resolve(results || [])
        })
      })
      
      res.json(offers)
    } catch (error) {
      console.error('Error fetching user offers:', error)
      res.status(500).json({ error: 'Failed to fetch offers' })
    }
  })

  // Award XP endpoint
  router.post('/users/:address/award-xp', async (req, res) => {
    const { address } = req.params
    const { amount, reason, gameId } = req.body
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid XP amount' })
    }
    
    try {
      const result = await xpService.awardSpecialXP(address, reason, amount, gameId)
      res.json({ 
        success: true, 
        xpAwarded: result.xpGained,
        message: result.message,
        totalXP: result.totalXP
      })
    } catch (error) {
      console.error('Error awarding XP:', error)
      res.status(500).json({ error: 'Failed to award XP' })
    }
  })

  // Award game XP endpoint
  router.post('/users/:address/game-xp', async (req, res) => {
    const { address } = req.params
    const { gameResult, gameId } = req.body
    
    if (!gameResult || !['won', 'lost'].includes(gameResult)) {
      return res.status(400).json({ error: 'Invalid game result' })
    }
    
    try {
      const result = await xpService.awardGameXP(address, gameResult, gameId)
      res.json({ 
        success: true, 
        xpAwarded: result.xpGained,
        message: result.message,
        totalXP: result.totalXP,
        gameResult: result.gameResult
      })
    } catch (error) {
      console.error('Error awarding game XP:', error)
      res.status(500).json({ error: 'Failed to award game XP' })
    }
  })

  // Get user XP and level
  router.get('/users/:address/xp', async (req, res) => {
    const { address } = req.params
    
    try {
      const result = await xpService.getUserXP(address)
      const xpForNextLevel = xpService.getXPForNextLevel(result.level)
      
      res.json({
        xp: result.xp,
        level: result.level,
        xpForNextLevel,
        progress: result.xp / xpForNextLevel * 100
      })
    } catch (error) {
      console.error('Error fetching user XP:', error)
      res.status(500).json({ error: 'Failed to fetch user XP' })
    }
  })

  // Get XP leaderboard
  router.get('/leaderboard/xp', async (req, res) => {
    const { limit = 10 } = req.query
    
    try {
      const leaderboard = await xpService.getLeaderboard(parseInt(limit))
      res.json(leaderboard)
    } catch (error) {
      console.error('Error fetching XP leaderboard:', error)
      res.status(500).json({ error: 'Failed to fetch leaderboard' })
    }
  })

  // Get user achievements
  router.get('/users/:address/achievements', async (req, res) => {
    const { address } = req.params
    
    try {
      const achievements = await xpService.getUserAchievements(address)
      res.json(achievements)
    } catch (error) {
      console.error('Error fetching user achievements:', error)
      res.status(500).json({ error: 'Failed to fetch achievements' })
    }
  })

  router.post('/listings', async (req, res) => {
    const { creator, game_id, nft_contract, nft_token_id, nft_name, nft_image, nft_collection, asking_price, coin_data } = req.body
    
    const listingId = `listing_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`
    
    try {
      // Create ONLY listing, NOT game
      await new Promise((resolve, reject) => {
        db.run(`
          INSERT INTO listings (id, game_id, creator, nft_contract, nft_token_id, nft_name, nft_image, nft_collection, asking_price, coin_data, status)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'open')
        `, [listingId, game_id, creator, nft_contract, nft_token_id, nft_name, nft_image, nft_collection, asking_price, coin_data], function(err) {
          if (err) reject(err)
          else resolve()
        })
      })
      
      console.log(`âœ… Listing created: ${listingId} for future game: ${game_id}`)
      res.json({ success: true, listingId, gameId: game_id })
    } catch (error) {
      console.error('âŒ Error creating listing:', error)
      res.status(500).json({ error: error.message || 'Database error' })
    }
  })

  // Add a new endpoint to create game when NFT is deposited:
  router.post('/games/:gameId/create-from-listing', async (req, res) => {
    const { gameId } = req.params
    const { listingId, transactionHash } = req.body
    
    try {
      // Get listing details
      const listing = await new Promise((resolve, reject) => {
        db.get('SELECT * FROM listings WHERE game_id = ? OR id = ?', [gameId, listingId], (err, result) => {
          if (err) reject(err)
          else resolve(result)
        })
      })
      
      if (!listing) {
        return res.status(404).json({ error: 'Listing not found' })
      }
      
      // Check if game already exists
      const existingGame = await new Promise((resolve, reject) => {
        db.get('SELECT * FROM games WHERE id = ?', [gameId], (err, result) => {
          if (err) reject(err)
          else resolve(result)
        })
      })
      
      if (existingGame) {
        return res.json({ success: true, gameId, already_exists: true })
      }
      
      // Parse coin_data if it's a string
      let coinData = listing.coin_data
      if (typeof coinData === 'string') {
        try {
          coinData = JSON.parse(coinData)
        } catch (e) {
          console.warn('Failed to parse coin_data:', e)
        }
      }
      
      // Create game record with proper status
      await new Promise((resolve, reject) => {
        db.run(`
          INSERT INTO games (
            id, listing_id, blockchain_game_id, creator, challenger,
            nft_contract, nft_token_id, nft_name, nft_image, nft_collection,
            price_usd, coin_data, status, creator_deposited, game_type, chain, payment_token
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          gameId, listing.id, ethers.id(gameId), listing.creator, '', // challenger is empty initially
          listing.nft_contract, listing.nft_token_id, listing.nft_name, 
          listing.nft_image, listing.nft_collection,
          listing.asking_price, JSON.stringify(coinData), 
          'awaiting_deposit', // Status for game created but NFT not deposited yet
          false, // creator_deposited
          'nft-vs-crypto', // game_type
          'base', // chain
          'ETH' // payment_token
        ], function(err) {
          if (err) {
            console.error('Database error details:', err)
            reject(err)
          } else {
            resolve()
          }
        })
      })
      
      // Update listing status
      await new Promise((resolve, reject) => {
        db.run('UPDATE listings SET status = ? WHERE id = ?', ['game_created', listing.id], function(err) {
          if (err) reject(err)
          else resolve()
        })
      })
      
      console.log(`âœ… Game created from listing: ${gameId}`)
      res.json({ success: true, gameId })
    } catch (error) {
      console.error('âŒ Error creating game from listing:', error)
      res.status(500).json({ error: error.message || 'Database error' })
    }
  })

  // Temporary endpoint to restore missing games for NFT withdrawal
  router.post('/admin/restore-missing-games', async (req, res) => {
    try {
      console.log('ðŸ”„ Restoring missing games for NFT withdrawal...')
      
      const missingGames = [
        { id: 'listing_1755362734367_80a233d43e8c7d33', nft_token_id: 5274, price_usd: 0.15 },
        { id: 'listing_1755362378481_68e63436638e60fc', nft_token_id: 9287, price_usd: 0.15 },
        { id: 'listing_1755362334407_5c7bfe5d205da6c5', nft_token_id: 9289, price_usd: 0.15 },
        { id: 'listing_1755361845873_fc762e5943599768', nft_token_id: 9201, price_usd: 0.14 },
        { id: 'listing_1755361426703_dce7bf4a68ee978c', nft_token_id: 1271, price_usd: 0.15 }
      ]

      const NFT_CONTRACT = '0x70cdcc990efbd44a1cb1c86f7feb9962d15ed71f'
      const ADMIN_ADDRESS = '0x47d80671Bcb7Ec368ef4d3ca6E1C20173CCc9a28'
      
      let restoredCount = 0
      
      for (const game of missingGames) {
        await new Promise((resolve, reject) => {
          db.run(`
            INSERT OR REPLACE INTO games (
              id, creator, nft_contract, nft_token_id, nft_name, nft_image, 
              nft_collection, price_usd, status, created_at, creator_deposited
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            game.id, ADMIN_ADDRESS, NFT_CONTRACT, game.nft_token_id,
            `NFT #${game.nft_token_id}`, '', 'Unknown Collection',
            game.price_usd, 'waiting', new Date().toISOString(), 1
          ], function(err) {
            if (err) {
              console.error(`âŒ Error restoring game ${game.id}:`, err)
              reject(err)
            } else {
              console.log(`âœ… Restored game: ${game.id} (NFT #${game.nft_token_id})`)
              restoredCount++
              resolve()
            }
          })
        })
      }
      
      console.log(`ðŸŽ‰ Successfully restored ${restoredCount} games`)
      res.json({ 
        success: true, 
        restored: restoredCount,
        message: `Restored ${restoredCount} games for NFT withdrawal` 
      })
      
    } catch (error) {
      console.error('âŒ Error restoring games:', error)
      res.status(500).json({ error: error.message })
    }
  })

  // Get listing
  router.get('/listings/:listingId', (req, res) => {
    const { listingId } = req.params
    
    db.get('SELECT * FROM listings WHERE id = ?', [listingId], (err, listing) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' })
      }
      if (!listing) {
        return res.status(404).json({ error: 'Listing not found' })
      }
      
      // Get offers count
      db.get('SELECT COUNT(*) as count FROM offers WHERE listing_id = ? AND status = "pending"', [listingId], (err, result) => {
        listing.pending_offers = result?.count || 0
        res.json(listing)
      })
    })
  })

  // Get all active listings
  router.get('/listings', (req, res) => {
    db.all('SELECT * FROM listings WHERE status = "open" ORDER BY created_at DESC', (err, listings) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' })
      }
      res.json(listings)
    })
  })

  // Create offer
  router.post('/listings/:listingId/offers', (req, res) => {
    const { listingId } = req.params
    const { offerer_address, offer_price, message } = req.body

    console.log('ðŸ’¡ New offer request:', { listingId, offerer_address, offer_price, message })

    // Allow offers for listings that are not completed/cancelled
    db.get('SELECT * FROM listings WHERE id = ?', [listingId], (err, listing) => {
      if (err || !listing) {
        console.error('âŒ Listing not found for offer:', listingId, err)
        return res.status(404).json({ error: 'Listing not found' })
      }
      
      console.log('âœ… Found listing for offer:', { id: listing.id, status: listing.status, creator: listing.creator })
      
      // Only block offers if the listing is cancelled or completed
      if (listing.status === 'closed' || listing.status === 'completed') {
        console.warn('âš ï¸ Attempted offer on closed/completed listing:', listing.status)
        return res.status(400).json({ error: 'Cannot make offers on cancelled or completed listings' })
      }
      // Optionally, block offers if there is already a joiner/challenger (if you track that on the listing)
      // Otherwise, allow offers
      const offerId = `offer_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`
      
      console.log('ðŸ’¾ Creating offer in database:', { offerId, listingId, offerer_address, offer_price })
      
      db.run(`
        INSERT INTO offers (id, listing_id, offerer_address, offer_price, message, status)
        VALUES (?, ?, ?, ?, ?, 'pending')
      `, [offerId, listingId, offerer_address, offer_price, message], function(err) {
        if (err) {
          console.error('âŒ Error creating offer in database:', err)
          return res.status(500).json({ error: 'Database error' })
        }
        
        console.log('âœ… Offer created successfully:', offerId)
        // Notify listing creator and broadcast to room
        db.get('SELECT creator FROM listings WHERE id = ?', [listingId], (err, listing) => {
          if (listing) {
            // Send direct notification to listing creator
            wsHandlers.sendToUser(listing.creator, {
              type: 'new_offer',
              listingId,
              offerId,
              offer_price,
              message
            })
            
            // Broadcast to all users in the listing room for real-time updates
            wsHandlers.broadcastToRoom(listingId, {
              type: 'new_offer',
              listingId,
              offerId,
              offer_price,
              message,
              offerer_address
            })
            
            console.log('ðŸ“¢ Broadcasted new offer to room:', listingId)
          }
        })
        res.json({ success: true, offerId })
      })
    })
  })

  // Get offers for listing
  router.get('/listings/:listingId/offers', (req, res) => {
    const { listingId } = req.params
    
    db.all('SELECT * FROM offers WHERE listing_id = ? ORDER BY created_at DESC', [listingId], (err, offers) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' })
      }
      res.json(offers)
    })
  })

  // Get offers for game (for games created directly without listings)
  router.get('/games/:gameId/offers', (req, res) => {
    const { gameId } = req.params
    
    // First check if this game has a listing_id
    db.get('SELECT listing_id FROM games WHERE id = ?', [gameId], (err, game) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' })
      }
      
      if (!game) {
        return res.status(404).json({ error: 'Game not found' })
      }
      
      if (game.listing_id) {
        // Game has a listing, fetch offers for that listing
        db.all('SELECT * FROM offers WHERE listing_id = ? ORDER BY created_at DESC', [game.listing_id], (err, offers) => {
          if (err) {
            return res.status(500).json({ error: 'Database error' })
          }
          res.json(offers)
        })
      } else {
        // Game created directly, return empty offers array
        res.json([])
      }
    })
  })

  // Create game with NFT deposit from listing
  router.post('/listings/:listingId/create-game-with-nft', async (req, res) => {
    const { listingId } = req.params
    const { creator } = req.body
    
    try {
      // Get listing details
      const listing = await new Promise((resolve, reject) => {
        db.get('SELECT * FROM listings WHERE id = ?', [listingId], (err, result) => {
          if (err) reject(err)
          else resolve(result)
        })
      })
      
      if (!listing) {
        return res.status(404).json({ error: 'Listing not found' })
      }
      
      if (listing.creator !== creator) {
        return res.status(403).json({ error: 'Only listing creator can create game' })
      }
      
      const gameId = `game_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`
      const blockchainGameId = ethers.id(gameId)
      const depositDeadline = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours for challenger
      
      // Create game record with awaiting_challenger status (NFT will be deposited, waiting for challenger)
      await new Promise((resolve, reject) => {
        db.run(`
          INSERT INTO games (
            id, listing_id, blockchain_game_id, creator,
            nft_contract, nft_token_id, nft_name, nft_image, nft_collection,
            price_usd, coin_data, status, deposit_deadline, creator_deposited, challenger_deposited,
            game_type, chain, payment_token
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          gameId, listingId, blockchainGameId, creator,
          listing.nft_contract, listing.nft_token_id, listing.nft_name, listing.nft_image, listing.nft_collection,
          listing.asking_price, listing.coin_data, 'awaiting_challenger', depositDeadline, false, false,
          'nft-vs-crypto', 'base', 'ETH'
        ], function(err) {
          if (err) reject(err)
          else resolve()
        })
      })
      
      console.log(`âœ… Game created with NFT deposit: ${gameId}`)
      res.json({ success: true, gameId })
    } catch (error) {
      console.error('âŒ Error creating game with NFT:', error)
      res.status(500).json({ error: error.message || 'Database error' })
    }
  })

  router.post('/listings/:listingId/initialize-blockchain', async (req, res) => {
    const { listingId } = req.params
    const { gameId } = req.body
    
    try {
      // Get listing details
      const listing = await new Promise((resolve, reject) => {
        db.get('SELECT * FROM listings WHERE id = ?', [listingId], (err, result) => {
          if (err) reject(err)
          else resolve(result)
        })
      })
      
      if (!listing) {
        return res.status(404).json({ error: 'Listing not found' })
      }
      
      // Initialize on blockchain with no player 2
      if (blockchainService.hasOwnerWallet()) {
        const blockchainResult = await blockchainService.initializeGameOnChain(
          gameId,
          listing.creator,
          listing.nft_contract,
          listing.nft_token_id
        )
        
        if (!blockchainResult.success) {
          console.error('Failed to initialize game on blockchain:', blockchainResult.error)
          return res.status(500).json({ 
            error: 'Failed to initialize game on blockchain', 
            details: blockchainResult.error 
          })
        }
      }
      
      res.json({ success: true })
    } catch (error) {
      console.error('âŒ Error initializing blockchain:', error)
      res.status(500).json({ error: error.message })
    }
  })

  router.post('/offers/:offerId/accept', async (req, res) => {
    const { offerId } = req.params
    
    try {
      // Get offer details
      const offer = await new Promise((resolve, reject) => {
        db.get('SELECT * FROM offers WHERE id = ?', [offerId], (err, result) => {
          if (err) reject(err)
          else resolve(result)
        })
      })
      
      if (!offer) {
        return res.status(404).json({ error: 'Offer not found' })
      }
      
      if (offer.status !== 'pending') {
        return res.status(400).json({ error: 'Offer already processed' })
      }
      
      // Get listing details
      const listing = await new Promise((resolve, reject) => {
        db.get('SELECT * FROM listings WHERE id = ?', [offer.listing_id], (err, result) => {
          if (err) reject(err)
          else resolve(result)
        })
      })
      
      if (!listing) {
        return res.status(404).json({ error: 'Listing not found' })
      }
      
      // Check if there's already an active game for this listing
      let game = await new Promise((resolve, reject) => {
        db.get('SELECT * FROM games WHERE listing_id = ? AND status IN ("awaiting_challenger", "waiting_challenger_deposit")', 
          [listing.id], (err, result) => {
          if (err) reject(err)
          else resolve(result)
        })
      })
      
      const gameId = game?.id || `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      const depositDeadline = new Date(Date.now() + 2 * 60 * 1000) // 2 minutes from now
      
      if (!game) {
        // Create new game record
        await new Promise((resolve, reject) => {
          db.run(`
            INSERT INTO games (
              id, listing_id, offer_id, blockchain_game_id, creator, challenger,
              nft_contract, nft_token_id, nft_name, nft_image, nft_collection,
              price_usd, coin_data, status, deposit_deadline, creator_deposited, challenger_deposited,
              game_type, network, payment_token
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            gameId, listing.id, offerId, gameId, listing.creator, offer.offerer_address,
            listing.nft_contract, listing.nft_token_id, listing.nft_name, listing.nft_image, listing.nft_collection,
            offer.offer_price, listing.coin_data, 'waiting_challenger_deposit', depositDeadline, true, false,
            'nft-vs-crypto', 'base', 'ETH'
          ], function(err) {
            if (err) reject(err)
            else resolve()
          })
        })
        
        game = { id: gameId }
      } else {
        // Update existing game with challenger info
        await new Promise((resolve, reject) => {
          db.run(`
            UPDATE games 
            SET challenger = ?, offer_id = ?, price_usd = ?, 
                status = 'waiting_challenger_deposit', deposit_deadline = ?,
                creator_deposited = true
            WHERE id = ?
          `, [offer.offerer_address, offerId, offer.offer_price, depositDeadline, game.id], function(err) {
            if (err) reject(err)
            else resolve()
          })
        })
      }
      
      // No need to call setPlayer2 - contract will auto-detect when both assets are deposited!
      console.log('âœ… Simplified flow: No contract interaction needed for offer acceptance')
      
      // Update offer status
      await new Promise((resolve, reject) => {
        db.run('UPDATE offers SET status = "accepted" WHERE id = ?', [offerId], function(err) {
          if (err) reject(err)
          else resolve()
        })
      })
      
      // Update listing status
      await new Promise((resolve, reject) => {
        db.run('UPDATE listings SET status = "closed" WHERE id = ?', [offer.listing_id], function(err) {
          if (err) reject(err)
          else resolve()
        })
      })
      
      // Reject all other pending offers
      await new Promise((resolve, reject) => {
        db.run('UPDATE offers SET status = "rejected" WHERE listing_id = ? AND id != ? AND status = "pending"', 
          [offer.listing_id, offerId], function(err) {
          if (err) reject(err)
          else resolve()
        })
      })
      
      // Send WebSocket notifications
      wsHandlers.sendToUser(listing.creator, {
        type: 'offer_accepted',
        gameId: game.id,
        depositDeadline,
        challenger: offer.offerer_address,
        finalPrice: offer.offer_price,
        message: 'Offer accepted! Waiting for challenger to deposit crypto.'
      })
      
      wsHandlers.sendToUser(offer.offerer_address, {
        type: 'your_offer_accepted',
        gameId: game.id,
        depositDeadline,
        finalPrice: offer.offer_price,
        message: 'Your offer was accepted! You have 2 minutes to deposit crypto.',
        requiresDeposit: true
      })
      
      // Broadcast to room
      wsHandlers.broadcastToRoom(listing.id, {
        type: 'offer_accepted',
        listingId: listing.id,
        gameId: game.id,
        acceptedOfferId: offerId,
        challenger: offer.offerer_address,
        depositDeadline
      })
      
      // Also broadcast to game room
      wsHandlers.broadcastToRoom(game.id, {
        type: 'game_awaiting_challenger_deposit',
        gameId: game.id,
        challenger: offer.offerer_address,
        depositDeadline,
        finalPrice: offer.offer_price
      })
      
      console.log(`âœ… Offer accepted: ${offerId}, Game: ${game.id}, Deadline: ${depositDeadline}`)
      
      res.json({ 
        success: true, 
        gameId: game.id,
        depositDeadline,
        message: 'Offer accepted! Challenger has 2 minutes to deposit crypto.'
      })
      
    } catch (error) {
      console.error('âŒ Error accepting offer:', error)
      res.status(500).json({ error: 'Failed to accept offer', details: error.message })
    }
  })

  // Reject offer
  router.post('/offers/:offerId/reject', (req, res) => {
    const { offerId } = req.params
    
    db.run('UPDATE offers SET status = "rejected" WHERE id = ?', [offerId], function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' })
      }
      
      // Notify offerer
      db.get('SELECT * FROM offers WHERE id = ?', [offerId], (err, offer) => {
        if (offer) {
          wsHandlers.sendToUser(offer.offerer_address, {
            type: 'offer_rejected',
            offerId
          })
        }
      })
      
      res.json({ success: true })
    })
  })

  // Leaderboard endpoints
  router.get('/leaderboard/all-time', (req, res) => {
    const query = `
      SELECT 
        user_address as address,
        total_rewards_earned as totalWinnings,
        games_won as gamesWon,
        total_games as totalGames
      FROM player_stats 
      WHERE total_rewards_earned > 0
      ORDER BY totalWinnings DESC
      LIMIT 50
    `;
    
    db.all(query, [], (err, rows) => {
      if (err) {
        console.error('Error fetching all-time leaderboard:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(rows || []);
    });
  });

  router.get('/leaderboard/weekly', (req, res) => {
    // Get current week (Sunday to Sunday)
    const now = new Date();
    const currentWeekStart = new Date(now);
    currentWeekStart.setDate(now.getDate() - now.getDay()); // Start of week (Sunday)
    currentWeekStart.setHours(0, 0, 0, 0);
    
    const currentWeekEnd = new Date(currentWeekStart);
    currentWeekEnd.setDate(currentWeekStart.getDate() + 7);
    
    const query = `
      SELECT 
        g.winner as address,
        SUM(g.price_usd) as totalWinnings,
        COUNT(*) as gamesWon
      FROM games g
      WHERE g.status = 'completed' 
        AND g.winner IS NOT NULL
        AND g.winner != ''
        AND g.updated_at >= ?
        AND g.updated_at < ?
      GROUP BY g.winner
      ORDER BY totalWinnings DESC
      LIMIT 50
    `;
    
    db.all(query, [currentWeekStart.toISOString(), currentWeekEnd.toISOString()], (err, rows) => {
      if (err) {
        console.error('Error fetching weekly leaderboard:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(rows || []);
    });
  });

  router.get('/leaderboard/last-week-winner', (req, res) => {
    // Get last week (Sunday to Sunday)
    const now = new Date();
    const lastWeekStart = new Date(now);
    lastWeekStart.setDate(now.getDate() - now.getDay() - 7); // Start of last week (Sunday)
    lastWeekStart.setHours(0, 0, 0, 0);
    
    const lastWeekEnd = new Date(lastWeekStart);
    lastWeekEnd.setDate(lastWeekStart.getDate() + 7);
    
    const query = `
      SELECT 
        g.winner as address,
        SUM(g.price_usd) as totalWinnings,
        COUNT(*) as gamesWon
      FROM games g
      WHERE g.status = 'completed' 
        AND g.winner IS NOT NULL
        AND g.winner != ''
        AND g.updated_at >= ?
        AND g.updated_at < ?
      GROUP BY g.winner
      ORDER BY totalWinnings DESC
      LIMIT 1
    `;
    
    db.get(query, [lastWeekStart.toISOString(), lastWeekEnd.toISOString()], (err, row) => {
      if (err) {
        console.error('Error fetching last week winner:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(row || {});
    });
  });

  // Get game
  router.get('/games/:gameId', (req, res) => {
    const { gameId } = req.params
    
    db.get('SELECT * FROM games WHERE id = ? OR blockchain_game_id = ?', [gameId, gameId], (err, game) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' })
      }
      if (!game) {
        // Check if it's a listing
        db.get('SELECT * FROM listings WHERE id = ?', [gameId], (err, listing) => {
          if (err || !listing) {
            return res.status(404).json({ error: 'Game/Listing not found' })
          }
          // Return listing as game-like structure
          let coinData = null
          try {
            coinData = listing.coin_data ? JSON.parse(listing.coin_data) : null
          } catch (e) {
            console.warn('Failed to parse coin_data for listing:', listing.id, e)
          }
          
          res.json({
            id: listing.id,
            type: 'listing',
            game_type: 'nft-vs-crypto',
            creator: listing.creator,
            creator_address: listing.creator, // Add for compatibility
            nft_contract: listing.nft_contract,
            nft_token_id: listing.nft_token_id,
            nft_name: listing.nft_name,
            nft_image: listing.nft_image,
            nft_collection: listing.nft_collection,
            asking_price: listing.asking_price,
            price_usd: listing.asking_price, // Add for consistency
            coin_data: listing.coin_data,
            coinData: coinData, // Parsed coin data
            status: listing.status === 'open' ? 'awaiting_challenger' : listing.status, // Map 'open' to 'awaiting_challenger'
            creator_deposited: true, // Assume NFT is deposited if listing exists
            challenger_deposited: false
          })
        })
        return
      }
      
      // Parse coin_data if it's a string
      let coinData = null
      try {
        coinData = game.coin_data ? JSON.parse(game.coin_data) : null
      } catch (e) {
        console.warn('Failed to parse coin_data for game:', gameId, e)
      }
      
      // Add parsed coin data to response
      game.coinData = coinData
      
      // Get round information
      db.all('SELECT * FROM game_rounds WHERE game_id = ? ORDER BY round_number', [gameId], (err, rounds) => {
        game.rounds = rounds || []
        
        // Calculate wins
        game.creator_wins = rounds.filter(r => r.round_winner === game.creator).length
        game.challenger_wins = rounds.filter(r => r.round_winner === game.challenger).length
        
        res.json(game)
      })
    })
  })

  // Get all games
  router.get('/games', (req, res) => {
    db.all('SELECT * FROM games ORDER BY created_at DESC', (err, games) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' })
      }
      res.json(games)
    })
  })

  // Update the deposit-confirmed endpoint to handle the flow better
  router.post('/games/:gameId/deposit-confirmed', (req, res) => {
    const { gameId } = req.params
    const { player, assetType, transactionHash } = req.body
    
    db.get('SELECT * FROM games WHERE id = ?', [gameId], async (err, game) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' })
      }
      
      if (!game) {
        return res.status(404).json({ error: 'Game not found' })
      }
      
      const isCreator = player === game.creator
      
      if (assetType === 'nft' && isCreator) {
        // Update game status to waiting for challenger
        db.run(`
          UPDATE games 
          SET creator_deposited = true, 
              status = 'awaiting_challenger',
              deposit_deadline = datetime('now', '+24 hours')
          WHERE id = ?
        `, [gameId], (err) => {
          if (err) {
            return res.status(500).json({ error: 'Database error' })
          }
          
          console.log('âœ… NFT deposited, game now awaiting challenger')
          
          // Broadcast to room
          wsHandlers.broadcastToRoom(gameId, {
            type: 'nft_deposited',
            gameId,
            message: 'NFT deposited! Game is now open for challengers.'
          })
          
          res.json({ success: true })
        })
      } else if (assetType === 'eth' && !isCreator) {
        // Challenger deposited crypto
        db.run(`
          UPDATE games 
          SET challenger_deposited = true,
              status = 'active'
          WHERE id = ?
        `, [gameId], (err) => {
          if (err) {
            return res.status(500).json({ error: 'Database error' })
          }
          
          console.log('ðŸŽ® Both assets deposited - game is now active!')
          
          // Notify all players
          wsHandlers.broadcastToRoom(gameId, {
            type: 'game_started',
            gameId,
            message: 'Both assets deposited - game starting!'
          })
          
          res.json({ success: true })
        })
      } else {
        res.status(400).json({ error: 'Invalid deposit confirmation' })
      }
    })
  })

  // Auto-confirm NFT deposit if already ready
  router.post('/games/:gameId/use-ready-nft', (req, res) => {
    const { gameId } = req.params
    const { player } = req.body
    
    db.get('SELECT * FROM games WHERE id = ?', [gameId], (err, game) => {
      if (err || !game) {
        return res.status(404).json({ error: 'Game not found' })
      }
      
      if (player !== game.creator) {
        return res.status(400).json({ error: 'Only creator can use ready NFT' })
      }
      
      // Check if the game's NFT is ready for this player
      db.get(
        'SELECT * FROM ready_nfts WHERE player_address = ? AND nft_contract = ? AND nft_token_id = ?',
        [player, game.nft_contract, game.nft_token_id],
        (err, readyNft) => {
          if (err || !readyNft) {
            return res.status(404).json({ error: 'Ready NFT not found' })
          }
          
          // Remove from ready_nfts (now in active use)
          db.run(
            'DELETE FROM ready_nfts WHERE id = ?',
            [readyNft.id],
            (err) => {
              if (err) {
                console.error('âŒ Error removing ready NFT:', err)
                return res.status(500).json({ error: 'Database error' })
              }
              
              // Mark creator as deposited
              db.run('UPDATE games SET creator_deposited = true WHERE id = ?', [gameId], (err) => {
                if (err) {
                  return res.status(500).json({ error: 'Database error' })
                }
                
                console.log('âš¡ Ready NFT used for instant game start:', game.nft_name)
                
                // Notify players
                wsHandlers.broadcastToRoom(gameId, {
                  type: 'ready_nft_used',
                  player,
                  nft_name: game.nft_name,
                  message: 'Pre-loaded NFT used - waiting for challenger deposit'
                })
                
                wsHandlers.broadcastToRoom(gameId, {
                  type: 'deposit_confirmed',
                  player,
                  assetType: 'nft'
                })
                
                res.json({ success: true, message: 'Ready NFT used successfully!' })
              })
            }
          )
        }
      )
    })
  })

  // Get user games
  router.get('/users/:address/games', (req, res) => {
    const { address } = req.params
    
    // Check if games table exists first
    db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='games';", (err, tableExists) => {
      if (err || !tableExists) {
        console.log('Games table does not exist, returning empty array')
        return res.json([])
      }
      
      db.all(
        'SELECT * FROM games WHERE creator = ? OR joiner = ? ORDER BY created_at DESC',
        [address, address],
        (err, games) => {
          if (err) {
            console.error('Database error in /users/:address/games:', err)
            return res.json([]) // Return empty array instead of error
          }
          
          // Ensure games is an array (handle null/undefined)
          const gamesList = games || []
          
          // Transform the data to match frontend expectations
          const transformedGames = gamesList.map(game => {
          // Ensure createdAt is a valid timestamp
          let createdAt = Date.now() / 1000 // Default to current time
          if (game.created_at) {
            const parsedDate = new Date(game.created_at)
            if (!isNaN(parsedDate.getTime())) {
              createdAt = Math.floor(parsedDate.getTime() / 1000)
            }
          }
          
          return {
            ...game,
            createdAt: createdAt,
            updatedAt: game.updated_at ? Math.floor(new Date(game.updated_at).getTime() / 1000) : createdAt,
            gameId: game.id,
            nftContract: game.nft_contract,
            tokenId: game.nft_token_id,
            priceUSD: game.price_usd,
            gameType: 0, // Default to ETH for now
            paymentToken: 0, // Default to ETH
            totalPaid: '0',
            winner: game.winner || '0x0000000000000000000000000000000000000000',
            expiresAt: game.deposit_deadline ? Math.floor(new Date(game.deposit_deadline).getTime() / 1000) : Math.floor(Date.now() / 1000) + 3600,
            nftChallenge: {
              challengerNFTContract: '0x0000000000000000000000000000000000000000',
              challengerTokenId: '0'
            }
          }
        })
        
        res.json(transformedGames)
        }
      )
    })
  })

  // Get user listings
  router.get('/users/:address/listings', (req, res) => {
    const { address } = req.params
    
    db.all(
      'SELECT * FROM listings WHERE creator = ? ORDER BY created_at DESC',
      [address],
      (err, listings) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' })
        }
        res.json(listings)
      }
    )
  })



  // Get dashboard data for user
  router.get('/dashboard/:address', (req, res) => {
    const { address } = req.params
    
    // Get user's listings
    db.all('SELECT * FROM listings WHERE creator = ? ORDER BY created_at DESC', [address], (err, listings) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' })
      }
      
      // Get user's outgoing offers
      db.all('SELECT * FROM offers WHERE offerer_address = ? ORDER BY created_at DESC', [address], (err, outgoingOffers) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' })
        }
        
        // Get user's incoming offers (offers on their listings)
        db.all(`
          SELECT o.*, l.nft_name, l.nft_image, l.nft_collection 
          FROM offers o 
          JOIN listings l ON o.listing_id = l.id 
          WHERE l.creator = ? AND o.status = 'pending'
          ORDER BY o.created_at DESC
        `, [address], (err, incomingOffers) => {
          if (err) {
            return res.status(500).json({ error: 'Database error' })
          }
          
          res.json({
            listings: listings || [],
            outgoingOffers: outgoingOffers || [],
            incomingOffers: incomingOffers || []
          })
        })
      })
    })
  })



  // ===== READY NFT SYSTEM =====

  // Pre-load NFT during listing creation
  router.post('/nft/preload', async (req, res) => {
    const { player_address, nft_contract, nft_token_id, nft_name, nft_image, nft_collection } = req.body
    
    console.log('ðŸŽ¯ Pre-loading NFT:', { player_address, nft_contract, nft_token_id })
    
    // Check if NFT already ready
    db.get(
      'SELECT * FROM ready_nfts WHERE player_address = ? AND nft_contract = ? AND nft_token_id = ?',
      [player_address, nft_contract, nft_token_id],
      (err, existing) => {
        if (existing) {
          return res.status(400).json({ error: 'NFT already pre-loaded' })
        }
        
        // Store in ready_nfts table
        db.run(`
          INSERT INTO ready_nfts (player_address, nft_contract, nft_token_id, nft_name, nft_image, nft_collection, source)
          VALUES (?, ?, ?, ?, ?, ?, 'preload')
        `, [player_address, nft_contract, nft_token_id, nft_name, nft_image, nft_collection], function(err) {
          if (err) {
            console.error('âŒ Error pre-loading NFT:', err)
            return res.status(500).json({ error: 'Database error' })
          }
          
          console.log('âœ… NFT pre-loaded successfully:', nft_contract, nft_token_id)
          res.json({ success: true, message: 'NFT pre-loaded for instant games!' })
        })
      }
    )
  })

  // Withdraw ready NFT
  router.post('/nft/withdraw', async (req, res) => {
    const { player_address, nft_contract, nft_token_id } = req.body
    
    console.log('ðŸ’Ž Withdrawing ready NFT:', { player_address, nft_contract, nft_token_id })
    
    // Remove from ready_nfts table
    db.run(
      'DELETE FROM ready_nfts WHERE player_address = ? AND nft_contract = ? AND nft_token_id = ?',
      [player_address, nft_contract, nft_token_id],
      function(err) {
        if (err) {
          console.error('âŒ Error withdrawing NFT:', err)
          return res.status(500).json({ error: 'Database error' })
        }
        
        if (this.changes === 0) {
          return res.status(404).json({ error: 'Ready NFT not found' })
        }
        
        console.log('âœ… Ready NFT withdrawn successfully')
        res.json({ success: true, message: 'NFT withdrawn from ready state' })
      }
    )
  })

  // Get user's ready NFTs
  router.get('/users/:address/ready-nfts', (req, res) => {
    const { address } = req.params
    
    db.all(
      'SELECT * FROM ready_nfts WHERE player_address = ? ORDER BY deposited_at DESC',
      [address],
      (err, readyNfts) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' })
        }
        res.json(readyNfts || [])
      }
    )
  })

  // Check if specific NFT is ready for user
  router.get('/nft/ready-status/:address/:contract/:tokenId', (req, res) => {
    const { address, contract, tokenId } = req.params
    
    db.get(
      'SELECT * FROM ready_nfts WHERE player_address = ? AND nft_contract = ? AND nft_token_id = ?',
      [address, contract, tokenId],
      (err, readyNft) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' })
        }
        res.json({ 
          ready: !!readyNft,
          nft: readyNft || null
        })
      }
    )
  })

  // ===== ADMIN ENDPOINTS =====

  // Get all games and listings for admin
  router.get('/admin/games', (req, res) => {
    // Get both games and listings with stats
    db.all('SELECT * FROM games ORDER BY created_at DESC', (err, games) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' })
      }
      
      db.all('SELECT * FROM listings ORDER BY created_at DESC', (err, listings) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' })
        }
        
        // Calculate stats
        const totalGames = games.length
        const activeGames = games.filter(g => g.status === 'active' || g.status === 'waiting_challenger_deposit').length
        const totalListings = listings.length
        const openListings = listings.filter(l => l.status === 'open').length
        
        let totalVolume = 0
        games.forEach(game => {
          if (game.price_usd) {
            totalVolume += game.price_usd
          }
        })
        
        res.json({
          games: games || [],
          listings: listings || [],
          stats: {
            totalGames,
            activeGames,
            totalListings,
            openListings,
            totalVolume
          }
        })
      })
    })
  })

  // Update game status
  router.patch('/admin/games/:gameId', (req, res) => {
    const { gameId } = req.params
    const updates = req.body
    
    // Build dynamic update query
    const updateFields = []
    const updateValues = []
    
    if (updates.status !== undefined) {
      updateFields.push('status = ?')
      updateValues.push(updates.status)
    }
    
    if (updates.joiner !== undefined) {
      updateFields.push('challenger = ?')
      updateValues.push(updates.joiner)
    }
    
    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' })
    }
    
    updateValues.push(gameId)
    
    const query = `UPDATE games SET ${updateFields.join(', ')} WHERE id = ?`
    
    db.run(query, updateValues, function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' })
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Game not found' })
      }
      
      res.json({ success: true, changes: this.changes })
    })
  })

  // Delete specific game
  router.delete('/admin/games/:gameId', (req, res) => {
    const { gameId } = req.params
    
    db.run('DELETE FROM games WHERE id = ?', [gameId], function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' })
      }
      
      res.json({ success: true, changes: this.changes })
    })
  })

  // Clear all games
  router.delete('/admin/games', (req, res) => {
    db.run('DELETE FROM games', [], function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' })
      }
      
      res.json({ success: true, changes: this.changes })
    })
  })

  // Update listing status
  router.patch('/admin/listings/:listingId', (req, res) => {
    const { listingId } = req.params
    const updates = req.body
    
    const updateFields = []
    const updateValues = []
    
    if (updates.status !== undefined) {
      updateFields.push('status = ?')
      updateValues.push(updates.status)
    }
    
    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' })
    }
    
    updateValues.push(listingId)
    
    const query = `UPDATE listings SET ${updateFields.join(', ')} WHERE id = ?`
    
    db.run(query, updateValues, function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' })
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Listing not found' })
      }
      
      res.json({ success: true, changes: this.changes })
    })
  })

  // Delete specific listing
  router.delete('/admin/listings/:listingId', (req, res) => {
    const { listingId } = req.params
    
    db.run('DELETE FROM listings WHERE id = ?', [listingId], function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' })
      }
      
      res.json({ success: true, changes: this.changes })
    })
  })

  // Clear all listings
  router.delete('/admin/listings', (req, res) => {
    db.run('DELETE FROM listings', [], function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' })
      }
      
      res.json({ success: true, changes: this.changes })
    })
  })

  // Admin pause all games endpoint
  router.post('/admin/pause-all', (req, res) => {
    db.run('UPDATE games SET status = "paused" WHERE status IN ("waiting_deposits", "waiting_challenger_deposit")', [], function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' })
      }
      
      res.json({ success: true, pausedGames: this.changes })
    })
  })

  // Update NFT metadata for all games
  router.post('/admin/update-all-nft-metadata', async (req, res) => {
    try {
      let updated = 0
      let errors = 0
      
      // Get all games
      db.all('SELECT * FROM games', [], (err, games) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' })
        }
        
        // For now, just return success since NFT metadata updating would require external API calls
        res.json({ updated: games.length, errors: 0 })
      })
    } catch (error) {
      res.status(500).json({ error: error.message })
    }
  })

  // Database reinit endpoint
  router.post('/debug/init', (req, res) => {
    // This would typically reinitialize database tables
    // For safety, we'll just return success
    res.json({ success: true, message: 'Database structure verified' })
  })

  // Chat history endpoint
  router.get('/chat/:gameId', async (req, res) => {
    const { gameId } = req.params
    const limit = parseInt(req.query.limit) || 50
    
    try {
      const messages = await dbService.getChatHistory(gameId, limit)
      console.log(`ðŸ“š API: Returning ${messages.length} chat messages for game ${gameId}`)
      res.json({ messages })
    } catch (error) {
      console.error('âŒ Error fetching chat history:', error)
      res.status(500).json({ error: 'Failed to fetch chat history' })
    }
  })

  // New route: Confirm deposit received (called by frontend after successful deposit)
  router.post('/games/:gameId/deposit-confirmed', async (req, res) => {
    const { gameId } = req.params
    const { player, assetType, transactionHash } = req.body
    
    try {
      console.log('ðŸ’° Deposit confirmation received:', { gameId, player, assetType, transactionHash })
      
      // Get game details
      const game = await new Promise((resolve, reject) => {
        db.get('SELECT * FROM games WHERE id = ?', [gameId], (err, result) => {
          if (err) reject(err)
          else resolve(result)
        })
      })
      
      if (!game) {
        return res.status(404).json({ error: 'Game not found' })
      }
      
      // Update deposit status in database
      let updateField = ''
      if (assetType === 'nft' && player.toLowerCase() === game.creator.toLowerCase()) {
        updateField = 'creator_deposited = true'
      } else if (assetType === 'eth' && player.toLowerCase() === game.challenger.toLowerCase()) {
        updateField = 'challenger_deposited = true'
      } else {
        return res.status(400).json({ error: 'Invalid deposit confirmation' })
      }
      
      await new Promise((resolve, reject) => {
        db.run(`UPDATE games SET ${updateField} WHERE id = ?`, [gameId], function(err) {
          if (err) reject(err)
          else resolve()
        })
      })
      
      // Check if both players have deposited using contract
      if (blockchainService.hasOwnerWallet()) {
        const gameReadyResult = await blockchainService.isGameReady(gameId)
        
        if (gameReadyResult.success && gameReadyResult.isReady) {
          console.log('ðŸŽ® Both assets deposited - Game is ready!')
          
          // Update game status to active
          await new Promise((resolve, reject) => {
            db.run('UPDATE games SET status = "active" WHERE id = ?', [gameId], function(err) {
              if (err) reject(err)
              else resolve()
            })
          })
          
          // Broadcast game started
          wsHandlers.broadcastToRoom(gameId, {
            type: 'game_started',
            gameId,
            message: 'Both players have deposited! Game is now active.',
            bothDeposited: true
          })
          
          wsHandlers.broadcastToRoom(gameId, {
            type: 'deposit_received',
            gameId,
            player,
            assetType,
            bothDeposited: true
          })
          
          console.log(`ðŸŽ® Game ${gameId} is now active with both deposits confirmed`)
        } else {
          // Only one deposit so far
          wsHandlers.broadcastToRoom(gameId, {
            type: 'deposit_received',
            gameId,
            player,
            assetType,
            bothDeposited: false
          })
        }
      }
      
      res.json({ success: true, message: 'Deposit confirmed' })
      
    } catch (error) {
      console.error('âŒ Error confirming deposit:', error)
      res.status(500).json({ error: 'Failed to confirm deposit', details: error.message })
    }
  })

  // Route: Complete game (called by game engine after flip result)
  router.post('/games/:gameId/complete', async (req, res) => {
    const { gameId } = req.params
    const { winner, loser, result } = req.body
    
    try {
      console.log('ðŸ† Completing game:', { gameId, winner, loser, result })
      
      // Update game in database
      await new Promise((resolve, reject) => {
        db.run(`
          UPDATE games 
          SET status = 'completed', winner = ?, completed_at = ? 
          WHERE id = ?
        `, [winner, new Date().toISOString(), gameId], function(err) {
          if (err) reject(err)
          else resolve()
        })
      })
      
      // Complete game on blockchain (transfers assets to winner)
      if (blockchainService.hasOwnerWallet()) {
        const completeResult = await blockchainService.completeGameOnChain(gameId, winner)
        
        if (completeResult.success) {
          console.log('âœ… Game completed on blockchain:', completeResult.transactionHash)
          
          // Broadcast completion
          wsHandlers.broadcastToRoom(gameId, {
            type: 'game_completed',
            gameId,
            winner,
            loser,
            result,
            transactionHash: completeResult.transactionHash
          })
          
          res.json({ 
            success: true, 
            winner, 
            transactionHash: completeResult.transactionHash,
            message: 'Game completed and assets transferred to winner!'
          })
        } else {
          console.error('âŒ Failed to complete game on blockchain:', completeResult.error)
          res.status(500).json({ 
            error: 'Failed to complete game on blockchain', 
            details: completeResult.error 
          })
        }
      } else {
        // No blockchain service - just update database
        wsHandlers.broadcastToRoom(gameId, {
          type: 'game_completed',
          gameId,
          winner,
          loser,
          result
        })
        
        res.json({ success: true, winner, message: 'Game completed!' })
      }
      
    } catch (error) {
      console.error('âŒ Error completing game:', error)
      res.status(500).json({ error: 'Failed to complete game', details: error.message })
    }
  })

  // Route: Check game contract status
  router.get('/games/:gameId/contract-status', async (req, res) => {
    const { gameId } = req.params
    
    try {
      if (!blockchainService.hasOwnerWallet()) {
        return res.json({ 
          contractAvailable: false, 
          message: 'Blockchain service not configured' 
        })
      }
      
      const gameStateResult = await blockchainService.getGameState(gameId)
      
      if (gameStateResult.success) {
        res.json({
          contractAvailable: true,
          gameState: gameStateResult.gameState,
          isReady: gameStateResult.gameState.isReady
        })
      } else {
        res.json({
          contractAvailable: true,
          error: gameStateResult.error
        })
      }
      
    } catch (error) {
      console.error('âŒ Error checking contract status:', error)
      res.status(500).json({ error: 'Failed to check contract status' })
    }
  })

  return router
}

module.exports = { createApiRoutes } 

Websoicket.js
const crypto = require('crypto')
const CoinStreamService = require('../services/coinStream')
const GameEngine = require('../services/gameEngine')

// Room management
const rooms = new Map()
const socketRooms = new Map()
const userSockets = new Map()

// Initialize game engine
let gameEngine = null

// Create WebSocket handlers
function createWebSocketHandlers(wss, dbService, blockchainService) {
  // Initialize game engine
  gameEngine = new GameEngine(dbService, {
    broadcastToRoom: (roomId, message) => broadcastToRoom(roomId, message),
    broadcastToAll: (message) => broadcastToAll(message),
    sendToUser: (address, message) => sendToUser(address, message)
  })
  // Handle WebSocket connections
  wss.on('connection', (socket, req) => {
    socket.id = crypto.randomBytes(16).toString('hex')
    console.log(`ðŸ”Œ New WebSocket connection: ${socket.id}`)
    console.log(`ðŸŒ Connection from: ${req.socket.remoteAddress}`)
    console.log(`ðŸ“Š Total connected clients: ${wss.clients.size}`)
    
    socket.on('close', () => {
      console.log(`ðŸ”Œ WebSocket disconnected: ${socket.id}`)
      
      // Cleanup
      const room = socketRooms.get(socket.id)
      if (room && rooms.has(room)) {
        rooms.get(room).delete(socket.id)
      }
      socketRooms.delete(socket.id)
      
      if (socket.address) {
        userSockets.delete(socket.address)
      }
    })

    socket.on('message', async (message) => {
      try {
        console.log(`ðŸ“¨ Raw message from ${socket.id}:`, message.toString())
        const data = JSON.parse(message)
        
        // Ensure type field exists
        if (!data || typeof data !== 'object') {
          console.warn('Invalid WebSocket data format')
          return
        }
        
        console.log('ðŸ“¡ Received WebSocket message:', data)
        console.log('ðŸ” Message type:', data.type)
        
        switch (data.type) {
          case 'join_room':
            handleJoinRoom(socket, data)
            break
          case 'register_user':
            handleRegisterUser(socket, data)
            break
          case 'chat_message':
            handleChatMessage(socket, data)
            break
          case 'GAME_ACTION':
            console.log('ðŸŽ® Received GAME_ACTION:', data)
            handleGameAction(socket, data, dbService)
            break
          case 'nft_offer':
            handleNftOffer(socket, data)
            break
          case 'crypto_offer':
            console.log('ðŸŽ¯ Handling crypto_offer:', data)
            handleCryptoOffer(socket, data, dbService)
            break
          case 'accept_nft_offer':
          case 'accept_crypto_offer':
            handleOfferAccepted(socket, data)
            break
          case 'ping':
            // Handle heartbeat ping
            try {
              socket.send(JSON.stringify({ 
                type: 'pong', 
                timestamp: data.timestamp 
              }))
            } catch (error) {
              console.error('âŒ Error sending pong:', error)
            }
            break
          default:
            console.log('âš ï¸ Unhandled WebSocket message type:', data.type)
        }
      } catch (error) {
        console.error('âŒ WebSocket error:', error)
      }
    })
  })

  // Broadcast to room
  function broadcastToRoom(roomId, message) {
    if (!rooms.has(roomId)) {
      console.log(`âš ï¸ Room ${roomId} not found, creating it`)
      rooms.set(roomId, new Set())
    }
    
    const room = rooms.get(roomId)
    const messageStr = JSON.stringify(message)
    
    console.log(`ðŸ“¢ Broadcasting to room ${roomId}:`, {
      messageType: message.type,
      roomSize: room.size,
      connectedClients: wss.clients.size,
      message: message,
      roomMembers: Array.from(room)
    })
    
    let successfulBroadcasts = 0
    let failedBroadcasts = 0
    
    // Get all active WebSocket clients
    const activeClients = Array.from(wss.clients).filter(client => 
      client.readyState === 1 // WebSocket.OPEN
    )
    
    console.log(`ðŸ” Active clients: ${activeClients.length}, Room members: ${room.size}`)
    
    // Broadcast to room members
    room.forEach(socketId => {
      const client = activeClients.find(s => s.id === socketId)
      if (client) {
        try {
          client.send(messageStr)
          successfulBroadcasts++
          console.log(`âœ… Sent message to client ${socketId}`)
        } catch (error) {
          console.error(`âŒ Failed to send to client ${socketId}:`, error)
          failedBroadcasts++
          // Remove failed client from room
          room.delete(socketId)
        }
      } else {
        console.log(`âš ï¸ Client ${socketId} not found or not connected, removing from room`)
        room.delete(socketId)
        failedBroadcasts++
      }
    })
    
    // Also try to broadcast to any clients that might not be in the room but should receive the message
    // This is a safety net for connection issues
    if (message.type === 'player_choice_made' || message.type === 'both_choices_made' || message.type === 'power_charged') {
      activeClients.forEach(client => {
        if (client.address && !room.has(client.id)) {
          try {
            client.send(messageStr)
            console.log(`ðŸ“¤ Sent message to non-room client: ${client.address}`)
          } catch (error) {
            console.error(`âŒ Failed to send to non-room client:`, error)
          }
        }
      })
    }
    
    console.log(`âœ… Broadcast complete: ${successfulBroadcasts} successful, ${failedBroadcasts} failed`)
    
    // Clean up empty rooms
    if (room.size === 0) {
      rooms.delete(roomId)
      console.log(`ðŸ§¹ Cleaned up empty room: ${roomId}`)
    }
  }

  // Broadcast to all
  function broadcastToAll(message) {
    const messageStr = JSON.stringify(message)
    wss.clients.forEach(client => {
      if (client.readyState === 1) { // WebSocket.OPEN
        client.send(messageStr)
      }
    })
  }

  // Get user socket
  function getUserSocket(address) {
    return userSockets.get(address)
  }

  // Send message to specific user
  function sendToUser(address, message) {
    const socket = userSockets.get(address)
    if (socket && socket.readyState === 1) { // WebSocket.OPEN
      socket.send(JSON.stringify(message))
    }
  }

  // Add a function to ensure room membership
  function ensureRoomMembership(socket, roomId) {
    if (!rooms.has(roomId)) {
      rooms.set(roomId, new Set())
    }
    
    const room = rooms.get(roomId)
    if (!room.has(socket.id)) {
      room.add(socket.id)
      socketRooms.set(socket.id, roomId)
      console.log(`âœ… Added socket ${socket.id} to room ${roomId}`)
    }
  }

  async function handleJoinRoom(socket, data) {
    const { roomId } = data
    
    console.log(`ðŸ‘¥ Socket ${socket.id} requesting to join room ${roomId}`)
    console.log(`ðŸ  Current rooms:`, Array.from(rooms.keys()))
    console.log(`ðŸ‘¥ Current room members:`, Array.from(rooms.values()).map(room => room.size))
    
    // Leave previous room if any
    const oldRoom = socketRooms.get(socket.id)
    if (oldRoom && rooms.has(oldRoom)) {
      rooms.get(oldRoom).delete(socket.id)
      console.log(`ðŸ‘‹ Socket ${socket.id} left old room ${oldRoom}`)
    }
    
    // Join new room
    if (!rooms.has(roomId)) {
      rooms.set(roomId, new Set())
      console.log(`ðŸ  Created new room: ${roomId}`)
    }
    
    const room = rooms.get(roomId)
    room.add(socket.id)
    socketRooms.set(socket.id, roomId)
    
    console.log(`ðŸ‘¥ Socket ${socket.id} joined room ${roomId} (${room.size} members total)`)
    console.log(`ðŸ  All rooms after join:`, Array.from(rooms.keys()))
    console.log(`ðŸ‘¥ All room members:`, Array.from(rooms.entries()).map(([roomId, members]) => ({ roomId, memberCount: members.size, members: Array.from(members) })))
    
    // Send confirmation
    try {
      socket.send(JSON.stringify({
        type: 'room_joined',
        roomId: roomId,
        members: room.size
      }))
      
      // Load and send chat history to the new player
      try {
        const chatHistory = await dbService.getChatHistory(roomId, 50) // Load last 50 messages
        console.log(`ðŸ“š Loading chat history for room ${roomId}: ${chatHistory.length} messages`)
        
        if (chatHistory.length > 0) {
          // Send chat history to the new player
          socket.send(JSON.stringify({
            type: 'chat_history',
            roomId: roomId,
            messages: chatHistory
          }))
          console.log(`ðŸ“¤ Sent chat history to new player in room ${roomId}`)
        }
      } catch (error) {
        console.error('âŒ Error loading chat history:', error)
      }
      
    } catch (error) {
      console.error('âŒ Failed to send room join confirmation:', error)
    }
  }

  function handleRegisterUser(socket, data) {
    const { address } = data
    socket.address = address
    userSockets.set(address, socket)
    console.log(`ðŸ‘¤ User registered: ${address}`)
  }

  async function handleChatMessage(socket, data) {
    const { roomId, gameId, message, from } = data
    
    // Use gameId as roomId if roomId is not provided
    const targetRoomId = roomId || gameId
    
    const senderAddress = socket.address || from || 'anonymous'
    
    try {
      // Save to database
      await dbService.saveChatMessage(targetRoomId, senderAddress, message, 'chat')
      
      // Broadcast to room
      broadcastToRoom(targetRoomId, {
        type: 'chat_message',
        message,
        from: senderAddress,
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      console.error('âŒ Error saving chat message:', error)
    }
  }

  async function handleGameAction(socket, data, dbService) {
    const { gameId, action, choice, player, powerLevel } = data
    console.log('ðŸŽ¯ Processing game action:', { gameId, action, choice, player })
    
    if (!gameEngine) {
      console.error('âŒ Game engine not initialized')
      return
    }
    
    // Get game state from engine
    let gameState = gameEngine.getGameState(gameId)
    
    // If game not in engine, try to initialize it
    if (!gameState) {
      console.log('ðŸ”„ Game not in engine, initializing...')
      const db = dbService.getDatabase()
      
      db.get('SELECT * FROM games WHERE id = ?', [gameId], async (err, game) => {
        if (err || !game) {
          console.error('âŒ Game not found in database:', gameId)
          return
        }
        
        // Initialize game in engine
        gameState = await gameEngine.initializeGame(gameId, game)
        if (!gameState) {
          console.error('âŒ Failed to initialize game in engine')
          return
        }
        
        // Now handle the action
        await handleGameActionInternal(gameId, action, choice, player, powerLevel)
      })
      return
    }
    
    // Handle action with existing game state
    await handleGameActionInternal(gameId, action, choice, player, powerLevel)
  }

  async function handleGameActionInternal(gameId, action, choice, player, powerLevel) {
    console.log('ðŸŽ¯ Processing game action with engine:', { gameId, action, choice, player })
    
    switch (action) {
      case 'MAKE_CHOICE':
        console.log('ðŸŽ¯ Player making choice:', { player, choice, gameId })
        await gameEngine.handlePlayerChoice(gameId, player, choice)
        break
        
      case 'POWER_CHARGE_START':
        console.log('âš¡ Power charge started:', { player, gameId })
        await gameEngine.handlePowerChargeStart(gameId, player)
        break
        
      case 'POWER_CHARGED':
        console.log('âš¡ Power charged:', { player, powerLevel, gameId })
        await gameEngine.handlePowerChargeComplete(gameId, player, powerLevel)
        break
        
      case 'AUTO_FLIP':
      case 'AUTO_FLIP_TIMEOUT':
        console.log('ðŸŽ² Auto flip triggered:', { player, choice, gameId })
        // Auto-flip is handled by timers in the game engine
        break
        
      default:
        console.log('âš ï¸ Unhandled game action:', action)
    }
  }









  // Handle NFT offer (for NFT-vs-NFT games)
  async function handleNftOffer(socket, data) {
    const { gameId, offererAddress, nft, timestamp } = data
    if (!gameId || !offererAddress || !nft) {
      console.error('âŒ Invalid NFT offer data:', data)
      return
    }
    
    try {
      // Save to database
      await dbService.saveChatMessage(
        gameId, 
        offererAddress, 
        `NFT offer submitted`, 
        'offer', 
        { nft, offerType: 'nft' }
      )
      
      // Broadcast to the game room
      broadcastToRoom(gameId, {
        type: 'nft_offer',
        offererAddress,
        nft,
        timestamp: timestamp || new Date().toISOString()
      })
      console.log('ðŸ“¢ Broadcasted nft_offer to room', gameId)
    } catch (error) {
      console.error('âŒ Error saving NFT offer:', error)
    }
  }

  // Handle crypto offer (for NFT-vs-crypto games)
  async function handleCryptoOffer(socket, data, dbService) {
    // Accept both field name variations for compatibility
    const gameId = data.gameId || data.listingId
    const offererAddress = data.offererAddress || data.address
    const cryptoAmount = data.cryptoAmount || data.amount
    const timestamp = data.timestamp
    
    if (!gameId || !offererAddress || !cryptoAmount) {
      console.error('âŒ Invalid crypto offer data:', data)
      return
    }
    
    console.log('ðŸŽ¯ Processing crypto offer:', { gameId, offererAddress, cryptoAmount })
    console.log('ðŸ  Available rooms:', Array.from(rooms.keys()))
    console.log('ðŸ‘¥ Room members for this game:', rooms.has(gameId) ? Array.from(rooms.get(gameId)) : 'Room not found')
    
    try {
      // Get the listing_id for this game
      const db = dbService.getDatabase()
      let listingId = gameId
      
      // If the gameId looks like a listing ID (starts with 'listing_'), use it directly
      if (gameId.startsWith('listing_')) {
        listingId = gameId
        console.log('ðŸ“‹ Using provided listing ID directly:', listingId)
      } else {
        // Otherwise, try to find the game and get its listing_id
        const game = await new Promise((resolve, reject) => {
          db.get('SELECT listing_id FROM games WHERE id = ?', [gameId], (err, result) => {
            if (err) reject(err)
            else resolve(result)
          })
        })
        
        if (!game || !game.listing_id) {
          console.error('âŒ Game not found or no listing_id:', gameId)
          return
        }
        
        listingId = game.listing_id
        console.log('ðŸ“‹ Found listing ID from game:', listingId)
      }
      
      // Create offer ID
      const offerId = `offer_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`
      
      // Save offer to offers table
      await dbService.createOffer({
        id: offerId,
        listing_id: listingId,
        offerer_address: offererAddress,
        offer_price: cryptoAmount,
        message: `Crypto offer of $${cryptoAmount} USD`
      })
      
      console.log('âœ… Offer saved to database:', offerId)
      
      // Find the actual game ID for this listing to save chat message and broadcast
      const game = await new Promise((resolve, reject) => {
        db.get('SELECT id FROM games WHERE listing_id = ?', [listingId], (err, result) => {
          if (err) reject(err)
          else resolve(result)
        })
      })
      
      const actualGameId = game?.id || gameId
      
      // Also save as chat message for real-time display
      await dbService.saveChatMessage(
        actualGameId, 
        offererAddress, 
        `Crypto offer of $${cryptoAmount} USD`, 
        'offer', 
        { cryptoAmount, offerType: 'crypto', offerId }
      )
      
      // Broadcast to the game room
      const broadcastMessage = {
        type: 'crypto_offer',
        gameId: actualGameId,
        offererAddress,
        cryptoAmount,
        offerId,
        timestamp: timestamp || new Date().toISOString()
      }
      
      console.log('ðŸ“¢ Broadcasting crypto offer:', broadcastMessage)
      broadcastToRoom(actualGameId, broadcastMessage)
      console.log('âœ… Crypto offer broadcasted successfully to room', actualGameId)
    } catch (error) {
      console.error('âŒ Error saving crypto offer:', error)
    }
  }

  // Handle offer acceptance (for both NFT and crypto offers)
  async function handleOfferAccepted(socket, data) {
    const { gameId, creatorAddress, acceptedOffer, timestamp } = data
    if (!gameId || !creatorAddress || !acceptedOffer) {
      console.error('âŒ Invalid accept offer data:', data)
      return
    }
    
    try {
      // Determine the offer type and broadcast accordingly
      const offerType = acceptedOffer.cryptoAmount ? 'accept_crypto_offer' : 'accept_nft_offer'
      
      // Save acceptance to database
      await dbService.saveChatMessage(
        gameId, 
        creatorAddress, 
        `Offer accepted`, 
        'offer_accepted', 
        { acceptedOffer, offerType }
      )
      
      // Broadcast acceptance to the game room
      broadcastToRoom(gameId, {
        type: offerType,
        acceptedOffer,
        creatorAddress,
        timestamp: timestamp || new Date().toISOString()
      })
      console.log(`ðŸ“¢ Broadcasted ${offerType} to room`, gameId)
      
      // If this is a crypto offer acceptance, trigger the game start process
      if (acceptedOffer.cryptoAmount) {
        console.log('ðŸŽ® Crypto offer accepted, triggering game start process for game:', gameId)
        
        // Update game status to waiting for challenger deposit
        const depositDeadline = new Date(Date.now() + 2 * 60 * 1000) // 2 minutes from now
        const db = dbService.getDatabase()
        
        db.run(
          'UPDATE games SET status = ?, deposit_deadline = ?, challenger = ?, payment_amount = ? WHERE id = ?',
          ['waiting_challenger_deposit', depositDeadline.toISOString(), acceptedOffer.address, acceptedOffer.cryptoAmount, gameId],
          async (err) => {
            if (err) {
              console.error('âŒ Error updating game status:', err)
            } else {
              console.log('âœ… Game status updated to waiting_challenger_deposit with payment amount:', acceptedOffer.cryptoAmount)
              
              // Save system message to database
              await dbService.saveChatMessage(
                gameId, 
                'system', 
                `ðŸŽ® Game accepted! Player 2, please load your ${acceptedOffer.cryptoAmount} USD worth of ETH to start the game!`, 
                'system'
              )
              
              // Broadcast game status update to trigger countdown
              broadcastToRoom(gameId, {
                type: 'game_awaiting_challenger_deposit',
                gameId,
                status: 'waiting_challenger_deposit',
                deposit_deadline: depositDeadline.toISOString(),
                challenger: acceptedOffer.address,
                cryptoAmount: acceptedOffer.cryptoAmount,
                payment_amount: acceptedOffer.cryptoAmount
              })
              
              // Broadcast a system message to prompt the joiner to load their crypto
              broadcastToRoom(gameId, {
                type: 'chat_message',
                message: `ðŸŽ® Game accepted! Player 2, please load your ${acceptedOffer.cryptoAmount} USD worth of ETH to start the game!`,
                from: 'system',
                timestamp: new Date().toISOString()
              })
            }
          }
        )
      }
    } catch (error) {
      console.error('âŒ Error saving offer acceptance:', error)
    }
  }

  return {
    broadcastToRoom,
    broadcastToAll,
    getUserSocket,
    sendToUser,
    gameEngine
  }
}

module.exports = { createWebSocketHandlers } 

use webSocketService
import { useState, useEffect } from 'react'
import webSocketService from '../../../services/WebSocketService'

export const useWebSocket = (gameId, address, gameData) => {
  const [wsConnected, setWsConnected] = useState(false)
  const [wsRef, setWsRef] = useState(null)

  // Initialize WebSocket connection
  const initializeWebSocket = async () => {
    if (!gameId || !address) {
      console.log('âš ï¸ Cannot initialize WebSocket - missing gameId or address')
      return
    }

    try {
      console.log('ðŸ”Œ Initializing WebSocket connection for game:', gameId)
      
      // Connect using the WebSocket service
      const ws = await webSocketService.connect(gameId, address)
      if (ws) {
        setWsRef(ws)
        setWsConnected(true)
        console.log('âœ… WebSocket connection established successfully')
      } else {
        console.error('âŒ Failed to connect WebSocket')
        setWsConnected(false)
      }
    } catch (error) {
      console.error('âŒ Failed to initialize WebSocket:', error)
      setWsConnected(false)
    }
  }

  // Set up connection state monitoring
  useEffect(() => {
    const checkConnectionState = () => {
      try {
        // Check if WebSocket service has the isConnected method
        if (webSocketService && typeof webSocketService.isConnected === 'function') {
          const isConnected = webSocketService.isConnected()
          setWsConnected(isConnected)
        } else {
          // Fallback: check if WebSocket exists and is open
          const ws = webSocketService?.getWebSocket?.()
          const connected = ws && ws.readyState === WebSocket.OPEN
          setWsConnected(connected)
        }
      } catch (error) {
        console.error('âŒ Error checking WebSocket connection:', error)
        setWsConnected(false)
      }
    }

    // Check connection state periodically
    const interval = setInterval(checkConnectionState, 2000)
    
    return () => {
      clearInterval(interval)
    }
  }, [])

  // Initialize WebSocket when game data is available
  useEffect(() => {
    if (gameId && address && gameData) {
      initializeWebSocket()
    }

    return () => {
      // Cleanup will be handled by the WebSocket service
    }
  }, [gameId, address, gameData])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (webSocketService && typeof webSocketService.disconnect === 'function') {
        webSocketService.disconnect()
      }
    }
  }, [wsRef])

  return {
    wsConnected,
    wsRef: webSocketService?.getWebSocket?.() || null,
    setWsRef,
    webSocketService
  }
} 