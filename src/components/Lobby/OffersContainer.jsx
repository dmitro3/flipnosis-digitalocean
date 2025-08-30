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
  const { address, isConnected: walletIsConnected, setIsConnected } = useWallet()
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

  // Auto-refresh offers every 2 seconds as fallback
  useEffect(() => {
    if (!gameData?.listing_id) return

    const refreshOffers = async () => {
      try {
        const response = await fetch(`/api/offers/${gameData.listing_id}`)
        const data = await response.json()
        
        if (data.offers && data.offers.length > 0) {
          console.log('🔄 Auto-refresh: Found offers, updating...')
          setOffers(data.offers)
        }
      } catch (error) {
        console.error('❌ Auto-refresh error:', error)
      }
    }

    // Initial load
    refreshOffers()
    
    // Set up interval for auto-refresh
    const interval = setInterval(refreshOffers, 2000)
    
    return () => clearInterval(interval)
  }, [gameData?.listing_id])

  // WebSocket connection for real-time updates
  useEffect(() => {
    if (!gameId || !address) return

    console.log('🔌 Setting up WebSocket for real-time offers...')
    
    const ws = socket || window.FlipnosisWS
    if (!ws) {
      console.error('❌ WebSocket service not available')
      return
    }

    // Connect to WebSocket
    const connectToWebSocket = async () => {
      try {
        if (!ws.isConnected()) {
          console.log('🔌 Connecting to WebSocket...')
          await ws.connect(`game_${gameId}`, address)
          console.log('✅ WebSocket connected for real-time offers')
        }
        setIsConnected(true)
      } catch (error) {
        console.error('❌ WebSocket connection failed:', error)
        setIsConnected(false)
      }
    }

    connectToWebSocket()

    // Real-time offer handler
    const handleOffer = (data) => {
      console.log('📨 Real-time offer received:', data)
      
      if (data.type === 'crypto_offer' || data.type === 'nft_offer') {
        const newOffer = {
          id: data.id || Date.now() + Math.random(),
          type: data.type,
          address: data.address || data.offerer_address,
          cryptoAmount: data.cryptoAmount || data.amount,
          nftData: data.nftData,
          timestamp: data.timestamp || new Date().toISOString()
        }
        
        console.log('📝 Adding real-time offer:', newOffer)
        setOffers(prev => [...prev, newOffer])
      }
    }

    // Register real-time handler
    ws.on('crypto_offer', handleOffer)
    ws.on('nft_offer', handleOffer)

    return () => {
      ws.off('crypto_offer', handleOffer)
      ws.off('nft_offer', handleOffer)
    }
  }, [gameId, address, socket])

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

  // Load player names for offers
  useEffect(() => {
    const loadPlayerNames = async () => {
      const names = {}
      const addresses = [...new Set(offers.map(o => o.address || o.offerer_address).filter(addr => addr && addr !== 'System'))]
      
      console.log('👥 Loading player names for offers:', addresses)
      
      for (const addr of addresses) {
        try {
          const response = await fetch(`/api/profile/${addr}`)
          if (response.ok) {
            const profile = await response.json()
            if (profile && profile.name && profile.name.trim()) {
              names[addr] = profile.name.trim()
              console.log(`✅ Loaded name for ${addr}: ${profile.name}`)
            } else if (profile && profile.username && profile.username.trim()) {
              names[addr] = profile.username.trim()
              console.log(`✅ Loaded legacy username for ${addr}: ${profile.username}`)
            } else {
              names[addr] = 'Anonymous'
              console.log(`⚠️ No name found for ${addr}, using Anonymous`)
            }
          } else {
            names[addr] = 'Anonymous'
            console.log(`❌ Failed to load profile for ${addr}, using Anonymous`)
          }
        } catch (error) {
          console.error(`❌ Error loading profile for ${addr}:`, error)
          names[addr] = 'Anonymous'
        }
      }
      
      console.log('👥 Final player names for offers:', names)
      setPlayerNames(names)
    }

    if (offers.length > 0) {
      loadPlayerNames()
    }
  }, [offers])

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

    // Check if user is creator - prevent creators from making offers
    if (isCreator()) {
      showError('Game creators cannot make offers on their own games')
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
      // WebSocket-first approach with API fallback (same as chat)
      const ws = socket || window.FlipnosisWS
      const isConnected = ws && (ws.isConnected ? ws.isConnected() : ws.connected)
      
      console.log('🔍 Offers: WebSocket connection check:', isConnected)
      
      if (isConnected) {
        // Send via WebSocket
        const offerData = {
          type: 'crypto_offer',
          roomId: `game_${gameId}`,
          listingId: gameData.listing_id,
          address: address,
          cryptoAmount: offerAmount,
          timestamp: new Date().toISOString()
        }
        
        console.log('📤 Offers: Sending via WebSocket:', offerData)
        ws.send(offerData)
        
        // Optimistically add to local state
        const newOffer = {
          id: Date.now(),
          type: 'crypto_offer',
          address: address,
          cryptoAmount: offerAmount,
          timestamp: new Date().toISOString()
        }
        
        addOffer(newOffer)
        showSuccess(`Offer of $${offerAmount.toFixed(2)} USD sent!`)
        setCryptoOffer('')
      } else {
        // Fallback to API
        console.log('⚠️ WebSocket not connected, using API fallback')
        
        const response = await fetch('/api/offers', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            listingId: gameData.listing_id,
            address: address,
            cryptoAmount: offerAmount,
            type: 'crypto_offer'
          })
        })
        
        if (response.ok) {
          const result = await response.json()
          console.log('✅ Offer sent via API:', result)
          
          // Add to local state
          const newOffer = {
            id: Date.now(),
            type: 'crypto_offer',
            address: address,
            cryptoAmount: offerAmount,
            timestamp: new Date().toISOString()
          }
          
          addOffer(newOffer)
          showSuccess(`Offer of $${offerAmount.toFixed(2)} USD sent!`)
          setCryptoOffer('')
        } else {
          throw new Error('API request failed')
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
      
      // Don't reload - let the WebSocket handle updates
      console.log('🎯 Offer accepted - waiting for WebSocket updates')
      
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

  if (!walletIsConnected) {
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
    isConnected: walletIsConnected,
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
          <StatusDot connected={walletIsConnected || socket?.connected || (socket?.socket?.readyState === WebSocket.OPEN)} />
          <StatusText connected={walletIsConnected || socket?.connected || (socket?.socket?.readyState === WebSocket.OPEN)}>
            {walletIsConnected || socket?.connected || (socket?.socket?.readyState === WebSocket.OPEN) ? 'Connected' : 'Disconnected'}
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

       <div style={{ marginBottom: '1rem' }}></div>

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
    </OffersContainerStyled>
  )
}

export default OffersContainer 