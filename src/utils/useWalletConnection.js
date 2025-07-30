import { useEffect, useState } from 'react'
import { useAccount, useWalletClient, usePublicClient, useChainId } from 'wagmi'
import { base } from 'wagmi/chains'
import contractService from '../services/ContractService'

export const useWalletConnection = () => {
  const { address, isConnected } = useAccount()
  const { data: walletClient } = useWalletClient()
  const publicClient = usePublicClient()
  const chainId = useChainId()
  
  const [isFullyConnected, setIsFullyConnected] = useState(false)
  const [connectionError, setConnectionError] = useState('')
  const [isContractInitialized, setIsContractInitialized] = useState(false)

  // Check if wallet is fully connected
  useEffect(() => {
    const checkConnection = () => {
      const connected = isConnected && 
                       address && 
                       walletClient && 
                       publicClient && 
                       chainId === base.id
      
      setIsFullyConnected(connected)
      
      if (!connected) {
        setConnectionError('Please connect your wallet to Base network')
        setIsContractInitialized(false)
      } else {
        setConnectionError('')
      }
    }

    checkConnection()
  }, [isConnected, address, walletClient, publicClient, chainId])

  // Initialize contract service when wallet is fully connected
  useEffect(() => {
    if (!isFullyConnected || !walletClient || !chainId) {
      setIsContractInitialized(false)
      return
    }

    const initializeContract = async () => {
      try {
        console.log('🔧 Initializing contract service from useWalletConnection...')
        await contractService.initialize(walletClient)
        console.log('✅ Contract service initialized successfully')
        setIsContractInitialized(true)
      } catch (error) {
        console.error('❌ Failed to initialize contract service:', error)
        setConnectionError('Failed to connect to smart contract. Please refresh and try again.')
        setIsContractInitialized(false)
      }
    }

    initializeContract()
  }, [isFullyConnected, walletClient, chainId])

  return {
    address,
    isConnected,
    isFullyConnected,
    connectionError,
    walletClient,
    publicClient,
    chainId,
    isContractInitialized
  }
} 