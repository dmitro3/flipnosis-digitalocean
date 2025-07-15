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

  // When modal opens, check current game state
  useEffect(() => {
    if (isOpen && gameData) {
      checkGameState()
    }
  }, [isOpen, gameData])

  // Listen for game ready events to auto-close modal when game is ready
  useEffect(() => {
    const handleGameReady = (event) => {
      console.log('🎮 Game ready event received:', event.detail)
      
      // Auto-close modal when game is ready for both players
      if (event.detail.type === 'game_ready' || event.detail.type === 'player_joined') {
        console.log('🎮 Game ready message received, transporting players immediately')
        if (onGameReady) {
          onGameReady(normalizedData.id || normalizedData.id)
        }
      }
    }

    // Add event listener to window for game ready events
    window.addEventListener('gameReady', handleGameReady)
    
    return () => {
      window.removeEventListener('gameReady', handleGameReady)
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
      
      // Join the game with crypto payment
      const result = await contractService.joinGame({
        gameId: gameId,
        priceUSD: priceUSD
      })
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to join game')
      }
      
      setCryptoLoaded(true)
      showSuccess('Crypto loaded successfully! Game starting...')
      
      // Game is now ready to start - immediately transport both players
      setGameReady(true)
      if (onGameReady) {
        // Call onGameReady for both players to exit lobby and enter game
        onGameReady(normalizedData.id || normalizedData.id)
      }
      
    } catch (error) {
      console.error('Error loading crypto:', error)
      showError(error.message || 'Failed to load crypto')
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
              {nftLoaded ? '✅ NFT Loaded' : '⏳ Loading NFT...'}
            </StatusText>
            
            {nftLoaded && (
              <div style={{ textAlign: 'center', color: '#00FF41', fontSize: '0.9rem' }}>
                NFT transferred to contract when game was created
              </div>
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
              {cryptoLoaded ? '✅ Crypto Loaded' : '⏳ Waiting for crypto...'}
            </StatusText>
            
            {!isCreator && !cryptoLoaded && !loading && (
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
             nftLoaded ? '⏳ Waiting for Player 2 to load crypto...' :
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