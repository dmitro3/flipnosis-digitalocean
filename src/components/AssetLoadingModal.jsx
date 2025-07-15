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

const AssetLoadingModal = ({ 
  isOpen, 
  onClose, 
  gameData, 
  onGameReady,
  isCreator 
}) => {
  const { address, walletClient, publicClient } = useWallet()
  const { isFullyConnected, isContractInitialized } = useWalletConnection()
  const { showSuccess, showError, showInfo } = useToast()
  
  const [nftLoaded, setNftLoaded] = useState(false)
  const [cryptoLoaded, setCryptoLoaded] = useState(false)
  const [isLoadingNFT, setIsLoadingNFT] = useState(false)
  const [isLoadingCrypto, setIsLoadingCrypto] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)
  const [socket, setSocket] = useState(null)

  // Debug logging
  useEffect(() => {
    if (gameData && address) {
      console.log('🎮 Asset Loading Modal State:', {
        myAddress: address,
        isCreator,
        gameData,
        contractGameId: gameData.contract_game_id,
        isFullyConnected,
        isContractInitialized
      })
    }
  }, [gameData, address, isCreator, isFullyConnected, isContractInitialized])

  // WebSocket connection for real-time updates
  useEffect(() => {
    if (!isOpen || !gameData) return
    
    const ws = new WebSocket(API_CONFIG.WS_URL)
    
    ws.onopen = () => {
      ws.send(JSON.stringify({
        type: 'join_asset_loading',
        gameId: gameData.gameId,
        address
      }))
    }
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      
      switch (data.type) {
        case 'nft_loaded':
          setNftLoaded(true)
          showInfo('NFT loaded by Player 1!')
          checkIfReady()
          break
          
        case 'crypto_loaded':
          setCryptoLoaded(true)
          showInfo('Crypto loaded by Player 2!')
          checkIfReady()
          break
          
        case 'game_cancelled':
          showError('Game cancelled by other player')
          onClose()
          break
      }
    }
    
    setSocket(ws)
    
    return () => {
      ws.close()
    }
  }, [isOpen, gameData])
  
  // Check if both assets are loaded
  const checkIfReady = () => {
    if (nftLoaded && cryptoLoaded) {
      showSuccess('Both assets loaded! Starting game...')
      setTimeout(() => {
        onGameReady(gameData.gameId)
      }, 1500)
    }
  }
  
  // Load NFT (Creator only)
  const handleLoadNFT = async () => {
    if (!isCreator) return
    
    if (!isFullyConnected || !walletClient) {
      showError('Please connect your wallet to load NFT')
      return
    }
    
    if (!isContractInitialized) {
      showError('Smart contract not connected. Please refresh and try again.')
      return
    }
    
    if (!gameData.contract_game_id) {
      showError('Game not found on blockchain. Please refresh and try again.')
      return
    }
    
    setIsLoadingNFT(true)
    try {
      showInfo('Approving NFT transfer...')
      
      // Approve NFT transfer with proper ABI format
      const approveHash = await walletClient.writeContract({
        address: gameData.nft_contract,
        abi: [{
          name: 'approve',
          type: 'function',
          inputs: [
            { name: 'to', type: 'address' },
            { name: 'tokenId', type: 'uint256' }
          ],
          outputs: [],
          stateMutability: 'nonpayable'
        }],
        functionName: 'approve',
        args: [contractService.contractAddress, BigInt(gameData.nft_token_id)]
      })
      
      // Wait for confirmation
      const receipt = await publicClient.waitForTransactionReceipt({ 
        hash: approveHash,
        confirmations: 1 
      })
      
      showInfo('Depositing NFT into game...')
      
      // Deposit NFT using contract game ID
      const result = await contractService.depositNFTForGame(
        gameData.contract_game_id,
        gameData.nft_contract,
        gameData.nft_token_id
      )
      
      if (result.success) {
        setNftLoaded(true)
        showSuccess('NFT successfully loaded!')
        
        // Notify other player
        socket?.send(JSON.stringify({
          type: 'asset_loaded',
          gameId: gameData.gameId,
          assetType: 'nft'
        }))
        
        checkIfReady()
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      console.error('Failed to load NFT:', error)
      showError('Failed to load NFT: ' + error.message)
    } finally {
      setIsLoadingNFT(false)
    }
  }
  
  // Load Crypto (Joiner only)
  const handleLoadCrypto = async () => {
    if (isCreator) return
    
    if (!isFullyConnected || !walletClient) {
      showError('Please connect your wallet to load payment')
      return
    }
    
    if (!isContractInitialized) {
      showError('Smart contract not connected. Please refresh and try again.')
      return
    }
    
    if (!gameData.contract_game_id) {
      showError('Game not found on blockchain. Please refresh and try again.')
      return
    }
    
    setIsLoadingCrypto(true)
    try {
      showInfo('Sending payment...')
      
      // Get ETH amount from contract
      const priceInETH = await contractService.getETHAmount(gameData.price_usd)
      
      // Deposit crypto using contract game ID
      const result = await contractService.depositCryptoForGame(
        gameData.contract_game_id,
        { value: priceInETH }
      )
      
      if (result.success) {
        setCryptoLoaded(true)
        showSuccess('Payment successfully loaded!')
        
        // Notify other player
        socket?.send(JSON.stringify({
          type: 'asset_loaded',
          gameId: gameData.gameId,
          assetType: 'crypto'
        }))
        
        checkIfReady()
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      console.error('Failed to load crypto:', error)
      showError('Failed to load payment: ' + error.message)
    } finally {
      setIsLoadingCrypto(false)
    }
  }
  
  // Cancel game
  const handleCancel = async () => {
    if (!isFullyConnected || !walletClient) {
      showError('Please connect your wallet to cancel game')
      return
    }
    
    if (!isContractInitialized) {
      showError('Smart contract not connected. Please refresh and try again.')
      return
    }
    
    if (!gameData.contract_game_id) {
      showError('Game not found on blockchain')
      return
    }
    
    setIsCancelling(true)
    try {
      const result = await contractService.cancelGameWithRefund(gameData.contract_game_id)
      
      if (result.success) {
        showSuccess('Game cancelled. Assets will be returned.')
        socket?.send(JSON.stringify({
          type: 'game_cancelled',
          gameId: gameData.gameId
        }))
        onClose()
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      console.error('Failed to cancel game:', error)
      showError('Failed to cancel game: ' + error.message)
    } finally {
      setIsCancelling(false)
    }
  }
  
  if (!isOpen) return null
  
  return (
    <Modal onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <Header>
          <h2>Load Assets to Start Game</h2>
          <p>Both players must load their assets before the game can begin</p>
        </Header>
        
        <ContentGrid>
          {/* Player 1 - NFT */}
          <AssetSection>
            <PlayerInfo>
              <h3>Player 1 (Creator)</h3>
              <p>{gameData.creator?.slice(0, 6)}...{gameData.creator?.slice(-4)}</p>
            </PlayerInfo>
            
            <NFTImageContainer isLoaded={nftLoaded}>
              <NFTImage src={gameData.nft_image} alt={gameData.nft_name} />
              {isLoadingNFT && (
                <LoadingOverlay>
                  <LoadingSpinner />
                </LoadingOverlay>
              )}
              {nftLoaded && (
                <SuccessAnimation>✅</SuccessAnimation>
              )}
            </NFTImageContainer>
            
            <StatusText isLoaded={nftLoaded}>
              {nftLoaded ? 'NFT Loaded!' : isCreator ? 'Load your NFT' : 'Waiting for NFT...'}
            </StatusText>
            
            {isCreator && !nftLoaded && (
              <ActionButton 
                className="load"
                onClick={handleLoadNFT}
                disabled={isLoadingNFT}
              >
                {isLoadingNFT ? 'Loading NFT...' : 'Load NFT'}
              </ActionButton>
            )}
          </AssetSection>
          
          <Divider />
          
          {/* Player 2 - Crypto */}
          <AssetSection>
            <PlayerInfo>
              <h3>Player 2 (Joiner)</h3>
              <p>{gameData.joiner?.slice(0, 6)}...{gameData.joiner?.slice(-4)}</p>
            </PlayerInfo>
            
            <CryptoContainer isLoaded={cryptoLoaded}>
              <CryptoAmount>${gameData.price_usd}</CryptoAmount>
              <CryptoCurrency>USD in ETH</CryptoCurrency>
              {isLoadingCrypto && (
                <LoadingOverlay>
                  <LoadingSpinner />
                </LoadingOverlay>
              )}
              {cryptoLoaded && (
                <SuccessAnimation>✅</SuccessAnimation>
              )}
            </CryptoContainer>
            
            <StatusText isLoaded={cryptoLoaded}>
              {cryptoLoaded ? 'Payment Loaded!' : !isCreator ? 'Load your payment' : 'Waiting for payment...'}
            </StatusText>
            
            {!isCreator && !cryptoLoaded && (
              <ActionButton 
                className="load"
                onClick={handleLoadCrypto}
                disabled={isLoadingCrypto}
              >
                {isLoadingCrypto ? 'Loading Payment...' : 'Load Payment'}
              </ActionButton>
            )}
          </AssetSection>
        </ContentGrid>
        
        {/* Cancel button */}
        {(!nftLoaded || !cryptoLoaded) && (
          <ActionButton 
            className="cancel"
            onClick={handleCancel}
            disabled={isCancelling}
          >
            {isCancelling ? 'Cancelling...' : 'Cancel Game'}
          </ActionButton>
        )}
      </ModalContent>
    </Modal>
  )
}

export default AssetLoadingModal 