import React, { useState, useEffect } from 'react'
import styled from '@emotion/styled'
import { useWallet } from '../contexts/WalletContext'
import { useToast } from '../contexts/ToastContext'
import contractService from '../services/ContractService'
import { Button, LoadingSpinner } from '../styles/components'
import { ethers } from 'ethers'
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

const LoadingOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(5px);
`

const StatusText = styled.div`
  font-size: 1.1rem;
  font-weight: 600;
  color: ${props => props.isLoaded ? props.theme.colors.neonGreen : props.theme.colors.textPrimary};
  text-align: center;
`

const PlayerInfo = styled.div`
  text-align: center;
  
  h3 {
    color: ${props => props.theme.colors.neonBlue};
    margin: 0 0 0.5rem 0;
    font-size: 1.2rem;
  }
  
  p {
    color: ${props => props.theme.colors.textSecondary};
    font-size: 0.9rem;
    margin: 0;
  }
`

const ActionButton = styled(Button)`
  width: 100%;
  padding: 1rem;
  font-size: 1rem;
  font-weight: bold;
  
  &.load {
    background: linear-gradient(45deg, #00FF41, #39FF14);
    color: #000;
  }
  
  &.cancel {
    background: transparent;
    border: 1px solid ${props => props.theme.colors.statusError};
    color: ${props => props.theme.colors.statusError};
    
    &:hover {
      background: rgba(255, 68, 68, 0.1);
    }
  }
`

const SuccessAnimation = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 4rem;
  animation: successPulse 0.6s ease-out;
  
  @keyframes successPulse {
    0% {
      transform: translate(-50%, -50%) scale(0);
      opacity: 0;
    }
    50% {
      transform: translate(-50%, -50%) scale(1.2);
      opacity: 1;
    }
    100% {
      transform: translate(-50%, -50%) scale(1);
      opacity: 1;
    }
  }
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

const CoinImageContainer = styled.div`
  width: 60px;
  height: 60px;
  border-radius: 0.5rem;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.2);
  position: relative;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    transform: scale(1.1);
    border-color: rgba(255, 255, 0, 0.5);
    box-shadow: 0 0 20px rgba(255, 255, 0, 0.3);
    z-index: 10;
    animation: coinGlow 1.5s ease-in-out infinite;
  }
  
  @keyframes coinGlow {
    0%, 100% {
      box-shadow: 0 0 20px rgba(255, 255, 0, 0.3);
    }
    50% {
      box-shadow: 0 0 30px rgba(255, 255, 0, 0.6);
    }
  }
`

const CoinImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: all 0.3s ease;
  
  ${CoinImageContainer}:hover & {
    transform: scale(1.2);
    filter: brightness(1.1) contrast(1.1);
  }
`

const AssetLoadingModal = ({ 
  isOpen, 
  onClose, 
  gameData, 
  onGameReady,
  isCreator 
}) => {
  const { address, isFullyConnected, walletClient, publicClient } = useWallet()
  const { showSuccess, showError, showInfo } = useToast()
  
  const [nftLoaded, setNftLoaded] = useState(false)
  const [cryptoLoaded, setCryptoLoaded] = useState(false)
  const [isLoadingNFT, setIsLoadingNFT] = useState(false)
  const [isLoadingCrypto, setIsLoadingCrypto] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)
  const [socket, setSocket] = useState(null)
  
  // Check if contract service is properly initialized
  const isContractReady = () => {
    return isFullyConnected && walletClient && contractService.isInitialized()
  }

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
          handleWithdraw()
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
    
    // Check wallet connection and contract initialization
    if (!isFullyConnected || !walletClient) {
      showError('Please connect your wallet to load NFT')
      return
    }
    
    if (!contractService.isInitialized()) {
      showError('Smart contract not connected. Please refresh and try again.')
      return
    }
    
    setIsLoadingNFT(true)
    try {
      // Approve NFT transfer to game contract using the new walletClient
      const nftContract = {
        address: gameData.nftContract,
        abi: ['function approve(address to, uint256 tokenId)']
      }
      
      showInfo('Approving NFT transfer...')
      
      // Use walletClient.writeContract instead of ethers
      const approveHash = await walletClient.writeContract({
        address: gameData.nftContract,
        abi: ['function approve(address to, uint256 tokenId)'],
        functionName: 'approve',
        args: [contractService.contractAddress, BigInt(gameData.tokenId)]
      })
      
      // Wait for confirmation
      const receipt = await publicClient.waitForTransactionReceipt({ 
        hash: approveHash,
        confirmations: 1 
      })
      
      showInfo('Depositing NFT into game...')
      const result = await contractService.depositNFTForGame(
        gameData.gameId,
        gameData.nftContract,
        gameData.tokenId
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
    
    // Check wallet connection and contract initialization
    if (!isFullyConnected || !walletClient) {
      showError('Please connect your wallet to load payment')
      return
    }
    
    if (!contractService.isInitialized()) {
      showError('Smart contract not connected. Please refresh and try again.')
      return
    }
    
    setIsLoadingCrypto(true)
    try {
      showInfo('Sending payment...')
      
      // Calculate amount in ETH
      const priceInETH = await contractService.getETHAmount(gameData.priceUSD)
      
      const result = await contractService.depositCryptoForGame(
        gameData.gameId,
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
  
  // Cancel game and withdraw assets
  const handleCancel = async () => {
    // Check wallet connection and contract initialization
    if (!isFullyConnected || !walletClient) {
      showError('Please connect your wallet to cancel game')
      return
    }
    
    if (!contractService.isInitialized()) {
      showError('Smart contract not connected. Please refresh and try again.')
      return
    }
    
    setIsCancelling(true)
    try {
      const result = await contractService.cancelGameWithRefund(gameData.gameId, address)
      
      if (result.success) {
        showSuccess('Game cancelled. Assets will be returned.')
        
        // Notify other player
        socket?.send(JSON.stringify({
          type: 'game_cancelled',
          gameId: gameData.gameId,
          cancelledBy: address
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
  
  // Withdraw assets if game was cancelled
  const handleWithdraw = async () => {
    try {
      if (nftLoaded && isCreator) {
        showInfo('Withdrawing NFT...')
        await contractService.withdrawNFT(gameData.nftContract, gameData.tokenId)
      }
      
      if (cryptoLoaded && !isCreator) {
        showInfo('Withdrawing payment...')
        await contractService.withdrawETH()
      }
      
      showSuccess('Assets withdrawn successfully')
      onClose()
    } catch (error) {
      console.error('Failed to withdraw:', error)
      showError('Failed to withdraw: ' + error.message)
    }
  }
  
  if (!isOpen || !gameData) return null
  
  return (
    <Modal>
      <ModalContent>
        <Header>
          <h2>Load Assets to Start Game</h2>
          <p>Both players must load their assets before the game can begin</p>
        </Header>
        
        <ContentGrid>
          {/* Player 1 - NFT */}
          <AssetSection>
            <PlayerInfo>
              <h3>Player 1 (Creator)</h3>
              <p>{gameData.creator.slice(0, 6)}...{gameData.creator.slice(-4)}</p>
            </PlayerInfo>
            
            <NFTImageContainer isLoaded={nftLoaded}>
              <NFTImage 
                src={gameData.nftImage} 
                alt={gameData.nftName}
                onError={(e) => {
                  e.target.src = '/placeholder-nft.svg'
                }}
              />
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
              <CryptoAmount>${gameData.priceUSD}</CryptoAmount>
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