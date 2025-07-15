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

const GameLobby = ({ 
  isOpen, 
  gameData, 
  onGameReady,
  isCreator 
}) => {
  // CLAUDE OPUS PATCH: Normalize gameData props for consistent usage
  const normalizedData = {
    id: gameData?.id || gameData?.gameId,
    contract_game_id: gameData?.contract_game_id,
    creator: gameData?.creator,
    joiner: gameData?.joiner,
    nft_contract: gameData?.nft_contract || gameData?.nftContract,
    nft_token_id: gameData?.nft_token_id || gameData?.tokenId,
    nft_name: gameData?.nft_name || gameData?.nftName,
    nft_image: gameData?.nft_image || gameData?.nftImage,
    price_usd: gameData?.price_usd || gameData?.priceUSD,
    coin: gameData?.coin
  }
  
  console.log('🎮 AssetLoadingModal - Normalized data:', {
    id: normalizedData.id,
    contract_game_id: normalizedData.contract_game_id,
    creator: normalizedData.creator,
    joiner: normalizedData.joiner,
    isCreator
  })
  const { isConnected, address, walletClient, publicClient } = useWallet()
  const { isFullyConnected } = useWalletConnection()
  const { showSuccess, showError, showInfo } = useToast()
  
  const [nftLoaded, setNftLoaded] = useState(false)
  const [cryptoLoaded, setCryptoLoaded] = useState(false)
  const [loading, setLoading] = useState(false)
  const [gameReady, setGameReady] = useState(false)
  const [initializationAttempted, setInitializationAttempted] = useState(false)

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
      if (window.socket && window.socket.readyState === WebSocket.OPEN) {
        console.log('🎮 Joining game room:', normalizedData.id)
        console.log('🎮 WebSocket state:', window.socket.readyState)
        console.log('🎮 WebSocket URL:', window.socket.url)
        
        const joinMessage = {
          type: 'join_game',
          gameId: normalizedData.id,
          address: address || 'anonymous'
        }
        console.log('🎮 Sending join message:', joinMessage)
        window.socket.send(JSON.stringify(joinMessage))
      } else {
        console.warn('⚠️ WebSocket not available for game room joining')
        console.log('🎮 Socket available:', !!window.socket)
        console.log('🎮 Socket state:', window.socket?.readyState)
      }
      
      checkGameState()
    }
  }, [isOpen, gameData])

  // Listen for game ready events to auto-close modal when game is ready
  useEffect(() => {
    console.log('🎮 AssetLoadingModal: Setting up game ready event listener')
    
    const handleGameReady = (event) => {
      console.log('🎮 AssetLoadingModal: Game ready event received:', event.detail)
      console.log('🎮 AssetLoadingModal: Normalized data ID:', normalizedData.id)
      
      // Auto-close modal when game is ready for both players
      if (event.detail.type === 'game_ready' || event.detail.type === 'player_joined') {
        console.log('🎮 AssetLoadingModal: Game ready message received, transporting players immediately')
        if (onGameReady) {
          console.log('🎮 AssetLoadingModal: Calling onGameReady with ID:', normalizedData.id)
          onGameReady(normalizedData.id)
        } else {
          console.log('⚠️ AssetLoadingModal: onGameReady is not available')
        }
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

  // Add this useEffect to listen for both_assets_loaded message
  useEffect(() => {
    const handleBothAssetsLoaded = (event) => {
      const data = event.detail
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
    }
    
    const handleNFTDeposited = (event) => {
      const data = event.detail
      console.log('📡 Received WebSocket message:', data)
      console.log('🎮 Current game ID:', normalizedData.id)
      console.log('📡 Message game ID:', data.gameId)
      
      if (data.type === 'nft_deposited' && data.gameId === normalizedData.id) {
        console.log('🎮 NFT deposited, joiner can now deposit crypto!')
        setNftLoaded(true)
        
        // Update the normalized data with the contract game ID
        if (data.contractGameId) {
          normalizedData.contract_game_id = data.contractGameId
          console.log('✅ Updated contract game ID:', data.contractGameId)
        }
        
        showSuccess('NFT deposited! You can now deposit your crypto.')
      } else {
        console.log('⚠️ Message not for this game or wrong type')
      }
    }
    
    window.addEventListener('websocketMessage', handleBothAssetsLoaded)
    window.addEventListener('websocketMessage', handleNFTDeposited)
    
    return () => {
      window.removeEventListener('websocketMessage', handleBothAssetsLoaded)
      window.removeEventListener('websocketMessage', handleNFTDeposited)
    }
  }, [onGameReady, normalizedData.id])

  const checkGameState = async () => {
    // Handle both contract_game_id (from database) and gameId (from WebSocket)
    const gameId = normalizedData.contract_game_id || normalizedData.id
    if (!gameId) return
    
    try {
      // Check if NFT is already in contract (it should be since Player 1 created the game)
      const contractGame = await contractService.getGameDetails(gameId)
      
      if (contractGame.success && contractGame.game) {
        // NFT is already loaded in contract when game was created
        setNftLoaded(true)
        console.log('✅ NFT already loaded in contract')
        
        // Check if crypto is loaded (game status will be 'joined' if crypto is loaded)
        if (contractGame.game.state === 1) { // GameState.Joined
          setCryptoLoaded(true)
          console.log('✅ Crypto already loaded')
        }
      } else {
        console.log('⚠️ Game not found in contract yet, this is normal for newly created games')
        // For newly created games, assume NFT is loaded (since Player 1 created it)
        setNftLoaded(true)
      }
    } catch (error) {
      console.error('Error checking game state:', error)
      // Don't throw, just log the error and continue
      // For newly created games, assume NFT is loaded
      setNftLoaded(true)
    }
  }

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
      
      // Handle both contract_game_id (from database) and gameId (from WebSocket)
      const gameId = normalizedData.contract_game_id || normalizedData.id
      const priceUSD = normalizedData.price_usd || normalizedData.priceUSD
      
      // Check if this is a game created from an offer (no contract game ID yet)
      if (!normalizedData.contract_game_id || normalizedData.contract_game_id === normalizedData.id) {
        console.log('🎮 Game created from offer, but joiner cannot create blockchain game')
        console.log('🎮 Creator needs to deposit NFT first, then joiner can join')
        
        // For offer-based games, the creator (Player 1) needs to deposit NFT first
        // The joiner (Player 2) cannot create the blockchain game because they don't own the NFT
        showError('The game creator needs to deposit their NFT first. Please wait for them to complete their deposit.')
        return
      }
      
      // Game already exists on blockchain, just join it
      const result = await contractService.joinGame({
        gameId: gameId,
        priceUSD: priceUSD
      })
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to join game')
      }
      
      setCryptoLoaded(true)
      showSuccess('Crypto loaded successfully! Game starting...')
      
      // Game is now ready to start
      setGameReady(true)
      
      // Send WebSocket message to notify both players
      if (window.socket && window.socket.readyState === WebSocket.OPEN) {
        window.socket.send(JSON.stringify({
          type: 'both_assets_loaded',
          gameId: normalizedData.id,
          message: 'Both assets loaded, game ready!'
        }))
      }
      
      // Small delay then transport both players
      setTimeout(() => {
        if (onGameReady) {
          onGameReady(normalizedData.id)
        }
      }, 1000)
      
    } catch (error) {
      console.error('Error loading crypto:', error)
      showError(error.message || 'Failed to load crypto')
    } finally {
      setLoading(false)
    }
  }

  const handleDepositNFT = async () => {
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
      showInfo('Creating blockchain game and depositing NFT...')
      
      const priceUSD = normalizedData.price_usd || normalizedData.priceUSD
      
      // Create blockchain game and deposit NFT
      const createResult = await contractService.createBlockchainGameFromOffer({
        opponent: normalizedData.joiner,
        nftContract: normalizedData.nft_contract || normalizedData.nftContract,
        tokenId: normalizedData.nft_token_id || normalizedData.tokenId,
        priceUSD: priceUSD,
        coinType: normalizedData.coin?.type || 'default',
        headsImage: normalizedData.coin?.headsImage || '',
        tailsImage: normalizedData.coin?.tailsImage || '',
        isCustom: normalizedData.coin?.isCustom || false
      })
      
      if (!createResult.success) {
        throw new Error(createResult.error || 'Failed to create blockchain game')
      }
      
      console.log('✅ Blockchain game created with ID:', createResult.gameId)
      
      // Update the database with the contract game ID
      try {
        const response = await fetch(`${API_CONFIG.BASE_URL}/api/games/${normalizedData.id}/update-contract-id`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contract_game_id: createResult.gameId })
        })
        
        if (!response.ok) {
          console.warn('Failed to update database with contract game ID')
        }
      } catch (dbError) {
        console.error('Database update error:', dbError)
      }
      
      setNftLoaded(true)
      showSuccess('NFT deposited successfully! Blockchain game created.')
      
      // Notify the joiner that they can now deposit crypto
      if (window.socket && window.socket.readyState === WebSocket.OPEN) {
        const message = {
          type: 'nft_deposited',
          gameId: normalizedData.id,
          contractGameId: createResult.gameId,
          message: 'NFT deposited, you can now deposit crypto!'
        }
        console.log('📡 Sending nft_deposited message:', message)
        console.log('📡 WebSocket state:', window.socket.readyState)
        console.log('📡 WebSocket URL:', window.socket.url)
        window.socket.send(JSON.stringify(message))
      } else {
        console.warn('⚠️ WebSocket not available for nft_deposited notification')
        console.log('📡 Socket available:', !!window.socket)
        console.log('📡 Socket state:', window.socket?.readyState)
      }
      
    } catch (error) {
      console.error('Error depositing NFT:', error)
      showError(error.message || 'Failed to deposit NFT')
    } finally {
      setLoading(false)
    }
  }

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
          {/* Player 1 - NFT Section */}
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
              {nftLoaded ? '✅ NFT Loaded' : 
               isCreator && !normalizedData.contract_game_id ? '⏳ Click "Deposit NFT" to start' : 
               '⏳ Waiting for creator to deposit NFT...'}
            </StatusText>
            
            {nftLoaded && (
              <div style={{ textAlign: 'center', color: '#00FF41', fontSize: '0.9rem' }}>
                NFT transferred to contract when game was created
              </div>
            )}
            
            {!nftLoaded && isCreator && !normalizedData.contract_game_id && (
              <ActionButton 
                className="load"
                onClick={handleDepositNFT}
                disabled={loading}
              >
                Deposit NFT
              </ActionButton>
            )}
          </AssetSection>

          <Divider />

          {/* Player 2 - Crypto Section */}
          <AssetSection>
            <PlayerInfo>
              <h3>Player 2 (Joiner)</h3>
              <p>{isCreator ? 'Waiting for opponent...' : 'You'}</p>
            </PlayerInfo>
            
            <CryptoContainer isLoaded={cryptoLoaded}>
              <CryptoAmount>${normalizedData.price_usd || normalizedData.priceUSD || 0}</CryptoAmount>
              <CryptoCurrency>ETH</CryptoCurrency>
              {cryptoLoaded && (
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
            
            <StatusText isLoaded={cryptoLoaded}>
              {cryptoLoaded ? '✅ Crypto Loaded' : 
               !isCreator && !normalizedData.contract_game_id ? '⏳ Waiting for creator to deposit NFT...' : 
               '⏳ Waiting for joiner to deposit crypto...'}
            </StatusText>
            
            {!isCreator && !cryptoLoaded && !loading && normalizedData.contract_game_id && (
              <ActionButton 
                className="load"
                onClick={handleLoadCrypto}
                disabled={loading}
              >
                Load Crypto
              </ActionButton>
            )}
          </AssetSection>
        </ContentGrid>

        {/* Game Status */}
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
             nftLoaded && !normalizedData.contract_game_id ? '⏳ Creator deposited NFT, waiting for joiner...' :
             nftLoaded ? '⏳ Waiting for Player 2 to load crypto...' :
             !normalizedData.contract_game_id ? '⏳ Creator needs to deposit NFT first...' :
             '⏳ Loading assets...'}
          </p>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
          {!gameReady && isCreator && (
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