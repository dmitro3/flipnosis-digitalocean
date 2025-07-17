import React, { useState, useEffect } from 'react'
import styled from '@emotion/styled'
import { useWallet } from '../contexts/WalletContext'
import { useWalletConnection } from '../utils/useWalletConnection'
import { useToast } from '../contexts/ToastContext'
import contractService from '../services/ContractService'
import { Button, LoadingSpinner } from '../styles/components'
import { API_CONFIG } from '../config/api'

const Modal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  backdrop-filter: blur(10px);
`

const ModalContent = styled.div`
  background: rgba(0, 0, 20, 0.95);
  border: 2px solid ${props => props.theme.colors.neonPink};
  border-radius: 1.5rem;
  width: 90%;
  max-width: 800px;
  padding: 2rem;
  position: relative;
  box-shadow: 0 0 30px rgba(255, 20, 147, 0.3);
`

const Header = styled.div`
  text-align: center;
  margin-bottom: 2rem;
  
  h2 {
    color: ${props => props.theme.colors.neonYellow};
    font-size: 2rem;
    margin: 0 0 0.5rem 0;
    text-shadow: 0 0 20px rgba(255, 255, 0, 0.5);
  }
  
  p {
    color: ${props => props.theme.colors.textSecondary};
    font-size: 1rem;
  }
`

const ContentGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 2px 1fr;
  gap: 2rem;
  align-items: stretch;
  margin-bottom: 2rem;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
`

const Divider = styled.div`
  width: 2px;
  background: linear-gradient(to bottom, transparent, ${props => props.theme.colors.neonPink}, transparent);
  
  @media (max-width: 768px) {
    display: none;
  }
`

const AssetSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
`

const PlayerInfo = styled.div`
  text-align: center;
  
  h3 {
    color: ${props => props.theme.colors.neonBlue};
    margin: 0 0 0.5rem 0;
  }
  
  p {
    color: ${props => props.theme.colors.textSecondary};
    font-size: 0.9rem;
  }
`

const NFTImageContainer = styled.div`
  width: 200px;
  height: 200px;
  border-radius: 1rem;
  overflow: hidden;
  border: 2px solid ${props => props.isLoaded ? props.theme.colors.neonGreen : props.theme.colors.neonBlue};
  position: relative;
  box-shadow: 0 0 20px ${props => props.isLoaded ? 'rgba(0, 255, 65, 0.3)' : 'rgba(0, 191, 255, 0.3)'};
  transition: all 0.3s ease;
`

const NFTImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`

const CryptoContainer = styled.div`
  width: 200px;
  height: 200px;
  border-radius: 1rem;
  border: 2px solid ${props => props.isLoaded ? props.theme.colors.neonGreen : props.theme.colors.neonBlue};
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.05);
  position: relative;
  box-shadow: 0 0 20px ${props => props.isLoaded ? 'rgba(0, 255, 65, 0.3)' : 'rgba(0, 191, 255, 0.3)'};
  transition: all 0.3s ease;
`

const CryptoAmount = styled.div`
  font-size: 2.5rem;
  font-weight: bold;
  color: ${props => props.theme.colors.neonGreen};
  margin-bottom: 0.5rem;
`

const CryptoCurrency = styled.div`
  font-size: 1.2rem;
  color: ${props => props.theme.colors.textSecondary};
`

const StatusText = styled.div`
  color: ${props => props.isLoaded ? props.theme.colors.neonGreen : props.theme.colors.textSecondary};
  font-weight: ${props => props.isLoaded ? 'bold' : 'normal'};
  transition: all 0.3s ease;
`

const ActionButton = styled(Button)`
  &.load {
    background: ${props => props.theme.colors.neonBlue};
    
    &:hover {
      background: ${props => props.theme.colors.neonPurple};
    }
  }
  
  &.cancel {
    background: rgba(255, 0, 0, 0.2);
    border: 1px solid red;
    margin-top: 1rem;
    
    &:hover {
      background: rgba(255, 0, 0, 0.3);
    }
  }
`

const LoadingOverlay = styled.div`
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 1rem;
`

const SuccessAnimation = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 4rem;
  animation: successPulse 0.5s ease-out;
  
  @keyframes successPulse {
    0% {
      transform: scale(0);
      opacity: 0;
    }
    50% {
      transform: scale(1.2);
    }
    100% {
      transform: scale(1);
      opacity: 1;
    }
  }
