import { useState, useEffect, useRef } from 'react'
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
  const getGameCreator = () => gameData?.creator
  const getGameJoiner = () => gameData?.challenger || gameData?.joiner || gameData?.joiner_address || gameData?.challenger_address
  const getGamePrice = () => gameData?.payment_amount || gameData?.final_price || gameData?.price || gameData?.asking_price || gameData?.priceUSD || gameData?.price_usd || 0
  const getGameNFTImage = () => gameData?.nft?.image || gameData?.nft_image || gameData?.nftImage || '/placeholder-nft.svg'
  const getGameNFTName = () => gameData?.nft?.name || gameData?.nft_name || gameData?.nftName || 'Unknown NFT'
  const getGameNFTCollection = () => gameData?.nft?.collection || gameData?.nft_collection || gameData?.nftCollection || 'Unknown Collection'

  const isCreator = () => {
    if (!gameData || !address) return false
    
    // Use 'creator' field which is what your database actually has
    const creatorAddress = gameData.creator
    if (!creatorAddress) return false
    
    return address.toLowerCase() === creatorAddress.toLowerCase()
  }
  const isJoiner = () => {
    if (!address || !gameData) return false
    
    const challengerAddress = gameData?.challenger || gameData?.joiner || 
      gameData?.joiner_address || gameData?.challenger_address
    
    if (!challengerAddress) return false
    
    return address.toLowerCase() === challengerAddress.toLowerCase()
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
          console.error('❌ Error loading offers:', error)
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

        if (isCreator()) {
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

  // Load offers when game data changes - only trigger on specific fields
  useEffect(() => {
    if (gameData && (gameData.listing_id || gameData.id)) {
      loadOffers()
    }
  }, [gameData?.listing_id, gameData?.id]) // Only depend on IDs, not full gameData

  // Auto-refresh offers every 10 seconds (reduced to prevent interference)
  useEffect(() => {
    if (gameData && (gameData.listing_id || gameData.id)) {
      const interval = setInterval(() => {
        loadOffers()
      }, 10000)

      return () => {
        clearInterval(interval)
      }
    }
  }, [gameData?.listing_id, gameData?.id]) // Only depend on IDs, not full gameData

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
