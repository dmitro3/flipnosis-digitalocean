import React, { useState, useEffect, useRef } from 'react'
import { useWallet } from '../../contexts/WalletContext'
import { useProfile } from '../../contexts/ProfileContext'
import { useToast } from '../../contexts/ToastContext'
import styled from '@emotion/styled'
// Using global WebSocket service to avoid minification issues

const OffersContainerStyled = styled.div`
  background: rgba(0, 0, 0, 0.7);
  border: 3px solid rgba(0, 255, 65, 0.3);
  border-radius: 1rem;
  padding: 1rem;
  height: 800px;
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
  offers: initialOffers = [],
  isCreator: isCreatorProp,
  onOfferSubmitted,
  onOfferAccepted 
}) => {
  const { address, isConnected } = useWallet()
  const { getPlayerName } = useProfile()
  const { showError, showSuccess, showInfo } = useToast()
  
  const [offers, setOffers] = useState(initialOffers)
  const [cryptoOffer, setCryptoOffer] = useState('')
  const [isSubmittingOffer, setIsSubmittingOffer] = useState(false)
  const [playerNames, setPlayerNames] = useState({})
  
  const offersEndRef = useRef(null)
  
  // Get game price for validation
  const gamePrice = gameData?.payment_amount || gameData?.price_usd || gameData?.final_price || gameData?.price || gameData?.asking_price || gameData?.priceUSD || 0
  const minOfferAmount = gamePrice * 0.8 // 80% of the game price
  
  // Update offers when initialOffers prop changes
  useEffect(() => {
    setOffers(initialOffers)
  }, [initialOffers])

  // Auto scroll to bottom when new offers arrive
  // useEffect(() => {
  //   offersEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  // }, [offers])

const isCreator = () => {
  // Use prop if available (preferred)
  if (isCreatorProp && typeof isCreatorProp === 'function') {
    return isCreatorProp()
  }
  
  // Fallback to local implementation
  if (!gameData || !address) return false
  
  // Check both possible creator field names
  const creatorAddress = gameData.creator || gameData.creator_address
  if (!creatorAddress) {
    console.warn('No creator field found in gameData:', Object.keys(gameData))
    return false
  }
  
  return address.toLowerCase() === creatorAddress.toLowerCase()
}

  // Listen for offers from WebSocket service
  useEffect(() => {
    if (!socket) return
    
    const handleMessage = (data) => {
      try {
        console.log('💰 Offers: WebSocket message received:', data)
        
        if (data.type === 'nft_offer') {
          console.log('💎 Offers: Received NFT offer:', data)
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
          console.log('💰 Offers: Received crypto offer:', data)
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
          console.log('✅ Offers: Offer accepted:', data)
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
              message: `🎮 Game accepted! Player 2, please load your ${data.acceptedOffer.cryptoAmount} USD worth of ETH to start the game!`,
              timestamp: new Date().toISOString()
            })
          }
        } else if (data.type === 'chat_history') {
          console.log('📚 Offers: Received chat history:', data)
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
            console.log(`📚 Offers: Loaded ${historyOffers.length} offer history messages`)
          }
        }
      } catch (error) {
        console.error('Offers: Error parsing message:', error)
      }
    }
    
    // Register message handlers for specific message types
    console.log('🔌 Offers: Registering message handlers with socket:', socket)
    
    // Get the actual WebSocket object or use the wrapper
    const actualSocket = socket?.socket || socket
    
    if (actualSocket && typeof actualSocket.addEventListener === 'function') {
      // Use addEventListener for WebSocket
      const messageHandler = (event) => {
        try {
          const data = JSON.parse(event.data)
          handleMessage(data)
        } catch (error) {
          console.error('Offers: Error parsing WebSocket message:', error)
        }
      }
      
      actualSocket.addEventListener('message', messageHandler)
      
      return () => {
        console.log('🔌 Offers: Cleaning up WebSocket message handler')
        actualSocket.removeEventListener('message', messageHandler)
      }
    } else if (actualSocket && typeof actualSocket.on === 'function') {
      // Use .on/.off for socket.io style
      actualSocket.on('crypto_offer', handleMessage)
      actualSocket.on('nft_offer', handleMessage)
      actualSocket.on('accept_crypto_offer', handleMessage)
      actualSocket.on('accept_nft_offer', handleMessage)
      actualSocket.on('chat_history', handleMessage)
      
      return () => {
        console.log('🔌 Offers: Cleaning up socket.io message handlers')
        actualSocket.off('crypto_offer', handleMessage)
        actualSocket.off('nft_offer', handleMessage)
        actualSocket.off('accept_crypto_offer', handleMessage)
        actualSocket.off('accept_nft_offer', handleMessage)
        actualSocket.off('chat_history', handleMessage)
      }
    } else {
      console.warn('🔌 Offers: No valid socket found for message handling')
      return () => {}
    }
  }, [socket, address, showSuccess])

  // Load player names for offers
  useEffect(() => {
    const loadPlayerNames = async () => {
      const names = {}
      const uniqueAddresses = [...new Set(offers.map(o => o.address).filter(Boolean))]
      
      for (const addr of uniqueAddresses) {
        if (!names[addr] && addr) {
          try {
            const name = await getPlayerName(addr)
            names[addr] = name || `${addr.slice(0, 6)}...${addr.slice(-4)}`
          } catch (error) {
            console.error('Error loading player name for:', addr, error)
            names[addr] = `${addr.slice(0, 6)}...${addr.slice(-4)}`
          }
        }
      }
      setPlayerNames(names)
    }

    if (offers.length > 0) {
      loadPlayerNames()
    }
  }, [offers, getPlayerName])

  const addOffer = (offer) => {
    console.log('📝 Offers: Adding offer to state:', offer)
    setOffers(prev => {
      const newOffers = [...prev, offer]
      console.log('📝 Offers: New offers state:', newOffers.length, 'offers')
      return newOffers
    })
  }

  const handleSubmitCryptoOffer = async () => {
    if (!cryptoOffer.trim()) {
      console.error('❌ Offers: No offer amount entered')
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
      // Try WebSocket service first
      const isSocketConnected = socket && socket.isConnected && socket.isConnected()
      console.log('🔍 WebSocket connection check:', isSocketConnected)
      
      if (isSocketConnected) {
        const offerData = {
          type: 'crypto_offer',
          listingId: gameData.listing_id,
          address: address,
          cryptoAmount: offerAmount,
          timestamp: new Date().toISOString()
        }
        
        console.log('📤 Offers: Sending crypto offer:', offerData)
        console.log('📤 Offers: Socket send method available:', typeof socket.send === 'function')
        socket.send(offerData)
        
        console.log('💰 Crypto offer sent via WebSocket')
        showSuccess(`Offer of $${offerAmount.toFixed(2)} USD sent!`)
        setCryptoOffer('')
      } else {
        // Use WebSocketService with queuing
        console.log('⚠️ WebSocket not connected, using service to queue offer')
        
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
            message: `💰 Offered $${offerAmount.toFixed(2)} USD`
          }
          
          addOffer(newOffer)
          showSuccess(`Offer queued: $${offerAmount.toFixed(2)} USD`)
          setCryptoOffer('')
          
          // Try to reconnect
          ws.connect(gameId, address)
        }
      }
    } catch (error) {
      console.error('❌ Error submitting offer:', error)
      showError('Failed to submit offer. Please try again.')
    } finally {
      setIsSubmittingOffer(false)
    }
  }

  const handleAcceptOffer = async (offer) => {
    console.log('🔍 Accept offer attempt:', { 
      isCreator: isCreator(), 
      connected, 
      hasSocket: !!socket,
      socketConnected: socket?.connected,
      socketObject: socket,
      offer,
      gameData: gameData?.id || gameData?.listing_id 
    })
    
    if (!isCreator()) {
      console.error('❌ Cannot accept offer: not creator')
      showError('Only the game creator can accept offers')
      return
    }
    
    // Check if we have a valid socket connection
    const isSocketConnected = socket?.connected || (socket?.socket && socket.socket.readyState === WebSocket.OPEN)
    if (!isSocketConnected) {
      console.error('❌ Cannot accept offer: no socket connection')
      showError('Connection required to accept offers')
      return
    }

    try {
      const offerType = offer.cryptoAmount ? 'crypto offer' : 'NFT offer'
      console.log('🎯 Starting offer acceptance process for:', offerType)
      showInfo(`Accepting ${offerType}...`)

      const acceptanceData = {
        type: offer.cryptoAmount ? 'accept_crypto_offer' : 'accept_nft_offer',
        gameId: gameId,
        listingId: gameData?.listing_id || gameData?.id,
        creatorAddress: address,
        acceptedOffer: offer,
        timestamp: new Date().toISOString()
      }

      console.log('📤 Offers: Sending offer acceptance:', acceptanceData)
      
      // Send via WebSocket - handle both direct socket and wrapper object
      if (socket?.socket && socket.socket.send) {
        // Use the actual WebSocket object
        console.log('📤 Using socket.socket.send method')
        socket.socket.send(JSON.stringify(acceptanceData))
        console.log('📤 Offer acceptance sent via socket.socket.send')
      } else if (socket?.send) {
        // Direct socket object
        console.log('📤 Using socket.send method')
        socket.send(acceptanceData)
        console.log('📤 Offer acceptance sent via socket.send')
      } else {
        // Fallback to global WebSocket service
        console.log('📤 Using global WebSocket service fallback')
        const ws = window.FlipnosisWS
        if (ws) {
          ws.send(acceptanceData)
          console.log('📤 Offer acceptance sent via global WebSocket service')
        } else {
          console.error('❌ No WebSocket connection available for offer acceptance')
          showError('WebSocket connection not available')
          return
        }
      }
      
      console.log('✅ Offer acceptance message sent successfully')
      showSuccess(`${offerType} accepted! Game starting...`)
      
      // Reload game data after a short delay to get updated status
      setTimeout(() => {
        console.log('🔄 Reloading game data after offer acceptance')
        if (window.location.pathname.includes('/game/')) {
          window.location.reload() // Force reload to get updated game status
        }
      }, 1000)
      
      if (onOfferAccepted) {
        console.log('📞 Calling onOfferAccepted callback')
        onOfferAccepted(offer)
      }
      
    } catch (error) {
      console.error('Offers: Error accepting offer:', error)
      console.error('Offers: Error stack:', error.stack)
      showError('Failed to accept offer: ' + error.message)
    }
  }

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const getDisplayName = (addr) => {
    if (!addr) return 'Anonymous'
    if (addr === address) return 'You'
    return playerNames[addr] || `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  const renderOfferContent = (offer) => {
    const creatorCheck = isCreator()
    
    console.log('🔍 Rendering offer:', {
      offerType: offer.type,
      isCreator: creatorCheck,
      currentAddress: address,
      gameCreator: gameData?.creator,
      gameDataKeys: Object.keys(gameData || {}),
      offer: offer
    })
    
    // Determine offer type
    let offerType = offer.type
    if (offer.cryptoAmount && !offerType) offerType = 'crypto_offer'
    if (offer.nft && !offerType) offerType = 'nft_offer'
    
    // Format timestamp properly
    const offerTime = offer.timestamp || offer.created_at || new Date().toISOString()
    const formattedTime = new Date(offerTime).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
    
    console.log('🔍 Rendering offer input, shouldShowOfferInput:', shouldShowOfferInput())
    
    switch (offerType) {
      case 'crypto_offer':
        return (
          <div>
            <OfferAmount>
              <OfferAmountLabel>💰 Crypto Offer:</OfferAmountLabel>
              <OfferAmountValue>${offer.offer_price || offer.cryptoAmount || 0} USD</OfferAmountValue>
            </OfferAmount>
            {/* Accept button - show for creators */}
            {creatorCheck && (
              <OfferActions>
                <ActionButton 
                  className="accept"
                  onClick={() => {
                    console.log('🔘 Accept button clicked for crypto offer:', offer)
                    handleAcceptOffer(offer)
                  }}
                >
                  ✅ Accept
                </ActionButton>
              </OfferActions>
            )}
          </div>
        )
      
      case 'nft_offer':
        return (
          <div>
            <div style={{ marginBottom: '0.5rem' }}>
              <strong>💎 NFT Offer</strong>
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
            {/* Accept button - show for creators with detailed logging */}
            {(() => {
              const shouldShowAccept = isCreator()
              console.log('🔍 NFT offer accept button decision:', {
                shouldShowAccept,
                isCreatorResult: isCreator(),
                currentAddress: address,
                gameCreator: gameData?.creator,
                gameStatus: gameData?.status
              })
              return shouldShowAccept
            })() && (
              <OfferActions>
                <ActionButton 
                  className="accept"
                  onClick={() => {
                    console.log('🔘 Accept button clicked for NFT offer:', offer)
                    handleAcceptOffer(offer)
                  }}
                >
                  ✅ Accept
                </ActionButton>
              </OfferActions>
            )}
          </div>
        )
      
      case 'offer_accepted':
        return (
          <div>
            <strong>✅ Offer Accepted!</strong>
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
    
    // Check if any offer has been accepted recently (within 5 minutes)
    const hasRecentAcceptance = offers.some(offer => 
      offer.status === 'accepted' && 
      new Date(offer.accepted_at || offer.timestamp).getTime() > Date.now() - 300000 // 5 minutes
    )
    
    if (hasRecentAcceptance) return false
    
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
  console.log('🔍 OffersContainer Debug:', {
    isCreator: isCreator(),
    gameStatus: gameData?.status,
    gamePrice,
    minOfferAmount,
    shouldShowInput: shouldShowOfferInput(),
    isConnected,
    connected,
    hasSocket: !!socket,
    socketReadyState: socket?.readyState,
    // Additional debug info
    currentAddress: address,
    gameCreator: gameData?.creator,
          gameCreatorAddress: gameData?.creator,
    gameDataKeys: gameData ? Object.keys(gameData) : 'no gameData',
    offerCount: offers?.length || 0,
    hasIsCreatorProp: !!isCreatorProp,
    isCreatorPropType: typeof isCreatorProp
  })

  return (
    <OffersContainerStyled>
      <OffersHeader>
        <OffersTitle>💰 Offers</OffersTitle>
        <ConnectionStatus>
          <StatusDot connected={connected || socket?.connected || (socket?.socket?.readyState === WebSocket.OPEN)} />
          <StatusText connected={connected || socket?.connected || (socket?.socket?.readyState === WebSocket.OPEN)}>
            {connected || socket?.connected || (socket?.socket?.readyState === WebSocket.OPEN) ? 'Connected' : 'Disconnected'}
          </StatusText>
        </ConnectionStatus>
      </OffersHeader>

      {/* Game Price Info */}
      {gamePrice > 0 && (
        <PriceInfo>
          <PriceLabel>🎯 Game Price:</PriceLabel>
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
            <div style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>💰</div>
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
            const playerName = playerNames[offer.offerer_address || offer.address] || 'Anonymous'
            const offerTime = offer.timestamp || offer.created_at || new Date().toISOString()
            const formattedTime = new Date(offerTime).toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
              hour12: true
            })
            
            return (
              <OfferItem key={offer.id || index}>
                <OfferHeader>
                  <span>⚡ {playerName}</span>
                  <span>{formattedTime}</span>
                </OfferHeader>
                <OfferContent>
                  {renderOfferContent(offer)}
                </OfferContent>
              </OfferItem>
            )
          })
        )}
        <div ref={offersEndRef} />
      </OffersList>

      {/* Offer Input - Available to non-creators when game is waiting for challenger */}
      {console.log('🔍 Rendering offer input, shouldShowOfferInput:', shouldShowOfferInput())}
      {shouldShowOfferInput() && (
        <OfferInputContainer>
          <OfferInput
            type="text"
            value={cryptoOffer}
            onChange={(e) => {
              console.log('🔍 Input onChange:', e.target.value)
              // Only allow digits and decimal point
              const value = e.target.value.replace(/[^0-9.]/g, '')
              // Prevent multiple decimal points
              const parts = value.split('.')
              if (parts.length <= 2) {
                setCryptoOffer(value)
              }
            }}
            placeholder={`Min $${minOfferAmount.toFixed(2)} USD...`}
            disabled={isSubmittingOffer}
            onKeyPress={(e) => e.key === 'Enter' && handleSubmitCryptoOffer()}
            style={{
              borderColor: '#00FF41'
            }}
          />
          <OfferButton
            onClick={() => {
              console.log('🔍 Button clicked, cryptoOffer:', cryptoOffer, 'isSubmittingOffer:', isSubmittingOffer)
              handleSubmitCryptoOffer()
            }}
            disabled={!cryptoOffer.trim() || isSubmittingOffer}
          >
            {isSubmittingOffer ? 'Submitting...' : 'Make Offer'}
          </OfferButton>
        </OfferInputContainer>
      )}
    </OffersContainerStyled>
  )
}

export default OffersContainer 