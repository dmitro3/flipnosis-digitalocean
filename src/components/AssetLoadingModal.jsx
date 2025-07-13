import React, { useState, useEffect } from 'react'
import styled from '@emotion/styled'
import { useWallet } from '../contexts/WalletContext'
import { useToast } from '../contexts/ToastContext'
import contractService from '../services/ContractService'

const Modal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(5px);
`

const ModalContent = styled.div`
  background: linear-gradient(135deg, rgba(0, 0, 0, 0.9), rgba(20, 20, 20, 0.95));
  border: 1px solid rgba(0, 255, 65, 0.3);
  border-radius: 1rem;
  padding: 2rem;
  max-width: 600px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 0 30px rgba(0, 255, 65, 0.2);
`

const NeonText = styled.h2`
  color: #00FF41;
  text-shadow: 0 0 10px #00FF41;
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
`

const AssetContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2rem;
  margin: 2rem 0;
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 1rem;
  }
`

const AssetBox = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border: 2px solid ${props => props.loaded ? '#00FF41' : 'rgba(255, 255, 255, 0.2)'};
  border-radius: 1rem;
  padding: 1.5rem;
  text-align: center;
  min-width: 150px;
  transition: all 0.3s ease;
  
  ${props => props.loaded && `
    box-shadow: 0 0 20px rgba(0, 255, 65, 0.3);
  `}
`

const AssetImage = styled.img`
  width: 80px;
  height: 80px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.3);
  margin-bottom: 1rem;
  opacity: ${props => props.loaded ? 1 : 0.5};
  transition: all 0.3s ease;
`

const StatusText = styled.div`
  color: ${props => props.success ? '#00FF41' : 'rgba(255, 255, 255, 0.7)'};
  font-weight: 600;
  margin: 0.5rem 0;
`

const VSText = styled.div`
  color: #FF1493;
  font-size: 1.5rem;
  font-weight: bold;
  text-shadow: 0 0 10px #FF1493;
