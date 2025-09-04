// CLEAN GAME PAGE - SINGLE WEBSOCKET ARCHITECTURE
// One WebSocket connection manages ALL real-time communication

import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useAccount } from 'wagmi'
import GameWebSocketManager from './GameWebSocketManager'
import SimpleOffersContainer from './SimpleOffersContainer'
import DepositOverlay from './DepositOverlay'
import { useToast } from '../../contexts/ToastContext'

const CleanGamePage = () => {
  const { gameId } = useParams()
  const { address } = useAccount()
  const { showSuccess, showError } = useToast()
  
  const [gameData, setGameData] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [activeTab, setActiveTab] = useState('offers')
  const [loading, setLoading] = useState(true)
  const [offers, setOffers] = useState([])

  // ===== LOAD GAME DATA =====
  useEffect(() => {
    const loadGameData = async () => {
      try {
        const response = await fetch(`/api/games/${gameId}`)
        if (response.ok) {
          const data = await response.json()
          setGameData(data.game)
        } else {
          showError('Game not found')
        }
      } catch (error) {
        console.error('Failed to load game:', error)
        showError('Failed to load game')
      } finally {
        setLoading(false)
      }
    }

    if (gameId) {
      loadGameData()
    }
  }, [gameId, showError])

  // ===== WEBSOCKET HANDLERS =====
  const handleChatMessage = (data) => {
    const newMsg = {
      id: Date.now() + Math.random(),
      sender: data.from,
      message: data.message,
      timestamp: new Date().toLocaleTimeString(),
      isCurrentUser: data.from === address
    }
    setMessages(prev => [...prev, newMsg])
  }

  const handleOfferReceived = (data) => {
    console.log('💰 New offer received:', data)
    
    const newOffer = {
      id: data.id,
      offerer_address: data.address,
      offer_price: data.cryptoAmount,
      created_at: data.timestamp,
      status: 'pending'
    }
    
    setOffers(prev => {
      // Avoid duplicates
      if (prev.some(o => o.id === newOffer.id)) return prev
      return [...prev, newOffer]
    })
    
    showSuccess(`New offer: $${data.cryptoAmount}`)
  }

  const handleOfferAccepted = (data) => {
    console.log('🎯 Offer accepted event received:', data)
    showSuccess('Offer accepted! Game starting...')
  }

  const handleDepositCountdown = (data) => {
    console.log('⏰ Deposit countdown started:', data)
    showSuccess('Deposit countdown started!')
  }

  const handleGameStatusChanged = (data) => {
    console.log('🎮 Game status changed:', data)
    
    // Update game data if needed
    if (data.gameId === gameId) {
      setGameData(prev => ({
        ...prev,
        status: data.status || data.data?.newStatus,
        challenger: data.challenger || data.data?.challenger
      }))
    }
  }

  // ===== HELPERS =====
  const isCreator = () => {
    return gameData && address && 
           gameData.creator?.toLowerCase() === address.toLowerCase()
  }

  const sendChatMessage = (webSocket) => {
    if (!newMessage.trim()) return

    const success = webSocket.sendChatMessage(newMessage)
    if (success) {
      setNewMessage('')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Loading game...</div>
      </div>
    )
  }

  if (!gameData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-red-600">Game not found</div>
      </div>
    )
  }

  return (
    <GameWebSocketManager
      gameId={gameId}
      address={address}
      onChatMessage={handleChatMessage}
      onOfferReceived={handleOfferReceived}
      onOfferAccepted={handleOfferAccepted}
      onDepositCountdown={handleDepositCountdown}
      onGameStatusChanged={handleGameStatusChanged}
    >
      {(webSocket) => (
        <div className="clean-game-page min-h-screen bg-gray-50">
          {/* Header */}
          <div className="bg-white shadow-sm p-4">
            <h1 className="text-2xl font-bold">🎮 {gameData.nft_name || 'Game'}</h1>
            <div className="text-sm text-gray-600">
              Game ID: {gameId} | Status: {gameData.status}
              {gameData.challenger && ` | Challenger: ${gameData.challenger.slice(0, 8)}...`}
            </div>
          </div>

          {/* Main Content */}
          <div className="container mx-auto p-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Game Info */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-bold mb-4">🖼️ NFT Details</h3>
                
                {gameData.nft_image && (
                  <img
                    src={gameData.nft_image}
                    alt={gameData.nft_name}
                    className="w-full h-64 object-cover rounded mb-4"
                  />
                )}
                
                <div className="space-y-2">
                  <div><strong>Name:</strong> {gameData.nft_name}</div>
                  <div><strong>Collection:</strong> {gameData.nft_collection}</div>
                  <div><strong>Token ID:</strong> {gameData.nft_token_id}</div>
                  <div><strong>Price:</strong> ${gameData.price_usd || gameData.payment_amount}</div>
                  <div><strong>Creator:</strong> {gameData.creator?.slice(0, 8)}...</div>
                  {gameData.challenger && (
                    <div><strong>Challenger:</strong> {gameData.challenger.slice(0, 8)}...</div>
                  )}
                </div>
              </div>

              {/* Tabs */}
              <div className="bg-white rounded-lg shadow">
                {/* Tab Headers */}
                <div className="flex border-b">
                  <button
                    onClick={() => setActiveTab('offers')}
                    className={`flex-1 py-3 px-4 text-center ${
                      activeTab === 'offers' 
                        ? 'border-b-2 border-blue-500 text-blue-600' 
                        : 'text-gray-600'
                    }`}
                  >
                    💰 Offers
                  </button>
                  <button
                    onClick={() => setActiveTab('chat')}
                    className={`flex-1 py-3 px-4 text-center ${
                      activeTab === 'chat' 
                        ? 'border-b-2 border-blue-500 text-blue-600' 
                        : 'text-gray-600'
                    }`}
                  >
                    💬 Chat
                  </button>
                </div>

                {/* Tab Content */}
                <div className="p-4">
                  {activeTab === 'offers' && (
                    <SimpleOffersContainer
                      gameData={gameData}
                      address={address}
                      isCreator={isCreator()}
                      webSocket={webSocket}
                      offers={offers}
                      setOffers={setOffers}
                    />
                  )}

                  {activeTab === 'chat' && (
                    <div className="chat-container">
                      {/* Messages */}
                      <div className="messages h-64 overflow-y-auto mb-4 border rounded p-2">
                        {messages.length === 0 ? (
                          <p className="text-gray-500 text-center">No messages yet</p>
                        ) : (
                          messages.map(msg => (
                            <div 
                              key={msg.id}
                              className={`mb-2 ${msg.isCurrentUser ? 'text-right' : 'text-left'}`}
                            >
                              <div className={`inline-block p-2 rounded ${
                                msg.isCurrentUser 
                                  ? 'bg-blue-500 text-white' 
                                  : 'bg-gray-200 text-gray-800'
                              }`}>
                                <div className="font-semibold text-xs">
                                  {msg.isCurrentUser ? 'You' : msg.sender?.slice(0, 8)}
                                </div>
                                <div>{msg.message}</div>
                                <div className="text-xs opacity-75">{msg.timestamp}</div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>

                      {/* Send Message */}
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Type a message..."
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && sendChatMessage(webSocket)}
                          className="flex-1 px-3 py-2 border rounded"
                        />
                        <button
                          onClick={() => sendChatMessage(webSocket)}
                          disabled={!webSocket.connected}
                          className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-400"
                        >
                          Send
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Deposit Overlay */}
          <DepositOverlay
            isVisible={webSocket.showDepositOverlay}
            acceptedOffer={webSocket.acceptedOffer}
            address={address}
            onClose={() => webSocket.setShowDepositOverlay(false)}
            webSocket={webSocket}
          />
        </div>
      )}
    </GameWebSocketManager>
  )
}

export default CleanGamePage
