import React, { useState, useEffect } from 'react'
import styled from '@emotion/styled'
import { useWallet } from '../contexts/WalletContext'
import { useToast } from '../contexts/ToastContext'
import contractService from '../services/ContractService'
import { PaymentService } from '../services/PaymentService'
import { X, AlertCircle, CheckCircle, Loader } from 'lucide-react'

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
  backdrop-filter: blur(10px);
`

const ModalContent = styled.div`
  background: linear-gradient(135deg, rgba(26, 26, 46, 0.98) 0%, rgba(13, 13, 23, 0.98) 100%);
  border: 1px solid ${props => props.theme.colors.neonBlue};
  border-radius: 1rem;
  padding: 2rem;
  max-width: 500px;
  width: 90%;
  position: relative;
  box-shadow: 0 0 30px ${props => props.theme.colors.neonBlue};
`

const CloseButton = styled.button`
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: transparent;
  border: none;
  color: ${props => props.theme.colors.textPrimary};
  font-size: 1.5rem;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    color: ${props => props.theme.colors.neonPink};
  }
`

const Title = styled.h2`
  color: ${props => props.theme.colors.neonBlue};
  margin-bottom: 1.5rem;
  text-align: center;
  font-size: 1.8rem;
`

const StatusMessage = styled.div`
  padding: 1rem;
  border-radius: 0.5rem;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  
  ${props => props.type === 'error' && `
    background: rgba(255, 20, 147, 0.1);
    border: 1px solid ${props.theme.colors.neonPink};
    color: ${props.theme.colors.neonPink};
  `}
  
  ${props => props.type === 'success' && `
    background: rgba(0, 255, 65, 0.1);
    border: 1px solid ${props.theme.colors.neonGreen};
    color: ${props.theme.colors.neonGreen};
  `}
  
  ${props => props.type === 'info' && `
    background: rgba(0, 191, 255, 0.1);
    border: 1px solid ${props.theme.colors.neonBlue};
    color: ${props.theme.colors.neonBlue};
  `}
`

const Button = styled.button`
  background: linear-gradient(135deg, ${props => props.theme.colors.neonBlue} 0%, ${props => props.theme.colors.neonPurple} 100%);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  
  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(0, 191, 255, 0.4);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`

const RetryInfo = styled.div`
  text-align: center;
  color: ${props => props.theme.colors.textSecondary};
  font-size: 0.9rem;
  margin-top: 0.5rem;
`

export const GameCreateModal = ({ isOpen, onClose, selectedNFT, gameParams, onSuccess }) => {
  const { walletClient, publicClient, address, chainId, isConnected } = useWallet()
  const { showSuccess, showError, showInfo } = useToast()
  const [creating, setCreating] = useState(false)
  const [status, setStatus] = useState(null)
  const [retryCount, setRetryCount] = useState(0)
  const maxRetries = 3

  useEffect(() => {
    if (isOpen) {
      // Initialize contract service when modal opens
      handleInitialize()
    }
  }, [isOpen, chainId])

  // Debug wallet connection
  useEffect(() => {
    if (isOpen) {
      console.log('🔍 GameCreateModal wallet state:', {
        isConnected,
        hasWalletClient: !!walletClient,
        hasPublicClient: !!publicClient,
        address,
        chainId
      })
    }
  }, [isOpen, isConnected, walletClient, publicClient, address, chainId])

  const handleInitialize = async () => {
    try {
      if (chainId && walletClient) {
        await contractService.initializeClients(chainId, walletClient)
        console.log('✅ Contract service initialized')
      }
    } catch (error) {
      console.error('Failed to initialize contract service:', error)
      setStatus({
        type: 'error',
        message: 'Failed to initialize. Please try again.'
      })
    }
  }

  const handleCreateGame = async () => {
    if (!isConnected || !walletClient) {
      setStatus({
        type: 'error',
        message: 'Please connect your wallet first'
      })
      return
    }

    if (!selectedNFT || !gameParams) {
      setStatus({
        type: 'error',
        message: 'Missing game parameters'
      })
      return
    }

    setCreating(true)
    setStatus({
      type: 'info',
      message: 'Approve the transaction in MetaMask...'
    })

    try {
      // Wait a bit for wallet client to be ready
      if (!contractService.chainId || contractService.chainId !== chainId) {
        await contractService.initializeClients(chainId, walletClient)
        // Add small delay for MetaMask
        await new Promise(resolve => setTimeout(resolve, 500))
      }

      const createParams = {
        nftContract: selectedNFT.contractAddress,
        tokenId: selectedNFT.tokenId,
        priceUSD: parseFloat(gameParams.priceUSD),
        acceptedToken: 0, // ETH
        gameType: gameParams.gameType === 'nft-vs-nft' ? 1 : 0,
        authInfo: ''
      }

      console.log('🎮 Creating game with params:', createParams)
      
      const result = await contractService.createGame(createParams)

      if (result.success) {
        setStatus({
          type: 'success',
          message: 'Game created successfully!'
        })
        
        showSuccess('Game created successfully!')
        
        if (onSuccess) {
          onSuccess(result)
        }
        
        setTimeout(() => {
          onClose()
        }, 2000)
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      console.error('Error creating game:', error)
      
      let errorMessage = error.message
      if (errorMessage.includes('User denied') || errorMessage.includes('user rejected')) {
        errorMessage = 'Transaction cancelled'
      }
      
      setStatus({
        type: 'error',
        message: errorMessage
      })
      showError(errorMessage)
    } finally {
      setCreating(false)
    }
  }

  if (!isOpen) return null

  return (
    <Modal onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <CloseButton onClick={onClose}>
          <X />
        </CloseButton>
        
        <Title>Create Game</Title>
        
        {status && (
          <StatusMessage type={status.type}>
            {status.type === 'error' && <AlertCircle size={20} />}
            {status.type === 'success' && <CheckCircle size={20} />}
            {status.type === 'info' && <Loader size={20} className="animate-spin" />}
            {status.message}
          </StatusMessage>
        )}
        
        <div style={{ marginBottom: '1.5rem' }}>
          <h4 style={{ color: '#fff', marginBottom: '0.5rem' }}>Selected NFT</h4>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <img 
              src={selectedNFT?.image} 
              alt={selectedNFT?.name}
              style={{ width: '60px', height: '60px', borderRadius: '0.5rem', objectFit: 'cover' }}
            />
            <div>
              <div style={{ color: '#fff', fontWeight: 'bold' }}>{selectedNFT?.name}</div>
              <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem' }}>{selectedNFT?.collection}</div>
            </div>
          </div>
        </div>
        
        <div style={{ marginBottom: '1.5rem' }}>
          <h4 style={{ color: '#fff', marginBottom: '0.5rem' }}>Game Details</h4>
          <div style={{ color: 'rgba(255,255,255,0.8)' }}>
            <div>Type: {gameParams?.gameType === 'nft-vs-nft' ? 'NFT vs NFT' : 'NFT vs Crypto'}</div>
            <div>Price: ${gameParams?.priceUSD} USD</div>
          </div>
        </div>
        
        <Button 
          onClick={handleCreateGame} 
          disabled={creating}
        >
          {creating ? (
            <>
              <Loader size={20} className="animate-spin" />
              Creating Game...
            </>
          ) : (
            'Create Game'
          )}
        </Button>
        
        {creating && retryCount > 0 && (
          <RetryInfo>
            Retrying... Attempt {retryCount} of {maxRetries}
          </RetryInfo>
        )}
      </ModalContent>
    </Modal>
  )
} 