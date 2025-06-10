import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useWallet } from '../contexts/WalletContext'
import { useToast } from '../contexts/ToastContext'
import { ThemeProvider } from '@emotion/react'
import { theme } from '../styles/theme'
import {
  Container,
  ContentWrapper,
  GlassCard,
  NeonText,
  Button,
  LoadingSpinner
} from '../styles/components'
import ReliableGoldCoin from './ReliableGoldCoin'
import PowerDisplay from '../components/PowerDisplay'
import PaymentService from '../services/PaymentService'
import { ethers } from 'ethers'
import ProfilePicture from './ProfilePicture'
import baseEthLogo from '../../Images/baseeth.webp'
import hazeVideo from '../../Images/Video/haze.webm'
import GoldGameInstructions from './GoldGameInstructions'
import ShareButton from './ShareButton'
import styled from '@emotion/styled'
import GameResultPopup from './GameResultPopup'
import GameChatBox from './GameChatBox'
import NFTVerificationDisplay from './NFTVerificationDisplay'
import NFTOfferComponent from './NFTOfferComponent'

const BackgroundVideo = styled.video`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  z-index: -1;
  opacity: 0.7;
`

const ChoiceAnimation = styled.div`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 15rem;
  font-weight: 900;
  color: ${props => props.color};
  text-transform: uppercase;
  opacity: 0;
  z-index: 1000;
  pointer-events: none;
  animation: choiceAnimation 1s ease-out forwards;
  text-shadow: 0 0 20px ${props => props.color};

  @keyframes choiceAnimation {
    0% {
      opacity: 0;
      transform: translate(-50%, -50%) scale(0.5);
    }
    20% {
      opacity: 1;
      transform: translate(-50%, -50%) scale(1.2);
    }
    80% {
      opacity: 1;
      transform: translate(-50%, -50%) scale(1);
    }
    100% {
      opacity: 0;
      transform: translate(-50%, -50%) scale(1.5);
    }
  }
`

const Modal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`

const ModalContent = styled(GlassCard)`
  max-width: 500px;
  width: 90%;
  padding: 2rem;
`

const ModalHeader = styled.div`
  margin-bottom: 1.5rem;
`

const ModalBody = styled.div`
  margin-bottom: 1.5rem;
`

const ModalFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
`

const CloseButton = styled.button`
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: none;
  border: none;
  color: ${props => props.theme.colors.textSecondary};
  cursor: pointer;
  font-size: 1.5rem;
  padding: 0.5rem;
  
  &:hover {
    color: ${props => props.theme.colors.textPrimary};
  }
`

const NFTImage = styled.img`
  width: 100%;
  max-width: 300px;
  height: auto;
  border-radius: 1rem;
  margin: 1rem 0;
`

const NFTLink = styled.a`
  color: ${props => props.theme.colors.neonBlue};
  text-decoration: none;
  
  &:hover {
    text-decoration: underline;
  }
`

