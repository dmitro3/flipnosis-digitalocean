import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useWallet } from '../../contexts/WalletContext'
import { useProfile } from '../../contexts/ProfileContext'
import { useToast } from '../../contexts/ToastContext'
import UnifiedDepositOverlay from '../UnifiedDepositOverlay'
import styled from '@emotion/styled'
import socketService from '../../services/SocketService'

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
  
  // Deposit overlay state
  const [showDepositOverlay, setShowDepositOverlay] = useState(false)
  const [acceptedOffer, setAcceptedOffer] = useState(null)
  
  // Use refs to persist overlay state across re-renders and prevent flicker
  const overlayStateRef = useRef({ showOverlay: false, offer: null })
  
  // Sync ref with state to maintain consistency
  useEffect(() => {
    overlayStateRef.current = { 
      showOverlay: showDepositOverlay, 
      offer: acceptedOffer 
    }
  }, [showDepositOverlay, acceptedOffer])
  
  const offersEndRef = useRef(null)
  
  // Get game price for validation
  const gamePrice = gameData?.payment_amount || gameData?.price_usd || gameData?.final_price || gameData?.price || gameData?.asking_price || gameData?.priceUSD || 0
  const minOfferAmount = gamePrice * 0.8 // 80% of the game price
  
  // Update offers when initialOffers prop changes
  useEffect(() => {
    setOffers(initialOffers)
  }, [initialOffers])

  // Auto-show deposit overlay when game status is waiting_challenger_deposit and current user is challenger
  useEffect(() => {
    // Checking auto-show deposit overlay
    
    if (gameData?.status === 'waiting_challenger_deposit' && 
        gameData?.challenger && 
        address && 
        gameData.challenger.toLowerCase() === address.toLowerCase() &&
        !showDepositOverlay) {
      
      console.log('🎯 Auto-showing deposit overlay for challenger')
      
      // Create accepted offer object for the deposit overlay
      const acceptedOffer = {
        offerer_address: gameData.challenger,
        cryptoAmount: gameData.payment_amount || gameData.price_usd,
        timestamp: new Date().toISOString()
      }
      
      setAcceptedOffer(acceptedOffer)
      setShowDepositOverlay(true)
    }
  }, [gameData?.status, gameData?.challenger, address]) // Removed showDepositOverlay from deps

  // Note: Removed custom showDepositScreen event listener
  // The your_offer_accepted WebSocket event is handled directly by handleYourOfferAccepted

  // Socket.io connection for real-time updates
  useEffect(() => {
    if (!gameId || !address) return

    console.log('🔌 Setting up Socket.io for real-time offers...')
    
    // Connect to Socket.io
    const connectSocket = async () => {
      try {
        await socketService.connect(gameId, address)
        console.log('✅ Socket.io connected for offers')
        setIsConnected(true)
      } catch (error) {
        console.error('❌ Socket.io connection failed:', error)
        setIsConnected(false)
      }
    }

    connectSocket()

    // Real-time offer handler
    const handleOffer = (data) => {
      console.log('💰 Real-time offer received:', data)
      const newOffer = {
        id: data.id || Date.now() + Math.random(),
        type: data.type,
        address: data.address || data.offerer_address,
        offerer_address: data.address || data.offerer_address,
        cryptoAmount: data.cryptoAmount || data.amount,
        offer_price: data.cryptoAmount || data.amount,
        timestamp: data.timestamp || new Date().toISOString()
      }
      
      setOffers(prev => [...prev, newOffer])
    }

    // Real-time offer acceptance handler
    const handleOfferAcceptance = (data) => {
      console.log('✅ Real-time offer acceptance received:', data)
      
      if (data.type === 'accept_crypto_offer' || data.type === 'offer_accepted' || data.type === 'your_offer_accepted') {
        console.log('🎯 Processing offer acceptance:', data)
        
        // Create accepted offer object for the deposit overlay
        const acceptedOffer = {
          offerer_address: data.acceptedOffer?.offerer_address || data.challenger || address,
          cryptoAmount: data.acceptedOffer?.cryptoAmount || data.finalPrice || data.acceptedOffer?.offer_price,
          timestamp: data.timestamp || new Date().toISOString()
        }
        
        setAcceptedOffer(acceptedOffer)
        setShowDepositOverlay(true)
        console.log('🎯 Showing deposit overlay for accepted offer:', acceptedOffer)
      }
    }

    // Handle your offer accepted event (for challenger)
    const handleYourOfferAccepted = (data) => {
      console.log('🎯 Your offer accepted event received:', data)
      
      if (data.gameId === gameData?.id) {
        console.log('✅ Your offer was accepted, showing deposit overlay...')
        
        // Create accepted offer object for the deposit overlay
        const acceptedOffer = {
          offerer_address: address, // Current user is the offerer
          cryptoAmount: data.cryptoAmount || data.finalPrice,
          timestamp: data.timestamp || new Date().toISOString()
        }
        
        setAcceptedOffer(acceptedOffer)
        setShowDepositOverlay(true)
        console.log('🎯 Showing deposit overlay for accepted offer:', acceptedOffer)
        
        // Auto-switch to Lounge tab for player 2 immediately
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('switchToLoungeTab'))
        }, 200)
      }
    }

    // Regular event handlers inside the useEffect
    const handleGameStatusChanged = (data) => {
      console.log('🔄 Game status changed event received:', data)
      
      if (data.gameId === gameData?.id && data.data.newStatus === 'waiting_challenger_deposit') {
        console.log('🔄 Game status changed to waiting_challenger_deposit')
        
        // Check if current user is the challenger
        if (gameData?.challenger && address && 
            gameData.challenger.toLowerCase() === address.toLowerCase()) {
          console.log('✅ Current user is challenger, showing deposit overlay...')
          
          // Show deposit overlay for challenger
          const acceptedOffer = {
            offerer_address: address,
            cryptoAmount: gameData.payment_amount || gameData.price_usd,
            timestamp: data.data.timestamp
          }
          
          setAcceptedOffer(acceptedOffer)
          setShowDepositOverlay(true)
          console.log('🎯 Auto-showing deposit overlay for challenger:', acceptedOffer)
        }
      }
      
      // Handle game becoming active (both players deposited)
      if (data.gameId === gameData?.id && data.data.newStatus === 'active') {
        console.log('🎯 Game is now active - both players deposited!')
        
        // Close any open deposit overlays
        setShowDepositOverlay(false)
        setAcceptedOffer(null)
        
        // Transport both players to the game room
        console.log('🚀 Transporting players to flip suite...')
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('switchToFlipSuite', {
            detail: { gameId: gameData?.id, immediate: true }
          }))
        }, 500)
      }
    }

    // Handle deposit confirmed event
    const handleDepositConfirmed = (data) => {
      console.log('💰 Deposit confirmed event received:', data)
      
      if (data.gameId === gameData?.id) {
        console.log('✅ Deposit confirmed for current game')
        
        // Use functional state updates to access current state
        setShowDepositOverlay(currentShow => {
          setAcceptedOffer(currentOffer => {
            if (currentShow && currentOffer?.isCreatorWaiting) {
              console.log('🎯 Creator was waiting, challenger deposited - transporting to game!')
              
              // Transport to flip suite
              setTimeout(() => {
                window.dispatchEvent(new CustomEvent('switchToFlipSuite', {
                  detail: { gameId: gameData?.id, immediate: true }
                }))
              }, 1000)
              
              return null // Clear accepted offer
            }
            return currentOffer
          })
          
          return currentShow && false // Close overlay if it was open
        })
      }
    }

    // Handle deposit timeout event
    const handleDepositTimeout = (data) => {
      console.log('⏰ Deposit timeout event received:', data)
      
      if (data.gameId === gameData?.id) {
        console.log('⏰ Deposit timeout for current game')
        
        // Close any open deposit overlays
        setShowDepositOverlay(false)
        setAcceptedOffer(null)
        
        // Show timeout message
        showError(data.message || 'Deposit time expired!')
      }
    }

    // Synchronized deposit stage handler - BOTH PLAYERS GET THIS!
    const handleDepositStageStarted = (data) => {
      console.log('🎯 Deposit stage started (synchronized):', data)
      console.log('🎯 Comparing gameIds:', { eventGameId: data.gameId, componentGameId: gameId })
      
      // More flexible gameId comparison - handle both formats
      const eventGameId = data.gameId?.replace('game_', '') || data.gameId
      const componentGameId = gameId?.replace('game_', '') || gameId
      
      if (eventGameId !== componentGameId) {
        console.log('❌ GameId mismatch, ignoring event')
        return
      }
      
      console.log('✅ GameId matches, processing deposit stage started')
      
      const isChallenger = data.challenger?.toLowerCase() === address?.toLowerCase()
      const isCreator = data.creator?.toLowerCase() === address?.toLowerCase()
      
      console.log('🎯 Player roles:', { isChallenger, isCreator, challenger: data.challenger, creator: data.creator, address })
      
      if (isChallenger) {
        console.log('✅ You are the challenger - need to deposit')
        const acceptedOffer = {
          offerer_address: address,
          cryptoAmount: gameData?.payment_amount || gameData?.price_usd,
          needsDeposit: true,
          timeRemaining: data.timeRemaining
        }
        console.log('🎯 Setting accepted offer for challenger:', acceptedOffer)
        setAcceptedOffer(acceptedOffer)
        setShowDepositOverlay(true)
        
        // Switch to Lounge tab
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('switchToLoungeTab'))
        }, 200)
      } else if (isCreator) {
        console.log('✅ You are the creator - waiting for deposit')
        const acceptedOffer = {
          isCreatorWaiting: true,
          cryptoAmount: gameData?.payment_amount || gameData?.price_usd,
          timeRemaining: data.timeRemaining
        }
        console.log('🎯 Setting accepted offer for creator:', acceptedOffer)
        setAcceptedOffer(acceptedOffer)
        setShowDepositOverlay(true)
      } else {
        console.log('❌ Neither challenger nor creator - ignoring')
      }
    }

    // Synchronized countdown - BOTH PLAYERS GET THE SAME TIME!
    const handleDepositCountdown = (data) => {
      // More flexible gameId comparison
      const eventGameId = data.gameId?.replace('game_', '') || data.gameId
      const componentGameId = gameId?.replace('game_', '') || gameId
      
      if (eventGameId !== componentGameId) return
      
      setAcceptedOffer(prev => {
        if (!prev) return prev
        return {
          ...prev,
          timeRemaining: data.timeRemaining
        }
      })
    }

    // Handle game started event
    const handleGameStarted = (data) => {
      console.log('🎮 Game started event received:', data)
      if (data.gameId === gameId) {
        // Close any open deposit overlays
        setShowDepositOverlay(false)
        setAcceptedOffer(null)
        
        // Transport to game room
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('switchToFlipSuite', {
            detail: { gameId: gameId, immediate: true }
          }))
        }, 500)
      }
    }

    // Register Socket.io event listeners
    socketService.on('crypto_offer', handleOffer)
    socketService.on('deposit_stage_started', handleDepositStageStarted)
    socketService.on('deposit_countdown', handleDepositCountdown)
    socketService.on('deposit_confirmed', handleDepositConfirmed)
    socketService.on('deposit_timeout', handleDepositTimeout)
    socketService.on('game_started', handleGameStarted)

    // Cleanup
    return () => {
      socketService.off('crypto_offer', handleOffer)
      socketService.off('deposit_stage_started', handleDepositStageStarted)
      socketService.off('deposit_countdown', handleDepositCountdown)
      socketService.off('deposit_confirmed', handleDepositConfirmed)
      socketService.off('deposit_timeout', handleDepositTimeout)
      socketService.off('game_started', handleGameStarted)
    }
  }, [gameId, address, socket, gameData?.id, gameData?.challenger, gameData?.payment_amount, gameData?.price_usd])

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

  const handleSubmitOffer = () => {
    if (!cryptoOffer || parseFloat(cryptoOffer) <= 0) return
    
    socketService.emit('crypto_offer', {
      address: address,
      cryptoAmount: parseFloat(cryptoOffer)
    })
    
    setCryptoOffer('')
    showSuccess('Offer sent!')
  }

  const handleAcceptOffer = (offer) => {
    if (!isCreator()) {
      showError('Only creator can accept offers')
      return
    }

    // Send via Socket.io
    socketService.emit('accept_offer', {
      offerId: offer.id,
      accepterAddress: address,
      challengerAddress: offer.offerer_address,
      cryptoAmount: offer.cryptoAmount || offer.offer_price
    })
    
    showInfo('Accepting offer...')
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
    
    // Rendering offer
    
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
    
    // Rendering offer input
    
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
    // Don't show input if deposit overlay is active
    if (showDepositOverlay) return false
    
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

  // Deposit overlay handlers
  const handleCloseDepositOverlay = () => {
    setShowDepositOverlay(false)
    setAcceptedOffer(null)
    overlayStateRef.current = { showOverlay: false, offer: null }
  }

  const handleDepositComplete = (offer) => {
    console.log('🎯 Deposit completed, transporting to game room...')
    setShowDepositOverlay(false)
    setAcceptedOffer(null)
    overlayStateRef.current = { showOverlay: false, offer: null }
    
    // Transport to game room
    if (onOfferAccepted) {
      onOfferAccepted(offer)
    }
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

  // Debug logging removed for performance

  return (
    <OffersContainerStyled>
      <OffersHeader>
        <OffersTitle>💰 Offers</OffersTitle>
        <ConnectionStatus>
          <StatusDot connected={walletIsConnected || connected} />
          <StatusText connected={walletIsConnected || connected}>
            {walletIsConnected || connected ? 'Connected' : 'Disconnected'}
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

      {shouldShowOfferInput() && (
        <OfferInputContainer>
          <OfferInput
            type="text"
            value={cryptoOffer}
            onChange={(e) => {
              // Input onChange
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
            onKeyPress={(e) => e.key === 'Enter' && handleSubmitOffer()}
            style={{
              borderColor: '#00FF41'
            }}
          />
          <OfferButton
            onClick={() => {
              // Button clicked
              handleSubmitOffer()
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

      {/* Deposit Overlay - use persistent state to prevent flicker */}
      {(() => {
        console.log('🎯 Deposit overlay render check:', { 
          showDepositOverlay, 
          hasAcceptedOffer: !!acceptedOffer,
          acceptedOfferData: acceptedOffer 
        })
        return showDepositOverlay && acceptedOffer
      })() && (
        <UnifiedDepositOverlay
          gameId={gameId}
          address={address}
          gameData={gameData}
          depositState={{
            phase: 'deposit_stage',
            creator: gameData?.creator,
            challenger: acceptedOffer.offerer_address,
            timeRemaining: acceptedOffer.timeRemaining || 120,
            creatorDeposited: true,
            challengerDeposited: false,
            cryptoAmount: acceptedOffer.cryptoAmount || acceptedOffer.offer_price || acceptedOffer.amount
          }}
          onDepositComplete={() => {
            setShowDepositOverlay(false)
            setAcceptedOffer(null)
            // Navigate to game
          }}
          onTimeout={() => {
            setShowDepositOverlay(false)
            setAcceptedOffer(null)
          }}
        />
      )}
    </OffersContainerStyled>
  )
}

export default OffersContainer 