`

// Add this CSS animation at the top of the component
const pulseAnimation = `
  @keyframes pulse {
    0% {
      transform: scale(1);
      box-shadow: 0 4px 20px rgba(0, 255, 65, 0.5);
    }
    50% {
      transform: scale(1.02);
      box-shadow: 0 6px 30px rgba(0, 255, 65, 0.7);
    }
    100% {
      transform: scale(1);
      box-shadow: 0 4px 20px rgba(0, 255, 65, 0.5);
    }
  }
  
  @keyframes glow {
    0% {
      box-shadow: 0 0 5px rgba(0, 255, 65, 0.5);
    }
    50% {
      box-shadow: 0 0 20px rgba(0, 255, 65, 0.8), 0 0 30px rgba(0, 255, 65, 0.6);
    }
    100% {
      box-shadow: 0 0 5px rgba(0, 255, 65, 0.5);
    }
  }
`

const GameLobby = ({ 
  isOpen, 
  gameData, 
  onGameReady,
  isCreator,
  socket,
  player2HasPaid,
  gameReadyToStart
}) => {
  // CLAUDE OPUS PATCH: Normalize gameData props for consistent usage
  const normalizedData = {
    id: gameData?.id || gameData?.gameId,
    contract_game_id: gameData?.contract_game_id, // Make sure this is included
    creator: gameData?.creator,
    joiner: gameData?.joiner,
    nft_contract: gameData?.nft_contract || gameData?.nftContract,
    nft_token_id: gameData?.nft_token_id || gameData?.tokenId,
    nft_name: gameData?.nft_name || gameData?.nftName,
    nft_image: gameData?.nft_image || gameData?.nftImage,
    price_usd: gameData?.price_usd || gameData?.priceUSD || gameData?.amount,
    coin: gameData?.coin
  }
  
  // 1. At the top, determine if this is a game with NFT already loaded (game offer OR listing offer)
  const hasNFTLoaded = !!normalizedData.contract_game_id
  
  // Determine if this is a game created from an offer (has contract_game_id and NFT is already loaded)
  const isGameOffer = !!normalizedData.contract_game_id
  
  console.log('🎮 AssetLoadingModal - Normalized data:', {
    id: normalizedData.id,
    contract_game_id: normalizedData.contract_game_id,
    creator: normalizedData.creator,
    joiner: normalizedData.joiner,
    isCreator,
    hasNFTLoaded,
    isGameOffer
  })
  const { isConnected, address, walletClient, publicClient } = useWallet()
  const { isFullyConnected } = useWalletConnection()
  const { showSuccess, showError, showInfo } = useToast()
  
  const [nftLoaded, setNftLoaded] = useState(false)
  const [cryptoLoaded, setCryptoLoaded] = useState(false)
  const [loading, setLoading] = useState(false)
  const [gameReady, setGameReady] = useState(false)
  const [initializationAttempted, setInitializationAttempted] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(120) // 2 minutes
  const [timerStarted, setTimerStarted] = useState(false)

  // Initialize contract service when wallet is connected
  useEffect(() => {
    const initializeService = async () => {
      if (!isFullyConnected || !walletClient || !publicClient) {
        console.log('⚠️ Wallet not fully connected, skipping contract initialization')
        return
      }
      
      // Prevent repeated initialization attempts
      if (initializationAttempted) {
        console.log('⚠️ Contract initialization already attempted, skipping')
        return
      }
      
      // Check if already initialized to prevent repeated initialization
      if (contractService.isInitialized()) {
        console.log('✅ Contract service already initialized, skipping')
        return
      }
      
      setInitializationAttempted(true)
      
      try {
        console.log('🔧 Initializing contract service...')
        await contractService.initializeClients(8453, walletClient) // Base chain ID is 8453
        console.log('✅ Contract service initialized successfully')
      } catch (error) {
        console.error('❌ Failed to initialize contract service:', error)
        showError('Failed to initialize smart contract. Please refresh and try again.')
      }
    }

    initializeService()
  }, [isFullyConnected, walletClient, publicClient, showError, initializationAttempted])

  // When modal opens, check current game state and join game room
  useEffect(() => {
    if (isOpen && gameData) {
      console.log('🎮 AssetLoadingModal opened for game:', normalizedData.id)
      
      // Join the game room for WebSocket communication
      if (socket && socket.readyState === WebSocket.OPEN) {
        console.log('🎮 Joining game room:', normalizedData.id)
        console.log('🎮 WebSocket state:', socket.readyState)
        console.log('🎮 WebSocket URL:', socket.url)
        
        const joinMessage = {
          type: 'join_game',
          gameId: normalizedData.id,
          address: address || 'anonymous'
        }
        console.log('🎮 Sending join message:', joinMessage)
        socket.send(JSON.stringify(joinMessage))
      } else {
        console.warn('⚠️ WebSocket not available for game room joining')
        console.log('🎮 Socket available:', !!socket)
        console.log('🎮 Socket state:', socket?.readyState)
      }
      
      checkGameState()
    }
  }, [isOpen, gameData])

  // Listen for custom openAssetModal events as backup
  useEffect(() => {
    const handleOpenAssetModal = (event) => {
      console.log('🎮 AssetLoadingModal: Received openAssetModal event:', event.detail)
      // This is a backup - the modal should already be open via props
      // But we can use this to ensure the data is properly set
    }

    window.addEventListener('openAssetModal', handleOpenAssetModal)
    
    return () => {
      window.removeEventListener('openAssetModal', handleOpenAssetModal)
    }
  }, [])

  // Listen for game ready events to auto-close modal when game is ready
  useEffect(() => {
    console.log('🎮 AssetLoadingModal: Setting up game ready event listener')
    
    const handleGameReady = (event) => {
      console.log('🎮 AssetLoadingModal: Game ready event received:', event.detail)
      console.log('🎮 AssetLoadingModal: Normalized data ID:', normalizedData.id)
      console.log('🎮 AssetLoadingModal: Event type:', event.detail.type)
      
      // Auto-close modal when game is ready for both players
      if (event.detail.type === 'game_ready' || event.detail.type === 'player_joined' || event.detail.type === 'crypto_loaded') {
        console.log('🎮 AssetLoadingModal: Game ready message received, transporting players immediately')
        if (onGameReady) {
          console.log('🎮 AssetLoadingModal: Calling onGameReady with ID:', normalizedData.id)
          onGameReady(normalizedData.id)
        } else {
          console.log('⚠️ AssetLoadingModal: onGameReady is not available')
        }
      } else {
        console.log('⚠️ AssetLoadingModal: Event type not recognized:', event.detail.type)
      }
    }

    // Add event listener to window for game ready events
    window.addEventListener('gameReady', handleGameReady)
    console.log('🎮 AssetLoadingModal: Event listener added')
    
    return () => {
      window.removeEventListener('gameReady', handleGameReady)
      console.log('🎮 AssetLoadingModal: Event listener removed')
    }
  }, [onGameReady, normalizedData.id])

  // Add this useEffect to listen for closeAllModals event
  useEffect(() => {
    const handleCloseAllModals = () => {
      console.log('🎮 AssetLoadingModal: Received closeAllModals event')
      // Don't need to do anything here, the global handler will navigate
    }
    
    window.addEventListener('closeAllModals', handleCloseAllModals)
    
    return () => {
      window.removeEventListener('closeAllModals', handleCloseAllModals)
    }
  }, [])

  // Add this useEffect to listen for WebSocket messages (simplified - no crypto_loaded handling)
  useEffect(() => {
    const handleWebSocketMessage = (event) => {
      const data = event.detail
      
      // Handle both_assets_loaded message
      if (data.type === 'both_assets_loaded' && data.gameId === normalizedData.id) {
        console.log('🎮 Both assets loaded, transporting all players!')
        setGameReady(true)
        setCryptoLoaded(true)
        setNftLoaded(true)
        
        setTimeout(() => {
          if (onGameReady) {
            onGameReady(normalizedData.id)
          }
        }, 500)
      }
      
      // Handle NFT deposited message
      if (data.type === 'nft_deposited' && data.gameId === normalizedData.id) {
        console.log('🎮 NFT deposited, joiner can now deposit crypto!')
        setNftLoaded(true)
        
        // Update the normalized data with the contract game ID
        if (data.contractGameId) {
          normalizedData.contract_game_id = data.contractGameId
          console.log('✅ Updated contract game ID:', data.contractGameId)
        }
        
        showSuccess('NFT deposited! You can now deposit your crypto.')
      }
    }
    
    window.addEventListener('websocketMessage', handleWebSocketMessage)
    
    return () => {
      window.removeEventListener('websocketMessage', handleWebSocketMessage)
    }
  }, [onGameReady, normalizedData.id, showSuccess])

  // Add the style tag in a useEffect
  useEffect(() => {
    const style = document.createElement('style')
    style.textContent = pulseAnimation
    document.head.appendChild(style)
    
    return () => {
      document.head.removeChild(style)
    }
  }, [])

  // Timer effect for Player 2
  useEffect(() => {
    if (isOpen && !isCreator && !cryptoLoaded && !player2HasPaid) {
      setTimerStarted(true)
      const startTime = Date.now()
      
      const interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000)
        const remaining = Math.max(0, 120 - elapsed)
        setTimeRemaining(remaining)
        
        if (remaining === 0) {
          clearInterval(interval)
          showError('Time expired! Game has been cancelled.')
          setTimeout(() => {
            if (onGameReady) {
              onGameReady(null)
            }
          }, 3000)
        }
      }, 1000)
      
      return () => clearInterval(interval)
    }
  }, [isOpen, isCreator, cryptoLoaded, player2HasPaid, showError, onGameReady])

  // 2. Update checkGameState to handle game offers (around line 340)
  const checkGameState = async () => {
    const gameId = normalizedData.contract_game_id || normalizedData.id
    
    // For games with contract_game_id, the NFT is already loaded (game offers OR listing offers)
    if (hasNFTLoaded) {
      setNftLoaded(true)
      console.log('✅ Game has contract_game_id - NFT already loaded in contract')
      
      // Check if crypto is also loaded
      try {
        const contractGame = await contractService.getGameDetails(normalizedData.contract_game_id)
        if (contractGame.success && contractGame.game) {
          if (contractGame.game.state === 1) { // GameState.Joined
            setCryptoLoaded(true)
            console.log('✅ Crypto already loaded')
          }
        }
      } catch (error) {
        console.error('Error checking game state:', error)
      }
      return
    }
    
    // For new games created from listings, check normally
    if (!gameId || gameId === normalizedData.id) return
    
    try {
      const contractGame = await contractService.getGameDetails(gameId)
      
      if (contractGame.success && contractGame.game) {
        setNftLoaded(true)
        console.log('✅ NFT already loaded in contract')
        
        if (contractGame.game.state === 1) { // GameState.Joined
          setCryptoLoaded(true)
          console.log('✅ Crypto already loaded')
        }
      }
    } catch (error) {
      console.error('Error checking game state:', error)
    }
  }

  // 3. Update handleLoadCrypto to handle game offers (around line 460)
  const handleLoadCrypto = async () => {
    if (!isFullyConnected || !walletClient) {
      showError('Please connect your wallet')
      return
    }
    
    if (!contractService.isInitialized()) {
      showError('Smart contract not connected. Please refresh and try again.')
      return
    }
    
    setLoading(true)
    
    try {
      showInfo('Loading crypto into game...')
      
      // Use the existing contract game ID
      const gameId = normalizedData.contract_game_id
      
      // Get the offer price that was accepted
      const offerPriceUSD = normalizedData.price_usd || normalizedData.priceUSD
      console.log('🎮 AssetLoadingModal: handleLoadCrypto called for game:', gameId, 'with offer price:', offerPriceUSD)
      
      console.log('🎮 AssetLoadingModal: handleLoadCrypto called with data:', {
        gameId,
        hasNFTLoaded,
        normalizedData: {
          id: normalizedData.id,
          contract_game_id: normalizedData.contract_game_id,
          creator: normalizedData.creator,
          joiner: normalizedData.joiner
        }
      })
      
      if (!gameId) {
        console.error('❌ AssetLoadingModal: Missing contract_game_id for game:', normalizedData.id)
        showError('Invalid game configuration. Please refresh and try again.')
        return
      }
      
      console.log('✅ AssetLoadingModal: Joining existing blockchain game with custom price:', gameId)
      
      // Join the existing blockchain game with the accepted offer price
      const result = await contractService.joinExistingGameWithPrice(gameId, offerPriceUSD)
      
      console.log('🎮 AssetLoadingModal: joinGame result:', result)
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to join game')
      }
      
      setCryptoLoaded(true)
      showSuccess('Crypto loaded successfully! Game starting...')
      setGameReady(true)
      
      // After successful crypto deposit, send WebSocket message
      console.log('💰 Sending crypto_loaded message via WebSocket')
      
      if (socket && socket.readyState === WebSocket.OPEN) {
        const message = {
          type: 'crypto_loaded',
          gameId: normalizedData.id,
          contract_game_id: normalizedData.contract_game_id,
          joiner: address,
          message: 'Crypto loaded successfully!'
        }
        console.log('📡 Sending WebSocket message:', message)
        socket.send(JSON.stringify(message))
        
        // Also set local state
        setCryptoLoaded(true)
        showSuccess('Crypto deposited successfully!')
      } else {
        console.error('⚠️ WebSocket not available for crypto_loaded message')
        showError('Connection issue - please refresh and try again')
      }
      
      // Navigate to game
      setTimeout(() => {
        if (onGameReady) {
          console.log('🎮 Calling onGameReady to navigate to game')
          onGameReady(normalizedData.id || normalizedData.contract_game_id)
        } else {
          console.error('⚠️ onGameReady callback not provided!')
        }
      }, 1000)
      
    } catch (error) {
      console.error('❌ AssetLoadingModal: Error loading crypto:', error)
      showError(error.message || 'Failed to load crypto')
    } finally {
      setLoading(false)
    }
  }

  // 4. Remove handleDepositNFT function - it's not needed for game offers

  const handleCancel = async () => {
    // Only creator can cancel the game
    if (!isCreator) {
      showError('Only the game creator can cancel the game')
      return
    }
    
    // Handle both contract_game_id (from database) and gameId (from WebSocket)
    const gameId = normalizedData.contract_game_id || normalizedData.id
    if (!gameId) return
    
    try {
      setLoading(true)
      showInfo('Cancelling game...')
      
      const result = await contractService.cancelGame(gameId)
      
      if (result.success) {
        showSuccess('Game cancelled successfully')
        // Close modal and refresh
        if (onGameReady) {
          onGameReady(null)
        }
      } else {
        throw new Error(result.error || 'Failed to cancel game')
      }
    } catch (error) {
      console.error('Error cancelling game:', error)
      showError(error.message || 'Failed to cancel game')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <Modal>
      <ModalContent>
        <Header>
          <h2>🎮 Game Lobby</h2>
          <p>Waiting for players to load their assets...</p>
        </Header>

        <ContentGrid>
          {/* 5. Update the NFT section UI (around line 650) */}
          <AssetSection>
            <PlayerInfo>
              <h3>Player 1 (Creator)</h3>
              <p>{normalizedData.creator || 'Unknown'}</p>
            </PlayerInfo>
            
            <NFTImageContainer isLoaded={nftLoaded}>
              <NFTImage 
                src={normalizedData.nft_image || normalizedData.nftImage || '/placeholder-nft.svg'} 
                alt={normalizedData.nft_name || normalizedData.nftName || 'NFT'}
                onError={(e) => {
                  e.target.src = '/placeholder-nft.svg'
                }}
              />
              {nftLoaded && (
                <SuccessAnimation>
                  ✅
                </SuccessAnimation>
              )}
            </NFTImageContainer>
            
            <StatusText isLoaded={nftLoaded}>
              {nftLoaded ? '✅ NFT Already Loaded' : '⏳ Checking NFT status...'}
            </StatusText>
            
            {isGameOffer && (
              <div style={{ textAlign: 'center', color: '#00FF41', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                NFT was loaded when the game was created
              </div>
            )}
            
            {/* Join Game Button for Player 1 */}
            {isCreator && player2HasPaid && (
              <div style={{ 
                marginTop: '1rem', 
                padding: '1rem', 
                background: 'rgba(0, 255, 65, 0.1)',
                border: '2px solid rgba(0, 255, 65, 0.5)',
                borderRadius: '0.5rem',
                textAlign: 'center',
                animation: 'glow 2s ease-in-out infinite'
              }}>
                <p style={{ 
                  color: '#00FF41', 
                  marginBottom: '1rem', 
                  fontWeight: 'bold',
                  fontSize: '1.1rem'
                }}>
                  🎉 Player 2 has deposited crypto!
                </p>
                <button
                  onClick={() => {
                    console.log('🎮 Player 1 clicking Enter Game')
                    if (onGameReady) {
                      onGameReady(normalizedData.id)
                    }
                  }}
                  style={{
                    background: 'linear-gradient(45deg, #00FF41, #39FF14)',
                    color: '#000',
                    border: 'none',
                    padding: '1rem 3rem',
                    borderRadius: '0.5rem',
                    fontSize: '1.2rem',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    boxShadow: '0 4px 20px rgba(0, 255, 65, 0.5)',
                    transition: 'all 0.2s ease',
                    animation: 'pulse 2s infinite',
                    textTransform: 'uppercase',
                    letterSpacing: '1px'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'scale(1.05)'
                    e.target.style.boxShadow = '0 6px 30px rgba(0, 255, 65, 0.7)'
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'scale(1)'
                    e.target.style.boxShadow = '0 4px 20px rgba(0, 255, 65, 0.5)'
                  }}
                >
                  🚀 ENTER GAME NOW
                </button>
              </div>
            )}
          </AssetSection>

          <Divider />

          {/* 6. Update the Crypto section UI (around line 700) */}
          <AssetSection>
            <PlayerInfo>
              <h3>Player 2 (Joiner)</h3>
              <p>{isCreator ? 'Waiting for opponent...' : 'You'}</p>
            </PlayerInfo>
            
            {/* Timer for Player 2 */}
            {!isCreator && timerStarted && !cryptoLoaded && (
              <div style={{
                background: timeRemaining < 30 ? 'rgba(255, 68, 68, 0.1)' : 'rgba(0, 255, 65, 0.1)',
                border: `2px solid ${timeRemaining < 30 ? '#FF4444' : '#00FF41'}`,
                borderRadius: '10px',
                padding: '15px',
                marginBottom: '15px',
                textAlign: 'center'
              }}>
                <div style={{ 
                  fontSize: '1.5rem', 
                  fontWeight: 'bold',
                  color: timeRemaining < 30 ? '#FF4444' : '#00FF41'
                }}>
                  {Math.floor(timeRemaining / 60)}:{String(timeRemaining % 60).padStart(2, '0')}
                </div>
                <div style={{ 
                  color: 'rgba(255, 255, 255, 0.7)', 
                  fontSize: '0.9rem',
                  marginTop: '5px'
                }}>
                  Time remaining to load crypto
                </div>
              </div>
            )}
            
            <CryptoContainer isLoaded={cryptoLoaded || player2HasPaid}>
              <CryptoAmount>${normalizedData.price_usd || normalizedData.priceUSD || 0}</CryptoAmount>
              <CryptoCurrency>ETH</CryptoCurrency>
              {(cryptoLoaded || player2HasPaid) && (
                <SuccessAnimation>
                  ✅
                </SuccessAnimation>
              )}
              {loading && (
                <LoadingOverlay>
                  <LoadingSpinner />
                </LoadingOverlay>
              )}
            </CryptoContainer>
            
            <StatusText isLoaded={cryptoLoaded || player2HasPaid}>
              {cryptoLoaded || player2HasPaid ? '✅ Crypto Loaded' : 
               isCreator ? '⏳ Waiting for joiner to deposit crypto...' :
               '⚡ Load crypto now to join the game!'}
            </StatusText>
            
            {!isCreator && !cryptoLoaded && !loading && (
              <ActionButton 
                className="load"
                onClick={handleLoadCrypto}
                disabled={loading}
                style={{
                  animation: 'pulse 1.5s infinite',
                  fontSize: '1.1rem'
                }}
              >
                Load Crypto Now
              </ActionButton>
            )}
          </AssetSection>
        </ContentGrid>

        {/* 7. Update game status message (around line 750) */}
        <div style={{ 
          textAlign: 'center', 
          marginBottom: '2rem',
          padding: '1rem',
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '0.5rem',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <h3 style={{ color: '#FFD700', margin: '0 0 0.5rem 0' }}>
            Game Status
          </h3>
          <p style={{ color: '#fff', margin: 0 }}>
            {gameReady ? '🎉 Game Ready! Starting...' : 
             nftLoaded && cryptoLoaded ? '🎮 Both assets loaded! Game will start automatically...' :
             isGameOffer ? 
               (isCreator ? '⏳ Waiting for Player 2 to load crypto...' : '⏳ Load your crypto to start the game!') :
               '⏳ Loading assets...'}
          </p>
          {isGameOffer && (
            <p style={{ color: '#00FF41', fontSize: '0.9rem', marginTop: '0.5rem' }}>
              Price: ${normalizedData.price_usd || normalizedData.priceUSD} (accepted offer)
            </p>
          )}
        </div>

        {/* 8. Remove the "Cancel Game" button for game offers since the game is already on-chain */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
          {!gameReady && isCreator && !isGameOffer && (
            <ActionButton 
              className="cancel"
              onClick={handleCancel}
              disabled={loading}
            >
              Cancel Game
            </ActionButton>
          )}
        </div>
      </ModalContent>
    </Modal>
  )
}

export default GameLobby 