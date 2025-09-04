// SINGLE WEBSOCKET MANAGER FOR ENTIRE GAME
// Handles ALL real-time communication in one place
// No more multiple connections, no more API calls for real-time actions

import { useEffect, useRef, useState } from 'react'
import webSocketService from '../../services/WebSocketService'
import { useToast } from '../ui/Toast'

const GameWebSocketManager = ({ 
  gameId, 
  address, 
  children, 
  onChatMessage, 
  onOfferReceived, 
  onOfferAccepted, 
  onDepositCountdown,
  onGameStatusChanged 
}) => {
  const { showSuccess, showError, showInfo } = useToast()
  const [connected, setConnected] = useState(false)
  const [acceptedOffer, setAcceptedOffer] = useState(null)
  const [showDepositOverlay, setShowDepositOverlay] = useState(false)
  const handlersRegistered = useRef(false)

  // ===== WEBSOCKET CONNECTION =====
  useEffect(() => {
    if (!gameId || !address) return

    const connectWebSocket = async () => {
      try {
        console.log(`🔌 Connecting to game ${gameId} as ${address}`)
        await webSocketService.connect(gameId, address)
        setConnected(true)
        console.log('✅ Connected to WebSocket')
      } catch (error) {
        console.error('❌ WebSocket connection failed:', error)
        setConnected(false)
      }
    }

    connectWebSocket()

    return () => {
      webSocketService.disconnect()
      setConnected(false)
      handlersRegistered.current = false
    }
  }, [gameId, address])

  // ===== MESSAGE HANDLERS =====
  useEffect(() => {
    if (!connected || handlersRegistered.current) return

    // Chat Messages
    const handleChatMessage = (data) => {
      console.log('💬 Chat message received:', data)
      if (onChatMessage) onChatMessage(data)
    }

    // Crypto Offers
    const handleCryptoOffer = (data) => {
      console.log('💰 Crypto offer received:', data)
      if (onOfferReceived) onOfferReceived(data)
    }

    // Offer Accepted (for Creator - Player 1)
    const handleOfferAcceptedCreator = (data) => {
      console.log('🎯 CREATOR: Offer accepted, waiting for challenger deposit')
      
      setAcceptedOffer({
        challengerAddress: data.challengerAddress,
        cryptoAmount: data.cryptoAmount,
        isCreatorWaiting: true,
        timeLimit: data.timeLimit || 120
      })
      setShowDepositOverlay(true)
      
      showInfo('Offer accepted! Waiting for challenger to deposit...')
      if (onOfferAccepted) onOfferAccepted(data)
    }

    // Offer Accepted (for Challenger - Player 2)
    const handleOfferAcceptedChallenger = (data) => {
      console.log('🎯 CHALLENGER: Your offer was accepted, deposit now!')
      
      setAcceptedOffer({
        challengerAddress: data.challengerAddress,
        cryptoAmount: data.cryptoAmount,
        needsDeposit: true,
        timeLimit: data.timeLimit || 120
      })
      setShowDepositOverlay(true)
      
      showSuccess('Your offer was accepted! Deposit crypto now.')
      if (onDepositCountdown) onDepositCountdown(data)
    }

    // Deposit Confirmed
    const handleDepositConfirmed = (data) => {
      console.log('✅ Deposit confirmed:', data)
      showSuccess(`${data.assetType} deposit confirmed!`)
    }

    // Game Status Changes
    const handleGameStatusChanged = (data) => {
      console.log('🎮 Game status changed:', data)
      if (onGameStatusChanged) onGameStatusChanged(data)
    }

    // Register all handlers
    webSocketService.on('chat_message', handleChatMessage)
    webSocketService.on('crypto_offer', handleCryptoOffer)
    webSocketService.on('offer_accepted_creator', handleOfferAcceptedCreator)
    webSocketService.on('offer_accepted_challenger', handleOfferAcceptedChallenger)
    webSocketService.on('deposit_confirmed', handleDepositConfirmed)
    webSocketService.on('game_status_changed', handleGameStatusChanged)

    handlersRegistered.current = true
    console.log('✅ All WebSocket handlers registered')

    return () => {
      webSocketService.off('chat_message', handleChatMessage)
      webSocketService.off('crypto_offer', handleCryptoOffer)
      webSocketService.off('offer_accepted_creator', handleOfferAcceptedCreator)
      webSocketService.off('offer_accepted_challenger', handleOfferAcceptedChallenger)
      webSocketService.off('deposit_confirmed', handleDepositConfirmed)
      webSocketService.off('game_status_changed', handleGameStatusChanged)
      handlersRegistered.current = false
    }
  }, [connected, onChatMessage, onOfferReceived, onOfferAccepted, onDepositCountdown, onGameStatusChanged])

  // ===== WEBSOCKET ACTIONS =====
  const sendChatMessage = (message) => {
    if (!connected) {
      showError('Not connected to game')
      return false
    }

    webSocketService.send({
      type: 'chat_message',
      from: address,
      message: message.trim()
    })
    return true
  }

  const sendCryptoOffer = (amount, listingId) => {
    if (!connected) {
      showError('Not connected to game')
      return false
    }

    webSocketService.send({
      type: 'crypto_offer',
      address,
      cryptoAmount: amount,
      listingId
    })
    return true
  }

  const acceptOffer = (offer, accepterAddress) => {
    if (!connected) {
      showError('Not connected to game')
      return false
    }

    console.log('🎯 Accepting offer via WebSocket:', offer)

    webSocketService.send({
      type: 'accept_offer',
      offerId: offer.id,
      accepterAddress,
      challengerAddress: offer.address,
      cryptoAmount: offer.cryptoAmount
    })
    
    showInfo('Accepting offer...')
    return true
  }

  const confirmDeposit = (player, assetType, transactionHash) => {
    if (!connected) {
      showError('Not connected to game')
      return false
    }

    webSocketService.send({
      type: 'deposit_confirmed',
      player,
      assetType,
      transactionHash
    })
    return true
  }

  // ===== RENDER =====
  const wsContextValue = {
    connected,
    sendChatMessage,
    sendCryptoOffer,
    acceptOffer,
    confirmDeposit,
    acceptedOffer,
    showDepositOverlay,
    setShowDepositOverlay
  }

  return (
    <div data-websocket-manager="true">
      {/* Connection Status */}
      <div style={{ 
        position: 'fixed', 
        top: '10px', 
        right: '10px', 
        zIndex: 9999,
        background: connected ? '#4ade80' : '#ef4444',
        color: 'white',
        padding: '4px 8px',
        borderRadius: '4px',
        fontSize: '12px'
      }}>
        WS: {connected ? 'Connected' : 'Disconnected'}
      </div>

      {/* Pass WebSocket context to children */}
      {children(wsContextValue)}
    </div>
  )
}

export default GameWebSocketManager