`

const LoadButton = styled.button`
  background: linear-gradient(135deg, #00FF41, #00CC33);
  border: none;
  color: black;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 1rem;
  
  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(0, 255, 65, 0.3);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`

const LoadingSpinner = styled.div`
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top: 2px solid #00FF41;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto;
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`

const CoinDisplay = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-top: 1rem;
`

const CoinImage = styled.img`
  width: 50px;
  height: 50px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.3);
`

const AssetLoadingModal = ({ gameData, onGameReady, onClose }) => {
  const { address, walletClient } = useWallet()
  const { showSuccess, showError, showInfo } = useToast()
  
  const [nftLoaded, setNftLoaded] = useState(false)
  const [cryptoLoaded, setCryptoLoaded] = useState(false)
  const [loading, setLoading] = useState(false)
  const [gameStarted, setGameStarted] = useState(false)
  
  const isCreator = gameData.listing?.creator === address
  const isJoiner = gameData.offer?.offerer_address === address
  
  // Load NFT (creator)
  const handleLoadNFT = async () => {
    if (!isCreator || nftLoaded) return
    
    try {
      setLoading(true)
      showInfo('Approving NFT for game...')
      
      const approvalResult = await contractService.approveNFT(
        gameData.listing.nft_contract,
        gameData.listing.nft_token_id
      )
      
      if (!approvalResult.success) {
        throw new Error(approvalResult.error)
      }
      
      setNftLoaded(true)
      showSuccess('NFT ready!')
      
      // Check if both assets are ready
      checkGameReady()
    } catch (error) {
      showError('Failed to approve NFT: ' + error.message)
    } finally {
      setLoading(false)
    }
  }
  
  // Load Crypto (joiner)
  const handleLoadCrypto = async () => {
    if (!isJoiner || cryptoLoaded) return
    
    try {
      setLoading(true)
      showInfo('Preparing payment...')
      
      // Just mark as ready - actual payment will happen when game starts
      setCryptoLoaded(true)
      showSuccess('Payment ready!')
      
      // Check if both assets are ready
      checkGameReady()
    } catch (error) {
      showError('Failed to prepare payment: ' + error.message)
    } finally {
      setLoading(false)
    }
  }
  
  // Check if both assets are ready and start game
  const checkGameReady = async () => {
    // Need to check the state after React updates
    setTimeout(async () => {
      const nftReady = isCreator ? nftLoaded : true
      const cryptoReady = isJoiner ? cryptoLoaded : true
      
      if (nftReady && cryptoReady && !gameStarted) {
        setGameStarted(true)
        await startGame()
      }
    }, 100)
  }
  
  // Start the actual game
  const startGame = async () => {
    try {
      showInfo('Starting game on blockchain...')
      
      if (isCreator) {
        // Creator calls createAndStartGame
        const result = await contractService.createAndStartGame({
          opponent: gameData.offer.offerer_address,
          nftContract: gameData.listing.nft_contract,
          tokenId: gameData.listing.nft_token_id,
          priceUSD: gameData.offer.offer_price,
          paymentToken: 0, // ETH
          coinType: gameData.listing.coin?.type || 'default',
          headsImage: gameData.listing.coin?.headsImage || '/coins/plainh.png',
          tailsImage: gameData.listing.coin?.tailsImage || '/coins/plaint.png',
          isCustom: gameData.listing.coin?.isCustom || false
        })
        
        if (result.success) {
          showSuccess('Game started! Redirecting...')
          
          // Update database with contract game ID
          const API_URL = process.env.NODE_ENV === 'production' 
            ? 'https://cryptoflipz2-production.up.railway.app'
            : 'https://cryptoflipz2-production.up.railway.app'
            
          await fetch(`${API_URL}/api/games/${gameData.gameId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contract_game_id: result.gameId,
              status: 'active'
            })
          })
          
          setTimeout(() => {
            onGameReady(gameData.gameId)
          }, 1500)
        } else {
          throw new Error(result.error)
        }
      }
    } catch (error) {
      showError('Failed to start game: ' + error.message)
      setGameStarted(false)
    }
  }
  
  // Auto-load for opponent when creator loads
  useEffect(() => {
    if (!window.socket) return
    
    const handleMessage = (event) => {
      const data = JSON.parse(event.data)
      
      if (data.type === 'asset_loaded' && data.gameId === gameData.gameId) {
        if (data.assetType === 'nft' && !isCreator) {
          setNftLoaded(true)
        } else if (data.assetType === 'crypto' && !isJoiner) {
          setCryptoLoaded(true)
        }
        checkGameReady()
      }
    }
    
    window.socket.addEventListener('message', handleMessage)
    
    return () => {
      window.socket.removeEventListener('message', handleMessage)
    }
  }, [gameData.gameId])
  
  // Notify other player when asset is loaded
  useEffect(() => {
    if (window.socket && nftLoaded && isCreator) {
      window.socket.send(JSON.stringify({
        type: 'asset_loaded',
        gameId: gameData.gameId,
        assetType: 'nft'
      }))
    }
  }, [nftLoaded])
  
  useEffect(() => {
    if (window.socket && cryptoLoaded && isJoiner) {
      window.socket.send(JSON.stringify({
        type: 'asset_loaded',
        gameId: gameData.gameId,
        assetType: 'crypto'
      }))
    }
  }, [cryptoLoaded])
  
  return (
    <Modal onClick={onClose}>
      <ModalContent onClick={e => e.stopPropagation()}>
        <NeonText style={{ textAlign: 'center', marginBottom: '1rem' }}>
          Load Assets to Start Game
        </NeonText>
        
        <p style={{ textAlign: 'center', color: 'rgba(255, 255, 255, 0.7)', marginBottom: '2rem' }}>
          Both players must load their assets before the game can begin
        </p>
        
        <AssetContainer>
          <AssetBox loaded={nftLoaded}>
            <AssetImage 
              src={gameData.listing?.nft_image} 
              alt="NFT"
              loaded={nftLoaded}
            />
            <h3>{gameData.listing?.nft_name}</h3>
            <StatusText success={nftLoaded}>
              {nftLoaded ? '✅ NFT Ready' : 'Waiting for NFT...'}
            </StatusText>
            {isCreator && !nftLoaded && (
              <LoadButton 
                onClick={handleLoadNFT}
                disabled={loading}
              >
                {loading ? <LoadingSpinner /> : 'Approve NFT'}
              </LoadButton>
            )}
          </AssetBox>
          
          <VSText>VS</VSText>
          
          <AssetBox loaded={cryptoLoaded}>
            <AssetImage 
              src="/images/eth-logo.png" 
              alt="ETH"
              loaded={cryptoLoaded}
            />
            <h3>${gameData.offer?.offer_price || gameData.listing?.asking_price}</h3>
            <StatusText success={cryptoLoaded}>
              {cryptoLoaded ? '✅ Payment Ready' : 'Waiting for payment...'}
            </StatusText>
            {isJoiner && !cryptoLoaded && (
              <LoadButton 
                onClick={handleLoadCrypto}
                disabled={loading}
              >
                {loading ? <LoadingSpinner /> : 'Prepare Payment'}
              </LoadButton>
            )}
          </AssetBox>
        </AssetContainer>
        
        {gameData.listing?.coin && (
          <div style={{ textAlign: 'center', marginTop: '2rem' }}>
            <p style={{ color: 'rgba(255, 255, 255, 0.7)', marginBottom: '0.5rem' }}>
              Game Coin:
            </p>
            <CoinDisplay>
              <CoinImage src={gameData.listing.coin.headsImage} alt="Heads" />
              <CoinImage src={gameData.listing.coin.tailsImage} alt="Tails" />
            </CoinDisplay>
          </div>
        )}
        
        {nftLoaded && cryptoLoaded && (
          <div style={{ textAlign: 'center', marginTop: '2rem' }}>
            <LoadingSpinner />
            <p style={{ color: '#00FF41', marginTop: '1rem' }}>
              Starting game...
            </p>
          </div>
        )}
      </ModalContent>
    </Modal>
  )
}

export default AssetLoadingModal 