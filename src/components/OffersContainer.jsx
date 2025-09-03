import React, { useState, useEffect } from 'react'
import styled from 'styled-components'
import webSocketService from '../services/WebSocketService'
import { showSuccess, showError, showInfo } from '../utils/toast'

const Container = styled.div`
  background: linear-gradient(135deg, #1a1a2e 0%, #0f0f23 100%);
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
`

const Title = styled.h3`
  color: #00FF41;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`

const OffersList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  max-height: 400px;
  overflow-y: auto;
  padding-right: 0.5rem;
  
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 3px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: #00FF41;
    border-radius: 3px;
  }
`

const OfferCard = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(0, 255, 65, 0.3);
  border-radius: 8px;
  padding: 1rem;
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(0, 255, 65, 0.1);
    border-color: #00FF41;
    transform: translateX(4px);
  }
`

const OfferHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
`

const OfferAmount = styled.div`
  color: #00BFFF;
  font-size: 1.2rem;
  font-weight: bold;
`

const OfferAddress = styled.div`
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.9rem;
  font-family: monospace;
`

const AcceptButton = styled.button`
  background: linear-gradient(135deg, #00FF41, #00BFFF);
  color: #000;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    transform: scale(1.05);
    box-shadow: 0 4px 12px rgba(0, 255, 65, 0.4);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`

const EmptyState = styled.div`
  text-align: center;
  padding: 2rem;
  color: rgba(255, 255, 255, 0.5);
`

const ConnectionStatus = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  color: ${props => props.connected ? '#00FF41' : '#FFA500'};
  margin-bottom: 1rem;
`

const StatusDot = styled.div`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${props => props.connected ? '#00FF41' : '#FFA500'};
  animation: ${props => props.connected ? 'none' : 'pulse 2s infinite'};
  
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.3; }
  }
`

export default function OffersContainer({ 
  gameData, 
  address, 
  isCreator, 
  acceptedOffer, 
  setAcceptedOffer, 
  showDepositOverlay, 
  setShowDepositOverlay 
}) {
  const [offers, setOffers] = useState([])
  const [connectionStatus, setConnectionStatus] = useState('disconnected')
  const gameId = gameData?.id || gameData?.listing_id

  // WebSocket connection and event handling
  useEffect(() => {
    if (!gameId || !address) return

    console.log('🔌 OffersContainer: Setting up WebSocket connection...')
    
    // Connect to WebSocket
    const connectAndSetup = async () => {
      try {
        await webSocketService.connect(gameId, address)
        console.log('✅ OffersContainer: WebSocket connected')
        
        // Initial offers load via API (once)
        if (gameData?.listing_id) {
          try {
            const response = await fetch(`/api/listings/${gameData.listing_id}/offers`)
            if (response.ok) {
              const data = await response.json()
              setOffers(data || [])
              console.log(`📊 Loaded ${data?.length || 0} offers from API`)
            }
          } catch (error) {
            console.error('❌ Failed to load initial offers:', error)
          }
        }
      } catch (error) {
        console.error('❌ WebSocket connection failed:', error)
      }
    }

    connectAndSetup()

    // Real-time event handlers
    const handleOffer = (data) => {
      console.log('📨 Real-time offer received:', data)
      
      const newOffer = {
        id: data.id || Date.now() + Math.random(),
        type: data.type,
        offerer_address: data.offerer_address || data.from,
        offer_price: data.amount || data.cryptoAmount,
        timestamp: data.timestamp || new Date().toISOString()
      }
      
      setOffers(prev => {
        const exists = prev.find(o => o.id === newOffer.id)
        if (exists) return prev
        return [...prev, newOffer]
      })
    }

    const handleOfferAccepted = (data) => {
      console.log('🎯 Offer accepted:', data)
      
      if (data.gameId === gameId) {
        // If we're the challenger, show deposit overlay
        if (data.challenger?.toLowerCase() === address?.toLowerCase()) {
          showSuccess('Your offer was accepted! Please deposit crypto.')
          setAcceptedOffer({
            offerer_address: data.challenger,
            cryptoAmount: gameData?.price_usd || gameData?.asking_price,
            timestamp: new Date().toISOString()
          })
          setShowDepositOverlay(true)
          
          // Switch to Lounge tab
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('switchToLoungeTab'))
          }, 200)
        }
      }
    }

    const handleYourOfferAccepted = (data) => {
      console.log('🎉 Your offer was accepted!', data)
      showSuccess('Your offer was accepted! Please deposit crypto.')
      
      setAcceptedOffer({
        offerer_address: address,
        cryptoAmount: gameData?.price_usd || gameData?.asking_price,
        timestamp: new Date().toISOString()
      })
      setShowDepositOverlay(true)
      
      // Switch to Lounge tab
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('switchToLoungeTab'))
      }, 200)
    }

    const handleGameStatusChanged = (data) => {
      console.log('📊 Game status changed:', data)
      
      if (data.gameId === gameId) {
        if (data.newStatus === 'waiting_challenger_deposit' && 
            gameData?.challenger?.toLowerCase() === address?.toLowerCase()) {
          // We're the challenger and need to deposit
          if (!showDepositOverlay) {
            setShowDepositOverlay(true)
            showInfo('Please deposit crypto to start the game')
          }
        }
      }
    }

    const handleDepositConfirmed = (data) => {
      console.log('✅ Deposit confirmed:', data)
      
      if (data.gameId === gameId) {
        // Check if both players have deposited
        if (data.bothDeposited) {
          showSuccess('Both players deposited! Game starting...')
          setShowDepositOverlay(false)
          
          // Transport to flip suite
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('switchToFlipSuite', {
              detail: { gameId, immediate: true }
            }))
          }, 1000)
        }
      }
    }

    const handleConnectionStatus = () => {
      setConnectionStatus(webSocketService.getConnectionStatus())
    }

    // Register WebSocket handlers
    webSocketService.on('crypto_offer', handleOffer)
    webSocketService.on('offer_accepted', handleOfferAccepted)
    webSocketService.on('your_offer_accepted', handleYourOfferAccepted)
    webSocketService.on('game_status_changed', handleGameStatusChanged)
    webSocketService.on('deposit_confirmed', handleDepositConfirmed)
    webSocketService.on('connected', handleConnectionStatus)
    webSocketService.on('disconnected', handleConnectionStatus)
    
    // Set initial connection status
    handleConnectionStatus()

    // Cleanup
    return () => {
      webSocketService.off('crypto_offer', handleOffer)
      webSocketService.off('offer_accepted', handleOfferAccepted)
      webSocketService.off('your_offer_accepted', handleYourOfferAccepted)
      webSocketService.off('game_status_changed', handleGameStatusChanged)
      webSocketService.off('deposit_confirmed', handleDepositConfirmed)
      webSocketService.off('connected', handleConnectionStatus)
      webSocketService.off('disconnected', handleConnectionStatus)
    }
  }, [gameId, address, gameData?.challenger, gameData?.price_usd, gameData?.asking_price])

  // Handle accepting an offer
  const handleAcceptOffer = async (offer) => {
    if (!isCreator) {
      showError('Only the game creator can accept offers')
      return
    }

    try {
      // Send via WebSocket
      webSocketService.send({
        type: 'accept_offer',
        gameId,
        offerId: offer.id,
        offerer_address: offer.offerer_address
      })

      // Also update via API for persistence
      const response = await fetch(`/api/games/${gameId}/accept-offer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          offerId: offer.id,
          challengerAddress: offer.offerer_address
        })
      })

      if (response.ok) {
        showSuccess('Offer accepted! Waiting for deposits...')
        
        // Remove accepted offer from list
        setOffers(prev => prev.filter(o => o.id !== offer.id))
      } else {
        throw new Error('Failed to accept offer')
      }
    } catch (error) {
      console.error('❌ Error accepting offer:', error)
      showError('Failed to accept offer')
    }
  }

  return (
    <Container>
      <Title>
        💰 Crypto Offers
        <span style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.6)' }}>
          ({offers.length})
        </span>
      </Title>
      
      <ConnectionStatus connected={connectionStatus === 'connected'}>
        <StatusDot connected={connectionStatus === 'connected'} />
        {connectionStatus === 'connected' ? 'Live' : 
         connectionStatus === 'connecting' ? 'Connecting...' : 'Reconnecting...'}
      </ConnectionStatus>

      <OffersList>
        {offers.length > 0 ? (
          offers.map(offer => (
            <OfferCard key={offer.id}>
              <OfferHeader>
                <div>
                  <OfferAmount>${offer.offer_price || offer.cryptoAmount}</OfferAmount>
                  <OfferAddress>
                    {offer.offerer_address?.slice(0, 6)}...{offer.offerer_address?.slice(-4)}
                  </OfferAddress>
                </div>
                {isCreator && (
                  <AcceptButton
                    onClick={() => handleAcceptOffer(offer)}
                    disabled={connectionStatus !== 'connected'}
                  >
                    Accept
                  </AcceptButton>
                )}
              </OfferHeader>
              <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>
                {new Date(offer.timestamp || offer.created_at).toLocaleTimeString()}
              </div>
            </OfferCard>
          ))
        ) : (
          <EmptyState>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🎯</div>
            <div>No offers yet</div>
            <div style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>
              {isCreator ? 'Waiting for challengers...' : 'Be the first to make an offer!'}
            </div>
          </EmptyState>
        )}
      </OffersList>
    </Container>
  )
}
