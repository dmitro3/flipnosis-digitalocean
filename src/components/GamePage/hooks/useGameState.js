import { useState, useEffect, useRef } from 'react'
import { ethers } from 'ethers'
import { useToast } from '../../../contexts/ToastContext'
import { useContractService } from '../../../utils/useContractService'
import contractService from '../../../services/ContractService'
import { getApiUrl } from '../../../config/api'
import { useGameData } from './useGameData'
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
  const getGamePrice = () => gameData?.final_price || gameData?.price || gameData?.asking_price || gameData?.priceUSD || 0
  const getGameNFTImage = () => gameData?.nft?.image || gameData?.nft_image || gameData?.nftImage || '/placeholder-nft.svg'
  const getGameNFTName = () => gameData?.nft?.name || gameData?.nft_name || gameData?.nftName || 'Unknown NFT'
  const getGameNFTCollection = () => gameData?.nft?.collection || gameData?.nft_collection || gameData?.nftCollection || 'Unknown Collection'
  const getGameNFTContract = () => gameData?.nft_contract || gameData?.nft?.contract || gameData?.nftContract
  const getGameNFTTokenId = () => gameData?.nft_token_id || gameData?.nft?.tokenId || gameData?.nftTokenId

  const isCreator = () => address === getGameCreator()
  const isJoiner = () => address === getGameJoiner()

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
      console.error('❌ Error calculating ETH amount:', error)
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

      // Calculate ETH amount if we have a final price
      if (data.final_price) {
        if (data.eth_amount) {
          setEthAmount(BigInt(data.eth_amount))
        } else {
          await calculateAndSetEthAmount(data.final_price)
        }
      } else {
        setEthAmount(null)
      }

      // Start countdown if game is waiting for challenger deposit
      if (data.status === 'waiting_challenger_deposit' && data.deposit_deadline) {
        const now = new Date().getTime()
        const deadline = new Date(data.deposit_deadline).getTime()
        if (deadline > now) {
          startDepositCountdown(data.deposit_deadline)
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
            showSuccess('🎮 Game is now active! Choose heads or tails to begin!')
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
      // Use the same logic as loadGameData to determine the correct endpoint
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
                showInfo('🎲 Auto-flip triggered due to time limit!')
              } catch (error) {
                console.error('❌ Failed to send auto-flip:', error)
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
    if (!webSocketService.isConnected()) {
      showError('Not connected to game server')
      return
    }

    stopRoundCountdown()

    if (address === getGameCreator()) {
      setPlayerChoices(prev => ({ ...prev, creator: choice }))
      setGameState(prev => ({
        ...prev,
        creatorChoice: choice
      }))
    } else if (address === getGameJoiner()) {
      setPlayerChoices(prev => ({ ...prev, joiner: choice }))
      setGameState(prev => ({
        ...prev,
        joinerChoice: choice
      }))
    }

    showSuccess(`🎯 You chose ${choice.toUpperCase()}!`)

    // Send choice using WebSocket service
    const success = webSocketService.sendPlayerChoice(gameId, address, choice)
    
    if (!success) {
      console.error('❌ Failed to send choice')
      showError('Failed to send choice. Please try again.')

      if (address === getGameCreator()) {
        setPlayerChoices(prev => ({ ...prev, creator: null }))
        setGameState(prev => ({ ...prev, creatorChoice: null }))
      } else if (address === getGameJoiner()) {
        setPlayerChoices(prev => ({ ...prev, joiner: null }))
        setGameState(prev => ({ ...prev, joinerChoice: null }))
      }
    }

    if (gameState.currentRound === 5) {
      setTimeout(() => {
        handleAutoFlip()
      }, 1000)
    }
  }

  const handleAutoFlip = () => {
    showInfo('Round 5 - Auto-flipping for fairness!')

    const autoChoice = Math.random() < 0.5 ? 'heads' : 'tails'

    setGameState(prev => ({
      ...prev,
      creatorChoice: autoChoice,
      joinerChoice: autoChoice
    }))

    if (webSocketService.isConnected()) {
      webSocketService.sendAutoFlip(gameId, 'system', autoChoice)
    }
  }

  const handlePowerChargeStart = () => {
    setGameState(prev => ({
      ...prev,
      chargingPlayer: address
    }))
    
    // Send power charge start notification
    if (webSocketService.isConnected()) {
      webSocketService.sendPowerChargeStart(gameId, address)
    }
  }

  const handlePowerChargeStop = async (powerLevel) => {
    if (!webSocketService.isConnected()) {
      showError('Not connected to game server')
      return
    }

    const validPowerLevel = typeof powerLevel === 'number' && !isNaN(powerLevel) ? powerLevel : 5

    setGameState(prev => ({
      ...prev,
      chargingPlayer: null,
      creatorPower: address === getGameCreator() ? validPowerLevel : prev.creatorPower,
      joinerPower: address === getGameJoiner() ? validPowerLevel : prev.joinerPower
    }))

    // Send power charge using WebSocket service
    const success = webSocketService.sendPowerCharge(gameId, address, validPowerLevel)
    
    if (success) {
      showSuccess(`⚡ Power charged: ${validPowerLevel.toFixed(1)}/10`)
    } else {
      console.error('❌ Failed to send power message')
      showError('Failed to send power data. Please try again.')
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
        showSuccess(`🎉 You won this round! The coin landed on ${safeResult.result.toUpperCase()}!`)
      } else {
        showInfo(`😔 You lost this round. The coin landed on ${safeResult.result.toUpperCase()}.`)
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
        console.error('❌ Error parsing coin data:', error)
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
            console.error('❌ Error in fallback coin parsing:', fallbackError)
          }
        }
      }
    } else if (gameData?.coin && typeof gameData.coin === 'object') {
      coinData = gameData.coin
    }

    if (coinData && coinData.headsImage && coinData.tailsImage) {
      setCustomHeadsImage(coinData.headsImage)
      setCustomTailsImage(coinData.tailsImage)
      setGameCoin(coinData)
    } else {
      setCustomHeadsImage('/coins/plainh.png')
      setCustomTailsImage('/coins/plaint.png')
      setGameCoin({
        id: 'plain',
        type: 'default',
        name: 'Classic',
        headsImage: '/coins/plainh.png',
        tailsImage: '/coins/plaint.png'
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

  // Set up WebSocket message handler
  useGameData(
    gameId,
    gameData,
    gameState,
    address,
    null, // wsRef is now handled by useWebSocket hook
    setGameState,
    setPlayerChoices,
    setStreamedCoinState,
    handleFlipResult,
    handleGameCompleted
  )

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
    setPlayerChoices
  }
} 