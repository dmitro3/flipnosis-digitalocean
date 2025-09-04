// CLEAN OFFERS CONTAINER - WEBSOCKET ONLY
// No API calls, no multiple connections, just clean WebSocket communication

import { useState, useEffect } from 'react'
import { useToast } from '../ui/Toast'

const SimpleOffersContainer = ({ 
  gameData, 
  address, 
  isCreator, 
  webSocket, // Single WebSocket instance
  offers, // Passed from parent
  setOffers // Passed from parent
}) => {
  const { showSuccess, showError, showInfo } = useToast()
  const [newOfferAmount, setNewOfferAmount] = useState('')
  const [playerNames, setPlayerNames] = useState({})

  // ===== LOAD EXISTING OFFERS =====
  useEffect(() => {
    // Load offers from API once on mount (for persistence)
    const loadOffers = async () => {
      try {
        const response = await fetch(`/api/offers?listingId=${gameData?.listing_id || gameData?.id}`)
        if (response.ok) {
          const data = await response.json()
          setOffers(data.offers || [])
        }
      } catch (error) {
        console.error('Failed to load offers:', error)
      }
    }

    if (gameData?.listing_id || gameData?.id) {
      loadOffers()
    }
  }, [gameData?.listing_id, gameData?.id])

  // ===== HANDLE WEBSOCKET OFFERS =====
  useEffect(() => {
    // This component will receive offers through the webSocket prop
    // which is passed down from the parent GameWebSocketManager
  }, [])

  // ===== SEND OFFER =====
  const handleSendOffer = () => {
    const amount = parseFloat(newOfferAmount)
    if (!amount || amount <= 0) {
      showError('Enter a valid offer amount')
      return
    }

    if (!webSocket.connected) {
      showError('Not connected to game')
      return
    }

    // Send via WebSocket ONLY
    const success = webSocket.sendCryptoOffer(amount, gameData?.listing_id || gameData?.id)
    if (success) {
      setNewOfferAmount('')
      showInfo('Offer sent!')
    }
  }

  // ===== ACCEPT OFFER =====
  const handleAcceptOffer = (offer) => {
    if (!isCreator) {
      showError('Only the creator can accept offers')
      return
    }

    if (!webSocket.connected) {
      showError('Not connected to game')
      return
    }

    // Accept via WebSocket ONLY
    const success = webSocket.acceptOffer(offer, address)
    if (success) {
      showInfo('Accepting offer...')
    }
  }

  // ===== LOAD PLAYER NAMES =====
  useEffect(() => {
    const loadPlayerNames = async () => {
      const addresses = [...new Set(offers.map(o => o.offerer_address))]
      const names = {}

      for (const addr of addresses) {
        try {
          const response = await fetch(`/api/profile/${addr}`)
          if (response.ok) {
            const profile = await response.json()
            names[addr] = profile.name || addr.slice(0, 6) + '...'
          }
        } catch (error) {
          names[addr] = addr.slice(0, 6) + '...'
        }
      }

      setPlayerNames(names)
    }

    if (offers.length > 0) {
      loadPlayerNames()
    }
  }, [offers])

  // ===== RENDER =====
  return (
    <div className="offers-container p-4">
      <h3 className="text-lg font-bold mb-4">💰 Offers</h3>

      {/* Make Offer (if not creator) */}
      {!isCreator && (
        <div className="make-offer mb-4 p-3 bg-gray-100 rounded">
          <div className="flex gap-2">
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="Enter amount (USD)"
              value={newOfferAmount}
              onChange={(e) => setNewOfferAmount(e.target.value)}
              className="flex-1 px-3 py-2 border rounded"
            />
            <button
              onClick={handleSendOffer}
              disabled={!webSocket.connected}
              className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-400"
            >
              Send Offer
            </button>
          </div>
        </div>
      )}

      {/* Offers List */}
      <div className="offers-list">
        {offers.length === 0 ? (
          <p className="text-gray-500">No offers yet</p>
        ) : (
          offers.map(offer => (
            <div 
              key={offer.id} 
              className="offer p-3 mb-2 border rounded flex justify-between items-center"
            >
              <div>
                <div className="font-semibold">${offer.offer_price}</div>
                <div className="text-sm text-gray-600">
                  by {playerNames[offer.offerer_address] || offer.offerer_address.slice(0, 8)}
                </div>
                <div className="text-xs text-gray-400">
                  {new Date(offer.created_at).toLocaleTimeString()}
                </div>
              </div>

              {isCreator && offer.status === 'pending' && (
                <button
                  onClick={() => handleAcceptOffer(offer)}
                  disabled={!webSocket.connected}
                  className="px-3 py-1 bg-green-500 text-white rounded disabled:bg-gray-400"
                >
                  Accept
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {/* Connection Status */}
      <div className="mt-4 text-sm">
        Status: {webSocket.connected ? (
          <span className="text-green-600">Connected ✅</span>
        ) : (
          <span className="text-red-600">Disconnected ❌</span>
        )}
      </div>
    </div>
  )
}

export default SimpleOffersContainer
