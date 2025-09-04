import { useState, useEffect, useRef, useCallback } from 'react'
import { useToast } from '../../../contexts/ToastContext'
import { getApiUrl } from '../../../config/api'

export const useLobbyState = (gameId, address) => {
  const { showSuccess, showError, showInfo } = useToast()

  // Core lobby state
  const [gameData, setGameData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [offers, setOffers] = useState([])
  const [chatMessages, setChatMessages] = useState([])
  
  // Countdown and deposit state
  const [depositTimeLeft, setDepositTimeLeft] = useState(null)
  const [countdownInterval, setCountdownInterval] = useState(null)
  
  // Offer state
  const [newOffer, setNewOffer] = useState({ price: '', message: '' })
  const [creatingOffer, setCreatingOffer] = useState(false)

  // ETH amount state
  const [ethAmount, setEthAmount] = useState(null)

  // Helper functions - only use 'creator' field
  const getGameCreator = useCallback(() => gameData?.creator, [gameData?.creator])
  const getGameJoiner = useCallback(() => gameData?.challenger || gameData?.joiner || gameData?.joiner_address || gameData?.challenger_address, [gameData?.challenger, gameData?.joiner, gameData?.joiner_address, gameData?.challenger_address])
  const getGamePrice = useCallback(() => gameData?.payment_amount || gameData?.final_price || gameData?.price || gameData?.asking_price || gameData?.priceUSD || gameData?.price_usd || 0, [gameData?.payment_amount, gameData?.final_price, gameData?.price, gameData?.asking_price, gameData?.priceUSD, gameData?.price_usd])
  const getGameNFTImage = useCallback(() => gameData?.nft?.image || gameData?.nft_image || gameData?.nftImage || '/placeholder-nft.svg', [gameData?.nft?.image, gameData?.nft_image, gameData?.nftImage])
  const getGameNFTName = useCallback(() => gameData?.nft?.name || gameData?.nft_name || gameData?.nftName || 'Unknown NFT', [gameData?.nft?.name, gameData?.nft_name, gameData?.nftName])
  const getGameNFTCollection = useCallback(() => gameData?.nft?.collection || gameData?.nft_collection || gameData?.nftCollection || 'Unknown Collection', [gameData?.nft?.collection, gameData?.nft_collection, gameData?.nftCollection])

  const isCreator = useCallback(() => {
    if (!gameData || !address) return false
    
    // Use 'creator' field which is what your database actually has
    const creatorAddress = gameData.creator
    if (!creatorAddress) return false
    
    return address.toLowerCase() === creatorAddress.toLowerCase()
  }, [gameData?.creator, address])

  const isJoiner = useCallback(() => {
    if (!address || !gameData) return false
    
    const challengerAddress = gameData?.challenger || gameData?.joiner || 
      gameData?.joiner_address || gameData?.challenger_address
    
    if (!challengerAddress) return false
    
    return address.toLowerCase() === challengerAddress.toLowerCase()
  }, [gameData?.challenger, gameData?.joiner, gameData?.joiner_address, gameData?.challenger_address, address])

  // Load game data
  const loadGameData = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch(getApiUrl(`/games/${gameId}`))

      if (!response.ok) {
        setError('Game not found or API unavailable')
        setLoading(false)
        return
      }

      let data
      try {
        data = await response.json()
      } catch (err) {
        console.error('Failed to parse game data JSON:', err)
        setError('Invalid response from server. Please try again.')
        setLoading(false)
        return
      }

      if (!data || typeof data !== 'object') {
        setError('Invalid game data received from server.')
        setLoading(false)
        return
      }

      console.log('🔄 Game data loaded:', {
        id: data.id,
        status: data.status,
        challenger: data.challenger,
        creator_deposited: data.creator_deposited,
        challenger_deposited: data.challenger_deposited
      })

      setGameData(data)

      // Start countdown if game is waiting for challenger deposit
      if (data.status === 'waiting_challenger_deposit') {
        console.log('💰 Game is waiting for challenger deposit, starting countdown')
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

      // Load offers after game data is loaded
      if (data && (data.listing_id || data.id)) {
        console.log('🔄 Loading offers for game data')
        // Load offers directly with the data we just received
        try {
          const listingId = data.listing_id || data.id
          const response = await fetch(getApiUrl(`/listings/${listingId}/offers`))
          if (response.ok) {
            const offersData = await response.json()
            console.log('✅ Loaded offers:', offersData)
            setOffers(offersData)
          }
        } catch (error) {
          console.error('❌ Error loading offers:', error)
        }
      }

    } catch (err) {
      console.error('Error loading game data:', err)
      setError('Failed to load game data. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [gameId]) // Only depend on gameId

  // Load offers for listings
  const loadOffers = useCallback(async () => {
    console.log('🔍 loadOffers called with gameData:', gameData)
    
    if (!gameData) {
      console.log('❌ No game data available')
      return
    }

    try {
      const listingId = gameData?.listing_id || gameData?.id
      console.log('📋 Attempting to fetch offers for listingId:', listingId)
      
      const response = await fetch(getApiUrl(`/listings/${listingId}/offers`))
      console.log('📡 Response status:', response.status)
      
      if (response.ok) {
        let offersData = await response.json()
        console.log('✅ Fetched offers:', offersData)
        setOffers(offersData)
      } else {
        console.log('❌ Response not ok:', response.status, response.statusText)
        setOffers([])
      }
    } catch (error) {
      console.error('❌ Error loading offers:', error)
      setOffers([])
    }
  }, [gameData?.listing_id, gameData?.id]) // Only depend on the IDs, not the entire gameData object

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
        // WebSocket will handle state updates when deposit expires
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
          console.log('✅ Created listing for game:', listingId)
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
      console.error('❌ Error creating offer:', error)
      showError(`Failed to create offer: ${error.message}`)
    } finally {
      setCreatingOffer(false)
    }
  }

  const acceptOffer = async (offerId, offerPrice, challengerAddress) => {
    try {
      showInfo('Accepting offer...')

      // Use WebSocket ONLY - no more API calls for real-time actions
      const webSocketService = window.webSocketService || window.FlipnosisWS
      if (webSocketService && webSocketService.isConnected()) {
        webSocketService.send({
          type: 'accept_offer',
          offerId,
          accepterAddress: address,
          challengerAddress,
          cryptoAmount: offerPrice
        })
        
        showSuccess('Offer accepted! Game starting...')
        console.log('✅ Offer acceptance sent via WebSocket')
      } else {
        showError('WebSocket not connected. Please refresh the page.')
      }
    } catch (error) {
      console.error('❌ Error accepting offer:', error)
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

  // Load game data on mount
  useEffect(() => {
    if (gameId) {
      loadGameData()
    }
  }, [gameId])





  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (countdownInterval) {
        clearInterval(countdownInterval)
      }
    }
  }, [countdownInterval])

  return {
    // State
    gameData,
    loading,
    error,
    offers,
    chatMessages,
    ethAmount,
    depositTimeLeft,
    newOffer,
    creatingOffer,

    // Actions
    loadGameData,
    loadOffers,
    createOffer,
    acceptOffer,
    rejectOffer,
    formatTimeLeft,

    // Setters
    setNewOffer,
    setCreatingOffer,
    setChatMessages,

    // Helpers
    isCreator,
    isJoiner,
    getGameCreator,
    getGameJoiner,
    getGamePrice,
    getGameNFTImage,
    getGameNFTName,
    getGameNFTCollection
  }
}