const FlipGame = () => {
  const { gameId } = useParams()
  const navigate = useNavigate()
  const { isConnected, address, provider } = useWallet()
  const { showSuccess, showError, showInfo } = useToast()

  // API URL
  const API_URL = 'https://cryptoflipz2-production.up.railway.app'

  // Local state - ONLY for non-game logic
  const [gameData, setGameData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [joiningGame, setJoiningGame] = useState(false)

  // WebSocket state - SINGLE SOURCE OF TRUTH for game
  const [socket, setSocket] = useState(null)
  const [connected, setConnected] = useState(false)
  const [gameState, setGameState] = useState(null)
  const [flipAnimation, setFlipAnimation] = useState(null)
  const [roundResult, setRoundResult] = useState(null)

  // Refs for user input
  const isChargingRef = useRef(false)

  // Player identification
  const isCreator = gameData?.creator === address
  const isJoiner = gameData?.joiner === address
  const isPlayer = isCreator || isJoiner
  const isMyTurn = gameState?.currentPlayer === address

  // Add state for popup
  const [showResultPopup, setShowResultPopup] = useState(false)
  const [popupData, setPopupData] = useState(null)

  // Add new state for enhanced NFT data
  const [nftData, setNftData] = useState(null)
  const [isLoadingNFT, setIsLoadingNFT] = useState(false)

  // Add these state variables to your existing FlipGame component
  const [offeredNFTs, setOfferedNFTs] = useState([])
  const [acceptedOffer, setAcceptedOffer] = useState(null)
  const [isNFTGame, setIsNFTGame] = useState(false)

  // Add new state variables
  const [showNFTOfferModal, setShowNFTOfferModal] = useState(false)
  const [showNFTVerificationModal, setShowNFTVerificationModal] = useState(false)
  const [showNFTDetailsModal, setShowNFTDetailsModal] = useState(false)
  const [showOfferReviewModal, setShowOfferReviewModal] = useState(false)
  const [selectedNFT, setSelectedNFT] = useState(null)
  const [nftOffer, setNftOffer] = useState(null)

  // Add new state variables for choice animation
  const [showChoiceAnimation, setShowChoiceAnimation] = useState(false)
  const [choiceAnimationText, setChoiceAnimationText] = useState('')
  const [choiceAnimationColor, setChoiceAnimationColor] = useState('')

  // WebSocket connection
  useEffect(() => {
    if (!gameId || !address) {
      console.log('❌ Cannot connect - missing gameId or address:', { gameId, address })
      return
    }

    console.log('🎮 Setting up WebSocket connection:', { gameId, address })
    let reconnectAttempts = 0
    const maxReconnectAttempts = 5
    let reconnectTimer

    const connect = () => {
      const wsUrl = process.env.NODE_ENV === 'production' 
        ? 'wss://cryptoflipz2-production.up.railway.app' 
        : 'ws://localhost:3001'
      
      console.log('🔌 Connecting to WebSocket:', wsUrl)
      const ws = new WebSocket(wsUrl)

      ws.onopen = () => {
        console.log('✅ WebSocket connected')
        setConnected(true)
        setSocket(ws)
        reconnectAttempts = 0
        
        // Join game
        const joinMessage = {
          type: 'connect_to_game',
          gameId,
          address
        }
        console.log('🎮 Sending join message:', joinMessage)
        ws.send(JSON.stringify(joinMessage))
      }

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          console.log('📡 Received WebSocket message:', {
            type: data.type,
            phase: data.phase,
            currentPlayer: data.currentPlayer,
            creatorChoice: data.creatorChoice,
            joinerChoice: data.joinerChoice,
            creator: data.creator,
            joiner: data.joiner
          })
          
          switch (data.type) {
            case 'game_state':
              console.log('🔄 Game state update:', {
                phase: data.phase,
                currentRound: data.currentRound,
                currentPlayer: data.currentPlayer,
                creatorWins: data.creatorWins,
                joinerWins: data.joinerWins,
                isFlipInProgress: data.isFlipInProgress,
                creatorChoice: data.creatorChoice,
                joinerChoice: data.joinerChoice,
                creator: data.creator,
                joiner: data.joiner
              })
              setGameState(data)
              
              // Show opponent's choice animation if they just made a choice
              if (data.phase === 'round_active' && 
                  ((isCreator && data.joinerChoice) || (isJoiner && data.creatorChoice))) {
                const opponentChoice = isCreator ? data.joinerChoice : data.creatorChoice
                setChoiceAnimationText(opponentChoice.toUpperCase())
                setChoiceAnimationColor('#FF1493') // Neon pink
                setShowChoiceAnimation(true)
                setTimeout(() => {
                  setShowChoiceAnimation(false)
                }, 1000)
              }
              break
              
            case 'flip_animation':
              console.log('🎬 Flip animation received:', data)
              setFlipAnimation(data)
              setRoundResult(null)
              break
              
            case 'round_result':
              console.log('🏁 Round result received:', data)
              setRoundResult(data)
              setTimeout(() => setRoundResult(null), 4000)
              break
              
            case 'error':
              console.log('❌ Error received:', data.error)
              showError(data.error)
              break
          }
        } catch (error) {
          console.error('❌ Error parsing WebSocket message:', error)
        }
      }

      ws.onclose = () => {
        console.log('❌ WebSocket disconnected')
        setConnected(false)
        setSocket(null)
        
        // Attempt to reconnect
        if (reconnectAttempts < maxReconnectAttempts) {
          reconnectAttempts++
          console.log(`🔄 Attempting to reconnect (${reconnectAttempts}/${maxReconnectAttempts})...`)
          reconnectTimer = setTimeout(() => {
            connect()
          }, 2000 * reconnectAttempts)
        } else {
          showError('Lost connection to game server. Please refresh the page.')
        }
      }

      ws.onerror = (error) => {
        console.error('❌ WebSocket error:', error)
      }

      return ws
    }

    const ws = connect()

    return () => {
      if (reconnectTimer) {
        clearTimeout(reconnectTimer)
      }
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.close()
      }
    }
  }, [gameId, address])

  // Load game data from database
  useEffect(() => {
    const loadGame = async () => {
      try {
        setLoading(true)
        const response = await fetch(`${API_URL}/api/games/${gameId}`)
        
        if (response.ok) {
          const dbGame = await response.json()
          
          const gameData = {
            id: dbGame.id,
            creator: dbGame.creator,
            joiner: dbGame.joiner,
            nft: {
              contractAddress: dbGame.nft_contract,
              tokenId: dbGame.nft_token_id,
              name: dbGame.nft_name,
              image: dbGame.nft_image || 'https://picsum.photos/300/300?random=' + dbGame.id,
              collection: dbGame.nft_collection,
              chain: dbGame.nft_chain
            },
            price: dbGame.price_usd,
            priceUSD: dbGame.price_usd,
            rounds: dbGame.rounds,
            status: dbGame.status
          }
          
          setGameData(gameData)
        } else {
          throw new Error('Game not found')
        }
      } catch (error) {
        console.error('❌ Error loading game:', error)
        showError('Game not found')
        navigate('/')
      } finally {
        setLoading(false)
      }
    }

    loadGame()
  }, [gameId])

  // Update useEffect to fetch NFT data when game loads or when we have game data
  useEffect(() => {
    if (gameId && gameData) {
      fetchNFTData(gameId)
    }
  }, [gameId, gameData])

  // Add effect to set NFT data from gameData as fallback
  useEffect(() => {
    if (gameData && !nftData && !isLoadingNFT) {
      console.log('🎨 Setting NFT data from gameData:', gameData.nft)
      setNftData({
        contractAddress: gameData.nft.contractAddress,
        tokenId: gameData.nft.tokenId,
        name: gameData.nft.name,
        image: gameData.nft.image,
        collection: gameData.nft.collection,
        chain: gameData.nft.chain,
        metadata: {
          description: gameData.nft.description || '',
          attributes: gameData.nft.attributes || []
        }
      })
    }
  }, [gameData, nftData, isLoadingNFT])

  // User input handlers - ONLY send to server
  const handlePowerChargeStart = () => {
    // Only allow charging if player has made their choice and it's the charging phase
    if (!isMyTurn || !socket || isChargingRef.current || gameState?.phase !== 'round_active') return
    
    // Check if player has made their choice
    const playerChoice = isCreator ? gameState?.creatorChoice : gameState?.joinerChoice
    if (!playerChoice) {
      showError('You must choose heads or tails first!')
      return
    }
    
    isChargingRef.current = true
    socket.send(JSON.stringify({
      type: 'start_charging',
      gameId,
      address
    }))
  }

  const handlePowerChargeStop = () => {
    if (!socket || !isChargingRef.current) return
    
    isChargingRef.current = false
    socket.send(JSON.stringify({
      type: 'stop_charging',
      gameId,
      address
    }))
  }

  const handlePlayerChoice = (choice) => {
    console.log('🎯 handlePlayerChoice called:', {
      choice,
      hasSocket: !!socket,
      hasGameState: !!gameState,
      gamePhase: gameState?.phase,
      isMyTurn: gameState?.currentPlayer === address,
      currentPlayer: gameState?.currentPlayer,
      myAddress: address,
      isCreator,
      isJoiner
    })

    if (!socket || !gameState) {
      console.log('❌ Cannot make choice - missing socket or gameState')
      showError('Connection error - please refresh')
      return
    }
    
    if (gameState.phase !== 'choosing') {
      console.log('❌ Cannot make choice - wrong phase:', gameState.phase)
      showError('Not in choosing phase')
      return
    }
    
    const isMyTurn = gameState.currentPlayer === address
    if (!isMyTurn) {
      console.log('❌ Not my turn:', { 
        currentPlayer: gameState.currentPlayer, 
        myAddress: address,
        isCreator,
        isJoiner
      })
      showError('Not your turn')
      return
    }
    
    // Show animation for player's choice
    setChoiceAnimationText(choice.toUpperCase())
    setChoiceAnimationColor('#00FF41') // Neon green
    setShowChoiceAnimation(true)
    
    // Hide animation after 1 second
    setTimeout(() => {
      setShowChoiceAnimation(false)
    }, 1000)
    
    console.log('🎯 Sending player choice to server:', choice)
    
    socket.send(JSON.stringify({
      type: 'player_choice',
      gameId,
      address,
      choice
    }))
  }

  const handleJoinGame = async () => {
    if (!gameData || !provider || !address || joiningGame) return

    try {
      setJoiningGame(true)
      showInfo('Processing payment...')
      
      const paymentResult = await PaymentService.calculateETHAmount(gameData.priceUSD)
      const signer = await provider.getSigner()
      const feeRecipient = PaymentService.getFeeRecipient()
      
      const txResult = await PaymentService.buildTransaction(feeRecipient, paymentResult.weiAmount, provider)
      const paymentTx = await signer.sendTransaction(txResult.txConfig)
      showInfo('Confirming payment...')
      
      const receipt = await paymentTx.wait()
      console.log('✅ Payment confirmed:', receipt.hash)
      
      // Update game in database first
      const joinResponse = await fetch(`${API_URL}/api/games/${gameData.id}/simple-join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          joinerAddress: address,
          paymentTxHash: receipt.hash,
          paymentAmount: gameData.priceUSD
        })
      })
      
      if (!joinResponse.ok) {
        const error = await joinResponse.json()
        throw new Error(error.error || 'Failed to join game')
      }
      
      // Update local state
      setGameData(prev => ({ ...prev, joiner: address, status: 'joined' }))
      
      // Tell server via WebSocket
      if (socket) {
        socket.send(JSON.stringify({
          type: 'join_game',
          gameId,
          role: 'joiner',
          address,
          entryFeeHash: receipt.hash
        }))
      }
      
      showSuccess('Successfully joined the game!')
        
    } catch (error) {
      console.error('❌ Failed to join game:', error)
      showError('Failed to join: ' + error.message)
    } finally {
      setJoiningGame(false)
    }
  }

  // Add handleClaimWinnings function
  const handleClaimWinnings = async () => {
    try {
      showInfo('Claiming winnings... (Contract integration coming soon)')
      // TODO: Add contract integration here
      // For now, just show success and navigate home
      setTimeout(() => {
        showSuccess('Winnings claimed successfully!')
        setShowResultPopup(false)
        navigate('/')
      }, 2000)
    } catch (error) {
      showError('Failed to claim winnings: ' + error.message)
    }
  }

  // Add effect to show popup when game is complete
  useEffect(() => {
    if (gameState?.phase === 'game_complete') {
      const isWinner = gameState.winner === address
      setPopupData({
        isWinner,
        flipResult: null, // No specific flip result for game end
        playerChoice: null, // No specific choice for game end
        gameData,
        finalScore: {
          creatorWins: gameState.creatorWins,
          joinerWins: gameState.joinerWins
        }
      })
      setShowResultPopup(true)
    }
  }, [gameState?.phase, gameState?.winner, address, gameData])

  const handleShare = (platform) => {
    const shareText = `Join my game of Crypto Flipz! Game ID: ${gameId}`;
    const shareUrl = window.location.href;
    
    if (platform === 'x') {
      const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
      window.open(twitterUrl, '_blank');
    } else if (platform === 'telegram') {
      const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`;
      window.open(telegramUrl, '_blank');
    } else if (platform === 'copy') {
      navigator.clipboard.writeText(shareUrl);
      showInfo('Link copied to clipboard!');
    }
  };

  // Add this useEffect to detect NFT vs NFT games
  useEffect(() => {
    if (gameData) {
      setIsNFTGame(gameData.gameType === 'nft-vs-nft')
    }
  }, [gameData])

  // Enhanced WebSocket message handler (add to existing useEffect)
  useEffect(() => {
    if (!socket) return

    const handleMessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        console.log('📡 Received WebSocket message:', data)
        
        switch (data.type) {
          case 'game_state':
            setGameState(data)
            break
            
          case 'flip_animation':
            setFlipAnimation(data)
            setRoundResult(null)
            break
            
          case 'round_result':
            setRoundResult(data)
            setTimeout(() => setRoundResult(null), 4000)
            break

          // NEW: Handle NFT offers
          case 'nft_offer_received':
            console.log('🎯 NFT offer received:', data.offer)
            setOfferedNFTs(prev => [...prev, data.offer])
            if (!isCreator) {
              showInfo(`New NFT battle offer: ${data.offer.nft.name}`)
            }
            break

          // NEW: Handle offer acceptance
          case 'nft_offer_accepted':
            console.log('✅ NFT offer accepted:', data.acceptedOffer)
            setAcceptedOffer(data.acceptedOffer)
            
            // Show payment prompt to the challenger
            if (data.acceptedOffer.offererAddress === address) {
              handlePaymentForAcceptedOffer(data.acceptedOffer)
            }
            break

          // NEW: Handle game start after NFT payment
          case 'nft_game_ready':
            console.log('🎮 NFT game ready to start')
            showSuccess('Battle payment confirmed! Game starting...')
            break
            
          case 'error':
            showError(data.error)
            break
        }
      } catch (error) {
        console.error('❌ Error parsing WebSocket message:', error)
      }
    }

    socket.addEventListener('message', handleMessage)
    return () => socket.removeEventListener('message', handleMessage)
  }, [socket, address, isCreator])

  // NEW: Handle payment for accepted NFT offer
  const handlePaymentForAcceptedOffer = async (offer) => {
    try {
      showInfo('Your offer was accepted! Processing payment...')
      
      // Calculate 50¢ fee
      const feeUSD = 0.50
      const feeCalculation = await PaymentService.calculateETHFee(feeUSD)
      
      if (!feeCalculation.success) {
        throw new Error('Failed to calculate fee: ' + feeCalculation.error)
      }

      const feeAmountETH = feeCalculation.ethAmount
      const signer = await provider.getSigner()
      const feeRecipient = PaymentService.getFeeRecipient()
      const feeAmountWei = ethers.parseEther(feeAmountETH.toString())

      const txResult = await PaymentService.buildTransaction(feeRecipient, feeAmountWei, provider)
      if (!txResult.success) {
        throw new Error('Failed to build transaction: ' + txResult.error)
      }

      const feeTx = await signer.sendTransaction(txResult.txConfig)
      showInfo('Confirming payment...')
      
      const feeReceipt = await feeTx.wait()
      showSuccess('Payment confirmed! Starting battle...')

      // Update database with payment
      const response = await fetch(`${API_URL}/api/games/${gameId}/nft-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challengerAddress: address,
          paymentTxHash: feeReceipt.hash,
          paymentAmount: feeUSD,
          acceptedOffer: offer
        })
      })

      if (!response.ok) {
        throw new Error('Failed to record payment')
      }

      // Notify via WebSocket that payment is complete
      if (socket) {
        socket.send(JSON.stringify({
          type: 'nft_payment_complete',
          gameId,
          challengerAddress: address,
          paymentTxHash: feeReceipt.hash,
          acceptedOffer: offer
        }))
      }

    } catch (error) {
      console.error('❌ Payment failed:', error)
      showError('Payment failed: ' + error.message)
    }
  }

  // NEW: Handle NFT offer submission
  const handleOfferSubmitted = (offerData) => {
    console.log('📤 NFT offer submitted:', offerData)
    // The offer will be handled by WebSocket response
  }

  // NEW: Handle NFT offer acceptance
  const handleOfferAccepted = async (offer) => {
    try {
      showInfo('Accepting NFT challenge...')
      
      // Update database to record the accepted offer
      const response = await fetch(`${API_URL}/api/games/${gameId}/accept-nft-offer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creatorAddress: address,
          acceptedOffer: offer
        })
      })

      if (!response.ok) {
        throw new Error('Failed to accept offer')
      }

      showSuccess(`Challenge accepted! Waiting for ${offer.offererAddress.slice(0, 6)}... to pay.`)
      setAcceptedOffer(offer)
      
    } catch (error) {
      console.error('❌ Error accepting offer:', error)
      showError('Failed to accept offer: ' + error.message)
    }
  }

  // Add new useEffect for NFT vs NFT game detection
  useEffect(() => {
    if (gameData?.gameType === 'nft-vs-nft') {
      console.log('🎮 NFT vs NFT game detected')
      // If player is not creator and no offer exists, show offer button
      if (!isCreator && !offeredNFTs?.length) {
        setShowNFTOfferModal(true)
      }
    }
  }, [gameData, isCreator, offeredNFTs])

  // Add new handler for NFT offer submission
  const handleNFTOffer = async (selectedNFT) => {
    if (!connected || !selectedNFT) return
    
    try {
      const offerData = {
        type: 'nft_offer',
        gameId: gameId,
        offererAddress: address,
        nft: {
          contractAddress: selectedNFT.contractAddress,
          tokenId: selectedNFT.tokenId,
          name: selectedNFT.name,
          image: selectedNFT.image,
          collection: selectedNFT.collection,
          chain: selectedNFT.chain
        }
      }
      
      socket.send(JSON.stringify(offerData))
      setShowNFTOfferModal(false)
      setOfferStatus('pending')
      
      showInfo('NFT offer submitted successfully! Waiting for creator to review your offer...')
    } catch (error) {
      console.error('Error submitting NFT offer:', error)
      showError('Failed to submit NFT offer. Please try again.')
    }
  }

  // Add new handler for offer acceptance/rejection
  const handleOfferResponse = async (accepted) => {
    if (!isCreator || !pendingNFTOffer) return
    
    try {
      const responseData = {
        type: accepted ? 'accept_nft_offer' : 'reject_nft_offer',
        gameId: gameId,
        creatorAddress: address,
        offer: pendingNFTOffer
      }
      
      socket.send(JSON.stringify(responseData))
      setShowOfferReviewModal(false)
      
      if (accepted) {
        showInfo('Offer accepted! Waiting for challenger to join the game...')
      } else {
        showInfo('Offer rejected. The NFT offer has been rejected.')
      }
    } catch (error) {
      console.error('Error responding to offer:', error)
      showError('Failed to process offer response. Please try again.')
    }
  }

  const renderNFTOfferModal = () => {
    if (!showNFTOfferModal) return null

    return (
      <Modal>
        <ModalContent>
          <CloseButton onClick={() => setShowNFTOfferModal(false)}>×</CloseButton>
          <ModalHeader>
            <NeonText>NFT Offer</NeonText>
          </ModalHeader>
          <ModalBody>
            <NFTOfferComponent
              gameId={gameId}
              onOfferAccepted={handleNFTOfferAccepted}
              onOfferRejected={handleNFTOfferRejected}
            />
          </ModalBody>
        </ModalContent>
      </Modal>
    )
  }

  const renderNFTVerificationModal = () => {
    if (!showNFTVerificationModal) return null

    return (
      <Modal>
        <ModalContent>
          <CloseButton onClick={() => setShowNFTVerificationModal(false)}>×</CloseButton>
          <ModalHeader>
            <NeonText>NFT Verification</NeonText>
          </ModalHeader>
          <ModalBody>
            <NFTVerificationDisplay
              nft={selectedNFT}
              onVerificationComplete={handleNFTVerificationComplete}
            />
          </ModalBody>
        </ModalContent>
      </Modal>
    )
  }

  const renderNFTDetailsModal = () => {
    if (!showNFTDetailsModal || !selectedNFT) return null

    return (
      <Modal>
        <ModalContent>
          <CloseButton onClick={() => setShowNFTDetailsModal(false)}>×</CloseButton>
          <ModalHeader>
            <NeonText>NFT Details</NeonText>
          </ModalHeader>
          <ModalBody>
            <NFTImage src={selectedNFT.image} alt={selectedNFT.name} />
            <div>
              <h3>{selectedNFT.name}</h3>
              <p>Collection: {selectedNFT.collection}</p>
              <p>Token ID: {selectedNFT.tokenId}</p>
              <NFTLink href={selectedNFT.openseaUrl} target="_blank" rel="noopener noreferrer">
                View on OpenSea
              </NFTLink>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button onClick={() => setShowNFTDetailsModal(false)}>Close</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    )
  }

  const renderOfferReviewModal = () => {
    if (!showOfferReviewModal || !nftOffer) return null

    return (
      <Modal>
        <ModalContent>
          <CloseButton onClick={() => setShowOfferReviewModal(false)}>×</CloseButton>
          <ModalHeader>
            <NeonText>Review NFT Offer</NeonText>
          </ModalHeader>
          <ModalBody>
            <div>
              <h3>NFT Details</h3>
              <NFTImage src={nftOffer.image} alt={nftOffer.name} />
              <p>Name: {nftOffer.name}</p>
              <p>Collection: {nftOffer.collection}</p>
              <p>Token ID: {nftOffer.tokenId}</p>
              <NFTLink href={nftOffer.openseaUrl} target="_blank" rel="noopener noreferrer">
                View on OpenSea
              </NFTLink>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button onClick={() => {
              handleNFTOfferAccepted(nftOffer)
              setShowOfferReviewModal(false)
            }}>
              Accept Offer
            </Button>
            <Button onClick={() => {
              handleNFTOfferRejected()
              setShowOfferReviewModal(false)
            }}>
              Reject Offer
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    )
  }

  if (!isConnected) {
    return (
      <ThemeProvider theme={theme}>
        <Container>
          <ContentWrapper>
            <GlassCard style={{ textAlign: 'center', padding: '3rem' }}>
              <NeonText>Connect Your Wallet</NeonText>
              <Button onClick={() => navigate('/')}>Go Home</Button>
            </GlassCard>
          </ContentWrapper>
        </Container>
      </ThemeProvider>
    )
  }

  if (loading) {
    return (
      <ThemeProvider theme={theme}>
        <Container>
          <ContentWrapper>
            <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
              <LoadingSpinner />
            </div>
          </ContentWrapper>
        </Container>
      </ThemeProvider>
    )
  }

  const canJoin = gameData && 
                  !gameData.joiner && 
                  gameData.creator !== address && 
                  gameData.status === 'waiting' &&
                  isConnected

  return (
    <ThemeProvider theme={theme}>
      <BackgroundVideo autoPlay loop muted playsInline>
        <source src={hazeVideo} type="video/webm" />
      </BackgroundVideo>
      
      {/* Add the choice animation component */}
      {showChoiceAnimation && (
        <ChoiceAnimation color={choiceAnimationColor}>
          {choiceAnimationText}
        </ChoiceAnimation>
      )}

      <Container style={{ 
        position: 'relative', 
        minHeight: '100vh',
        background: 'transparent !important',
        zIndex: 1
      }}>
        <ContentWrapper>
          {/* Main Game Area - Three Column Layout */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '300px 1fr 300px', // Fixed widths for player cards
            gap: '2rem', 
            marginBottom: '2rem',
            alignItems: 'start', // Align to top
            minHeight: '500px'
          }}>
            
            {/* Player 1 Box */}
            <div style={{
              position: 'relative',
              width: '100%',
              maxWidth: '600px',
              margin: '0 auto',
              padding: '2rem',
              background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.1) 0%, rgba(0, 0, 0, 0.3) 100%)',
              border: '2px solid rgba(255, 215, 0, 0.3)',
              borderRadius: '1.5rem',
              backdropFilter: 'blur(10px)'
            }}>
              {/* NFT Image - Small in bottom right */}
              {nftData?.image && (
                <div style={{
                  position: 'absolute',
                  bottom: '1rem',
                  right: '1rem',
                  width: '60px',
                  height: '60px',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  border: '2px solid rgba(255, 215, 0, 0.3)',
                  boxShadow: '0 0 10px rgba(255, 215, 0, 0.2)'
                }}>
                  <img 
                    src={nftData.image} 
                    alt="NFT" 
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />
                </div>
              )}
              
              {/* Compact Header */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '1rem'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <ProfilePicture address={gameData?.creator} size={32} />
                  <div>
                    <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>Player 1</div>
                    <div style={{ fontWeight: 'bold' }}>
                      {gameData?.creator?.slice(0, 6)}...{gameData?.creator?.slice(-4)}
                    </div>
                  </div>
                </div>
                {isCreator && (
                  <div style={{
                    background: theme.colors.neonPink,
                    color: '#000',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '0.25rem',
                    fontSize: '0.8rem',
                    fontWeight: 'bold'
                  }}>
                    YOU
                  </div>
                )}
              </div>

              {/* Round Indicators for Player 1 */}
              <GoldGameInstructions
                isPlayerTurn={isMyTurn}
                gamePhase={gameState?.phase === 'round_active' ? 
                  (gameState?.creatorChoice ? `SIDE\n${gameState.creatorChoice.toUpperCase()}` : 'round_active') : 
                  gameState?.phase}
                isPlayer={isPlayer}
                playerNumber={1}
                spectatorMode={!isPlayer}
                currentPower={gameState?.chargingPlayer === address ? 
                  (gameState?.currentPlayer === gameState?.creator ? gameState?.creatorPower : gameState?.joinerPower) : 0
                }
                currentRound={gameState?.currentRound}
                maxRounds={gameState?.maxRounds}
                creatorWins={gameState?.creatorWins}
                joinerWins={gameState?.joinerWins}
                nftData={nftData}
                chainConfig={{
                  name: nftData?.chain || 'Ethereum',
                  explorerUrl: getExplorerUrl(nftData?.chain),
                  marketplaceUrl: getMarketplaceUrl(nftData?.chain)
                }}
              />

              {/* NFT Verification Display - Always show */}
              <div className="nft-verification-container">
                {isLoadingNFT ? (
                  <div className="loading-spinner">Loading NFT data...</div>
                ) : (
                  <NFTVerificationDisplay
                    nftData={nftData}
                    chainConfig={{
                      name: nftData?.chain || 'Ethereum',
                      explorerUrl: getExplorerUrl(nftData?.chain),
                      marketplaceUrl: getMarketplaceUrl(nftData?.chain)
                    }}
                  />
                )}
              </div>
            </div>

            {/* Center - Coin and Power Area */}
            <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              {/* Coin */}
              <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center',
                marginBottom: '2rem'
              }}>
                <ReliableGoldCoin
                  isFlipping={!!flipAnimation}
                  flipResult={flipAnimation?.result}
                  flipDuration={flipAnimation?.duration}
                  onPowerCharge={handlePowerChargeStart}
                  onPowerRelease={handlePowerChargeStop}
                  isPlayerTurn={isMyTurn && gameState?.phase === 'round_active'}
                  isCharging={gameState?.chargingPlayer === address}
                  chargingPlayer={gameState?.chargingPlayer}
                  gamePhase={gameState?.phase}
                  creatorPower={gameState?.creatorPower || 0}
                  joinerPower={gameState?.joinerPower || 0}
                  creatorChoice={gameState?.creatorChoice}
                  joinerChoice={gameState?.joinerChoice}
                  isCreator={isCreator}
                />
              </div>

              {/* Power Display with Choice Buttons */}
              <PowerDisplay
                creatorPower={gameState?.creatorPower || 0}
                joinerPower={gameState?.joinerPower || 0}
                currentPlayer={gameState?.currentPlayer}
                creator={gameState?.creator}
                joiner={gameState?.joiner}
                chargingPlayer={gameState?.chargingPlayer}
                gamePhase={gameState?.phase}
                isMyTurn={isMyTurn}
                playerChoice={isCreator ? gameState?.creatorChoice : gameState?.joinerChoice}
                onPlayerChoice={handlePlayerChoice}
              />

              {/* Game Chat Box */}
              <div style={{ marginTop: '2rem' }}>
                <GameChatBox 
                  gameId={gameId}
                  socket={socket}
                  connected={connected}
                />
              </div>
            </div>

            {/* Player 2 Box */}
            <div style={{
              position: 'relative',
              width: '100%',
              maxWidth: '600px',
              margin: '0 auto',
              padding: '2rem',
              background: 'linear-gradient(135deg, rgba(0, 191, 255, 0.1) 0%, rgba(0, 0, 0, 0.3) 100%)',
              border: '2px solid rgba(0, 191, 255, 0.3)',
              borderRadius: '1.5rem',
              backdropFilter: 'blur(10px)'
            }}>
              {/* Compact Header */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '1rem'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <ProfilePicture address={gameData?.joiner} size={32} />
                  <div>
                    <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>Player 2</div>
                    <div style={{ fontWeight: 'bold' }}>
                      {gameData?.joiner ? `${gameData.joiner.slice(0, 6)}...${gameData.joiner.slice(-4)}` : 'Waiting...'}
                    </div>
                  </div>
                </div>
                {isJoiner && (
                  <div style={{
                    background: theme.colors.neonBlue,
                    color: '#000',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '0.25rem',
                    fontSize: '0.8rem',
                    fontWeight: 'bold'
                  }}>
                    YOU
                  </div>
                )}
              </div>

              {/* Join Game Button - Only show if game is waiting and user is not creator */}
              {gameData?.status === 'waiting' && !isCreator && !isJoiner && (
                <div style={{
                  marginTop: '1rem',
                  textAlign: 'center'
                }}>
                  <button
                    onClick={handleJoinGame}
                    style={{
                      background: '#FF1493',
                      color: '#fff',
                      border: 'none',
                      padding: '1rem 2rem',
                      borderRadius: '0.5rem',
                      fontSize: '1.2rem',
                      cursor: 'pointer',
                      width: '100%',
                      marginTop: '1rem',
                      position: 'relative',
                      overflow: 'hidden',
                      animation: 'pulse 2s infinite',
                      boxShadow: '0 0 20px rgba(255, 20, 147, 0.4)',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.transform = 'scale(1.05)';
                      e.currentTarget.style.boxShadow = '0 0 30px rgba(255, 20, 147, 0.6)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                      e.currentTarget.style.boxShadow = '0 0 20px rgba(255, 20, 147, 0.4)';
                    }}
                  >
                    <style>
                      {`
                        @keyframes pulse {
                          0% {
                            transform: scale(1);
                            box-shadow: 0 0 20px rgba(255, 20, 147, 0.4);
                          }
                          50% {
                            transform: scale(1.05);
                            box-shadow: 0 0 40px rgba(255, 20, 147, 0.6);
                          }
                          100% {
                            transform: scale(1);
                            box-shadow: 0 0 20px rgba(255, 20, 147, 0.4);
                          }
                        }
                        @keyframes shimmer {
                          0% {
                            background-position: -200% center;
                          }
                          100% {
                            background-position: 200% center;
                          }
                        }
                      `}
                    </style>
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent)',
                      backgroundSize: '200% 100%',
                      animation: 'shimmer 3s infinite linear',
                      pointerEvents: 'none'
                    }} />
                    Join Flip
                  </button>
                </div>
              )}

              {/* Round Indicators for Player 2 */}
              <GoldGameInstructions
                isPlayerTurn={isMyTurn}
                gamePhase={gameState?.phase === 'round_active' ? 
                  (gameState?.creatorChoice ? `SIDE\n${gameState.creatorChoice === 'heads' ? 'TAILS' : 'HEADS'}` : 'round_active') : 
                  gameState?.phase}
                isPlayer={isPlayer}
                playerNumber={2}
                spectatorMode={!isPlayer}
                currentPower={gameState?.chargingPlayer === address ? 
                  (gameState?.currentPlayer === gameState?.creator ? gameState?.creatorPower : gameState?.joinerPower) : 0
                }
                currentRound={gameState?.currentRound}
                maxRounds={gameState?.maxRounds}
                creatorWins={gameState?.creatorWins}
                joinerWins={gameState?.joinerWins}
                nftData={null}
                chainConfig={null}
              />

              {/* NEW: Game Info Section */}
              <div style={{
                marginTop: '1.5rem',
                textAlign: 'center',
                padding: '1rem',
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '0.75rem',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                <div style={{
                  color: '#FFD700',
                  fontSize: '1.2rem',
                  fontWeight: 'bold',
                  marginBottom: '0.5rem',
                  textShadow: '0 0 10px rgba(255, 215, 0, 0.5)'
                }}>
                  FLIP#{gameId.slice(-6).toUpperCase()}
                </div>
                <div style={{ 
                  color: theme.colors.textSecondary,
                  fontSize: '0.9rem'
                }}>
                  Best of {gameData?.rounds} • ${gameData?.priceUSD?.toFixed(2)}
                  {gameState && <span> • {gameState.spectators} watching</span>}
                </div>
              </div>

              {/* NEW: Share Buttons */}
              <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                <div style={{ 
                  fontSize: '0.8rem', 
                  opacity: 0.8, 
                  marginBottom: '0.5rem',
                  color: theme.colors.textSecondary
                }}>
                  Share
                </div>
                <div style={{ 
                  display: 'flex', 
                  gap: '0.5rem', 
                  justifyContent: 'center'
                }}>
                  <button
                    onClick={() => handleShare('x')}
                    style={{
                      background: 'linear-gradient(135deg, #000000 0%, #1a1a1a 100%)',
                      color: '#fff',
                      border: '1px solid #333',
                      width: '32px',
                      height: '32px',
                      borderRadius: '0.5rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.transform = 'scale(1.05)';
                      e.currentTarget.style.boxShadow = '0 0 10px rgba(0, 0, 0, 0.5)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <span style={{ fontSize: '1.2rem' }}>𝕏</span>
                  </button>

                  <button
                    onClick={() => handleShare('telegram')}
                    style={{
                      background: 'linear-gradient(135deg, #0088cc 0%, #006699 100%)',
                      color: '#fff',
                      border: '1px solid #006699',
                      width: '32px',
                      height: '32px',
                      borderRadius: '0.5rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.transform = 'scale(1.05)';
                      e.currentTarget.style.boxShadow = '0 0 10px rgba(0, 136, 204, 0.5)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <span style={{ fontSize: '1.2rem' }}>✈️</span>
                  </button>

                  <button
                    onClick={() => handleShare('copy')}
                    style={{
                      background: 'linear-gradient(135deg, #2c2c2c 0%, #1a1a1a 100%)',
                      color: '#fff',
                      border: '1px solid #333',
                      width: '32px',
                      height: '32px',
                      borderRadius: '0.5rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.transform = 'scale(1.05)';
                      e.currentTarget.style.boxShadow = '0 0 10px rgba(0, 0, 0, 0.5)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <span style={{ fontSize: '1.2rem' }}>🔗</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* NFT vs NFT Offer Component */}
          {isNFTGame && gameState?.phase === 'waiting' && (
            <div style={{ gridColumn: '1 / -1', marginTop: '2rem' }}>
              <NFTOfferComponent
                gameId={gameId}
                gameData={gameData}
                isCreator={isCreator}
                socket={socket}
                connected={connected}
                offeredNFTs={offeredNFTs}
                onOfferSubmitted={handleOfferSubmitted}
                onOfferAccepted={handleOfferAccepted}
              />
            </div>
          )}

          {/* Show accepted offer status */}
          {isNFTGame && acceptedOffer && gameState?.phase === 'waiting' && (
            <div style={{
              gridColumn: '1 / -1',
              marginTop: '1rem',
              textAlign: 'center',
              padding: '1rem',
              background: 'rgba(255, 215, 0, 0.1)',
              border: '1px solid rgba(255, 215, 0, 0.3)',
              borderRadius: '1rem'
            }}>
              <h3 style={{ color: '#FFD700', marginBottom: '0.5rem' }}>
                ⚔️ BATTLE ACCEPTED!
              </h3>
              <p style={{ color: 'white', margin: 0 }}>
                Waiting for {acceptedOffer.offererAddress.slice(0, 6)}...{acceptedOffer.offererAddress.slice(-4)} to complete payment...
              </p>
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '2rem',
                marginTop: '1rem',
                alignItems: 'center'
              }}>
                <div style={{ textAlign: 'center' }}>
                  <img
                    src={gameData.nft.image}
                    alt={gameData.nft.name}
                    style={{
                      width: '80px',
                      height: '80px',
                      borderRadius: '0.5rem',
                      objectFit: 'cover',
                      marginBottom: '0.5rem'
                    }}
                  />
                  <div style={{ fontSize: '0.8rem', color: 'white' }}>
                    {gameData.nft.name}
                  </div>
                </div>
                
                <div style={{
                  fontSize: '2rem',
                  color: '#FFD700',
                  animation: 'pulse 2s infinite'
                }}>
                  ⚔️
                </div>
                
                <div style={{ textAlign: 'center' }}>
                  <img
                    src={acceptedOffer.nft.image}
                    alt={acceptedOffer.nft.name}
                    style={{
                      width: '80px',
                      height: '80px',
                      borderRadius: '0.5rem',
                      objectFit: 'cover',
                      marginBottom: '0.5rem'
                    }}
                  />
                  <div style={{ fontSize: '0.8rem', color: 'white' }}>
                    {acceptedOffer.nft.name}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Spectator Mode Message */}
          {!isPlayer && (
            <div style={{
              marginTop: '2rem',
              textAlign: 'center',
              padding: '1rem',
              background: 'rgba(255, 215, 0, 0.1)',
              border: '1px solid rgba(255, 215, 0, 0.3)',
              borderRadius: '1rem'
            }}>
              <p style={{ color: '#FFD700', fontWeight: 'bold', margin: 0 }}>
                👀 SPECTATING
              </p>
            </div>
          )}

          {/* Game Status */}
          {gameState?.phase === 'choosing' && (
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              {isMyTurn ? (
                <div style={{
                  padding: '1rem',
                  background: 'rgba(255, 215, 0, 0.1)',
                  border: '1px solid rgba(255, 215, 0, 0.3)',
                  borderRadius: '1rem'
                }}>
                  <div style={{ color: theme.colors.textSecondary, marginTop: '0.5rem' }}>
                    Select heads or tails in your player box, then you can charge power and flip!
                  </div>
                </div>
              ) : (
                <div style={{
                  padding: '1rem',
                  background: 'rgba(255, 165, 0, 0.1)',
                  border: '1px solid rgba(255, 165, 0, 0.3)',
                  borderRadius: '1rem'
                }}>
                  <div style={{ color: theme.colors.statusWarning, fontWeight: 'bold', fontSize: '1.2rem' }}>
                    ⏳ Opponent is Choosing
                  </div>
                  <div style={{ color: theme.colors.textSecondary, marginTop: '0.5rem' }}>
                    Waiting for {!isCreator ? 'Player 1' : 'Player 2'} to choose heads or tails
                  </div>
                </div>
              )}
            </div>
          )}

          {gameState?.phase === 'round_active' && (
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              {isMyTurn ? (
                <div style={{
                  padding: '1rem',
                  background: 'rgba(0, 255, 65, 0.1)',
                  border: '1px solid rgba(0, 255, 65, 0.3)',
                  borderRadius: '1rem'
                }}>
                  <div style={{ color: theme.colors.statusSuccess, fontWeight: 'bold', fontSize: '1.2rem' }}>
                    ⚡ YOUR TURN TO FLIP!
                  </div>
                  <div style={{ color: theme.colors.textSecondary, marginTop: '0.5rem' }}>
                    You chose {isCreator ? gameState.creatorChoice?.toUpperCase() : gameState.joinerChoice?.toUpperCase()} - Hold coin to charge power, release to flip!
                  </div>
                </div>
              ) : (
                <div style={{
                  padding: '1rem',
                  background: 'rgba(255, 165, 0, 0.1)',
                  border: '1px solid rgba(255, 165, 0, 0.3)',
                  borderRadius: '1rem'
                }}>
                  <div style={{ color: theme.colors.statusWarning, fontWeight: 'bold', fontSize: '1.2rem' }}>
                    ⏳ Opponent's Turn
                  </div>
                  <div style={{ color: theme.colors.textSecondary, marginTop: '0.5rem' }}>
                    They chose {!isCreator ? gameState.creatorChoice?.toUpperCase() : gameState.joinerChoice?.toUpperCase()} and are charging power to flip
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Round Result Display */}
          {roundResult && (
            <div style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 1000,
              background: 'rgba(0, 0, 0, 0.9)',
              padding: '2rem',
              borderRadius: '2rem',
              border: `4px solid ${roundResult.actualWinner === address ? '#00FF41' : '#FF1493'}`,
              textAlign: 'center',
              width: '80%',
              maxWidth: '600px'
            }}>
              <video
                autoPlay
                loop
                muted
                style={{
                  width: '100%',
                  borderRadius: '1rem',
                  marginBottom: '1rem'
                }}
                src={roundResult.actualWinner === address ? 
                  '/images/video/LoseWin/final lose win/win.webm' : 
                  '/images/video/LoseWin/final lose win/lose.webm'
                }
              />
              <div style={{
                fontSize: '1.5rem',
                color: 'white',
                fontWeight: 'bold',
                marginTop: '1rem'
              }}>
                Coin: {roundResult.result.toUpperCase()}
              </div>
              <div style={{
                fontSize: '1.2rem',
                color: 'rgba(255, 255, 255, 0.8)',
                marginTop: '0.5rem'
              }}>
                You are: {isCreator ? 'HEADS 👑' : 'TAILS 💎'}
              </div>
            </div>
          )}

          {/* NEW: Popup Result Display - Only for game completion */}
          <GameResultPopup
            isVisible={showResultPopup && gameState?.phase === 'game_complete'}
            isWinner={popupData?.isWinner || false}
            flipResult={popupData?.flipResult}
            playerChoice={popupData?.playerChoice}
            gameData={popupData?.gameData}
            onClose={() => setShowResultPopup(false)}
            onClaimWinnings={handleClaimWinnings}
          />

          {/* Winner Screen */}
          {gameState?.winner && (
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.9)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              padding: '2rem',
              backdropFilter: 'blur(10px)'
            }}>
              <div style={{
                background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(25, 20, 0, 0.9) 100%)',
                border: '2px solid #FFD700',
                borderRadius: '1rem',
                padding: '2rem',
                textAlign: 'center',
                maxWidth: '500px',
                width: '100%',
                boxShadow: '0 0 30px rgba(255, 215, 0, 0.3)'
              }}>
                <h2 style={{ color: '#FFD700', marginBottom: '1rem' }}>🎉 You Won! 🎉</h2>
                <p style={{ color: '#fff', marginBottom: '2rem' }}>
                  Congratulations! You've won {gameState?.potAmount || 0} {gameState?.currency || 'ETH'}
                </p>
                <button
                  onClick={handleClaimWinnings}
                  style={{
                    background: 'linear-gradient(135deg, #FF69B4 0%, #FF1493 100%)',
                    color: '#fff',
                    border: 'none',
                    padding: '1rem 2rem',
                    borderRadius: '0.5rem',
                    fontSize: '1.2rem',
                    cursor: 'pointer',
                    width: '100%',
                    marginBottom: '1rem',
                    boxShadow: '0 0 20px rgba(255, 105, 180, 0.4)',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'scale(1.05)';
                    e.currentTarget.style.boxShadow = '0 0 30px rgba(255, 105, 180, 0.6)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow = '0 0 20px rgba(255, 105, 180, 0.4)';
                  }}
                >
                  💰 Claim Your Winnings
                </button>
                <p style={{ 
                  color: '#ff4444', 
                  fontSize: '0.9rem', 
                  marginTop: '1rem',
                  border: '1px solid rgba(255, 68, 68, 0.3)',
                  padding: '0.5rem',
                  borderRadius: '0.5rem',
                  background: 'rgba(255, 68, 68, 0.1)'
                }}>
                  ⚠️ Warning: If you leave this screen without claiming, you will lose your winnings.
                </p>
              </div>
            </div>
          )}

          {/* Show NFT offer button for non-creators in NFT vs NFT games */}
          {gameData?.gameType === 'nft-vs-nft' && !isCreator && !offeredNFTs?.length && (
            <Button
              colorScheme="green"
              size="lg"
              onClick={() => setShowNFTOfferModal(true)}
              mb={4}
            >
              Offer NFT to Battle
            </Button>
          )}
          
          {/* Show offer status for challengers */}
          {gameData?.gameType === 'nft-vs-nft' && !isCreator && offerStatus === 'pending' && (
            <Text color="neonYellow" mb={4}>
              Your NFT offer is pending review...
            </Text>
          )}
          
          {/* Show join button after offer is accepted */}
          {gameData?.gameType === 'nft-vs-nft' && !isCreator && offerStatus === 'accepted' && (
            <Button
              colorScheme="green"
              size="lg"
              onClick={handleJoinGame}
              mb={4}
            >
              Join Battle
            </Button>
          )}
        </ContentWrapper>
      </Container>
      <style>
        {`
          @keyframes buttonPulse {
            0% {
              box-shadow: 0 0 15px rgba(255, 215, 0, 0.3);
            }
            50% {
              box-shadow: 0 0 25px rgba(255, 215, 0, 0.6);
            }
            100% {
              box-shadow: 0 0 15px rgba(255, 215, 0, 0.3);
            }
          }
        `}
      </style>
      
      {/* Add new modals */}
      {renderNFTOfferModal()}
      {renderNFTVerificationModal()}
      {renderNFTDetailsModal()}
      {renderOfferReviewModal()}
    </ThemeProvider>
  )
}

// Add helper functions for chain URLs
const getExplorerUrl = (chain) => {
  if (!chain) return 'https://etherscan.io' // Default to Ethereum explorer
  
  const explorers = {
    ethereum: 'https://etherscan.io',
    polygon: 'https://polygonscan.com',
    base: 'https://basescan.org',
    arbitrum: 'https://arbiscan.io',
    optimism: 'https://optimistic.etherscan.io',
    // Add more chains as needed
  }
  return explorers[chain.toLowerCase()] || 'https://etherscan.io'
}

const getMarketplaceUrl = (chain) => {
  if (!chain) return 'https://opensea.io/assets/ethereum' // Default to Ethereum marketplace
  
  const marketplaces = {
    ethereum: 'https://opensea.io/assets/ethereum',
    polygon: 'https://opensea.io/assets/matic',
    base: 'https://opensea.io/assets/base',
    arbitrum: 'https://opensea.io/assets/arbitrum',
    optimism: 'https://opensea.io/assets/optimism',
    // Add more chains as needed
  }
  return marketplaces[chain.toLowerCase()] || 'https://opensea.io/assets/ethereum'
}

// Add the missing fetchNFTData function
const fetchNFTData = async (gameId) => {
  try {
    setIsLoadingNFT(true)
    console.log('🎨 Fetching NFT data for game:', gameId)
    const response = await fetch(`${API_URL}/api/games/${gameId}/nft`)
    if (!response.ok) throw new Error('Failed to fetch NFT data')
    const data = await response.json()
    console.log('✅ NFT data received:', data)
    setNftData(data)
  } catch (error) {
    console.error('❌ Error fetching NFT data:', error)
    setNftData(null)
  } finally {
    setIsLoadingNFT(false)
  }
}

export default FlipGame